(function (w) {
  'use strict';
  const list = value => Array.isArray(value) ? value : [];
  const number = value => String(value).padStart(2, '0');
  const hero = (inner, cls) => `<section id="hero" data-section="hero" aria-labelledby="design-hero-title" class="pf-section design-page design-section de-hero ${cls}"><div class="pf-wrap">${inner}</div></section>`;
  const label = (title, subtitle = '') => `<div class="de-label"><span>${title}</span>${subtitle ? `<span>${subtitle}</span>` : ''}</div>`;
  const total = (vm, name) => list(vm[name]).length;
  const countNote = (vm, h) => `<span>${h.e(total(vm, 'projects'))} project records</span><span>${h.e(total(vm, 'experience'))} experience records</span>`;
  const plate = (vm, h) => {
    const groups = list(vm.skillGroups);
    return `<figure class="de-well-figure"><div class="de-well-plate">${groups.map((group, index) => {
      const count = list(group.groups).reduce((sum, sub) => sum + list(sub.items).length, 0);
      return `<div class="de-well"><span class="de-well-coordinate">${number(index + 1)}</span><span class="de-well-liquid" aria-hidden="true"></span><b>${h.e(count)}</b><span>${h.e(group.name)}</span></div>`;
    }).join('')}</div><figcaption>Skill entries by source category · counts describe this portfolio, not proficiency.</figcaption></figure>`;
  };
  const helixArt = () => `<svg class="de-dna" viewBox="0 0 320 500" fill="none" aria-hidden="true"><path class="de-dna-strand" d="M80 0C310 80 10 170 240 250S10 420 240 500"/><path class="de-dna-strand de-dna-second" d="M240 0C10 80 310 170 80 250S310 420 80 500"/>${Array.from({ length: 19 }, (_, index) => { const y = 12 + index * 26; const half = Math.cos(y / 500 * Math.PI * 4) * 78; return `<path class="de-dna-rung" d="M${160 - half} ${y}H${160 + half}"/>`; }).join('')}</svg>`;

  w.PortfolioDesigns.register({
    id: 'journal', name: 'Research Journal', description: 'An article-like portfolio with margin notes, numbered figures and a career ledger.', family: 'Editorial', defaultTheme: 'light', recordStyle: 'journal', signature: 'article',
    renderers: {
      hero(vm, h, k) {
        return hero(`${label('RESEARCH / CODE / PRACTICE', 'A personal portfolio')}<div class="de-journal-title"><div class="de-journal-issue"><span>PROFILE</span><b>I.</b><a href="#projects">Browse the work ↓</a></div><div class="de-journal-copy">${k.identity(vm, h)}${k.roles(vm, h)}${k.lead(vm, h)}${k.actions()}</div><figure class="de-journal-photo">${k.portrait(vm, h)}<figcaption>Fig. 01 / Profile portrait</figcaption></figure></div><div class="de-journal-index"><a href="#about">01 / Introduction</a><a href="#projects">02 / Work</a><a href="#experience">03 / Positions</a><a href="#contact">Correspondence ↗</a></div>`, 'de-journal-hero');
      },
      about(vm, h, k) { return k.section('about', 'Introduction', `<div class="de-article"><aside class="de-marginal">01 / CONTEXT<br><span>Background, interests and practice.</span></aside><div>${k.about(vm, h)}</div></div>`, 'de-journal-section'); },
      projects(vm, h, k) { return k.section('projects', 'Work & methods', `<div class="de-article"><aside class="de-marginal">02 / WORK INDEX<br><span>Open a record for its full description and source links.</span><div class="de-source-count">${h.e(total(vm, 'projects'))}<small>project records</small></div></aside><div class="de-journal-work">${k.projectCollection(vm, h, 'row')}</div></div>`, 'de-journal-section'); },
      experience(vm, h, k) { return k.section('experience', 'Positions & practice', `<div class="de-article"><aside class="de-marginal">03 / CAREER LEDGER<br><span>Roles and dates as supplied in the source.</span></aside><div class="de-journal-career">${k.experienceRows(vm, h, 'ledger')}</div></div>`, 'de-journal-section'); }
    }
  });

  w.PortfolioDesigns.register({
    id: 'helix', name: 'Helix', description: 'A cinematic DNA stage, luminous project panels and a double-rail career timeline.', family: 'Scientific', defaultTheme: 'dark', recordStyle: 'helix', signature: 'helix',
    renderers: {
      hero(vm, h, k) { return hero(`<div class="de-helix-stage"><div class="de-helix-text">${label('LIFE SCIENCE × COMPUTATION')}${k.identity(vm, h)}${k.roles(vm, h)}${k.lead(vm, h)}${k.actions()}<div class="de-helix-counts">${countNote(vm, h)}</div></div><div class="de-helix-visual">${helixArt()}<div class="de-helix-portrait">${k.portrait(vm, h)}</div><span class="de-helix-annotation">STRUCTURE / CONNECTION / DISCOVERY</span></div></div>`, 'de-helix-hero'); },
      about(vm, h, k) { return k.section('about', 'The connecting thread', `<div class="de-helix-about"><figure class="de-helix-figure">${k.science('dna')}</figure><div>${k.about(vm, h)}</div></div>`, 'de-helix-section'); },
      projects(vm, h, k) { return k.section('projects', 'Research in focus', `<div class="de-helix-projects">${label('PROJECT SIGNALS', `${h.e(total(vm, 'projects'))} records`)}${k.projectCollection(vm, h, 'poster')}</div>`, 'de-helix-section'); },
      experience(vm, h, k) { return k.section('experience', 'A connected journey', `<div class="de-helix-career"><div class="de-helix-rail" aria-hidden="true"><i></i><i></i></div>${k.experienceRows(vm, h, 'timeline')}</div>`, 'de-helix-section'); }
    }
  });

  w.PortfolioDesigns.register({
    id: 'organic', name: 'Organic Lab', description: 'Soft biological forms, a source-count well plate and an open, tactile project collection.', family: 'Scientific', defaultTheme: 'light', recordStyle: 'organic', signature: 'wells',
    renderers: {
      hero(vm, h, k) { return hero(`<div class="de-organic-intro"><div>${label('A LIVING BODY OF WORK')}${k.identity(vm, h)}${k.roles(vm, h)}${k.lead(vm, h)}${k.actions()}</div><div class="de-organic-visual"><div class="de-organic-orbit" aria-hidden="true"></div><div class="de-organic-photo">${k.portrait(vm, h)}</div><span class="de-organic-tag">BIOLOGY ↔ COMPUTATION</span></div></div><div class="de-organic-foot">${k.metrics(vm, h)}</div>`, 'de-organic-hero'); },
      about(vm, h, k) { return k.section('about', 'Across the bench & the screen', `<div class="de-organic-about"><div>${k.about(vm, h)}</div>${plate(vm, h)}</div>`, 'de-organic-section'); },
      projects(vm, h, k) { return k.section('projects', 'The work collection', `<div class="de-organic-project-head"><span class="de-organic-seed" aria-hidden="true"></span><p>Explore the projects by topic, then open a record to see the details.</p></div><div class="de-organic-projects">${k.projectCollection(vm, h, 'card')}</div>`, 'de-organic-section'); },
      experience(vm, h, k) { return k.section('experience', 'Growth & practice', `<div class="de-organic-career">${k.experienceRows(vm, h, 'branch')}</div>`, 'de-organic-section'); }
    }
  });

  w.PortfolioDesigns.register({
    id: 'monograph', name: 'Monograph', description: 'Oversized typography, a portrait column and full-width plates arranged like a designed volume.', family: 'Editorial', defaultTheme: 'light', recordStyle: 'monograph', signature: 'type',
    renderers: {
      hero(vm, h, k) { return hero(`${label('A PORTFOLIO IN ELEVEN CHAPTERS', 'RESEARCH & CODE')}<div class="de-monograph-title">${k.identity(vm, h)}</div><div class="de-monograph-intro"><div class="de-monograph-chapter"><b>01</b><span>PERSON /<br>PRACTICE</span></div><div class="de-monograph-statement">${k.roles(vm, h)}${k.lead(vm, h)}${k.actions()}</div><div class="de-monograph-photo">${k.portrait(vm, h)}</div></div>`, 'de-monograph-hero'); },
      about(vm, h, k) { return k.section('about', 'A field of interests.', `<div class="de-monograph-spread"><div class="de-monograph-folio" aria-hidden="true">02</div><div>${k.about(vm, h)}</div></div>`, 'de-monograph-section'); },
      projects(vm, h, k) { return k.section('projects', 'Collected work.', `<div class="de-monograph-spread"><aside class="de-monograph-folio">03<small>${h.e(total(vm, 'projects'))} PROJECTS</small></aside><div class="de-monograph-plates">${k.projectCollection(vm, h, 'poster')}</div></div>`, 'de-monograph-section'); },
      experience(vm, h, k) { return k.section('experience', 'Work, over time.', `<div class="de-monograph-experience"><div class="de-monograph-folio" aria-hidden="true">04</div><div class="de-monograph-career">${k.experienceRows(vm, h, 'chapter')}</div></div>`, 'de-monograph-section'); }
    }
  });

  w.PortfolioDesigns.register({
    id: 'specimen', name: 'Specimen Archive', description: 'A classified contact sheet with accession-like indices, project specimens and boxed career records.', family: 'Archive', defaultTheme: 'light', recordStyle: 'specimen', signature: 'archive',
    renderers: {
      hero(vm, h, k) { return hero(`<div class="de-specimen-header">${label('PERSONAL COLLECTION', 'INDEX / PROFILE')}<div class="de-specimen-barcode" aria-hidden="true"></div></div><div class="de-specimen-profile"><div class="de-specimen-photo">${k.portrait(vm, h)}<span class="de-specimen-caption">PROFILE / 001</span></div><div class="de-specimen-copy">${label('IDENTITY')}${k.identity(vm, h)}${k.roles(vm, h)}${k.lead(vm, h)}${k.actions()}</div><aside class="de-specimen-inventory"><span>COLLECTION INDEX</span><a href="#projects"><b>${h.e(total(vm, 'projects'))}</b>Project records ↗</a><a href="#experience"><b>${h.e(total(vm, 'experience'))}</b>Experience records ↗</a><a href="#skills"><b>${h.e(total(vm, 'skillGroups'))}</b>Skill categories ↗</a></aside></div>`, 'de-specimen-hero'); },
      about(vm, h, k) { return k.section('about', 'Collection notes', `<div class="de-specimen-notes"><div class="de-specimen-stamp">PROFILE<br>NOTES</div><div>${k.about(vm, h)}</div></div>`, 'de-specimen-section'); },
      projects(vm, h, k) { return k.section('projects', 'Project specimens', `<div class="de-specimen-register">${label('CONTACT SHEET', `${h.e(total(vm, 'projects'))} project records`)}<div class="de-specimen-projects">${k.projectCollection(vm, h, 'compact')}</div></div>`, 'de-specimen-section'); },
      experience(vm, h, k) { return k.section('experience', 'Experience register', `<div class="de-specimen-career">${k.experienceRows(vm, h, 'register')}</div>`, 'de-specimen-section'); }
    }
  });
})(window);
