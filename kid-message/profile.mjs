/**
 * kid-message/profile.mjs
 *
 * Profile for App 2: reading a child or teenager's message.
 * The reader is the parent or teacher who must respond.
 *
 * Covers: Req 8.1, 8.2, 8.3
 */

/** @type {import('../skeleton/core.mjs').Profile} */
const profile = {
  id: 'kid-message',

  sender: 'a child or teenager writing to a parent or a teacher',

  reader: 'the parent or teacher who received the message',

  protects: [
    'not being a burden — they do not want to worry the adult',
    "a friend's secret — they promised not to tell, loyalty matters to them",
    'fear of punishment — they expect to get in trouble if they are honest',
    'embarrassment in front of their peers — they cannot risk looking uncool',
    'wanting to be trusted — they need to feel the adult sees them as capable',
    'loyalty to the other parent — they do not want to take sides or cause conflict',
    'their own safety — something may be wrong but they do not know how to say it',
  ],

  voice:
    'One or two short sentences the adult can say out loud right now. ' +
    'Warm and calm — this may be a worried parent reading this. ' +
    'No lecture. No question that starts with "why". ' +
    'Leave the door open for the child to say more if they want to.',

  safety: true,
};

export default profile;
