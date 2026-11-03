/* Local-only cursor artwork for the authenticated portfolio. */
(() => {
  'use strict';

  const api = window.PortfolioPointer || (window.PortfolioPointer = {});
  let active = null;

  api.mount = function mount(root) {
    api.unmount();
    if (!root || !root.matches || !root.matches('#portfolio')) return;

    const finePointer = window.matchMedia ? window.matchMedia('(hover: hover) and (pointer: fine)') : { matches: false };
    const reducedMotion = window.matchMedia ? window.matchMedia('(prefers-reduced-motion: reduce)') : { matches: false };
    const cursor = document.createElement('div');
    cursor.className = 'pf-pointer-cursor';
    cursor.setAttribute('aria-hidden', 'true');
    cursor.innerHTML = '<i></i><b></b>';
    document.body.append(cursor);

    const state = { root, cursor, finePointer, reducedMotion, x: 0, y: 0,
      tx: 0, ty: 0, inside: false, raf: 0, target: null, cleanup: [] };
    active = state;

    function listen(target, type, fn, opts) {
      target.addEventListener(type, fn, opts);
      state.cleanup.push(() => target.removeEventListener(type, fn, opts));
    }
    function canRun() {
      const motion = document.body.dataset.motion || 'auto';
      const motionAllowed = motion === 'full' || (motion === 'auto' && !reducedMotion.matches);
      return active === state && root.isConnected && document.body.dataset.effects === 'on' &&
        document.body.dataset.pointer !== 'off' &&
        finePointer.matches && motionAllowed && document.visibilityState === 'visible' &&
        !document.querySelector('dialog[open]');
    }
    function nativeCursorTarget(el) {
      return !!el?.closest('select,input,textarea,[contenteditable="true"],iframe');
    }
    function refresh() {
      const enabled = canRun();
      const show = enabled && state.inside && !nativeCursorTarget(state.target);
      document.body.classList.toggle('pf-pointer-active', show);
      cursor.classList.toggle('is-visible', show);
      if (!enabled || !state.inside) {
        (window.cancelAnimationFrame || window.clearTimeout)(state.raf);
        state.raf = 0;
      } else if (Math.abs(state.tx - state.x) + Math.abs(state.ty - state.y) > .15) schedule();
    }
    function pointerMove(event) {
      const wasInside = state.inside;
      state.tx = event.clientX;
      state.ty = event.clientY;
      state.target = event.target;
      state.inside = event.pointerType !== 'touch' && root.contains(event.target) &&
        event.clientX >= 0 && event.clientY >= 0 && event.clientX <= window.innerWidth && event.clientY <= window.innerHeight;
      if (state.inside && !wasInside) { state.x = state.tx; state.y = state.ty; }
      cursor.style.transform = `translate3d(${event.clientX}px,${event.clientY}px,0)`;
      cursor.classList.remove('is-target');
      refresh();
      schedule();
    }
    function pointerOut(event) {
      if ((event.relatedTarget && root.contains(event.target) && !root.contains(event.relatedTarget)) ||
          (!event.relatedTarget && (event.clientX <= 0 || event.clientY <= 0 || event.clientX >= window.innerWidth || event.clientY >= window.innerHeight))) {
        state.inside = false;
        state.target = null;
        refresh();
      }
    }
    function schedule() {
      if (!state.raf && canRun() && state.inside) {
        state.raf = window.requestAnimationFrame ? window.requestAnimationFrame(frame) : window.setTimeout(frame, 16);
      }
    }
    function frame() {
      state.raf = 0;
      if (!canRun() || !state.inside) return refresh();
      state.x += (state.tx - state.x) * .2;
      state.y += (state.ty - state.y) * .2;
      cursor.style.setProperty('--ring-x', `${(state.x - state.tx).toFixed(2)}px`);
      cursor.style.setProperty('--ring-y', `${(state.y - state.ty).toFixed(2)}px`);
      if (Math.abs(state.tx - state.x) + Math.abs(state.ty - state.y) > .15) schedule();
      else { state.x = state.tx; state.y = state.ty; }
    }

    listen(document, 'pointermove', pointerMove, { passive: true });
    listen(document, 'pointerout', pointerOut, { passive: true });
    listen(window, 'blur', () => { state.inside = false; refresh(); }, { passive: true });
    listen(window, 'focus', refresh, { passive: true });
    listen(document, 'visibilitychange', refresh, { passive: true });
    const onMedia = () => refresh();
    finePointer.addEventListener?.('change', onMedia);
    reducedMotion.addEventListener?.('change', onMedia);
    state.cleanup.push(() => finePointer.removeEventListener?.('change', onMedia), () => reducedMotion.removeEventListener?.('change', onMedia));
    if (window.MutationObserver) {
      const observer = new window.MutationObserver(refresh);
      observer.observe(document.body, { attributes: true, attributeFilter: ['data-effects', 'data-motion', 'data-pointer'] });
      observer.observe(document.body, { subtree: true, childList: true, attributes: true, attributeFilter: ['open'] });
      state.cleanup.push(() => observer.disconnect());
    }
    refresh();
  };

  api.unmount = function unmount() {
    if (!active) return;
    const state = active;
    active = null;
    (window.cancelAnimationFrame || window.clearTimeout)(state.raf);
    state.cleanup.forEach((fn) => fn());
    document.body.classList.remove('pf-pointer-active');
    state.cursor.remove();
  };
})();
