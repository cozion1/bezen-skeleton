/**
 * skeleton/handler.mjs — serverless wrapper
 *
 * makeHandler(profile) → modern Netlify Function (async (req) => Response)
 * makeCallModel(apiKey, timeoutMs) → CallModel (exported for testing)
 *
 * Covers: Req 6.1–6.6
 */

import { createReader } from './core.mjs';

const INPUT_LIMIT = 2_000;
const DEFAULT_DAILY_LIMIT = 60;
const MODEL_ID = 'claude-sonnet-5-5';
const ANTHROPIC_API_URL = 'https://api.anthropic.com/v1/messages';
const DEFAULT_TIMEOUT_MS = 20_000;

// ─── JSON response helpers ────────────────────────────────────────────────────

function jsonResponse(body, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

// ─── Daily counter ────────────────────────────────────────────────────────────
// In-memory per function instance; approximate cost guard.

function makeDailyCounter() {
  let count = 0;
  let currentDay = new Date().toISOString().slice(0, 10); // "YYYY-MM-DD" UTC

  return {
    increment() {
      const today = new Date().toISOString().slice(0, 10);
      if (today !== currentDay) {
        count = 0;
        currentDay = today;
      }
      count++;
    },
    isExceeded(limit) {
      const today = new Date().toISOString().slice(0, 10);
      if (today !== currentDay) {
        count = 0;
        currentDay = today;
      }
      return count >= limit;
    },
    // For testing: allow resetting
    reset() {
      count = 0;
      currentDay = new Date().toISOString().slice(0, 10);
    },
    getCount() { return count; },
  };
}

// ─── makeCallModel ────────────────────────────────────────────────────────────

/**
 * Build a callModel function that calls the Anthropic Messages API.
 * Throws on non-2xx or timeout.
 *
 * @param {string} apiKey
 * @param {number} [timeoutMs=20000]
 * @returns {(system: string, user: string) => Promise<string>}
 */
export function makeCallModel(apiKey, timeoutMs = DEFAULT_TIMEOUT_MS) {
  return async function callModel(system, user) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);

    let res;
    try {
      res = await fetch(ANTHROPIC_API_URL, {
        method: 'POST',
        signal: controller.signal,
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': apiKey,
          'anthropic-version': '2023-06-01',
        },
        body: JSON.stringify({
          model: MODEL_ID,
          max_tokens: 1024,
          system,
          messages: [{ role: 'user', content: user }],
        }),
      });
    } catch (err) {
      clearTimeout(timer);
      throw new Error(`Model call failed: ${err.message}`);
    }

    clearTimeout(timer);

    if (!res.ok) {
      throw new Error(`Anthropic API error: ${res.status}`);
    }

    const data = await res.json();
    // Extract text from the first content block
    const text = data?.content?.[0]?.text;
    if (typeof text !== 'string') {
      throw new Error('Unexpected response shape from Anthropic API');
    }
    return text;
  };
}

// ─── makeHandler ──────────────────────────────────────────────────────────────

/**
 * Return a Netlify Function handler for the given profile.
 * Modern Netlify Functions format: async (req: Request) => Response
 *
 * @param {import('./types.d.ts').Profile} profile
 * @returns {(req: Request) => Promise<Response>}
 */
export function makeHandler(profile) {
  const reader = createReader(profile);
  const counter = makeDailyCounter();

  return async function handler(req) {
    // 1. Method check
    if (req.method !== 'POST') {
      console.log(`[${profile.id}] 400 — wrong method: ${req.method}`);
      return jsonResponse({ error: 'Bad request' }, 400);
    }

    // 2. Parse body
    let body;
    try {
      body = await req.json();
    } catch {
      console.log(`[${profile.id}] 400 — could not parse JSON body`);
      return jsonResponse({ error: 'Bad request' }, 400);
    }

    if (typeof body?.text !== 'string') {
      console.log(`[${profile.id}] 400 — body.text missing or not a string`);
      return jsonResponse({ error: 'Bad request' }, 400);
    }

    const { text } = body;

    // 3. Length guard
    if (text.length > INPUT_LIMIT) {
      console.log(`[${profile.id}] 413 — text too long: ${text.length}`);
      return jsonResponse(
        { error: 'Message too long. Please keep it under 2,000 characters.' },
        413
      );
    }

    // 4. Daily limit
    const dailyLimit = parseInt(process.env.DAILY_LIMIT ?? String(DEFAULT_DAILY_LIMIT), 10);
    if (counter.isExceeded(dailyLimit)) {
      console.log(`[${profile.id}] 429 — daily limit reached`);
      return jsonResponse({ error: 'Daily limit reached. Try again tomorrow.' }, 429);
    }

    // 5. API key check
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      console.log(`[${profile.id}] 500 — API key missing`);
      return jsonResponse({ error: 'Not configured' }, 500);
    }

    // 6. Increment counter before calling (conservative)
    counter.increment();

    // 7. Call the model
    const callModel = makeCallModel(apiKey);
    let reading;
    try {
      reading = await reader.read(text, callModel);
    } catch (err) {
      console.log(`[${profile.id}] 502 — model error: ${err.message}`);
      return jsonResponse(
        { error: 'Could not reach the reading service. Please try again.' },
        502
      );
    }

    console.log(`[${profile.id}] 200`);
    return jsonResponse(reading, 200);
  };
}
