/**
 * skeleton/test/core.test.mjs
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createReader } from '../core.mjs';

const BASE_PROFILE = {
  id: 'test-app',
  sender: 'a customer',
  reader: 'the support agent',
  protects: ['their time', 'their budget'],
};

// Fake callModel that returns valid JSON matching the Reading shape
function fakeCallModel(protecting, quote, extra = {}) {
  return async (_system, _user) => JSON.stringify({
    protecting,
    quote,
    why: 'They indicated this is important.',
    doNot: 'Do not ignore this.',
    nextMessage: 'Thank you for letting us know.',
    route: 'bot-ok',
    safety: false,
    ...extra,
  });
}

// ─── createReader validation ───────────────────────────────────────────────────

test('core: throws on missing id', () => {
  const { id, ...noId } = BASE_PROFILE;
  assert.throws(() => createReader(noId), /id/);
});

test('core: throws on missing sender', () => {
  const { sender, ...noSender } = BASE_PROFILE;
  assert.throws(() => createReader(noSender), /sender/);
});

test('core: throws on missing reader', () => {
  const { reader, ...noReader } = BASE_PROFILE;
  assert.throws(() => createReader(noReader), /reader/);
});

test('core: throws on missing protects', () => {
  const { protects, ...noProtects } = BASE_PROFILE;
  assert.throws(() => createReader(noProtects), /protects/);
});

test('core: throws on null profile', () => {
  assert.throws(() => createReader(null), /field/);
});

test('core: valid profile returns object with read method', () => {
  const reader = createReader(BASE_PROFILE);
  assert.ok(typeof reader === 'object');
  assert.ok(typeof reader.read === 'function');
});

// ─── read() wiring ─────────────────────────────────────────────────────────────

test('core: read returns a reading with correct fields', async () => {
  const reader = createReader(BASE_PROFILE);
  const text = 'I am very busy right now and cannot deal with this.';
  const callModel = fakeCallModel('their time', 'very busy');
  const reading = await reader.read(text, callModel);

  assert.equal(reading.protecting, 'their time');
  assert.equal(reading.quote, 'very busy');
  assert.equal(typeof reading.verified, 'boolean');
  assert.equal(typeof reading.safety, 'boolean');
  assert.ok('route' in reading);
});

test('core: read sets verified=true when quote appears in text', async () => {
  const reader = createReader(BASE_PROFILE);
  const text = 'I am very busy right now.';
  const callModel = fakeCallModel('their time', 'very busy');
  const reading = await reader.read(text, callModel);
  assert.equal(reading.verified, true);
});

test('core: read sets verified=false when quote is not in text', async () => {
  const reader = createReader(BASE_PROFILE);
  const text = 'Hello, I have a question.';
  const callModel = fakeCallModel('their time', 'quote not in text at all xyz');
  const reading = await reader.read(text, callModel);
  assert.equal(reading.verified, false);
});

// ─── safety flag ──────────────────────────────────────────────────────────────

test('core: read sets safety=true from code even when model returns false', async () => {
  const profile = { ...BASE_PROFILE, safety: true };
  const reader = createReader(profile);
  const text = 'I want to run away and I have a knife';
  const callModel = fakeCallModel('safety', 'knife', { safety: false });
  const reading = await reader.read(text, callModel);
  assert.equal(reading.safety, true);
});

test('core: read sets safety=false for non-danger text', async () => {
  const profile = { ...BASE_PROFILE, safety: true };
  const reader = createReader(profile);
  const text = 'I forgot to do my homework today.';
  const callModel = fakeCallModel('something', 'homework', { safety: false });
  const reading = await reader.read(text, callModel);
  assert.equal(reading.safety, false);
});

test('core: safety always false when profile.safety is not set', async () => {
  const reader = createReader(BASE_PROFILE); // no safety flag
  const text = 'I want to die.'; // would trigger safety
  const callModel = fakeCallModel('something', 'die', { safety: false });
  const reading = await reader.read(text, callModel);
  assert.equal(reading.safety, false);
});

// ─── routeRules ───────────────────────────────────────────────────────────────

test('core: routeRules override route on keyword match', async () => {
  const profile = {
    ...BASE_PROFILE,
    routeRules: [
      { signals: ['privacy', 'personal data'], route: 'human' },
    ],
  };
  const reader = createReader(profile);
  const text = 'I am worried about my privacy.';
  const callModel = fakeCallModel('privacy', 'privacy', { route: 'bot-ok' });
  const reading = await reader.read(text, callModel);
  assert.equal(reading.route, 'human');
});

test('core: routeRules default to bot-ok when no match', async () => {
  const profile = {
    ...BASE_PROFILE,
    routeRules: [
      { signals: ['privacy'], route: 'human' },
    ],
  };
  const reader = createReader(profile);
  const text = 'I have a simple question about your product.';
  const callModel = fakeCallModel('their time', 'simple question', { route: 'bot-ok' });
  const reading = await reader.read(text, callModel);
  assert.equal(reading.route, 'bot-ok');
});

test('core: routeRules with RegExp signal works', async () => {
  const profile = {
    ...BASE_PROFILE,
    routeRules: [
      { signals: /angry|furious|outraged/i, route: 'human' },
    ],
  };
  const reader = createReader(profile);
  const text = 'I am absolutely furious with this service!';
  const callModel = fakeCallModel('standing', 'furious', { route: 'bot-ok' });
  const reading = await reader.read(text, callModel);
  assert.equal(reading.route, 'human');
});

// ─── routeRules escalation-only ───────────────────────────────────────────────

test('core: routeRules never downgrade human returned by model', async () => {
  // Model says human; no rule matches; must stay human
  const profile = {
    ...BASE_PROFILE,
    routeRules: [
      { signals: ['privacy'], route: 'human' },
    ],
  };
  const reader = createReader(profile);
  const text = 'I have a simple question about your product.';
  // Model returns 'human' but no keyword matches
  const callModel = fakeCallModel('their time', 'simple question', { route: 'human' });
  const reading = await reader.read(text, callModel);
  assert.equal(reading.route, 'human');
});

test('core: routeRules normalise unknown model route to bot-ok when no rule matches', async () => {
  const profile = {
    ...BASE_PROFILE,
    routeRules: [
      { signals: ['refund'], route: 'human' },
    ],
  };
  const reader = createReader(profile);
  const text = 'I have a simple question.';
  // Model returns an unrecognised value — must be normalised to bot-ok
  const callModel = fakeCallModel('their time', 'simple question', { route: 'escalate' });
  const reading = await reader.read(text, callModel);
  assert.equal(reading.route, 'bot-ok');
});

test('core: routeRules escalate even when model returned bot-ok', async () => {
  const profile = {
    ...BASE_PROFILE,
    routeRules: [
      { signals: ['refund'], route: 'human' },
    ],
  };
  const reader = createReader(profile);
  const text = 'I need a refund immediately.';
  const callModel = fakeCallModel('their budget', 'refund', { route: 'bot-ok' });
  const reading = await reader.read(text, callModel);
  assert.equal(reading.route, 'human');
});

// ─── safety string coercion ───────────────────────────────────────────────────

test('core: safety=true when model returns string "true"', async () => {
  const profile = { ...BASE_PROFILE, safety: true };
  const reader = createReader(profile);
  const text = 'I forgot to do my homework.'; // no code signal
  // Model returns the string "true" instead of boolean true
  const callModel = fakeCallModel('something', 'homework', { safety: 'true' });
  const reading = await reader.read(text, callModel);
  assert.equal(reading.safety, true);
});

test('core: safety=true when model returns string "TRUE" (case-insensitive)', async () => {
  const profile = { ...BASE_PROFILE, safety: true };
  const reader = createReader(profile);
  const text = 'I forgot to do my homework.'; // no code signal
  const callModel = fakeCallModel('something', 'homework', { safety: 'TRUE' });
  const reading = await reader.read(text, callModel);
  assert.equal(reading.safety, true);
});

test('core: safety=false when model returns string "yes" (not true)', async () => {
  const profile = { ...BASE_PROFILE, safety: true };
  const reader = createReader(profile);
  const text = 'I forgot to do my homework.'; // no code signal
  // "yes" is not a valid truthy string — must not trigger safety
  const callModel = fakeCallModel('something', 'homework', { safety: 'yes' });
  const reading = await reader.read(text, callModel);
  assert.equal(reading.safety, false);
});

test('core: safety=false when model returns number 1', async () => {
  const profile = { ...BASE_PROFILE, safety: true };
  const reader = createReader(profile);
  const text = 'I forgot to do my homework.'; // no code signal
  const callModel = fakeCallModel('something', 'homework', { safety: 1 });
  const reading = await reader.read(text, callModel);
  assert.equal(reading.safety, false);
});


// ─── keyword word-boundary matching ───────────────────────────────────────────

test('core: "sue" does not match "issue"', async () => {
  const profile = {
    ...BASE_PROFILE,
    routeRules: [{ signals: ['sue'], route: 'human' }],
  };
  const reader = createReader(profile);
  const text = 'We have an issue with the delivery.';
  const callModel = fakeCallModel('their time', 'issue', { route: 'bot-ok' });
  const reading = await reader.read(text, callModel);
  assert.equal(reading.route, 'bot-ok', '"issue" should not trigger "sue" signal');
});

test('core: "sue" does not match "pursue"', async () => {
  const profile = {
    ...BASE_PROFILE,
    routeRules: [{ signals: ['sue'], route: 'human' }],
  };
  const reader = createReader(profile);
  const text = 'We want to pursue other options.';
  const callModel = fakeCallModel('their time', 'pursue', { route: 'bot-ok' });
  const reading = await reader.read(text, callModel);
  assert.equal(reading.route, 'bot-ok', '"pursue" should not trigger "sue" signal');
});

test('core: "sue" matches standalone "sue"', async () => {
  const profile = {
    ...BASE_PROFILE,
    routeRules: [{ signals: ['sue'], route: 'human' }],
  };
  const reader = createReader(profile);
  const text = "I'm going to sue you if this is not fixed.";
  const callModel = fakeCallModel('their standing', 'sue', { route: 'bot-ok' });
  const reading = await reader.read(text, callModel);
  assert.equal(reading.route, 'human', 'standalone "sue" should trigger signal');
});

test('core: "legal" does not match "illegal"', async () => {
  const profile = {
    ...BASE_PROFILE,
    routeRules: [{ signals: ['legal'], route: 'human' }],
  };
  const reader = createReader(profile);
  const text = 'That seems illegal to me.';
  const callModel = fakeCallModel('their time', 'illegal', { route: 'bot-ok' });
  const reading = await reader.read(text, callModel);
  assert.equal(reading.route, 'bot-ok', '"illegal" should not trigger "legal" signal');
});

test('core: "legal" matches standalone "legal"', async () => {
  const profile = {
    ...BASE_PROFILE,
    routeRules: [{ signals: ['legal'], route: 'human' }],
  };
  const reader = createReader(profile);
  const text = 'I will need to take legal action.';
  const callModel = fakeCallModel('their standing', 'legal', { route: 'bot-ok' });
  const reading = await reader.read(text, callModel);
  assert.equal(reading.route, 'human', 'standalone "legal" should trigger signal');
});

test('core: multi-word keyword "my boss" matches inside a sentence', async () => {
  const profile = {
    ...BASE_PROFILE,
    routeRules: [{ signals: ['my boss'], route: 'human' }],
  };
  const reader = createReader(profile);
  const text = 'Let me ask my boss. and get back to you.';
  const callModel = fakeCallModel('their standing', 'my boss', { route: 'bot-ok' });
  const reading = await reader.read(text, callModel);
  assert.equal(reading.route, 'human', '"my boss" inside a sentence should trigger signal');
});

test('core: Hebrew keyword matches inside a Hebrew sentence', async () => {
  // Hebrew word for "lawsuit" / "sue": תביעה
  const profile = {
    ...BASE_PROFILE,
    routeRules: [{ signals: ['תביעה'], route: 'human' }],
  };
  const reader = createReader(profile);
  const text = 'אני מתכוון להגיש תביעה נגדכם.';
  const callModel = fakeCallModel('their standing', 'תביעה', { route: 'bot-ok' });
  const reading = await reader.read(text, callModel);
  assert.equal(reading.route, 'human', 'Hebrew keyword should match in Hebrew sentence');
});

test('core: Hebrew keyword does not match when embedded in a longer Hebrew word', async () => {
  // שלום (shalom) should not match inside שלומות (hypothetical longer form)
  const profile = {
    ...BASE_PROFILE,
    routeRules: [{ signals: ['שלום'], route: 'human' }],
  };
  const reader = createReader(profile);
  // שלומות is shalom + suffix — should NOT match standalone שלום
  const text = 'שלומות לכולם.';
  const callModel = fakeCallModel('their time', 'שלומות', { route: 'bot-ok' });
  const reading = await reader.read(text, callModel);
  assert.equal(reading.route, 'bot-ok', 'Hebrew keyword should not match inside a longer Hebrew word');
});
