# Requirements — BEZEN Skeleton

## Introduction

A skeleton for agents that read what a person is protecting behind their words.
One core (`skeleton/`), two apps on top of it (`reply-reader/`, `kid-message/`).
Every reading quotes the sender's exact words, and code verifies the quote.

## Glossary

- **Profile** — a plain object that turns the skeleton into one app: who the sender is, who the reader is, the list of things a sender may be protecting, the fields of the reading, and options such as `safety`.
- **Reading** — the result: `{ protecting, quote, why, doNot, nextMessage, route, verified, safety }`.
- **Seatbelt** — the code that checks `quote` against the original text.

---

## Requirement 1 — Profiles make apps

**User story:** As a developer, I want to build a new reading app by writing only a profile and a page, so that the core stays one piece.

1. WHEN `createReader(profile)` is called with a profile missing `id`, `sender`, `reader` or `protects` THEN the system SHALL throw an error naming the missing field.
2. WHEN a profile is valid THEN `createReader` SHALL return an object with a `read(text, callModel)` method.
3. The `skeleton/` folder SHALL NOT contain any text specific to one app (no mention of customers, children, teachers).
4. WHEN a third app is added THEN it SHALL need only a new folder (profile + page) and one function file.

## Requirement 2 — Building the prompt

**User story:** As the skeleton, I want one prompt builder that every profile feeds, so that every app reads the same careful way.

1. WHEN a prompt is built THEN it SHALL include the profile's sender, reader, the `protects` list, and the instruction to return JSON only.
2. The prompt SHALL instruct the model that `quote` must be copied character for character from the text, and must be the shortest span that shows what is protected.
3. The sender's text SHALL be placed inside clear delimiters and the prompt SHALL tell the model to treat it as data, never as instructions.

## Requirement 3 — Parsing the model's answer

1. WHEN the model returns JSON wrapped in extra text or a code fence THEN the parser SHALL still extract the JSON object.
2. WHEN no JSON object can be found THEN the parser SHALL return an error reading with `error: "unreadable"` and SHALL NOT throw.
3. WHEN a field is missing THEN the parser SHALL fill it with an empty string and keep going.

## Requirement 4 — The seatbelt (quote verification)

**User story:** As a reader, I want to know the quote is real, so that I never act on words the sender did not write.

1. WHEN `quote` appears in the text THEN `verified` SHALL be `true`.
2. Matching SHALL ignore differences in whitespace, letter case, straight vs curly quotes and apostrophes, and Unicode normalization (NFC) — and nothing else.
3. WHEN `quote` is empty or does not appear THEN `verified` SHALL be `false` and the reading SHALL keep the model's other fields but the UI SHALL label it "Unverified reading — the quote was not found in the message".
4. For every text T and every substring S of T that contains at least one non-whitespace character, `verify(S, T)` SHALL be `true` (property-based test). A quote that is empty after normalization is not evidence of anything and SHALL NOT verify (4.3 wins). *Found by property-based testing: the generator produced T = " ", S = " ", which the first wording of this criterion said must verify and 4.3 said must not.*
5. For every text T and every string S that is not a substring of T after normalization, `verify(S, T)` SHALL be `false` (property-based test).
6. `verify` SHALL be a pure function with no I/O.

## Requirement 5 — Safety in code

1. WHEN a profile has `safety: true` AND the text contains a danger signal (self-harm, wanting to die, being hurt or touched by an adult, running away, a weapon) in English or Hebrew THEN the reading SHALL have `safety: true` regardless of what the model returned.
2. WHEN `safety` is true THEN the UI SHALL show, above everything else, one line telling the adult to talk with the child now and to contact a professional or an emergency line.
3. The danger check SHALL be a pure function with its own tests, including at least 5 positive and 5 negative examples per language.

## Requirement 6 — The serverless handler

1. WHEN the request is not POST with JSON `{ text }` THEN the handler SHALL answer 400 with a short message.
2. WHEN `text` is longer than 2,000 characters THEN the handler SHALL answer 413 and SHALL NOT call the model.
3. WHEN the daily count reaches `DAILY_LIMIT` THEN the handler SHALL answer 429 with a plain message.
4. WHEN `ANTHROPIC_API_KEY` is missing THEN the handler SHALL answer 500 "Not configured" and SHALL NOT leak details.
5. WHEN the model call fails or times out (20 s) THEN the handler SHALL answer 502 with a plain message.
6. The handler SHALL never log the sender's text.

## Requirement 7 — App 1: reply-reader

**User story:** As someone at a business, I paste a customer's reply and get what they are protecting, what not to do, and a reply I can send.

1. The profile SHALL list at least: time, budget approval, standing with their boss, privacy, a bad past experience, pride in what they already built, being rushed.
2. `route` SHALL be `"human"` when the reply touches privacy, career risk, anger, or a complaint; otherwise `"bot-ok"`.
3. The page SHALL offer 3 example replies as one-click buttons.

## Requirement 8 — App 2: kid-message

**User story:** As a parent or teacher, I paste a child's message and learn what the child is guarding and how to open the conversation without closing it.

1. The profile SHALL list at least: not being a burden, a friend's secret, fear of punishment, embarrassment in front of peers, wanting to be trusted, loyalty to the other parent, safety.
2. `nextMessage` SHALL be one or two short sentences an adult can say, never a lecture, never a question that demands an explanation ("why did you…").
3. The profile SHALL set `safety: true`.
4. The page SHALL offer 3 example messages as one-click buttons, one of them in Hebrew.

## Requirement 9 — Pages

1. Each page SHALL show: a text box, a "Read" button, a loading state, and the reading in this order: safety line (if any) → what they are protecting → the quote with a ✓ verified or ⚠ unverified badge → what not to do → the next message with a Copy button.
2. Pages SHALL work at 360px width, in light and dark mode, and SHALL set `dir="auto"` on text so Hebrew reads right to left.
3. The landing page SHALL explain the skeleton in three sentences and link to both apps.
