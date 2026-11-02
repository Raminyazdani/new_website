(function (w) {
  'use strict';
  const list = v => Array.isArray(v) ? v : [];
  const distribution = vm => list(vm?.skillGroups).map(g => ({ id: g.id, name: g.name, count: list(g.groups).reduce((n, s) => n + list(s.items).length, 0) }));
  function renderSkills(vm, h) {
    const rows = distribution(vm), max = Math.max(1, ...rows.map(r => r.count));
    if (!rows.length) return '';
    return `<figure class="insight-skills"><figcaption><span class="insight-kicker">A TOOLKIT, IN CONTEXT</span><h3>Different tools.<br><em>Connected practice.</em></h3><p>Listed skills in each CV category.<br>Counts, rather than proficiency scores.</p></figcaption><div class="insight-bars" role="group" aria-label="Listed skill counts by category">${rows.map(r => `<button type="button" class="insight-bar" data-skill-jump="${h.e(r.id)}" aria-label="Explore ${h.e(r.name)}: ${r.count} listed skills" style="--bar:${(r.count / max * 100).toFixed(2)}%"><span>${h.e(r.name)}</span><b>${r.count}</b><i aria-hidden="true"></i></button>`).join('')}</div></figure>`;
  }
  function renderJourney(vm, h) {
    const rows = list(vm?.experience);
    if (!rows.length) return '';
    return `<div class="journey-reader"><div class="journey-reader-label"><span>EXPLORE THE CHAPTERS</span><span data-journey-position>01 / ${String(rows.length).padStart(2, '0')}</span></div><nav class="journey-map" aria-label="Experience chapters">${rows.map((r, i) => `<button type="button" data-journey-jump="${h.e(r.id)}" aria-label="Jump to ${h.e(r.title)}${r.period ? `, ${h.e(r.period)}` : ''}" title="${h.e(r.title)}"><span>${String(i + 1).padStart(2, '0')}</span><i aria-hidden="true"></i></button>`).join('')}</nav><p class="journey-current" data-journey-current>${h.e(rows[0].title)}</p><p class="journey-reader-note">A reading guide through the records.</p></div>`;
  }
  let cleanup = () => {};
  function mount(root, vm) {
    cleanup();
    if (!root?.querySelectorAll) return;
    const doc = root.ownerDocument || w.document;
    const rows = [...root.querySelectorAll('[data-journey-record]')];
    const skills = [...root.querySelectorAll('.record-skill-group')];
    list(vm?.skillGroups).forEach((g, i) => { if (skills[i]) skills[i].id = g.id; });
    let frame = 0, observer;
    const visible = new Set();
    function draw() {
      frame = 0;
      if (doc.hidden || !visible.size) return;
      const header = doc.querySelector('.pf-header')?.getBoundingClientRect().height || 80;
      let best = null, distance = Infinity;
      visible.forEach(row => {
        const rect = row.getBoundingClientRect(), d = Math.abs(rect.top - header - 100);
        if (d < distance) { distance = d; best = row; }
      });
      if (!best) return;
      const index = rows.indexOf(best), total = rows.length;
      rows.forEach((r, i) => { r.classList.toggle('is-journey-current', r === best); r.classList.toggle('is-journey-read', i < index); });
      root.querySelectorAll('[data-journey-jump]').forEach(b => b.setAttribute('aria-current', b.dataset.journeyJump === best.dataset.journeyRecord ? 'step' : 'false'));
      const counter = root.querySelector('[data-journey-position]'), title = root.querySelector('[data-journey-current]');
      if (counter) counter.textContent = `${String(index + 1).padStart(2, '0')} / ${String(total).padStart(2, '0')}`;
      if (title) title.textContent = list(vm?.experience)[index]?.title || '';
      root.querySelector('.st-timeline')?.style.setProperty('--journey-progress', `${total > 1 ? index / (total - 1) * 100 : 100}%`);
    }
    const schedule = () => { if (!frame && visible.size && !doc.hidden && w.requestAnimationFrame) frame = w.requestAnimationFrame(draw); };
    const click = event => {
      const chapter = event.target.closest('[data-journey-jump]'), skill = event.target.closest('[data-skill-jump]');
      let target;
      if (chapter) target = rows.find(r => r.dataset.journeyRecord === chapter.dataset.journeyJump);
      if (skill) { target = skills.find(r => r.id === skill.dataset.skillJump); if (target) target.open = true; }
      if (target) { target.scrollIntoView?.({ behavior: doc.body.dataset.effects === 'on' ? 'smooth' : 'instant', block: chapter ? 'start' : 'center' }); if (skill) target.querySelector('summary')?.focus?.({ preventScroll: true }); }
    };
    root.addEventListener('click', click);
    w.addEventListener?.('scroll', schedule, { passive: true });
    w.addEventListener?.('resize', schedule, { passive: true });
    if (w.IntersectionObserver && rows.length) {
      observer = new w.IntersectionObserver(entries => { entries.forEach(e => e.isIntersecting ? visible.add(e.target) : visible.delete(e.target)); schedule(); }, { rootMargin: '-90px 0px -15% 0px' });
      rows.forEach(row => observer.observe(row));
    }
    cleanup = () => { observer?.disconnect(); if (frame) w.cancelAnimationFrame?.(frame); root.removeEventListener('click', click); w.removeEventListener?.('scroll', schedule); w.removeEventListener?.('resize', schedule); visible.clear(); };
  }
  w.PortfolioInsights = { renderSkills, renderJourney, distribution, mount, unmount: () => cleanup() };
})(window);
