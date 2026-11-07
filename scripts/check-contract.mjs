// Kiro PostFileSave hook: the skeleton contract, checked in code.
// An app folder may contain only these files. Anything else means logic
// leaked out of skeleton/ — the agent gets the message on stderr.
import { readdirSync } from 'node:fs';

const APPS = ['reply-reader', 'kid-message'];
const ALLOWED = new Set(['profile.mjs', 'examples.mjs', 'index.html']);

const problems = [];
for (const app of APPS) {
  let files = [];
  try { files = readdirSync(app); } catch { continue; }
  for (const f of files) {
    if (!ALLOWED.has(f)) problems.push(`${app}/${f}`);
  }
}

if (problems.length) {
  process.stderr.write(
    `Skeleton contract broken. Apps may hold only profile.mjs, examples.mjs, index.html.\n` +
    `Move this into skeleton/ behind a profile option: ${problems.join(', ')}\n`
  );
  process.exit(1);
}
console.log('Skeleton contract OK: apps are profile + examples + page.');
