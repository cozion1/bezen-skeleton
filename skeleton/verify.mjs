/**
 * skeleton/verify.mjs — the seatbelt
 *
 * Pure functions only. No I/O.
 * Covers: Req 4.1–4.6
 */

/**
 * Normalize a string for comparison:
 *   1. Unicode NFC decomposition + recomposition
 *   2. Collapse all whitespace runs to a single space, trim
 *   3. Lowercase
 *   4. Replace curly quotes/apostrophes with straight equivalents
 *
 * @param {string} s
 * @returns {string}
 */
export function normalize(s) {
  return s
    .normalize('NFC')
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase()
    .replace(/[\u2018\u2019\u201A\u201B\u2032\u2035]/g, "'")  // curly single quotes / apostrophes
    .replace(/[\u201C\u201D\u201E\u201F\u2033\u2036]/g, '"'); // curly double quotes
}

/**
 * Return true iff quote appears in text after normalization.
 * An empty quote always returns false.
 *
 * @param {string} quote
 * @param {string} text
 * @returns {boolean}
 */
export function verify(quote, text) {
  if (!quote || typeof quote !== 'string') return false;
  const nq = normalize(quote);
  if (nq === '') return false;
  return normalize(text).includes(nq);
}
