/**
 * skeleton/parse.mjs — tolerant parser for model output
 *
 * Extracts a Reading from raw model text.
 * Tolerates prose before/after JSON and markdown code fences.
 * Never throws. Missing fields are filled with "".
 *
 * Covers: Req 3.1, 3.2, 3.3
 */

/** @type {import('./types.d.ts').Reading} */
const EMPTY_READING = {
  protecting: '',
  quote: '',
  why: '',
  doNot: '',
  nextMessage: '',
  route: '',
  verified: false,
  safety: false,
};

const ERROR_READING = {
  ...EMPTY_READING,
  error: 'unreadable',
};

/**
 * Extract a Reading from the model's raw text output.
 * Tolerates prose before/after the JSON and markdown code fences.
 * Never throws. Missing fields are filled with "".
 * If no JSON object is found, returns { error: "unreadable", ...emptyReading }.
 *
 * @param {string} raw
 * @returns {object} Reading
 */
export function parseReading(raw) {
  if (typeof raw !== 'string') return { ...ERROR_READING };

  // Strip markdown code fences: ```json ... ``` or ``` ... ```
  let cleaned = raw.replace(/```(?:json)?\s*([\s\S]*?)\s*```/g, '$1');

  // Extract the first {...} JSON object using a balanced-brace scan
  const start = cleaned.indexOf('{');
  if (start === -1) return { ...ERROR_READING };

  let depth = 0;
  let end = -1;
  for (let i = start; i < cleaned.length; i++) {
    const ch = cleaned[i];
    if (ch === '{') depth++;
    else if (ch === '}') {
      depth--;
      if (depth === 0) {
        end = i;
        break;
      }
    }
  }

  if (end === -1) return { ...ERROR_READING };

  const candidate = cleaned.slice(start, end + 1);

  let parsed;
  try {
    parsed = JSON.parse(candidate);
  } catch {
    return { ...ERROR_READING };
  }

  if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) {
    return { ...ERROR_READING };
  }

  // Build the reading with defaults — always override verified and safety from code
  return {
    protecting: typeof parsed.protecting === 'string' ? parsed.protecting : '',
    quote:       typeof parsed.quote      === 'string' ? parsed.quote      : '',
    why:         typeof parsed.why        === 'string' ? parsed.why        : '',
    doNot:       typeof parsed.doNot      === 'string' ? parsed.doNot      : '',
    nextMessage: typeof parsed.nextMessage === 'string' ? parsed.nextMessage : '',
    route:       typeof parsed.route      === 'string' ? parsed.route      : '',
    // verified and safety are always set by code — here we seed false
    verified: false,
    safety:   parsed.safety === true ||
              (typeof parsed.safety === 'string' && parsed.safety.trim().toLowerCase() === 'true'),
  };
}
