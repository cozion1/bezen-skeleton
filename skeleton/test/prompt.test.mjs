/**
 * skeleton/test/prompt.test.mjs
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { buildPrompt } from '../prompt.mjs';

const BASE_PROFILE = {
  id: 'test-app',
  sender: 'a customer',
  reader: 'the support agent',
  protects: ['their time', 'their budget', 'their privacy'],
};

// ─── System prompt content ─────────────────────────────────────────────────────

test('prompt: system contains sender', () => {
  const { system } = buildPrompt(BASE_PROFILE, 'Hello');
  assert.ok(system.includes('a customer'), `sender not found in: ${system}`);
});

test('prompt: system contains reader', () => {
  const { system } = buildPrompt(BASE_PROFILE, 'Hello');
  assert.ok(system.includes('the support agent'), `reader not found in: ${system}`);
});

test('prompt: system contains each protects item', () => {
  const { system } = buildPrompt(BASE_PROFILE, 'Hello');
  for (const item of BASE_PROFILE.protects) {
    assert.ok(system.includes(item), `protects item "${item}" not found in system prompt`);
  }
});

test('prompt: safety clause present when profile.safety === true', () => {
  const profile = { ...BASE_PROFILE, safety: true };
  const { system } = buildPrompt(profile, 'Hello');
  assert.ok(
    system.toLowerCase().includes('self-harm') || system.toLowerCase().includes('safety rule'),
    'safety clause not found'
  );
});

test('prompt: safety clause absent when profile.safety is not set', () => {
  const { system } = buildPrompt(BASE_PROFILE, 'Hello');
  assert.ok(!system.includes('Safety rule'), 'safety clause should not be present');
});

test('prompt: safety clause absent when profile.safety === false', () => {
  const profile = { ...BASE_PROFILE, safety: false };
  const { system } = buildPrompt(profile, 'Hello');
  assert.ok(!system.includes('Safety rule'), 'safety clause should not be present');
});

test('prompt: voice line present when profile.voice is set', () => {
  const profile = { ...BASE_PROFILE, voice: 'Short, warm sentences.' };
  const { system } = buildPrompt(profile, 'Hello');
  assert.ok(system.includes('Short, warm sentences.'), 'voice guidance not found');
});

test('prompt: voice line absent when profile.voice is not set', () => {
  const { system } = buildPrompt(BASE_PROFILE, 'Hello');
  assert.ok(!system.includes('Voice for nextMessage'), 'voice line should not be present');
});

// ─── User message ──────────────────────────────────────────────────────────────

test('prompt: user message wraps text in <message> tags', () => {
  const text = 'I am too busy to deal with this right now.';
  const { user } = buildPrompt(BASE_PROFILE, text);
  assert.ok(user.includes('<message>'), '<message> opening tag not found');
  assert.ok(user.includes('</message>'), '</message> closing tag not found');
  assert.ok(user.includes(text), 'text not found inside user message');
});

test('prompt: text appears between the message delimiters', () => {
  const text = 'unique-marker-string';
  const { user } = buildPrompt(BASE_PROFILE, text);
  const start = user.indexOf('<message>');
  const end   = user.indexOf('</message>');
  assert.ok(start !== -1);
  assert.ok(end !== -1);
  assert.ok(start < end);
  const inner = user.slice(start + '<message>'.length, end);
  assert.ok(inner.includes(text));
});

// ─── JSON shape instruction ────────────────────────────────────────────────────

test('prompt: system contains JSON shape instruction', () => {
  const { system } = buildPrompt(BASE_PROFILE, 'Hello');
  assert.ok(system.includes('"protecting"'), 'JSON field "protecting" not in prompt');
  assert.ok(system.includes('"quote"'),      'JSON field "quote" not in prompt');
  assert.ok(system.includes('"doNot"'),      'JSON field "doNot" not in prompt');
  assert.ok(system.includes('"nextMessage"'), 'JSON field "nextMessage" not in prompt');
  assert.ok(system.includes('"route"'),      'JSON field "route" not in prompt');
});

test('prompt: system instructs model to treat message content as data', () => {
  const { system } = buildPrompt(BASE_PROFILE, 'Hello');
  assert.ok(
    system.includes('data') && system.includes('<message>'),
    'data-only instruction for <message> not found'
  );
});

// ─── Language rule ─────────────────────────────────────────────────────────────

test('prompt: system instructs output fields to match language of sender text', () => {
  const { system } = buildPrompt(BASE_PROFILE, 'Hello');
  // Rule 4 must cover all four output fields
  assert.ok(system.includes('protecting'), 'protecting field not mentioned in language rule');
  assert.ok(system.includes('why'),        'why field not mentioned in language rule');
  assert.ok(system.includes('doNot'),      'doNot field not mentioned in language rule');
  assert.ok(system.includes('nextMessage'),'nextMessage field not mentioned in language rule');
  // Must reference the message tags as the language source
  assert.ok(
    system.includes('<message>'),
    'language rule does not reference <message> tags as the language source'
  );
  // Must explicitly exempt quote from translation
  assert.ok(
    system.toLowerCase().includes('quote') && system.toLowerCase().includes('original'),
    'language rule does not exempt quote from translation'
  );
});
