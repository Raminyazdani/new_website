(function (w) {
  'use strict';
  const stories = {
    all: {
      title: 'From living systems to code', intro: 'Follow one form as it changes scale, then open projects from each part of the portfolio.',
      chapters: [
        ['Living systems', 'Start with the cell as a whole: its boundary, interior and surroundings.', /cell|tissue|microb|organis|biolog|cultiv|single.cell/],
        ['Molecular structure', 'Zoom in to see how local connections shape a larger structure.', /molecul|protein|residu|enzym|structur|chemistr|chromatog/],
        ['Computational models', 'Read the same connections as a mesh, a way to organize information for computation.', /machine.learning|software|model|algorithm|data|python|comput|neural/],
      ],
    },
    biology: {
      title: 'From tissue to molecule', intro: 'Change the focal plane to see the same illustrated structure at three scales.',
      chapters: [
        ['Tissue', 'Pull back to see a field of neighboring forms.', /tissue|cultur|organis|microb|ferment|biotechn/],
        ['Cell', 'Bring one membrane and its interior into focus.', /cell|genom|rna|transcript|biolog|bioinform/],
        ['Molecule', 'Look closer at the bonds and folds inside the cell.', /molecul|protein|residu|enzym|structur|chemistr|sequenc|chromatog/],
      ],
    },
    programming: {
      title: 'From inputs to artifacts', intro: 'Trace a conceptual workflow. The projects are examples from the archive, each with its own record.',
      chapters: [
        ['Input', 'An analysis starts by arranging inputs into a form a program can use.', /dataset|data|database|sql|input|transcript|scrap|sequenc/],
        ['Transformation', 'The paths converge to show the step where a program or model operates on those inputs.', /machine.learning|python|classification|model|neural|algorithm|pipeline|predict/],
        ['Artifact', 'The paths separate into outputs: software, code or results that can be inspected.', /software|web|app|visual|repository|dashboard|develop|github|typescript/],
      ],
    },
  };
  const clamp = (x, min, max) => Math.min(max, Math.max(min, x));
  const number = index => `0${index + 1}`;
  const score = (p, term) => (term.test(String(p.title ?? '').toLowerCase()) ? 6 : 0) +
    (p.tags || []).filter(tag => term.test(String(tag).toLowerCase())).length * 3 +
    (term.test(String(p.description ?? '').toLowerCase()) ? 1 : 0);

  function render() {
    return `<section class="syn-journey" id="connected-story" data-syn-journey aria-labelledby="syn-journey-title">
      <header class="syn-journey-heading"><h3 id="syn-journey-title"></h3><p data-journey-intro></p></header>
      <div class="syn-journey-layout">
        <figure class="syn-journey-figure">
          <div class="syn-journey-view syn-optics">
            <div class="syn-journey-figure-label"><span>Figure 02 · Conceptual illustration</span><strong data-journey-figure-index></strong></div>
            ${w.PortfolioSynthesisScene?.createMarkup('journey') || ''}
          </div>
          <figcaption>
            <div class="syn-journey-controls" role="group" aria-label="Story chapters">${[0,1,2].map(i => `<button type="button" data-journey-step="${i}" aria-pressed="false"><span aria-hidden="true">${number(i)}</span><span data-journey-step-label></span></button>`).join('')}</div>
            <label class="syn-journey-scrub"><span>Explore the form</span><input data-journey-range type="range" min="0" max="2" step="0.01" value="0"></label>
          </figcaption>
        </figure>
        <div class="syn-journey-chapters">
          ${[0,1,2].map(i => `<article class="syn-journey-card" data-journey-card="${i}"><span class="syn-journey-card-index" aria-hidden="true">${number(i)}</span><div><h4></h4><p></p><div data-journey-project></div></div></article>`).join('')}
        </div>
      </div>
    </section>`;
  }

  function mount(root, options) {
    if (!root) return null;
    const doc = root.ownerDocument;
    const art = w.PortfolioSynthesisScene?.mount(root.querySelector('[data-journey-art]'), 'all', { idle: false });
    const buttons = [...root.querySelectorAll('[data-journey-step]')];
    const cards = [...root.querySelectorAll('[data-journey-card]')];
    const range = root.querySelector('[data-journey-range]');
    const chapterCounter = root.querySelector('[data-journey-figure-index]');
    let mode, helpers, projects, selected, visible = !w.IntersectionObserver;
    let progress = 0, phase = -1, frame = null, manualY = null, destroyed = false;
    const desktop = () => w.innerWidth >= 761;
    const on = () => !destroyed && visible && desktop() && !doc.hidden && doc.body.dataset.effects === 'on';

    function draw(value, force = false) {
      progress = clamp(Math.round(value * 100) / 100, 0, 2);
      const next = Math.round(progress);
      art?.setProgress(mode, progress);
      range.value = String(progress);
      if (phase !== next || force) {
        phase = next;
        root.dataset.journeyPhase = String(phase);
        chapterCounter.textContent = `${number(phase)} / 03`;
        range.setAttribute('aria-valuetext', stories[mode].chapters[phase][0]);
        buttons.forEach((button, i) => button.setAttribute('aria-pressed', String(i === phase)));
        cards.forEach((card, i) => card.toggleAttribute('data-journey-current', i === phase));
      }
    }
    function updateLinks(preferredChapter = -1) {
      const chapters = stories[mode].chapters, used = new Set();
      const current = projects.find(p => p.id === selected);
      const scores = chapters.map(([, ,term]) => current ? score(current, term) : 0);
      const selectedChapter = current ? preferredChapter >= 0 ? preferredChapter : scores.indexOf(Math.max(...scores)) : -1;
      if (current) used.add(current.id);
      chapters.forEach(([, , term], i) => {
        let record;
        if (i === selectedChapter) record = current;
        else {
          const candidates = projects.filter(p => !used.has(p.id));
          record = candidates.reduce((best, p) => !best || score(p,term) > score(best,term) ? p : best, null);
        }
        if (record) used.add(record.id);
        const slot = cards[i].querySelector('[data-journey-project]');
        if (!record) { slot.replaceChildren(); return; }
        const existing = slot.querySelector('[data-open-project]');
        const selectedLabel = i === selectedChapter ? 'Selected project' : score(record,term) ? 'Related project' : 'From the archive';
        if (existing?.dataset.openProject === record.id) {
          slot.querySelector('small').textContent = selectedLabel;
          return;
        }
        const topics = (record.tags || []).slice(0,2);
        slot.innerHTML = `<small>${selectedLabel}</small><button type="button" class="syn-journey-record" data-open-project="${helpers.e(record.id)}"><span>${helpers.e(record.title)}</span><svg viewBox="0 0 20 20" aria-hidden="true"><path d="M5 15 15 5m-6 0h6v6"/></svg></button>${topics.length ? `<ul class="syn-journey-topics" aria-label="Project topics">${topics.map(tag => `<li>${helpers.e(tag)}</li>`).join('')}</ul>` : ''}`;
      });
    }
    function selectProject(id) {
      if (selected === id) return;
      selected = id;
      const existingChapter = cards.findIndex(card => card.querySelector('[data-open-project]')?.dataset.openProject === id);
      updateLinks(existingChapter);
    }
    function sample() {
      frame = null;
      if (!on()) return;
      if (manualY !== null) {
        if (Math.abs((w.scrollY || 0) - manualY) < 24) return;
        manualY = null;
      }
      const centers = cards.map(card => {
        const box = card.getBoundingClientRect();
        return box.top + box.height * .5;
      });
      if (!(centers[0] < centers[1] && centers[1] < centers[2])) return;
      const bar = doc.getElementById('synthesisToolbar')?.getBoundingClientRect().bottom || 0;
      const line = Math.min(w.innerHeight * .58, Math.max(w.innerHeight * .42, bar + 134));
      const next = line < centers[1] ? (line - centers[0]) / (centers[1] - centers[0]) : 1 + (line - centers[1]) / (centers[2] - centers[1]);
      draw(next);
    }
    function cancel() {
      if (frame !== null) w.cancelAnimationFrame?.(frame);
      frame = null;
    }
    function schedule() {
      if (!on() || frame !== null) return;
      if (w.requestAnimationFrame) frame = w.requestAnimationFrame(sample);
      else sample();
    }
    function sync() { if (on()) schedule(); else cancel(); }
    function manual(value) { manualY = w.scrollY || 0; cancel(); draw(value); }
    function onClick(event) {
      const step = event.target.closest('[data-journey-step]');
      if (step) manual(Number(step.dataset.journeyStep));
    }
    function onInput() { manual(Number(range.value)); }
    function update(next) {
      ({mode, helpers} = next);
      projects = next.model.projects || [];
      const story = stories[mode];
      root.querySelector('#syn-journey-title').textContent = story.title;
      root.querySelector('[data-journey-intro]').textContent = story.intro;
      story.chapters.forEach(([title,copy],i) => {
        cards[i].querySelector('h4').textContent = title;
        cards[i].querySelector('p').textContent = copy;
        buttons[i].querySelector('[data-journey-step-label]').textContent = title;
      });
      updateLinks(); draw(progress, true); sync();
    }
    const observer = w.IntersectionObserver ? new w.IntersectionObserver(entries => {
      visible = entries.some(entry => entry.isIntersecting);
      sync();
    }) : null;
    root.addEventListener('click', onClick);
    range.addEventListener('input', onInput);
    w.addEventListener?.('scroll', schedule, {passive: true});
    w.addEventListener?.('resize', sync, {passive: true});
    doc.addEventListener('visibilitychange', sync);
    observer?.observe(root);
    update(options);
    return { update, selectProject, sync, destroy() {
      destroyed = true; cancel(); observer?.disconnect(); art?.destroy();
      root.removeEventListener('click', onClick);
      range.removeEventListener('input', onInput);
      w.removeEventListener?.('scroll', schedule);
      w.removeEventListener?.('resize', sync);
      doc.removeEventListener('visibilitychange', sync);
    } };
  }

  w.PortfolioSynthesisJourney = { render, mount };
})(window);
