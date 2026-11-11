'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { parseHTML } = require('linkedom');
const { adaptCV } = require('../public/data/cv-adapter');
const previewPortfolio = require('../scripts/fixtures/gallery-preview-portfolio');

const publicRoot = path.join(__dirname, '../public');
const files = ['science.js', 'hero-scene.js', 'scroll-story.js', 'pointer-effects.js', 'visual-previews.js', 'portfolio-insights.js', 'design-registry.js', 'designs/editorial.js', 'designs/systems.js', 'designs/experimental.js', 'design-navigation.js', 'design-gallery.js', 'studio.js', 'studio-intro.js', 'records.js'];
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
  for (const selector of ['#motionMode', '#studioMotion', '#studioSection', '#designGalleryFamily', '#designGalleryCollection', '[data-project-filter]', '[data-cert-issuer]']) {
    const select = document.querySelector(selector);
    if (select) Object.defineProperty(select, 'value', { value: select.value, writable: true, configurable: true });
  }
}

async function boot({ search = '', auth = false, reduce = true, stored = null, independent = false, imported = false, synthesis = false, experiences = false, model = null, width = 1280 } = {}) {
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
  const location = {
    href: `https://example.test/${search}`,
    search,
    assign(target) {
      const url = new URL(target, this.href);
      this.href = url.href;
      this.search = url.search;
    },
  };
  let cvLoads = 0;
  const win = {
    Event,
    PortfolioRenderers: {},
    PortfolioData: {
      load: async () => {
        cvLoads++;
        if (auth) { const error = Error('authentication required'); error.code = 'AUTH_REQUIRED'; throw error; }
        return { raw: structuredClone(raw), model: structuredClone(model || adaptCV(raw)) };
      },
    },
    localStorage: {
      getItem: key => storedValues.get(key) || null,
      setItem: (key, value) => storedValues.set(key, String(value)),
      removeItem: key => storedValues.delete(key),
    },
    location,
    history: { replaceState(_state, _title, url) { location.href = String(url); location.search = new URL(String(url)).search; } },
    matchMedia: query => {
      const maxWidth = /\(max-width:\s*(\d+)px\)/.exec(query)?.[1];
      return { matches: maxWidth ? width <= Number(maxWidth) : reduce, addEventListener() {}, removeEventListener() {} };
    },
    innerWidth: width,
    innerHeight: 800,
    requestAnimationFrame: (() => { let next = 0; return () => ++next; })(),
    cancelAnimationFrame() {},
    addEventListener() {},
    removeEventListener() {},
    navigator: { clipboard: { writeText: async () => {} } },
  };
  const galleryIndex = files.indexOf('design-gallery.js');
  const loadedFiles = [
    ...files.slice(0, galleryIndex),
    ...(independent ? ['directions/kit.js', 'directions/observational.js', 'directions/systems.js', 'directions/expressive.js'] : []),
    ...(imported ? ['imported-templates.js'] : []),
    ...files.slice(galleryIndex),
  ];
  if (synthesis || experiences) {
    loadedFiles.splice(loadedFiles.indexOf('design-gallery.js'), 0,
      'synthesis-scene.js', 'synthesis-journey.js', 'synthesis-workbench.js', 'synthesis.js');
  }
  if (experiences) loadedFiles.splice(loadedFiles.indexOf('design-gallery.js'),0,'experiments/kit.js','experiments/life.js','experiments/systems.js');
  for (const file of loadedFiles) {
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
  return { win, document, Event, click, storedValues, get cvLoads() { return cvLoads; } };
}

test('archival Connected Science combines the three disciplines while preserving the synthetic CV model', async () => {
  const env = await boot({search:'?design=unified'});
  const { document, win, click } = env;
  assert.equal(document.querySelector('#portfolio').hidden, false);
  const sections = ['hero', 'about', 'projects', 'experience', 'publications', 'education', 'skills', 'certificates', 'languages', 'references', 'contact'];
  for (const id of sections) assert(document.querySelector(`#portfolio #${id}`), `missing ${id}`);
  assert(document.querySelector('#about [data-story]'), 'scroll story is integrated into the About section');
  assert.equal(document.querySelectorAll('#portfolio [data-story-chapter]').length, 3);
  assert.equal(document.querySelectorAll('[data-project-card]').length, 12);
  assert.equal(document.querySelectorAll('[data-cert-card]').length, 15);
  assert.equal(document.querySelectorAll('.insight-bar').length, 1);
  assert.equal(document.querySelector('.insight-bar b').textContent, '1');
  assert(document.querySelector('.insight-skills figcaption').textContent.includes('Counts, rather than proficiency scores.'));
  assert.equal(document.querySelectorAll('#references details[open]').length, 0);
  assert.equal(document.querySelector('#hero h1').textContent.replace(/\s+/g, ''), 'SyntheticProfile');
  assert.equal(win.PortfolioStudio.concept, 'unified');
  assert(document.querySelector('#hero [data-hero-scene]'), 'unified hero uses the integrated scene');
  assert(document.querySelector('#hero [data-hs-cell]'), 'integrated hero includes cell geometry');
  assert(document.querySelector('#hero .hs-bond-graph [data-hs-bond]'), 'integrated hero includes molecular bonds');
  assert(document.querySelector('#hero .hs-source'), 'integrated hero includes the code identity panel');
  assert(document.querySelector('#hero .hs-person .hs-portrait'), 'integrated hero includes the portrait');
  assert(document.querySelector('#about [data-science="molecule"]'), 'unified profile includes molecular art');
  assert(document.querySelector('[data-project-card].st-project-terminal'), 'unified projects use notebook cards');
  assert(document.querySelector('.st-timeline-molecular'), 'unified experience uses the molecular path');
  assert.equal(document.querySelector('#hero .hs-person img')?.getAttribute('src'), 'https://example.test/portrait.jpg');
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
  assert.deepStrictEqual(preferences, { concept: 'terminal', theme: 'dark', pointer: true, background: 'silk' });

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

test('URL motion initializes both controls and selecting Still persists without replacing source content', async () => {
  const env = await boot({ independent: true, search: '?design=signal&motion=full', reduce: true });
  const { document, win, Event } = env;
  const headerMotion = document.querySelector('#motionMode');
  const studioMotion = document.querySelector('#studioMotion');
  assert.equal(headerMotion.value, 'full');
  assert.equal(studioMotion.value, 'full', 'Studio mirrors the URL motion on first render');
  assert.equal(document.body.dataset.effects, 'on');
  const sourceContent = document.querySelector('#portfolio').textContent;
  const sourceModel = win.portfolioView.model;
  const loads = env.cvLoads;

  studioMotion.value = 'still';
  studioMotion.dispatchEvent(new Event('change', { bubbles: true }));
  assert.equal(headerMotion.value, 'still');
  assert.equal(studioMotion.value, 'still');
  assert.equal(win.portfolioView.motionMode, 'still');
  assert.equal(document.body.dataset.effects, 'off');
  assert.equal(new URL(win.location.href).searchParams.get('motion'), 'still', 'the URL no longer retains the original full override');
  assert.equal(env.cvLoads, loads, 'changing motion does not refetch the CV');
  assert.strictEqual(win.portfolioView.model, sourceModel, 'changing motion retains the loaded model');
  assert.equal(document.querySelector('#portfolio').textContent, sourceContent, 'all readable source content remains present');

  const reloaded = await boot({ independent: true, search: new URL(win.location.href).search, reduce: true });
  assert.equal(reloaded.document.querySelector('#motionMode').value, 'still');
  assert.equal(reloaded.document.querySelector('#studioMotion').value, 'still');
  assert.equal(reloaded.document.body.dataset.effects, 'off', 'reloading the updated URL keeps Still selected');
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

test('the design gallery filters all recipes, renders source records, and switches without reloading the CV', async () => {
  const env = await boot({ search: '?design=helix&theme=unknown&section=projects', stored: { background: 'aurora', pointer: false } });
  const { document, win, click, Event, storedValues } = env;
  const initialLoads = env.cvLoads;
  assert.equal(win.PortfolioStudio.concept, 'helix');
  assert.equal(win.PortfolioStudio.theme, 'dark', 'an invalid theme falls back to the selected recipe default');
  assert.equal(win.PortfolioStudio.section, 'projects');
  assert.equal(document.body.dataset.design, 'helix');
  assert.equal(document.body.dataset.concept, 'unified', 'new recipe style maps safely to the legacy style fallback');
  assert.equal(document.body.dataset.background, 'aurora');
  assert.equal(document.querySelectorAll('#designGalleryBody [data-gallery-design]').length, 15);
  assert.equal(document.querySelectorAll('[data-design-choice][aria-pressed="true"]').length, 1);
  assert(document.querySelector('#projects').hasAttribute('data-studio-selected'));
  assert(!document.querySelector('#hero').hasAttribute('data-studio-selected'));
  assert.equal(document.querySelectorAll('#projects [data-project-card]').length, 12);
  assert.equal(document.querySelectorAll('#certificates [data-cert-card]').length, 15);

  click('[data-open-design-gallery]');
  const gallery = document.querySelector('#designGallery');
  assert(gallery.hasAttribute('open'));
  const search = document.querySelector('#designGallerySearch');
  search.value = 'pipeline';
  search.dispatchEvent(new Event('input', { bubbles: true }));
  assert.equal(document.querySelectorAll('#designGalleryBody [data-gallery-design]:not([hidden])').length, 1);
  assert.equal(document.querySelector('#designGalleryResults').textContent, '1 design shown');
  assert.equal(document.querySelector('[data-design-choice="helix"]').getAttribute('aria-label'), 'Current design: Helix');
  assert.equal(document.querySelector('[data-design-choice="journal"]').getAttribute('aria-label'), 'Select: Research Journal');
  search.value = '';
  search.dispatchEvent(new Event('input', { bubbles: true }));
  const family = document.querySelector('#designGalleryFamily');
  family.value = 'editorial';
  family.dispatchEvent(new Event('change', { bubbles: true }));
  assert.equal(document.querySelectorAll('#designGalleryBody [data-gallery-design]:not([hidden])').length, 2);
  family.value = '';
  family.dispatchEvent(new Event('change', { bubbles: true }));

  click('[data-design-choice="gallery"]');
  assert.equal(win.PortfolioStudio.concept, 'gallery');
  assert.equal(win.PortfolioStudio.theme, 'light');
  assert.equal(win.PortfolioStudio.section, 'projects', 'switching recipe retains section isolation');
  assert.equal(document.body.dataset.background, 'aurora', 'switching recipe retains background choice');
  assert.equal(document.body.dataset.design, 'gallery');
  assert.equal(document.querySelectorAll('#projects [data-project-card]').length, 12);
  assert.equal(document.querySelectorAll('#certificates [data-cert-card]').length, 15);
  assert.equal(document.querySelectorAll('#portfolio h1').length, 1);
  assert.equal(document.querySelector('#designGallery').hasAttribute('open'), false);
  assert.equal(env.cvLoads, initialLoads, 'design selection reuses the already loaded CV');
  const saved = JSON.parse(storedValues.get('portfolio.design.preferences.v1'));
  assert.equal(saved.concept, 'gallery');
  assert.equal(saved.theme, 'light');
  assert.equal(saved.background, 'aurora');
  assert.equal(new URL(win.location.href).searchParams.get('design'), 'gallery');
  assert.equal(new URL(win.location.href).searchParams.get('section'), 'projects');

  click('[data-open-project="project-0"]');
  assert(document.querySelector('#projectDialog').hasAttribute('open'));
  assert(document.querySelector('#projectDialogBody').textContent.includes('Full description 0'));
});

test('every registered design boots all eleven portfolio sections with complete project and credential collections', async () => {
  const expectedSections = ['hero', 'about', 'projects', 'experience', 'publications', 'education', 'skills', 'certificates', 'languages', 'references', 'contact'];
  for (const id of ['journal', 'helix', 'organic', 'monograph', 'specimen', 'pipeline', 'bento', 'atlas-map', 'console', 'blueprint', 'chromatography', 'gallery', 'dossier', 'kinetic', 'horizon']) {
    const env = await boot({ search: `?design=${id}` });
    assert.equal(env.win.PortfolioStudio.concept, id);
    for (const section of expectedSections) assert(env.document.querySelector(`#portfolio #${section}`), `${id} boot omitted ${section}`);
    assert.equal(env.document.querySelectorAll('#portfolio h1').length, 1, `${id} renders one primary heading`);
    assert.equal(env.document.querySelectorAll('#projects [data-project-card]').length, 12, `${id} retains all projects`);
    assert.equal(env.document.querySelectorAll('#certificates [data-cert-card]').length, 15, `${id} retains all credentials`);
    assert.equal(env.document.querySelectorAll('#hero img[src="https://example.test/portrait.jpg"]').length, 1, `${id} renders the source portrait`);
    assert.equal(env.cvLoads, 1, `${id} loads the CV once`);
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

test('integrated hero renders the supplied name as escaped source text and no inferred profile facts', () => {
  const { document, Event } = parseHTML('<!doctype html><html><body data-effects="on"></body></html>');
  const win = { Event };
  new Function('window', 'document', fs.readFileSync(path.join(publicRoot, 'portfolio/hero-scene.js'), 'utf8'))(win, document);
  const identity = { name: '<img src=x onerror=alert(1)> Synthetic', photo: 'https://example.test/portrait.jpg' };
  const h = {
    e: value => String(value).replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char]),
    portrait: (_identity, className) => `<div class="${className}"><img src="https://example.test/portrait.jpg" alt="Synthetic"></div>`,
  };
  const root = document.createElement('main');
  root.innerHTML = win.PortfolioHeroScene.render(identity, h);
  document.body.append(root);
  const scene = root.querySelector('[data-hero-scene]');
  assert(scene);
  assert(scene.querySelector('[data-hs-cell]'));
  assert(scene.querySelector('.hs-bond-graph [data-hs-bond]'));
  assert(scene.querySelector('.hs-source'));
  assert.equal(scene.querySelector('.hs-source strong').textContent, JSON.stringify(identity.name));
  assert.equal(scene.querySelector('.hs-source img'), null);
  assert.equal(scene.querySelector('.hs-portrait img').getAttribute('src'), 'https://example.test/portrait.jpg');
  assert.equal(scene.querySelectorAll('img[onerror]').length, 0);
  assert(!scene.textContent.includes('Synthetic role'));
  assert(!scene.textContent.includes('Example organization'));
});

test('integrated hero gates animation by visibility and effects, supports pause/reset, and cleans up', () => {
  const { document, Event } = parseHTML('<!doctype html><html><body data-effects="on"></body></html>');
  let observerCallback;
  let disconnects = 0;
  const frames = new Map();
  let nextFrame = 0;
  const win = {
    Event,
    requestAnimationFrame(callback) { const id = ++nextFrame; frames.set(id, callback); return id; },
    cancelAnimationFrame(id) { frames.delete(id); },
    IntersectionObserver: class {
      constructor(callback) { observerCallback = callback; }
      observe() {}
      disconnect() { disconnects++; }
    },
  };
  new Function('window', 'document', fs.readFileSync(path.join(publicRoot, 'portfolio/hero-scene.js'), 'utf8'))(win, document);
  const h = { e: value => String(value), portrait: () => '<div></div>' };
  const root = document.createElement('main');
  root.innerHTML = win.PortfolioHeroScene.render({ name: 'Synthetic' }, h);
  document.body.append(root);
  const scene = root.querySelector('[data-hero-scene]');
  win.PortfolioHeroScene.mount(root);
  assert.equal(frames.size, 0, 'offscreen scenes do not animate');
  observerCallback([{ target: scene, isIntersecting: true }]);
  assert.equal(frames.size, 1);

  const play = scene.querySelector('[data-hs-play]');
  play.dispatchEvent(new Event('click'));
  assert.equal(play.textContent, 'Play');
  assert.equal(frames.size, 0, 'local pause cancels the scheduled frame');
  scene.querySelector('[data-hs-reset]').dispatchEvent(new Event('click'));
  assert.equal(scene.querySelector('[data-hs-cell]').getAttribute('transform'), 'translate(0.000 0.000)');

  play.dispatchEvent(new Event('click'));
  assert.equal(frames.size, 1);
  const [frameId, tick] = [...frames.entries()][0];
  frames.delete(frameId);
  tick(40);
  assert.equal(frames.size, 1);
  const [nextId, nextTick] = [...frames.entries()][0];
  frames.delete(nextId);
  nextTick(90);
  assert.notEqual(scene.querySelector('[data-hs-cell]').getAttribute('transform'), 'translate(0.000 0.000)');

  document.body.dataset.effects = 'off';
  play.dispatchEvent(new Event('click'));
  assert.equal(frames.size, 0, 'page effects-off state stops scene animation');
  win.PortfolioHeroScene.unmount();
  assert.equal(disconnects, 1);
});

test('background choices validate, persist, preview live, and stay independent from cursor, theme, and section', async () => {
  const env = await boot({ search: '?background=invalid&theme=dark&section=projects', stored: { background: 'aurora', pointer: false } });
  const { document, click, Event, win, storedValues } = env;
  const studio = win.PortfolioStudio;
  assert.equal(studio.background, 'aurora', 'an invalid query value falls back to the saved background');
  assert.equal(document.body.dataset.background, 'aurora');
  assert.equal(document.querySelector('[data-background-choice="aurora"]').getAttribute('aria-pressed'), 'true');
  assert.equal(document.querySelector('#pointerEffects').checked, false);
  assert.equal(studio.theme, 'dark');
  assert.equal(studio.section, 'projects');
  click('[data-open-studio]');
  const dialog = document.querySelector('#designDialog');
  assert(dialog.hasAttribute('open'));

  for (const mode of ['glow', 'silk', 'membrane', 'molecular', 'aurora', 'off']) {
    click(`[data-background-choice="${mode}"]`);
    assert.equal(studio.background, mode);
    assert.equal(document.body.dataset.background, mode);
    assert.equal(document.querySelector(`[data-background-choice="${mode}"]`).getAttribute('aria-pressed'), 'true');
    assert.equal(document.querySelectorAll('[data-background-choice][aria-pressed="true"]').length, 1);
    assert.equal(dialog.hasAttribute('open'), true, 'choosing a background leaves the design dialog open');
    const saved = JSON.parse(storedValues.get('portfolio.design.preferences.v1'));
    assert.equal(saved.background, mode);
    assert.equal(new URL(win.location.href).searchParams.get('background'), mode);
  }

  assert.equal(studio.theme, 'dark', 'background selection does not change the theme');
  assert.equal(studio.section, 'projects', 'background selection does not change section focus');
  const cursor = document.querySelector('#pointerEffects');
  cursor.checked = true;
  cursor.dispatchEvent(new Event('change', { bubbles: true }));
  assert.equal(studio.pointer, true);
  assert.equal(studio.background, 'off', 'cursor preference changes independently of background mode');
  assert.equal(document.body.dataset.background, 'off');
  assert.equal(JSON.parse(storedValues.get('portfolio.design.preferences.v1')).background, 'off');
  click('[data-close-studio]');
  assert.equal(dialog.hasAttribute('open'), false);
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


const independentIds = ['folio','vitro','herbarium','monument','assay','workbench','signal','connectome','shell','draft','separation','exhibit','letter','velocity','strata'];

test('independent record atoms preserve zero values and distinct supplied language, skill and publication fields', async () => {
  const model = adaptCV(raw);
  model.education[0].gpa = 0;
  model.languages[0].cefr = 'B2';
  model.languages[0].level = 'Source conversational description';
  model.languages[0].tests = [{ id: 'synthetic-test', name: 'Synthetic assessment', issuer: 'Example issuer', date: '', url: '', scores: [{ label: 'Source score', value: 0, max: 0 }] }];
  const skill = model.skillGroups[0].groups[0].items[0];
  skill.shortName = 'SYN';
  skill.tags = ['Source context <img src=x onerror=alert(1)>'];
  model.publications[0].doi = '10.0000/synthetic';
  model.publications[0].isbn = '000-0-synthetic';
  const { document } = await boot({ independent: true, model });

  assert.equal(document.querySelector('.di-education-item strong').textContent, '0', 'numeric zero GPA stays visible');
  const language = document.querySelector('.di-language');
  assert(language.textContent.includes('B2'), 'CEFR is retained');
  assert(language.textContent.includes('Source conversational description'), 'the distinct source level is retained alongside CEFR');
  assert.equal(language.querySelector('.di-language-test strong').textContent, '0 / 0', 'zero score and zero maximum are not treated as missing');
  const item = document.querySelector('[data-skill-item]');
  assert(item.textContent.includes(skill.name), 'full skill name is retained');
  assert(item.textContent.includes('(SYN)'), 'supplied short name is retained');
  assert(item.textContent.includes(skill.tags[0]), 'source skill tags remain available through disclosure');
  assert.equal(item.querySelector('.di-skill-context').hasAttribute('open'), false);
  assert.equal(item.querySelector('img'), null, 'source context remains escaped text');
  const paper = document.querySelector('.di-paper');
  assert(paper.textContent.includes('ISBN 000-0-synthetic'), 'literal ISBN remains visible');
  const doi = paper.querySelector('a[href="https://doi.org/10.0000%2Fsynthetic"]');
  assert(doi, 'DOI links to the supplied identifier');
  assert(doi.textContent.includes('DOI 10.0000/synthetic'), 'DOI identifier is readable in the link label');
});

test('the independent and previous design collections remain addressable', async () => {
  const env = await boot({ independent:true });
  assert.equal(env.win.PortfolioStudio.concept,'folio');
  assert.equal(env.document.body.dataset.collection,'independent');
  assert.equal(env.document.body.dataset.concept,'independent');
  assert.deepEqual(env.win.PortfolioDesigns.collection('independent').map(x=>x.id),independentIds);
  assert.equal(env.win.PortfolioDesigns.collection('previous').length,15);
  assert.equal(env.document.querySelectorAll('#designGalleryBody [data-design-choice]').length,15);
  const selector=env.document.querySelector('#designGalleryCollection');selector.value='previous';selector.dispatchEvent(new env.Event('change',{bubbles:true}));
  assert.equal(env.document.querySelectorAll('#designGalleryBody [data-design-choice]').length,15);
  env.click('[data-design-choice="journal"]');assert.equal(env.win.PortfolioStudio.concept,'journal');
  assert.equal(env.document.body.dataset.collection,'previous');
});

test('one gallery lists every imported design beside both existing collections', async () => {
  const env = await boot({ independent: true, imported: true, search: '?gallery=1&lang=fa' });
  const { document, Event } = env;
  const cards = () => [...document.querySelectorAll('#designGalleryBody [data-gallery-design]')];
  const select = document.querySelector('#designGalleryCollection');
  const sourceRegistry = require('../collections/new-web/src/lib/designs.json');
  const readyIds = sourceRegistry.filter(design => design.ready).map(design => design.id);
  assert.equal(select.value, 'all');
  assert.equal(cards().length, 30 + readyIds.length);
  assert.equal(new Set(cards().map(card => card.dataset.galleryDesign)).size, cards().length);
  assert.deepEqual(cards().filter(card => card.querySelector('a')).map(card => new URL(card.querySelector('a').getAttribute('href'), env.win.location.href).pathname), readyIds.map(id => `/imported/fa/${id}/`));
  assert(document.querySelector('[data-design-choice="helix"]'));
  assert(document.querySelector('[data-gallery-design="imported-helix"] a'));

  const search = document.querySelector('#designGallerySearch');
  search.value = 'sequencer';
  search.dispatchEvent(new Event('input', { bubbles: true }));
  assert(cards().some(card => !card.hidden && card.dataset.galleryDesign === 'imported-sequencer'));
  select.value = 'imported';
  select.dispatchEvent(new Event('change', { bubbles: true }));
  assert.equal(cards().length, readyIds.length);
  assert(cards().every(card => card.querySelector('a') && !card.hidden));
  assert.equal(env.cvLoads, 1);
});

test('Next and Previous follow all 62 gallery entries across the native and imported routes', async () => {
  const env = await boot({
    independent: true,
    imported: true,
    experiences: true,
    search: '?gallery=1&design=strata&theme=dark&background=silk&motion=still&lang=fa',
  });
  const { document, Event, win, click } = env;
  const { adjacentTemplate, templateCycle, templateHref, readPreferences } = win.PortfolioDesignNavigation;
  const importedIds = require('../collections/new-web/src/lib/designs.json')
    .filter(design => design.ready).map(design => design.id);
  const cycle = templateCycle(importedIds);
  const key = entry => `${entry.collection === 'imported' ? 'imported-' : ''}${entry.id}`;
  const galleryOrder = [...document.querySelectorAll('[data-gallery-design]')].map(card => card.dataset.galleryDesign);
  assert.equal(cycle.length, 62);
  assert.deepEqual(cycle.map(key), galleryOrder);
  assert.equal(new Set(galleryOrder).size, 62);
  for (let index = 0; index < cycle.length; index++) {
    assert.equal(adjacentTemplate(cycle, cycle[index], 1), cycle[(index + 1) % cycle.length]);
    assert.equal(adjacentTemplate(cycle, cycle[index], -1), cycle[(index + cycle.length - 1) % cycle.length]);
  }

  const collection = document.querySelector('#designGalleryCollection');
  collection.value = 'independent';
  collection.dispatchEvent(new Event('change', { bubbles: true }));
  click('[data-close-design-gallery]');
  click('[data-design-step="1"]');
  assert.equal(win.PortfolioStudio.concept, 'journal', 'a gallery filter does not change the navigation order');
  assert.equal(win.PortfolioStudio.theme, 'dark', 'a step keeps the selected theme');
  click('[data-design-step="-1"]');
  assert.equal(win.PortfolioStudio.concept, 'strata');

  for (let index = 0; index < 16; index++) click('[data-design-step="1"]');
  assert.equal(win.PortfolioStudio.concept, 'tissue');
  for (let index = 0; index < 12; index++) click('[data-design-step="1"]');
  const importedURL = new URL(win.location.href);
  assert.equal(importedURL.pathname, '/imported/fa/helix/');
  assert.deepEqual(readPreferences(importedURL.search), { theme: 'dark', background: 'silk', motion: 'still' });
  const previousNative = adjacentTemplate(cycle, cycle[0], -1);
  const nativeURL = new URL(templateHref(previousNative, 'fa', readPreferences(importedURL.search)), win.location.href);
  assert.equal(nativeURL.searchParams.get('design'), 'expedition');
  assert.equal(nativeURL.searchParams.get('lang'), 'fa');
  assert.deepEqual(readPreferences(nativeURL.search), readPreferences(importedURL.search));
  assert.equal(templateHref(adjacentTemplate(cycle, cycle[19], 1), 'de'), '/?design=folio&lang=de');
});

test('all fifteen independent worlds retain complete safe source records and functioning project actions', async () => {
  for(const id of independentIds){
    const env=await boot({ independent:true,search:'?design='+id });
    const {document,win,click,Event}=env;
    assert.equal(document.querySelectorAll('#portfolio [data-section]').length,11,id+' complete sections');
    assert.equal(document.querySelectorAll('#portfolio h1').length,1,id+' one h1');
    assert(document.querySelector('#hero .di-portrait img'),id+' actual portrait');
    assert.equal(document.querySelectorAll('[data-project-card]').length,12,id+' all projects');
    assert.equal(document.querySelectorAll('[data-cert-card]').length,15,id+' all credentials');
    assert.equal(document.querySelectorAll('[data-journey-record]').length,1,id+' all experience');
    assert(!document.querySelector('#portfolio [onerror]'),id+' escaped hostile summary');
    assert(document.querySelector('#about').textContent.includes('Exact fictional summary'),id+' full source profile');
    assert.equal(document.querySelector('.di-reference').hasAttribute('open'),false,id+' reference disclosure');
    const search=document.querySelector('[data-project-search]');search.value='Project 11';search.dispatchEvent(new Event('input',{bubbles:true}));
    const visible=[...document.querySelectorAll('[data-project-card]')].filter(n=>!n.hidden);
    assert.equal(visible.length,1,id+' source search');
    click('[data-project-card]:not([hidden]) [data-open-project]');
    assert(document.querySelector('#projectDialog').hasAttribute('open'),id+' modal opens');
    assert(document.querySelector('#projectDialogBody').textContent.includes('Full description 11'),id+' full source description');
    assert.equal(env.cvLoads,1,id+' no refetch');
    assert.equal(document.querySelectorAll('#about [data-story]').length,id==='strata'?1:0,id+' intentional story composition');
    assert(win.PortfolioDesigns.get(id).fingerprint.composition,id+' authored brief');
  }
});

test('all twelve Experiences keep the eleven sections and complete source records', async () => {
  const ids = ['tissue','culture','chromatogram','residue','continuum','cabinet','foundry','runtime','tensor','patchbay','prism','expedition'];
  const model = adaptCV(previewPortfolio('https://example.test'));
  model.identity.summary += ' <img src=x onerror=alert(1)> Complete profile.';
  const role = model.experience[0];
  role.profileUrl = 'https://example.test/role-profile';
  model.publications[0].supervisors = ['Sample supervisor'];
  model.languages[0].tests = [{ id:'test', name:'Example language test', scores:[{ label:'Writing', value:0, max:0 }] }];
  const { document, win, click } = await boot({ independent:true,imported:true,experiences:true,model });
  assert.deepEqual(win.PortfolioDesigns.collection('experiential').map(design => design.id), ids);
  assert.equal(win.PortfolioDesigns.collection('previous').length, 15);
  click('.syn-archive-link');
  const collection = document.querySelector('#designGalleryCollection');
  collection.value = 'experiential';
  collection.dispatchEvent(new win.Event('change', { bubbles: true }));
  assert.equal(document.querySelectorAll('#designGalleryBody [data-gallery-design]').length, 12);
  const layouts = new Set();
  for (const id of ids) {
    win.PortfolioStudio.setConcept(id);
    const portfolio = document.querySelector('#portfolio');
    assert.equal(portfolio.hidden, false, id);
    assert.equal(document.body.dataset.collection, 'experiential');
    assert.equal(portfolio.querySelectorAll('[data-section]').length, 11, id);
    assert.equal(portfolio.querySelectorAll('h1').length, 1, id);
    assert.equal(portfolio.querySelector('img[onerror]'), null, id);
    assert.match(portfolio.querySelector('#about').textContent, /Complete profile\./, id);
    assert.match(portfolio.querySelector('#about').textContent, /Jena, Germany/, id);
    assert(portfolio.querySelector('#about .syn-profile-portrait img'), id);
    assert.match(portfolio.querySelector('#publications').textContent, /Sample supervisor/, id);
    assert.match(portfolio.querySelector('#languages').textContent, /0 \/ 0/, id);
    assert(portfolio.querySelector('#experience a[href="https://example.test/role-profile"]'), id);
    assert.equal(portfolio.querySelectorAll('[data-journey-record]').length, model.experience.length, id);
    assert.equal(portfolio.querySelectorAll('[data-skill-item]').length, model.stats.skills, id);
    for (const p of model.projects) assert(portfolio.querySelector('#projects').textContent.includes(p.title), `${id}: missing ${p.title}`);
    layouts.add([...portfolio.querySelectorAll('.xp-page')].map(section => section.className).join(' '));
    const open = portfolio.querySelector('#projects [data-open-project]');
    assert(open, id);
    open.dispatchEvent(new win.Event('click', { bubbles: true }));
    assert(document.querySelector('#projectDialog').hasAttribute('open'), id);
    assert(document.querySelector('#projectDialogTitle').textContent, id);
    click('#projectDialog [data-close-dialog]');
  }
  assert.equal(layouts.size, 12);
});

test('Synthesis replaces all three core layouts and keeps selection and searches across modes', async () => {
  const model = adaptCV(previewPortfolio('https://example.test'));
  const { document, Event, click } = await boot({ experiences:true,model });
  const $ = selector => document.querySelector(selector);
  const type = (selector, value) => {
    $(selector).value = value;
    $(selector).dispatchEvent(new Event('input',{bubbles:true}));
  };
  for (const cls of ['syn-editorial-work','syn-timeline','syn-skills-grid']) assert($('.'+cls));
  click('[data-perspective="biology"]');
  for (const cls of ['syn-specimen-desk','syn-field-notes','syn-taxonomy-tree']) assert($('.'+cls));
  const firstYear = $('.syn-field-year > h3');
  assert.equal(firstYear.textContent, '2023');
  assert($('[data-field-branch="overlap"]'));
  type('[data-project-search]', 'Culture Conditions');
  const lens = $('[data-syn-specimen-lens]');
  lens.value = 'overlap';
  lens.dispatchEvent(new Event('change', { bubbles: true }));
  assert.equal($('[data-project-empty]').hidden, false);
  assert.equal($('[data-syn-colony]:not([hidden])'), null);
  lens.value = 'life';
  lens.dispatchEvent(new Event('change', { bubbles: true }));
  click('[data-syn-colony="project-8"]');
  assert.equal($('[data-syn-colony="project-8"]').getAttribute('aria-pressed'), 'true');
  assert.equal($('[data-syn-project-select="project-8"]').getAttribute('aria-pressed'), 'true');
  assert.equal($('.syn-work-inspector h3').textContent, 'Culture Conditions');
  const journeyProject = $('[data-syn-journey] [data-open-project="project-8"]');
  assert.equal(journeyProject?.closest('[data-journey-project]').querySelector('small').textContent, 'Selected project');
  type('[data-skill-search]', 'Python');
  assert.match($('[data-skill-count]').textContent, /matching/);
  click('[data-perspective="programming"]');
  for (const cls of ['syn-code-desk','syn-release-log','syn-module-catalog']) assert($('.'+cls));
  assert.equal($('[data-project-search]').value, 'Culture Conditions');
  assert.equal($('[data-skill-search]').value, 'Python');
  assert.equal($('.syn-work-inspector h3').textContent, 'Culture Conditions');
  type('[data-project-search]', '');
  assert.equal($('[data-syn-project-select="project-8"]').closest('[data-project-card]').hidden, false);
  assert.equal($('[data-syn-project-select="project-8"]').getAttribute('aria-pressed'), 'true');
  click('.syn-work-inspector [data-open-project]');
  assert.equal($('#projectDialogTitle').textContent, 'Culture Conditions');
  click('#projectDialog [data-close-dialog]');
  type('[data-project-search]', 'no such project');
  assert.equal($('.syn-code-desk').hidden, true);
  assert.equal($('[data-project-empty]').hidden, false);
  type('[data-project-search]', '');
  assert.equal($('.syn-code-desk').hidden, false);
  type('[data-skill-search]', 'no such skill');
  assert.equal($('[data-skill-empty]').hidden, false);
});

test('Synthesis focus controls morph the existing hero and preserve its SVG across perspectives', async () => {
  const model = adaptCV(previewPortfolio('https://example.test'));
  const { document, click } = await boot({ synthesis: true, model, search: '?perspective=biology&motion=still' });
  const scene = document.querySelector('#hero [data-synthesis-scene]');
  const strand = scene.querySelector('.syn-strand');
  const currentPath = () => strand.getAttribute('d');
  const focus = value => `[data-syn-focus="${value}"]`;
  const assertFocus = value => assert.equal(document.querySelector(focus(value)).getAttribute('aria-pressed'), 'true');

  assertFocus('cell');
  const biologyPaths = new Set([currentPath()]);
  for (const value of ['tissue', 'molecule']) {
    click(focus(value));
    assertFocus(value);
    biologyPaths.add(currentPath());
    assert.strictEqual(document.querySelector('#hero [data-synthesis-scene] .syn-strand'), strand);
  }
  assert.equal(biologyPaths.size, 3);

  click('[data-perspective="programming"]');
  assertFocus('transform');
  const transformPath = currentPath();
  click(focus('artifact'));
  assertFocus('artifact');
  assert.notEqual(currentPath(), transformPath);
  assert.strictEqual(document.querySelector('#hero [data-synthesis-scene]'), scene);

  click('[data-perspective="all"]');
  assertFocus('membrane');
  assert.strictEqual(document.querySelector('#hero [data-synthesis-scene] .syn-strand'), strand);
});

test('Synthesis journey snaps and scrubs one SVG and keeps the chapter when the perspective changes', async () => {
  const model = adaptCV(previewPortfolio('https://example.test'));
  const { document, Event, click } = await boot({ synthesis: true, model, search: '?perspective=biology&motion=still' });
  const journey = document.querySelector('[data-syn-journey]');
  const art = journey.querySelector('[data-journey-art]');
  const strand = art.querySelector('.syn-strand');
  const range = journey.querySelector('[data-journey-range]');
  const initial = strand.getAttribute('d');

  assert.equal(journey.dataset.journeyPhase, '0');
  click('[data-journey-step="1"]');
  assert.equal(journey.dataset.journeyPhase, '1');
  assert.equal(Number(range.value), 1);
  const snapped = strand.getAttribute('d');
  assert.notEqual(snapped, initial);

  range.value = '1.65';
  range.dispatchEvent(new Event('input', { bubbles: true }));
  assert.equal(journey.dataset.journeyPhase, '2');
  const scrubbed = strand.getAttribute('d');
  assert.notEqual(scrubbed, snapped);
  click('[data-journey-step="2"]');
  assert.notEqual(strand.getAttribute('d'), scrubbed, 'scrubbing can stop between the snap positions');

  click('[data-perspective="programming"]');
  assert.strictEqual(document.querySelector('[data-syn-journey]'), journey);
  assert.strictEqual(journey.querySelector('[data-journey-art] .syn-strand'), strand);
  assert.equal(journey.dataset.journeyPhase, '2');
  assert.equal(Number(range.value), 2);

  const slot = [...journey.querySelectorAll('[data-journey-project]')]
    .find(project => project.querySelector('small')?.textContent !== 'Selected project' && project.querySelector('[data-open-project]'));
  const action = slot?.querySelector('[data-open-project]');
  const record = model.projects.find(project => project.id === action?.dataset.openProject);
  assert(record, 'chapter links to a canonical project record');
  action.dispatchEvent(new Event('click', { bubbles: true }));
  assert.equal(document.querySelector('#projectDialogTitle').textContent, record.title);
  assert.equal(slot.querySelector('small').textContent, 'Selected project');
  click('#projectDialog [data-close-dialog]');
  assert.strictEqual(slot.querySelector('[data-open-project]'), action);
  assert.equal(action.isConnected, true);
});

test('Synthesis journey follows desktop scroll, yields to manual control and cleans up on unmount', () => {
  const model = adaptCV(previewPortfolio('https://example.test'));
  const { document, Event } = parseHTML('<html><body data-effects="on"></body></html>');
  const listeners = new Map(), frames = new Map();
  let frameId = 0;
  const window = {
    addEventListener(type, callback) {
      if (!listeners.has(type)) listeners.set(type, new Set());
      listeners.get(type).add(callback);
    },
    removeEventListener(type, callback) { listeners.get(type)?.delete(callback); },
    innerHeight: 800,
    innerWidth: 1280,
    scrollY: 0,
    matchMedia: () => ({ matches: true }),
    requestAnimationFrame(callback) { frames.set(++frameId, callback); return frameId; },
    cancelAnimationFrame(id) { frames.delete(id); },
  };
  for (const file of ['synthesis-scene.js', 'synthesis-journey.js']) {
    const code = fs.readFileSync(path.join(publicRoot, 'portfolio', file), 'utf8');
    new Function('window', 'document', code)(window, document);
  }
  document.body.innerHTML = window.PortfolioSynthesisJourney.render();
  const element = document.querySelector('[data-syn-journey]');
  [...element.querySelectorAll('[data-journey-card]')].forEach((card, index) => {
    card.getBoundingClientRect = () => ({ height: 240, top: 216 + 400 * index - window.scrollY });
  });
  const helpers = { e: String, link: (_url, label) => label };
  const attach = () => window.PortfolioSynthesisJourney.mount(element, { model, mode: 'all', helpers });
  const first = attach();
  const scroll = listeners.get('scroll');
  const resize = listeners.get('resize');
  assert.equal(scroll.size, 1);
  assert.equal(resize.size, 1);
  function sampleAt(y) {
    window.scrollY = y;
    scroll.forEach(listener => listener());
    assert.equal(frames.size, 1, 'multiple scroll notifications share one pending frame');
    const [id, callback] = frames.entries().next().value;
    frames.delete(id);
    callback();
  }
  sampleAt(400);
  assert.equal(element.dataset.journeyPhase, '1');
  element.querySelector('[data-journey-step="0"]').dispatchEvent(new Event('click', { bubbles: true }));
  sampleAt(410);
  assert.equal(element.dataset.journeyPhase, '0', 'incidental scroll does not override a manual snap');
  sampleAt(800);
  assert.equal(element.dataset.journeyPhase, '2', 'reading further resumes scroll-following');
  first.update({ model, mode: 'biology', helpers });
  assert.equal(scroll.size, 1);
  assert.equal(resize.size, 1);
  first.destroy();
  assert.equal(frames.size, 0);
  assert.equal(scroll.size, 0);
  assert.equal(resize.size, 0);
  document.body.dataset.effects = 'off';
  const second = attach();
  assert.equal(scroll.size, 1);
  assert.equal(frames.size, 0, 'Still mode does not schedule scroll motion');
  second.destroy();
  assert.equal(scroll.size, 0);
  assert.equal(resize.size, 0);
});

test('Synthesis workbench opens source, method and artifact views for a filtered project', async () => {
  const model = adaptCV(previewPortfolio('https://example.test'));
  const record = model.projects[2];
  record.title = 'Open Bench Workflow for Comparing Reproducible Laboratory Notes, Analyzing Sample Collections, and Reviewing the Original Study Data';
  record.repositoryUrl = 'https://example.test/bench/source';
  record.repositoryLabel = 'Workflow repository';
  record.links = [{ label: 'Workflow protocol', url: 'https://example.test/bench/protocol' }];
  const { document, Event, click } = await boot({ synthesis: true, model, width: 390, search: '?perspective=programming&motion=still' });
  const $ = selector => document.querySelector(selector);
  const desk = $('[data-syn-project-desk="programming"]');
  const panel = () => desk.querySelector('[data-workbench-panel]:not([hidden])');
  const pressKey = (selector, key) => {
    const event = new Event('keydown', { bubbles: true, cancelable: true });
    Object.defineProperty(event, 'key', { value: key });
    $(selector).dispatchEvent(event);
  };
  const search = $('[data-project-search]');
  search.value = 'Open Bench Workflow';
  search.dispatchEvent(new Event('input', { bubbles: true }));
  const matches = [...desk.querySelectorAll('[data-project-card]:not([hidden])')];
  assert.deepEqual(matches.map(item => item.dataset.projectId), [record.id]);

  for (const name of ['files', 'document', 'properties']) assert(desk.querySelector(`[data-workbench-pane="${name}"]`));
  click('[data-workbench-show="files"]');
  assert.equal(desk.dataset.workbenchActive, 'files');
  click(`[data-syn-project-select="${record.id}"]`);
  assert.equal(desk.dataset.workbenchActive, 'document');
  assert.equal($('#syn-work-inspector h3').textContent, record.title);

  click('[data-workbench-stage="source"]');
  assert(panel().textContent.includes(record.description));
  pressKey('[data-workbench-stage="source"]', 'ArrowRight');
  assert.equal($('[data-workbench-stage="method"]').getAttribute('aria-selected'), 'true');
  for (const topic of record.tags) assert(panel().textContent.includes(topic));
  click('[data-workbench-show="properties"]');
  assert.equal(desk.dataset.workbenchActive, 'properties');
  const linkCount = [...$('[data-workbench-properties]').querySelectorAll('dt')].find(label => label.textContent === 'Source links');
  assert.equal(linkCount?.nextElementSibling.textContent, '2');
  click('[data-workbench-artifacts]');
  assert.equal(desk.dataset.workbenchActive, 'document');
  assert.equal($('[data-workbench-stage="artifact"]').getAttribute('aria-selected'), 'true');
  assert.equal(panel().querySelector(`a[href="${record.repositoryUrl}"]`).textContent, record.repositoryLabel);
  assert.equal(panel().querySelector(`a[href="${record.links[0].url}"]`).textContent, record.links[0].label);

  click('[data-workbench-maximize]');
  assert.equal(desk.dataset.workbenchMaximized, 'true');
  pressKey('[data-workbench-maximize]', 'Escape');
  assert.notEqual(desk.dataset.workbenchMaximized, 'true');
  click('#syn-work-inspector [data-open-project]');
  assert.equal($('#projectDialogTitle').textContent, record.title);
});

test('Synthesis is the default, retains one scene and every source record in all three perspectives', async () => {
  const model = adaptCV(raw);
  model.projects[7].title = 'Synthetic genome sequencing';
  model.projects[7].tags.push('Genomics');
  model.projects[10].title = 'Synthetic software and machine learning';
  model.projects[10].tags.push('Machine learning');
  model.projects[10].url = 'https://example.test/app';
  model.projects[10].urlLabel = 'Fictional live demo';
  model.projects[10].repositoryUrl = 'https://example.test/repository';
  model.projects[10].repositoryLabel = 'Fictional repository';
  model.projects[10].links = [{ label: 'Fictional protocol', url: 'https://example.test/protocol' }];
  Object.assign(model.experience[0], { location: 'Fictional laboratory city', url: 'https://example.test/experience', profileUrl: 'https://example.test/role-profile' });
  Object.assign(model.publications[0], { citation: 'Fictional exact citation.', notes: 'Fictional publication note.',
    supervisors: ['Fictional Supervisor'], doi: '10.0000/fictional', isbn: '0000', bibliography: [{ label: 'Volume', value: 'Fictional volume' }] });
  model.education[0].description = 'Fictional programme description.';
  model.skillGroups[0].groups[0].items[0].tags = ['Fictional skill context'];
  model.certificates[0].hasCertificate = false;
  model.certificates[1].hasCertificate = '';
  model.languages[0].cefr = 'A1';
  model.languages[0].tests = [{ id: 'test-1', name: 'Fictional test', scores: [{ label: 'writing', value: 0, max: 0 }] }];
  model.references[0].phones = ['+1000001', '+1000002'];
  model.interests = [{ id: 'interest-1', title: 'Fictional interest', description: 'Fictional interest description.' }];
  model.identity.coverUrl = 'https://example.test/cover.jpg';
  const env = await boot({ synthesis: true, independent: true, imported: true, model, search: '?perspective=unknown' });
  const { document, win, click, Event } = env;
  const $ = selector => document.querySelector(selector);
  const $$ = selector => Array.from(document.querySelectorAll(selector));
  assert.equal(win.PortfolioStudio.concept, 'synthesis');
  assert.equal(win.PortfolioDesigns.has('synthesis'), false);
  assert.equal($$('#designGalleryBody [data-gallery-design]').length, 50);
  const loadedModel = win.portfolioView.model;
  const scene = $('[data-synthesis-scene]'), strand = $('.syn-strand');
  const paths = new Set();
  const control = $('#synthesisToolbar button[data-perspective="biology"]');
  assert.equal($('.syn-person img').getAttribute('src'), model.identity.avatarUrl);
  assert.equal($('.syn-cover').getAttribute('src'), model.identity.coverUrl);
  for (const [perspective, first] of [['all', model.projects[0].title], ['biology', model.projects[7].title], ['programming', model.projects[10].title]]) {
    click(`#synthesisToolbar button[data-perspective="${perspective}"]`);
    assert.equal(document.body.dataset.perspective, perspective);
    assert.equal($('[aria-pressed="true"][data-perspective]').dataset.perspective, perspective);
    assert($('#synthesisToolbar button[data-perspective="biology"]') === control, 'mode control persists');
    assert($('[data-synthesis-scene]') === scene, 'scene element persists');
    assert($('.syn-strand') === strand, 'strand persists');
    paths.add(strand.getAttribute('d'));
    const firstProject = $('[data-project-card]:not([hidden])');
    assert.equal((firstProject.querySelector('[data-syn-entry-title]') || firstProject.querySelector('h3')).textContent, first);
    assert.equal($$('#portfolio [data-section]').length, 11);
    assert.equal($$('[data-project-card]').length, model.projects.length);
    assert.equal($$('[data-journey-record]').length, model.experience.length);
    assert.equal($$('[data-cert-card]').length, model.certificates.length);
    assert.equal($$('[data-skill-item]').length, model.stats.skills);
    assert.equal($$('[data-record-id]').length, model.publications.length);
    assert.equal($$('#portfolio img[onerror]').length, 0);
    assert.equal($$('#references details[open]').length, 0);
    assert.equal($$('#references a[href^="tel:"]').length, 2);
    assert.match($('#about').textContent, /Fictional interest description/);
    assert.match($('#education').textContent, /Fictional programme description/);
    assert.match($('#experience').textContent, /Fictional laboratory city/);
    assert($('#experience a[href="https://example.test/role-profile"]'));
    assert.match($('#publications').textContent, /Fictional Supervisor/);
    assert.match($('#publications').textContent, /Fictional exact citation/);
    assert.match($('#publications').textContent, /Fictional volume/);
    assert.match($('#languages').textContent, /0 \/ 0/);
    assert.match($('#skills').textContent, /Fictional skill context/);
    assert.match($('#certificates').textContent, /No certificate recorded/);
    assert.match($('#certificates').textContent, /Certificate status not supplied/);
    assert.strictEqual(win.portfolioView.model, loadedModel);
  }
  assert.equal(paths.size, 3, 'each mode moves the same geometry to a different final shape');
  assert.equal(env.cvLoads, 1);
  assert.equal(new URL(win.location.href).searchParams.get('perspective'), 'programming');

  // A chapter reached by fragment navigation starts a little below the sticky toolbar.
  const chapter = $('#projects');
  win.scrollY = 1000;
  win.scrollTo = ({top}) => { win.scrollY = top; };
  $('#synthesisToolbar').getBoundingClientRect = () => ({bottom:121});
  $$('#portfolio [data-section]').forEach(el => { el.getBoundingClientRect = () => ({top:0, bottom:0, height:0}); });
  const projectTop = () => (document.body.dataset.perspective === 'biology' ? 1437 : 1163) - win.scrollY;
  chapter.getBoundingClientRect = () => ({top:projectTop(), bottom:projectTop()+700, height:700});
  $('#about').getBoundingClientRect = () => ({top:projectTop()-900, bottom:projectTop(), height:900});
  click('#synthesisToolbar button[data-perspective="biology"]');
  assert($('#projects') === chapter);
  assert.equal(chapter.getBoundingClientRect().top, 163, 'changing perspective retains the visible chapter and offset');
  click('#synthesisToolbar button[data-perspective="programming"]');
  assert.equal(chapter.getBoundingClientRect().top, 163);
  win.scrollY = 0;
  const search = $('[data-project-search]');
  search.value = 'Synthetic software';
  search.dispatchEvent(new Event('input', { bubbles: true }));
  assert.match($('[data-syn-project-count]').textContent, /1 project matching/);
  click('[data-open-project="project-10"]');
  for (const label of ['Fictional live demo','Fictional repository','Fictional protocol']) {
    assert($$('#projectDialog a').some(anchor => anchor.textContent === label), `missing source link ${label}`);
  }
  click('#projectDialog [data-close-dialog]');
  const reference = $('#references details');
  reference.setAttribute('open','');
  click('#synthesisToolbar button[data-perspective="biology"]');
  assert.equal($('[data-project-search]').value, 'Synthetic software');
  assert.equal($('#references details').hasAttribute('open'), true);
  assert.equal($$('[data-project-card]:not([hidden])').length, 1);
});

test('Synthesis deep links, the section index, legacy designs and the private access gate coexist', async () => {
  const env = await boot({ synthesis:true, independent:true, imported:true, search:'?perspective=programming&motion=still' });
  const {document, win, click} = env;
  assert.equal(document.body.dataset.perspective,'programming');
  assert.equal(document.body.dataset.effects,'off');
  click('[data-syn-open-index]');
  assert(document.querySelector('#jumpDialog').hasAttribute('open'));
  assert(document.querySelector('#jumpDialog [href="#references"]'));
  click('#jumpDialog [data-close-dialog]');
  click('.syn-archive-link');
  assert(document.querySelector('#designGallery').hasAttribute('open'));
  click('[data-design-choice="unified"]');
  assert.equal(win.PortfolioStudio.concept,'unified');
  assert.equal(document.querySelector('#synthesisToolbar').hidden,true);
  assert(document.querySelector('#hero [data-hero-scene]'));
  click('.syn-dock-return');
  assert.equal(win.PortfolioStudio.concept,'synthesis');
  assert.equal(document.body.dataset.perspective,'programming');
  assert.equal(env.cvLoads,1);

  const locked = await boot({ synthesis:true, auth:true, search:'?perspective=biology' });
  assert(locked.document.querySelector('#synthesisToolbar').hidden);
  assert(locked.document.querySelector('#portfolio').hidden);
  assert.equal(locked.document.querySelector('#portfolio').textContent,'');
});
