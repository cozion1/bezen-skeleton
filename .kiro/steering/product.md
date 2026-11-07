---
inclusion: always
---

# Product: BEZEN Skeleton

BEZEN is a reading layer for agents. Before an agent answers a person, BEZEN reads
what that person is **protecting** behind their words — their time, their standing
with a boss, their privacy, their pride, a friendship, their safety — and tells the
agent what NOT to do next.

This repository is a **skeleton**: one small core, and two different apps built on it.

| App | Who sends the text | Who reads the result |
|---|---|---|
| `reply-reader/` | A customer or prospect replying to a business | The person at the business who must answer |
| `kid-message/` | A child writing to a parent or a teacher | The parent or teacher |

## The one rule that never bends

Every reading must quote the sender's **exact words**, and the code — not the model —
checks that the quote really appears in the original text. A reading whose quote is
not found is never shown as fact. It is marked `unverified` and the UI says so.

This is the seatbelt. The model reads; the code checks.

## Tone of everything the apps say

- Short sentences. Plain words. No jargon, no psychology labels shown to the user.
- Never diagnose the sender. Describe what they seem to be protecting, not what is wrong with them.
- The suggested next message is written in the reader's voice, ready to send, and is never pushy.

## Safety (kid-message)

If a child's message contains any sign of self-harm, abuse, or danger, the reading
must say so first, in one plain line, and point the adult to talk with the child now
and to get professional help. This check runs in code as well as in the prompt.
