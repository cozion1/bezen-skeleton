# Implementation Plan — BEZEN Skeleton

## 1. Repository scaffold

- [ ] 1.1 Create the directory tree: `skeleton/`, `skeleton/test/`, `skeleton/ui/`, `reply-reader/`, `kid-message/`, `netlify/functions/`
- [ ] 1.2 Add `package.json` with `"type": "module"`, a `test` script (`node --test skeleton/test/**`), and `fast-check` as the sole dev dependency
- [ ] 1.3 Add `.gitignore` (node_modules, .env) and a `.env.example` with `ANTHROPIC_API_KEY=` and `DAILY_LIMIT=`
- [ ] 1.4 Add `netlify.toml` pointing functions to `netlify/functions/` and setting Node 24 as the runtime

*Covers: Req 1.4 (adding an app needs only one folder + one function file — the scaffold makes that true from the start)*

---

## 2. `skeleton/verify.mjs` — the seatbelt

- [ ] 2.1 Implement `normalize(s)`: NFC → collapse whitespace → lowercase → straighten quotes/apostrophes
- [ ] 2.2 Implement `verify(quote, text)`: return false on empty quote; return `normalize(quote)` ⊆ `normalize(text)`
- [ ] 2.3 Write `skeleton/test/verify.test.mjs`: ≥ 5 positive hand-written cases, ≥ 5 negative hand-written cases, and the four property-based tests (every substring verifies; case/whitespace/quote transparency; non-substrings do not verify; normalization is idempotent)
- [ ] 2.4 Run tests and confirm all pass

*Covers: Req 4.1, 4.2, 4.3, 4.4, 4.5, 4.6*

---

## 3. `skeleton/safety.mjs` — danger check

- [ ] 3.1 Implement `checkSafety(text)` as a pure function using keyword/pattern lists for English and Hebrew danger signals (self-harm, wanting to die, being hurt or touched by an adult, running away, a weapon)
- [ ] 3.2 Write `skeleton/test/safety.test.mjs`: ≥ 5 positive English examples, ≥ 5 negative English examples, ≥ 5 positive Hebrew examples, ≥ 5 negative Hebrew examples
- [ ] 3.3 Run tests and confirm all pass

*Covers: Req 5.1, 5.3*

---

## 4. `skeleton/parse.mjs` — tolerant parser

- [ ] 4.1 Implement `parseReading(raw)`: strip markdown fences, extract the first `{…}` JSON object with a regex, `JSON.parse`, fill missing fields with `""`; on total failure return `{ error: "unreadable", protecting: "", quote: "", why: "", doNot: "", nextMessage: "", route: "", verified: false, safety: false }`
- [ ] 4.2 Write `skeleton/test/parse.test.mjs`: clean JSON; JSON after prose; JSON inside a ` ```json ` fence; garbled input returns `error: "unreadable"` without throwing; each field missing individually fills with `""`
- [ ] 4.3 Add the property-based test: `parseReading` never throws for any arbitrary string input
- [ ] 4.4 Run tests and confirm all pass

*Covers: Req 3.1, 3.2, 3.3*

---

## 5. `skeleton/prompt.mjs` — prompt builder

- [ ] 5.1 Implement `buildPrompt(profile, text)` returning `{ system, user }` following the layout in the design (sender/reader/protects bullet list, JSON shape instruction, data delimiter rule, optional safety clause, optional voice guidance)
- [ ] 5.2 Wrap `text` in `<message>…</message>` in the user message and add the instruction not to treat it as commands
- [ ] 5.3 Write `skeleton/test/prompt.test.mjs`: system prompt contains sender; contains reader; contains each `protects` item; contains the `<message>` delimiter; safety clause present iff `profile.safety === true`; voice line present iff `profile.voice` is set
- [ ] 5.4 Run tests and confirm all pass

*Covers: Req 2.1, 2.2, 2.3*

---

## 6. `skeleton/core.mjs` — orchestrator

- [ ] 6.1 Implement `createReader(profile)`: validate required fields (`id`, `sender`, `reader`, `protects`) throwing a named error for each missing one; return `{ read }` 
- [ ] 6.2 Implement `read(text, callModel)`: call `buildPrompt` → `callModel` → `parseReading` → `verify` → `checkSafety` (if `profile.safety`) → apply `routeRules` → return the Reading
- [ ] 6.3 Write `skeleton/test/core.test.mjs`: throws on missing `id`; throws on missing `sender`; throws on missing `reader`; throws on missing `protects`; valid profile returns object with `read`; `read` returns verified reading with fake `callModel`; `read` sets `safety` from code even when model returns `false`; `routeRules` correctly override `route`
- [ ] 6.4 Run tests and confirm all pass

*Covers: Req 1.1, 1.2, 1.3, 4.1, 5.1*

---

## 7. `skeleton/handler.mjs` — serverless wrapper

- [ ] 7.1 Implement `makeCallModel(apiKey, timeoutMs)`: call Anthropic Messages API with `fetch`, model `claude-sonnet-5-5`, `AbortSignal.timeout(timeoutMs)`; throw on non-2xx or timeout
- [ ] 7.2 Implement `makeHandler(profile)`: validate method (400), parse body (400), check length > 2000 (413), check daily counter ≥ DAILY_LIMIT (429), check env key (500), call `reader.read` with `makeCallModel`, catch model errors (502); never log `text`; return `Response` JSON
- [ ] 7.3 Implement the daily counter: in-memory integer reset at midnight UTC by comparing the UTC date string on each request
- [ ] 7.4 Write `skeleton/test/handler.test.mjs`: 400 on GET; 400 on missing text; 413 on 2001-char input; 429 after limit exceeded; 500 with no API key; 502 when `callModel` rejects; 200 with valid input and fake `callModel`
- [ ] 7.5 Run tests and confirm all pass

*Covers: Req 6.1, 6.2, 6.3, 6.4, 6.5, 6.6*

---

## 8. `reply-reader/` — App 1 profile and examples

- [ ] 8.1 Write `reply-reader/profile.mjs` with all required `protects` items (time, budget approval, standing with boss, privacy, bad past experience, pride in what they built, being rushed) and `routeRules` for privacy/career risk/anger/complaint → `"human"`
- [ ] 8.2 Write `reply-reader/examples.mjs` exporting an array of 3 example reply objects (each with a `label` and `text`)
- [ ] 8.3 Create `netlify/functions/read-reply.mjs` importing the profile and calling `makeHandler(profile)`

*Covers: Req 7.1, 7.2, 7.3, 1.4*

---

## 9. `kid-message/` — App 2 profile and examples

- [ ] 9.1 Write `kid-message/profile.mjs` with all required `protects` items, `safety: true`, and `voice` guidance (short sentences an adult can say; no lectures; no "why did you…" questions)
- [ ] 9.2 Write `kid-message/examples.mjs` exporting an array of 3 example message objects, with one example in Hebrew
- [ ] 9.3 Create `netlify/functions/read-kid.mjs` importing the profile and calling `makeHandler(profile)`

*Covers: Req 8.1, 8.2, 8.3, 8.4, 1.4*

---

## 10. `skeleton/ui/` — shared front-end module

- [ ] 10.1 Write `skeleton/ui/reader.js` exporting `initReader({ endpoint, examples })`: renders example buttons, handles form submit, shows loading state, calls the endpoint, and renders the Reading in the required order (safety line → protecting → quote with verified badge → doNot → nextMessage with Copy button)
- [ ] 10.2 Implement the unverified label: if `reading.verified === false` show "⚠ Unverified reading — the quote was not found in the message" instead of the ✓ badge
- [ ] 10.3 Implement the safety banner: if `reading.safety === true` render one plain line above everything telling the adult to talk with the child now and contact a professional
- [ ] 10.4 Set `dir="auto"` on all user-facing text containers so Hebrew reads right to left
- [ ] 10.5 Write `skeleton/ui/reader.css`: mobile-first layout working at 360px width, light mode and `@media (prefers-color-scheme: dark)` dark mode

*Covers: Req 9.1, 9.2, 4.3, 5.2*

---

## 11. App pages — `reply-reader/index.html` and `kid-message/index.html`

- [ ] 11.1 Write `reply-reader/index.html`: `<script>` loading `reader.js`, calling `initReader` with the reply-reader endpoint and examples; no other logic
- [ ] 11.2 Write `kid-message/index.html`: same pattern with the kid-message endpoint and examples
- [ ] 11.3 Verify both pages render correctly at 360px (browser devtools) and that dark mode applies
- [ ] 11.4 Verify the Hebrew example renders right-to-left

*Covers: Req 7.3, 8.4, 9.1, 9.2*

---

## 12. Landing page and README

- [ ] 12.1 Write root `index.html`: three sentences explaining the skeleton (BEZEN reads what a person is protecting; the code — not the model — checks every quote; one core, any number of apps), links to both apps
- [ ] 12.2 Write `README.md`: what the project is, how to run locally (`netlify dev`), how to set `ANTHROPIC_API_KEY`, how to add a third app (new folder + one function file), and a link to the spec

*Covers: Req 9.3, 1.4*
