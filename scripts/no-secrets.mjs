// Kiro PreToolUse hook: reads the tool call as JSON on stdin and blocks it
// (non-zero exit) when the content looks like an API key. Never blocks on
// input it cannot parse — a broken hook must not stop all writes.
let raw = '';
for await (const chunk of process.stdin) raw += chunk;

const PATTERNS = [
  /sk-ant-[A-Za-z0-9_-]{20,}/, // Anthropic
  /sk-[A-Za-z0-9]{32,}/,       // generic OpenAI-style
  /nfp_[A-Za-z0-9]{30,}/,      // Netlify personal token
  /ghp_[A-Za-z0-9]{30,}/,      // GitHub token
];

const hit = PATTERNS.find((p) => p.test(raw));
if (hit) {
  process.stderr.write(
    'Blocked: this write contains something that looks like a secret key. ' +
    'Keys live in environment variables (process.env), never in files.\n'
  );
  process.exit(2);
}
process.exit(0);
