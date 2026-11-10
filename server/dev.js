'use strict';
const http = require('node:http');
const { readFile } = require('node:fs/promises');
const { join } = require('node:path');
const { serveImported } = require('./imported-static');
const cv = require('../api/cv');
const session = require('../api/session');
const port = Number(process.env.PORT || 4173);
const server = http.createServer(async (req, res) => {
  const path = new URL(req.url, `http://${req.headers.host}`).pathname;
  if (path === '/api/cv') return cv(req, res);
  if (path === '/api/session') return session(req, res);
  if (path === '/imported' || path.startsWith('/imported/')) return serveImported(req, res, path);
  const files = { '/': ['index.html', 'text/html; charset=utf-8'], '/index.html': ['index.html', 'text/html; charset=utf-8'], '/app.js': ['app.js', 'text/javascript; charset=utf-8'] };
  files['/hero-base.css'] = ['hero-base.css', 'text/css; charset=utf-8'];
  files['/lab.html'] = ['lab.html', 'text/html; charset=utf-8'];
  for (const file of ['cv-adapter', 'portfolio-source']) {
    files[`/data/${file}.js`] = [`data/${file}.js`, 'text/javascript; charset=utf-8'];
  }
  for (const file of ['runtime', 'intro', 'records', 'science', 'studio', 'studio-intro', 'hero-scene', 'scroll-story', 'pointer-effects', 'background-effects', 'visual-previews', 'portfolio-insights', 'design-registry', 'design-navigation', 'design-gallery', 'imported-templates', 'motion-system', 'synthesis', 'synthesis-scene']) {
    files[`/portfolio/${file}.js`] = [`portfolio/${file}.js`, 'text/javascript; charset=utf-8'];
  }
  for (const file of ['base', 'intro', 'records', 'studio', 'studio-intro', 'hero-scene', 'scroll-story', 'pointer-effects', 'background-effects', 'visual-previews', 'portfolio-insights', 'design-system', 'design-gallery', 'craft', 'motion-system', 'synthesis']) {
    files[`/portfolio/${file}.css`] = [`portfolio/${file}.css`, 'text/css; charset=utf-8'];
  }
  for (const group of ['editorial','systems','experimental']) {
    for (const ext of ['js','css']) files[`/portfolio/designs/${group}.${ext}`]=[`portfolio/designs/${group}.${ext}`,ext==='js'?'text/javascript; charset=utf-8':'text/css; charset=utf-8'];
  }
  for (const file of ['kit.js','foundation.css','observational.js','observational.css','systems.js','systems.css','expressive.js','expressive.css']) {
    files[`/portfolio/directions/${file}`]=[`portfolio/directions/${file}`,file.endsWith('.js')?'text/javascript; charset=utf-8':'text/css; charset=utf-8'];
  }
  files['/fonts/directions-fonts.css']=['fonts/directions-fonts.css','text/css; charset=utf-8'];
  files['/fonts/SOURCES.json']=['fonts/SOURCES.json','application/json; charset=utf-8'];
  for (const font of ['fraunces','spacegrotesk','barlowcondensed','ibmplexmono']) {
    files[`/fonts/${font}-latin.woff2`]=[`fonts/${font}-latin.woff2`,'font/woff2'];
    files[`/fonts/${font}-OFL.txt`]=[`fonts/${font}-OFL.txt`,'text/plain; charset=utf-8'];
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
  if (/^\/portfolio\/previews\/[a-z][a-z0-9-]*\.webp$/.test(path)) {
    files[path] = [path.slice(1), 'image/webp'];
  }
  if (!files[path] || req.method !== 'GET') { res.writeHead(404); return res.end('Not found'); }
  try {
    const [file, type] = files[path];
    const bytes = await readFile(join(__dirname, '../public', file));
    res.writeHead(200, { 'Content-Type': type, 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff' });
    res.end(bytes);
  } catch (error) {
    res.writeHead(error.code === 'ENOENT' ? 404 : 500);
    res.end(error.code === 'ENOENT' ? 'Not found' : 'Unavailable');
  }
});
server.listen(port, '127.0.0.1', () => console.log(`Hero Lab: http://127.0.0.1:${port}`));
