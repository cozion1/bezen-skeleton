/**
 * reply-reader/examples.mjs
 *
 * Three sample customer/prospect replies for the demo buttons.
 * Each has a short `label` (button text) and the full `text`.
 *
 * Covers: Req 7.3
 */

/** @type {Array<{label: string, text: string}>} */
const examples = [
  {
    label: 'Needs manager approval',
    text: "Sounds interesting, but I need to run it by my manager first, she is very careful with new vendors.",
  },
  {
    label: 'How did you get my email?',
    text: "How did you get my email? I never signed up for anything.",
  },
  {
    label: 'Built it in-house',
    text: "We already built something like this in-house last year, it works fine for us.",
  },
];

export default examples;
