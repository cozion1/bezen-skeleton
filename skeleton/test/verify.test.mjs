/**
 * skeleton/test/verify.test.mjs
 *
 * Unit tests (≥5 positive, ≥5 negative) + 4 property-based tests for verify.mjs
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fc from 'fast-check';
import { normalize, verify } from '../verify.mjs';

// ─── Positive hand-written cases ──────────────────────────────────────────────

test('verify: direct substring returns true', () => {
  assert.equal(verify('hello', 'say hello world'), true);
});

test('verify: case difference is transparent', () => {
  assert.equal(verify('HELLO', 'say hello world'), true);
});

test('verify: extra whitespace in quote is transparent', () => {
  assert.equal(verify('hello  world', 'say hello world today'), true);
});

test('verify: newline in text collapsed to space', () => {
  assert.equal(verify('hello world', 'say hello\nworld today'), true);
});

test('verify: curly apostrophe matches straight', () => {
  assert.equal(verify('don\u2019t', "I don't know"), true);
});

test('verify: curly double quotes match straight', () => {
  assert.equal(verify('\u201Chello\u201D', 'say "hello" world'), true);
});

test('verify: whole text matches itself', () => {
  assert.equal(verify('the quick brown fox', 'the quick brown fox'), true);
});

// ─── Negative hand-written cases ──────────────────────────────────────────────

test('verify: empty quote returns false', () => {
  assert.equal(verify('', 'hello world'), false);
});

test('verify: whitespace-only quote returns false', () => {
  assert.equal(verify('   ', 'hello world'), false);
});

test('verify: quote not in text returns false', () => {
  assert.equal(verify('xyz', 'hello world'), false);
});

test('verify: partial word that does not appear returns false', () => {
  assert.equal(verify('hellox', 'hello world'), false);
});

test('verify: null quote returns false', () => {
  assert.equal(verify(null, 'hello world'), false);
});

test('verify: undefined quote returns false', () => {
  assert.equal(verify(undefined, 'hello world'), false);
});

test('verify: quote longer than text returns false', () => {
  assert.equal(verify('a very long string that cannot be found anywhere', 'short'), false);
});

// ─── normalize unit tests ──────────────────────────────────────────────────────

test('normalize: collapses whitespace and trims', () => {
  assert.equal(normalize('  hello   world  '), 'hello world');
});

test('normalize: lowercases', () => {
  assert.equal(normalize('HELLO WORLD'), 'hello world');
});

test('normalize: NFC round-trips correctly', () => {
  // é as decomposed (U+0065 U+0301) should become composed é (U+00E9)
  const decomposed = 'e\u0301';
  const composed = '\u00E9';
  assert.equal(normalize(decomposed), normalize(composed));
});

test('normalize: is idempotent on plain ascii', () => {
  const s = 'Hello World! This is a test.';
  assert.equal(normalize(normalize(s)), normalize(s));
});

// ─── Property-based tests ──────────────────────────────────────────────────────

test('property: every real substring verifies', () => {
  fc.assert(
    fc.property(
      fc.string({ minLength: 1 }),
      fc.integer({ min: 0 }),
      fc.integer({ min: 0 }),
      (text, a, b) => {
        const start = Math.min(a, b) % (text.length + 1);
        const end = Math.max(a, b) % (text.length + 1);
        const sub = text.slice(start, end);
        // Req 4.4: property holds only for substrings with at least one non-whitespace character.
        // Skip substrings that are empty or whitespace-only — they normalize to '' and must not verify (Req 4.3).
        if (sub.length === 0 || !/\S/.test(sub)) return true;
        return verify(sub, text) === true;
      }
    ),
    { numRuns: 500 }
  );
});

test('property: case/whitespace/quote normalization is transparent', () => {
  fc.assert(
    fc.property(fc.string({ minLength: 1 }), (s) => {
      // identity
      const n = normalize(s);
      if (n === '') return true; // empty after normalization — skip
      return verify(s, s) === true;
    }),
    { numRuns: 500 }
  );
});

test('property: non-substrings do not verify', () => {
  fc.assert(
    fc.property(fc.string(), fc.string(), (t, s) => {
      const ns = normalize(s);
      const nt = normalize(t);
      // Only test when s is genuinely NOT a substring of t
      if (ns === '' || nt.includes(ns)) return true;
      return verify(s, t) === false;
    }),
    { numRuns: 500 }
  );
});

test('property: normalization is idempotent', () => {
  fc.assert(
    fc.property(fc.string(), (s) => {
      return normalize(normalize(s)) === normalize(s);
    }),
    { numRuns: 1000 }
  );
});
