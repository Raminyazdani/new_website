(function (w) {
  'use strict';
  const d = w.PortfolioDirectionKit;
  const extra = ['publications', 'education', 'skills', 'certificates', 'languages', 'references', 'contact'];
  const seq = i => String(i + 1).padStart(2, '0');
  const roles = (vm, h, cls = '') => `<div class="ob-roles ${cls}">${d.list(vm.identity?.roles).map(r => `<span>${h.e(r)}</span>`).join('')}</div>`;
  const lead = (vm, h) => vm.identity?.summary ? `<p class="ob-lead">${h.e(d.excerpt(vm.identity.summary, 260))}</p>` : '';
  const interests = (vm, h, cls = '') => `<div class="ob-interests ${cls}">${d.list(vm.interests).map(r => `<details><summary>${h.e(r.title)}</summary>${r.description ? `<p>${h.e(r.description)}</p>` : ''}</details>`).join('')}</div>`;
  const pagination = '<p data-project-empty hidden>No projects match your search.</p><button class="pf-button ob-more" data-project-more type="button" hidden>More project records ↓</button>';
  const sourcePeriod = (r, h) => r.period ? `<span class="ob-period">${h.e(r.period)}</span>` : '';
  const roleDetails = (r, h, label) => r.description || d.list(r.tags).length ? `<details class="ob-role-detail"><summary>${label} <span aria-hidden="true">+</span></summary>${r.description ? `<p>${h.e(r.description)}</p>` : ''}${d.tags(r.tags, h)}</details>` : '';
  const reg = config => w.PortfolioDesigns.register({ family: 'Independent', collection: 'independent', recordStyle: 'unified', ...config, renderers: { ...Object.fromEntries(extra.map(id => [id, (vm, h) => d.records(id, vm, h, config.id)])), ...config.renderers } });
  const leaf = () => `<svg class="ob-leaf" viewBox="0 0 360 520" fill="none" aria-hidden="true"><path d="M93 494C144 394 157 247 245 39"/><path d="M174 301C102 297 51 238 51 143C139 159 175 222 174 301Z"/><path d="M199 232C267 237 325 178 324 82C246 97 205 160 199 232Z"/><path d="M146 391C88 389 42 348 33 276C100 274 143 320 146 391Z"/><path d="M216 173C181 158 157 104 175 40C226 70 238 117 216 173Z"/><path d="M120 431C180 436 248 399 270 325C194 323 145 368 120 431Z"/><path d="M53 147L174 301M324 84L199 232M34 278L146 391M176 41L216 173M269 326L120 431"/></svg>`;

  reg({
    id: 'folio', name: 'Folio / Research Gazette', description: 'An ivory newspaper: a broad masthead, narrow reading columns and a ruled appointments ledger.', defaultTheme: 'light', palette: ['#f1eddf', '#9b3c26', '#24231f'], signature: 'newspaper-spread',
    fingerprint: { composition: 'full-width masthead above three unequal newspaper columns', type: 'Fraunces editorial serif and narrow mono captions', material: 'ivory stock with double ink rules', project: 'three newspaper article columns with large lead article', experience: 'four-column ruled appointment ledger', navigation: 'newspaper contents column and inline folio anchors', motion: 'ink underline on interaction' },
    renderers: {
      hero(vm, h) {
        return d.section('hero', '', `<div class="ob-folio-strap"><span>PERSONAL PORTFOLIO</span>${roles(vm, h)}<span>RESEARCH · PRACTICE</span></div><div class="ob-folio-masthead">${d.name(vm, h)}</div><div class="ob-folio-front"><figure class="ob-folio-portrait">${d.portrait(vm, h)}<figcaption>Profile portrait</figcaption></figure><div class="ob-folio-editorial"><p class="ob-eyebrow">THE INTRODUCTION</p>${lead(vm, h)}${d.actions(h)}</div><nav class="ob-folio-contents" aria-label="Portfolio contents"><span class="ob-eyebrow">IN THIS PORTFOLIO</span><a href="#projects"><b>Work & methods</b><span>Projects ↗</span></a><a href="#experience"><b>Appointments</b><span>Experience ↗</span></a><a href="#publications"><b>Research records</b><span>Publications ↗</span></a><a href="#contact"><b>Correspondence</b><span>Get in touch ↗</span></a></nav></div>`, 'ob-folio-hero');
      },
      about(vm, h) {
        return d.section('about', 'Profile & perspective', `<div class="ob-folio-article"><aside><p class="ob-eyebrow">THE PERSON BEHIND THE WORK</p>${vm.identity?.location ? `<p>${h.e(vm.identity.location)}</p>` : ''}${roles(vm, h)}</aside><div class="ob-folio-prose">${d.profile(vm, h)}</div>${interests(vm, h, 'ob-folio-notes')}</div>`, 'ob-folio-section');
      },
      projects(vm, h) {
        return d.section('projects', 'Work & methods', `${d.projectTools(vm, h)}<div class="ob-folio-columns">${d.list(vm.projects).map((p, i) => `<article class="ob-folio-project" data-project-card data-project-id="${h.e(p.id)}"><header><span class="ob-eyebrow">PROJECT / ${seq(i)}</span><h3>${h.e(p.title)}</h3></header><p>${h.e(d.excerpt(p.description, i === 0 ? 360 : 220))}</p><div class="ob-folio-illustration">${d.preview(p, i, h)}</div>${d.tags(p.tags, h)}<footer>${d.projectAction(p, h)}</footer></article>`).join('')}</div>${pagination}`, 'ob-folio-section');
      },
      experience(vm, h) {
        return d.section('experience', 'Appointments & practice', `<div class="ob-folio-ledger"><div class="ob-folio-ledger-key" aria-hidden="true"><span>No.</span><span>Period</span><span>Position / organization</span><span>Record</span></div>${d.list(vm.experience).map((r, i) => `<article class="ob-folio-appointment" data-journey-record="${h.e(r.id)}"><span class="ob-eyebrow">${seq(i)}</span><div>${sourcePeriod(r, h)}</div><header><h3>${h.e(r.title)}</h3>${r.organization ? `<p>${h.e(r.organization)}</p>` : ''}</header><div>${roleDetails(r, h, 'Read appointment')}</div></article>`).join('')}</div>`, 'ob-folio-section');
      }
    }
  });

  reg({
    id: 'vitro', name: 'In Vitro / The Observation Room', description: 'An oversized optical portrait, illuminated specimen rows and quiet, dark observation stages.', defaultTheme: 'dark', palette: ['#091a18', '#b4d7ae', '#e4eee5'], signature: 'optical-stage',
    fingerprint: { composition: 'left circular lens fills the stage with copy outside the optical boundary', type: 'light Space Grotesk with calibrated mono labels', material: 'green-black optical glass with thin pale rings', project: 'long specimen rows with circular thumbnail aperture', experience: 'three observation-stage columns with numbered apertures', navigation: 'vertical instrument labels and scene edge links', motion: 'slow decorative optical focus only' },
    renderers: {
      hero(vm, h) {
        return d.section('hero', '', `<div class="ob-vitro-instrument"><div class="ob-vitro-lens"><i class="ob-vitro-reticle" aria-hidden="true"></i><figure>${d.portrait(vm, h)}<figcaption>PROFILE / IN FOCUS</figcaption></figure><span class="ob-vitro-cross ob-cross-a" aria-hidden="true">+</span><span class="ob-vitro-cross ob-cross-b" aria-hidden="true">+</span></div><div class="ob-vitro-copy"><p class="ob-eyebrow">A CLOSER LOOK</p>${d.name(vm, h)}${roles(vm, h)}${lead(vm, h)}${d.actions(h)}</div></div><nav class="ob-vitro-edge" aria-label="Observation index"><a href="#about">01 / Profile</a><a href="#projects">02 / Work</a><a href="#experience">03 / Experience</a><a href="#contact">Contact ↗</a></nav>`, 'ob-vitro-hero');
      },
      about(vm, h) {
        return d.section('about', 'The field of view', `<div class="ob-vitro-about"><div class="ob-vitro-iris" aria-hidden="true"><i></i><i></i><i></i><span>↗</span></div><div class="ob-vitro-statement">${d.profile(vm, h)}${roles(vm, h)}</div></div>${interests(vm, h, 'ob-vitro-interests')}`, 'ob-vitro-section');
      },
      projects(vm, h) {
        return d.section('projects', 'Work under observation', `${d.projectTools(vm, h)}<div class="ob-vitro-specimens">${d.list(vm.projects).map((p, i) => `<article class="ob-vitro-specimen" data-project-card data-project-id="${h.e(p.id)}"><div class="ob-vitro-specimen-index"><span>${seq(i)}</span><i aria-hidden="true"></i></div><div class="ob-vitro-aperture">${d.preview(p, i, h)}</div><div class="ob-vitro-specimen-copy"><h3>${h.e(p.title)}</h3><p>${h.e(d.excerpt(p.description, 260))}</p>${d.tags(p.tags, h)}</div><footer>${d.projectAction(p, h)}</footer></article>`).join('')}</div>${pagination}`, 'ob-vitro-section');
      },
      experience(vm, h) {
        return d.section('experience', 'Observation & practice', `<div class="ob-vitro-stages">${d.list(vm.experience).map((r, i) => `<article class="ob-vitro-stage" data-journey-record="${h.e(r.id)}"><header><span class="ob-vitro-stage-number">${seq(i)}</span>${sourcePeriod(r, h)}</header><h3>${h.e(r.title)}</h3>${r.organization ? `<p class="ob-vitro-org">${h.e(r.organization)}</p>` : ''}${roleDetails(r, h, 'Explore this role')}</article>`).join('')}</div>`, 'ob-vitro-section');
      }
    }
  });

  reg({
    id: 'herbarium', name: 'Herbarium / Field Notes', description: 'An open field notebook, a pressed-leaf drawing, pinned portrait and layered sheets of work.', defaultTheme: 'light', palette: ['#e8e6d5', '#416345', '#28392e'], signature: 'field-notebook',
    fingerprint: { composition: 'open notebook with illustration and portrait on left leaf and identity on right leaf', type: 'human Fraunces serif with field-label mono', material: 'warm paper, leaf-green ink, visible notebook binding', project: 'staggered note sheets with marginal preview strips', experience: 'alternating annotations along a botanical rail', navigation: 'notebook tabs with handwritten-feeling serif links', motion: 'small leaf light shift, paper feedback on hover' },
    renderers: {
      hero(vm, h) {
        return d.section('hero', '', `<div class="ob-herbarium-book"><div class="ob-herbarium-left"><p class="ob-eyebrow">FIELD NOTES / PERSONAL PORTFOLIO</p><div class="ob-herbarium-pressed">${leaf()}<span>Botanical form · an illustration</span></div><figure class="ob-herbarium-photo">${d.portrait(vm, h)}<figcaption>the author</figcaption></figure></div><div class="ob-herbarium-right"><span class="ob-herbarium-note">An ongoing collection</span>${d.name(vm, h)}${roles(vm, h)}${lead(vm, h)}${d.actions(h)}</div></div><nav class="ob-herbarium-tabs" aria-label="Notebook tabs"><a href="#about">Profile</a><a href="#projects">Work notes</a><a href="#experience">Practice</a><a href="#publications">Reading & research</a><a href="#contact">Write to me ↗</a></nav>`, 'ob-herbarium-hero');
      },
      about(vm, h) {
        return d.section('about', 'Notes from the field', `<div class="ob-herbarium-profile"><div class="ob-herbarium-profile-text"><p class="ob-eyebrow">BACKGROUND</p>${d.profile(vm, h)}${roles(vm, h)}</div><aside class="ob-herbarium-margin"><span class="ob-herbarium-note">Things I return to</span>${interests(vm, h)}</aside></div>`, 'ob-herbarium-section');
      },
      projects(vm, h) {
        return d.section('projects', 'Collected work notes', `${d.projectTools(vm, h)}<div class="ob-herbarium-sheets">${d.list(vm.projects).map((p, i) => `<article class="ob-herbarium-sheet" data-project-card data-project-id="${h.e(p.id)}"><header><span class="ob-eyebrow">NOTE ${seq(i)}</span><h3>${h.e(p.title)}</h3></header><div class="ob-herbarium-sheet-body"><div><p>${h.e(d.excerpt(p.description, 300))}</p>${d.tags(p.tags, h)}${d.projectAction(p, h)}</div><div class="ob-herbarium-sheet-preview">${d.preview(p, i, h)}</div></div></article>`).join('')}</div>${pagination}`, 'ob-herbarium-section');
      },
      experience(vm, h) {
        return d.section('experience', 'A path through practice', `<div class="ob-herbarium-path">${d.list(vm.experience).map((r, i) => `<article class="ob-herbarium-entry" data-journey-record="${h.e(r.id)}"><span class="ob-herbarium-marker" aria-hidden="true"></span><div class="ob-herbarium-entry-note"><span class="ob-eyebrow">ENTRY ${seq(i)}</span>${sourcePeriod(r, h)}<h3>${h.e(r.title)}</h3>${r.organization ? `<p class="ob-herbarium-org">${h.e(r.organization)}</p>` : ''}${roleDetails(r, h, 'Unfold the note')}</div></article>`).join('')}</div>`, 'ob-herbarium-section');
      }
    }
  });

  reg({
    id: 'monument', name: 'Monument / The Name in Print', description: 'An uncompromising typographic poster: monumental name, small portrait, direct work index and large dates.', defaultTheme: 'light', palette: ['#efefe9', '#cb3426', '#161613'], signature: 'type-monument',
    fingerprint: { composition: 'full-width condensed two-line name over a low portrait-and-statement baseline', type: 'Barlow Condensed display against unadorned grotesk', material: 'matte black and off-white with red registration rule', project: 'borderless huge numbered title index', experience: 'large source-period blocks in paired columns', navigation: 'uppercase explicit text links with heavy active rule', motion: 'short line extension on interaction' },
    renderers: {
      hero(vm, h) {
        return d.section('hero', '', `<div class="ob-monument-top"><span>PERSONAL PORTFOLIO</span><a href="#contact">GET IN TOUCH ↗</a></div><div class="ob-monument-name">${d.name(vm, h)}</div><div class="ob-monument-role">${roles(vm, h)}</div><div class="ob-monument-baseline"><figure>${d.portrait(vm, h)}<figcaption>PROFILE</figcaption></figure><div class="ob-monument-intro">${lead(vm, h)}${d.actions(h)}</div></div><nav class="ob-monument-index" aria-label="Portfolio index"><a href="#projects">01—WORK</a><a href="#experience">02—PRACTICE</a><a href="#publications">03—RESEARCH</a><a href="#about">04—PROFILE</a></nav>`, 'ob-monument-hero');
      },
      about(vm, h) {
        return d.section('about', 'A working profile.', `<div class="ob-monument-profile"><span class="ob-monument-mark" aria-hidden="true">↗</span><div>${d.profile(vm, h)}<div class="ob-monument-footnotes">${roles(vm, h)}${interests(vm, h)}</div></div></div>`, 'ob-monument-section');
      },
      projects(vm, h) {
        return d.section('projects', 'The work.', `${d.projectTools(vm, h)}<div class="ob-monument-work">${d.list(vm.projects).map((p, i) => `<article class="ob-monument-project" data-project-card data-project-id="${h.e(p.id)}"><span class="ob-monument-project-number">${seq(i)}</span><div class="ob-monument-project-main"><h3><button type="button" data-open-project="${h.e(p.id)}"><span class="ob-monument-project-title">${h.e(p.title)}</span><span class="ob-monument-project-arrow" aria-hidden="true">↗</span></button></h3><div class="ob-monument-project-info"><div class="ob-monument-project-description"><p>${h.e(d.excerpt(p.description, 220))}</p>${d.tags(p.tags, h)}${d.projectAction(p, h)}</div><div class="ob-monument-proof">${d.preview(p, i, h)}</div></div></div></article>`).join('')}</div>${pagination}`, 'ob-monument-section');
      },
      experience(vm, h) {
        return d.section('experience', 'Time in practice.', `<div class="ob-monument-career">${d.list(vm.experience).map((r, i) => `<article class="ob-monument-position" data-journey-record="${h.e(r.id)}"><div class="ob-monument-date">${sourcePeriod(r, h)}<span class="ob-eyebrow">POSITION ${seq(i)}</span></div><h3>${h.e(r.title)}</h3>${r.organization ? `<p class="ob-monument-org">${h.e(r.organization)}</p>` : ''}${roleDetails(r, h, 'ROLE DETAILS')}</article>`).join('')}</div>`, 'ob-monument-section');
      }
    }
  });

  reg({
    id: 'assay', name: 'Assay / The Working Bench', description: 'A precise sample bench with a cuvette portrait, specification cells, project trays and protocol rows.', defaultTheme: 'light', palette: ['#eeede7', '#bb501d', '#273239'], signature: 'sample-bench',
    fingerprint: { composition: 'horizontal identity label above a three-compartment bench and four sample navigation wells', type: 'IBM Plex Mono labels and Space Grotesk reading text', material: 'milky instrument enamel, inset wells and burnt orange indicators', project: 'three-column square tray compartments with circular well inset', experience: 'one-column numbered protocol rows and native disclosure', navigation: 'indexed sample wells linking to real sections', motion: 'orange selection edge and immediate disclosure feedback' },
    renderers: {
      hero(vm, h) {
        return d.section('hero', '', `<div class="ob-assay-label"><p class="ob-eyebrow">PERSONAL PORTFOLIO / IDENTITY</p>${d.name(vm, h)}<span class="ob-assay-indicator" aria-hidden="true"></span></div><div class="ob-assay-bench"><figure class="ob-assay-cuvette">${d.portrait(vm, h)}<figcaption>PROFILE PORTRAIT</figcaption></figure><div class="ob-assay-specification"><span class="ob-eyebrow">PROFILE SPECIFICATION</span><dl><dt>Practice</dt><dd>${roles(vm, h)}</dd>${vm.identity?.location ? `<dt>Location</dt><dd>${h.e(vm.identity.location)}</dd>` : ''}</dl></div><div class="ob-assay-statement"><span class="ob-eyebrow">INTRODUCTION</span>${lead(vm, h)}${d.actions(h)}</div></div><nav class="ob-assay-wells" aria-label="Bench index">${[['projects', 'Work'], ['experience', 'Experience'], ['publications', 'Publications'], ['contact', 'Contact']].map(([id, title], i) => `<a href="#${id}"><span>${seq(i)}</span><i aria-hidden="true"></i><b>${title} ↗</b></a>`).join('')}</nav>`, 'ob-assay-hero');
      },
      about(vm, h) {
        return d.section('about', 'Profile specification', `<div class="ob-assay-profile"><div class="ob-assay-profile-key"><span class="ob-eyebrow">PROFILE / BACKGROUND</span>${roles(vm, h)}</div><div class="ob-assay-profile-copy">${d.profile(vm, h)}</div><div class="ob-assay-profile-notes"><span class="ob-eyebrow">INTERESTS</span>${interests(vm, h)}</div></div>`, 'ob-assay-section');
      },
      projects(vm, h) {
        return d.section('projects', 'Project tray', `${d.projectTools(vm, h)}<div class="ob-assay-tray">${d.list(vm.projects).map((p, i) => `<article class="ob-assay-sample" data-project-card data-project-id="${h.e(p.id)}"><header><span class="ob-eyebrow">PROJECT ${seq(i)}</span><span class="ob-assay-sample-mark" aria-hidden="true">↗</span></header><div class="ob-assay-sample-well">${d.preview(p, i, h)}</div><h3>${h.e(p.title)}</h3><p>${h.e(d.excerpt(p.description, 200))}</p>${d.tags(p.tags, h)}<footer>${d.projectAction(p, h)}</footer></article>`).join('')}</div>${pagination}`, 'ob-assay-section');
      },
      experience(vm, h) {
        return d.section('experience', 'Practice protocol', `<div class="ob-assay-protocol"><div class="ob-assay-protocol-label" aria-hidden="true"><span>INDEX</span><span>POSITION / ORGANIZATION</span><span>SOURCE PERIOD</span></div>${d.list(vm.experience).map((r, i) => `<article class="ob-assay-step" data-journey-record="${h.e(r.id)}"><div class="ob-assay-step-index"><b>${seq(i)}</b><i aria-hidden="true"></i></div><div class="ob-assay-step-main"><h3>${h.e(r.title)}</h3>${r.organization ? `<p>${h.e(r.organization)}</p>` : ''}${roleDetails(r, h, 'Open role record')}</div><div class="ob-assay-step-period">${sourcePeriod(r, h)}</div></article>`).join('')}</div>`, 'ob-assay-section');
      }
    }
  });
})(window);
