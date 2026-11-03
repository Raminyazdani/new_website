(function (w) {
  'use strict';
  const d = w.PortfolioDirectionKit;
  if (!d) throw new Error('PortfolioDirectionKit must load before independent directions');
  const list = d.list;
  const idx = i => String(i + 1).padStart(2, '0');
  const recordIds = ['publications', 'education', 'skills', 'certificates', 'languages', 'references', 'contact'];
  const labels = [['about', 'Profile'], ['projects', 'Projects'], ['experience', 'Experience'], ['publications', 'Publications'], ['education', 'Education'], ['skills', 'Skills'], ['certificates', 'Certificates'], ['languages', 'Languages'], ['references', 'References'], ['contact', 'Contact']];
  const roles = (vm, h) => d.tags(list(vm.identity?.roles), h);
  const shortProfile = (vm, h) => vm.identity?.summary ? `<p class="di-intro-text">${h.e(d.excerpt(vm.identity.summary, 235))}</p><a class="di-read-profile" href="#about">Full profile ↓</a>` : '';
  const interests = (vm, h) => list(vm.interests).map((r, i) => `<details class="di-interest"><summary><span>${idx(i)}</span>${h.e(r.title)}</summary>${r.description ? `<p>${h.e(r.description)}</p>` : ''}</details>`).join('');
  const location = (vm, h) => vm.identity?.location ? `<span class="di-location">${h.e(vm.identity.location)}</span>` : '';
  const tail = () => '<p data-project-empty hidden>No projects match this search.</p><button type="button" class="pf-button di-more" data-project-more hidden>Show more projects ↓</button>';
  const counters = vm => [['projects', list(vm.projects).length], ['experience', list(vm.experience).length], ['publications', list(vm.publications).length], ['education', list(vm.education).length]];
  const records = flavor => Object.fromEntries(recordIds.map(id => [id, (vm, h) => d.records(id, vm, h, flavor)]));
  const nav = (h, cls, numbered = false) => `<nav class="${cls}" aria-label="Portfolio sections">${labels.map(([id, label], i) => `<a href="#${id}">${numbered ? `<span aria-hidden="true">${idx(i)}</span>` : ''}${h.e(label)}</a>`).join('')}</nav>`;
  const journeyText = (r, h) => `${r.description ? `<p>${h.e(r.description)}</p>` : ''}${d.tags(list(r.tags), h)}`;

  w.PortfolioDesigns.register({
    id: 'workbench', name: 'Workbench', family: 'Independent', collection: 'independent',
    description: 'An actual navigable portfolio workspace: explorer, profile editor, output and project files.',
    palette: ['#181d25', '#7cddd4', '#eef1f7'], defaultTheme: 'dark', recordStyle: 'unified',
    signature: 'Explorer / document tabs / portrait inspector / changelog',
    fingerprint: { composition: 'Three-zone editor workspace with explorer and inspector', type: 'Mono navigation, grotesk document', material: 'Charcoal editor chrome and flat inset panes', project: 'File header, preview, content split', experience: 'Changelog entries with period rail', navigation: 'Explorer anchors and document tabs', motion: 'Focused tab underline and immediate disclosure' },
    renderers: {
      hero(vm, h) {
        return d.section('hero', 'Portfolio workspace', `<div class="wb-window"><div class="wb-titlebar"><span class="wb-window-mark" aria-hidden="true">▧</span><span>Portfolio workspace</span>${location(vm, h)}</div><div class="wb-workspace"><aside class="wb-explorer"><p class="wb-label">EXPLORER</p>${nav(h, 'wb-tree')}<p class="wb-explorer-note">Open a section<br>to explore the record.</p></aside><div class="wb-document"><nav class="wb-tabs" aria-label="Workspace documents"><a href="#hero" aria-current="page">profile.md</a><a href="#projects">projects/</a><a href="#experience">changelog</a></nav><div class="wb-document-body"><p class="wb-label"># PROFILE</p>${d.name(vm, h, 'wb-name')}${roles(vm, h)}${shortProfile(vm, h)}${d.actions(h)}</div><div class="wb-output"><span class="wb-label">COLLECTIONS</span>${counters(vm).map(([key, n]) => `<a href="#${key}"><b>${h.number(n)}</b> ${h.e(key)}</a>`).join('')}</div></div><aside class="wb-inspector"><div class="wb-inspector-bar">PROFILE IMAGE</div>${d.portrait(vm, h, 'wb-portrait')}<div class="wb-inspector-caption">${h.e(vm.identity?.name)}${location(vm, h)}</div><a href="#contact">Contact routes ↗</a></aside></div><div class="wb-status"><span>Portfolio / CV record</span><span>Explore · read · connect</span></div></div>`, 'di-system wb-hero');
      },
      about(vm, h) {
        return d.section('about', 'Profile document', `<div class="wb-profile"><div class="wb-profile-gutter" aria-hidden="true">#<br>##<br>—</div><div class="wb-prose"><p class="wb-label">about.md</p>${d.profile(vm, h)}${roles(vm, h)}<div class="wb-interest-files">${interests(vm, h)}</div></div><aside class="wb-outline"><p class="wb-label">DOCUMENT OUTLINE</p><a href="#about">Biography</a><a href="#skills">Tools & methods</a><a href="#education">Education</a><a href="#contact">Contact</a></aside></div>`, 'di-system wb-about');
      },
      projects(vm, h) {
        return d.section('projects', 'Project files', `${d.projectTools(vm, h)}<div class="wb-project-files">${list(vm.projects).map((p, i) => `<article class="wb-file" data-project-card data-project-id="${h.e(p.id)}"><div class="wb-file-tab"><span aria-hidden="true">▤</span><span>${h.e(p.title)}</span><span class="wb-label">${idx(i)}</span></div><div class="wb-file-content"><div class="wb-file-preview">${d.preview(p, i, h)}</div><div class="wb-file-prose"><h3>${h.e(p.title)}</h3>${p.description ? `<p>${h.e(d.excerpt(p.description, 280))}</p>` : ''}${d.tags(p.tags, h)}<div class="wb-file-actions">${d.projectAction(p, h)}</div></div></div></article>`).join('')}</div>${tail()}`, 'di-system wb-projects');
      },
      experience(vm, h) {
        return d.section('experience', 'Changelog', `<div class="wb-changelog"><div class="wb-log-header"><span>PERIOD</span><span>ROLE / ORGANIZATION</span></div>${list(vm.experience).map((r, i) => `<article class="wb-change" data-journey-record="${h.e(r.id)}"><div class="wb-change-period"><span class="wb-commit-dot" aria-hidden="true"></span><b>${idx(i)}</b><span>${h.e(r.period)}</span></div><div class="wb-change-body"><h3>${h.e(r.title)}</h3><p class="wb-organization">${h.e(r.organization)}</p><details><summary>Read position notes <span aria-hidden="true">+</span></summary>${journeyText(r, h)}</details></div></article>`).join('')}</div>`, 'di-system wb-experience');
      }, ...records('workbench')
    }
  });

  w.PortfolioDesigns.register({
    id: 'signal', name: 'Signal', family: 'Independent', collection: 'independent',
    description: 'A Swiss typographic poster: monumental name, cobalt index and hard horizontal divisions.',
    palette: ['#f5f4ee', '#163bce', '#171b24'], defaultTheme: 'light', recordStyle: 'unified',
    signature: 'Hard poster bands / oversized index / flush typographic blocks',
    fingerprint: { composition: 'Full width name band above asymmetric photo and text columns', type: 'Large tightly tracked Space Grotesk', material: 'Uncoated white, cobalt blocks, heavy rules', project: 'Two-column numbered poster panels', experience: 'Horizontal schedule with large sequence labels', navigation: 'Numbered poster index strip', motion: 'Single short decorative guide sweep' },
    renderers: {
      hero(vm, h) {
        return d.section('hero', 'Portfolio', `<div class="sg-masthead"><span>Portfolio</span><span>Research / practice</span>${location(vm, h)}</div><div class="sg-name-band">${d.name(vm, h, 'sg-name')}<span class="sg-corner" aria-hidden="true">↘</span></div><div class="sg-hero-body"><div class="sg-index"><p>INDEX</p>${nav(h, 'sg-index-links', true)}</div><div class="sg-portrait-wrap">${d.portrait(vm, h, 'sg-portrait')}<span class="sg-photo-caption">${h.e(vm.identity?.name)}</span></div><div class="sg-hero-copy">${roles(vm, h)}${shortProfile(vm, h)}${d.actions(h)}</div></div><div class="sg-bottom-band"><span>Work / Study / Writing</span><a href="#projects">Explore the portfolio <span aria-hidden="true">↓</span></a></div>`, 'di-system sg-hero');
      },
      about(vm, h) {
        return d.section('about', 'The profile', `<div class="sg-about-spread"><p class="sg-large-label">01<span>PROFILE</span></p><div class="sg-profile-copy">${d.profile(vm, h)}${roles(vm, h)}</div><div class="sg-interests">${interests(vm, h)}</div></div>`, 'di-system sg-about');
      },
      projects(vm, h) {
        return d.section('projects', 'Work in view', `${d.projectTools(vm, h)}<div class="sg-project-grid">${list(vm.projects).map((p, i) => `<article class="sg-project" data-project-card data-project-id="${h.e(p.id)}"><div class="sg-project-top"><span>${idx(i)}</span><h3>${h.e(p.title)}</h3></div><div class="sg-project-art">${d.preview(p, i, h)}</div><div class="sg-project-bottom">${p.description ? `<p>${h.e(d.excerpt(p.description, 250))}</p>` : ''}${d.tags(p.tags, h)}<div class="sg-project-actions">${d.projectAction(p, h)}</div></div></article>`).join('')}</div>${tail()}`, 'di-system sg-projects');
      },
      experience(vm, h) {
        return d.section('experience', 'Positions & practice', `<div class="sg-schedule">${list(vm.experience).map((r, i) => `<article class="sg-position" data-journey-record="${h.e(r.id)}"><span class="sg-position-number">${idx(i)}</span><p class="sg-position-period">${h.e(r.period)}</p><div class="sg-position-main"><h3>${h.e(r.title)}</h3><p class="sg-position-org">${h.e(r.organization)}</p><details><summary>Position details ↘</summary>${journeyText(r, h)}</details></div></article>`).join('')}</div>`, 'di-system sg-experience');
      }, ...records('signal')
    }
  });

  function topicNodes(vm, h) {
    return list(vm.skillGroups).map((g, i) => `<a class="cn-topic-node" href="#skills" style="--node:${i % 4}"><span class="cn-node-dot" aria-hidden="true"></span><b>${h.e(g.name)}</b><small>${h.number(list(g.groups).reduce((n, s) => n + list(s.items).length, 0))} listed skills</small></a>`).join('');
  }
  w.PortfolioDesigns.register({
    id: 'connectome', name: 'Connectome', family: 'Independent', collection: 'independent',
    description: 'A navigable atlas of supplied portfolio categories, arranged around an actual portrait hub.',
    palette: ['#eef1e9', '#465d46', '#20332f'], defaultTheme: 'light', recordStyle: 'unified',
    signature: 'Portrait hub / category satellites / branching record paths',
    fingerprint: { composition: 'Open network map with central portrait and satellite category links', type: 'Human scale grotesk and mono atlas annotations', material: 'Pale atlas field, colored node labels, fine connectors', project: 'Numbered nodes attached to an open vertical network spine', experience: 'Branch junctions with offset role annotations', navigation: 'Actual section anchors as network nodes', motion: 'Subtle connector pulse on ornaments only' },
    renderers: {
      hero(vm, h) {
        return d.section('hero', 'Portfolio atlas', `<div class="cn-atlas-top"><span>CONNECTOME / PORTFOLIO ATLAS</span><a href="#about">How to read ↓</a></div><div class="cn-hero-map"><div class="cn-identity">${d.name(vm, h, 'cn-name')}${roles(vm, h)}${shortProfile(vm, h)}</div><div class="cn-map"><svg viewBox="0 0 800 640" class="cn-map-lines" aria-hidden="true"><g fill="none" stroke="currentColor"><path d="M400 320C190 320 140 100 95 100M400 320C620 320 620 100 705 100M400 320C140 320 120 540 95 540M400 320C620 320 640 540 705 540"/><circle cx="400" cy="320" r="210" stroke-dasharray="2 9"/><circle cx="400" cy="320" r="160"/></g></svg><div class="cn-hub">${d.portrait(vm, h, 'cn-portrait')}<span>${h.e(vm.identity?.name)}</span></div>${counters(vm).map(([key, n], i) => `<a class="cn-collection-node cn-collection-${i}" href="#${key}"><span class="cn-node-dot" aria-hidden="true"></span><b>${h.e(key)}</b><small>${h.number(n)} records</small></a>`).join('')}</div></div><div class="cn-map-legend"><span><i aria-hidden="true"></i> Navigation map of supplied collections</span><span>Connectors indicate navigation, not scientific relationships.</span>${location(vm, h)}</div>`, 'di-system cn-hero');
      },
      about(vm, h) {
        return d.section('about', 'Identity & subject areas', `<div class="cn-about-map"><div class="cn-profile-node"><span class="cn-node-marker" aria-hidden="true">◎</span>${d.profile(vm, h)}${d.actions(h)}</div><aside class="cn-topic-branch"><p class="cn-small-label">Skill categories from the CV</p>${topicNodes(vm, h)}</aside><div class="cn-interest-branch">${interests(vm, h)}</div></div>`, 'di-system cn-about');
      },
      projects(vm, h) {
        return d.section('projects', 'Project nodes', `${d.projectTools(vm, h)}<div class="cn-project-path">${list(vm.projects).map((p, i) => `<article class="cn-project-node" data-project-card data-project-id="${h.e(p.id)}"><span class="cn-project-junction" aria-hidden="true">${idx(i)}</span><div class="cn-project-text"><p class="cn-small-label">PROJECT / ${idx(i)}</p><h3>${h.e(p.title)}</h3>${p.description ? `<p>${h.e(d.excerpt(p.description, 280))}</p>` : ''}${d.tags(p.tags, h)}<div class="cn-project-actions">${d.projectAction(p, h)}</div></div><div class="cn-project-visual">${d.preview(p, i, h)}</div></article>`).join('')}</div>${tail()}`, 'di-system cn-projects');
      },
      experience(vm, h) {
        return d.section('experience', 'Branches of practice', `<div class="cn-position-tree">${list(vm.experience).map((r, i) => `<article class="cn-position-branch" data-journey-record="${h.e(r.id)}"><div class="cn-position-junction"><span aria-hidden="true">○</span><p>${h.e(r.period)}</p></div><div class="cn-position-note"><span class="cn-small-label">${idx(i)}</span><h3>${h.e(r.title)}</h3><p class="cn-organization">${h.e(r.organization)}</p><details><summary>Explore this position ↗</summary>${journeyText(r, h)}</details></div></article>`).join('')}</div>`, 'di-system cn-experience');
      }, ...records('connectome')
    }
  });

  w.PortfolioDesigns.register({
    id: 'shell', name: 'Shell', family: 'Independent', collection: 'independent',
    description: 'A text-first, single stream portfolio transcript with native disclosures and genuine links.',
    palette: ['#101713', '#a8c8a1', '#e0e8dc'], defaultTheme: 'dark', recordStyle: 'unified',
    signature: 'Plain transcript / command-like anchors / expanded text records',
    fingerprint: { composition: 'One readable text stream with a small portrait attachment', type: 'IBM Plex Mono throughout, natural text rhythm', material: 'Matte terminal paper with no window chrome', project: 'Textual native disclosure, no preview gallery', experience: 'Chronological source-order log blocks', navigation: 'Command-like anchors to real sections', motion: 'Small ornamental cursor blink, no typed content' },
    renderers: {
      hero(vm, h) {
        return d.section('hero', 'Portfolio transcript', `<div class="sh-session"><p class="sh-command"><span aria-hidden="true">$</span> read profile</p><div class="sh-identity-output"><div class="sh-text-output">${d.name(vm, h, 'sh-name')}<div class="sh-role-output">${list(vm.identity?.roles).map(r => `<p>${h.e(r)}</p>`).join('')}</div>${location(vm, h)}${shortProfile(vm, h)}</div><figure class="sh-attachment">${d.portrait(vm, h, 'sh-portrait')}<figcaption>Profile image / supplied CV</figcaption></figure></div><p class="sh-command"><span aria-hidden="true">$</span> list sections</p><nav class="sh-command-nav" aria-label="Portfolio sections">${labels.map(([id, label]) => `<a href="#${id}"><span aria-hidden="true">./</span>${h.e(id)} <span class="sh-nav-comment"># ${h.e(label)}</span></a>`).join('')}</nav><div class="sh-ready" aria-hidden="true">$ <span class="sh-cursor"></span></div></div>`, 'di-system sh-hero');
      },
      about(vm, h) {
        return d.section('about', 'profile / full text', `<div class="sh-manual"><p class="sh-command"><span aria-hidden="true">$</span> read profile --full</p>${d.profile(vm, h)}${roles(vm, h)}${list(vm.interests).length ? `<p class="sh-command"><span aria-hidden="true">$</span> list interests</p>${interests(vm, h)}` : ''}</div>`, 'di-system sh-about');
      },
      projects(vm, h) {
        return d.section('projects', 'projects / records', `<p class="sh-command"><span aria-hidden="true">$</span> find projects</p>${d.projectTools(vm, h)}<div class="sh-project-stream">${list(vm.projects).map((p, i) => `<article class="sh-project" data-project-card data-project-id="${h.e(p.id)}"><details><summary><span class="sh-record-index">[${idx(i)}]</span><span>${h.e(p.title)}</span><span class="sh-expand" aria-hidden="true">+</span></summary><div class="sh-project-output">${p.description ? `<p>${h.e(p.description)}</p>` : ''}${d.tags(p.tags, h)}<div class="sh-project-actions">${d.projectAction(p, h)}</div></div></details></article>`).join('')}</div>${tail()}`, 'di-system sh-projects');
      },
      experience(vm, h) {
        return d.section('experience', 'experience / log', `<p class="sh-command"><span aria-hidden="true">$</span> read experience --all</p><div class="sh-log">${list(vm.experience).map((r, i) => `<article class="sh-log-entry" data-journey-record="${h.e(r.id)}"><p class="sh-log-meta">[${idx(i)}] ${h.e(r.period)}</p><h3>${h.e(r.title)}</h3><p class="sh-log-org">${h.e(r.organization)}</p><details><summary>read description ↴</summary>${journeyText(r, h)}</details></article>`).join('')}</div><a class="sh-next" href="#publications">→ continue to publications</a>`, 'di-system sh-experience');
      }, ...records('shell')
    }
  });

  const draftHead = (label, detail) => `<div class="dr-sheet-title"><span>${label}</span><span>${detail}</span></div>`;
  w.PortfolioDesigns.register({
    id: 'draft', name: 'Draft', family: 'Independent', collection: 'independent',
    description: 'A measured engineering drawing: dimensioned portrait, blue drafting field and technical schedules.',
    palette: ['#14394f', '#b9e4ed', '#eef7fa'], defaultTheme: 'dark', recordStyle: 'unified',
    signature: 'Drawing border / annotation rail / dimensioned image / specification sheets',
    fingerprint: { composition: 'Framed drawing sheet with dimension rail and wide name panel', type: 'Barlow Condensed titles, IBM Plex Mono annotations', material: 'Blueprint blue, fine cream rules, small grid', project: 'Technical schedule rows with numbered preview specimen', experience: 'Specification rail with numbered sheet details', navigation: 'Drawing-sheet register and title block anchors', motion: 'Registration mark feedback and restrained guide line' },
    renderers: {
      hero(vm, h) {
        return d.section('hero', 'General arrangement', `<div class="dr-sheet">${draftHead('PORTFOLIO / GENERAL ARRANGEMENT', 'SHEET 01 · IDENTITY')}<div class="dr-hero-drawing"><div class="dr-dimension-top" aria-hidden="true"><span></span> PROFILE / OVERVIEW <span></span></div><div class="dr-identity"><span class="dr-small-label">A / IDENTITY</span>${d.name(vm, h, 'dr-name')}${roles(vm, h)}${shortProfile(vm, h)}${d.actions(h)}</div><div class="dr-image-assembly"><div class="dr-dimension-vertical" aria-hidden="true">PROFILE IMAGE</div><div class="dr-image-frame"><i class="dr-cross dr-cross-tl" aria-hidden="true"></i><i class="dr-cross dr-cross-br" aria-hidden="true"></i>${d.portrait(vm, h, 'dr-portrait')}</div><p class="dr-image-note">${h.e(vm.identity?.name)}${location(vm, h)}</p></div></div><div class="dr-title-block"><div><span>DRAWING</span><b>Profile & practice</b></div><div><span>CONTENTS</span><a href="#projects">Project schedule ↗</a></div><div><span>REGISTER</span><a href="#experience">Position schedule ↗</a></div></div></div><nav class="dr-sheet-register" aria-label="Drawing register">${labels.map(([id, label], i) => `<a href="#${id}"><span>${idx(i + 1)}</span>${h.e(label)}</a>`).join('')}</nav>`, 'di-system dr-hero');
      },
      about(vm, h) {
        return d.section('about', 'Profile specifications', `<div class="dr-profile-sheet">${draftHead('SHEET 02', 'PROFILE / NOTES')}<div class="dr-profile-grid"><div class="dr-profile-content"><span class="dr-small-label">SPECIFICATION A</span>${d.profile(vm, h)}${roles(vm, h)}</div><aside class="dr-profile-notes"><p class="dr-small-label">INTEREST ANNOTATIONS</p>${interests(vm, h)}</aside></div><p class="dr-drawing-note">Text and record labels follow the supplied CV.</p></div>`, 'di-system dr-about');
      },
      projects(vm, h) {
        return d.section('projects', 'Project schedule', `${draftHead('SCHEDULE P / PROJECTS', `${list(vm.projects).length} SOURCE RECORDS`)}${d.projectTools(vm, h)}<div class="dr-project-schedule">${list(vm.projects).map((p, i) => `<article class="dr-project-sheet" data-project-card data-project-id="${h.e(p.id)}"><div class="dr-project-id"><span>ITEM</span><b>P${idx(i)}</b></div><div class="dr-project-drawing">${d.preview(p, i, h)}</div><div class="dr-project-spec"><p class="dr-small-label">PROJECT SPECIFICATION</p><h3>${h.e(p.title)}</h3>${p.description ? `<p>${h.e(d.excerpt(p.description, 290))}</p>` : ''}${d.tags(p.tags, h)}<div class="dr-project-actions">${d.projectAction(p, h)}</div></div></article>`).join('')}</div>${tail()}`, 'di-system dr-projects');
      },
      experience(vm, h) {
        return d.section('experience', 'Position specifications', `${draftHead('SCHEDULE E / EXPERIENCE', `${list(vm.experience).length} SOURCE RECORDS`)}<div class="dr-position-schedule">${list(vm.experience).map((r, i) => `<article class="dr-position-sheet" data-journey-record="${h.e(r.id)}"><div class="dr-position-rail"><b>E${idx(i)}</b><span>${h.e(r.period)}</span></div><div class="dr-position-spec"><span class="dr-small-label">ROLE / ORGANIZATION</span><h3>${h.e(r.title)}</h3><p class="dr-position-org">${h.e(r.organization)}</p><details><summary>Expand specification <span aria-hidden="true">+</span></summary>${journeyText(r, h)}</details></div></article>`).join('')}</div>`, 'di-system dr-experience');
      }, ...records('draft')
    }
  });
})(window);

