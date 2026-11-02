'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { parseHTML } = require('linkedom');
const { adaptCV } = require('../public/data/cv-adapter');

const publicRoot = path.join(__dirname, '../public');
const files = ['science.js', 'studio.js', 'studio-intro.js', 'records.js', 'runtime.js'];
const raw = {
  basics: [{
    fname: 'Synthetic', lname: 'Profile',
    summary: 'Exact fictional summary <img src=x onerror=alert(1)> More source text.',
    label: ['Test role'], location: [{ city: 'Example City' }],
    email: 'synthetic@example.test',
    Pictures: [{ type_of: 'profile', URL: 'https://example.test/portrait.jpg' }],
  }],
  profiles: [{ network: 'Code', username: 'Synthetic', url: 'https://example.test/code' }],
  projects: Array.from({ length: 12 }, (_, i) => ({
    title: `Project ${i}`, description: `Full description ${i}`,
    type_key: [i % 2 ? 'Topic B' : 'Topic A'],
  })),
  experiences: [{ role: 'Synthetic role', institution: 'Example organization', duration: 'Source date', description: 'A full role description' }],
  education: [{ institution: 'Example University', area: 'Test field', studyType: 'Degree', startDate: 'not-a-real-date' }],
  publications: [{ title: 'Synthetic research', authors: ['Fictional Author'], status: 'In preparation', year: '2024' }],
  skills: { 'Test domain': { 'Test group': [{ long_name: 'Synthetic skill', short_name: 'Test' }] } },
  workshop_and_certifications: [{
    issuer: 'Example issuer',
    certifications: Array.from({ length: 15 }, (_, i) => ({ name: `Certificate ${i}`, certificate: true, URL: `https://example.test/cert/${i}` })),
  }],
  languages: [{ language: 'Example language', proficiency: { level: 'Source level' } }],
  references: [{ name: 'Fictional Referee', email: 'referee@example.test', institution: 'Example Institute' }],
};

function setSelectValues(document) {
  for (const selector of ['#motionMode', '#studioMotion', '#studioSection', '[data-project-filter]', '[data-cert-issuer]']) {
    const select = document.querySelector(selector);
    if (select) Object.defineProperty(select, 'value', { value: select.value, writable: true, configurable: true });
  }
}

async function boot({ search = '', auth = false, reduce = true, stored = null } = {}) {
  const { document, Event } = parseHTML(fs.readFileSync(path.join(publicRoot, 'index.html'), 'utf8'));
  const selectPrototype = Object.getPrototypeOf(document.querySelector('#motionMode'));
  const nativeSelectValue = Object.getOwnPropertyDescriptor(selectPrototype, 'value');
  Object.defineProperty(selectPrototype, 'value', {
    configurable: true,
    get() { return this.__testValue ?? nativeSelectValue.get.call(this); },
    set(value) {
      this.__testValue = String(value);
      for (const option of this.querySelectorAll('option')) option.selected = option.value === this.__testValue;
    },
  });
  setSelectValues(document);
  const storedValues = new Map(stored ? [['portfolio.design.preferences.v1', JSON.stringify(stored)]] : []);
  const location = { href: `https://example.test/${search}`, search };
  const win = {
    Event,
    PortfolioRenderers: {},
    PortfolioData: {
      load: async () => {
        if (auth) { const error = Error('authentication required'); error.code = 'AUTH_REQUIRED'; throw error; }
        return { raw: structuredClone(raw), model: structuredClone(adaptCV(raw)) };
      },
    },
    localStorage: {
      getItem: key => storedValues.get(key) || null,
      setItem: (key, value) => storedValues.set(key, String(value)),
      removeItem: key => storedValues.delete(key),
    },
    location,
    history: { replaceState(_state, _title, url) { location.href = String(url); location.search = new URL(String(url)).search; } },
    matchMedia: () => ({ matches: reduce, addEventListener() {} }),
    requestAnimationFrame: (() => { let next = 0; return () => ++next; })(),
    cancelAnimationFrame() {},
    addEventListener() {},
    navigator: { clipboard: { writeText: async () => {} } },
  };
  for (const file of files.slice(0, 4)) {
    new Function('window', 'document', fs.readFileSync(path.join(publicRoot, 'portfolio', file), 'utf8'))(win, document);
  }
  new Function('window', 'document', 'fetch', 'setTimeout', 'clearTimeout', fs.readFileSync(path.join(publicRoot, 'portfolio/runtime.js'), 'utf8'))(
    win, document, async () => ({ ok: true }), () => 1, () => {},
  );
  for (let i = 0; i < 4; i++) await new Promise(resolve => setImmediate(resolve));
  const click = selector => {
    const node = document.querySelector(selector);
    assert(node, `missing control ${selector}`);
    node.dispatchEvent(new Event('click', { bubbles: true }));
  };
  return { win, document, Event, click, storedValues };
}

test('unified default combines the three disciplines while preserving the synthetic CV model', async () => {
  const env = await boot();
  const { document, win, click } = env;
  assert.equal(document.querySelector('#portfolio').hidden, false);
  const sections = ['hero', 'about', 'projects', 'experience', 'publications', 'education', 'skills', 'certificates', 'languages', 'references', 'contact'];
  for (const id of sections) assert(document.querySelector(`#portfolio #${id}`), `missing ${id}`);
  assert.equal(document.querySelectorAll('[data-project-card]').length, 12);
  assert.equal(document.querySelectorAll('[data-cert-card]').length, 15);
  assert.equal(document.querySelectorAll('#references details[open]').length, 0);
  assert.equal(document.querySelector('#hero h1').textContent.replace(/\s+/g, ''), 'SyntheticProfile');
  assert.equal(win.PortfolioStudio.concept, 'unified');
  assert(document.querySelector('#hero [data-science="cell"]'), 'unified hero keeps the cell illustration');
  assert(document.querySelector('#hero .st-code-frame'), 'unified hero includes the code identity frame');
  assert(document.querySelector('#about [data-science="molecule"]'), 'unified profile includes molecular art');
  assert(document.querySelector('[data-project-card].st-project-terminal'), 'unified projects use notebook cards');
  assert(document.querySelector('.st-timeline-molecular'), 'unified experience uses the molecular path');
  assert.equal(document.querySelector('.pf-portrait img')?.getAttribute('src'), 'https://example.test/portrait.jpg');
  assert(document.querySelector('#about').textContent.includes('Exact fictional summary'));
  assert.equal(document.querySelectorAll('#portfolio img[onerror]').length, 0);
  assert.deepStrictEqual(win.portfolioView.raw, raw);

  for (const [choice, concept, projectClass] of [
    ['atlas', 'atlas', 'st-project-atlas'],
    ['molecular', 'molecular', 'st-project-molecular'],
    ['terminal', 'terminal', 'st-project-terminal'],
  ]) {
    click(`[data-concept-choice="${choice}"]`);
    assert.equal(win.PortfolioStudio.concept, concept);
    assert(document.body.dataset.concept === concept);
    assert(document.querySelector('#hero').classList.contains(`st-${concept}`));
    assert(document.querySelector('[data-project-card]').classList.contains(projectClass));
    assert.equal(document.querySelector('#hero h1').textContent.replace(/\s+/g, ''), 'SyntheticProfile');
    assert.equal(document.querySelectorAll('[data-project-card]').length, 12);
    assert.deepStrictEqual(win.portfolioView.raw, raw);
  }
});

test('section isolation, validated query preferences, themes and motion controls stay scoped', async () => {
  const invalid = await boot({ search: '?design=unknown&theme=unknown&section=%3Cscript%3E' });
  assert.equal(invalid.win.PortfolioStudio.concept, 'unified');
  assert.equal(invalid.win.PortfolioStudio.theme, 'light');
  assert.equal(invalid.win.PortfolioStudio.section, 'all');

  const valid = await boot({ search: '?edition=exploration&design=terminal&theme=dark&section=projects', reduce: true });
  const { document, click, Event, win } = valid;
  assert.equal(win.PortfolioStudio.concept, 'terminal');
  assert.equal(win.PortfolioStudio.theme, 'dark');
  assert.equal(win.PortfolioStudio.section, 'projects');
  assert(document.body.classList.contains('studio-isolated'));
  assert(document.querySelector('#projects').hasAttribute('data-studio-selected'));
  assert(!document.querySelector('#hero').hasAttribute('data-studio-selected'));
  const section = document.querySelector('#studioSection');
  section.value = 'hero';
  section.dispatchEvent(new Event('change', { bubbles: true }));
  assert(document.querySelector('#hero').hasAttribute('data-studio-selected'));
  assert(!document.querySelector('#projects').hasAttribute('data-studio-selected'));
  click('#hero .st-primary[href="#projects"]');
  assert.equal(win.PortfolioStudio.section, 'projects');
  assert(document.querySelector('#projects').hasAttribute('data-studio-selected'));
  click('[data-show-all]');
  assert.equal(win.PortfolioStudio.section, 'all');
  assert(!document.body.classList.contains('studio-isolated'));
  for (const id of ['hero', 'about', 'projects', 'references']) assert(document.querySelector(`#${id}`).hasAttribute('data-studio-selected'));

  click('[data-theme-choice="light"]');
  assert.equal(document.body.dataset.theme, 'light');
  click('[data-theme-choice="dark"]');
  assert.equal(document.body.dataset.theme, 'dark');
  assert.equal(win.PortfolioStudio.concept, 'terminal');
  assert.equal(win.PortfolioStudio.section, 'all');
  const preferences = JSON.parse(valid.storedValues.get('portfolio.design.preferences.v1'));
  assert.deepStrictEqual(preferences, { concept: 'terminal', theme: 'dark' });

  assert.equal(document.body.dataset.motion, 'auto');
  assert.equal(document.body.dataset.effects, 'off');
  const motion = document.querySelector('#studioMotion');
  motion.value = 'full';
  motion.dispatchEvent(new Event('change', { bubbles: true }));
  assert.equal(win.portfolioView.motionMode, 'full');
  assert.equal(document.body.dataset.effects, 'on');
  motion.value = 'still';
  motion.dispatchEvent(new Event('change', { bubbles: true }));
  assert.equal(win.portfolioView.motionMode, 'still');
  assert.equal(document.body.dataset.effects, 'off');
  assert.equal(win.PortfolioStudio.theme, 'dark');
});

test('legacy design URLs upgrade to unified; archived explorations require an explicit edition', async () => {
  for (const design of ['atlas', 'molecular', 'terminal']) {
    const legacy = await boot({ search: `?design=${design}` });
    assert.equal(legacy.win.PortfolioStudio.concept, 'unified', `${design} URL without edition upgrades`);
  }
  for (const design of ['atlas', 'molecular', 'terminal']) {
    const archived = await boot({ search: `?edition=exploration&design=${design}` });
    assert.equal(archived.win.PortfolioStudio.concept, design, `${design} remains available in exploration edition`);
    assert(archived.document.querySelector('#hero').classList.contains(`st-${design}`));
  }
});

test('private gate withholds the profile; logout clears model and rendered contact data', async () => {
  const locked = await boot({ auth: true });
  assert.equal(locked.document.querySelector('#accessForm').hidden, false);
  assert.equal(locked.document.querySelector('#portfolio').textContent, '');

  const env = await boot();
  assert.equal(env.document.querySelectorAll('#references details[open]').length, 0);
  env.click('#logoutBtn');
  for (let i = 0; i < 4; i++) await new Promise(resolve => setImmediate(resolve));
  assert.equal(env.win.portfolioView.model, null);
  assert.equal(env.win.portfolioView.raw, null);
  assert.equal(env.document.querySelector('#portfolio').textContent, '');
  assert.equal(env.document.querySelector('#accessForm').hidden, false);
});

test('illustrative geometry stays finite and its explicit rotate control changes coordinates', async () => {
  const { win, document, click } = await boot();
  click('[data-concept-choice="molecular"]');
  for (const kind of ['molecule', 'protein']) {
    const geometry = win.PortfolioScience.geometry(kind);
    assert(geometry.points.length > 0);
    const points = win.PortfolioScience.project(geometry.points, 0.4, 0.2);
    assert(points.every(point => Object.values(point).every(Number.isFinite)));
    assert(geometry.bonds.every(([from, to]) => from < geometry.points.length && to < geometry.points.length));
  }
  const scene = document.querySelector('[data-science="molecule"]');
  assert(scene.querySelector('svg').getAttribute('aria-label').includes('three-dimensional geometry'));
  assert(scene.querySelector('figcaption').textContent.includes('illustrative'));
  const node = scene.querySelector('circle');
  const initial = [node.getAttribute('cx'), node.getAttribute('cy')];
  click('[data-science-turn]');
  assert.notDeepEqual([node.getAttribute('cx'), node.getAttribute('cy')], initial);
  assert([...scene.querySelectorAll('circle')].every(circle => Number.isFinite(Number(circle.getAttribute('cx'))) && Number.isFinite(Number(circle.getAttribute('cy')))));
});

test('project search, open detail, and project/certificate pagination survive concept changes', async () => {
  const env = await boot();
  const { document, click, Event, win } = env;
  click('[data-project-more]');
  click('[data-cert-more]');
  assert.equal(document.querySelectorAll('[data-project-card]:not([hidden])').length, 12);
  assert.equal(document.querySelectorAll('[data-cert-card]:not([hidden])').length, 12);
  const search = document.querySelector('[data-project-search]');
  search.value = 'Project 11';
  search.dispatchEvent(new Event('input', { bubbles: true }));
  assert.equal(document.querySelectorAll('[data-project-card]:not([hidden])').length, 1);
  click('[data-open-project="project-11"]');
  assert(document.querySelector('#projectDialog').hasAttribute('open'));
  assert(document.querySelector('#projectDialogBody').textContent.includes('Full description 11'));

  const issues = [];
  for (const concept of ['molecular', 'terminal', 'atlas']) {
    click(`[data-concept-choice="${concept}"]`);
    assert.equal(document.querySelector('[data-project-search]').value, 'Project 11');
    assert.equal(document.querySelector('[data-project-card]:not([hidden])')?.dataset.projectId, 'project-11');
    assert(document.querySelector('#projectDialog').hasAttribute('open'));
    assert(document.querySelector('#projectDialogBody').textContent.includes('Full description 11'));
    const visibleProjects = document.querySelectorAll('[data-project-card]:not([hidden])').length;
    const visibleCertificates = document.querySelectorAll('[data-cert-card]:not([hidden])').length;
    if (visibleProjects !== 1) issues.push(`${concept}: filtered project count ${visibleProjects}, expected 1`);
    if (visibleCertificates !== 12) issues.push(`${concept}: visible certificate page ${visibleCertificates}, expected 12`);
  }
  assert.deepStrictEqual(issues, []);
});
