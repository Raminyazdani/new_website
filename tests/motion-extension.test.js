'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { parseHTML } = require('linkedom');

const sourceRoot = path.join(__dirname, '../public/portfolio');

function loadStory() {
  const { document } = parseHTML('<!doctype html><html><body data-effects="on"><main id="portfolio"></main></body></html>');
  let frameCallback = null;
  let frameId = 0;
  const events = new Map();
  let disconnects = 0;
  let observerCallback;
  class Observer { constructor(callback) { observerCallback = callback; } observe() {} disconnect() { disconnects++; } }
  const win = {
    document, innerWidth: 1280, innerHeight: 900, scrollY: 0,
    matchMedia: () => ({ matches: false, addEventListener() {}, removeEventListener() {} }),
    requestAnimationFrame(fn) { frameCallback = fn; return ++frameId; },
    cancelAnimationFrame() { frameCallback = null; },
    addEventListener(type, fn) { events.set(type, fn); },
    removeEventListener(type) { events.delete(type); },
    scrollTo() {}, MutationObserver: Observer,
  };
  new Function('window', fs.readFileSync(path.join(sourceRoot, 'scroll-story.js'), 'utf8'))(win);
  return {
    win, document,
    tick(time = 1) { const fn = frameCallback; frameCallback = null; fn?.(time); },
    dispatch(type) { events.get(type)?.(); },
    notifyMutation() { observerCallback?.(); },
    get disconnects() { return disconnects; },
  };
}

const escapeHTML = value => String(value).replace(/[&<>"']/g, ch => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[ch]));

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
  assert.equal(env.document.querySelectorAll('.pf-pointer-field').length, 1);
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
  assert.equal(env.document.querySelector('.pf-pointer-field'), null);
  assert.equal(env.document.querySelector('.pf-pointer-cursor'), null);
  assert.equal(env.document.body.classList.contains('pf-pointer-active'), false);
  assert.equal(env.frames.size, 0);
  assert.equal(env.disconnected, 1);
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

