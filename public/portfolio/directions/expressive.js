(function (w) {
  'use strict';
  const d = w.PortfolioDirectionKit;
  const ids = ['publications', 'education', 'skills', 'certificates', 'languages', 'references', 'contact'];
  const n = i => String(i + 1).padStart(2, '0');
  const roles = (vm, h) => d.tags(d.list(vm.identity?.roles), h);
  const lead = (vm, h) => vm.identity?.summary ? `<p class="ex-lead">${h.e(d.excerpt(vm.identity.summary, 230))}</p>` : '';
  const place = (vm, h) => vm.identity?.location ? `<span>${h.e(vm.identity.location)}</span>` : '';
  const tail = '<p data-project-empty hidden>No projects match your search.</p><button class="pf-button ex-more" type="button" data-project-more hidden>Show more projects ↓</button>';
  const notes = (vm, h) => d.list(vm.interests).map(r => `<details class="ex-interest"><summary>${h.e(r.title)}</summary>${r.description ? `<p>${h.e(r.description)}</p>` : ''}</details>`).join('');
  const paragraph = (r, h) => r.description ? `<p>${h.e(r.description)}</p>` : '';
  const tagset = (r, h) => d.tags(d.list(r.tags), h);
  const register = (id, name, description, palette, signature, fingerprint, renderers) => w.PortfolioDesigns.register({ id, name, description, palette, signature, fingerprint, family: 'Independent', collection: 'independent', defaultTheme: id === 'strata' || id === 'velocity' ? 'dark' : 'light', recordStyle: 'unified', renderers: { ...Object.fromEntries(ids.map(key => [key, (vm, h) => d.records(key, vm, h, id)])), ...renderers } });

  register('separation', 'Separation', 'An uneven field of vertical color lanes, carrying a source-ordered record through the page.', ['#f3eadb', '#9d422d', '#292b24'], 'Unequal vertical lanes', {
    composition: 'Three unequal vertical bands; text and portrait occupy different tracks', type: 'Fraunces and clean grotesk', material: 'Uncoated warm paper with earthy translucent bands', project: 'Offset numbered columns in a vertical band field', experience: 'Period track beside long narrative track', navigation: 'Banded underline and section anchors', motion: 'Short band expansion on focus only'
  }, {
    hero(vm, h) {
      return d.section('hero', '', `<div class="sep-hero"><div class="sep-band sep-band-one" aria-hidden="true"></div><div class="sep-band sep-band-two" aria-hidden="true"></div><div class="sep-intro"><p class="ex-eyebrow">A portfolio in connected fields</p>${d.name(vm, h, 'sep-name')}${roles(vm, h)}${lead(vm, h)}${d.actions(h)}</div><div class="sep-photo">${d.portrait(vm, h)}<p>${place(vm, h)}</p></div><a class="sep-down" href="#projects">Follow the work <span aria-hidden="true">↓</span></a></div>`, 'sep-hero-section');
    },
    about(vm, h) { return d.section('about', 'A connected practice.', `<div class="sep-profile"><div class="sep-profile-side"><span class="ex-eyebrow">Profile</span>${place(vm, h)}</div><div>${d.profile(vm, h)}${notes(vm, h)}</div></div>`); },
    projects(vm, h) {
      return d.section('projects', 'Work, in sequence.', `${d.projectTools(vm, h)}<div class="sep-project-lanes">${d.list(vm.projects).map((p, i) => `<article class="sep-project" data-project-card data-project-id="${h.e(p.id)}"><div class="sep-project-tab"><span>${n(i)}</span><span>Project</span></div><div class="sep-project-body"><h3>${h.e(p.title)}</h3><p>${h.e(d.excerpt(p.description, 240))}</p>${tagset(p, h)}${d.projectAction(p, h)}</div><div class="sep-project-art">${d.preview(p, i, h)}</div></article>`).join('')}</div>${tail}`);
    },
    experience(vm, h) {
      return d.section('experience', 'Through time.', `<div class="sep-career">${d.list(vm.experience).map((r, i) => `<article class="sep-role" data-journey-record="${h.e(r.id)}"><div class="sep-role-period"><span>${n(i)}</span><p>${h.e(r.period)}</p></div><div><h3>${h.e(r.title)}</h3><p class="ex-org">${h.e(r.organization)}</p>${paragraph(r, h)}${tagset(r, h)}</div></article>`).join('')}</div>`);
    }
  });

  register('exhibit', 'Exhibit', 'A curatorial sequence: a real portrait, spacious labels and a manually browsed horizontal exhibition.', ['#f3f2ee', '#76694e', '#21231f'], 'Portrait wall and native horizontal exhibition', {
    composition: 'Wide photographic wall over a low typographic plinth', type: 'Editorial serif titles with discreet grotesk labels', material: 'Gallery plaster, thin frames and ample floor space', project: 'Large native horizontal exhibition frames', experience: 'Numbered wall labels with contrasting compact details', navigation: 'Quiet typographic anchors and native horizontal scroll', motion: 'Frame highlight on interaction, no autoplay'
  }, {
    hero(vm, h) {
      return d.section('hero', '', `<div class="exhibit-wall"><div class="exhibit-label"><p class="ex-eyebrow">Portfolio / A personal exhibition</p>${roles(vm, h)}${place(vm, h)}</div><div class="exhibit-portrait">${d.portrait(vm, h)}</div><div class="exhibit-title">${d.name(vm, h, 'exhibit-name')}<a href="#projects" class="exhibit-enter">Enter the exhibition <span aria-hidden="true">↘</span></a></div></div>`, 'exhibit-hero-section');
    },
    about(vm, h) { return d.section('about', 'An introduction.', `<div class="exhibit-statement"><span class="exhibit-small-label">The person behind the work</span><div>${d.profile(vm, h)}</div></div><div class="exhibit-interests">${notes(vm, h)}</div>`); },
    projects(vm, h) {
      return d.section('projects', 'The exhibition.', `<p class="exhibit-scroll-note">Scroll horizontally to browse the frames. Each label opens the full project.</p>${d.projectTools(vm, h)}<div class="exhibit-gallery" role="region" aria-label="Project exhibition, scroll horizontally" tabindex="0">${d.list(vm.projects).map((p, i) => `<article class="exhibit-work" data-project-card data-project-id="${h.e(p.id)}"><div class="exhibit-frame">${d.preview(p, i, h)}</div><div class="exhibit-caption"><span class="exhibit-number">${n(i)}</span><div><h3>${h.e(p.title)}</h3><p>${h.e(d.excerpt(p.description, 190))}</p>${tagset(p, h)}${d.projectAction(p, h)}</div></div></article>`).join('')}</div>${tail}`);
    },
    experience(vm, h) {
      return d.section('experience', 'Positions & practice.', `<div class="exhibit-label-wall">${d.list(vm.experience).map((r, i) => `<article class="exhibit-position" data-journey-record="${h.e(r.id)}"><span class="exhibit-position-no">${n(i)}</span><div class="exhibit-position-title"><p>${h.e(r.period)}</p><h3>${h.e(r.title)}</h3><p class="ex-org">${h.e(r.organization)}</p></div><details><summary>Read the wall label <span aria-hidden="true">＋</span></summary>${paragraph(r, h)}${tagset(r, h)}</details></article>`).join('')}</div>`);
    }
  });

  register('letter', 'Letter', 'A personal professional letter, unfolding in one intimate reading column with case notes and dated entries.', ['#f8f0e5', '#793b4b', '#352a29'], 'A single continuous letter', {
    composition: 'Narrow centered correspondence with a small portrait and typographic signature', type: 'Literary Fraunces body and Georgia signature', material: 'Warm stationery and burgundy ink', project: 'Sequential written case notes with margin numbers', experience: 'Dated personal entries separated by rules', navigation: 'Inline table of contents and text links', motion: 'Minimal link feedback only'
  }, {
    hero(vm, h) {
      return d.section('hero', '', `<div class="letter-sheet"><div class="letter-address"><div><p class="ex-eyebrow">A letter of introduction</p>${place(vm, h)}<nav aria-label="Letter contents"><a href="#about">Introduction</a><a href="#projects">Work</a><a href="#experience">Experience</a><a href="#contact">Correspondence</a></nav></div><div class="letter-portrait">${d.portrait(vm, h)}</div></div><p class="letter-salutation">Hello,</p>${d.name(vm, h, 'letter-name')}${roles(vm, h)}${lead(vm, h)}<p class="letter-invitation">A few notes on my work, interests and experience follow below.</p><a class="letter-read" href="#about">Continue reading ↓</a></div>`, 'letter-hero-section');
    },
    about(vm, h) { return d.section('about', 'By way of introduction,', `<div class="letter-body">${d.profile(vm, h)}${notes(vm, h)}<p class="letter-signature">${h.e(vm.identity?.name)}</p></div>`); },
    projects(vm, h) {
      return d.section('projects', 'Notes on the work.', `${d.projectTools(vm, h)}<div class="letter-projects">${d.list(vm.projects).map((p, i) => `<article class="letter-case" data-project-card data-project-id="${h.e(p.id)}"><p class="letter-case-no">Case note ${n(i)}</p><h3>${h.e(p.title)}</h3><p>${h.e(d.excerpt(p.description, 420))}</p>${tagset(p, h)}${d.projectAction(p, h)}</article>`).join('')}</div>${tail}`);
    },
    experience(vm, h) {
      return d.section('experience', 'Along the way,', `<div class="letter-entries">${d.list(vm.experience).map(r => `<article class="letter-entry" data-journey-record="${h.e(r.id)}"><p class="letter-date">${h.e(r.period)}</p><h3>${h.e(r.title)}</h3><p class="ex-org">${h.e(r.organization)}</p>${paragraph(r, h)}${tagset(r, h)}</article>`).join('')}</div><a class="letter-read" href="#publications">Continue to research records ↓</a>`);
    }
  });

  register('velocity', 'Velocity', 'A kinetic poster with oblique cuts, dense condensed typography and sequential project plates.', ['#151710', '#d7ec44', '#f0f2df'], 'Oblique cuts, kinetic bands, fixed readable type', {
    composition: 'Offset condensed title crossing oblique poster bands beside a cut portrait', type: 'Barlow Condensed at poster scale with mono notation', material: 'Matte carbon and acidic chartreuse printed bands', project: 'Wide numbered plates with preview sidecars', experience: 'Oblique rail with bold role blocks', navigation: 'Hard rectangular tabs and directional links', motion: 'Brief decorative stripe glide and fast control response'
  }, {
    hero(vm, h) {
      return d.section('hero', '', `<div class="velocity-poster"><div class="velocity-stripes" aria-hidden="true"><i></i><i></i><i></i></div><div class="velocity-heading"><p class="ex-eyebrow">Work / Research / Practice</p>${d.name(vm, h, 'velocity-name')}${roles(vm, h)}</div><div class="velocity-portrait">${d.portrait(vm, h)}</div><div class="velocity-lower">${lead(vm, h)}${d.actions(h)}</div><a class="velocity-jump" href="#projects">Explore <span aria-hidden="true">↙</span></a></div>`, 'velocity-hero-section');
    },
    about(vm, h) { return d.section('about', 'In practice.', `<div class="velocity-profile"><div class="velocity-profile-mark" aria-hidden="true">↗</div><div>${d.profile(vm, h)}${notes(vm, h)}</div></div>`); },
    projects(vm, h) {
      return d.section('projects', 'The work.', `${d.projectTools(vm, h)}<div class="velocity-projects">${d.list(vm.projects).map((p, i) => `<article class="velocity-plate" data-project-card data-project-id="${h.e(p.id)}"><div class="velocity-plate-no" aria-hidden="true">${n(i)}</div><div class="velocity-plate-copy"><h3>${h.e(p.title)}</h3><p>${h.e(d.excerpt(p.description, 250))}</p>${tagset(p, h)}${d.projectAction(p, h)}</div><div class="velocity-plate-preview">${d.preview(p, i, h)}</div></article>`).join('')}</div>${tail}`);
    },
    experience(vm, h) {
      return d.section('experience', 'Forward through practice.', `<div class="velocity-rail">${d.list(vm.experience).map((r, i) => `<article class="velocity-role" data-journey-record="${h.e(r.id)}"><div class="velocity-stop"><span>${n(i)}</span><p>${h.e(r.period)}</p></div><div><h3>${h.e(r.title)}</h3><p class="ex-org">${h.e(r.organization)}</p><details><summary>Role details ↗</summary>${paragraph(r, h)}${tagset(r, h)}</details></div></article>`).join('')}</div>`);
    }
  });

  const strataArt = `<svg class="strata-panorama" viewBox="0 0 1400 600" fill="none" aria-hidden="true"><g class="strata-cell"><path d="M120 306C80 181 186 69 324 94C452 111 488 212 453 338C422 461 285 506 182 433C139 403 132 358 120 306Z"/><path d="M145 305C111 197 199 102 320 121C429 139 458 223 429 332C398 438 285 476 197 415C159 388 154 348 145 305Z"/><ellipse cx="292" cy="285" rx="67" ry="80"/><path d="M194 225q38-56 65-33m95 172q45-29 20-73m-175 62q-34 39 13 53"/></g><g class="strata-molecule"><path d="M706 122l99 57v114l-99 57-99-57V179Z M805 293l99 58 99-58V179l-99-57-99 57M706 350v112l99 57 99-57V351"/><path d="M626 192v87l80 46m117-132 79-46 79 46m-259 171v85l79 45"/></g><g class="strata-code"><path d="M1224 191l-67 73 67 73m85-145 67 72-67 73m-49-175-39 205"/></g><path class="strata-section-line" d="M0 501C380 397 586 591 913 486S1260 455 1400 510M0 544C380 440 586 634 913 529S1260 498 1400 553"/></svg>`;
  register('strata', 'Strata', 'An icy scientific panorama moving through layers of observation, molecular connection and code.', ['#102536', '#9bdde3', '#edf8f6'], 'Scientific depth panorama and continuous cell → molecule → code', {
    composition: 'Full-width title above a horizontal scientific depth landscape, slim portrait annotation and bottom editorial strip', type: 'Space Grotesk with spaced mono annotations', material: 'Icy stacked cross sections over deep blue', project: 'Alternating broad depth layers with inset specimen previews', experience: 'Chapter panels with vertical depth indicators', navigation: 'Thin sectional anchors plus existing manual and scroll story controls', motion: 'One short ornamental depth settle; existing connected narrative preserved'
  }, {
    hero(vm, h) {
      return d.section('hero', '', `<div class="strata-hero"><header class="strata-titlebar"><p class="ex-eyebrow">A portfolio across scales</p>${d.name(vm, h, 'strata-name')}</header><div class="strata-landscape"><div class="strata-planes" aria-hidden="true"><i></i><i></i><i></i><i></i></div>${strataArt}<p class="strata-caption">Illustrative cross sections<br>biology · chemistry · code</p><div class="strata-person"><div class="strata-portrait">${d.portrait(vm, h)}</div><div class="strata-person-label"><span class="ex-eyebrow">Profile</span><p>${h.e(vm.identity?.name)}</p>${place(vm, h)}</div></div></div><div class="strata-editorial-strip"><div class="strata-strip-summary">${roles(vm, h)}${lead(vm, h)}</div><div class="strata-strip-nav">${d.actions(h)}</div></div></div>`, 'strata-hero-section');
    },
    about(vm, h) { return d.section('about', 'A connected perspective.', `<div class="strata-profile"><div>${d.profile(vm, h)}</div><div>${notes(vm, h)}</div></div>${w.PortfolioStory?.render(vm, h) || ''}`); },
    projects(vm, h) {
      return d.section('projects', 'Layers of work.', `${d.projectTools(vm, h)}<div class="strata-work">${d.list(vm.projects).map((p, i) => `<article class="strata-project" data-project-card data-project-id="${h.e(p.id)}"><div class="strata-project-depth"><span>${n(i)}</span><i aria-hidden="true"></i></div><div class="strata-project-preview">${d.preview(p, i, h)}</div><div class="strata-project-copy"><h3>${h.e(p.title)}</h3><p>${h.e(d.excerpt(p.description, 290))}</p>${tagset(p, h)}${d.projectAction(p, h)}</div></article>`).join('')}</div>${tail}`);
    },
    experience(vm, h) {
      return d.section('experience', 'Chapters of practice.', `<div class="strata-chapters">${d.list(vm.experience).map((r, i) => `<article class="strata-chapter" data-journey-record="${h.e(r.id)}"><header><span class="ex-eyebrow">Chapter ${n(i)}</span><p>${h.e(r.period)}</p></header><div><h3>${h.e(r.title)}</h3><p class="ex-org">${h.e(r.organization)}</p>${paragraph(r, h)}${tagset(r, h)}</div></article>`).join('')}</div>`);
    }
  });
})(window);
