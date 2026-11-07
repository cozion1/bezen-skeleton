/**
 * kid-message/examples.mjs
 *
 * Three sample children's messages for the demo buttons.
 * Each has a short `label` (button text) and the full `text`.
 * One example is in Hebrew (Req 8.4).
 *
 * Covers: Req 8.4
 */

/** @type {Array<{label: string, text: string}>} */
const examples = [
  {
    label: "We'll figure it out",
    text: "Its fine, I dont need help with the project, Noa and I will figure it out.",
  },
  {
    label: "Sleepover request",
    text: "Can I sleep at Daniels on Friday? Please dont call his mom, its embarrassing.",
  },
  {
    label: "לא רוצה ללכת לבית ספר (עברית)",
    text: "לא בא לי ללכת מחר לבית ספר, כולם בקבוצה צחקו עליי ואני לא רוצה לדבר על זה.",
  },
];

export default examples;
