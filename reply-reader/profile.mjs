/**
 * reply-reader/profile.mjs
 *
 * Profile for App 1: reading a customer or prospect's reply.
 * The reader is the person at the business who must answer.
 *
 * Covers: Req 7.1, 7.2
 */

/** @type {import('../skeleton/core.mjs').Profile} */
const profile = {
  id: 'reply-reader',

  sender: 'a customer or prospect who just replied to a message from a small business',

  reader: 'the person at the business who must answer',

  protects: [
    'their time — they are busy and do not want to be chased',
    'budget approval — they cannot say yes without checking with someone else',
    'their standing with their boss — they do not want to look careless',
    'their privacy — they are unsure how the business got their contact details',
    'a bad past experience — a previous vendor let them down',
    'pride in what they already built — they solved this themselves and do not want to admit it is not enough',
    'being rushed — they dislike high-pressure sales tactics',
  ],

  voice:
    'Warm, short, no pressure. Never repeat the pitch. Offer one small next step or none at all. ' +
    'Write as if you are a calm person at a small business, not a sales script.',

  routeGuidance:
    'human when the reply touches privacy or how we got their details, legal words, anger or a ' +
    'complaint, money back, or a risk to the sender standing with their boss; ' +
    'bot-ok for everything else, including polite no, not now, we built our own, and questions ' +
    'about price or features.',

  routeRules: [
    {
      // Privacy — sender is asking about data, origin of contact, or legal exposure
      signals: [
        'how did you get my',
        'where did you get my',
        'who gave you my',
        'privacy',
        'gdpr',
        'data protection',
        'unsubscribe',
        'remove me',
        'stop contacting',
        'opt out',
        'opt-out',
      ],
      route: 'human',
    },
    {
      // Legal / compliance
      signals: [
        'lawyer',
        'attorney',
        'legal',
        'solicitor',
        'compliance',
        'regulation',
      ],
      route: 'human',
    },
    {
      // Escalation to a senior person
      signals: [
        'my boss',
        'my manager',
        'my director',
        'my ceo',
        'my cto',
        'my vp',
        'my head of',
        'our legal',
        'our compliance',
      ],
      route: 'human',
    },
    {
      // Anger, frustration, or complaint
      signals: [
        'angry',
        'furious',
        'unacceptable',
        'disgusted',
        'appalled',
        'terrible',
        'horrible',
        'awful',
        'worst',
        'never again',
        'complaint',
        'complain',
        'sue',
        'report you',
        'report this',
        'refund',
        'money back',
        'charge back',
        'chargeback',
        'scam',
        'fraud',
        'lied',
        'liar',
      ],
      route: 'human',
    },
  ],
};

export default profile;
