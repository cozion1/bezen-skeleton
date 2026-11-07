/**
 * skeleton/test/safety.test.mjs
 *
 * ≥5 positive English, ≥5 negative English, ≥5 positive Hebrew, ≥5 negative Hebrew
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { checkSafety } from '../safety.mjs';

// ─── Positive English (danger signals present) ────────────────────────────────

test('safety EN+: self-harm — cut myself', () => {
  assert.equal(checkSafety("I want to cut myself"), true);
});

test('safety EN+: wanting to die — want to die', () => {
  assert.equal(checkSafety("I want to die"), true);
});

test('safety EN+: suicidal ideation', () => {
  assert.equal(checkSafety("I've been having suicidal thoughts"), true);
});

test('safety EN+: running away', () => {
  assert.equal(checkSafety("I'm going to run away from home"), true);
});

test('safety EN+: weapon — knife', () => {
  assert.equal(checkSafety("He has a knife and I'm scared"), true);
});

test('safety EN+: hurt myself', () => {
  assert.equal(checkSafety("Sometimes I hurt myself when I feel sad"), true);
});

test('safety EN+: being hurt by adult', () => {
  assert.equal(checkSafety("He hurt me and I don't know what to do"), true);
});

test('safety EN+: kill myself', () => {
  assert.equal(checkSafety("I feel like I want to kill myself"), true);
});

// ─── Negative English (no danger signals) ────────────────────────────────────

test('safety EN-: normal message about homework', () => {
  assert.equal(checkSafety("I forgot to do my homework and I'm worried"), false);
});

test('safety EN-: normal message about friends', () => {
  assert.equal(checkSafety("My friend was mean to me today at school"), false);
});

test('safety EN-: normal message about food', () => {
  assert.equal(checkSafety("I don't like the food in the cafeteria"), false);
});

test('safety EN-: normal message about being bored', () => {
  assert.equal(checkSafety("I'm really bored and have nothing to do"), false);
});

test('safety EN-: normal message about a sports game', () => {
  assert.equal(checkSafety("We lost the soccer game and I feel bad"), false);
});

test('safety EN-: empty string', () => {
  assert.equal(checkSafety(""), false);
});

test('safety EN-: normal message about a pet', () => {
  assert.equal(checkSafety("My dog is sick and I'm sad about it"), false);
});

// ─── English indirect self-harm (new patterns) ───────────────────────────────

test('safety EN+: better off without me', () => {
  assert.equal(checkSafety("everyone would be better off without me"), true);
});

test('safety EN+: nobody would miss me', () => {
  assert.equal(checkSafety("nobody would miss me if I was gone"), true);
});

test('safety EN+: no one would care if I was gone', () => {
  assert.equal(checkSafety("no one would care if I was gone"), true);
});

test('safety EN+: I wish I could disappear', () => {
  assert.equal(checkSafety("I wish I could disappear forever"), true);
});

// ─── English false-positive regression tests ──────────────────────────────────

test('safety EN-: panic attack is not a danger signal', () => {
  assert.equal(checkSafety("I had a panic attack before the test"), false);
});

test('safety EN-: shoot hoops is not a danger signal', () => {
  assert.equal(checkSafety("we shoot hoops after school"), false);
});

test('safety EN-: shoot me a message is not a danger signal', () => {
  assert.equal(checkSafety("can you shoot me a message"), false);
});

// ─── English contextual shoot positives ───────────────────────────────────────

test('safety EN+: shoot me (threat)', () => {
  assert.equal(checkSafety("He said he would shoot me"), true);
});

test('safety EN+: shoot them (threat)', () => {
  assert.equal(checkSafety("I want to shoot them"), true);
});

test('safety EN+: shoot up the school', () => {
  assert.equal(checkSafety("someone said they would shoot up the school"), true);
});

// ─── Positive Hebrew (danger signals present) ────────────────────────────────

test('safety HE+: wanting to die — רוצה למות', () => {
  assert.equal(checkSafety("אני רוצה למות"), true);
});

test('safety HE+: self-harm — לפגוע בעצמי', () => {
  assert.equal(checkSafety("אני רוצה לפגוע בעצמי"), true);
});

test('safety HE+: run away — לברוח', () => {
  assert.equal(checkSafety("אני רוצה לברוח מהבית"), true);
});

test('safety HE+: weapon — סכין', () => {
  assert.equal(checkSafety("יש לו סכין ואני מפחד"), true);
});

test('safety HE+: touched me — נגע בי', () => {
  assert.equal(checkSafety("הוא נגע בי בצורה לא נכונה"), true);
});

test('safety HE+: hurt me — פגע בי', () => {
  assert.equal(checkSafety("המורה פגע בי"), true);
});

test('safety HE+: commit suicide — להתאבד', () => {
  assert.equal(checkSafety("אני חושב על להתאבד"), true);
});

// ─── Hebrew new signals ────────────────────────────────────────────────────────

test('safety HE+: הרביץ לי (was beaten)', () => {
  assert.equal(checkSafety("הוא הרביץ לי אתמול"), true);
});

test('safety HE+: מרביץ לי (is beating me)', () => {
  assert.equal(checkSafety("אבא שלי מרביץ לי"), true);
});

test('safety HE+: מרביצים לי (they are beating me)', () => {
  assert.equal(checkSafety("ילדים בכיתה מרביצים לי כל יום"), true);
});

test('safety HE+: בא לי למות (feel like dying)', () => {
  assert.equal(checkSafety("בא לי למות מכמה שזה כואב"), true);
});

test('safety HE+: נגעה בי (female subject touched me)', () => {
  assert.equal(checkSafety("היא נגעה בי בצורה לא נכונה"), true);
});

test('safety HE+: פגעה בי (female subject hurt me)', () => {
  assert.equal(checkSafety("המורה פגעה בי"), true);
});

test('safety HE+: הכתה אותי (female subject hit me)', () => {
  assert.equal(checkSafety("היא הכתה אותי"), true);
});

test('safety HE+: אני לא רוצה להיות פה יותר', () => {
  assert.equal(checkSafety("אני לא רוצה להיות פה יותר"), true);
});

test('safety HE+: לברוח מכאן', () => {
  assert.equal(checkSafety("אני רוצה לברוח מכאן"), true);
});

// ─── Hebrew indirect self-harm (new patterns) ─────────────────────────────────

test('safety HE+: יהיה לכולם יותר טוב בלעדיי (everyone better off without me)', () => {
  assert.equal(checkSafety("אני חושב שיהיה לכולם יותר טוב בלעדיי"), true);
});

test('safety HE+: אף אחד לא יתגעגע אליי (nobody would miss me)', () => {
  assert.equal(checkSafety("אף אחד לא יתגעגע אליי בכלל"), true);
});

test('safety HE+: הלוואי שהייתי נעלם (I wish I could disappear — male)', () => {
  assert.equal(checkSafety("הלוואי שהייתי נעלם מהחיים"), true);
});

test('safety HE+: הלוואי שהייתי נעלמת (I wish I could disappear — female)', () => {
  assert.equal(checkSafety("הלוואי שהייתי נעלמת לגמרי"), true);
});

// ─── Hebrew false-positive regression ────────────────────────────────────────

test('safety HE-: לברוח מהשיעור is NOT a danger signal (bare לברוח removed)', () => {
  assert.equal(checkSafety("אני רוצה לברוח מהשיעור המשעמם הזה"), false);
});

// ─── Negative Hebrew (no danger signals) ────────────────────────────────────

test('safety HE-: normal message about homework', () => {
  assert.equal(checkSafety("שכחתי לעשות שיעורי בית"), false);
});

test('safety HE-: normal message about friends', () => {
  assert.equal(checkSafety("הייתי עם חברים היום"), false);
});

test('safety HE-: normal message about food', () => {
  assert.equal(checkSafety("אני לא אוהב את האוכל בבית ספר"), false);
});

test('safety HE-: normal message about being bored', () => {
  assert.equal(checkSafety("משעמם לי ואין לי מה לעשות"), false);
});

test('safety HE-: normal message about a game', () => {
  assert.equal(checkSafety("הפסדנו במשחק כדורגל היום"), false);
});
