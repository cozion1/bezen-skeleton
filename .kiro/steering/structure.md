---
inclusion: always
---

# Structure

```
skeleton/            the core — knows nothing about any one app
  core.mjs           createReader(profile) -> { read(text, callModel) }
  prompt.mjs         builds the system + user prompt from a profile
  parse.mjs          turns the model's text into a reading object (tolerant of stray text around the JSON)
  verify.mjs         quote verification (the seatbelt) — pure functions only
  safety.mjs         code-level danger signals (used by profiles that ask for it)
  handler.mjs        makeHandler(profile) -> Netlify function (limits, errors, JSON out)
  ui/reader.js       shared front-end: form, loading state, renders a reading
  ui/reader.css      shared styles (light + dark)
  test/              unit + property-based tests for the core

reply-reader/        app 1 — business replies
  profile.mjs        the profile: what senders protect, output fields, voice of the next message
  index.html         the page
  examples.mjs       3 sample replies for the demo buttons

kid-message/         app 2 — a child's message to a parent or teacher
  profile.mjs
  index.html
  examples.mjs

netlify/functions/   thin wrappers: read-reply.mjs, read-kid.mjs -> makeHandler(profile)
index.html           landing page: what the skeleton is, links to both apps
```

## The skeleton contract

An app is **only** a profile + a page. If an app needs new logic, that logic goes into
`skeleton/` behind a profile option, never into the app folder. Adding a third app
must take one new folder and one new function file — nothing else.
