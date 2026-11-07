/**
 * skeleton/core.mjs — orchestrator
 *
 * createReader(profile) validates the profile and returns { read }.
 * read(text, callModel) wires all modules together.
 *
 * No Netlify or Anthropic code here. callModel is injected.
 * Covers: Req 1.1, 1.2, 1.3, 4.1, 5.1
 */

import { buildPrompt } from './prompt.mjs';
import { parseReading } from './parse.mjs';
import { verify } from './verify.mjs';
import { checkSafety } from './safety.mjs';

const REQUIRED_FIELDS = ['id', 'sender', 'reader', 'protects'];

/**
 * Validate the profile and return a reader.
 * Throws with a message naming the missing field if profile is incomplete.
 *
 * @param {import('./types.d.ts').Profile} profile
 * @returns {{ read: (text: string, callModel: function) => Promise<object> }}
 */
export function createReader(profile) {
  for (const field of REQUIRED_FIELDS) {
    if (profile == null || profile[field] == null || profile[field] === '') {
      throw new Error(`Profile is missing required field: ${field}`);
    }
  }

  if (!Array.isArray(profile.protects) || profile.protects.length === 0) {
    throw new Error('Profile is missing required field: protects');
  }

  return { read: read.bind(null, profile) };
}

/**
 * Orchestrate one reading.
 *
 * @param {object} profile
 * @param {string} text
 * @param {(system: string, user: string) => Promise<string>} callModel
 * @returns {Promise<object>} Reading
 */
async function read(profile, text, callModel) {
  // 1. Build the prompt
  const { system, user } = buildPrompt(profile, text);

  // 2. Call the model
  const raw = await callModel(system, user);

  // 3. Parse the model's output
  const reading = parseReading(raw);

  // 4. Verify the quote (code sets this, never the model)
  reading.verified = verify(reading.quote, text);

  // 5. Safety check — OR with model's safety field.
  // Accept model's value only when it is the boolean true or the string 'true'
  // (case-insensitive). Everything else counts as false.
  if (profile.safety === true) {
    const modelSafety =
      reading.safety === true ||
      (typeof reading.safety === 'string' && reading.safety.toLowerCase() === 'true');
    reading.safety = modelSafety || checkSafety(text);
  } else {
    // When profile has no safety flag, always false from code perspective
    reading.safety = false;
  }

  // 6. Apply routeRules
  reading.route = applyRouteRules(profile, reading, text);

  return reading;
}

/**
 * Evaluate routeRules in order; first keyword match escalates to human.
 * Keyword rules may only escalate to human — they never downgrade a route.
 * Final route is 'human' if any rule matched OR the model already returned 'human'.
 * Any model value other than 'human' or 'bot-ok' is treated as 'bot-ok'.
 *
 * Each rule has:
 *   signals: RegExp | string[]  — patterns/keywords to search in text
 *   route:   string             — route value on match
 *
 * @param {object} profile
 * @param {object} reading
 * @param {string} text
 * @returns {string}
 */
function applyRouteRules(profile, reading, text) {
  // Normalise the model's route: only 'human' is kept; anything else → 'bot-ok'
  const modelRoute = reading.route === 'human' ? 'human' : 'bot-ok';

  // If model already said human, no need to check rules
  if (modelRoute === 'human') return 'human';

  if (!Array.isArray(profile.routeRules) || profile.routeRules.length === 0) {
    return modelRoute;
  }

  const haystack = text.toLowerCase();

  for (const rule of profile.routeRules) {
    const { signals } = rule;

    if (signals instanceof RegExp) {
      if (signals.test(text)) return 'human';
    } else if (Array.isArray(signals)) {
      const matched = signals.some((kw) => haystack.includes(kw.toLowerCase()));
      if (matched) return 'human';
    }
  }

  return 'bot-ok';
}
