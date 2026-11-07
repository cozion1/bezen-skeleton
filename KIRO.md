# How Kiro built this

## Who built it, and how

I'm Zion Cohen. I work with one hand and can't sit at a desk for long, so I can't spend hours in an IDE. I needed a way to build where I decide **what** gets built and an agent does the typing.

So the whole project ran on **Kiro CLI 3.1.0, headless, on Windows 11 (PowerShell)**. An AI assistant (Claude Code) worked with me as a project manager: together we wrote the steering files and the requirements, then it ran Kiro from the terminal, one spec step at a time, and reviewed every result before the next step. **Kiro wrote the design, the task plan, the skeleton and both apps.** What was written by hand is listed at the end, so nothing is hidden.

The entire build used **about 21 of the 50 free monthly credits** (the 4,000-credit request was still pending). That constraint shaped several decisions below.

## Spec-driven development

1. **Requirements first, in EARS form** (`.kiro/specs/bezen-skeleton/requirements.md`): 9 requirements, each with WHEN / THEN / SHALL acceptance criteria. The most important one is Requirement 4, *the seatbelt*: every reading must quote the person's exact words, and **code, not the model,** checks that the quote really appears in the message.
2. **Kiro wrote `design.md` and `tasks.md` from the requirements** in one headless run, for about 1 credit: a mermaid architecture diagram, every module's function signatures, the prompt layout, the error table, and a 12-task plan where each task names the requirements it covers.
3. **Kiro executed the plan in two runs**: tasks 1–7 (the core) and tasks 8–12 (the two apps, the pages, the landing page, the README), ticking the checkboxes as it went.
4. **Review rounds**, also executed by Kiro: after each run the code was read and tested, and the findings went back to Kiro as a short numbered list. Four rounds, about 10 fixes.

**Compared with vibe coding:** the spec made review cheap. When something was wrong, the question was always "which requirement does this break?", and the fix went to the requirement or to the code, never to a vague prompt. One fix went to the requirement itself (next section).

## Property-based testing caught a bug in the spec, not the code

The seatbelt has two property-based tests (fast-check). On the first run, one failed:

> **Counterexample:** text = `" "`, quote = `" "`

Requirement 4.4 said *every substring of the text must verify*. Requirement 4.3 said *an empty quote must never verify*. A single space is both a substring and, after normalization, empty. **The two requirements contradicted each other.** No unit test would have found this, because no human writes that test case.

The fix went to the spec: 4.4 now holds for substrings with at least one non-whitespace character, and the requirement records that it was *found by property-based testing*. Kiro then updated the test generator to match.

## Steering

Three always-included files in `.kiro/steering/`:

- **product.md**: what BEZEN is, the one rule that never bends (the seatbelt), the tone (plain words, never diagnose the sender), and the safety rule for children's messages.
- **tech.md**: plain ES modules, no framework, no build step; the model call is *injected* as a function so the core never imports Anthropic or Netlify code; 2,000-character limit; a daily cost guard.
- **structure.md**: the **skeleton contract**: *an app is only a profile and a page*. If an app needs new logic, it goes into `skeleton/` behind a profile option.

The contract made the biggest difference. When live testing showed the reply app needed a "hand this to a person" badge, Kiro added `showRoute` to the skeleton as an option, and the app only turned it on. The second app never had to change.

## Hooks

Three hooks in `.kiro/hooks/`:

| Hook | Trigger | What it does |
|---|---|---|
| `test-on-save.json` | `PostFileSave` on any `.mjs` in the skeleton or an app | runs `node --test`; failures go back to the agent |
| `skeleton-contract.json` | `PostFileSave` in an app folder | `scripts/check-contract.mjs` fails if an app folder holds anything besides `profile.mjs`, `examples.mjs`, `index.html` |
| `no-secrets.json` | `PreToolUse` on write tools | `scripts/no-secrets.mjs` blocks any write that looks like an API key |

**A lesson about credits:** the contract hook started as an *agent* hook (a prompt telling Kiro to re-check the contract). Kiro's docs say agent hooks start a new agent loop and use credits, while command hooks don't. On a 50-credit budget that matters, so it became a deterministic command hook. It enforces the same rule, for free, every time.

## Least privilege

Kiro ran with `--trust-tools=read,write`: it could read and write files, and nothing else. It never had shell access. The tests ran through the hook and by hand. With only read and write, Kiro couldn't run a dangerous command even by mistake, and we never needed more.

## What live testing found, and Kiro fixed

The apps were tested in a real browser against the real model before publishing. Each finding went back to Kiro:

- The keyword rule `sue` (for legal threats) fired on the word **issue**. Kiro switched every keyword rule to Unicode-aware whole-word matching, which also works for Hebrew.
- The model sent the harmless reply *"we built our own"* to a human, because nothing told it what "route" means. Kiro added `routeGuidance` to the profile, so each app defines its own routing in words.
- The model caught an indirect danger sign (*"everyone would be better off without me"*) that the code check missed. Kiro added it, and similar phrases in English and Hebrew, to the code-level safety check, because safety must not depend on the model alone.
- Keyword rules may only **escalate** to a human, never downgrade the model's call.

## Not used, honestly

MCP servers, Powers and Kiro Crew were not used in this project. The work fit in specs, steering and hooks, and the free credit budget argued for keeping it small.

## Written by hand (not by Kiro)

- The steering files and `requirements.md` (with the assistant, before Kiro started)
- The three hook files and their two scripts (`scripts/no-secrets.mjs`, `scripts/check-contract.mjs`)
- `scripts/dev.mjs`: a small local server, because `netlify dev` would not start in this environment
- Two small fixes: the parser kept a `"true"` string from the model, and the model call now reads every text block (newer models can return a thinking block first), with a test for each
- Small README edits

Everything else in `skeleton/`, `reply-reader/`, `kid-message/` and `netlify/functions/`, and all 150 tests, was written by Kiro from the spec.
