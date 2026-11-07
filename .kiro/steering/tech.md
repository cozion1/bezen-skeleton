---
inclusion: always
---

# Tech

- Runtime: Node.js 24, plain JavaScript ES modules (`.mjs`). No TypeScript, no build step, no framework.
- Front end: one static `index.html` per app, vanilla JS and CSS inline. Must work on a phone (360px wide) and in dark mode.
- Hosting: Netlify. Static pages + Netlify Functions (`netlify/functions/*.mjs`, the modern `export default async (req) => Response` format).
- Model: Anthropic Messages API called with `fetch` (no SDK), model id `claude-sonnet-5-5`, key from `process.env.ANTHROPIC_API_KEY`. Never hard-code a key. Never commit `.env`.
- The core must not import Netlify or Anthropic code directly. The model call is passed in as a function (`callModel(system, user) => Promise<string>`), so tests can use a fake.
- Tests: `node --test`. Property-based tests with `fast-check` (the only dev dependency allowed besides nothing).
- Cost guard: each function keeps a simple daily counter and refuses after `DAILY_LIMIT` (env, default 60) runs.
- Input limit: 2,000 characters. Longer input is refused with a clear message, not truncated silently.
