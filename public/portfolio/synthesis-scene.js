/* One sampled surface: every filament, junction and bond keeps its identity in all three views. */
(function (w) {
  'use strict';
  const TAU = 2 * Math.PI, LANES = 13, STEPS = 33, MORPH_MS = 620;
  const positions = new Map();
  const clamp = (n, min, max) => Math.min(max, Math.max(min, n));
  const mix = (a, b, p) => a + (b - a) * p;
  const smooth = p => p * p * (3 - 2 * p);
  const nodeSamples = [1, 3, 5, 7, 9, 11].flatMap((lane, i) =>
    [4, 13, 21, 29].map((step, j) => [lane, step + (i % 2 && j < 2 ? 2 : 0)]));
  const bondSamples = Array.from({ length: 11 }, (_, i) => [i + 1, 7 + (i * 7) % 23]);
  const crosses = [0, 1, 2, 3, 4].map(i => 7 + i * 5);
  const poses = {
    all: ['all', 'molecule', 'network'],
    biology: ['tissue', 'biology', 'molecule'],
    programming: ['input', 'programming', 'network'],
  };
  const storyPoses = {...poses, all: ['biology', 'molecule', 'network']};
  const isCell = mode => mode === 'biology' || mode === 'tissue';

  function sample(mode, lane, step) {
    const u = step / (STEPS - 1), theta = lane / (LANES - 1) * TAU;
    if (isCell(mode)) {
      const tissue = mode === 'tissue', zoom = tissue ? .57 : 1;
      const rad = Math.pow(Math.sin(Math.PI * u), .52) * (1 + .07 * Math.sin(u * 12 + theta * 3));
      return [
        zoom * ((u - .5) * 492 + rad * (21 * Math.sin(theta) + 13 * Math.sin(u * 8))) - (tissue ? 78 : 0),
        zoom * (Math.sin(theta + u * 1.12) * rad * 148 + 19 * Math.sin(u * TAU - .9)),
        zoom * (Math.cos(theta + u * 1.12) * rad * 118 + 18 * Math.sin(u * 8))
      ];
    }
    if (mode === 'molecule') {
      const fold = theta + u * TAU * 1.08;
      const rad = 13 + 52 * Math.exp(-((u - .23) ** 2) / .009) + 64 * Math.exp(-((u - .54) ** 2) / .013) + 47 * Math.exp(-((u - .8) ** 2) / .008);
      return [(u - .5) * 450 + Math.sin(fold) * rad * .49, 78 * Math.sin(u * 9 - 1.3) + Math.sin(fold) * rad, Math.cos(fold) * rad + 37 * Math.sin(u * 11)];
    }
    if (mode === 'programming' || mode === 'input' || mode === 'network') {
      const row = lane - (LANES - 1) / 2;
      if (mode === 'input') {
        const deck = Math.floor(lane / 4) - 1;
        return [(u - .5) * 475 + deck * 29, (lane % 4 - 1.5) * 28 + deck * 78, deck * 66 + 14 * Math.sin(u * Math.PI)];
      }
      if (mode === 'network') {
        const level = lane % 3 - 1;
        const bus = smooth(clamp((u - .29 - (lane % 4) * .045) / .055, 0, 1));
        const fan = smooth(clamp((u - .61 - (lane % 3) * .047) / .063, 0, 1));
        return [(u - .5) * 525, row * (22 + 5 * fan) + level * 28 * bus * (1 - fan), level * 48 + Math.trunc(row / 3) * 15 + fan * row * 3];
      }
      const t = Math.floor(u * 4), stage = u * 4 - t;
      const weights = [1.1, .44, .93, .58, 1.13];
      const taper = mix(weights[t], weights[t + 1] ?? weights[t], smooth(clamp((stage - .28) / .5, 0, 1)));
      return [
        (u - .5) * 552,
        row * 24 * taper + 18 * Math.sin(u * Math.PI) * Math.sign(row),
        ((lane % 3) - 1) * 74 + 23 * Math.cos(u * Math.PI + theta) + (u - .5) * 78
      ];
    }
    const rad = Math.pow(Math.sin(Math.PI * u), .7);
    const blend = smooth(clamp((u - .29) * 1.7, 0, 1));
    const loop = theta + u * 4.8;
    return [
      (u - .5) * 570 + (1 - blend) * 26 * Math.sin(theta) * rad,
      mix(Math.sin(loop) * rad * 175 - 34 * Math.sin(u * 7), (lane - 6) * (13 + 10 * u) + 18 * Math.sin(u * 9 + lane / 4), blend),
      mix(Math.cos(loop) * rad * 139, ((lane % 4) - 1.5) * (31 + 13 * u) + 28 * Math.sin(u * 9), blend)
    ];
  }

  function geometry(mode) {
    if (!positions.has(mode)) {
      const surface = Array.from({ length: LANES }, (_, lane) =>
        Array.from({ length: STEPS }, (_, step) => sample(mode, lane, step)));
      const threads = Array.from({ length: 2 }, (_, line) =>
        Array.from({ length: STEPS }, (_, step) => {
          const p = step / (STEPS - 1), t = p * TAU * 2.55 + line * Math.PI;
          if (mode === 'programming' || mode === 'input' || mode === 'network') {
            const source = sample(mode, line ? 9 : 3, step);
            return [source[0], source[1] + (line ? 15 : -15), source[2] + 43];
          }
          if (isCell(mode)) {
            const zoom = mode === 'tissue' ? .57 : 1;
            return [(p - .5) * 264 * zoom - (mode === 'tissue' ? 78 : 0), (Math.sin(t) * 24 + 24 * Math.sin(p * 7)) * zoom, (Math.cos(t) * 31 + 29) * zoom];
          }
          if (mode === 'molecule') return [(p - .5) * 430, Math.sin(t) * 39 + 65 * Math.sin(p * 9 - 1.3), Math.cos(t) * 52 + 28];
          return [(p - .5) * 520, Math.sin(t) * (36 + 33 * Math.sin(Math.PI * p)) - 11, Math.cos(t) * 52 + 24];
        }));
      const core = Array.from({ length: 2 }, (_, edge) =>
        Array.from({ length: STEPS }, (_, step) => {
          const t = step / (STEPS - 1) * TAU;
          if (mode === 'programming' || mode === 'input' || mode === 'network') {
            const s = (edge ? .78 : 1) / (Math.abs(Math.cos(t)) + Math.abs(Math.sin(t)));
            return [24 + s * 63 * Math.cos(t), s * 55 * Math.sin(t), 90 + 18 * Math.cos(t)];
          }
          const s = (edge ? .71 : 1) * (mode === 'tissue' ? .58 : 1), life = isCell(mode);
          return [
            (mode === 'tissue' ? -92 : life ? -32 : -114) + s * (life ? 78 : 46) * Math.cos(t),
            (life ? -4 : -15) + s * (life ? 64 : 33) * Math.sin(t),
            48 + s * (22 * Math.cos(t) + 12 * Math.sin(t)) + (edge ? 7 : 0)
          ];
        }));
      const colonies = [[135,-102,73,54], [125,107,85,59], [-172,-104,56,42], [-182,105,61,43], [217,4,49,38]];
      const vesicles = [[93,-49,23,17], [127,38,33,21], [-138,-43,24,19], [-112,66,22,14], [57,74,19,15]];
      const details = colonies.map((_, i) => {
        const [cx,cy,rx,ry] = (mode === 'tissue' ? colonies : vesicles)[i];
        return Array.from({ length: STEPS }, (_, step) => {
          const t = step / (STEPS - 1) * TAU, fold = 1 + .085 * Math.sin(t * 3 + i) + .038 * Math.cos(t * 5 + i * 2);
          return [cx + rx * fold * Math.cos(t), cy + ry * fold * Math.sin(t), 37 + 13 * Math.cos(t + i)];
        });
      });
      positions.set(mode, [...surface, ...threads, ...core, ...details]);
    }
    return positions.get(mode);
  }

  function createMarkup(instance = 'hero') {
    const paths = (count, cls) => Array.from({ length: count }, (_, i) => `<path class="${cls}" data-depth-index="${i}"/>`).join('');
    const isHero = instance === 'hero';
    const mark = isHero ? 'data-synthesis-scene' : 'data-journey-art';
    const paint = ['shell','wire','thread','junction','amber','core-light'].map(name => `--syn-svg-${name}:url(#syn-${instance}-${name})`).join(';');
    return `<svg class="syn-sculpture" ${mark} style="${paint}" viewBox="0 0 800 560" fill="none" aria-hidden="true" focusable="false">
      <defs>
        <linearGradient id="syn-shell" x1="13%" y1="5%" x2="80%" y2="91%"><stop class="syn-shell-near"/><stop offset=".56" class="syn-shell-mid"/><stop offset="1" class="syn-shell-far"/></linearGradient>
        <linearGradient id="syn-wire" x1="5%" y1="6%" x2="94%" y2="81%"><stop class="syn-wire-near"/><stop offset=".57" class="syn-wire-mid"/><stop offset="1" class="syn-wire-far"/></linearGradient>
        <linearGradient id="syn-thread" x1="10%" y1="0%" x2="80%" y2="100%"><stop class="syn-thread-near"/><stop offset=".49" class="syn-thread-mid"/><stop offset="1" class="syn-thread-far"/></linearGradient>
        <radialGradient id="syn-junction" cx="33%" cy="25%" r="75%"><stop stop-color="#f7ffff"/><stop offset=".36" class="syn-node-mid"/><stop offset="1" class="syn-node-far"/></radialGradient>
        <radialGradient id="syn-amber" cx="33%" cy="25%" r="75%"><stop stop-color="#fff7e2"/><stop offset=".41" stop-color="#e8af63"/><stop offset="1" stop-color="#93531f"/></radialGradient>
        <radialGradient id="syn-core-light" cx="36%" cy="23%" r="82%"><stop class="syn-shell-near"/><stop offset=".52" class="syn-shell-mid"/><stop offset="1" class="syn-shell-far"/></radialGradient>
        <radialGradient id="syn-ground"><stop class="syn-ground-stop"/><stop offset="1" stop-opacity="0"/></radialGradient>
      </defs>
      <g class="syn-reticle" stroke-width="1">
        <path d="M76 114V76h39m570 0h39v38M76 452v32h39m570 0h39v-32M76 280h10m628 0h10M400 76v10m0 388v10" />
        <path d="M147 280h506M400 120v320" stroke-dasharray="1 6" opacity=".55"/>
        <ellipse cx="400" cy="280" rx="280" ry="177" stroke-dasharray="1 7" opacity=".55"/>
      </g>
      <ellipse class="syn-ground" cx="415" cy="433" rx="268" ry="74" fill="url(#syn-ground)"/>
      <g class="syn-sculpture-geometry">
        ${paths(5, 'syn-cell-companion')}
        <path class="syn-cell-envelope"/>
        ${paths(4, 'syn-membrane')}
        ${paths(5, 'syn-crosswire')}
        <path class="syn-core"/><path class="syn-core-edge"/>
        ${paths(LANES, 'syn-filament-halo')}
        ${paths(LANES, 'syn-filament')}
        ${paths(bondSamples.length, 'syn-bond')}
        ${paths(2, 'syn-strand-halo')}
        ${paths(2, 'syn-strand')}
        ${nodeSamples.map((_, i) => `<circle class="syn-junction${i % 5 === 1 ? ' syn-junction-amber' : ''}"/>`).join('')}
      </g>
    </svg>`.replace(/(id="|url\(#)syn-(?=(?:shell|wire|thread|junction|amber|core-light|ground)[")])/g, `$1syn-${instance}-`);
  }

  function mount(svg, initial, { idle = true } = {}) {
    if (!svg) return null;
    const doc = svg.ownerDocument;
    const wrap = svg.parentElement;
    const $ = selector => Array.from(svg.querySelectorAll(selector));
    const membranes = $('.syn-membrane'), crosswires = $('.syn-crosswire');
    const filaments = $('.syn-filament'), filamentHalos = $('.syn-filament-halo');
    const bonds = $('.syn-bond'), strands = $('.syn-strand'), strandHalos = $('.syn-strand-halo');
    const nodes = $('.syn-junction'), core = $('.syn-core, .syn-core-edge');
    const companions = $('.syn-cell-companion'), envelope = svg.querySelector('.syn-cell-envelope');
    const fine = w.matchMedia?.('(pointer: fine) and (hover: hover)');
    const raf = w.requestAnimationFrame?.bind(w);
    const stopFrame = w.cancelAnimationFrame?.bind(w);
    let target = initial, current = geometry(target), from = current, to = current, progressKey = '';
    const material = pose => [Number(isCell(pose)), Number(pose === 'molecule'), Number(pose === 'network')];
    let finish = material(target), light = finish, start = light, paintedLight = null;
    let started = null, moving = false, visible = !w.IntersectionObserver, frame = null, last = 0, phase = 0;
    let pointer = [0, 0], tilt = [0, 0], stopped = false, drawn = false, idleTime = 0;
    const enabled = () => doc.body.dataset.effects === 'on' && !doc.hidden;
    const pointerMoving = () => pointer.some((value, i) => Math.abs(value - tilt[i]) > .006);
    const round = n => Math.round(n * 10) / 10;
    const path = points => points.map((p, i) => `${i ? 'L' : 'M'}${round(p[0])} ${round(p[1])}`).join('');

    function draw() {
      if (light !== paintedLight) {
        svg.style.setProperty('--syn-cell-depth', round(light[0] * 10) / 10);
        svg.style.setProperty('--syn-molecular-depth', round(light[1] * 10) / 10);
        svg.style.setProperty('--syn-circuit-depth', round(light[2] * 10) / 10);
        paintedLight = light;
      }
      const a = -.17 + Math.sin(phase * .65) * .11 + tilt[0] * .13;
      const b = -.14 + Math.sin(phase * .47) * .12 + tilt[1] * .1;
      const c = -.095;
      const cosA = Math.cos(a), sinA = Math.sin(a), cosB = Math.cos(b), sinB = Math.sin(b);
      const cosC = Math.cos(c), sinC = Math.sin(c);
      const breathing = 1 + .015 * Math.sin(phase * 1.4);
      const points = current.map(lane => lane.map(([x,y,z]) => {
        const ax = x * cosA + z * sinA, az = z * cosA - x * sinA;
        const by = y * cosB - az * sinB, bz = az * cosB + y * sinB;
        const k = 850 / (850 - bz) * breathing;
        return [400 + k * (ax * cosC - by * sinC) + tilt[0] * 10,
          270 + k * (ax * sinC + by * cosC) + tilt[1] * 8, bz];
      }));
      [1, 4, 7, 10].forEach((lane, i) => {
        const twin = points[lane + 2].slice().reverse();
        membranes[i].setAttribute('d', path([...points[lane], ...twin]) + 'Z');
      });
      const slices = Array.from({ length: STEPS }, (_, step) => points.slice(0, LANES).map(lane => lane[step]));
      const top = slices.map(slice => slice.reduce((a,b) => a[1] < b[1] ? a : b));
      const bottom = slices.map(slice => slice.reduce((a,b) => a[1] > b[1] ? a : b)).reverse();
      envelope.setAttribute('d', path([...top, ...bottom]) + 'Z');
      companions.forEach((element, i) => element.setAttribute('d', path(points[LANES + 4 + i]) + 'Z'));
      crosses.forEach((step, i) => crosswires[i].setAttribute('d', path(points.slice(0, LANES).map(lane => lane[step]))));
      filaments.forEach((element, i) => {
        const d = path(points[i]);
        element.setAttribute('d', d);
        filamentHalos[i].setAttribute('d', d);
      });
      core.forEach((element,i) => element.setAttribute('d', path(points[LANES+2+i]) + 'Z'));
      strands.forEach((element, i) => {
        const d = path(points[LANES + i]);
        element.setAttribute('d', d);
        strandHalos[i].setAttribute('d', d);
      });
      bondSamples.forEach(([lane, step], i) => bonds[i].setAttribute('d', path([points[lane][step], points[(lane + 2) % LANES][step + 1]])));
      nodeSamples.forEach(([lane, step], i) => {
        const [x, y, depth] = points[lane][step];
        nodes[i].setAttribute('cx', round(x));
        nodes[i].setAttribute('cy', round(y));
        nodes[i].setAttribute('r', round(clamp(3.6 + depth * .019 + (i % 5 === 1 ? 1.7 : 0), 1.65, 8.8)));
        nodes[i].setAttribute('opacity', round(clamp(.65 + depth * .0028, .38, 1)));
      });
      drawn = true;
    }

    function schedule() {
      if (stopped || frame !== null || !visible || !enabled() || !raf || (!moving && (!idle || idleTime >= 1500 && !pointerMoving()))) return;
      frame = raf(tick);
    }
    function tick(time) {
      frame = null;
      if (stopped || !visible || !enabled()) { sync(); return; }
      const dt = last ? clamp(time - last, 0, 42) : 16;
      last = time;
      if (idleTime < 1500) { idleTime += dt; phase += dt / 1250; }
      tilt = tilt.map((n, i) => mix(n, pointer[i], 1 - Math.exp(-dt / 110)));
      if (moving) {
        if (started === null) started = time;
        const progress = clamp((time - started) / MORPH_MS, 0, 1);
        const p = smooth(progress);
        current = from.map((lane, i) => lane.map((xyz, j) => xyz.map((n, k) => mix(n, to[i][j][k], p))));
        light = start.map((n,i) => mix(n, finish[i], p));
        if (progress >= 1) { current = to; light = finish; moving = false; }
      }
      draw();
      schedule();
    }
    function sync() {
      if (enabled() && visible) { schedule(); return; }
      if (frame !== null) { stopFrame?.(frame); frame = null; }
      last = 0;
      if (moving || !drawn || tilt.some(Boolean) || !enabled() && phase !== 0) {
        current = to; light = finish; moving = false; pointer = [0, 0]; tilt = [0, 0];
        if (!enabled()) phase = 0;
        draw();
      }
    }
    function setMode(mode, { animate = false } = {}) {
      if (mode === target) return;
      target = mode; from = current; to = geometry(mode); start = light; finish = material(mode); started = null;
      svg.dataset.synPose = mode;
      moving = animate && enabled() && visible && Boolean(raf);
      if (moving) schedule();
      else { current = to; light = finish; draw(); }
    }
    function setProgress(mode, value) {
      const p = clamp(value, 0, 2), key = `${mode}:${p}`;
      if (key === progressKey) return;
      progressKey = key;
      const index = Math.min(1, Math.floor(p)), fraction = smooth(p - index), shapes = storyPoses[mode];
      const a = geometry(shapes[index]), b = geometry(shapes[index + 1]);
      const lightA = material(shapes[index]), lightB = material(shapes[index+1]);
      svg.dataset.synPose = shapes[Math.round(p)];
      light = start = finish = lightA.map((n,i) => mix(n, lightB[i], fraction));
      current = from = to = a.map((lane, i) => lane.map((xyz, j) => xyz.map((n, k) => mix(n, b[i][j][k], fraction))));
      moving = false; draw();
    }
    const observer = idle && w.IntersectionObserver ? new w.IntersectionObserver(entries => {
      const next = entries.some(entry => entry.isIntersecting);
      if (next && !visible) idleTime = 0;
      visible = next;
      sync();
    }, { threshold: .08 }) : null;
    function point(event) {
      if (!visible || !enabled() || !fine?.matches || doc.body.dataset.pointer === 'off' || event.pointerType === 'touch') return;
      const box = wrap.getBoundingClientRect();
      if (!box.width || !box.height) return;
      pointer = [clamp((event.clientX - box.left) / box.width * 2 - 1, -1, 1),
        clamp((event.clientY - box.top) / box.height * 2 - 1, -1, 1)];
      schedule();
    }
    function leave() { pointer = [0, 0]; schedule(); }

    svg.dataset.synPose = initial;
    draw();
    observer?.observe(svg);
    if (idle) {
      wrap.addEventListener('pointermove', point, { passive: true });
      wrap.addEventListener('pointerleave', leave);
      doc.addEventListener('visibilitychange', sync);
    }
    sync();
    return { setMode, setProgress, sync, destroy() {
      stopped = true;
      if (frame !== null) stopFrame?.(frame);
      observer?.disconnect();
      wrap.removeEventListener('pointermove', point);
      wrap.removeEventListener('pointerleave', leave);
      doc.removeEventListener('visibilitychange', sync);
    } };
  }

  w.PortfolioSynthesisScene = { createMarkup, mount, poses };
})(window);
