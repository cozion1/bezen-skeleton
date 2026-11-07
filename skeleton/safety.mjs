/**
 * skeleton/safety.mjs — code-level danger signal detection
 *
 * Pure function, no I/O.
 * Detects signals in English and Hebrew for:
 *   - self-harm
 *   - wanting to die
 *   - being hurt or touched by an adult
 *   - running away
 *   - a weapon
 *
 * Covers: Req 5.1, 5.3
 */

// ─── English danger patterns ───────────────────────────────────────────────────

const ENGLISH_PATTERNS = [
  // self-harm
  /\bcut\s*(my|myself|me)\b/i,
  /\bhurt\s*(my|myself|me)\b/i,
  /\bself[\s-]?harm\b/i,
  /\bburn\s*my(self)?\b/i,
  /\bscratch\s*my(self)?\b/i,

  // wanting to die / suicidal
  /\bwant\s+to\s+die\b/i,
  /\bwish\s+i\s+(was|were)\s+dead\b/i,
  /\bkill\s+my(self)?\b/i,
  /\bsuicid(e|al)\b/i,
  /\bend\s+my\s+life\b/i,
  /\bnot\s+want\s+to\s+(be\s+here|live)\b/i,
  /\bdon't\s+want\s+to\s+live\b/i,

  // indirect suicidal ideation — "everyone would be better off without me" type
  /\bbetter\s+off\s+without\s+me\b/i,
  /\bnobody\s+would\s+miss\s+me\b/i,
  /\bno\s+one\s+would\s+(care|miss)\s+if\s+i\s+(was|were)\s+gone\b/i,
  /\bi\s+wish\s+i\s+could\s+disappear\b/i,

  // being hurt or touched by an adult
  /\b(adult|grown[\s-]?up|man|woman|uncle|aunt|teacher|coach)\s+(hurt|touch(ed)?|hit|hurt)\s+(me|my)\b/i,
  /\b(someone|somebody|they|he|she)\s+(hurt|touch(ed)?|hit|hurt)\s+(me|my\s+body)\b/i,
  /\btouched?\s+me\s+(in\s+a\s+(bad|wrong|private|uncomfortable)\s+place|inappropriately|where\s+i\s+didn'?t\s+want)\b/i,
  /\bno\s+one\s+(can|should)\s+touch\b/i,
  /\bhe\s+hurt\s+me\b/i,
  /\bshe\s+hurt\s+me\b/i,
  /\bthey\s+hurt\s+me\b/i,
  /\babuse[d]?\b/i,

  // running away
  /\brun\s+away\b/i,
  /\brunning\s+away\b/i,
  /\bran\s+away\b/i,
  /\bleave\s+home\b/i,
  /\bnot\s+going\s+home\b/i,
  /\bnever\s+coming\s+back\b/i,

  // a weapon
  /\b(gun|knife|blade|weapon|pistol|rifle|stab)\b/i,
  /\bshoot\s+(?:me|him|her|them|someone|everybody|everyone)\b(?!\s+a\s+\w)/i,
  /\bshoot\s+up\s+the\s+school\b/i,
  /\bbring\s+a\s+(gun|knife|weapon)\b/i,
];

// ─── Hebrew danger patterns ────────────────────────────────────────────────────
// Note: Hebrew is RTL; regex matches on the logical character sequence.

const HEBREW_PATTERNS = [
  // self-harm / wanting to die
  /לפגוע בעצמ/,          // hurt myself
  /לחתוך את עצמ/,         // cut myself
  /רוצה למות/,            // want to die
  /לא רוצה לחיות/,        // don't want to live
  /להרוג את עצמ/,         // kill myself
  /להתאבד/,               // to commit suicide
  /אין לי סיבה לחיות/,    // no reason to live

  // indirect suicidal ideation
  /יהיה לכולם יותר טוב בלעדיי/,  // everyone would be better off without me
  /אף אחד לא יתגעגע אליי/,        // nobody would miss me
  /הלוואי שהייתי נעלם/,           // I wish I could disappear (male)
  /הלוואי שהייתי נעלמת/,          // I wish I could disappear (female)

  // being hurt or touched
  /פגע בי/,               // hurt me
  /נגע בי/,               // touched me (male subject)
  /נגעה בי/,              // touched me (female subject)
  /פגעה בי/,              // hurt me (female subject)
  /הכה אותי/,             // hit me (male subject)
  /הכתה אותי/,            // hit me (female subject)
  /הרביץ לי/,             // hit/beat me (male subject)
  /מרביץ לי/,             // is hitting me (male subject)
  /מרביצים לי/,           // they are hitting me
  /גרם לי כאב/,           // caused me pain
  /עשה לי דברים/,         // did things to me

  // wanting to die / suicidal
  /בא לי למות/,           // I feel like dying
  /אני לא רוצה להיות פה יותר/, // I don't want to be here anymore

  // running away — contextual only, not bare לברוח
  /לברוח מהבית/,          // run away from home
  /לברוח מכאן/,           // run away from here
  /לא חוזר הביתה/,        // not coming home

  // weapon
  /סכין/,                 // knife
  /אקדח/,                 // gun
  /נשק/,                  // weapon
  /לתקוף/,                // to attack
];

/**
 * Return true if text contains any danger signal in English or Hebrew.
 * Pure function, no I/O.
 *
 * @param {string} text
 * @returns {boolean}
 */
export function checkSafety(text) {
  if (typeof text !== 'string' || text.length === 0) return false;

  for (const pattern of ENGLISH_PATTERNS) {
    if (pattern.test(text)) return true;
  }

  for (const pattern of HEBREW_PATTERNS) {
    if (pattern.test(text)) return true;
  }

  return false;
}
