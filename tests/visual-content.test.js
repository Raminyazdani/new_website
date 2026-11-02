'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { parseHTML } = require('linkedom');

const sourceRoot = path.join(__dirname, '../public/portfolio');
const escapeHTML = value => String(value ?? '').replace(/[&<>"']/g, ch => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[ch]));

function loadPreviews() {
  const { document, Event } = parseHTML('<!doctype html><html><body><main id="portfolio"></main></body></html>');
  let fetches = 0;
  const win = {};
  const fetch = async () => { fetches++; return { ok: true, headers: { get: () => '5' }, text: async () => '# Public readme' }; };
  new Function('window', 'document', 'fetch', 'setTimeout', 'clearTimeout', 'AbortController', fs.readFileSync(path.join(sourceRoot, 'visual-previews.js'), 'utf8'))(
    win, document, fetch, setTimeout, clearTimeout, AbortController,
  );
  return { win, document, Event, get fetches() { return fetches; } };
}

test('preview cards escape source content and label CV summaries separately from illustrative layouts', () => {
  const { win } = loadPreviews();
  const h = { e: escapeHTML };
  const project = win.PortfolioPreviews.renderProject({ title: '<img src=x onerror=alert(1)>', description: 'A supplied description', tags: ['bio <script>'] }, 0, h);
  assert(!project.includes('<img src=x'));
  assert(!project.includes('<script>'));
  assert(project.includes('&lt;img src=x onerror=alert(1)&gt;'));
  assert(project.includes('Project brief · from CV'));
  assert(/from CV|supplied project details|source description|no implementation diagram supplied|topics from CV/.test(project), 'project preview says its content comes from source records');

  const certificate = win.PortfolioPreviews.renderCertificate({ title: '<script>bad</script>', issuer: 'Example issuer', date: 'source date', url: 'https://example.test/certificate.png', hasCertificate: true }, 0, h);
  assert(!certificate.includes('<script>'));
  assert(certificate.includes('Document cover · from CV'));
  assert(certificate.includes('Source document'));
  assert(certificate.includes('loading="lazy"'));
  assert(!certificate.includes('<iframe'));
});

test('source links accept only safe web URLs and README loading is explicit', async () => {
  const env = loadPreviews();
  const { win, document, Event } = env;
  const api = win.PortfolioPreviews, h = { e: escapeHTML };
  const valid = api.renderReadmeAction({ id: 'repo-1', url: 'https://github.com/example/project' }, h);
  assert(valid.includes('data-vp-readme="repo-1"'));
  assert(valid.includes('Load public GitHub README'));
  for (const url of ['http://github.com/example/project', 'https://github.com.evil.test/a/b', 'https://user@github.com/example/project', 'javascript:alert(1)', 'https://github.com/a/b:443']) {
    assert.equal(api.renderReadmeAction({ id: 'bad', url }, h), '', `rejects unsafe or noncanonical repository URL: ${url}`);
  }
  const action = api.renderDocumentAction({ id: 'cert-1', title: 'Certificate', url: 'javascript:alert(1)' }, h);
  assert.equal(action, '');

  const root = document.querySelector('#portfolio');
  const project = { id: 'repo-1', url: 'https://github.com/example/project' };
  root.innerHTML = valid;
  api.mount(root, { projects: [project], certificates: [] });
  assert.equal(document.querySelector('iframe'), null);
  assert.equal(document.querySelector('[data-vp-readme-output]').textContent, '');
  assert.equal(env.fetches, 0, 'mounting does not fetch a README before an explicit click');
  root.querySelector('[data-vp-readme]').dispatchEvent(new Event('click', { bubbles: true }));
  for (let i = 0; i < 5; i++) await new Promise(resolve => setImmediate(resolve));
  assert.equal(document.querySelector('[data-vp-readme-output] pre')?.textContent, '# Public readme');
  assert.equal(env.fetches, 1);
  api.unmount();
});


test('production permits only the explicit public README API alongside same-origin connections', () => {
  const config = JSON.parse(fs.readFileSync(path.join(__dirname, '../vercel.json'), 'utf8'));
  const csp = config.headers.flatMap(rule => rule.headers).find(header => header.key === 'Content-Security-Policy').value;
  const connect = csp.split(';').map(part => part.trim()).find(part => part.startsWith('connect-src '));
  assert.deepEqual(connect.split(/\s+/).slice(1), ["'self'", 'https://api.github.com']);
  assert(csp.includes("frame-ancestors 'none'"));
  assert(csp.includes("form-action 'self'"));
});
