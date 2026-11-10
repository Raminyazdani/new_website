(function (w, doc) {
  'use strict';
  const id = 'synthesis';
  const list = value => Array.isArray(value) ? value : [];
  const exists = value => value !== '' && value !== null && value !== undefined;
  const number = i => String(i + 1).padStart(2, '0');
  const sections = {
    hero: 'Home', about: 'Profile', projects: 'Work', experience: 'Experience', publications: 'Research',
    education: 'Education', skills: 'Methods', certificates: 'Credentials', languages: 'Languages',
    references: 'References', contact: 'Contact',
  };
  const order = Object.keys(sections);
  const modes = {
    all: {
      title: 'All disciplines', subtitle: 'One portfolio, three perspectives.',
      plate: 'Membrane / molecule / network', labels: ['01  Membrane', '02  Molecular bonds', '03  Data paths'],
      nav: ['about', 'projects', 'experience', 'publications', 'skills', 'contact'],
      primary: ['projects', 'Explore the work'], study: 'A connection across scales',
      studyDescription: 'From the shape of a cell to the structure of a dataset, the same object can be read in more than one way.',
      steps: ['Living systems', 'Molecular structure', 'Computation'],
    },
    biology: {
      title: 'Life sciences', subtitle: 'Biology, chemistry and bioinformatics.',
      plate: 'Membrane / sequence / structure', labels: ['01  Membrane', '02  Sequence', '03  Molecular structure'],
      nav: ['about', 'publications', 'projects', 'experience', 'skills', 'contact'],
      primary: ['publications', 'Explore the research'], study: 'From cells to sequences',
      studyDescription: 'Three scales of observation: the boundary of a cell, the structure of a molecule and the order of a sequence.',
      steps: ['Cellular form', 'Molecular structure', 'Sequence'],
    },
    programming: {
      title: 'Engineering + ML', subtitle: 'Programming, data science and machine learning.',
      plate: 'Input / transformation / connection', labels: ['01  Input layers', '02  Transformation', '03  Output paths'],
      nav: ['about', 'projects', 'skills', 'experience', 'publications', 'contact'],
      primary: ['projects', 'Explore software & ML'], study: 'From inputs to connections',
      studyDescription: 'A schematic of the way inputs can be organized, transformed and read as connected structures.',
      steps: ['Input', 'Transformation', 'Connection'],
    },
  };
  const terms = {
    biology: /bio(?:log|inform|tech|chem|system)|genom|(?:rna|dna|single)[ -]?(?:seq|cell)?\b|transcriptom|prote(?:in|om)|microbi|molecul|metabol|chromato|ferment|enzyme|cellular|\bchemistr|structural biology|sequenc/i,
    programming: /program(?:ming|mer)|software|computer science|machine learning|deep learning|\bml\b|neural|data (?:scien|engineer|pipeline|visual|analyt)|development|developer|python|javascript|typescript|sql|pytorch|tensorflow|web (?:app|dev)|react|algorithm|devops|linux|github|nextflow|automation/i,
  };
  const readMode = () => {
    const value = new URLSearchParams(w.location?.search || '').get('perspective');
    return Object.hasOwn(modes, value) ? value : 'all';
  };
  let mode = readMode(), scene, sceneElement, studyObserver, latestModel, modeInput, modeStatus, pointerAnchor;
  const active = () => w.PortfolioStudio?.concept === id;

  function priority(record, key) {
    const matches = values => values.filter(Boolean).filter(value => terms[key].test(String(value))).length;
    return 6 * matches([record.title, record.name, record.field, ...list(record.tags)]) +
      2 * matches([record.description, record.notes, record.organization, record.issuer, record.venue]) +
      matches(list(record.groups).map(group => group.name));
  }

  function project(vm) {
    if (mode === 'all') return vm;
    const sort = items => list(items).map((row, index) => [row, priority(row, mode), index])
      .sort((a, b) => b[1] - a[1] || a[2] - b[2]).map(([row]) => row);
    return {
      ...vm, projects: sort(vm.projects), experience: sort(vm.experience),
      publications: sort(vm.publications), education: sort(vm.education),
      certificates: sort(vm.certificates),
      skillGroups: sort(vm.skillGroups).map(group => ({ ...group, groups: sort(group.groups) })),
    };
  }

  const markup = (sectionId, content, title, classes = '') =>
    `<section class="pf-section syn-section syn-${sectionId} ${classes}" id="${sectionId}" data-section="${sectionId}" aria-labelledby="syn-title-${sectionId}"><div class="syn-wrap">${title || ''}${content}</div></section>`;
  const tags = (values, h) => list(values).length ? `<ul class="syn-tags" aria-label="Topics">${values.map(value => `<li>${h.e(value)}</li>`).join('')}</ul>` : '';
  const metadata = (values, h) => values.filter(exists).length
    ? `<div class="syn-metadata">${values.filter(exists).map(v => `<span>${h.e(v)}</span>`).join('')}</div>` : '';
  const excerpt = (value, limit = 208) => {
    const content = String(value || '').trim().replace(/\s+/g, ' ');
    if (content.length <= limit) return content;
    const lead = content.slice(0, limit + 1).replace(/\s+\S*$/, '').trimEnd();
    return (lead || content.slice(0, limit)) + '…';
  };
  function heading(key, label, title, summary = '') {
    return `<header class="syn-section-heading"><span class="syn-index" aria-hidden="true">${number(order.indexOf(key) - 1)}</span><div><p class="syn-kicker">${label}</p><h2 id="syn-title-${key}">${title}</h2></div>${summary ? `<p class="syn-section-description">${summary}</p>` : ''}</header>`;
  }
  const textLink = (href, text, cls = '') => `<a class="syn-text-link ${cls}" href="${href}">${text}<span aria-hidden="true">↗</span></a>`;

  function hero(vm, h) {
    const person = vm.identity;
    const name = person.givenName && person.familyName ? `<span>${h.e(person.givenName)}</span> <span>${h.e(person.familyName)}</span>` : h.e(person.name || 'Portfolio');
    const lead = excerpt(person.summary, 206);
    return markup('hero', `
      <div class="syn-hero-grid">
        <div class="syn-hero-identity">
          <p class="syn-kicker syn-hero-kicker" data-motion-part><span aria-hidden="true"></span> Portfolio / Synthesis</p>
          <h1 id="syn-title-hero" data-motion-part>${name}</h1>
          ${list(person.roles).length ? `<ul class="syn-role-list" aria-label="Profile roles">${person.roles.map(role => `<li>${h.e(role)}</li>`).join('')}</ul>` : ''}
          ${lead ? `<p class="syn-lead">${h.e(lead)}</p>` : ''}
          <div class="syn-hero-actions"><a class="syn-primary" data-syn-primary href="#projects">Explore the work <span aria-hidden="true">↘</span></a>${textLink('#about', 'Read the profile')}</div>
        </div>
        <figure class="syn-plate">
          <div class="syn-plate-top"><span><i aria-hidden="true"></i> SYNTHESIS / STUDY</span><span>FIG. 01</span></div>
          ${w.PortfolioSynthesisScene?.createMarkup() || ''}
          <div class="syn-annotation syn-annotation-1" aria-hidden="true"><i></i><span></span></div>
          <div class="syn-annotation syn-annotation-2" aria-hidden="true"><i></i><span></span></div>
          <div class="syn-annotation syn-annotation-3" aria-hidden="true"><i></i><span></span></div>
          <div class="syn-person" data-motion-part>${h.portrait(person, 'syn-portrait')}${person.location ? `<span>${h.e(person.location)}</span>` : ''}</div>
          <figcaption class="syn-plate-caption"><span>Conceptual illustration</span><strong data-syn-plate-title></strong></figcaption>
        </figure>
      </div>
      <div class="syn-hero-index"><span class="syn-kicker">Portfolio index</span><nav aria-label="Portfolio chapters" data-syn-chapters></nav></div>`, '', 'syn-persistent');
  }

  const plateArts = {
    cell: '<ellipse cx="97" cy="56" rx="51" ry="29" transform="rotate(-14 97 56)"/><ellipse cx="97" cy="56" rx="42" ry="21" transform="rotate(-14 97 56)"/><ellipse cx="85" cy="56" rx="18" ry="12"/><path d="M45 68c34-14 52-16 103-24M81 21l8 25m43 30 13 17"/><circle cx="85" cy="56" r="5"/><circle cx="124" cy="48" r="3"/>',
    molecule: '<path d="m38 63 31-28 34 12 30-24 25 40-34 23-21-39-26 30-39-14m65-16 55 16m-89-28 8 42"/><circle cx="38" cy="63" r="4"/><circle cx="69" cy="35" r="6"/><circle cx="103" cy="47" r="8"/><circle cx="133" cy="23" r="4"/><circle cx="158" cy="63" r="5"/><circle cx="124" cy="86" r="4"/><circle cx="77" cy="77" r="5"/>',
    sequence: '<path d="M34 32c18 0 31 48 53 48s34-48 52-48c9 0 18 9 26 24M34 80c18 0 31-48 53-48s34 48 52 48c9 0 18-9 26-24M44 38v36m21-22v9m22-29v48m24-30v12m27-30v48m14-42v36"/>',
    inputs: '<path d="M28 28h45v13h28v-13h68M28 45h37v7h48v-7h56M28 62h49v-4h23v4h69M28 79h39v-8h44v8h58"/><circle cx="28" cy="28" r="3"/><circle cx="28" cy="45" r="3"/><circle cx="28" cy="62" r="3"/><circle cx="28" cy="79" r="3"/>',
    nodes: '<path d="M41 28l58 5 60 17-60 27-58 6m0-55 58 49 60-4-60-40-58 50m0-55v55m118-33v23"/><circle cx="41" cy="28" r="4"/><circle cx="41" cy="83" r="4"/><circle cx="99" cy="33" r="5"/><circle cx="99" cy="77" r="6"/><circle cx="159" cy="50" r="4"/><circle cx="159" cy="73" r="3"/>',
    signal: '<path d="M22 80h157M22 52h157M22 25h157M26 73l22-9 21 3 19-23 16 10 19-27 20 19 31-24"/><circle cx="88" cy="44" r="5"/><circle cx="123" cy="27" r="4"/><circle cx="174" cy="22" r="5"/>',
  };
  function miniature(type) {
    return `<svg viewBox="0 0 200 110" fill="none" aria-hidden="true"><path class="syn-mini-grid" d="M20 14h160v82H20zM20 56h160M100 14v82"/><g class="syn-mini-form">${plateArts[type]}</g></svg>`;
  }
  function projectVisual(record, index, h) {
    const diagram = w.PortfolioPreviews?.renderProject(record, index, h, { diagramOnly: true });
    if (diagram) return diagram;
    const key = [record.title, ...list(record.tags)].filter(Boolean).join(' ');
    const type = /machine learning|neural|(?:^|\W)ml(?:$|\W)|classif|predict/i.test(key) ? 'nodes'
      : /protein|molecul|chemistr|enzyme|metabol/i.test(key) ? 'molecule'
      : /genom|transcript|sequenc|rna[- ]seq|dna/i.test(key) ? 'sequence'
      : terms.biology.test(key) ? 'cell' : terms.programming.test(key) ? 'inputs' : index % 2 ? 'nodes' : 'signal';
    return `<figure class="syn-project-art syn-project-art-${type}">
      <div class="syn-project-art-surface"><span aria-hidden="true">+<br>└</span>${miniature(type)}<span aria-hidden="true">┐<br>+</span></div>
      <figcaption><span>Conceptual illustration</span><span>Fig. ${number(index)}</span></figcaption></figure>`;
  }
  function about(vm, h) {
    const person = vm.identity, m = modes[mode];
    const shapes = { all: ['cell', 'molecule', 'nodes'], biology: ['cell', 'molecule', 'sequence'], programming: ['inputs', 'signal', 'nodes'] }[mode];
    return markup('about', `<div class="syn-profile-grid">
      ${person.summary ? `<p class="syn-profile-text">${h.e(person.summary)}</p>` : ''}
      ${list(vm.interests).length || person.coverUrl ? `<div class="syn-interests">${list(vm.interests).length ? '<h3>Interests</h3>' : ''}${list(vm.interests).map(i => `<details data-syn-disclosure="${h.e(i.id)}"><summary>${h.e(i.title)} <span aria-hidden="true">+</span></summary>${i.description ? `<p>${h.e(i.description)}</p>` : ''}</details>`).join('')}${person.coverUrl ? `<details data-syn-disclosure="profile-cover"><summary>Profile cover <span aria-hidden="true">+</span></summary><img class="syn-cover" src="${h.e(person.coverUrl)}" alt="Profile cover" loading="lazy" decoding="async" referrerpolicy="no-referrer"></details>` : ''}</div>` : ''}
      </div><figure class="syn-study" data-syn-reveal><figcaption><div><p class="syn-kicker">Illustrated study · Fig. 02</p><h3>${m.study}</h3></div><p>${m.studyDescription}</p></figcaption>
      <div class="syn-study-plates">${m.steps.map((label, i) => `<div><span>${number(i)} / ${label}</span>${miniature(shapes[i])}</div>`).join('')}</div></figure>`,
    heading('about', 'Personal profile', 'About', 'Background and interests.'));
  }

  function projects(vm, h) {
    const rows = list(vm.projects), topics = [...new Set(rows.flatMap(p => list(p.tags)).filter(Boolean))];
    return markup('projects', `<div class="syn-search syn-work-search">
        <label>Search projects<input type="search" placeholder="Search titles, descriptions and topics" data-project-search></label>
        <label>Topic<select data-project-filter><option value="">All topics</option>${topics.map(topic => `<option value="${h.e(topic)}">${h.e(topic)}</option>`).join('')}</select></label>
        <span data-syn-project-count role="status"></span>
      </div><div class="syn-project-grid">${rows.map((p, i) => `<article class="syn-project" data-project-card data-project-id="${h.e(p.id)}">
        ${i < 2 ? `<div class="syn-project-preview">${projectVisual(p, i, h)}</div>` : ''}
        <div class="syn-project-copy"><span class="syn-index">${number(i)}</span><h3>${h.e(p.title)}</h3>
        ${p.description ? `<p>${h.e(excerpt(p.description, i < 2 ? 240 : 156))}</p>` : ''}${tags(p.tags, h)}
        <div class="syn-record-actions"><button type="button" class="syn-link-button" data-open-project="${h.e(p.id)}">Read project <span aria-hidden="true">↗</span></button>
        ${p.url ? h.link(p.url, p.urlLabel || 'Open project link ↗') : ''}${p.repositoryUrl ? h.link(p.repositoryUrl, p.repositoryLabel || 'Repository ↗') : ''}</div></div></article>`).join('')}</div>
      <p class="syn-empty" data-project-empty hidden>No projects match this search.</p><button type="button" class="syn-more" data-project-more hidden>Show more projects</button>`,
      heading('projects', 'Project archive', 'Selected work', 'Browse the complete project collection by keyword or topic.'));
  }

  function experience(vm, h) {
    return markup('experience', `<div class="syn-timeline">${list(vm.experience).map((r, i) => `<article class="syn-experience-row" data-journey-record="${h.e(r.id)}">
      <div class="syn-experience-time"><span class="syn-index">${number(i)}</span>${r.period ? `<span>${h.e(r.period)}</span>` : ''}</div>
      <div class="syn-experience-copy"><h3>${h.e(r.title)}</h3>${metadata([r.organization, r.location], h)}
      ${r.description || list(r.tags).length ? `<details data-syn-disclosure="${h.e(r.id)}"><summary>Read experience <span aria-hidden="true">+</span></summary>
      ${r.description ? `<p>${h.e(r.description)}</p>` : ''}${tags(r.tags,h)}</details>` : ''}${r.url || r.profileUrl ? `<div class="syn-record-actions">${r.url ? h.link(r.url,'Open experience link ↗') : ''}${r.profileUrl ? h.link(r.profileUrl,'Open related profile ↗') : ''}</div>` : ''}</div></article>`).join('')}</div>`,
    heading('experience', 'Professional history', 'Experience', 'Roles, organizations and the work behind them.'));
  }
  function publications(vm, h) {
    const rows = list(vm.publications);
    return markup('publications', `<ol class="syn-bibliography">${rows.map((p, i) => {
      const citation = p.citation || [list(p.authors).join(', '), p.title, p.venue, p.year].filter(Boolean).join('. ');
      const details = p.notes || citation || list(p.supervisors).length || list(p.bibliography).length;
      return `<li><article class="record-paper syn-paper" data-record-id="${h.e(p.id)}"><span class="syn-index">${number(i)}</span><div>
        ${metadata([p.kind,p.status,p.year,p.venue,p.publisher,p.isbn && 'ISBN ' + p.isbn],h)}<h3>${h.e(p.title)}</h3>
        ${list(p.authors).length ? `<p class="syn-authors">${h.e(p.authors.join(' · '))}</p>` : ''}
        ${details ? `<details class="syn-paper-details" data-syn-disclosure="${h.e(p.id)}"${i === 0 && p.notes ? ' open' : ''}><summary>Notes and citation <span aria-hidden="true">+</span></summary>
          ${p.notes ? `<p>${h.e(p.notes)}</p>` : ''}
          ${list(p.supervisors).length ? `<p><strong>Supervisors:</strong> ${h.e(p.supervisors.join(' · '))}</p>` : ''}
          ${list(p.bibliography).length ? `<dl class="syn-bib-fields">${p.bibliography.map(item => `<dt>${h.e(item.label)}</dt><dd>${h.e(item.value)}</dd>`).join('')}</dl>` : ''}
          ${citation ? `<p class="record-citation">${h.e(citation)}</p>` : ''}
        </details>` : ''}
        <div class="syn-record-actions">${p.url ? h.link(p.url, 'Open publication ↗') : ''}${p.doi ? h.link(`https://doi.org/${encodeURIComponent(p.doi).replace(/%2F/gi,'/')}`, `DOI ${p.doi} ↗`) : ''}
        ${citation ? `<button type="button" class="syn-link-button" data-copy-citation="${h.e(p.id)}">Copy citation</button>` : ''}</div>
      </div></article></li>`;
    }).join('')}</ol>`, heading('publications', 'Research & writing', 'Bibliography', 'Publications and research records, with their original status and citation details.'));
  }

  function education(vm, h) {
    return markup('education', `<ol class="syn-education-list">${list(vm.education).map((r, i) => `<li class="syn-education-row"><div class="syn-edu-time"><span class="syn-index">${number(i)}</span>${metadata([r.start, r.end],h)}</div>
      <div><h3>${h.e(r.institution)}</h3>${metadata([r.location],h)}${r.degree || r.field ? `<p>${[r.degree,r.field].filter(Boolean).map(h.e).join(' / ')}</p>` : ''}
      ${exists(r.gpa) ? `<p>GPA <b>${h.e(r.gpa)}</b></p>` : ''}
      ${r.description ? `<details data-syn-disclosure="${h.e(r.id)}"><summary>Read study details <span aria-hidden="true">+</span></summary><p>${h.e(r.description)}</p></details>` : ''}
      ${tags(r.tags,h)}</div>
      ${r.logoUrl ? `<img src="${h.e(r.logoUrl)}" alt="" loading="lazy" decoding="async" referrerpolicy="no-referrer">` : ''}</li>`).join('')}</ol>`,
      heading('education', 'Academic path', 'Education', 'Institutions, degrees and fields of study.'));
  }

  function skills(vm, h) {
    return markup('skills', `<div class="syn-skills-grid"><div class="syn-skills-chart">${w.PortfolioInsights?.renderSkills(vm, h) || ''}</div>
      <div><div class="syn-search syn-skill-search"><label>Find a skill<input type="search" data-skill-search placeholder="Search all skills"></label></div>
      <div class="syn-skill-atlas">${list(vm.skillGroups).map((g,i) => `<details class="record-skill-group syn-skill-domain" data-syn-disclosure="${h.e(g.id)}"${i === 0 ? ' open' : ''}>
        <summary><span><small>${number(i)}</small> ${h.e(g.name)}</span><span aria-hidden="true">+</span></summary>
        <div>${list(g.groups).map(s => `<div class="record-skill-sub syn-skill-sub"><h3>${h.e(s.name)}</h3>
          <ul>${list(s.items).map(x => `<li data-skill-item="${h.e(x.id)}"><span>${h.e(x.name || x.shortName)}${x.name && x.shortName && x.shortName !== x.name ? ` <small>(${h.e(x.shortName)})</small>` : ''}</span>
          ${list(x.tags).length ? `<details data-syn-disclosure="${h.e(x.id)}"><summary>Source topics <span aria-hidden="true">+</span></summary>${tags(x.tags,h)}</details>` : ''}</li>`).join('')}</ul>
        </div>`).join('')}</div></details>`).join('')}</div></div></div>`, heading('skills', 'Capability atlas', 'Skills & methods', 'Browse methods by area, or find a specific tool.'));
  }

  function certificates(vm, h) {
    const rows = list(vm.certificates), issuers = [...new Set(rows.map(r => r.issuer).filter(Boolean))];
    const credentialState = value => value === true ? 'Certificate recorded' : value === false ? 'No certificate recorded' : exists(value) ? value : 'Certificate status not supplied';
    return markup('certificates', `<div class="syn-search"><label>Search credentials<input type="search" data-cert-search placeholder="Search courses and credentials"></label>
      <label>Issuer<select data-cert-issuer><option value="">All issuers</option>${issuers.map(x => `<option value="${h.e(x)}">${h.e(x)}</option>`).join('')}</select></label></div>
      <div class="syn-credential-list">${rows.map((r,i) => `<article class="syn-credential" data-cert-card data-cert-id="${h.e(r.id)}">
      ${w.PortfolioPreviews?.renderCertificate(r,i,h) || ''}<div><span class="syn-index">${number(i)}</span><h3>${h.e(r.title)}</h3>
      ${metadata([r.issuer,r.date,r.duration,credentialState(r.hasCertificate)],h)}${tags(r.tags,h)}
      <div class="syn-record-actions">${w.PortfolioPreviews?.renderDocumentAction(r,h) || ''}${r.url ? h.link(r.url, 'Open credential link ↗') : ''}</div></div></article>`).join('')}</div>
      <p class="syn-empty" data-cert-empty hidden>No credentials match this search.</p><button type="button" class="syn-more" data-cert-more hidden>Show more credentials</button>`,
      heading('certificates', 'Courses & workshops', 'Credentials', 'Training records and available source documents.'));
  }

  function languages(vm, h) {
    return markup('languages', `<div class="syn-language-list">${list(vm.languages).map((r,i) => `<article class="syn-language">
      <span class="syn-index">${number(i)}</span><div><h3>${h.e(r.name)}</h3>${metadata([r.level, r.cefr && 'CEFR ' + r.cefr, r.status],h)}
      ${list(r.tests).some(t => t.name || t.issuer || t.date || t.url || list(t.scores).length) ? `<details data-syn-disclosure="${h.e(r.id)}"><summary>Test details <span aria-hidden="true">+</span></summary>
      ${r.tests.filter(t => t.name || t.issuer || t.date || t.url || list(t.scores).length).map(t => `<div class="syn-test">
        ${t.name ? `<h4>${h.e(t.name)}</h4>` : ''}${metadata([t.issuer,t.date],h)}
        ${list(t.scores).length ? `<dl>${t.scores.map(s => `<dt>${h.e(s.label)}</dt><dd>${h.e(s.value)}${exists(s.max) ? ' / ' + h.e(s.max) : ''}</dd>`).join('')}</dl>` : ''}
        ${t.url ? h.link(t.url, 'View test result ↗') : ''}
      </div>`).join('')}</details>` : ''}</div></article>`).join('')}</div>`, heading('languages', 'Communication', 'Languages'));
  }

  function references(vm, h) {
    return markup('references', `<div class="syn-reference-list">${list(vm.references).map(r => `<details data-syn-disclosure="${h.e(r.id)}"><summary>
      <span><strong>${h.e(r.name)}</strong>${metadata([r.title,r.department,r.organization,r.location],h)}</span><span aria-hidden="true">+</span></summary>
      <div class="syn-record-actions">${r.email ? h.link('mailto:' + r.email,r.email) : ''}
      ${(list(r.phones).length ? r.phones : [r.phone].filter(Boolean)).map(p => h.link('tel:' + p,p)).join('')}
      ${r.url ? h.link(r.url, 'Reference profile ↗') : ''}</div></details>`).join('')}</div>`,
      heading('references', 'People', 'References', 'Open a reference to view their contact details.'));
  }

  function contact(vm, h) {
    const { email, phone } = vm.contact || {};
    return markup('contact', `<div class="syn-contact-inner"><div><p class="syn-kicker">Correspondence</p><h2 id="syn-title-contact">Get in touch.</h2>
      ${vm.identity.name ? `<p>${h.e(vm.identity.name)}</p>` : ''}</div>
      <div class="syn-contact-links">${email ? h.link('mailto:' + email,email) : ''}${phone ? h.link('tel:' + phone,phone) : ''}
      ${list(vm.profiles).length ? `<nav aria-label="External profiles">${vm.profiles.map(p => {
        const label = [p.network, p.label && p.label !== p.network ? p.label : ''].filter(Boolean).join(' / ');
        return p.url ? h.link(p.url, label || 'Profile') : label ? `<span>${h.e(label)}</span>` : '';
      }).join('')}</nav>` : ''}</div></div>`);
  }

  const renderers = { about, projects, experience, publications, education, skills, certificates, languages, references, contact };
  const empty = key => markup(key, '<p class="syn-empty">No records supplied in the portfolio.</p>', heading(key, 'Portfolio records', sections[key]));
  function render(root, vm, h) {
    const initial = latestModel !== w.portfolioView?.model || !root.querySelector('.syn-persistent');
    const records = order.slice(1).map(key => {
      const field = key === 'skills' ? 'skillGroups' : key;
      return Array.isArray(vm[field]) && !vm[field].length ? empty(key) : renderers[key](vm,h);
    }).join('');
    if (initial) {
      unmount();
      root.innerHTML = hero(vm,h) + records;
      latestModel = w.portfolioView?.model;
    } else {
      const next = doc.createElement('template');
      next.innerHTML = records;
      Array.from(next.content.children).forEach(section => {
        const prior = doc.getElementById(section.id);
        // Keep section anchors and the SVG object stable across perspective changes.
        if (prior) prior.replaceChildren(...section.childNodes);
      });
    }
  }

  function mount(root, { animate = false } = {}) {
    const m = modes[mode];
    const toolbar = doc.getElementById('synthesisToolbar');
    toolbar.hidden = false;
    doc.body.dataset.perspective = mode;
    toolbar.querySelectorAll('[data-perspective]').forEach(button => button.setAttribute('aria-pressed', String(button.dataset.perspective === mode)));
    const context = toolbar.querySelector('[data-syn-context]');
    if (context.textContent !== m.subtitle) context.textContent = m.subtitle;
    const status = toolbar.querySelector('[data-syn-mode-status]');
    if (modeStatus !== mode) status.textContent = `${m.title}. All portfolio records are still available.`;
    modeStatus = mode;
    const primary = root.querySelector('[data-syn-primary]');
    const cta = m.primary[0] === 'publications' && !list(latestModel?.publications).length ? modes.all.primary : m.primary;
    primary.href = '#' + cta[0];
    primary.firstChild.textContent = cta[1] + ' ';
    root.querySelector('[data-syn-plate-title]').textContent = m.plate;
    root.querySelectorAll('.syn-annotation span').forEach((label,i) => { label.textContent = m.labels[i]; });
    const chapters = root.querySelector('[data-syn-chapters]');
    chapters.innerHTML = m.nav.map(key => `<a href="#${key}"><small aria-hidden="true">${number(order.indexOf(key) - 1)}</small>${sections[key]}</a>`).join('') + '<button type="button" class="syn-index-open" data-syn-open-index aria-haspopup="dialog">All sections <span aria-hidden="true">↗</span></button>';
    if (animate && doc.body.dataset.effects === 'on') {
      root.querySelector('.syn-plate-caption').getAnimations?.().forEach(animation => animation.cancel());
      root.querySelector('.syn-plate-caption').animate?.([{opacity: .45}, {opacity: 1}], {duration: 180, easing: 'cubic-bezier(.23,1,.32,1)'});
    }
    const nextScene = root.querySelector('[data-synthesis-scene]');
    if (nextScene !== sceneElement) {
      scene?.destroy();
      sceneElement = nextScene;
      scene = w.PortfolioSynthesisScene?.mount(sceneElement,mode);
    } else scene?.setMode(mode, { animate });
    studyObserver?.disconnect();
    const study = root.querySelector('[data-syn-reveal]');
    if (study && w.IntersectionObserver && doc.body.dataset.effects === 'on') {
      studyObserver = new w.IntersectionObserver(entries => {
        if (entries.some(entry => entry.isIntersecting)) {
          study.dataset.synArrived = '';
          studyObserver.disconnect();
        }
      }, { threshold: .24 });
      studyObserver.observe(study);
    }
  }

  function unmount() {
    scene?.destroy(); scene = null; sceneElement = null;
    studyObserver?.disconnect(); studyObserver = null;
    latestModel = null; modeStatus = null;
    doc.getElementById('synthesisToolbar').hidden = true;
    delete doc.body.dataset.perspective;
  }
  function changeMode(next, { animate = false, history = true, anchor = null } = {}) {
    if (!active() || !Object.hasOwn(modes,next) || !w.portfolioView?.model || next === mode) return;
    mode = next;
    if (history) {
      try {
        const url = new URL(w.location.href);
        url.searchParams.set('perspective', mode);
        (w.history?.pushState || w.history?.replaceState)?.call(w.history, w.history.state,'',url);
      } catch {}
    }
    w.portfolioView.render({ perspectiveSwitch: true, animate, anchor });
  }
  doc.addEventListener('pointerdown', event => {
    modeInput = event.target.closest('button[data-perspective]');
    pointerAnchor = modeInput ? w.portfolioView?.readSynthesisAnchor() : null;
  }, { capture: true, passive: true });
  doc.addEventListener('keydown', () => { modeInput = null; pointerAnchor = null; }, true);
  doc.addEventListener('click', event => {
    const button = event.target.closest('button[data-perspective]');
    if (!button) return;
    const animate = event.detail > 0 || modeInput === button;
    const anchor = modeInput === button ? pointerAnchor : null;
    modeInput = null; pointerAnchor = null;
    changeMode(button.dataset.perspective, { animate, anchor });
  });
  w.addEventListener?.('popstate', () => changeMode(readMode(), { history: false }));
  w.PortfolioSynthesis = { id, order, sections, active, project, projectVisual, render, mount, unmount, changeMode,
    nav: () => modes[mode].nav, sync: () => scene?.sync() };
})(window, document);
