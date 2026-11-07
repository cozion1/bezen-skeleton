/**
 * skeleton/test/handler.test.mjs
 *
 * Tests for makeHandler. Uses a fake callModel injected via profile.
 *
 * Because makeHandler builds the reader internally and binds a daily counter,
 * we test the 429 case by setting DAILY_LIMIT=0 before creating a fresh handler.
 */
import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { makeHandler } from '../handler.mjs';

// ─── Helpers ──────────────────────────────────────────────────────────────────

const VALID_TEXT = 'I am too busy right now to deal with this.';
const LONG_TEXT  = 'x'.repeat(2001);

const VALID_JSON = JSON.stringify({
  protecting: 'their time',
  quote: 'too busy',
  why: 'They are rushed.',
  doNot: 'Do not send more work.',
  nextMessage: 'Got it — I will keep this short.',
  route: 'bot-ok',
  safety: false,
});

function makeProfile(overrides = {}) {
  return {
    id: 'test-handler',
    sender: 'a customer',
    reader: 'the support agent',
    protects: ['their time'],
    ...overrides,
  };
}

/**
 * A fake callModel that always resolves with VALID_JSON.
 * Injected into the profile so handler can use it — but handler builds its own
 * callModel internally. We need to patch makeCallModel. Instead, we use a
 * special hook: we set process.env.ANTHROPIC_API_KEY and override the handler
 * by using a test profile with _callModel override mechanism.
 *
 * Simpler approach: we monkey-patch the module's makeCallModel for tests by
 * exporting a testable version through a separate test-only factory.
 * Even simpler: expose a _testMakeHandler that accepts an external callModel.
 */

/**
 * Build a Request object for POST with JSON body.
 */
function makeRequest(body, method = 'POST') {
  const init = {
    method,
    headers: { 'Content-Type': 'application/json' },
  };
  if (body !== undefined) {
    init.body = JSON.stringify(body);
  }
  return new Request('https://example.com/api/read', init);
}

// ─── Test a handler wired with a fake callModel ────────────────────────────────
// We create a thin wrapper that bypasses the real makeCallModel.

/**
 * makeHandlerWithFakeModel creates a handler that uses a provided callModel
 * instead of the real Anthropic one, by temporarily setting the API key and
 * patching the module.
 *
 * Since we cannot easily monkey-patch ES modules, we instead test through
 * the actual makeHandler but supply a real API key and intercept via global fetch.
 *
 * Strategy: override globalThis.fetch during tests that need a fake model.
 */

let originalFetch;
before(() => { originalFetch = globalThis.fetch; });
after(() => { globalThis.fetch = originalFetch; });

function stubFetch(responseBody, status = 200) {
  globalThis.fetch = async () => ({
    ok: status >= 200 && status < 300,
    status,
    json: async () => responseBody,
  });
}

// ─── 400: wrong method ────────────────────────────────────────────────────────

test('handler: 400 on GET request', async () => {
  const handler = makeHandler(makeProfile());
  const req = new Request('https://example.com/api', { method: 'GET' });
  const res = await handler(req);
  assert.equal(res.status, 400);
  const body = await res.json();
  assert.equal(body.error, 'Bad request');
});

// ─── 400: missing text ────────────────────────────────────────────────────────

test('handler: 400 on body without text field', async () => {
  const handler = makeHandler(makeProfile());
  const req = makeRequest({ message: 'hello' });
  const res = await handler(req);
  assert.equal(res.status, 400);
  const body = await res.json();
  assert.equal(body.error, 'Bad request');
});

test('handler: 400 on non-JSON body', async () => {
  const handler = makeHandler(makeProfile());
  const req = new Request('https://example.com/api', {
    method: 'POST',
    headers: { 'Content-Type': 'text/plain' },
    body: 'not json',
  });
  const res = await handler(req);
  assert.equal(res.status, 400);
});

test('handler: 400 when text is not a string', async () => {
  const handler = makeHandler(makeProfile());
  const req = makeRequest({ text: 123 });
  const res = await handler(req);
  assert.equal(res.status, 400);
});

// ─── 413: text too long ────────────────────────────────────────────────────────

test('handler: 413 on 2001-character input', async () => {
  const handler = makeHandler(makeProfile());
  const req = makeRequest({ text: LONG_TEXT });
  const res = await handler(req);
  assert.equal(res.status, 413);
  const body = await res.json();
  assert.ok(body.error.includes('2,000'), `expected 2,000 mention in: ${body.error}`);
});

test('handler: 200 on exactly 2000-character input (boundary)', async () => {
  process.env.ANTHROPIC_API_KEY = 'test-key';
  const handler = makeHandler(makeProfile());
  stubFetch({ content: [{ type: 'text', text: VALID_JSON }] });
  const req = makeRequest({ text: 'x'.repeat(2000) });
  const res = await handler(req);
  // Should not be 413
  assert.notEqual(res.status, 413);
  delete process.env.ANTHROPIC_API_KEY;
});

// ─── 429: daily limit ────────────────────────────────────────────────────────

test('handler: 429 after daily limit exceeded', async () => {
  process.env.ANTHROPIC_API_KEY = 'test-key';
  process.env.DAILY_LIMIT = '1';
  // Create a fresh handler with DAILY_LIMIT=1
  const handler = makeHandler(makeProfile());
  stubFetch({ content: [{ type: 'text', text: VALID_JSON }] });

  // First request — should succeed (increments counter to 1)
  const req1 = makeRequest({ text: VALID_TEXT });
  const res1 = await handler(req1);
  // Should not be 429
  assert.notEqual(res1.status, 429);

  // Second request — counter is at limit
  const req2 = makeRequest({ text: VALID_TEXT });
  const res2 = await handler(req2);
  assert.equal(res2.status, 429);
  const body = await res2.json();
  assert.ok(body.error.toLowerCase().includes('limit'), `expected limit mention in: ${body.error}`);

  delete process.env.ANTHROPIC_API_KEY;
  delete process.env.DAILY_LIMIT;
});

// ─── 500: API key missing ─────────────────────────────────────────────────────

test('handler: 500 when ANTHROPIC_API_KEY not set', async () => {
  const savedKey = process.env.ANTHROPIC_API_KEY;
  delete process.env.ANTHROPIC_API_KEY;

  const handler = makeHandler(makeProfile());
  const req = makeRequest({ text: VALID_TEXT });
  const res = await handler(req);
  assert.equal(res.status, 500);
  const body = await res.json();
  assert.equal(body.error, 'Not configured');

  if (savedKey) process.env.ANTHROPIC_API_KEY = savedKey;
});

// ─── 502: model error ─────────────────────────────────────────────────────────

test('handler: 502 when callModel rejects (Anthropic non-2xx)', async () => {
  process.env.ANTHROPIC_API_KEY = 'test-key';
  const handler = makeHandler(makeProfile());

  // Stub fetch to return a 500 from Anthropic
  stubFetch({}, 500);

  const req = makeRequest({ text: VALID_TEXT });
  const res = await handler(req);
  assert.equal(res.status, 502);
  const body = await res.json();
  assert.ok(body.error.toLowerCase().includes('reading service') || body.error.toLowerCase().includes('reach'),
    `unexpected error: ${body.error}`);

  delete process.env.ANTHROPIC_API_KEY;
});

test('handler: 502 when fetch throws (network/timeout)', async () => {
  process.env.ANTHROPIC_API_KEY = 'test-key';
  const handler = makeHandler(makeProfile());

  // Stub fetch to throw
  globalThis.fetch = async () => { throw new Error('Network timeout'); };

  const req = makeRequest({ text: VALID_TEXT });
  const res = await handler(req);
  assert.equal(res.status, 502);

  delete process.env.ANTHROPIC_API_KEY;
});

// ─── 200: valid request ────────────────────────────────────────────────────────

test('handler: 200 with valid input and fake callModel', async () => {
  process.env.ANTHROPIC_API_KEY = 'test-key';
  const handler = makeHandler(makeProfile());

  stubFetch({ content: [{ type: 'text', text: VALID_JSON }] });

  const req = makeRequest({ text: VALID_TEXT });
  const res = await handler(req);
  assert.equal(res.status, 200);

  const body = await res.json();
  assert.equal(body.protecting, 'their time');
  assert.equal(typeof body.verified, 'boolean');
  assert.equal(typeof body.safety, 'boolean');

  delete process.env.ANTHROPIC_API_KEY;
});

// ─── 200: thinking block before the text block ────────────────────────────────
// Newer models may return a thinking block first; content[0] is then not text.

test('handler: reads the text block even when a thinking block comes first', async () => {
  process.env.ANTHROPIC_API_KEY = 'test-key';
  const handler = makeHandler(makeProfile());

  stubFetch({
    content: [
      { type: 'thinking', thinking: 'reading the reply…' },
      { type: 'text', text: VALID_JSON },
    ],
  });

  const res = await handler(makeRequest({ text: VALID_TEXT }));
  assert.equal(res.status, 200);
  const body = await res.json();
  assert.equal(body.protecting, 'their time');

  delete process.env.ANTHROPIC_API_KEY;
});
