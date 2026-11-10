'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { parseHTML } = require('linkedom');

const sourceRoot = path.join(__dirname, '../public/portfolio');

function loadStory({ reduced = false } = {}) {
  const { document, Event } = parseHTML('<!doctype html><html><body data-effects="on"><main id="portfolio"></main></body></html>');
  let frameCallback = null;
  let frameId = 0;
  const events = new Map();
  const scrollCalls = [];
  let disconnects = 0;
  let observerCallback;
  class Observer { constructor(callback) { observerCallback = callback; } observe() {} disconnect() { disconnects++; } }
  const win = {
    document, innerWidth: 1280, innerHeight: 900, scrollY: 0,
    matchMedia: () => ({ matches: reduced, addEventListener() {}, removeEventListener() {} }),
    requestAnimationFrame(fn) { frameCallback = fn; return ++frameId; },
    cancelAnimationFrame() { frameCallback = null; },
    addEventListener(type, fn) { events.set(type, fn); },
    removeEventListener(type) { events.delete(type); },
    scrollTo(options) { scrollCalls.push(options); }, MutationObserver: Observer,
  };
  new Function('window', fs.readFileSync(path.join(sourceRoot, 'scroll-story.js'), 'utf8'))(win);
  return {
    win, document, Event,
    tick(time = 1) { const fn = frameCallback; frameCallback = null; fn?.(time); },
    dispatch(type) { events.get(type)?.(); },
    scrollCalls,
    notifyMutation() { observerCallback?.(); },
    get disconnects() { return disconnects; },
  };
}

const escapeHTML = value => String(value).replace(/[&<>"']/g, ch => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[ch]));

test('story respects Still, Auto reduction, and explicit Full opt-in, including live changes', () => {
  for (const reduced of [false, true]) {
    const env = loadStory({ reduced });
    const root = env.document.querySelector('#portfolio'), api = env.win.PortfolioStory;
    root.innerHTML = api.render({ projects: [] }, { e: escapeHTML });
    root.querySelector('.story-runway').getBoundingClientRect = () => ({ top: 0, height: 1800 });
    root.querySelector('.story-stage').getBoundingClientRect = () => ({ height: 600 });
    api.mount(root);
    for (const [motion, expected] of [['auto', reduced ? 'static' : 'scroll'], ['still', 'static'], ['full', 'scroll'], ['off', 'static']]) {
      env.document.body.dataset.motion = motion;
      env.notifyMutation();
      assert.equal(root.querySelector('[data-story]').dataset.storyMode, expected, `${motion} with reduced=${reduced}`);
    }
    env.document.body.dataset.effects = 'off';
    env.document.body.dataset.motion = 'full';
    env.notifyMutation();
    assert.equal(root.querySelector('[data-story]').dataset.storyMode, 'static');
    api.unmount();
  }
});

function loadPointer({ fine = true, reduced = false, effects = 'on', motion = 'auto' } = {}) {
  const { document, Event } = parseHTML(`<!doctype html><html><body data-effects="${effects}" data-motion="${motion}"><main id="portfolio"><a href="#x">Synthetic link</a><input></main></body></html>`);
  Object.defineProperty(document, 'visibilityState', { value: 'visible', configurable: true });
  const listeners = new Map();
  const media = query => ({
    matches: query.includes('pointer: fine') ? fine : reduced,
    addEventListener(type, fn) { listeners.set(`${query}:${type}`, fn); },
    removeEventListener(type) { listeners.delete(`${query}:${type}`); },
  });
  const frames = new Map();
  let nextFrame = 0;
  let disconnected = 0;
  class Observer {
    constructor() {}
    observe() {}
    disconnect() { disconnected++; }
  }
  const win = {
    PortfolioPointer: {}, matchMedia: media, innerWidth: 1200, innerHeight: 800, MutationObserver: Observer,
    addEventListener() {}, removeEventListener() {},
    requestAnimationFrame(fn) { const id = ++nextFrame; frames.set(id, fn); return id; },
    cancelAnimationFrame(id) { frames.delete(id); },
  };
  const globals = {
    matchMedia: media, innerWidth: 1200, innerHeight: 800, MutationObserver: Observer,
    requestAnimationFrame(fn) { const id = ++nextFrame; frames.set(id, fn); return id; },
    cancelAnimationFrame(id) { frames.delete(id); },
    performance: { now: () => 10 }, MutationObserver: Observer,
  };
  const code = fs.readFileSync(path.join(sourceRoot, 'pointer-effects.js'), 'utf8');
  new Function('window', 'document', 'matchMedia', 'innerWidth', 'innerHeight', 'requestAnimationFrame', 'cancelAnimationFrame', 'performance', 'MutationObserver', code)(
    win, document, globals.matchMedia, globals.innerWidth, globals.innerHeight,
    globals.requestAnimationFrame, globals.cancelAnimationFrame, globals.performance, globals.MutationObserver,
  );
  return { win, document, Event, frames, listeners, get disconnected() { return disconnected; } };
}

test('pointer artwork requires a fine pointer, enabled effects, and reduced-motion allowance', () => {
  for (const settings of [{ fine: false }, { reduced: true }, { effects: 'off' }]) {
    const env = loadPointer(settings);
    const api = env.win.PortfolioPointer || env.win.globalPortfolioPointer;
    api.mount(env.document.querySelector('#portfolio'));
    env.document.querySelector('a').dispatchEvent(new env.Event('pointermove', { bubbles: true }));
    assert.equal(env.document.querySelector('.pf-pointer-cursor')?.classList.contains('is-visible') ?? false, false);
    assert.equal(env.document.body.classList.contains('pf-pointer-active'), false);
    api.unmount();
  }
  const fullMotion = loadPointer({ reduced: true, motion: 'full' });
  const api = fullMotion.win.PortfolioPointer || fullMotion.win.globalPortfolioPointer;
  api.mount(fullMotion.document.querySelector('#portfolio'));
  const event = new fullMotion.Event('pointermove', { bubbles: true });
  Object.defineProperties(event, { clientX: { value: 200 }, clientY: { value: 150 } });
  fullMotion.document.querySelector('a').dispatchEvent(event);
  assert.equal(fullMotion.document.body.classList.contains('pf-pointer-active'), true, 'explicit full-motion choice overrides the OS preference');
  api.unmount();
});

test('pointer decoration preserves native input caret behavior and removes listeners and artwork on unmount', () => {
  const env = loadPointer();
  const api = env.win.PortfolioPointer || env.win.globalPortfolioPointer;
  assert(api, 'pointer extension is exposed on window');
  const root = env.document.querySelector('#portfolio');
  api.mount(root);
  assert.equal(env.document.querySelectorAll('.pf-pointer-cursor').length, 1);
  const input = root.querySelector('input');
  const move = target => {
    const event = new env.Event('pointermove', { bubbles: true });
    Object.defineProperties(event, { clientX: { value: 200 }, clientY: { value: 150 } });
    target.dispatchEvent(event);
  };
  move(root.querySelector('a'));
  assert.equal(env.document.body.classList.contains('pf-pointer-active'), true);
  move(input);
  assert.equal(env.document.querySelector('.pf-pointer-cursor').classList.contains('is-visible'), false);
  api.unmount();
  assert.equal(env.document.querySelector('.pf-pointer-cursor'), null);
  assert.equal(env.document.querySelector('.pf-pointer-cursor'), null);
  assert.equal(env.document.body.classList.contains('pf-pointer-active'), false);
  assert.equal(env.frames.size, 0);
  assert.equal(env.disconnected, 1);
});

test('background effects expose validated modes and clean up inert off-mode artwork', () => {
  const { document } = parseHTML('<!doctype html><html><body data-effects="on" data-motion="full" data-background="off"><main id="portfolio"></main><dialog open><div data-background-preview></div></dialog></body></html>');
  const frames = new Map();
  let frameId = 0, disconnects = 0;
  class Observer { constructor(callback) { this.callback = callback; } observe() {} disconnect() { disconnects++; } }
  const win = {
    matchMedia: query => ({ matches: query.includes('pointer: fine'), addEventListener() {}, removeEventListener() {} }),
    innerWidth: 1200, innerHeight: 800,
    requestAnimationFrame(fn) { const id = ++frameId; frames.set(id, fn); return id; },
    cancelAnimationFrame(id) { frames.delete(id); },
    addEventListener() {}, removeEventListener() {},
  };
  const source = fs.readFileSync(path.join(sourceRoot, 'background-effects.js'), 'utf8');
  new Function('window', 'document', 'MutationObserver', source)(win, document, Observer);
  const api = win.PortfolioBackground;
  assert.deepEqual(api.modes.map(mode => mode.id), ['off', 'glow', 'silk', 'membrane', 'molecular', 'aurora']);
  api.mount(document.querySelector('#portfolio'));
  assert.equal(document.querySelector('body > .pf-background-field').dataset.background, 'off');
  assert.equal(document.querySelector('[data-background-preview] .pf-background-preview-field').dataset.background, 'off');
  assert.equal(frames.size, 0, 'off mode schedules no animation frames');
  api.unmount();
  assert.equal(document.querySelector('.pf-background-field'), null, 'unmount removes both page and dialog artwork');
  assert.equal(disconnects, 1, 'unmount disconnects its mutation observer');
});

test('scroll story uses escaped project evidence only and omits unmatched synthetic records', () => {
  const env = loadStory();
  const api = env.win.PortfolioStory || env.win.globalPortfolioStory;
  assert(api, 'scroll story is exposed on window');
  const markup = api.render({ projects: [
    { title: '<img src=x onerror=alert(1)>', tags: ['bio <script>'] },
    { title: 'Synthetic chemistry build', tags: ['chemistry', 'Python'] },
    { title: 'Unrelated sample', tags: ['accounting'] },
  ] }, { e: escapeHTML });
  assert(!markup.includes('<img src=x'));
  assert(!markup.includes('<script>'));
  assert(markup.includes('&lt;img src=x onerror=alert(1)&gt;'));
  assert(markup.includes('Synthetic chemistry build'));
  assert(!markup.includes('Unrelated sample'));
  assert.equal((markup.match(/class="story-evidence"/g) || []).length, 2);
});

test('cinematic story morph preserves one finite XYZ topology and moves stable SVG nodes continuously', () => {
  const env = loadStory();
  const api = env.win.PortfolioStory;
  const geometry = api.geometry.build();
  const poses = [0, 0.25, 0.499999, 0.5, 0.75, 1].map(api.geometry.sample);
  const topology = poses[0].strands.map(strand => [strand.kind, strand.indices.join(','), strand.points.length]);
  for (const pose of poses) {
    assert.deepEqual(pose.strands.map(strand => [strand.kind, strand.indices.join(','), strand.points.length]), topology);
    assert(pose.strands.flatMap(strand => strand.points).every(point => point.length === 3 && point.every(Number.isFinite)));
    assert(api.geometry.frame(pose.progress).strands.flatMap(strand => strand.projected).every(point => point.length === 4 && point.every(Number.isFinite)));
  }
  assert.equal(new Set(geometry.strands.flatMap(strand => strand.indices)).size, geometry.vertexCount, 'each vertex has a stable unique identity');
  const before = api.geometry.sample(0.499999).strands.flatMap(strand => strand.points);
  const after = api.geometry.sample(0.5).strands.flatMap(strand => strand.points);
  assert(Math.max(...before.map((point, i) => Math.hypot(...point.map((n, j) => n - after[i][j])))) < 0.01, 'the midpoint has no pose discontinuity');

  const root = env.document.querySelector('#portfolio');
  root.innerHTML = api.render({ projects: [] }, { e: escapeHTML });
  const story = root.querySelector('[data-story]');
  const runway = story.querySelector('.story-runway'), stage = story.querySelector('.story-stage');
  runway.getBoundingClientRect = () => ({ top: 0, height: 1800 });
  stage.getBoundingClientRect = () => ({ height: 600 });
  api.mount(root);
  env.tick(16);
  const vertex = story.querySelector('[data-morph-vertex="0"]');
  assert(vertex);
  const initial = [vertex.getAttribute('cx'), vertex.getAttribute('cy')];
  runway.getBoundingClientRect = () => ({ top: -600, height: 1800 });
  env.dispatch('scroll');
  env.tick(32);
  assert.equal(story.querySelector('[data-morph-vertex="0"]'), vertex, 'scrubbing updates existing vertices instead of replacing nodes');
  assert.notDeepEqual([vertex.getAttribute('cx'), vertex.getAttribute('cy')], initial);
  assert([...story.querySelectorAll('[data-morph-vertex]')].every(node => ['cx', 'cy', 'r'].every(key => Number.isFinite(Number(node.getAttribute(key))))));
  api.unmount();
});

test('static story scrubber changes the pose in place while keeping chapter text readable', () => {
  const env = loadStory();
  const api = env.win.PortfolioStory, root = env.document.querySelector('#portfolio');
  root.innerHTML = api.render({ projects: [] }, { e: escapeHTML });
  env.win.innerWidth = 800;
  const story = root.querySelector('[data-story]');
  api.mount(root);
  assert.equal(story.dataset.storyMode, 'static');
  const scrubber = story.querySelector('[data-story-scrub]');
  assert(scrubber.closest('label').textContent.includes('Explore the transformation'), 'range input has its visible accessible label');
  const vertex = story.querySelector('[data-morph-vertex="0"]');
  const initial = [vertex.getAttribute('cx'), vertex.getAttribute('cy')];
  scrubber.value = '73';
  scrubber.dispatchEvent(new env.Event('input', { bubbles: true }));
  assert.equal(story.querySelector('[data-morph-vertex="0"]'), vertex, 'manual posing mutates the existing SVG vertex');
  assert.notDeepEqual([vertex.getAttribute('cx'), vertex.getAttribute('cy')], initial);
  assert.equal(story.dataset.morphProgress, '0.7300');
  assert.equal(scrubber.getAttribute('aria-valuetext'), 'Chemistry to code, 46% of transition');
  const chapters = [...story.querySelectorAll('[data-story-chapter]')];
  assert.equal(chapters.length, 3);
  assert(chapters.every(chapter => !chapter.hidden && chapter.style.opacity === '' && chapter.style.transform === ''), 'static manual posing leaves every chapter fully readable');
  api.unmount();
});

test('desktop story scrubber seeks the matching scroll position', () => {
  const env = loadStory();
  const api = env.win.PortfolioStory, root = env.document.querySelector('#portfolio');
  root.innerHTML = api.render({ projects: [] }, { e: escapeHTML });
  const story = root.querySelector('[data-story]'), runway = story.querySelector('.story-runway');
  runway.getBoundingClientRect = () => ({ top: 400, height: 1800 });
  story.querySelector('.story-stage').getBoundingClientRect = () => ({ height: 600 });
  api.mount(root);
  const scrubber = story.querySelector('[data-story-scrub]');
  scrubber.value = '50';
  scrubber.dispatchEvent(new env.Event('input', { bubbles: true }));
  assert.deepEqual(env.scrollCalls.at(-1), { top: 908, behavior: 'instant' });
  api.unmount();
});

test('scroll story clamps scrubbed progress and restores static fallback styles and listeners on unmount', () => {
  const env = loadStory();
  const api = env.win.PortfolioStory || env.win.globalPortfolioStory;
  const root = env.document.querySelector('#portfolio');
  root.innerHTML = api.render({ projects: [] }, { e: escapeHTML });
  const story = root.querySelector('[data-story]');
  const runway = story.querySelector('.story-runway');
  const stage = story.querySelector('.story-stage');
  runway.getBoundingClientRect = () => ({ top: -5000, height: 2000 });
  stage.getBoundingClientRect = () => ({ height: 600 });
  api.mount(root);
  assert.equal(story.dataset.storyMode, 'scroll');
  env.tick();
  assert.equal(story.style.getPropertyValue('--story-progress'), '1.0000');
  assert.equal(story.querySelector('[data-story-go="2"]').getAttribute('aria-current'), 'step');
  env.document.body.dataset.effects = 'off';
  env.notifyMutation();
  assert.equal(story.dataset.storyMode, 'static');
  for (const property of ['--story-progress', '--story-camera', '--story-scale']) {
    assert.equal(story.style.getPropertyValue(property), '', `${property} clears when effects are disabled`);
  }
  assert.equal(story.querySelector('[data-story-go="2"]').hasAttribute('aria-current'), false);
  api.unmount();
  assert.equal(story.hasAttribute('data-story-mode'), false);
  assert.equal(story.style.getPropertyValue('--story-progress'), '');
  assert.equal(env.disconnects, 1);

  env.document.body.dataset.effects = 'on';
  env.win.innerWidth = 800;
  api.mount(root);
  assert.equal(story.dataset.storyMode, 'static', 'mobile view stays in the readable static layout');
  api.unmount();
  env.win.innerWidth = 1280;
  env.document.body.dataset.effects = 'off';
  api.mount(root);
  assert.equal(story.dataset.storyMode, 'static');
  assert.equal(story.querySelector('[data-story-chapter="0"]').style.opacity, '');
  api.unmount();
});

