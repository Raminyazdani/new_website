(function (w) {
  'use strict';

  const esc = (h, value) => h.e(value == null ? '' : value);
  const list = value => Array.isArray(value) ? value : [];
  const number = value => String(value + 1).padStart(2, '0');
  const concept = () => ['unified', 'atlas', 'molecular', 'terminal'].includes(w.PortfolioStudio?.concept) ? w.PortfolioStudio.concept : 'unified';
  const icon = name => w.PortfolioScience?.icon(name) || '';
  const art = kind => w.PortfolioScience?.art(kind) || '';
  const first = value => (String(value || '').match(/^[\s\S]*?[.!?](?=\s|$)/) || [String(value || '')])[0];
  function excerpt(value, max = 210) {
    const text = String(value || '');
    if (text.length <= max) return text;
    const cut = text.slice(0, max).replace(/\s+\S*$/, '');
    return `${cut || text.slice(0, max)}…`;
  }
  function name(identity, h) {
    return identity.givenName ? `${esc(h, identity.givenName)}<span>${esc(h, identity.familyName)}</span>` : esc(h, identity.name);
  }
  function disciplines() {
    return `<div class="st-disciplines" aria-label="Portfolio themes"><span>${icon('dna')}Biology</span><span>${icon('flask')}Chemistry</span><span>${icon('code')}Programming</span></div>`;
  }
  function roles(identity, h) {
    return list(identity.roles).length ? `<div class="st-roles">${h.chips(identity.roles, identity.roles.length)}</div>` : '';
  }
  function lead(identity, h) {
    const summary = identity.summary || '';
    const sentence = excerpt(first(summary), 260);
    return `${sentence ? `<p class="st-lead">${esc(h, sentence)}</p>` : ''}${summary !== sentence ? `<a class="st-text-link" href="#about">Read the full profile ${icon('arrow')}</a>` : ''}`;
  }
  function actions() {
    return `<div class="st-actions"><a class="st-action st-primary" href="#projects">Explore the work ${icon('arrow')}</a><a class="st-action" href="#about">Meet the person <span aria-hidden="true">↓</span></a></div>`;
  }
  function portrait(identity, h, extra = '') {
    return `<div class="st-portrait-unit ${extra}">${extra.includes('st-code-frame') ? `<div class="st-frame-tab">${icon('code')}<span>profile / view</span><span class="st-frame-dot" aria-hidden="true"></span></div>` : ''}${h.portrait(identity, 'st-portrait')}<div class="st-photo-caption"><span>${esc(h, identity.name)}</span>${identity.location ? `<span>${esc(h, identity.location)}</span>` : ''}</div></div>`;
  }
  function hero(vm, h) {
    const identity = vm.identity || {};
    const selected = concept();
    const mode = selected === 'unified' ? 'atlas' : selected;
    let content;
    if (selected === 'unified') {
      content = `<div class="st-atlas-hero st-connected-hero"><div class="hs-identity-heading"><p class="st-eyebrow"><span class="st-small-cross" aria-hidden="true">+</span> A personal atlas</p><h1 id="st-hero-title" class="st-name">${name(identity, h)}</h1>${disciplines()}</div>${w.PortfolioHeroScene ? w.PortfolioHeroScene.render(identity,h) : art('cell')}<div class="hs-identity-body">${lead(identity,h)}${roles(identity,h)}${actions()}</div><div class="st-hero-baseline"><span>Observe.</span><span>Connect.</span><span>Create.</span><a href="#about">Continue exploring <span aria-hidden="true">↓</span></a></div></div>`;
    } else if (mode === 'molecular') {
      content = `<div class="st-molecular-hero"><div class="st-molecular-heading"><p class="st-eyebrow">A personal portfolio</p><h1 id="st-hero-title" class="st-name">${name(identity, h)}</h1>${disciplines()}</div><div class="st-molecular-stage"><div class="st-hero-scene st-molecule-scene">${art('molecule')}</div>${portrait(identity, h, 'st-portrait-orbit')}<span class="st-stage-rule" aria-hidden="true"></span></div><div class="st-molecular-copy">${lead(identity, h)}${roles(identity, h)}${actions()}</div></div>`;
    } else if (mode === 'terminal') {
      content = `<div class="st-workspace"><div class="st-workspace-bar"><span class="st-window-dots" aria-hidden="true"><i></i><i></i><i></i></span><span>profile / overview</span><span class="st-workspace-label">PERSONAL NOTEBOOK</span></div><div class="st-workspace-body"><aside class="st-file-tree" aria-label="Portfolio notebook"><span class="st-eyebrow">CONTENTS</span><a class="is-current" href="#hero">${icon('book')} Overview</a><a href="#about">${icon('branch')} Profile</a><a href="#projects">${icon('code')} Projects <b>${h.number(list(vm.projects).length)}</b></a><a href="#experience">${icon('book')} Experience</a><div class="st-tree-art" aria-hidden="true">${icon('code')}</div></aside><div class="st-notebook-main"><p class="st-eyebrow"><span aria-hidden="true">#</span> Hello, I'm</p><h1 id="st-hero-title" class="st-name">${name(identity, h)}</h1>${disciplines()}${lead(identity, h)}${roles(identity, h)}${actions()}</div><aside class="st-profile-preview"><p class="st-eyebrow">PROFILE PREVIEW</p>${portrait(identity, h)}<a class="st-text-link" href="#about">Open profile ${icon('arrow')}</a></aside></div><div class="st-workspace-status"><span>${icon('branch')} Personal portfolio</span><span>Biology · chemistry · programming</span></div></div>`;
    } else {
      content = `<div class="st-atlas-hero"><div class="st-atlas-copy"><p class="st-eyebrow"><span class="st-small-cross" aria-hidden="true">+</span> A personal atlas</p><h1 id="st-hero-title" class="st-name">${name(identity, h)}</h1>${disciplines()}${lead(identity, h)}${roles(identity, h)}${actions()}</div>${selected === 'unified' && w.PortfolioHeroScene ? w.PortfolioHeroScene.render(identity, h) : `<div class="st-atlas-visual"><div class="st-atlas-scene">${art('cell')}</div>${portrait(identity, h, selected === 'unified' ? 'st-code-frame' : '')}<span class="st-figure-index" aria-hidden="true">FIG. 01 / INTRODUCTION</span></div>`}<div class="st-hero-baseline"><span>Observe.</span><span>Connect.</span><span>Create.</span><a href="#about">Continue exploring <span aria-hidden="true">↓</span></a></div></div>`;
    }
    return `<section class="pf-section st-section st-hero st-${mode}${selected === 'unified' ? ' st-unified' : ''}" id="hero" data-section="hero" aria-labelledby="st-hero-title"><div class="pf-wrap">${content}</div></section>`;
  }
  function metrics(vm, h) {
    const stats = vm.stats || {};
    return `<div class="st-metrics" aria-label="Portfolio records">${[['projects', 'Projects'], ['experience', 'Experience records'], ['publications', 'Research records'], ['skills', 'Listed skills']].map(([key, label], i) => `<div class="st-metric"><span class="st-metric-index">${number(i)}</span><strong>${h.number(stats[key])}</strong><span>${label}</span></div>`).join('')}</div>`;
  }
  function interests(vm, h) {
    const items = list(vm.interests);
    return items.length ? `<div class="st-interests"><p class="st-eyebrow">Interests &amp; curiosity</p><div class="st-interest-list">${items.map((item, i) => `<details class="st-interest"><summary><span class="st-index">${number(i)}</span><span>${esc(h, item.title)}</span><span class="st-plus" aria-hidden="true">+</span></summary>${item.description ? `<p>${esc(h, item.description)}</p>` : ''}</details>`).join('')}</div></div>` : '';
  }
  function about(vm, h) {
    const selected = concept();
    const mode = selected === 'unified' ? 'molecular' : selected;
    const summary = vm.identity?.summary || '';
    const statement = excerpt(first(summary), 280);
    const profile = `<div class="st-profile-statement"><p class="st-eyebrow">02 / Profile</p><h2 id="st-about-title">${esc(h, statement || 'About me')}</h2></div><div class="st-profile-description">${summary && summary !== statement ? `<details class="st-full-profile"><summary>Read the full introduction <span aria-hidden="true">+</span></summary><p>${esc(h, summary)}</p></details>` : ''}<a class="st-text-link" href="#experience">Follow the journey ${icon('arrow')}</a></div>`;
    const content = mode === 'terminal'
      ? `<div class="st-notebook-section"><div class="st-note-margin" aria-hidden="true">02<br>PROFILE</div><div class="st-note-content"><div class="st-about-grid">${profile}</div>${metrics(vm, h)}${interests(vm, h)}</div></div>`
      : mode === 'molecular'
        ? `<div class="st-dossier-profile"><div class="st-profile-illustration">${art(selected === 'unified' ? 'molecule' : 'protein')}<p class="st-eyebrow">${selected === 'unified' ? 'Living systems. Molecular forms. Computational thinking.' : 'Different scales.<br>Connected interests.'}</p></div><div class="st-dossier-content">${profile}${metrics(vm, h)}</div></div>${interests(vm, h)}`
        : `<div class="st-about-grid">${profile}</div>${metrics(vm, h)}${interests(vm, h)}`;
    return `<section class="pf-section st-section st-about st-${mode}${selected === 'unified' ? ' st-unified' : ''}" id="about" data-section="about" aria-labelledby="st-about-title"><div class="pf-wrap">${content}</div></section>`;
  }
  function projectKind(project) {
    const source = `${project.title || ''} ${project.description || ''} ${list(project.tags).join(' ')}`.toLowerCase();
    if (/chem|molecul|compound|polymer|synthes|cataly/.test(source)) return 'molecule';
    if (/protein|peptide/.test(source)) return 'protein';
    if (/bio|cell|gene|genom|neuro|dna|rna|organism|ecolog/.test(source)) return 'cell';
    return 'code';
  }
  function miniStudy(kind) {
    const labels = { cell: 'Biological form', protein: 'Folded chain', molecule: 'Molecular form', code: 'Computational form' };
    const symbols = { cell: 'dna', protein: 'branch', molecule: 'flask', code: 'code' };
    return `<div class="st-mini-study st-mini-${kind}" aria-label="${labels[kind]}, abstract illustration"><span class="st-mini-ring st-mini-ring-one" aria-hidden="true"></span><span class="st-mini-ring st-mini-ring-two" aria-hidden="true"></span><span class="st-mini-symbol" aria-hidden="true">${icon(symbols[kind])}</span><span class="st-mini-dot st-mini-dot-one" aria-hidden="true"></span><span class="st-mini-dot st-mini-dot-two" aria-hidden="true"></span><span class="st-mini-label">Abstract illustration</span></div>`;
  }
  function projectMeta(project, index, h) {
    const tags = list(project.tags);
    return `<div class="st-project-meta"><span>${esc(h, tags[0] || 'Project')}</span><span>${number(index)}</span></div>`;
  }
  function projectActions(project, h) {
    return `<div class="st-project-actions"><button class="st-text-link" type="button" data-open-project="${esc(h, project.id)}">Read project ${icon('arrow')}</button>${project.url ? h.link(project.url, 'Open link ↗', 'st-project-url') : ''}</div>`;
  }
  function projectCard(project, index, h, mode) {
    const tags = list(project.tags);
    const header = `<h3>${esc(h, project.title)}</h3>`;
    const description = project.description ? `<p class="st-project-description">${esc(h, excerpt(project.description, mode === 'terminal' ? 180 : 235))}</p>` : '';
    const chips = tags.length ? `<div class="st-project-tags">${h.chips(tags, tags.length)}</div>` : '';
    const scene = `<div class="st-project-scene">${miniStudy(projectKind(project))}</div>`;
    let body;
    if (mode === 'terminal') {
      body = `<div class="st-readme-index" aria-hidden="true">${number(index)}</div><div class="st-readme-copy"><p class="st-eyebrow">${icon('book')} PROJECT / README</p>${header}${description}${chips}${projectActions(project, h)}</div><div class="st-readme-preview"><span class="st-preview-caption">ILLUSTRATIVE PREVIEW</span>${scene}</div>`;
    } else if (mode === 'molecular') {
      body = `<div class="st-dossier-spine"><span>${number(index)}</span><span>PROJECT DOSSIER</span></div><div class="st-dossier-project">${projectMeta(project, index, h)}${header}${description}${chips}${projectActions(project, h)}</div><div class="st-dossier-art">${scene}<span class="st-dossier-art-label">Illustrative study</span></div>`;
    } else {
      body = `${scene}<div class="st-project-body">${projectMeta(project, index, h)}${header}${description}${chips}${projectActions(project, h)}</div>`;
    }
    return `<article class="st-project st-project-${mode}${index % 3 === 0 ? ' st-project-featured' : ''}" data-project-card data-project-id="${esc(h, project.id)}">${body}</article>`;
  }
  function projects(vm, h) {
    const selected = concept();
    const mode = selected === 'unified' ? 'terminal' : selected;
    const records = list(vm.projects);
    const categories = [...new Set(records.flatMap(item => list(item.tags)).filter(Boolean))];
    return `<section class="pf-section st-section st-projects st-${mode}${selected === 'unified' ? ' st-unified' : ''}" id="projects" data-section="projects" aria-labelledby="st-projects-title"><div class="pf-wrap"><div class="st-section-heading"><div><p class="st-eyebrow">03 / Work</p><h2 id="st-projects-title">${selected === 'unified' ? 'Projects, across disciplines.' : mode === 'terminal' ? 'The project notebook.' : mode === 'molecular' ? 'A collection of explorations.' : 'Ideas, put into practice.'}</h2></div><p class="st-record-count"><strong>${h.number(records.length)}</strong> project records</p></div><div class="st-project-tools"><label class="st-search">${icon('code')}<span class="st-sr-only">Search projects</span><input type="search" data-project-search placeholder="Search projects, topics, tools…"></label><label class="st-filter"><span class="st-sr-only">Filter projects by topic</span><select data-project-filter><option value="">All topics</option>${categories.map(item => `<option value="${esc(h, item)}">${esc(h, item)}</option>`).join('')}</select><span aria-hidden="true">↓</span></label><span class="st-tools-note">Explore each record in full</span></div><div class="st-project-list st-project-list-${mode}">${records.map((item, index) => projectCard(item, index, h, mode)).join('')}</div><p class="st-empty" data-project-empty hidden>No projects match your search. Try another topic or keyword.</p><button class="st-more" type="button" data-project-more hidden>Show more projects ↓</button></div></section>`;
  }
  function experienceDetails(item, h) {
    const tags = list(item.tags);
    return item.description || tags.length ? `<details class="st-experience-details"><summary>Read this chapter <span class="st-plus" aria-hidden="true">+</span></summary><div>${item.description ? `<p>${esc(h, item.description)}</p>` : ''}${tags.length ? `<div class="st-roles">${h.chips(tags, tags.length)}</div>` : ''}</div></details>` : '';
  }
  function experience(vm, h) {
    const selected = concept();
    const mode = selected === 'unified' ? 'molecular' : selected;
    const records = list(vm.experience);
    const rows = records.map((item, index) => {
      const main = `<div class="st-experience-main"><h3>${esc(h, item.title)}</h3>${item.organization ? `<p class="st-organization">${esc(h, item.organization)}</p>` : ''}${experienceDetails(item, h)}</div>`;
      return mode === 'terminal'
        ? `<article class="st-experience-row st-history-row"><div class="st-history-branch" aria-hidden="true">${icon('branch')}</div><div class="st-history-content"><div class="st-history-meta"><span>EXPERIENCE ${number(index)}</span><span>${esc(h, item.period)}</span></div>${main}</div></article>`
        : `<article class="st-experience-row"><div class="st-timeline-node" aria-hidden="true"><span>${number(index)}</span><i></i></div><div class="st-period">${esc(h, item.period)}</div>${main}</article>`;
    }).join('');
    return `<section class="pf-section st-section st-experience st-${mode}${selected === 'unified' ? ' st-unified' : ''}" id="experience" data-section="experience" aria-labelledby="st-experience-title"><div class="pf-wrap st-journey-layout"><div class="st-journey-heading"><p class="st-eyebrow">04 / Experience</p><h2 id="st-experience-title">${mode === 'terminal' ? 'The history so far.' : mode === 'molecular' ? 'A chain of experiences.' : 'Chapters of the journey.'}</h2><p class="st-journey-caption">Roles, research and affiliations.</p><span class="st-journey-total">${h.number(records.length)} experience records</span></div><div class="st-timeline st-timeline-${mode}">${rows}</div></div></section>`;
  }

  w.PortfolioRenderers = Object.assign({}, w.PortfolioRenderers || {}, { hero, about, projects, experience });
})(window);
