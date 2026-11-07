// Local dev server — no Netlify CLI needed.
// Serves the static pages and routes /api/read-* to the same function
// modules Netlify runs in production.
//
//   ANTHROPIC_API_KEY=... node scripts/dev.mjs      then open http://localhost:8888
import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { extname, join, normalize, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

const ROOT = resolve(import.meta.dirname, '..');
const PORT = Number(process.env.PORT || 8888);

const FUNCTIONS = {
  '/api/read-reply': 'netlify/functions/read-reply.mjs',
  '/api/read-kid': 'netlify/functions/read-kid.mjs',
};

const TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.ico': 'image/x-icon',
  '.json': 'application/json',
};

const handlers = {};
for (const [route, file] of Object.entries(FUNCTIONS)) {
  handlers[route] = (await import(pathToFileURL(join(ROOT, file)))).default;
}

createServer(async (req, res) => {
  const url = new URL(req.url, `http://localhost:${PORT}`);

  // Functions
  const handler = handlers[url.pathname];
  if (handler) {
    const chunks = [];
    for await (const c of req) chunks.push(c);
    const request = new Request(url, {
      method: req.method,
      headers: req.headers,
      body: ['GET', 'HEAD'].includes(req.method) ? undefined : Buffer.concat(chunks),
    });
    const response = await handler(request);
    res.writeHead(response.status, Object.fromEntries(response.headers));
    res.end(Buffer.from(await response.arrayBuffer()));
    return;
  }

  // Static files (never outside the project, never dot-folders)
  let path = decodeURIComponent(url.pathname);
  if (path.endsWith('/')) path += 'index.html';
  const file = normalize(join(ROOT, path));
  if (!file.startsWith(ROOT) || /[\\/]\./.test(file.slice(ROOT.length))) {
    res.writeHead(404).end('Not found');
    return;
  }
  try {
    const body = await readFile(file);
    res.writeHead(200, { 'Content-Type': TYPES[extname(file)] || 'application/octet-stream' });
    res.end(body);
  } catch {
    res.writeHead(404).end('Not found');
  }
}).listen(PORT, () => console.log(`BEZEN Skeleton dev server: http://localhost:${PORT}`));
