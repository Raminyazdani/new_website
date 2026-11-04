'use strict';

const assert = require('node:assert/strict');
const { createHash } = require('node:crypto');
const { readFileSync, readdirSync } = require('node:fs');
const { join } = require('node:path');
const test = require('node:test');
const { parseHTML } = require('linkedom');

const publicDir = join(__dirname, '../public');
const previewDir = join(publicDir, 'portfolio/previews');

function loadGallery() {
  const { document } = parseHTML(readFileSync(join(publicDir, 'index.html'), 'utf8'));
  const window = { location: new URL('https://example.test/') };
  const collectionSelect = document.querySelector('#designGalleryCollection');
  // linkedom does not implement the browser's writable select value.
  Object.defineProperty(collectionSelect, 'value', { value: 'all', writable: true });
  const galleryScripts = /^\/portfolio\/(?:design-(?:registry|navigation|gallery)\.js|(?:designs|directions)\/[^/]+\.js|imported-templates\.js)$/;
  for (const script of document.querySelectorAll('script[src]')) {
    const source = script.getAttribute('src');
    if (!galleryScripts.test(source)) continue;
    const code = readFileSync(join(publicDir, source.slice(1)), 'utf8');
    new Function('window', 'document', code)(window, document);
  }
  return { window, document };
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
