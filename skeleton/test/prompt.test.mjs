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


// ─── routeGuidance ────────────────────────────────────────────────────────────

test('prompt: routeGuidance clause present when profile.routeGuidance is set', () => {
  const guidance = 'human when the reply touches legal words; bot-ok for everything else.';
  const profile = { ...BASE_PROFILE, routeGuidance: guidance };
  const { system } = buildPrompt(profile, 'Hello');
  assert.ok(
    system.includes(guidance),
    `routeGuidance text not found in system prompt: ${system}`
  );
});

test('prompt: routeGuidance clause uses profile text verbatim, not default', () => {
  const guidance = 'human for angry messages; bot-ok otherwise.';
  const profile = { ...BASE_PROFILE, routeGuidance: guidance };
  const { system } = buildPrompt(profile, 'Hello');
  // Custom text present
  assert.ok(system.includes(guidance), 'custom routeGuidance not found');
  // Default text absent
  assert.ok(
    !system.includes('use human only when a person must answer'),
    'default routeGuidance text should be absent when custom one is set'
  );
});

test('prompt: default routeGuidance present when profile.routeGuidance is absent', () => {
  const { system } = buildPrompt(BASE_PROFILE, 'Hello');
  assert.ok(
    system.includes('use human only when a person must answer'),
    'default routeGuidance not found when field is absent'
  );
});

test('prompt: default routeGuidance present when profile.routeGuidance is empty string', () => {
  const profile = { ...BASE_PROFILE, routeGuidance: '' };
  const { system } = buildPrompt(profile, 'Hello');
  assert.ok(
    system.includes('use human only when a person must answer'),
    'default routeGuidance not found when field is empty string'
  );
});

test('prompt: routeGuidance appears near the route field in the JSON shape section', () => {
  const guidance = 'human for complaints; bot-ok for the rest.';
  const profile = { ...BASE_PROFILE, routeGuidance: guidance };
  const { system } = buildPrompt(profile, 'Hello');
  const guidancePos = system.indexOf(guidance);
  const routePos = system.indexOf('"route"');
  assert.ok(guidancePos !== -1, 'routeGuidance text not found');
  assert.ok(routePos !== -1, '"route" field not found');
  // routeGuidance should appear before the route field in the JSON shape
  assert.ok(
    guidancePos < routePos,
    'routeGuidance should appear before the JSON shape instructions'
  );
});
