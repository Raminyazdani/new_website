(function (w) {
  'use strict';
  const chapters = [
    { name: 'Observe.', field: '01 / BIOLOGY', copy: 'Begin with a living question.', match: /bio|cell|gene|genom|protein|rna|dna|microb|neuro|physiol/i },
    { name: 'Model.', field: '02 / CHEMISTRY', copy: 'Find the connections beneath the surface.', match: /chem|molecul|compound|reaction|docking|ligand|pharmac/i },
    { name: 'Build.', field: '03 / CODE', copy: 'Give an idea a working form.', match: /code|comput|program|soft|python|workflow|website|web\b|app\b|machine|data|pipeline/i }
  ];
  const clamp = n => Math.max(0, Math.min(1, n));
  const mix = (a, b, t) => t === 0 ? a : t === 1 ? b : a + (b - a) * t;
  const ease = t => t * t * (3 - 2 * t);
  const point = (a, b, t) => a.map((n, i) => mix(n, b[i], t));
  function line(points, count) {
    return Array.from({ length: count }, (_, i) => {
      const f = i / (count - 1) * (points.length - 1), j = Math.min(points.length - 2, Math.floor(f));
      return point(points[j], points[j + 1], f - j);
    });
  }
  function arc(start, end, count, rx, ry, z, phase = 0) {
    return Array.from({ length: count }, (_, i) => {
      const a = mix(start, end, i / (count - 1));
      const organic = 1 + .045 * Math.sin(3 * a + phase) + .025 * Math.cos(5 * a);
      return [Math.cos(a) * rx * organic, Math.sin(a) * ry * organic, z + 20 * Math.sin(2 * a + phase)];
    });
  }
  function buildGeometry() {
    // One original abstract object, with fixed strand and vertex identities in all poses.
    // Coordinates describe illustrative forms, never a named cell or chemical structure.
    const left = [[-142, 0, -18], [-103, -70, -5], [-22, -70, 20], [18, 0, 40], [-22, 70, 18], [-103, 70, -14], [-142, 0, -18]];
    const right = [[18, 0, 40], [62, -70, 15], [142, -70, -18], [184, 0, -30], [142, 70, -7], [62, 70, 23], [18, 0, 40]];
    const inner = [[-22, 70, 18], [6, 131, 50], [75, 150, 26], [126, 105, -3], [142, 70, -7]];
    const definitions = [
      { cell: arc(-Math.PI / 2, Math.PI / 6, 13, 194, 205, 0), molecule: line(right, 13), code: line([[-105,-92,20],[-167,0,20],[-105,92,20]],13), kind: 'membrane' },
      { cell: arc(Math.PI / 6, Math.PI * 5 / 6, 13, 194, 205, 0), molecule: line(left, 13), code: line([[105,-92,-12],[167,0,-12],[105,92,-12]],13), kind: 'membrane' },
      { cell: arc(Math.PI * 5 / 6, Math.PI * 3 / 2, 13, 194, 205, 0), molecule: line([[-103,-70,-5],[-142,-132,-35],[-212,-132,-55],[-241,-82,-30]],13), code: line([[39,-118,35],[-39,118,35]],13), kind: 'membrane' },
      { cell: arc(0, Math.PI * 2, 13, 73, 89, 70, 1), molecule: line(inner,13), code: line([[-160,156,0],[26,156,0]],13), kind: 'nucleus' },
      { cell: [[-139,-77,5],[-121,-119,22],[-85,-147,32],[-45,-151,28],[-21,-140,20]], molecule: line([[-22,-70,20],[7,-126,50],[72,-145,58]],5), code: line([[-160,-159,-5],[-40,-159,-5]],5), kind: 'fold' },
      { cell: [[113,54,18],[135,18,35],[138,-19,42],[123,-52,32],[110,-61,24]], molecule: line([[142,-70,-18],[190,-111,-50],[220,-101,-38]],5), code: line([[-14,-159,-5],[123,-159,-5]],5), kind: 'fold' },
      { cell: [[-116,90,25],[-137,89,40],[-151,109,51],[-132,130,43],[-111,117,28]], molecule: line([[-142,0,-18],[-198,21,-45],[-220,68,-18]],5), code: line([[51,156,0],[160,156,0]],5), kind: 'organelle' },
      { cell: [[34,-53,80],[-25,-31,96],[22,-2,103],[-19,33,94],[29,52,79]], molecule: line([[18,0,40],[65,12,63],[99,0,59]],5), code: line([[-128,185,-12],[-35,185,-12]],5), kind: 'chromatin' }
    ];
    let index = 0;
    return { strands: definitions.map((s, strand) => ({ ...s, strand, indices: s.cell.map(() => index++) })), vertexCount: index };
  }
  const geometry = buildGeometry();
  function sample(progress) {
    const p = clamp(progress), section = p < .5 ? 0 : 1, t = ease(section ? (p - .5) * 2 : p * 2);
    return { progress: p, phase: p * 2, cell: 1 - ease(clamp(p * 2)), code: ease(clamp((p - .5) * 2)), strands: geometry.strands.map(s => ({ kind: s.kind, indices: s.indices, points: s.cell.map((v, i) => point(section ? s.molecule[i] : v, section ? s.code[i] : s.molecule[i], t)) })) };
  }
  function project(v, progress) {
    // A single perspective camera moves around the object and dollies toward the bonds.
    const yaw = mix(-.24, .17, progress), pitch = -.12 + Math.sin(progress * Math.PI) * .19;
    const x = v[0] * Math.cos(yaw) + v[2] * Math.sin(yaw), z = -v[0] * Math.sin(yaw) + v[2] * Math.cos(yaw);
    const y = v[1] * Math.cos(pitch) - z * Math.sin(pitch), depth = v[1] * Math.sin(pitch) + z * Math.cos(pitch);
    const distance = 810 - Math.sin(progress * Math.PI) * 90, scale = distance / (distance - depth);
    return [300 + x * scale, 258 + y * scale, depth, scale];
  }
  function path(points, smooth) {
    return points.reduce((d, p, i) => {
      if (!i) return `M${p[0].toFixed(2)},${p[1].toFixed(2)}`;
      const before = points[Math.max(0,i-2)], a = points[i-1], after = points[Math.min(points.length-1,i+1)];
      const c1 = [a[0] + (p[0]-before[0])*smooth/6,a[1] + (p[1]-before[1])*smooth/6];
      const c2 = [p[0] - (after[0]-a[0])*smooth/6,p[1] - (after[1]-a[1])*smooth/6];
      return `${d}C${c1[0].toFixed(2)},${c1[1].toFixed(2)} ${c2[0].toFixed(2)},${c2[1].toFixed(2)} ${p[0].toFixed(2)},${p[1].toFixed(2)}`;
    }, '');
  }
  function frameGeometry(progress) {
    const state = sample(progress);
    return { ...state, strands: state.strands.map(s => ({ ...s, projected: s.points.map(v => project(v, state.progress)) })) };
  }
  function artwork() {
    const pose = frameGeometry(0);
    return `<div class="story-art" aria-hidden="true"><svg viewBox="0 0 600 520" fill="none" data-story-morph>
      <defs><radialGradient id="story-cell-material" cx="35%" cy="25%" r="80%"><stop stop-color="var(--coral)" stop-opacity=".16"/><stop offset=".6" stop-color="var(--lime)" stop-opacity=".06"/><stop offset="1" stop-color="var(--lime)" stop-opacity=".19"/></radialGradient><radialGradient id="story-nucleus-material" cx="35%" cy="25%"><stop stop-color="var(--coral)" stop-opacity=".21"/><stop offset="1" stop-color="var(--coral)" stop-opacity=".05"/></radialGradient></defs>
      <ellipse class="story-ground" cx="300" cy="482" rx="153" ry="9"/>
      <path class="story-cell-surface" data-morph-surface d="${path(pose.strands.slice(0,3).flatMap((s,i) => s.projected.slice(i ? 1 : 0)),1)}Z"/>
      <path class="story-nucleus-surface" data-morph-nucleus d="${path(pose.strands[3].projected,1)}Z"/>
      <g class="story-morph-strands">${pose.strands.map((s,i) => `<path class="story-morph-strand story-strand-${s.kind}" data-morph-strand="${i}" d="${path(s.projected,1)}"/>`).join('')}</g>
      <g class="story-morph-vertices">${pose.strands.map(s => s.projected.map((v,i) => `<circle data-morph-vertex="${s.indices[i]}" cx="${v[0].toFixed(2)}" cy="${v[1].toFixed(2)}" r="0"/>`).join('')).join('')}</g>
    </svg><span class="story-art-label">ONE IDEA <i>→</i> MANY FORMS</span></div>`;
  }
  function render(vm, h) {
    const projects = Array.isArray(vm?.projects) ? vm.projects : [];
    const used = new Set();
    const cards = chapters.map((c, i) => {
      const project = projects.find(p => !used.has(p) && c.match.test([p.title, ...(Array.isArray(p.tags) ? p.tags : [])].join(' ')));
      if (project) used.add(project);
      const tags = project && Array.isArray(project.tags) ? project.tags.filter(Boolean).slice(0, 3) : [];
      const evidence = project ? `<div class="story-evidence"><small>FROM THE PROJECT RECORD</small><p>${h.e(project.title || '')}</p>${tags.length ? `<div class="story-tags">${tags.map(t => `<span>${h.e(t)}</span>`).join('')}</div>` : ''}</div>` : '';
      return `<article class="story-chapter" data-story-chapter="${i}" id="discovery-${i + 1}"><p class="story-field">${c.field}</p><h4>${c.name}</h4><p class="story-thought">${c.copy}</p>${evidence}</article>`;
    }).join('');
    return `<div class="discovery-story" id="discovery-story" data-story aria-labelledby="discovery-story-title"><div class="story-intro"><p class="story-eyebrow">A CONNECTED PERSPECTIVE</p><h3 id="discovery-story-title">Across scales.<br><em>Between disciplines.</em></h3><p>A visual journey through biology, chemistry and code.</p></div><div class="story-runway"><div class="story-stage"><div class="story-stage-top"><span>THREE WAYS OF SEEING</span><span class="story-scroll-hint">SCROLL TO EXPLORE ↓</span></div><div class="story-composition">${artwork()}<div class="story-copy">${cards}</div></div><div class="story-stage-bottom"><span class="story-illustration-note">An illustrative narrative. Project names and tags come from the CV.</span><label class="story-scrubber">Explore the transformation<input type="range" min="0" max="100" step="1" value="0" data-story-scrub aria-valuetext="Biology"></label><nav class="story-chapter-nav" aria-label="Explore the visual story">${chapters.map((c,i) => `<button type="button" data-story-go="${i}" aria-label="Go to ${c.name.slice(0,-1)} chapter"><span>0${i+1}</span><span>${c.name.slice(0,-1)}</span><i aria-hidden="true"></i></button>`).join('')}</nav></div></div></div></div>`;
  }
  let cleanup = () => {};
  function mount(root) {
    cleanup();
    if (!root?.querySelectorAll) return;
    const scenes = [...root.querySelectorAll('[data-story]')].map(el => ({ el, runway: el.querySelector('.story-runway'), stage: el.querySelector('.story-stage'), strands: [...el.querySelectorAll('[data-morph-strand]')], vertices: [...el.querySelectorAll('[data-morph-vertex]')], surface: el.querySelector('[data-morph-surface]'), nucleus: el.querySelector('[data-morph-nucleus]'), copy: [...el.querySelectorAll('[data-story-chapter]')], buttons: [...el.querySelectorAll('[data-story-go]')], scrubber: el.querySelector('[data-story-scrub]'), manualProgress: 0, visible: !w.IntersectionObserver, active: false }));
    if (!scenes.length) return;
    let frame = 0, io, observer;
    const removers = [];
    const doc = root.ownerDocument || w.document;
    const on = (el, event, fn, options) => { if (!el?.addEventListener) return; el.addEventListener(event, fn, options); removers.push(() => el.removeEventListener(event, fn, options)); };
    const media = w.matchMedia?.('(prefers-reduced-motion: reduce)');
    function mode() {
      const choice = doc.body?.dataset.effects;
      return choice === 'on' || (choice !== 'off' && !media?.matches);
    }
    function clearScrub(s, progress = 0) {
      s.el.style.removeProperty('--story-progress');
      s.buttons.forEach(button => button.removeAttribute('aria-current'));
      s.copy.forEach(el => { el.style.opacity = ''; el.style.transform = ''; });
      paint(s,progress);
    }
    function paint(s, progress) {
      const state = frameGeometry(progress), molecule = (1 - state.cell) * (1 - state.code);
      s.el.dataset.morphProgress = progress.toFixed(4);
      if (s.scrubber) {
        const value = Math.round(progress * 100);
        s.scrubber.value = String(value);
        const name = value === 0 ? 'Biology' : value === 50 ? 'Chemistry' : value === 100 ? 'Code' : `${value < 50 ? 'Biology to chemistry' : 'Chemistry to code'}, ${(value % 50) * 2}% of transition`;
        s.scrubber.setAttribute('aria-valuetext', name);
      }
      s.surface?.setAttribute('d', `${path(state.strands.slice(0,3).flatMap((strand,i) => strand.projected.slice(i ? 1 : 0)),state.cell)}Z`);
      s.surface?.setAttribute('opacity', (state.cell * state.cell).toFixed(4));
      s.nucleus?.setAttribute('d', `${path(state.strands[3].projected,state.cell)}Z`);
      s.nucleus?.setAttribute('opacity', (state.cell * state.cell).toFixed(4));
      state.strands.forEach((strand,i) => {
        const el = s.strands[i];
        if (!el) return;
        const depth = strand.projected.reduce((sum,v) => sum + v[2],0) / strand.projected.length;
        el.setAttribute('d', path(strand.projected,state.cell));
        el.setAttribute('stroke-width', (mix(i < 3 ? 2.3 : 1.8, i < 3 ? 4 : 2.6, state.code) + molecule * .7).toFixed(2));
        el.setAttribute('opacity', clamp(.72 + depth / 280 + state.code * .2).toFixed(3));
        strand.projected.forEach((v,j) => {
          const vertex = s.vertices[strand.indices[j]];
          if (!vertex) return;
          const atom = i < 2 ? j % 2 === 0 : i === 2 ? j % 4 === 0 : i === 3 ? j % 3 === 0 : j % 2 === 0;
          const radius = atom ? molecule * (i < 4 ? 5.5 : 4) * v[3] : 0;
          vertex.setAttribute('cx',v[0].toFixed(2)); vertex.setAttribute('cy',v[1].toFixed(2));
          vertex.setAttribute('r',radius.toFixed(3));
          vertex.setAttribute('opacity',clamp(.82 + v[2] / 300).toFixed(3));
          vertex.dataset.depth = v[2].toFixed(2);
        });
      });
    }
    function draw(s) {
      if (!s.active || !s.visible || doc.hidden) return;
      const rect = s.runway.getBoundingClientRect();
      const top = parseFloat(s.el.style.getPropertyValue('--story-header')) || 80;
      const range = Math.max(1, rect.height - s.stage.getBoundingClientRect().height);
      const progress = clamp((top - rect.top) / range);
      const position = progress * 2;
      s.el.style.setProperty('--story-progress', progress.toFixed(4));
      paint(s,progress);
      s.copy.forEach((el, i) => {
        const weight = Math.round(position) === i ? 1 - Math.abs(position - i) * .8 : 0;
        el.style.opacity = weight.toFixed(4);
        el.style.transform = `translateY(${((i-position)*55).toFixed(2)}px)`;
      });
      s.buttons.forEach((button, i) => button.setAttribute('aria-current', Math.round(position) === i ? 'step' : 'false'));
    }
    function schedule() {
      if (doc.hidden || frame || !w.requestAnimationFrame || !scenes.some(s => s.active && s.visible)) return;
      frame = w.requestAnimationFrame(() => { frame = 0; scenes.forEach(draw); });
    }
    function resize() {
      const header = doc.querySelector('.pf-header');
      const top = Math.ceil(header?.getBoundingClientRect?.().height || 80) + 12;
      scenes.forEach(s => {
        s.el.style.setProperty('--story-header', `${top}px`);
        s.active = mode() && (w.innerWidth || 0) > 900 && (w.innerHeight || 0) - top >= 570 && !!w.requestAnimationFrame;
        s.el.dataset.storyMode = s.active ? 'scroll' : 'static';
        if (!s.active) clearScrub(s,s.manualProgress);
      });
      schedule();
    }
    function seek(s, progress) {
      if (!s.active || !w.scrollTo) {
        s.manualProgress = progress;
        paint(s,progress);
        return;
      }
      const top = parseFloat(s.el.style.getPropertyValue('--story-header')) || 80;
      const rect = s.runway.getBoundingClientRect();
      const range = Math.max(1, rect.height - s.stage.getBoundingClientRect().height);
      w.scrollTo({ top: (w.scrollY || 0) + rect.top - top + range * progress, behavior: 'instant' });
      schedule();
    }
    scenes.forEach(s => {
      s.buttons.forEach((button, i) => on(button, 'click', () => seek(s,i / 2)));
      on(s.scrubber, 'input', () => seek(s,clamp(Number(s.scrubber.value) / 100)));
    });
    on(w, 'scroll', schedule, { passive: true }); on(w, 'resize', resize, { passive: true });
    on(doc, 'visibilitychange', () => { if (doc.hidden && frame) { w.cancelAnimationFrame?.(frame); frame = 0; } else schedule(); });
    on(media, 'change', resize);
    if (w.IntersectionObserver) { io = new w.IntersectionObserver(entries => { entries.forEach(entry => { const s = scenes.find(s => s.el === entry.target); if (s) s.visible = entry.isIntersecting; }); schedule(); }, { rootMargin: '100px' }); scenes.forEach(s => io.observe(s.el)); }
    if (w.MutationObserver && doc.body) { observer = new w.MutationObserver(resize); observer.observe(doc.body, { attributes: true, attributeFilter: ['data-effects'] }); }
    resize();
    cleanup = () => { if (frame) w.cancelAnimationFrame?.(frame); io?.disconnect(); observer?.disconnect(); removers.forEach(fn => fn()); scenes.forEach(s => { delete s.el.dataset.storyMode; clearScrub(s); }); };
  }
  w.PortfolioStory = { render, mount, unmount: () => cleanup(), geometry: { build: buildGeometry, sample, project, frame: frameGeometry } };
})(window);
