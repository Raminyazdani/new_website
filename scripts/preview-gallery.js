'use strict';

// Run directly with Node. This loopback server never imports the application
// API or reads credentials. It serves the live designs using fictional data.
const http = require('node:http');
const { readFile, realpath } = require('node:fs/promises');
const { readFileSync } = require('node:fs');
const { extname, isAbsolute, join, relative, resolve, sep } = require('node:path');
const { runInNewContext } = require('node:vm');
const previewPortfolio = require('./fixtures/gallery-preview-portfolio');

const publicRoot = resolve(__dirname, '../public');
const port = Number(process.argv[2] || 8800);
if (!Number.isInteger(port) || port < 1 || port > 65535) throw new Error('Invalid preview port');

const types = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.txt': 'text/plain; charset=utf-8',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.webp': 'image/webp',
  '.avif': 'image/avif',
};
const headers = {
  'Cache-Control': 'no-store',
  'X-Content-Type-Options': 'nosniff',
  'Referrer-Policy': 'no-referrer',
  'Content-Security-Policy': "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob:; connect-src 'self'; frame-src 'self'; frame-ancestors 'self'; worker-src 'self' blob:; base-uri 'self'; form-action 'self'",
};

function readCatalog() {
  const context = { window: {}, document: { addEventListener() {} }, URLSearchParams };
  const scripts = [
    'design-registry', 'designs/editorial', 'designs/systems', 'designs/experimental',
    'directions/kit', 'directions/observational', 'directions/systems',
    'directions/expressive', 'imported-templates', 'synthesis',
    'experiments/kit', 'experiments/life', 'experiments/systems',
  ];
  for (const name of scripts) {
    const file = join(publicRoot, 'portfolio', `${name}.js`);
    runInNewContext(readFileSync(file, 'utf8'), context, { filename: file, timeout: 1000 });
  }
  const { PortfolioImportedTemplates: imported, PortfolioDesigns: native } = context.window;
  const item = (collection, design, path) => ({
    key: collection === 'imported' ? `imported-${design.id}` : design.id,
    collection, id: design.id, name: design.name, path,
  });
  const nativeItems = (collection) => native.collection(collection).map(design => {
    const params = new URLSearchParams({
      design: design.id, theme: design.defaultTheme, section: 'hero', clean: '1',
      motion: 'still', background: 'off', __preview: '1',
    });
    return item(collection, design, `/?${params}`);
  });
  return [
    ...imported.map(design => item('imported', design, `/imported/en/${design.id}/?__preview=1`)),
    ...nativeItems('independent'),
    ...nativeItems('previous'),
    ...nativeItems('experiential'),
  ];
}

const templates = readCatalog();
const batchSize = 4;
const escapeHtml = (value) => String(value).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

function captureSheet(items) {
  const tiles = items.map(template => `<div class="tile" data-key="${escapeHtml(template.key)}"><iframe title="${escapeHtml(template.name)}" src="${escapeHtml(template.path)}" scrolling="no"></iframe></div>`).join('');
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>Fictional portfolio capture sheet</title><style>
    html, body { margin: 0; background: #e7e5e4; }
    main { display: grid; grid-template: repeat(2, 400px) / repeat(2, 640px); width: 1280px; height: 800px; }
    .tile { overflow: hidden; }
    iframe { display: block; width: 1280px; height: 800px; border: 0; transform: scale(.5); transform-origin: top left; }
  </style></head><body><main>${tiles}</main></body></html>`;
}

const captureStyle = '<style>html {scrollbar-width:none} html::-webkit-scrollbar {display:none} [data-dock] {visibility:hidden !important;pointer-events:none !important}</style>';

async function staticFile(pathname) {
  const parts = decodeURIComponent(pathname).slice(1).replace(/\/$/, '').split('/').filter(Boolean);
  if (parts.some(part => part.startsWith('.') || /[\\:\x00-\x1f<>"]/.test(part) || /^cv\.json(?:\.|$)/i.test(part))) return null;
  const extension = extname(parts.at(-1) || '');
  if (extension && !Object.hasOwn(types, extension)) return null;
  if (!extension) parts.push('index.html');
  const path = await realpath(join(publicRoot, ...parts));
  const within = relative(publicRoot, path);
  if (!within || isAbsolute(within) || within === '..' || within.startsWith(`..${sep}`)) return null;
  return { path, type: types[extension || '.html'] };
}

http.createServer(async (req, res) => {
  const reply = (status, type, body) => {
    res.writeHead(status, { ...headers, 'Content-Type': type });
    res.end(req.method === 'HEAD' ? undefined : body);
  };
  const plain = 'text/plain; charset=utf-8';
  const host = req.headers.host;
  if (![ `localhost:${port}`, `127.0.0.1:${port}` ].includes(host) || !['GET', 'HEAD'].includes(req.method)) {
    return reply(404, plain, 'Not found');
  }
  try {
    const origin = `http://${host}`;
    const url = new URL(req.url, origin);
    if (url.origin !== origin) return reply(404, plain, 'Not found');
    if (url.pathname === '/api/cv') return reply(200, types['.json'], JSON.stringify(previewPortfolio(origin)));
    const collection = url.searchParams.get('collection');
    const selected = collection ? templates.filter(template => template.collection === collection) : templates;
    if (url.pathname === '/__preview-catalog') return reply(200, types['.json'], JSON.stringify({ total: selected.length, batchSize, templates: selected }));
    if (url.pathname === '/__preview-sheet') {
      const batch = Number(url.searchParams.get('batch') ?? 0);
      if (!Number.isInteger(batch) || batch < 0 || batch * batchSize >= selected.length) return reply(404, plain, 'No such capture batch');
      return reply(200, types['.html'], captureSheet(selected.slice(batch * batchSize, (batch + 1) * batchSize)));
    }
    if (['/__preview-portrait.svg', '/__preview-cover.svg'].includes(url.pathname)) {
      return reply(200, types['.svg'], await readFile(join(__dirname, 'fixtures', url.pathname.replace('/__', 'gallery-'))));
    }
    const file = await staticFile(url.pathname);
    if (!file) return reply(404, plain, 'Not found');
    const bytes = await readFile(file.path);
    const body = file.type === types['.html'] && url.searchParams.get('__preview') === '1'
      ? bytes.toString('utf8').replace('</head>', `${captureStyle}</head>`) : bytes;
    return reply(200, file.type, body);
  } catch (error) {
    if (error instanceof URIError || ['ENOENT', 'ENOTDIR', 'EISDIR'].includes(error.code)) return reply(404, plain, 'Not found');
    return reply(500, plain, 'Preview unavailable');
  }
}).listen(port, '127.0.0.1', () => console.log(`Fictional template capture host: http://localhost:${port}/__preview-sheet?batch=0`));
