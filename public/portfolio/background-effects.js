/* Original SVG background studies. Local, dependency-free, and disposable. */
(() => {
  'use strict';

  const modes = Object.freeze([
    { id: 'off', label: 'Off', description: 'A clear, quiet page.' },
    { id: 'glow', label: 'Soft light', description: 'Diffuse pools of blue light.' },
    { id: 'silk', label: 'Silk', description: 'Fine flowing contours that bend toward your pointer.' },
    { id: 'membrane', label: 'Membrane', description: 'Soft, living contours inspired by cellular forms.' },
    { id: 'molecular', label: 'Molecular', description: 'Sparse organic bonds and translucent molecular forms.' },
    { id: 'aurora', label: 'Aurora', description: 'Broad translucent ribbons of flowing light.' }
  ]);
  const validModes = new Set(modes.map(mode => mode.id));
  const NS = 'http://www.w3.org/2000/svg';
  let active = null;
  let serial = 0;

  function smooth(points, closed = false) {
    if (points.length < 2) return '';
    let path = `M${points[0][0].toFixed(2)},${points[0][1].toFixed(2)}`;
    const count = points.length;
    for (let i = 0; i < (closed ? count : count - 1); i++) {
      const a = points[closed ? (i - 1 + count) % count : Math.max(0, i - 1)];
      const b = points[i];
      const c = points[(i + 1) % count];
      const d = points[closed ? (i + 2) % count : Math.min(count - 1, i + 2)];
      path += `C${(b[0] + (c[0] - a[0]) / 6).toFixed(2)},${(b[1] + (c[1] - a[1]) / 6).toFixed(2)} ${(c[0] - (d[0] - b[0]) / 6).toFixed(2)},${(c[1] - (d[1] - b[1]) / 6).toFixed(2)} ${c[0].toFixed(2)},${c[1].toFixed(2)}`;
    }
    return path + (closed ? 'Z' : '');
  }

  // A local displacement, rather than a whole-scene cursor translation.
  function bend(x, y, pointer, amount = 1) {
    const dx = x - pointer.x;
    const dy = y - pointer.y;
    const influence = Math.exp(-(dx * dx + dy * dy) / 42000) * pointer.strength * amount;
    return [x + (dy * .14 + 15) * influence, y + (-dx * .1 - 23) * influence];
  }

  function geometry(mode, pointer, id) {
    const shapes = [];
    const path = (d, className, extra = {}) => shapes.push({ tag: 'path', attrs: { d, class: className, ...extra } });
    const circle = (cx, cy, r, className, extra = {}) => shapes.push({ tag: 'circle', attrs: { cx, cy, r, class: className, ...extra } });
    const paint = name => `url(#${id}-${name})`;

    if (mode === 'glow') {
      [[95, 135, 390, 'blue'], [945, 425, 430, 'teal'], [540, 740, 410, 'pearl']].forEach(([x, y, r, color], i) => {
        const [cx, cy] = bend(x, y, pointer, 2.4);
        circle(cx, cy, r, 'pf-bg-glow', { fill: paint(color) });
        if (i < 2) circle(cx + 30, cy - 15, r * .6, 'pf-bg-glow-core', { fill: paint('pearl') });
      });
      circle(pointer.x, pointer.y, 220, 'pf-bg-local-light', { fill: paint('pearl'), opacity: (pointer.strength * .7).toFixed(3) });
    }

    if (mode === 'silk') {
      // Two wide streams of very fine contours, with a generous breathing space.
      for (let family = 0; family < 2; family++) {
        for (let line = 0; line < 18; line++) {
          const points = [];
          for (let step = 0; step <= 30; step++) {
            const x = -100 + step * 40;
            const t = x / 1000;
            const y = family === 0
              ? 560 - 590 * t + 150 * Math.sin(t * 4.8 + .5) + line * (9 + 5 * Math.sin(t * 2))
              : 735 - 175 * Math.sin(t * 3.6 + .2) - line * 11 + 40 * t;
            points.push(bend(x, y, pointer, 1 + line / 50));
          }
          path(smooth(points), `pf-bg-thread ${family ? 'pf-bg-thread-teal' : ''}`, { opacity: (.19 + Math.sin(line / 18 * Math.PI) * .38).toFixed(3) });
          if (line === 0 || line === 17) {
            const ribbon = [...points, ...points.slice().reverse().map(([x, y]) => [x, y + 27])];
            path(smooth(ribbon, true), 'pf-bg-silk-wash', { fill: paint(family ? 'ribbonTeal' : 'ribbonBlue') });
          }
        }
      }
    }

    if (mode === 'membrane') {
      const cells = [[-70, 230, 310, 1.25, .7], [1005, 560, 310, .91, 2.8], [865, -120, 245, .75, 1.6]];
      cells.forEach(([cx, cy, radius, squash, phase], cell) => {
        for (let ring = 0; ring < 8; ring++) {
          const points = [];
          const size = radius - ring * 19;
          for (let step = 0; step < 52; step++) {
            const angle = step / 52 * Math.PI * 2;
            const organic = 1 + .07 * Math.sin(angle * 3 + phase) + .045 * Math.cos(angle * 5 - phase);
            points.push(bend(cx + Math.cos(angle) * size * organic, cy + Math.sin(angle) * size * squash * organic, pointer, 1.5));
          }
          path(smooth(points, true), `pf-bg-membrane ${cell === 1 ? 'pf-bg-membrane-teal' : ''}`, {
            fill: ring === 0 ? paint(cell === 1 ? 'cellTeal' : 'cellBlue') : 'none',
            opacity: (1 - ring * .077).toFixed(3)
          });
        }
        const [nx, ny] = bend(cx + radius * .11, cy - radius * .12, pointer, 1.8);
        circle(nx, ny, radius * .19, 'pf-bg-cell-core', { fill: paint(cell === 1 ? 'cellTeal' : 'cellBlue') });
      });
    }

    if (mode === 'molecular') {
      // Three small asymmetric structures; bonds stay local, never a global lattice.
      const clusters = [
        [[46, 134], [92, 108], [139, 133], [148, 187], [106, 217], [58, 190], [20, 234], [167, 92], [207, 113], [221, 160], [183, 204], [244, 222]],
        [[871, 379], [915, 350], [960, 374], [966, 425], [924, 452], [878, 431], [830, 453], [815, 505], [852, 541], [902, 527], [937, 562], [985, 545]],
        [[56, 622], [104, 594], [150, 623], [143, 674], [91, 690], [47, 667], [186, 592], [213, 552]]
      ];
      const edges = [[0, 1], [1, 2], [2, 3], [3, 4], [4, 5], [5, 0], [5, 6], [2, 7], [7, 8], [8, 9], [9, 10], [10, 3], [10, 11]];
      clusters.forEach((cluster, c) => {
        const nodes = cluster.map(([x, y]) => bend(x, y, pointer, 2));
        const hull = nodes.slice(0, 6);
        path(smooth(hull, true), 'pf-bg-molecule-envelope', { fill: paint(c === 1 ? 'cellTeal' : 'cellBlue') });
        edges.forEach(([a, b], i) => {
          if (!nodes[a] || !nodes[b]) return;
          const [x1, y1] = nodes[a];
          const [x2, y2] = nodes[b];
          path(`M${x1},${y1}Q${(x1 + x2) / 2 + (i % 2 ? 4 : -4)},${(y1 + y2) / 2 - 3} ${x2},${y2}`, 'pf-bg-bond');
        });
        nodes.forEach(([x, y], i) => {
          circle(x, y, i % 5 === 0 ? 7 : 3.5, `pf-bg-atom ${i % 4 === 0 ? 'pf-bg-atom-teal' : ''}`);
          if (i % 5 === 0) circle(x, y, 13, 'pf-bg-atom-halo');
        });
      });
    }

    if (mode === 'aurora') {
      for (let ribbon = 0; ribbon < 6; ribbon++) {
        const top = [];
        const bottom = [];
        for (let step = 0; step <= 32; step++) {
          const x = -140 + step * 40;
          const t = x / 1000;
          const wave = 490 - 390 * t + 190 * Math.sin(t * 4.4 + ribbon * .22);
          const y = wave + ribbon * 39;
          const width = 34 + 32 * Math.pow(Math.sin(t * 3 + .8), 2);
          top.push(bend(x, y, pointer, 1.8));
          bottom.push(bend(x, y + width, pointer, 1.8));
        }
        path(smooth([...top, ...bottom.reverse()], true), 'pf-bg-aurora-ribbon', { fill: paint(ribbon % 3 === 1 ? 'ribbonTeal' : ribbon % 3 === 2 ? 'ribbonPearl' : 'ribbonBlue'), opacity: (.54 - ribbon * .035).toFixed(3) });
        path(smooth(top), 'pf-bg-aurora-edge', { opacity: ribbon % 2 ? '.17' : '.29' });
      }
    }
    return shapes;
  }

  function makeView(parent, preview) {
    const field = document.createElement('div');
    field.className = `pf-background-field${preview ? ' pf-background-preview-field' : ''}`;
    field.setAttribute('aria-hidden', 'true');
    parent.append(field);
    return { field, preview, id: `pf-bg-${++serial}`, mode: null, nodes: [], x: 500, y: 350, tx: 500, ty: 350, strength: 0, targetStrength: 0 };
  }

  function build(view, mode) {
    view.mode = mode;
    view.field.dataset.background = mode;
    view.x = view.tx = 500;
    view.y = view.ty = 350;
    view.strength = view.targetStrength = 0;
    const id = view.id;
    view.field.innerHTML = mode === 'off' ? '' : `<svg class="pf-background-svg" viewBox="0 0 1000 700" preserveAspectRatio="none" focusable="false" aria-hidden="true"><defs>
      <radialGradient id="${id}-blue"><stop stop-color="var(--bg-blue)" stop-opacity=".38"/><stop offset="1" stop-color="var(--bg-blue)" stop-opacity="0"/></radialGradient>
      <radialGradient id="${id}-teal"><stop stop-color="var(--bg-teal)" stop-opacity=".29"/><stop offset="1" stop-color="var(--bg-teal)" stop-opacity="0"/></radialGradient>
      <radialGradient id="${id}-pearl"><stop stop-color="var(--bg-pearl)" stop-opacity=".46"/><stop offset="1" stop-color="var(--bg-pearl)" stop-opacity="0"/></radialGradient>
      <linearGradient id="${id}-ribbonBlue" x1="0" y1="1" x2="1" y2="0"><stop stop-color="var(--bg-blue)" stop-opacity=".03"/><stop offset=".45" stop-color="var(--bg-blue)" stop-opacity=".25"/><stop offset="1" stop-color="var(--bg-blue)" stop-opacity=".04"/></linearGradient>
      <linearGradient id="${id}-ribbonTeal" x1="0" y1="0" x2="1" y2="1"><stop stop-color="var(--bg-teal)" stop-opacity=".02"/><stop offset=".55" stop-color="var(--bg-teal)" stop-opacity=".22"/><stop offset="1" stop-color="var(--bg-teal)" stop-opacity=".02"/></linearGradient>
      <linearGradient id="${id}-ribbonPearl"><stop stop-color="var(--bg-pearl)" stop-opacity=".03"/><stop offset=".6" stop-color="var(--bg-pearl)" stop-opacity=".35"/><stop offset="1" stop-color="var(--bg-blue)" stop-opacity=".04"/></linearGradient>
      <radialGradient id="${id}-cellBlue"><stop stop-color="var(--bg-blue)" stop-opacity=".02"/><stop offset=".78" stop-color="var(--bg-blue)" stop-opacity=".08"/><stop offset="1" stop-color="var(--bg-blue)" stop-opacity=".17"/></radialGradient>
      <radialGradient id="${id}-cellTeal"><stop stop-color="var(--bg-teal)" stop-opacity=".01"/><stop offset=".8" stop-color="var(--bg-teal)" stop-opacity=".08"/><stop offset="1" stop-color="var(--bg-teal)" stop-opacity=".15"/></radialGradient>
      <radialGradient id="${id}-quiet"><stop stop-color="white" stop-opacity=".16"/><stop offset=".65" stop-color="white" stop-opacity=".65"/><stop offset="1" stop-color="white"/></radialGradient>
      <mask id="${id}-mask"><rect width="1000" height="700" fill="url(#${id}-quiet)"/></mask>
      </defs><g class="pf-background-atmosphere"${view.preview ? '' : ` mask="url(#${id}-mask)"`}></g></svg>`;
    const group = view.field.querySelector('g');
    view.nodes = [];
    if (!group) return;
    geometry(mode, view, id).forEach(shape => {
      const node = document.createElementNS(NS, shape.tag);
      Object.entries(shape.attrs).forEach(([name, value]) => node.setAttribute(name, value));
      group.append(node);
      view.nodes.push(node);
    });
  }

  function render(view) {
    geometry(view.mode, view, view.id).forEach((shape, index) => {
      const node = view.nodes[index];
      if (!node) return;
      Object.entries(shape.attrs).forEach(([name, value]) => {
        if (name !== 'class' && node.getAttribute(name) !== String(value)) node.setAttribute(name, value);
      });
    });
  }

  const api = window.PortfolioBackground = { modes, mount, unmount };

  function mount(root) {
    unmount();
    if (!root?.matches?.('#portfolio') || !root.isConnected || root.hidden) return;
    const fine = window.matchMedia('(hover: hover) and (pointer: fine)');
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
    const state = { root, main: makeView(document.body, false), preview: null, cleanup: [], raf: 0 };
    active = state;
    const listen = (target, name, fn, options) => {
      target.addEventListener(name, fn, options);
      state.cleanup.push(() => target.removeEventListener(name, fn, options));
    };
    function motionAllowed() {
      return fine.matches && document.body.dataset.effects === 'on' && document.body.dataset.motion !== 'off' && document.body.dataset.motion !== 'still' &&
        (document.body.dataset.motion === 'full' || !reduced.matches) && !document.hidden;
    }
    function enabled(view) {
      return active === state && root.isConnected && !root.hidden && view.mode !== 'off' && motionAllowed() &&
        (view.preview ? !!view.field.closest('dialog[open]') : !document.querySelector('dialog[open]'));
    }
    function cancel() {
      if (state.raf) window.cancelAnimationFrame(state.raf);
      state.raf = 0;
    }
    function refresh() {
      if (active !== state) return;
      if (!root.isConnected || root.hidden) return unmount();
      const requested = document.body.dataset.background || 'silk';
      const mode = validModes.has(requested) ? requested : 'silk';
      const previewHost = document.querySelector('[data-background-preview]');
      const stage = previewHost?.querySelector('.background-preview-stage') || previewHost;
      if (state.preview && (!stage || !stage.contains(state.preview.field))) {
        state.preview.field.remove();
        state.preview = null;
      }
      if (stage && !state.preview) state.preview = makeView(stage, true);
      const modal = !!document.querySelector('dialog[open]');
      state.main.field.classList.toggle('is-obscured', modal);
      [state.main, state.preview].filter(Boolean).forEach(view => {
        if (view.mode !== mode) build(view, mode);
        view.field.classList.toggle('is-still', !enabled(view));
        if (!enabled(view)) {
          view.strength = view.targetStrength = 0;
          render(view);
        }
      });
      if (![state.main, state.preview].filter(Boolean).some(enabled)) cancel();
    }
    function schedule() {
      if (!state.raf) state.raf = window.requestAnimationFrame(frame);
    }
    function frame() {
      state.raf = 0;
      if (active !== state) return;
      let unsettled = false;
      [state.main, state.preview].filter(Boolean).forEach(view => {
        if (!enabled(view)) return;
        view.x += (view.tx - view.x) * .16;
        view.y += (view.ty - view.y) * .16;
        view.strength += (view.targetStrength - view.strength) * .12;
        render(view);
        if (Math.abs(view.tx - view.x) + Math.abs(view.ty - view.y) > .15 || Math.abs(view.targetStrength - view.strength) > .002) unsettled = true;
      });
      if (unsettled) schedule();
    }
    function move(event) {
      if (event.pointerType === 'touch') return;
      [state.main, state.preview].filter(Boolean).forEach(view => {
        if (!enabled(view)) return;
        const area = view.preview ? view.field.parentElement : root;
        const inside = area.contains(event.target);
        view.targetStrength = inside ? 1 : 0;
        if (inside) {
          const rect = view.preview ? area.getBoundingClientRect() : { left: 0, top: 0, width: window.innerWidth, height: window.innerHeight };
          view.tx = Math.max(-100, Math.min(1100, (event.clientX - rect.left) / Math.max(rect.width, 1) * 1000));
          view.ty = Math.max(-100, Math.min(800, (event.clientY - rect.top) / Math.max(rect.height, 1) * 700));
        }
        schedule();
      });
    }
    function leave() {
      [state.main, state.preview].filter(Boolean).forEach(view => { view.targetStrength = 0; });
      schedule();
    }
    listen(document, 'pointermove', move, { passive: true });
    listen(document, 'pointerout', event => { if (!event.relatedTarget) leave(); }, { passive: true });
    listen(window, 'blur', leave);
    listen(document, 'visibilitychange', refresh);
    listen(window, 'resize', leave, { passive: true });
    listen(fine, 'change', refresh);
    listen(reduced, 'change', refresh);
    const observer = new MutationObserver(refresh);
    observer.observe(document.body, { subtree: true, childList: true, attributes: true, attributeFilter: ['data-background', 'data-effects', 'data-motion', 'open', 'hidden'] });
    state.cleanup.push(() => observer.disconnect());
    refresh();
  }

  function unmount() {
    if (!active) return;
    const state = active;
    active = null;
    if (state.raf) window.cancelAnimationFrame(state.raf);
    state.cleanup.forEach(cleanup => cleanup());
    state.main.field.remove();
    state.preview?.field.remove();
  }
})();
