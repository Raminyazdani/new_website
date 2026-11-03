'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { parseHTML } = require('linkedom');

const code = fs.readFileSync(path.join(__dirname, '../public/portfolio/motion-system.js'), 'utf8');

function environment({ reduced = false, mode = 'auto', effects = 'on', waapi = true, modal = false } = {}) {
  const { document, Event } = parseHTML(`<!doctype html><html><body data-motion="${mode}" data-effects="${effects}" data-design="synthetic-design"><main id="portfolio"><section id="hero">${Array.from({ length: 6 }, (_, i) => `<div data-motion-part>Readable synthetic group ${i}</div>`).join('')}</section><input data-filter><button data-design-step="1">Next</button><button data-choose>Choose</button></main>${modal ? '<dialog open></dialog>' : ''}</body></html>`);
  let hidden = false;
  Object.defineProperty(document, 'hidden', { get: () => hidden });
  const media = { matches: reduced, addEventListener() {}, removeEventListener() {} };
  const records = [];
  const observerRecords = [];
  class Observer {
    constructor(callback) { this.callback = callback; observerRecords.push(this); }
    observe(target, options) { this.target = target; this.options = options; }
    disconnect() { this.disconnected = true; }
  }
  const root = document.querySelector('#portfolio');
  if (waapi) root.querySelectorAll('[data-motion-part]').forEach(part => {
    part.animate = (frames, options) => {
      let resolve, reject;
      const record = { part, frames, options, canceled: false, finished: new Promise((yes, no) => { resolve = yes; reject = no; }) };
      record.finish = resolve;
      record.cancel = () => { record.canceled = true; reject(new Error('Canceled synthetic animation')); };
      records.push(record);
      return record;
    };
  });
  const window = { document, matchMedia: () => media, MutationObserver: Observer,
    getComputedStyle: element => ({ transform: element.style.transform || 'none' }) };
  new Function('window', code)(window);
  function event(type, target = document) { target.dispatchEvent(new Event(type, { bubbles: true })); }
  return { document, root, records, observerRecords, api: window.PortfolioMotion, media, event, hide(value) { hidden = value; event('visibilitychange'); } };
}

test('motion follows Auto/OS, explicit Full, and Still/Off without changing visible content', () => {
  for (const [settings, allowed] of [
    [{}, true], [{ reduced: true }, false], [{ reduced: true, mode: 'full' }, true],
    [{ mode: 'still' }, false], [{ mode: 'off' }, false], [{ mode: 'full', effects: 'off' }, false]
  ]) {
    const env = environment(settings);
    env.api.mount(env.root);
    assert.equal(env.api.sync(), allowed, JSON.stringify(settings));
    assert.equal(env.records.length > 0, allowed);
    assert.equal(env.document.body.dataset.pfMotion, allowed ? 'spatial' : 'still');
    assert([...env.root.querySelectorAll('[data-motion-part]')].every(part => !part.hidden && !part.style.opacity && !part.style.transform));
    env.api.unmount();
  }
});

test('missing WAAPI is a readable static fallback and unmarked designs are unaffected', () => {
  const env = environment({ waapi: false });
  const before = env.root.innerHTML;
  env.api.mount(env.root);
  assert.equal(env.root.innerHTML, before);
  assert.equal(env.records.length, 0);
  assert.equal(env.api.entrance(env.root, { initial: true }), false);
  env.api.unmount();
  const unmarked = environment();
  unmarked.root.querySelectorAll('[data-motion-part]').forEach(part => part.removeAttribute('data-motion-part'));
  unmarked.api.mount(unmarked.root);
  assert.equal(unmarked.records.length, 0);
  unmarked.api.unmount();
});

test('entrance preserves an authored portrait transform throughout and after the animation', async () => {
  const env = environment();
  const portrait = env.root.querySelector('[data-motion-part]');
  const resting = 'matrix(0.99863, 0.05234, -0.05234, 0.99863, 0, 0)';
  portrait.style.transform = resting;
  env.api.mount(env.root);
  const animation = env.records.find(record => record.part === portrait);
  assert(animation, 'the transformed group still receives the optional entrance');
  assert(animation.frames.every(frame => frame.transform.endsWith(resting)), 'both frames retain the authored rotation matrix');
  assert.equal(portrait.style.transform, resting, 'animation never overwrites the authored inline style');
  animation.finish();
  await Promise.resolve();
  assert.equal(portrait.style.transform, resting, 'completion returns to the identical authored transform');
  env.api.unmount();
  assert.equal(portrait.style.transform, resting, 'cleanup preserves the recipe composition');
});

test('hero entry is bounded and never replays on filtering or repeat design selection', () => {
  const env = environment();
  env.api.mount(env.root);
  assert(env.records.length <= 4 && env.records.length > 0);
  assert(env.records.every(record => record.options.duration + record.options.delay < 300));
  const count = env.records.length;
  env.event('input', env.root.querySelector('input'));
  env.api.sync();
  env.api.entrance(env.root, { initial: true });
  assert.equal(env.records.length, count);
  env.api.mount(env.root);
  assert.equal(env.records.length, count);
  env.api.unmount();
});

test('switching to Still, hiding the document, and unmounting cancel in-flight work', () => {
  for (const stop of [
    env => { env.document.body.dataset.motion = 'still'; env.api.sync(); },
    env => env.hide(true),
    env => env.api.unmount()
  ]) {
    const env = environment();
    env.api.mount(env.root);
    assert(env.records.length > 0);
    stop(env);
    assert(env.records.every(record => record.canceled));
    assert.equal(env.document.body.dataset.pfMotion, 'still');
    assert([...env.root.querySelectorAll('[data-motion-part]')].every(part => !part.style.opacity));
    env.api.unmount();
    assert(env.observerRecords.every(observer => observer.disconnected));
  }
});

test('keyboard and rapid design-step controls stay immediate, pointer selection can introduce a new design', () => {
  const env = environment();
  env.api.mount(env.root);
  const initial = env.records.length;
  env.event('keydown');
  env.document.body.dataset.design = 'keyboard-design';
  env.api.mount(env.root);
  assert.equal(env.records.length, initial);
  env.event('pointerdown', env.root.querySelector('[data-design-step]'));
  env.document.body.dataset.design = 'step-design';
  env.api.mount(env.root);
  assert.equal(env.records.length, initial);
  env.event('pointerdown', env.root.querySelector('[data-choose]'));
  env.document.body.dataset.design = 'pointer-design';
  env.api.mount(env.root);
  assert(env.records.length > initial);
  env.api.unmount();
});

test('a hero selected under a modal waits for native close and pending work is discarded on lock', () => {
  const env = environment({ modal: true });
  env.api.mount(env.root);
  assert.equal(env.records.length, 0);
  const dialog = env.document.querySelector('dialog');
  dialog.removeAttribute('open');
  env.event('close', dialog);
  assert(env.records.length > 0);
  env.api.unmount();
  const locked = environment({ modal: true });
  locked.api.mount(locked.root);
  locked.api.unmount();
  const other = locked.document.querySelector('dialog');
  other.removeAttribute('open');
  locked.event('close', other);
  assert.equal(locked.records.length, 0);
});
