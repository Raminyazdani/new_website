(function (w) {
  'use strict';
  const chapters = [
    { name: 'Observe.', field: '01 / BIOLOGY', copy: 'Begin with a living question.', match: /bio|cell|gene|genom|protein|rna|dna|microb|neuro|physiol/i },
    { name: 'Model.', field: '02 / CHEMISTRY', copy: 'Find the connections beneath the surface.', match: /chem|molecul|compound|reaction|docking|ligand|pharmac/i },
    { name: 'Build.', field: '03 / CODE', copy: 'Give an idea a working form.', match: /code|comput|program|soft|python|workflow|website|web\b|app\b|machine|data|pipeline/i }
  ];
  const clamp = n => Math.max(0, Math.min(1, n));
  function artwork() {
    // Original, deliberately abstract geometry: no molecular identity or measurement implied.
    const g = w.PortfolioScience?.geometry?.('molecule');
    const fallback = { points: [[-60,0,0],[-30,-52,0],[30,-52,0],[60,0,0],[30,52,0],[-30,52,0],[112,-30,0],[150,-70,0]], bonds: [[0,1],[1,2],[2,3],[3,4],[4,5],[5,0],[3,6],[6,7]] };
    const geo = g || fallback;
    const bonds = geo.bonds.map(([a,b]) => `<line x1="${geo.points[a][0]}" y1="${geo.points[a][1]}" x2="${geo.points[b][0]}" y2="${geo.points[b][1]}"/>`).join('');
    const nodes = geo.points.map(([x,y], i) => `<circle cx="${x}" cy="${y}" r="${i < 6 ? 7 : 4}"/>`).join('');
    return `<div class="story-art" aria-hidden="true"><svg viewBox="0 0 600 520" fill="none">
      <g class="story-coordinate"><path d="M60 260H540M300 30V490"/><circle cx="300" cy="260" r="204"/><circle cx="300" cy="260" r="152"/><path d="M55 55h35m-17-17v35M510 465h35m-17-17v35"/></g>
      <g class="story-cell" data-story-art="0"><path class="story-membrane" d="M117 146C151 71 301 48 394 99S535 256 464 369 243 474 145 393 76 240 117 146Z"/><path class="story-membrane-inner" d="M128 152C162 83 299 62 386 111S520 255 454 360 247 459 155 383 88 241 128 152Z"/><ellipse class="story-nucleus" cx="294" cy="263" rx="75" ry="90" transform="rotate(24 294 263)"/><path class="story-chromatin" d="M278 208C324 195 261 271 302 256S271 323 316 312M264 248C307 225 279 296 324 276"/><path class="story-fold" d="M170 187q38-62 94-48m-100 66q38-62 94-48M389 328q45-33 22-78m-12 92q45-33 22-78"/><path class="story-organelle" d="M182 316c-35-12-48 37-12 49s49-37 12-49Zm-10 7 12 9-18 7 16 14M373 154c-29-15-49 26-21 42s50-26 21-42Zm-12 5 8 9-16 5 11 11"/><circle cx="187" cy="261" r="7"/><circle cx="322" cy="386" r="8"/><circle cx="413" cy="216" r="5"/></g>
      <g class="story-molecule" data-story-art="1"><g transform="translate(285 260) scale(1.45)">${bonds}${nodes}</g></g>
      <g class="story-code" data-story-art="2"><rect class="story-code-panel" x="110" y="112" width="380" height="300" rx="18"/><path class="story-code-rule" d="M110 158H490"/><circle cx="133" cy="135" r="4"/><circle cx="148" cy="135" r="4"/><circle cx="163" cy="135" r="4"/><path class="story-bracket" d="m217 209-42 49 42 49m166-98 42 49-42 49m-60-117-46 141"/><path class="story-code-line" d="M166 357H295M166 374H242M319 357H436M267 374H380"/></g>
      <path class="story-orbit" d="M103 339C-20 252 185 60 366 102S599 318 430 415" pathLength="100"/>
      <circle class="story-origin" cx="300" cy="260" r="3"/>
    </svg><span class="story-art-label">ILLUSTRATIVE STUDY <i>×</i> BIO + CHEM + CODE</span></div>`;
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
    return `<div class="discovery-story" id="discovery-story" data-story aria-labelledby="discovery-story-title"><div class="story-intro"><p class="story-eyebrow">A CONNECTED PERSPECTIVE</p><h3 id="discovery-story-title">Across scales.<br><em>Between disciplines.</em></h3><p>A visual journey through biology, chemistry and code.</p></div><div class="story-runway"><div class="story-stage"><div class="story-stage-top"><span>THREE WAYS OF SEEING</span><span class="story-scroll-hint">SCROLL TO EXPLORE ↓</span></div><div class="story-composition">${artwork()}<div class="story-copy">${cards}</div></div><div class="story-stage-bottom"><span class="story-illustration-note">An illustrative narrative. Project names and tags come from the CV.</span><nav class="story-chapter-nav" aria-label="Explore the visual story">${chapters.map((c,i) => `<button type="button" data-story-go="${i}" aria-label="Go to ${c.name.slice(0,-1)} chapter"><span>0${i+1}</span><span>${c.name.slice(0,-1)}</span><i aria-hidden="true"></i></button>`).join('')}</nav></div></div></div></div>`;
  }
  let cleanup = () => {};
  function mount(root) {
    cleanup();
    if (!root?.querySelectorAll) return;
    const scenes = [...root.querySelectorAll('[data-story]')].map(el => ({ el, runway: el.querySelector('.story-runway'), stage: el.querySelector('.story-stage'), art: [...el.querySelectorAll('[data-story-art]')], copy: [...el.querySelectorAll('[data-story-chapter]')], buttons: [...el.querySelectorAll('[data-story-go]')], visible: !w.IntersectionObserver, active: false }));
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
    function clearScrub(s) {
      ['--story-progress', '--story-camera', '--story-scale'].forEach(name => s.el.style.removeProperty(name));
      s.buttons.forEach(button => button.removeAttribute('aria-current'));
      [...s.art, ...s.copy].forEach(el => { el.style.opacity = ''; el.style.transform = ''; });
    }
    function draw(s) {
      if (!s.active || !s.visible || doc.hidden) return;
      const rect = s.runway.getBoundingClientRect();
      const top = parseFloat(s.el.style.getPropertyValue('--story-header')) || 80;
      const range = Math.max(1, rect.height - s.stage.getBoundingClientRect().height);
      const progress = clamp((top - rect.top) / range);
      const position = progress * 2;
      s.el.style.setProperty('--story-progress', progress.toFixed(4));
      s.el.style.setProperty('--story-camera', `${(-5 + progress * 10).toFixed(3)}deg`);
      s.el.style.setProperty('--story-scale', (1 + Math.sin(progress * Math.PI) * .13).toFixed(4));
      s.art.forEach((el, i) => {
        const weight = clamp(1 - Math.abs(position - i) * 1.6);
        el.style.opacity = weight.toFixed(4);
        el.style.transform = `translateY(${((i-position)*42).toFixed(2)}px) scale(${(.82 + weight*.18).toFixed(4)})`;
      });
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
        if (!s.active) clearScrub(s);
      });
      schedule();
    }
    scenes.forEach(s => s.buttons.forEach((button, i) => on(button, 'click', () => {
      if (!s.active || !w.scrollTo) return;
      const top = parseFloat(s.el.style.getPropertyValue('--story-header')) || 80;
      const rect = s.runway.getBoundingClientRect();
      const range = Math.max(1, rect.height - s.stage.getBoundingClientRect().height);
      w.scrollTo({ top: (w.scrollY || 0) + rect.top - top + range * i / 2, behavior: 'instant' });
      schedule();
    })));
    on(w, 'scroll', schedule, { passive: true }); on(w, 'resize', resize, { passive: true });
    on(doc, 'visibilitychange', () => { if (doc.hidden && frame) { w.cancelAnimationFrame?.(frame); frame = 0; } else schedule(); });
    on(media, 'change', resize);
    if (w.IntersectionObserver) { io = new w.IntersectionObserver(entries => { entries.forEach(entry => { const s = scenes.find(s => s.el === entry.target); if (s) s.visible = entry.isIntersecting; }); schedule(); }, { rootMargin: '100px' }); scenes.forEach(s => io.observe(s.el)); }
    if (w.MutationObserver && doc.body) { observer = new w.MutationObserver(resize); observer.observe(doc.body, { attributes: true, attributeFilter: ['data-effects'] }); }
    resize();
    cleanup = () => { if (frame) w.cancelAnimationFrame?.(frame); io?.disconnect(); observer?.disconnect(); removers.forEach(fn => fn()); scenes.forEach(s => { delete s.el.dataset.storyMode; clearScrub(s); }); };
  }
  w.PortfolioStory = { render, mount, unmount: () => cleanup() };
})(window);
