'use strict';

const assert = require('node:assert/strict');
const { createHash } = require('node:crypto');
const { readFileSync, readdirSync } = require('node:fs');
const { join } = require('node:path');
const test = require('node:test');
const { parseHTML } = require('linkedom');

const publicDir = join(__dirname, '../public');
const previewDir = join(publicDir, 'portfolio/previews');

function loadGallery({ compact = false, query = '' } = {}) {
  const { document, Event } = parseHTML(readFileSync(join(publicDir, 'index.html'), 'utf8'));
  const media = { matches: compact, addEventListener() {} };
  const window = { location: new URL(`https://example.test/${query}`), matchMedia: () => media,
    history: { state: null, replaceState(state, title, url) { window.location = new URL(url); } } };
  // linkedom does not implement the browser's writable select value.
  for (const select of document.querySelectorAll('select')) Object.defineProperty(select, 'value', { value: select.id === 'designGalleryCollection' ? 'all' : '', writable: true });
  Object.defineProperty(document.querySelector('#designGallery'), 'open', { get() { return this.hasAttribute('open'); } });
  const galleryScripts = /^\/portfolio\/(?:design-(?:registry|navigation|gallery)\.js|(?:designs|directions|experiments)\/[^/]+\.js|(?:imported-templates|synthesis)\.js)$/;
  for (const script of document.querySelectorAll('script[src]')) {
    const source = script.getAttribute('src');
    if (!galleryScripts.test(source)) continue;
    const code = readFileSync(join(publicDir, source.slice(1)), 'utf8');
    new Function('window', 'document', code)(window, document);
  }
  return { window, document, Event };
}

function webpSize(bytes) {
  assert(bytes.length >= 30 && bytes.toString('ascii', 0, 4) === 'RIFF' && bytes.toString('ascii', 8, 12) === 'WEBP', 'Expected a WebP file');
  assert.equal(bytes.readUInt32LE(4) + 8, bytes.length, 'The full WebP container must be present');
  const codec = bytes.toString('ascii', 12, 16);
  if (codec === 'VP8X') return [bytes.readUIntLE(24, 3) + 1, bytes.readUIntLE(27, 3) + 1];
  if (codec === 'VP8L') {
    assert.equal(bytes[20], 0x2f, 'Expected lossless WebP signature');
    const packed = bytes.readUInt32LE(21);
    return [(packed & 0x3fff) + 1, ((packed >>> 14) & 0x3fff) + 1];
  }
  assert.equal(codec, 'VP8 ', 'Expected a WebP image chunk');
  assert.equal(bytes.subarray(23, 26).toString('hex'), '9d012a', 'Expected lossy WebP frame signature');
  return [bytes.readUInt16LE(26) & 0x3fff, bytes.readUInt16LE(28) & 0x3fff];
}

test('every gallery template points to its own 640 × 400 preview', () => {
  const { window, document } = loadGallery();
  const expected = [
    ...window.PortfolioDesigns.list().map(({ id }) => id),
    ...window.PortfolioImportedTemplates.map(({ id }) => `imported-${id}`),
  ].sort();
  const cards = [...document.querySelectorAll('#designGalleryBody [data-gallery-design]')];
  assert.deepEqual(cards.map(card => card.dataset.galleryDesign).sort(), expected);
  assert.deepEqual(readdirSync(previewDir).sort(), expected.map(id => `${id}.webp`).sort());

  const seen = new Set();
  for (const card of cards) {
    const id = card.dataset.galleryDesign;
    const image = card.querySelector('.dg-preview img');
    assert(image, `Missing preview on ${id}`);
    assert.equal(image.getAttribute('src'), `/portfolio/previews/${id}.webp`);
    assert.equal(image.getAttribute('loading'), 'lazy');
    const bytes = readFileSync(join(previewDir, `${id}.webp`));
    assert.deepEqual(webpSize(bytes), [640, 400], `${id} preview dimensions`);
    const hash = createHash('sha256').update(bytes).digest('hex');
    assert(!seen.has(hash), `${id} has a reused preview file`);
    seen.add(hash);
  }
});

test('compact gallery keeps filters available and recovers all 66 designs from empty search', () => {
  const { window, document, Event } = loadGallery({ compact: true, query: '?gallery=1&theme=dark&design-search=doesnotexist' });
  const toggle = document.querySelector('#designGalleryFilterToggle');
  const filters = document.querySelector('#designGalleryFilters');
  const search = document.querySelector('#designGallerySearch');
  search.focus = () => {};
  assert.equal(toggle.hidden, false);
  assert.equal(filters.hidden, true);
  assert.equal(document.querySelector('#designGalleryEmpty').hidden, false);
  toggle.dispatchEvent(new Event('click', { bubbles: true }));
  assert.equal(toggle.getAttribute('aria-expanded'), 'true');
  assert.equal(filters.hidden, false);
  document.querySelector('[data-reset-design-filters]').dispatchEvent(new Event('click', { bubbles: true }));
  assert.equal(document.querySelectorAll('[data-gallery-design]:not([hidden])').length, 66);
  assert.equal(document.querySelector('#designGalleryEmpty').hidden, true);
  assert.equal(window.location.searchParams.get('design-search'), null);
  assert.equal(window.location.searchParams.get('theme'), 'dark');
  document.querySelector('[data-close-design-gallery]').dispatchEvent(new Event('click', { bubbles: true }));
  assert.equal(window.location.searchParams.has('gallery'), false);
});

test('the Experiences filter shows twelve new layouts and their discipline labels', () => {
  const { document } = loadGallery({ query: '?gallery=1&collection=experiential' });
  const cards = [...document.querySelectorAll('#designGalleryBody [data-gallery-design]')];
  assert.equal(cards.length, 12);
  assert.match(document.querySelector('#designGalleryCollection option[value="experiential"]').textContent, /Experiences \(12\)/);
  const labels = new Set(cards.map(card => card.querySelector('.dg-card-meta > :last-child').textContent));
  assert.deepEqual([...labels].sort(), ['Biology', 'Chemistry', 'Integrated', 'Programming']);
});

test('the Bioinformatics gallery link shows exactly the four new templates and preserves route preferences', () => {
  const { window, document, Event } = loadGallery({ query: '?design=synthesis&gallery=1&collection=bioinformatics&lang=fa&motion=still' });
  const cards = () => [...document.querySelectorAll('#designGalleryBody [data-gallery-design]')];
  const ids = ['microcosm', 'flowcell', 'cellscape', 'foldspace'];
  assert.equal(document.querySelector('#designGalleryCurrent').textContent, 'Current selection: Synthesis');
  assert.equal(document.querySelector('#designGalleryCollection option[value="bioinformatics"]').textContent, 'Bioinformatics · 4');
  assert.deepEqual(cards().map(card => card.dataset.galleryDesign), ids.map(id => `imported-${id}`));
  assert.deepEqual(cards().map(card => card.dataset.galleryFamily), ['life', 'lab', 'data', 'life']);
  assert.deepEqual(cards().map(card => card.querySelector('a').getAttribute('href')), ids.map(id => `/imported/fa/${id}/?motion=still`));

  const search = document.querySelector('#designGallerySearch');
  search.value = 'sequencing';
  search.dispatchEvent(new Event('input', { bubbles: true }));
  assert.deepEqual(cards().filter(card => !card.hidden).map(card => card.dataset.galleryDesign), ['imported-flowcell']);
  assert.equal(window.location.searchParams.get('collection'), 'bioinformatics');
  assert.equal(window.location.searchParams.get('design'), 'synthesis');
});

test('gallery search is restored and updated in the URL without losing design preferences', () => {
  const { window, document, Event } = loadGallery({ query: '?gallery=1&design=strata&theme=dark&motion=still&design-search=herbarium' });
  assert.equal(document.querySelectorAll('[data-gallery-design]:not([hidden])').length, 1);
  const search = document.querySelector('#designGallerySearch');
  search.value = 'helix';
  search.dispatchEvent(new Event('input', { bubbles: true }));
  assert.equal(window.location.searchParams.get('design-search'), 'helix');
  assert.equal(window.location.searchParams.get('design'), 'strata');
  assert.equal(window.location.searchParams.get('motion'), 'still');
  assert.equal(document.querySelectorAll('[data-gallery-design]:not([hidden])').length, 2);
});
