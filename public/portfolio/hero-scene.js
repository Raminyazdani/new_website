(function (w) {
  'use strict';

  // A visual study, not a molecular identification or a biological measurement.
  const ring = Array.from({ length: 6 }, (_, i) => {
    const a = i * Math.PI / 3;
    return [Math.cos(a) * 35, Math.sin(a) * 35, (i % 2 ? 1 : -1) * 5];
  });
  const points = [...ring, [65, -3, 10], [86, -30, -7], [117, -24, 8], [137, -48, 0]];
  const bonds = [[0, 1], [1, 2], [2, 3], [3, 4], [4, 5], [5, 0], [0, 6], [6, 7], [7, 8], [8, 9]];
  function project(phase) {
    const yaw = .17 + Math.sin(phase * .46) * .19;
    const tilt = .18 + Math.cos(phase * .46) * .08;
    return points.map(([x, y, z]) => {
      const X = x * Math.cos(yaw) + z * Math.sin(yaw);
      const Z = z * Math.cos(yaw) - x * Math.sin(yaw);
      const Y = y * Math.cos(tilt) - Z * Math.sin(tilt);
      const scale = 450 / (450 + Z);
      return { x: 87 + X * scale, y: 356 + Y * scale };
    });
  }
  function line(a, b, extra = '') {
    return `<line ${extra} x1="${a.x.toFixed(2)}" y1="${a.y.toFixed(2)}" x2="${b.x.toFixed(2)}" y2="${b.y.toFixed(2)}"/>`;
  }
  function molecule() {
    const p = project(0);
    return bonds.map(([a, b], i) => line(p[a], p[b], `data-hs-bond="${i}"`)).join('') + [0, 2, 4].map(i => {
      const a = p[i], b = p[(i + 1) % 6], c = { x: 87, y: 356 };
      return line({ x: a.x * .81 + c.x * .19, y: a.y * .81 + c.y * .19 }, { x: b.x * .81 + c.x * .19, y: b.y * .81 + c.y * .19 }, `data-hs-double="${i}"`);
    }).join('');
  }
  function connections(p) {
    const point = i => `${p[i].x.toFixed(2)} ${p[i].y.toFixed(2)}`;
    return {
      inlet: `M115 267C132 290 79 302 ${point(4)}`,
      branch: `M${point(9)}C254 329 242 388 282 410L297 425`,
      source: `M${point(1)}C87 412 110 427 139 427H274`
    };
  }
  function render(identity, h) {
    const e = value => h.e(String(value == null ? '' : value));
    const sourceName = e(JSON.stringify(String(identity.name || '')));
    const paths = connections(project(0));
    return `<figure class="st-integrated-hero" data-hero-scene aria-label="Portrait with a connected biology, chemistry and code illustration">
      <div class="hs-composition">
        <svg class="hs-study" viewBox="0 0 500 570" fill="none" aria-hidden="true" preserveAspectRatio="xMidYMin meet">
          <path class="hs-drafting" d="M17 43H480M17 43V527M17 527H480M480 43V527M11 84H23M11 484H23M59 37V49M438 37V49"/>
          <path class="hs-thread" data-hs-inlet d="${paths.inlet}"/><path class="hs-thread" data-hs-branch d="${paths.branch}"/>
          <g data-hs-cell>
            <path class="hs-membrane-outer" d="M42 121C69 87 137 71 176 104C213 134 223 193 197 235C174 277 111 291 68 267C22 242 11 170 42 121Z"/>
            <path class="hs-membrane-inner" d="M49 127C74 96 135 81 170 111C204 139 213 192 189 231C168 269 113 281 74 259C33 237 22 172 49 127Z"/>
            <path class="hs-cell-fold" d="M55 170C58 139 82 128 108 126M52 180C55 149 79 139 102 137M154 219C176 213 178 190 171 173M148 229C184 224 192 194 182 171"/>
            <ellipse class="hs-nucleus" cx="121" cy="188" rx="37" ry="45" transform="rotate(24 121 188)"/>
            <ellipse class="hs-nucleus-inner" cx="121" cy="188" rx="30" ry="38" transform="rotate(24 121 188)"/>
            <path class="hs-chromatin" d="M111 164C133 159 101 189 126 185S106 217 132 207M103 182C128 171 111 210 138 193"/>
            <path class="hs-organelle" d="M65 220C48 214 49 241 67 242C83 240 80 221 65 220ZM61 225L68 229L60 234L70 237M155 125C140 120 138 142 151 147C167 153 173 128 155 125ZM151 129L158 133L149 137L157 143"/>
            <circle class="hs-vesicle" cx="73" cy="193" r="3"/><circle class="hs-vesicle" cx="111" cy="247" r="4"/><circle class="hs-vesicle" cx="184" cy="155" r="3"/>
          </g>
          <g class="hs-bond-graph">${molecule()}</g>
          <path class="hs-continuation" data-hs-continuation d="${paths.source}"/>
          <path class="hs-signal" data-hs-signal d="${paths.source}" pathLength="100"/>
          <circle class="hs-junction" cx="274" cy="427" r="3"/>
        </svg>
        <div class="hs-person">${h.portrait(identity, 'hs-portrait')}<span class="hs-photo-rule" aria-hidden="true"></span></div>
        <div class="hs-source" aria-label="JavaScript profile from the supplied identity">
          <div class="hs-source-heading"><span>profile.js</span><span aria-hidden="true">{ }</span></div>
          <pre><code><span class="hs-code-line"><i aria-hidden="true">01</i><span><b>const</b> profile = <em>{</em></span></span><span class="hs-code-line"><i aria-hidden="true">02</i><span>  name: <strong>${sourceName}</strong></span></span><span class="hs-code-line"><i aria-hidden="true">03</i><span><em data-hs-brace>}</em>;</span></span></code></pre>
        </div>
      </div>
      <figcaption class="hs-caption"><span>Illustrative<span class="hs-caption-detail"> scientific study</span></span><span class="hs-controls"><button type="button" data-hs-play aria-pressed="false">Pause</button><button type="button" data-hs-reset>Reset</button></span></figcaption>
    </figure>`;
  }

  let cleanup = () => {};
  function mount(root) {
    cleanup();
    const elements = [...root.querySelectorAll('[data-hero-scene]')];
    if (!elements.length) return;
    let frame = 0, previous = 0, observer, mutation;
    const removers = [];
    const scenes = elements.map(el => ({ el, visible: !w.IntersectionObserver, paused: false, phase: 0,
      cell: el.querySelector('[data-hs-cell]'), signal: el.querySelector('[data-hs-signal]'),
      inlet: el.querySelector('[data-hs-inlet]'), branch: el.querySelector('[data-hs-branch]'), continuation: el.querySelector('[data-hs-continuation]'),
      lines: [...el.querySelectorAll('[data-hs-bond]')], doubles: [...el.querySelectorAll('[data-hs-double]')],
      brace: el.querySelector('[data-hs-brace]'), play: el.querySelector('[data-hs-play]') }));
    const on = (el, event, fn) => { el.addEventListener(event, fn); removers.push(() => el.removeEventListener(event, fn)); };
    const effects = () => document.body.dataset.effects === 'on';
    const active = s => effects() && !document.hidden && s.visible && !s.paused;
    function draw(s) {
      const phase = s.phase;
      s.cell.setAttribute('transform', `translate(${(Math.sin(phase * .46) * 1.6).toFixed(3)} ${(Math.cos(phase * .46) * 1.2 - 1.2).toFixed(3)})`);
      const p = project(phase);
      const paths = connections(p);
      s.inlet.setAttribute('d', paths.inlet); s.branch.setAttribute('d', paths.branch);
      s.continuation.setAttribute('d', paths.source); s.signal.setAttribute('d', paths.source);
      const set = (el, a, b) => { el.setAttribute('x1', a.x.toFixed(2)); el.setAttribute('y1', a.y.toFixed(2)); el.setAttribute('x2', b.x.toFixed(2)); el.setAttribute('y2', b.y.toFixed(2)); };
      bonds.forEach(([a, b], i) => set(s.lines[i], p[a], p[b]));
      [0, 2, 4].forEach((index, i) => {
        const a = p[index], b = p[(index + 1) % 6], c = { x: 87, y: 356 };
        set(s.doubles[i], { x: a.x * .81 + c.x * .19, y: a.y * .81 + c.y * .19 }, { x: b.x * .81 + c.x * .19, y: b.y * .81 + c.y * .19 });
      });
      s.signal.style.strokeDashoffset = String(-((phase * 9) % 112));
      s.brace.style.opacity = String(.65 + (Math.sin(phase * .46) + 1) * .175);
    }
    function sync() {
      scenes.forEach(s => {
        s.play.disabled = !effects();
        s.play.textContent = !effects() ? 'Motion off' : s.paused ? 'Play' : 'Pause';
        s.play.setAttribute('aria-pressed', String(s.paused));
        s.play.setAttribute('aria-label', !effects() ? 'Scene motion is off in page settings' : s.paused ? 'Play scene animation' : 'Pause scene animation');
      });
      if (scenes.some(active) && w.requestAnimationFrame) {
        if (!frame) { previous = 0; frame = w.requestAnimationFrame(tick); }
      } else if (frame) { w.cancelAnimationFrame(frame); frame = 0; previous = 0; }
    }
    function tick(time) {
      frame = 0;
      if (!scenes.some(active)) { previous = 0; return; }
      if (!previous) previous = time;
      if (time - previous >= 40) {
        const dt = Math.min(time - previous, 80) / 1000;
        previous = time;
        scenes.forEach(s => { if (active(s)) { s.phase += dt; draw(s); } });
      }
      frame = w.requestAnimationFrame(tick);
    }
    scenes.forEach(s => {
      on(s.play, 'click', () => { s.paused = !s.paused; sync(); });
      on(s.el.querySelector('[data-hs-reset]'), 'click', () => { s.phase = 0; draw(s); });
      draw(s);
    });
    if (w.IntersectionObserver) {
      observer = new w.IntersectionObserver(entries => {
        entries.forEach(entry => { const s = scenes.find(scene => scene.el === entry.target); if (s) s.visible = entry.isIntersecting; });
        sync();
      }, { threshold: .05 });
      scenes.forEach(s => observer.observe(s.el));
    }
    if (w.MutationObserver) {
      mutation = new w.MutationObserver(sync);
      mutation.observe(document.body, { attributes: true, attributeFilter: ['data-effects'] });
    }
    on(document, 'visibilitychange', sync);
    sync();
    cleanup = () => { if (frame) w.cancelAnimationFrame(frame); observer?.disconnect(); mutation?.disconnect(); removers.forEach(fn => fn()); };
  }
  w.PortfolioHeroScene = { render, mount, unmount() { cleanup(); cleanup = () => {}; } };
})(window);
