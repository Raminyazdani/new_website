'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { parseHTML } = require('linkedom');

const portfolioRoot = path.join(__dirname, '../public/portfolio');
const files = [
  'design-registry.js',
  'designs/editorial.js',
  'designs/systems.js',
  'designs/experimental.js',
];
const expectedIds = [
  'journal', 'helix', 'organic', 'monograph', 'specimen',
  'pipeline', 'bento', 'atlas-map', 'console', 'blueprint',
  'chromatography', 'gallery', 'dossier', 'kinetic', 'horizon',
];

function loadRegistry() {
  const window = {};
  for (const file of files) {
    new Function('window', fs.readFileSync(path.join(portfolioRoot, file), 'utf8'))(window);
  }
  return window.PortfolioDesigns;
}

const esc = value => String(value ?? '').replace(/[&<>"']/g, char => ({
  '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
})[char]);

function helpers() {
  return {
    e: esc,
    number: value => String(value),
    chips: values => (values || []).map(esc).join(' '),
    link: (url, label) => `<a href="${esc(url)}">${esc(label)}</a>`,
    portrait: (_identity, cls = 'portrait') => `<div class="${esc(cls)}"><img src="https://example.test/portrait.jpg" alt="Synthetic portrait"></div>`,
  };
}

function viewModel() {
  return {
    identity: {
      name: '<img src=x onerror=alert(1)> Synthetic Profile',
      givenName: '<Synthetic>', familyName: 'Profile',
      summary: 'Synthetic summary <script>alert(1)</script>',
      location: 'Example City', roles: ['Researcher', 'Developer'],
    },
    stats: { projects: 2, experience: 1, publications: 1, skills: 2 },
    projects: [
      { id: 'project-a', title: 'Synthetic project A', description: 'Full source description.', tags: ['Biology'], url: 'https://example.test/project-a' },
      { id: 'project-b', title: 'Synthetic project B', description: 'Another source description.', tags: ['Code'] },
    ],
    experience: [{ id: 'role-a', title: 'Synthetic role', organization: 'Example Institute', period: 'Source period', description: 'Source description.', tags: ['Research'] }],
    interests: [{ title: 'Example interest', description: 'Source interest.' }],
  };
}

test('all fifteen portfolio recipes register with complete renderers and metadata', () => {
  const designs = loadRegistry();
  const entries = designs.list();
  assert.deepEqual(entries.map(design => design.id), expectedIds);
  assert.equal(new Set(entries.map(design => design.id)).size, 15);
  assert(entries.every(design => design.name && design.description && design.family && design.signature));
  assert(entries.every(design => ['hero', 'about', 'projects', 'experience'].every(section => typeof design.renderers[section] === 'function')));
  for (const id of expectedIds) assert.equal(designs.has(id), true);
});

test('each recipe renders its own safe hero and four sections from source-backed data', () => {
  const designs = loadRegistry();
  const vm = viewModel();
  const h = helpers();
  const heroMarkup = new Set();

  for (const id of expectedIds) {
    const hero = designs.render(id, 'hero', vm, h);
    assert.equal(typeof hero, 'string', `${id} hero is rendered`);
    assert(hero.includes('id="hero"'), `${id} has the hero section`);
    assert.equal((hero.match(/<h1\b/g) || []).length, 1, `${id} has exactly one primary heading`);
    assert(hero.includes('Synthetic'), `${id} keeps supplied identity content`);
    assert(hero.includes('https://example.test/portrait.jpg'), `${id} keeps the supplied portrait`);
    assert(!hero.includes('<img src=x'), `${id} escapes untrusted identity text`);
    assert(!hero.includes('<script>alert(1)</script>'), `${id} escapes untrusted source summary`);
    heroMarkup.add(hero);

    for (const section of ['about', 'projects', 'experience']) {
      const markup = designs.render(id, section, vm, h);
      assert.equal(typeof markup, 'string', `${id} ${section} is rendered`);
      assert(markup.includes(`id="${section}"`), `${id} includes ${section} section`);
    }
  }
  assert.equal(heroMarkup.size, 15, 'each recipe has a distinct hero composition');
});

test('registry rejects duplicate, malformed, and incomplete designs', () => {
  const designs = loadRegistry();
  const base = { id: 'valid-design', renderers: Object.fromEntries(['hero', 'about', 'projects', 'experience'].map(key => [key, () => ''])) };
  assert.throws(() => designs.register({ ...base, id: '1bad' }), /INVALID_OR_DUPLICATE_DESIGN/);
  assert.throws(() => designs.register({ ...base, id: 'journal' }), /INVALID_OR_DUPLICATE_DESIGN/);
  assert.throws(() => designs.register({ id: 'incomplete', renderers: { hero: () => '' } }), /INCOMPLETE_DESIGN/);
});

test('long profile summaries are excerpted in the hero and preserved in full in About', () => {
  const designs = loadRegistry();
  const source = `<img src=x onerror=alert(1)> ${'complete source phrase '.repeat(28)}. Second source sentence remains available.`;
  const vm = viewModel();
  vm.identity.summary = source;
  const lead = designs.ui.lead(vm, helpers());
  const about = designs.ui.about(vm, helpers());
  const { document: leadDocument } = parseHTML(`<main>${lead}</main>`);
  const { document: aboutDocument } = parseHTML(`<main>${about}</main>`);

  assert(leadDocument.querySelector('.dl-profile-link'), 'a clear link points to the complete profile');
  assert(leadDocument.querySelector('.dl-lead').textContent.length <= 300, 'hero summary remains a bounded excerpt');
  assert.equal(leadDocument.querySelector('.dl-lead').textContent.startsWith('<img src=x onerror=alert(1)>'), true);
  assert.equal(leadDocument.querySelector('.dl-lead img'), null, 'excerpt content is escaped as text');
  const fullAbout = aboutDocument.querySelector('.dl-about-text .dl-lead');
  assert.equal(fullAbout.textContent, source, 'About retains the complete supplied summary verbatim');
  assert.equal(fullAbout.querySelector('img'), null, 'full source markup is escaped as text');
});
