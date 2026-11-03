/* Progressive, bounded motion. Default document styles always remain readable. */
(function (w) {
  'use strict';

  const doc = w.document;
  if (!doc?.body) return;
  const seen = new Set();
  const animations = new Set();
  const reduced = w.matchMedia?.('(prefers-reduced-motion: reduce)');
  let root = null, observer = null, removers = [], pending = null, hasMounted = false;
  let input = 'keyboard', instant = false;
  const EASE_OUT = 'cubic-bezier(0.23, 1, 0.32, 1)';

  function listen(target, type, handler, options) {
    target?.addEventListener?.(type, handler, options);
    removers.push(() => target?.removeEventListener?.(type, handler, options));
  }

  function movementAllowed() {
    const choice = doc.body.dataset.motion || 'auto';
    return !!root?.isConnected && !root.hidden && !doc.hidden &&
      doc.body.dataset.effects === 'on' &&
      (choice === 'full' || (choice === 'auto' && !reduced?.matches));
  }

  function cancelAnimations() {
    animations.forEach(animation => { try { animation.cancel(); } catch {} });
    animations.clear();
  }

  function sync() {
    const movement = movementAllowed();
    doc.body.dataset.pfMotion = movement ? 'spatial' : 'still';
    if (!movement) { pending = null; cancelAnimations(); }
    return movement;
  }

  function entrance(target = root, options = {}) {
    const key = String(options.key || doc.body.dataset.design || doc.body.dataset.concept || 'default');
    if (target !== root || !sync() || seen.has(key) || instant || input === 'keyboard' && options.initial !== true) return false;
    const parts = [...target.querySelectorAll('#hero [data-motion-part]')]
      .filter(part => !part.hidden && !part.closest('[hidden]'))
      // A nested marker would animate the same content twice.
      .filter(part => !part.parentElement?.closest('[data-motion-part]'))
      .slice(0, 4);
    if (!parts.length || parts.some(part => typeof part.animate !== 'function')) return false;
    if (doc.querySelector('dialog[open]')) { pending = { target, options: { ...options, key } }; return false; }
    pending = null;
    seen.add(key);
    // A recipe may already rotate its portrait. Read each resting transform
    // before starting any animation; replacing it would snap on completion.
    const resting = parts.map(part => {
      const transform = w.getComputedStyle?.(part)?.transform || part.style.transform || 'none';
      return { part, baseline: transform === 'none' ? '' : ` ${transform}` };
    });
    resting.forEach(({ part, baseline }, index) => {
      try {
        const animation = part.animate([
          { opacity: 0.55, transform: `translateY(8px)${baseline}` },
          { opacity: 1, transform: `translateY(0)${baseline}` }
        ], { duration: 200, delay: index * 30, easing: EASE_OUT, fill: 'backwards' });
        animations.add(animation);
        animation.finished?.then(() => animations.delete(animation), () => animations.delete(animation));
      } catch {
        // No start-state classes or inline styles exist to strand the content.
      }
    });
    return animations.size > 0;
  }

  function unmount() {
    cancelAnimations();
    pending = null;
    observer?.disconnect(); observer = null;
    removers.forEach(remove => remove()); removers = [];
    root = null;
    doc.body.dataset.pfMotion = 'still';
  }

  function mount(target) {
    const initial = !hasMounted;
    unmount();
    if (!target?.matches?.('#portfolio') || !target.isConnected || target.hidden) return;
    hasMounted = true;
    root = target;
    listen(doc, 'pointerdown', event => {
      input = 'pointer';
      instant = !!event.target?.closest?.('[data-design-step], [data-motion-instant]');
      doc.body.dataset.pfInput = input;
    }, { capture: true, passive: true });
    listen(doc, 'keydown', () => {
      input = 'keyboard'; instant = false;
      pending = null; cancelAnimations();
      doc.body.dataset.pfInput = input;
    }, true);
    listen(doc, 'visibilitychange', sync);
    listen(reduced, 'change', sync);
    listen(doc, 'close', () => {
      if (!pending || doc.querySelector('dialog[open]')) return;
      const next = pending; pending = null;
      entrance(next.target, next.options);
    }, true);
    if (w.MutationObserver) {
      observer = new w.MutationObserver(sync);
      observer.observe(doc.body, { attributes: true, attributeFilter: ['data-effects', 'data-motion'] });
    }
    doc.body.dataset.pfInput = input;
    if (sync()) entrance(target, { initial });
  }

  w.PortfolioMotion = { mount, unmount, sync, entrance };
})(window);
