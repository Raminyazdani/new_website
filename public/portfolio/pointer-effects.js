/* Opt-in, local-only pointer artwork for the authenticated portfolio. */
(() => {
  'use strict';

  const api = window.PortfolioPointer || (window.PortfolioPointer = {});
  let active = null;

  api.mount = function mount(root) {
    api.unmount();
    if (!root || !root.matches || !root.matches('#portfolio')) return;
    const finePointer = window.matchMedia ? window.matchMedia('(hover: hover) and (pointer: fine)') : { matches: false };
    const reducedMotion = window.matchMedia ? window.matchMedia('(prefers-reduced-motion: reduce)') : { matches: false };
    const ns = 'http://www.w3.org/2000/svg';
    const svg = document.createElementNS(ns, 'svg');
    svg.classList.add('pf-pointer-field');
    svg.setAttribute('viewBox', `0 0 ${window.innerWidth} ${window.innerHeight}`);
    svg.setAttribute('preserveAspectRatio', 'none');
    svg.setAttribute('aria-hidden', 'true');
    const defs = document.createElementNS(ns, 'defs');
    const gradient = document.createElementNS(ns, 'radialGradient');
    gradient.id = 'pf-pointer-wash-gradient';
    gradient.innerHTML = '<stop offset="0" stop-color="var(--lime)" stop-opacity=".14"/><stop offset="1" stop-color="var(--lime)" stop-opacity="0"/>';
    defs.append(gradient);
    const wash = document.createElementNS(ns, 'circle');
    wash.classList.add('pf-pointer-wash');
    wash.setAttribute('r', '165');
    wash.setAttribute('fill', 'url(#pf-pointer-wash-gradient)');
    const bonds = document.createElementNS(ns, 'g');
    const nodes = document.createElementNS(ns, 'g');
    bonds.classList.add('pf-pointer-bonds');
    nodes.classList.add('pf-pointer-nodes');
    svg.append(defs, wash, bonds, nodes);

    // A viewport-anchored lattice; only the local cells flex under the pointer.
    const points = Array.from({ length: 16 }, (_, i) => ({ col: i % 4, row: Math.floor(i / 4) }));
    const edges = [];
    for (let row = 0; row < 4; row++) for (let col = 0; col < 4; col++) {
      const index = row * 4 + col;
      if (col < 3) edges.push([index, index + 1]);
      if (row < 3) edges.push([index, index + 4]);
    }
    const lines = edges.map(() => {
      const line = document.createElementNS(ns, 'line');
      bonds.append(line);
      return line;
    });
    const circles = points.map((_, i) => {
      const circle = document.createElementNS(ns, 'circle');
      circle.setAttribute('r', i % 4 === 0 ? '2.5' : '1.6');
      nodes.append(circle);
      return circle;
    });
    const cursor = document.createElement('div');
    cursor.className = 'pf-pointer-cursor';
    cursor.setAttribute('aria-hidden', 'true');
    cursor.innerHTML = '<i></i><b></b><span></span>';
    const label = cursor.querySelector('span');
    document.body.append(svg, cursor);

    const state = { root, svg, cursor, finePointer, reducedMotion, x: -100, y: -100,
      tx: -100, ty: -100, inside: false, raf: 0, lastMove: 0, target: null,
      visible: false, cleanup: [] };
    active = state;

    function listen(target, type, fn, opts) {
      target.addEventListener(type, fn, opts);
      state.cleanup.push(() => target.removeEventListener(type, fn, opts));
    }
    function canRun() {
      const fullMotion = document.body.dataset.motion === 'full';
      return active === state && root.isConnected && document.body.dataset.effects === 'on' && document.body.dataset.pointer !== 'off' &&
        finePointer.matches && (fullMotion || !reducedMotion.matches) && document.visibilityState === 'visible' &&
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
      svg.classList.toggle('is-visible', enabled && state.inside);
      state.visible = show;
      if (!enabled) { (window.cancelAnimationFrame || window.clearTimeout)(state.raf); state.raf = 0; }
      else if (state.inside) schedule();
    }
    function nearestTarget(el) {
      const target = el?.closest('a,button,[role="button"],summary');
      if (!target || !root.contains(target)) return '';
      const raw = target.getAttribute('aria-label') || target.getAttribute('title') || target.textContent || '';
      return raw.trim().replace(/\s+/g, ' ').slice(0, 22);
    }
    function pointerMove(event) {
      state.tx = event.clientX; state.ty = event.clientY; state.target = event.target;
      state.inside = event.pointerType !== 'touch' && root.contains(event.target) && event.clientX >= 0 && event.clientY >= 0 && event.clientX <= window.innerWidth && event.clientY <= window.innerHeight;
      cursor.style.transform = `translate3d(${event.clientX - 19}px,${event.clientY - 19}px,0)`;
      const text = nearestTarget(event.target);
      cursor.classList.toggle('is-target', !!text);
      cursor.classList.toggle('label-left', event.clientX > window.innerWidth - 180);
      cursor.classList.toggle('label-up', event.clientY > window.innerHeight - 58);
      label.textContent = text;
      refresh();
      state.lastMove = window.performance?.now?.() ?? Date.now();
      schedule();
    }
    function pointerOut(event) {
      if ((event.relatedTarget && root.contains(event.target) && !root.contains(event.relatedTarget)) ||
          (!event.relatedTarget && (event.clientX <= 0 || event.clientY <= 0 || event.clientX >= window.innerWidth || event.clientY >= window.innerHeight))) {
        state.inside = false; state.target = null; refresh();
      }
    }
    function schedule() {
      if (!state.raf && canRun()) state.raf = window.requestAnimationFrame ? window.requestAnimationFrame(frame) : window.setTimeout(() => frame(Date.now()), 16);
    }
    function frame(now) {
      state.raf = 0;
      if (!canRun() || !state.inside) return refresh();
      const ease = .22;
      state.x += (state.tx - state.x) * ease; state.y += (state.ty - state.y) * ease;
      svg.setAttribute('viewBox', `0 0 ${window.innerWidth} ${window.innerHeight}`);
      const width = window.innerWidth, height = window.innerHeight;
      const coords = points.map((p) => {
        const bx = width * (p.col + 1) / 5, by = height * (p.row + 1) / 5;
        const dx = bx - state.x, dy = by - state.y;
        const dist = Math.max(1, Math.hypot(dx, dy));
        const influence = Math.max(0, 1 - dist / 185);
        const shift = influence * influence * 20;
        return [bx + dx / dist * shift, by + dy / dist * shift];
      });
      wash.setAttribute('cx', state.x.toFixed(1)); wash.setAttribute('cy', state.y.toFixed(1));
      coords.forEach(([x, y], i) => {
        circles[i].setAttribute('cx', x.toFixed(1)); circles[i].setAttribute('cy', y.toFixed(1));
      });
      edges.forEach(([from, to], i) => {
        const [x, y] = coords[from], [nx, ny] = coords[to];
        lines[i].setAttribute('x1', x.toFixed(1)); lines[i].setAttribute('y1', y.toFixed(1));
        lines[i].setAttribute('x2', nx.toFixed(1)); lines[i].setAttribute('y2', ny.toFixed(1));
      });
      if (now - state.lastMove < 1300) schedule();
    }
    listen(document, 'pointermove', pointerMove, { passive: true });
    listen(document, 'pointerout', pointerOut, { passive: true });
    listen(window, 'blur', () => { state.inside = false; refresh(); }, { passive: true });
    listen(window, 'focus', refresh, { passive: true });
    listen(window, 'resize', () => { svg.setAttribute('viewBox', `0 0 ${window.innerWidth} ${window.innerHeight}`); schedule(); }, { passive: true });
    listen(document, 'visibilitychange', refresh, { passive: true });
    const onMedia = () => refresh();
    finePointer.addEventListener?.('change', onMedia);
    reducedMotion.addEventListener?.('change', onMedia);
    state.cleanup.push(() => finePointer.removeEventListener?.('change', onMedia), () => reducedMotion.removeEventListener?.('change', onMedia));
    if (window.MutationObserver) {
      const observer = new window.MutationObserver(refresh);
      observer.observe(document.body, { attributes: true, attributeFilter: ['data-effects', 'data-motion','data-pointer'] });
      observer.observe(document.body, { subtree: true, childList: true, attributes: true, attributeFilter: ['open'] });
      state.cleanup.push(() => observer.disconnect());
    }
    refresh();
  };

  api.unmount = function unmount() {
    if (!active) return;
    const state = active; active = null;
    (window.cancelAnimationFrame || window.clearTimeout)(state.raf);
    state.cleanup.forEach((fn) => fn());
    document.body.classList.remove('pf-pointer-active');
    state.svg.remove(); state.cursor.remove();
  };
})();
