'use strict';
const http = require('node:http');
const { readFile } = require('node:fs/promises');
const { join } = require('node:path');
const cv = require('../api/cv');
const session = require('../api/session');
const port = Number(process.env.PORT || 4173);
const server = http.createServer(async (req, res) => {
  const path = new URL(req.url, `http://${req.headers.host}`).pathname;
  if (path === '/api/cv') return cv(req, res);
  if (path === '/api/session') return session(req, res);
  const files = { '/': ['index.html', 'text/html; charset=utf-8'], '/index.html': ['index.html', 'text/html; charset=utf-8'], '/app.js': ['app.js', 'text/javascript; charset=utf-8'] };
  if (!files[path] || req.method !== 'GET') { res.writeHead(404); return res.end('Not found'); }
  try {
    const [file, type] = files[path];
    res.writeHead(200, { 'Content-Type': type, 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff' });
    res.end(await readFile(join(__dirname, '../public', file)));
  } catch { res.writeHead(500); res.end('Unavailable'); }
});
server.listen(port, '127.0.0.1', () => console.log(`Hero Lab: http://127.0.0.1:${port}`));
