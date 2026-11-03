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
  files['/hero-base.css'] = ['hero-base.css', 'text/css; charset=utf-8'];
  files['/lab.html'] = ['lab.html', 'text/html; charset=utf-8'];
  for (const file of ['cv-adapter', 'portfolio-source']) {
    files[`/data/${file}.js`] = [`data/${file}.js`, 'text/javascript; charset=utf-8'];
  }
  for (const file of ['runtime', 'intro', 'records', 'science', 'studio', 'studio-intro', 'hero-scene', 'scroll-story', 'pointer-effects', 'background-effects', 'visual-previews', 'portfolio-insights', 'design-registry', 'design-gallery']) {
    files[`/portfolio/${file}.js`] = [`portfolio/${file}.js`, 'text/javascript; charset=utf-8'];
  }
  for (const file of ['base', 'intro', 'records', 'studio', 'studio-intro', 'hero-scene', 'scroll-story', 'pointer-effects', 'background-effects', 'visual-previews', 'portfolio-insights', 'design-system', 'design-gallery']) {
    files[`/portfolio/${file}.css`] = [`portfolio/${file}.css`, 'text/css; charset=utf-8'];
  }
  for (const group of ['editorial','systems','experimental']) {
    for (const ext of ['js','css']) files[`/portfolio/designs/${group}.${ext}`]=[`portfolio/designs/${group}.${ext}`,ext==='js'?'text/javascript; charset=utf-8':'text/css; charset=utf-8'];
  }
  for (const group of ['a', 'b', 'c']) {
    files[`/designs/collection-${group}.js`] = [`designs/collection-${group}.js`, 'text/javascript; charset=utf-8'];
    files[`/designs/collection-${group}.css`] = [`designs/collection-${group}.css`, 'text/css; charset=utf-8'];
  }
  files['/editions/bioteal/'] = ['editions/bioteal/index.html', 'text/html; charset=utf-8'];
  files['/editions/bioteal/index.html'] = files['/editions/bioteal/'];
  for (const file of ['base.css','intro.css','intro.js','records.css','records.js','runtime.js']) {
    files[`/editions/bioteal/portfolio/${file}`] = [`editions/bioteal/portfolio/${file}`, file.endsWith('.css') ? 'text/css; charset=utf-8' : 'text/javascript; charset=utf-8'];
  }
  files['/design-notes.html'] = ['design-notes.html','text/html; charset=utf-8'];
  files['/portfolio/design-catalog.json'] = ['portfolio/design-catalog.json','application/json; charset=utf-8'];
  if (!files[path] || req.method !== 'GET') { res.writeHead(404); return res.end('Not found'); }
  try {
    const [file, type] = files[path];
    res.writeHead(200, { 'Content-Type': type, 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff' });
    res.end(await readFile(join(__dirname, '../public', file)));
  } catch { res.writeHead(500); res.end('Unavailable'); }
});
server.listen(port, '127.0.0.1', () => console.log(`Hero Lab: http://127.0.0.1:${port}`));
