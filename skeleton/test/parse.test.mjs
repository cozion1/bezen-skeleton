/**
 * skeleton/test/parse.test.mjs
 *
 * Unit tests + property-based test for parseReading
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fc from 'fast-check';
import { parseReading } from '../parse.mjs';

const VALID_JSON = {
  protecting: 'their time',
  quote: 'I am very busy',
  why: 'They signalled urgency.',
  doNot: 'Do not send a long email.',
  nextMessage: 'Quick question — are you free Thursday?',
  route: 'bot-ok',
  safety: false,
};

function validRaw(overrides = {}) {
  return JSON.stringify({ ...VALID_JSON, ...overrides });
}

// ─── Clean JSON ────────────────────────────────────────────────────────────────

test('parse: clean JSON object is parsed correctly', () => {
  const r = parseReading(validRaw());
  assert.equal(r.protecting, 'their time');
  assert.equal(r.quote, 'I am very busy');
  assert.equal(r.why, 'They signalled urgency.');
  assert.equal(r.doNot, 'Do not send a long email.');
  assert.equal(r.nextMessage, 'Quick question — are you free Thursday?');
  assert.equal(r.route, 'bot-ok');
  assert.equal(r.safety, false);
  assert.equal(r.verified, false);
});

test('parse: verified is always false from parser (code sets it)', () => {
  const raw = JSON.stringify({ ...VALID_JSON, verified: true });
  const r = parseReading(raw);
  assert.equal(r.verified, false);
});

// ─── JSON after prose ──────────────────────────────────────────────────────────

test('parse: JSON after leading prose is extracted', () => {
  const raw = `Here is my analysis of the message:\n\n${validRaw()}`;
  const r = parseReading(raw);
  assert.equal(r.protecting, 'their time');
  assert.ok(!r.error);
});

test('parse: JSON with trailing prose is extracted', () => {
  const raw = `${validRaw()}\n\nI hope this helps!`;
  const r = parseReading(raw);
  assert.equal(r.protecting, 'their time');
  assert.ok(!r.error);
});

// ─── JSON inside a code fence ──────────────────────────────────────────────────

test('parse: JSON inside ```json fence is extracted', () => {
  const raw = '```json\n' + validRaw() + '\n```';
  const r = parseReading(raw);
  assert.equal(r.protecting, 'their time');
  assert.ok(!r.error);
});

test('parse: JSON inside plain ``` fence is extracted', () => {
  const raw = '```\n' + validRaw() + '\n```';
  const r = parseReading(raw);
  assert.equal(r.protecting, 'their time');
  assert.ok(!r.error);
});

// ─── Garbled / missing JSON ────────────────────────────────────────────────────

test('parse: garbled input returns error:unreadable without throwing', () => {
  const r = parseReading('This is not JSON at all!!! @#$%^');
  assert.equal(r.error, 'unreadable');
  assert.equal(r.protecting, '');
});

test('parse: empty string returns error:unreadable', () => {
  const r = parseReading('');
  assert.equal(r.error, 'unreadable');
});

test('parse: non-string input returns error:unreadable', () => {
  const r = parseReading(null);
  assert.equal(r.error, 'unreadable');
});

test('parse: truncated JSON returns error:unreadable', () => {
  const r = parseReading('{ "protecting": "their time"');
  assert.equal(r.error, 'unreadable');
});

// ─── Missing individual fields fill with "" ────────────────────────────────────

test('parse: missing protecting fills with ""', () => {
  const raw = validRaw({ protecting: undefined });
  const r = parseReading(raw);
  assert.equal(r.protecting, '');
  assert.ok(!r.error);
});

test('parse: missing quote fills with ""', () => {
  const raw = validRaw({ quote: undefined });
  const r = parseReading(raw);
  assert.equal(r.quote, '');
  assert.ok(!r.error);
});

test('parse: missing why fills with ""', () => {
  const raw = validRaw({ why: undefined });
  const r = parseReading(raw);
  assert.equal(r.why, '');
  assert.ok(!r.error);
});

test('parse: missing doNot fills with ""', () => {
  const raw = validRaw({ doNot: undefined });
  const r = parseReading(raw);
  assert.equal(r.doNot, '');
  assert.ok(!r.error);
});

test('parse: missing nextMessage fills with ""', () => {
  const raw = validRaw({ nextMessage: undefined });
  const r = parseReading(raw);
  assert.equal(r.nextMessage, '');
  assert.ok(!r.error);
});

test('parse: missing route fills with ""', () => {
  const raw = validRaw({ route: undefined });
  const r = parseReading(raw);
  assert.equal(r.route, '');
  assert.ok(!r.error);
});

// ─── Property-based: parseReading never throws ────────────────────────────────

test('property: parseReading never throws for any arbitrary string', () => {
  fc.assert(
    fc.property(fc.string(), (raw) => {
      let threw = false;
      try {
        const r = parseReading(raw);
        // Must return an object
        if (typeof r !== 'object' || r === null) threw = true;
      } catch {
        threw = true;
      }
      return !threw;
    }),
    { numRuns: 1000 }
  );
});
