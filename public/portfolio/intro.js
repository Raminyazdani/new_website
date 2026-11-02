(function (w) {
  'use strict';

  const esc = (h, value) => h.e(value == null ? '' : value);
  const label = (value, fallback) => value || fallback;

  function hero(vm, h) {
    const identity = vm.identity || {};
    const roles = (identity.roles || []).filter(Boolean);
    const chips = roles.map((role, i) => `<span class="intro-role-chip intro-role-chip-${i % 3}"><i aria-hidden="true"></i>${esc(h, role)}</span>`).join('');
    const summary = identity.summary || '';
    const displayName = identity.givenName ? `${identity.givenName}${identity.familyName ? ` ${identity.familyName}` : ''}` : identity.name || '';
    return `<section class="pf-section intro-hero" id="hero" data-section="hero" aria-labelledby="intro-hero-title">
      <div class="pf-wrap intro-hero-wrap">
        <div class="intro-atmosphere" aria-hidden="true"><span class="intro-orbit intro-orbit-a"></span><span class="intro-orbit intro-orbit-b"></span><span class="intro-sun"></span><span class="intro-grain"></span></div>
        <div class="intro-hero-copy pf-reveal"><p class="pf-kicker intro-overline"><span class="intro-live-dot"></span>Personal portfolio</p>
          <h1 class="intro-name" id="intro-hero-title">${identity.givenName ? `${esc(h, identity.givenName)} <span>${esc(h, identity.familyName)}</span>` : esc(h, displayName)}</h1>
          <p class="intro-summary">${esc(h, summary)}</p>
          ${summary.length > 260 ? `<details class="intro-summary-more"><summary>Read the full introduction <span aria-hidden="true">↗</span></summary><p>${esc(h, summary)}</p></details>` : ''}
          <div class="intro-role-list" aria-label="Roles">${chips}</div>
          <div class="intro-hero-actions"><a class="pf-button primary" href="#projects">Explore selected work <span aria-hidden="true">↘</span></a><a class="pf-button intro-quiet-button" href="#about">A little about me <span aria-hidden="true">↓</span></a></div>
          <div class="intro-hero-foot"><span>${esc(h, identity.location)}</span><span class="intro-foot-line"></span><span>Curiosity, made tangible</span></div>
        </div>
        <div class="intro-portrait-stage pf-reveal" data-parallax>
          <div class="intro-portrait-caption"><span>PROFILE</span><span>PORTRAIT</span></div>
          <div class="intro-portrait-frame"><div class="intro-portrait-glow" aria-hidden="true"></div>${h.portrait(identity, 'intro-portrait')}<span class="intro-frame-corner intro-corner-tl" aria-hidden="true"></span><span class="intro-frame-corner intro-corner-br" aria-hidden="true"></span></div>
          <div class="intro-portrait-stamp" aria-hidden="true"><span>THINK</span><b>↗</b><span>MAKE</span></div>
          <div class="intro-photo-note"><span class="intro-note-mark">✳</span><span>Ideas grow<br>through practice.</span></div>
        </div>
        <a class="intro-scroll-cue" href="#about" aria-label="Scroll to about"><span>SCROLL TO EXPLORE</span><i aria-hidden="true"></i></a>
      </div>
    </section>`;
  }

  function about(vm, h) {
    const identity = vm.identity || {};
    const stats = vm.stats || {};
    const metrics = [
      ['projects', 'Projects in portfolio', '01'],
      ['experience', 'Experience records', '02'],
      ['publications', 'Research records', '03'],
      ['skills', 'Listed skills', '04']
    ];
    const summary = identity.summary || '';
    const statement = summary ? (summary.match(/^[\s\S]*?[.!?](?=\s|$)/) || [summary])[0] : '';
    return `<section class="pf-section intro-about" id="about" data-section="about" aria-labelledby="intro-about-title">
      <div class="pf-wrap intro-about-wrap">
        <div class="intro-about-head pf-reveal"><p class="pf-kicker">02 / THE THROUGHLINE</p><h2 class="intro-about-title" id="intro-about-title">${statement ? `${esc(h, statement)}<span class="intro-period">.</span>` : 'Profile'}</h2></div>
        <div class="intro-about-side pf-reveal"><span class="intro-crosshair" aria-hidden="true">✳</span><p>${esc(h, summary)}</p><a href="#experience" class="intro-text-link">Follow the path <span aria-hidden="true">↗</span></a></div>
        <div class="intro-stats" aria-label="Portfolio overview">${metrics.map(([key, title, index]) => `<div class="intro-stat pf-reveal"><span class="intro-stat-index">${index}</span><strong>${h.number(stats[key])}</strong><span>${title}</span></div>`).join('')}</div>
      </div>
    </section>`;
  }

  function projects(vm, h) {
    const projects = vm.projects || [];
    const categories = [...new Set(projects.flatMap(p => p.tags || []).filter(Boolean))];
    const cards = projects.map((project, index) => {
      const tags = (project.tags || []).filter(Boolean);
      const category = tags[0] || '';
      const shape = ['intro-art-signal', 'intro-art-grid', 'intro-art-rings', 'intro-art-fold'][index % 4];
      const url = project.url ? h.link(project.url, 'Visit project', 'intro-card-link') : '';
      return `<article class="intro-project-card ${index % 3 === 1 ? 'intro-project-wide' : ''} pf-reveal" data-project-card data-project-id="${esc(h, project.id)}" data-tilt>
        <div class="intro-project-art ${shape}" aria-hidden="true"><span class="intro-art-index">${String(index + 1).padStart(2, '0')}</span><span class="intro-art-orbit"></span><span class="intro-art-core"></span><span class="intro-art-lines"></span><span class="intro-art-label">FIELD<br>NOTES</span></div>
        <div class="intro-project-body"><div class="intro-project-meta"><span>${esc(h, category || 'Selected work')}</span><span>${String(index + 1).padStart(2, '0')} <i>/</i> ${String(projects.length).padStart(2, '0')}</span></div>
          <h3>${esc(h, project.title)}</h3><p>${esc(h, project.description)}</p><div class="intro-project-bottom"><div class="intro-project-tags">${h.chips(tags, tags.length || 1)}</div><button class="intro-card-link" type="button" data-open-project="${esc(h, project.id)}">Read case note <span aria-hidden="true">↗</span></button>${url}</div></div>
      </article>`;
    }).join('');
    return `<section class="pf-section intro-projects" id="projects" data-section="projects" aria-labelledby="intro-projects-title">
      <div class="pf-wrap"><div class="intro-section-top pf-reveal"><div>${h.heading('03', 'SELECTED WORK', 'Projects with a point of view', 'A living collection of explorations, tools and collaborations.')}</div><div class="intro-project-count"><strong>${h.number(projects.length)}</strong><span>RECORDS<br>IN THIS COLLECTION</span></div></div>
        <div class="intro-project-tools"><label class="intro-search"><span aria-hidden="true">⌕</span><span class="intro-sr-only">Search projects</span><input type="search" placeholder="Search the collection" data-project-search></label><label class="intro-filter"><span class="intro-sr-only">Filter projects by topic</span><select data-project-filter><option value="">All topics</option>${categories.map(c => `<option value="${esc(h, c)}">${esc(h, c)}</option>`).join('')}</select><span aria-hidden="true">⌄</span></label></div>
        <div class="intro-project-grid">${cards}</div><p class="intro-empty" data-project-empty hidden>No projects match this search.</p><button class="intro-more" type="button" data-project-more hidden>Show more projects <span aria-hidden="true">↓</span></button>
      </div>
    </section>`;
  }

  function experience(vm, h) {
    const records = vm.experience || [];
    const rows = records.map((item, index) => `<article class="intro-experience-row pf-reveal" data-tilt>
      <div class="intro-exp-index"><span>${String(index + 1).padStart(2, '0')}</span><i aria-hidden="true"></i></div>
      <div class="intro-exp-period">${esc(h, item.period)}</div><div class="intro-exp-main"><h3>${esc(h, item.title)}</h3><p class="intro-exp-org">${esc(h, item.organization)}</p>
        <details class="intro-exp-details"><summary><span>Read about this chapter</span><i aria-hidden="true">+</i></summary><div class="intro-exp-description"><p>${esc(h, item.description)}</p>${h.chips(item.tags, item.tags ? item.tags.length : 1)}</div></details>
      </div><span class="intro-exp-arrow" aria-hidden="true">↗</span>
    </article>`).join('');
    return `<section class="pf-section intro-experience" id="experience" data-section="experience" aria-labelledby="intro-experience-title">
      <div class="pf-wrap"><div class="intro-experience-heading pf-reveal"><p class="pf-kicker">04 / THE PATH SO FAR</p><h2 id="intro-experience-title">Experience<br><em>in motion.</em></h2><p class="pf-description">Different rooms, shared questions. Each role adds another perspective to the work.</p><div class="intro-exp-total"><strong>${h.number(records.length)}</strong><span>EXPERIENCE RECORDS</span></div></div>
        <div class="intro-timeline">${rows}</div>
      </div>
    </section>`;
  }

  w.PortfolioRenderers = Object.assign({}, w.PortfolioRenderers || {}, { hero, about, projects, experience });
})(window);
