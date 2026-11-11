(function (w) {
  'use strict';
  const k = w.PortfolioExperiences;
  const { list, section, excerpt, chronological, classify } = k;
  const all = (root, selector) => Array.from(root.querySelectorAll(selector));
  const label = (p, h) => h.e(p.title || 'Untitled project');
  const count = (length, noun = 'project', plural = `${noun}s`) => `${length} ${length === 1 ? noun : plural}`;
  const phrase = value => String(value || '').toLowerCase().replace(/[^\p{L}\p{N}+#]+/gu, ' ').trim();
  const subject = record => [record.title, record.description, ...list(record.tags)].filter(Boolean).join(' ');
  const choose = (attr, id, isSelected, body, extra = '') => `<button type="button" ${attr}="${id}" aria-pressed="${isSelected}" ${extra}>${body}</button>`;
  const pressed = (controls, attr, value) => controls.forEach(button => button.setAttribute('aria-pressed', String(button.getAttribute(attr) === value)));
  const iconPaths = {
    arrow: '<path d="M4 12h15m-6-6 6 6-6 6"/>', external: '<path d="M6 18 18 6M8 6h10v10"/>',
    file: '<path d="M6 3h8l4 4v14H6zM14 3v5h4M9 13h6m-6 4h6"/>',
    folder: '<path d="M3 19V5h7l2 3h9v11z"/>',
    preview: '<rect x="3" y="5" width="18" height="14" rx="2"/><path d="M3 9h18M8 9v10"/>',
    inspector: '<rect x="3" y="5" width="18" height="14" rx="2"/><path d="M15 5v14m2-9h2m-2 4h2"/>',
    expand: '<path d="M4 10V4h6m4 0h6v6m0 4v6h-6m-4 0H4v-6"/>', minus: '<path d="M5 12h14"/>',
    restore: '<path d="M9 4h11v11m-16-5h10v10H4z"/>',
    ports: '<path d="M4 5h6v6H4zM14 13h6v6h-6zM7 11v5h7"/>',
    cell: '<circle cx="12" cy="12" r="9"/><circle cx="11" cy="11" r="3"/><path d="M16 13h1m-7 4h1"/>',
    molecule: '<path d="m12 2 9 5v10l-9 5-9-5V7zM3 7l9 5 9-5m-9 5v10"/>',
    grid: '<path d="M3 3h18v18H3zM9 3v18M15 3v18M3 9h18M3 15h18"/>',
    compass: '<circle cx="12" cy="12" r="9"/><path d="m16 8-2 6-6 2 2-6z"/>',
  };
  const icon = key => `<svg class="xs-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${iconPaths[key] || iconPaths.arrow}</svg>`;
  const hero = (body, cls) => `<section id="hero" data-section="hero" class="pf-section xs-hero ${cls}" aria-labelledby="xs-title"><div class="xs-wrap">${body}</div></section>`;
  const title = (vm, h) => `<h1 id="xs-title">${h.e(vm.identity?.name || 'Portfolio')}</h1>`;
  const caption = (vm, h) => list(vm.identity?.roles).length ? `<p class="xs-roles">${list(vm.identity.roles).map(h.e).join(' · ')}</p>` : '';
  const action = (id, name) => `<a class="xs-action" href="#${id}">${name}${icon('arrow')}</a>`;
  const projectOpen = (p, h) => `<button class="xs-action" type="button" data-open-project="${h.e(p.id)}">Read project${icon('external')}</button>`;
  const tags = (items, h) => list(items).length ? `<ul class="xs-tags" aria-label="Topics">${items.map(item => `<li>${h.e(item)}</li>`).join('')}</ul>` : '';
  const projectLinks = (p, h) => `${projectOpen(p, h)}${p.url ? h.link(p.url, p.urlLabel || 'Project link', 'xs-textlink') : ''}${p.repositoryUrl ? h.link(p.repositoryUrl, p.repositoryLabel || 'Repository', 'xs-textlink') : ''}`;
  const projectDetail = (p, h, { showTitle = true, limit = 0 } = {}) => p ? `${showTitle ? `<h3>${label(p, h)}</h3>` : ''}${p.description ? `<p>${h.e(limit ? excerpt(p.description, limit) : p.description)}</p>` : ''}${tags(p.tags, h)}<div class="xs-actions">${projectLinks(p, h)}</div>` : '<p>No projects match this view.</p>';
  const experienceBody = (r, h) => `<h3>${h.e(r.title)}</h3>${r.organization || r.location ? `<p class="xs-meta">${[r.organization, r.location].filter(Boolean).map(h.e).join(' · ')}</p>` : ''}${r.description ? `<p>${h.e(r.description)}</p>` : ''}${tags(r.tags, h)}${r.url || r.profileUrl ? `<div class="xs-actions">${r.url ? h.link(r.url, 'Experience link', 'xs-textlink') : ''}${r.profileUrl ? h.link(r.profileUrl, 'Related profile', 'xs-textlink') : ''}</div>` : ''}`;
  const skills = group => list(group.groups).flatMap(g => list(g.items));
  const skillName = (item, h) => `${h.e(item.name || item.shortName)}${item.name && item.shortName && item.name !== item.shortName ? ` <small>(${h.e(item.shortName)})</small>` : ''}`;
  const skillItems = (group, h) => `<ul class="xs-method-list">${list(group.items).map(item => `<li data-skill-item="${h.e(item.id)}"><span>${skillName(item, h)}</span>${tags(item.tags, h)}</li>`).join('')}</ul>`;
  const empty = (items, noun) => items.length ? '' : `<p class="xs-empty">No ${noun} are listed.</p>`;

  // Foundry: the three stations describe how to read a project, not an execution trace.
  const stations = [
    ['source', 'Source', 'Project brief'],
    ['method', 'Method', 'Topics in the record'],
    ['artifact', 'Artifact', 'Project record and links'],
  ];
  const stationPanel = (p, station, h) => {
    if (!p) return '<p>No project is available to inspect.</p>';
    if (station === 'source') return `<h3>${label(p, h)}</h3><p>${h.e(excerpt(p.description || 'This record has a title and source links.', 220))}</p>`;
    if (station === 'method') return `<h3>${label(p, h)}</h3>${tags(p.tags, h) || '<p>No topics are listed for this project.</p>'}`;
    return projectDetail(p, h, { limit: 160 });
  };
  function foundryHero(vm, h) {
    const rows = list(vm.projects), first = rows[0];
    return hero(`<div class="fd-head"><div>${title(vm, h)}${caption(vm, h)}</div>${action('projects', 'Open the project graph')}</div>
      <div class="fd-pipeline" data-fd-pipeline="source"><div class="fd-pipeline-bar"><strong>Foundry / Project pipeline</strong><span>Conceptual view</span></div>
      <div class="fd-hero-graph"><div class="fd-hero-input">${icon('folder')}<strong>Project archive</strong><span>${count(rows.length)}</span></div>
      <div class="fd-hero-fan" aria-label="Featured project nodes">${rows.slice(0, 4).map((p, i) => `<div class="fd-hero-branch">${choose('data-fd-hero-project', h.e(p.id), i === 0, `${icon('ports')}<span>${label(p, h)}</span>`, 'aria-controls="fd-station-detail"')}</div>`).join('')}${empty(rows, 'projects')}</div>
      <aside class="fd-hero-inspector" aria-label="Pipeline inspector"><div class="fd-stations" aria-label="Pipeline stages">${stations.map(([key, name, detail], i) => choose('data-fd-station', key, i === 0, `<strong>${name}</strong>`, `aria-controls="fd-station-detail" title="${detail}"`)).join('')}</div><div id="fd-station-detail" class="fd-station-detail" aria-live="polite">${stationPanel(first, 'source', h)}</div></aside></div></div>`, 'fd-hero');
  }
  function foundryProjects(vm, h) {
    const rows = list(vm.projects);
    const body = `<div class="fd-graph"><div class="fd-trunk"><span>Portfolio</span><span>Project records</span><i aria-hidden="true"></i></div>
      <div class="fd-branches"><label class="xs-search">Find a node<input type="search" data-fd-search placeholder="Search project records"></label><div class="fd-nodes" aria-label="Project nodes">
      ${rows.map((p, i) => `<div data-fd-node><span aria-hidden="true"></span>${choose('data-fd-project', h.e(p.id), i === 0, `${icon('ports')}<strong>${label(p, h)}</strong>`, 'aria-controls="fd-project-inspector"')}</div>`).join('')}</div><p data-fd-empty hidden>No nodes match this search.</p></div>
      <aside class="fd-inspector" id="fd-project-inspector" aria-label="Project inspector"><p class="xs-small">Selected project</p><div data-fd-inspector aria-live="polite">${projectDetail(rows[0], h)}</div></aside></div>`;
    return section('projects', { title: 'Project graph', description: 'Select a branch to inspect its source record. The connections organize the archive.', body, className: 'fd-projects' });
  }
  function foundryExperience(vm, h) {
    const rows = chronological(vm.experience);
    return section('experience', { title: 'Release branches', description: 'Professional roles, ordered by their recorded dates.', className: 'fd-experience', body: `<ol class="fd-releases">${rows.map((r, i) => `<li data-journey-record="${h.e(r.id)}"><div class="fd-release-date">${r.period ? h.e(r.period) : 'Undated record'}</div><details${i === 0 ? ' open' : ''}><summary>${h.e(r.title)}${icon('arrow')}</summary>${experienceBody(r, h)}</details></li>`).join('')}</ol>${empty(rows, 'experience records')}` });
  }
  function foundrySkills(vm, h) {
    return section('skills', { title: 'Method modules', description: 'Open a module to inspect its named methods and tools.', className: 'fd-skills', body: `${k.skillsSearch({ placeholder: 'Find a method or tool' })}<div class="fd-modules">${list(vm.skillGroups).map((g, i) => `<details class="record-skill-group fd-module"${i === 0 ? ' open' : ''}><summary><span>${icon('ports')}${h.e(g.name)}</span><span>${count(skills(g).length, 'entry', 'entries')}</span></summary><div class="fd-module-parts">${list(g.groups).map(s => `<section class="record-skill-sub"><h3>${h.e(s.name)}</h3>${skillItems(s, h)}</section>`).join('')}</div></details>`).join('')}</div>` });
  }
  function mountFoundry(root, { signal, model, helpers: h }) {
    let station = 'source';
    let selected = list(model.projects)[0];
    const nodes = all(root, '[data-fd-project]');
    const heroNodes = all(root, '[data-fd-hero-project]');
    const byId = new Map(list(model.projects).map(p => [p.id, p]));
    const pipeline = root.querySelector('[data-fd-pipeline]');
    const detail = root.querySelector('#fd-station-detail');
    const inspector = root.querySelector('[data-fd-inspector]');
    const search = root.querySelector('[data-fd-search]');
    const pick = (p, updateStation = true) => {
      selected = p;
      pressed(nodes, 'data-fd-project', p?.id);
      pressed(heroNodes, 'data-fd-hero-project', p?.id);
      inspector.innerHTML = projectDetail(p, h);
      if (updateStation) detail.innerHTML = stationPanel(p, station, h);
    };
    const searchGraph = () => {
      const q = phrase(search.value);
      const visible = nodes.filter(button => {
        const match = phrase(subject(byId.get(button.dataset.fdProject))).includes(q);
        button.closest('[data-fd-node]').hidden = !match;
        return match;
      });
      root.querySelector('[data-fd-empty]').hidden = !!visible.length;
      if (!visible.some(button => button.dataset.fdProject === selected?.id)) pick(byId.get(visible[0]?.dataset.fdProject));
    };
    root.addEventListener('click', event => {
      const stage = event.target.closest('[data-fd-station]');
      const node = event.target.closest('[data-fd-project], [data-fd-hero-project]');
      if (stage) {
        station = stage.dataset.fdStation;
        pipeline.dataset.fdPipeline = station;
        pressed(all(pipeline, '[data-fd-station]'), 'data-fd-station', station);
        detail.innerHTML = stationPanel(selected, station, h);
      }
      if (node) {
        const id = node.dataset.fdProject || node.dataset.fdHeroProject;
        if (nodes.find(button => button.dataset.fdProject === id)?.closest('[data-fd-node]').hidden) {
          search.value = '';
          searchGraph();
        }
        pick(byId.get(id));
      }
    }, { signal });
    search.addEventListener('input', searchGraph, { signal });
  }

  // Runtime: the same open document follows the visitor between the desktop and library.
  const rtPanes = [['files', 'Files', 'folder'], ['preview', 'Preview', 'preview'], ['properties', 'Properties', 'inspector']];
  function rtDocument(p, h, vm, welcome) {
    if (!p) return '<p class="xs-empty">No project is open.</p>';
    return `<div class="rt-page-title">${icon('file')}<span>Project record</span><h2>${label(p, h)}</h2></div>${projectDetail(p, h, { showTitle: false, limit: welcome ? 310 : 0 })}${welcome && vm.identity?.avatarUrl ? h.portrait(vm.identity, 'rt-portrait') : ''}`;
  }
  function rtProperties(p, h, rows) {
    return p ? `<dl><dt>Collection</dt><dd>Projects</dd><dt>Position in this view</dt><dd>${rows.indexOf(p) + 1} / ${rows.length}</dd><dt>Topics</dt><dd>${tags(p.tags, h) || 'None listed'}</dd></dl>` : '<p>No properties to show.</p>';
  }
  function rtWorkspace(vm, h, key, compact = false) {
    const rows = list(vm.projects), first = rows[0];
    const pane = (name, body) => `<section id="rt-${key}-${name}" class="rt-pane rt-pane-${name}" data-rt-pane="${name}" aria-label="${rtPanes.find(p => p[0] === name)[1]}">${body}</section>`;
    const files = pane('files', `<label class="xs-search rt-search"><span>Filter files</span><input type="search" data-rt-search placeholder="Find a project"></label><div class="rt-file-list" aria-label="Project files">${rows.map((p, i) => choose('data-rt-file', h.e(p.id), i === 0, `${icon('file')}<span>${label(p, h)}</span>`, `aria-controls="rt-${key}-preview"`)).join('')}<p data-rt-empty${rows.length ? ' hidden' : ''}>No matching files.</p></div>`);
    const preview = pane('preview', `<div class="rt-window-tools"><span data-rt-window-title>${first ? label(first, h) : 'Preview'}</span><button type="button" data-rt-window="minimize" aria-label="Minimize preview" title="Minimize preview">${icon('minus')}</button><button type="button" data-rt-window="maximize" aria-label="Maximize preview" title="Maximize preview" aria-pressed="false">${icon('expand')}</button></div><div class="rt-document" data-rt-document aria-live="polite">${rtDocument(first, h, vm, compact)}</div>`);
    const properties = pane('properties', `<h2>Properties</h2><div data-rt-properties>${rtProperties(first, h, rows)}</div>`);
    return `<div class="rt-workspace${compact ? ' rt-compact' : ''}" data-rt-workspace="${key}" data-rt-active="${compact ? 'preview' : 'files'}" data-rt-window-state="normal"><div class="rt-workspace-bar"><span>${icon('folder')}<strong>${compact ? 'Runtime desktop' : 'Project workspace'}</strong></span><div class="rt-dock" aria-label="Workspace panes">${rtPanes.map(([id, name, glyph]) => choose('data-rt-dock', id, id === (compact ? 'preview' : 'files'), `${icon(glyph)}<span>${name}</span>`, `aria-controls="rt-${key}-${id}"`)).join('')}</div></div><div class="rt-workspace-grid">${files}${preview}${properties}<div class="rt-restoration"><button type="button" class="xs-action" data-rt-dock="preview">Restore preview${icon('restore')}</button></div></div></div>`;
  }
  function runtimeHero(vm, h) {
    return hero(`<div class="rt-header"><div>${title(vm, h)}${caption(vm, h)}</div>${action('projects', 'Open full workspace')}</div>${rtWorkspace(vm, h, 'desktop', true)}`, 'rt-hero');
  }
  function runtimeProjects(vm, h) {
    return section('projects', { title: 'Project library', className: 'rt-projects', body: rtWorkspace(vm, h, 'library') });
  }
  function runtimeExperience(vm, h) {
    const rows = chronological(vm.experience);
    return section('experience', { title: 'Career changelog', description: 'Dated entries from the professional record.', className: 'rt-experience', body: `<div class="rt-changelog">${rows.map(r => `<article data-journey-record="${h.e(r.id)}"><span class="rt-date">${h.e(r.period || 'Undated')}</span><div>${experienceBody(r, h)}</div></article>`).join('')}</div>${empty(rows, 'experience records')}` });
  }
  function runtimeSkills(vm, h) {
    return section('skills', { title: 'Package inventory', description: 'Source skill categories and the tools listed in each.', className: 'rt-skills', body: `${k.skillsSearch({ placeholder: 'Find a package or method' })}<div class="rt-packages">${list(vm.skillGroups).map((g, i) => `<details class="record-skill-group"${i === 0 ? ' open' : ''}><summary>${icon('folder')}<strong>${h.e(g.name)}</strong><span>${skills(g).length} listed</span></summary>${list(g.groups).map(s => `<div class="record-skill-sub"><h3>${h.e(s.name)}</h3>${skillItems(s, h)}</div>`).join('')}</details>`).join('')}</div>` });
  }
  function mountRuntime(root, { signal, model, helpers: h }) {
    const workspaces = all(root, '[data-rt-workspace]');
    const rows = list(model.projects);
    const records = new Map(rows.map(p => [p.id, p]));
    const narrow = w.matchMedia?.('(max-width: 760px)');
    function activate(workspace, pane, focus = false) {
      workspace.dataset.rtActive = pane;
      const state = workspace.dataset.rtWindowState;
      if (pane === 'preview' && state === 'minimized' || pane !== 'preview' && state === 'maximized') setWindow(workspace, 'normal');
      const controls = all(workspace, '.rt-dock [data-rt-dock]');
      pressed(controls, 'data-rt-dock', pane);
      if (focus) controls.find(button => button.dataset.rtDock === pane)?.focus();
    }
    function setWindow(workspace, state) {
      workspace.dataset.rtWindowState = state;
      const max = workspace.querySelector('[data-rt-window="maximize"]');
      const name = state === 'maximized' ? 'Restore normal preview size' : 'Maximize preview';
      max.setAttribute('aria-pressed', String(state === 'maximized'));
      max.setAttribute('aria-label', name);
      max.title = name;
      max.innerHTML = icon(state === 'maximized' ? 'restore' : 'expand');
    }
    function open(p) {
      workspaces.forEach(workspace => {
        pressed(all(workspace, '[data-rt-file]'), 'data-rt-file', p.id);
        workspace.querySelector('[data-rt-document]').innerHTML = rtDocument(p, h, model, workspace.classList.contains('rt-compact'));
        workspace.querySelector('[data-rt-window-title]').textContent = p.title || 'Untitled project';
        workspace.querySelector('[data-rt-properties]').innerHTML = rtProperties(p, h, rows);
      });
    }
    root.addEventListener('click', event => {
      const workspace = event.target.closest('[data-rt-workspace]');
      if (!workspace) return;
      const file = event.target.closest('[data-rt-file]'), dock = event.target.closest('[data-rt-dock]'), control = event.target.closest('[data-rt-window]');
      if (file) {
        open(records.get(file.dataset.rtFile));
        activate(workspace, 'preview', !!narrow?.matches);
      }
      if (dock) activate(workspace, dock.dataset.rtDock, dock.parentElement.classList.contains('rt-restoration'));
      if (control?.dataset.rtWindow === 'minimize') {
        setWindow(workspace, 'minimized');
        activate(workspace, 'files', true);
      }
      if (control?.dataset.rtWindow === 'maximize') {
        activate(workspace, 'preview');
        setWindow(workspace, workspace.dataset.rtWindowState === 'maximized' ? 'normal' : 'maximized');
      }
    }, { signal });
    root.addEventListener('keydown', event => {
      const button = event.target.closest('.rt-dock button');
      if (!button || !['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return;
      event.preventDefault();
      const current = rtPanes.findIndex(([id]) => id === button.dataset.rtDock);
      const index = { Home: 0, End: 2, ArrowLeft: (current + 2) % 3, ArrowRight: (current + 1) % 3 }[event.key];
      activate(button.closest('[data-rt-workspace]'), rtPanes[index][0], true);
    }, { signal });
    workspaces.forEach(workspace => workspace.querySelector('[data-rt-search]').addEventListener('input', event => {
      const q = phrase(event.target.value);
      const files = all(workspace, '[data-rt-file]');
      files.forEach(button => { button.hidden = !phrase(subject(records.get(button.dataset.rtFile))).includes(q); });
      workspace.querySelector('[data-rt-empty]').hidden = files.some(button => !button.hidden);
    }, { signal }));
  }

  const tensorLayers = [
    { key: 'data', title: 'Data', label: 'Data preparation', pattern: /dataset|preprocess|feature|data (?:processing|engineering|collection|analysis)|sequenc|normaliz/i },
    { key: 'method', title: 'Methods', label: 'Learning methods', pattern: /machine learning|deep learning|algorithm|\bml\b|clustering|bioinformatic|classification|regression/i },
    { key: 'model', title: 'Models', label: 'Model families', pattern: /neural|model|pytorch|tensorflow|transformer|\b(?:cnn|gnn|svm|llm)\b|random forest/i },
    { key: 'evaluate', title: 'Evaluation', label: 'Evaluation methods', pattern: /evaluat|compar|benchmark|validat|test set|metrics?|precision|prediction/i },
  ];
  const tensorML = /machine learning|deep learning|\bml\b|pytorch|tensorflow|neural|classif|clustering|regression|random forest|\b(?:cnn|gnn|svm|llm)\b/i;
  function tensorMatch(p, layer) {
    const content = subject(p);
    return tensorML.test(content) && layer.pattern.test(content);
  }
  function tensorGlyph(index) {
    const variants = [
      '<g fill="currentColor" stroke="none"><circle cx="72" cy="49" r="8"/><circle cx="109" cy="25" r="4"/><circle cx="151" cy="61" r="5"/><circle cx="184" cy="34" r="9"/><circle cx="218" cy="57" r="4"/><circle cx="258" cy="44" r="5"/><circle cx="132" cy="43" r="3"/><circle cx="238" cy="24" r="3"/></g>',
      '<path d="M43 67 98 22l57 45 58-45 58 45M70 67l57-45 58 45 55-45 59 45"/><path d="M98 22h142m-85 45h144" opacity=".4"/>',
      '<path d="m53 48 51-23 55 23 56-23 54 23-54 19-56-19-55 19zM104 25v42m111-42v42M53 48h216"/><g fill="currentColor"><circle cx="53" cy="48" r="4"/><circle cx="159" cy="48" r="5"/><circle cx="269" cy="48" r="4"/></g>',
      '<path d="M82 17h176v54H82zM126 17v54m44-54v54m44-54v54M82 35h176M82 53h176"/><path d="m100 24 4 4 7-7m33 19 4 4 7-7m33 19 4 4 7-7m33 1 4 4 7-7"/>',
    ];
    return `<svg viewBox="0 0 340 88" fill="none" stroke="currentColor" stroke-width="1.4" aria-hidden="true">${variants[index]}</svg>`;
  }
  const tensorInfo = (rows, layer) => `<span class="xs-small">${layer.label}</span><strong>${count(rows.filter(p => tensorMatch(p, layer)).length, 'matching project record', 'matching project records')}</strong>`;
  function tensorHero(vm, h) {
    const rows = list(vm.projects);
    return hero(`<div class="tn-intro"><div>${title(vm, h)}${caption(vm, h)}<p>Explore machine learning projects through a conceptual stack of methods.</p>${action('projects', 'Inspect the project layers')}</div>
      <figure class="tn-figure" data-tn-depth="1"><div class="tn-stack" aria-label="Conceptual machine learning layers">${tensorLayers.map((layer, i) => choose('data-tn-depth-choice', String(i), i === 1, `${tensorGlyph(i)}<span>${layer.title}</span>`, `class="tn-plane" style="--plane:${i}" aria-controls="tn-depth-info"`)).join('')}</div><div class="tn-depth-controls"><label>Tensor layer depth<input type="range" min="0" max="3" step="1" value="1" aria-valuetext="Methods" data-tn-range></label><div id="tn-depth-info" aria-live="polite">${tensorInfo(rows, tensorLayers[1])}</div></div></figure></div>`, 'tn-hero');
  }
  function tensorProjects(vm, h) {
    const rows = list(vm.projects);
    return section('projects', { title: 'Exploded project index', description: 'Layer membership comes from terms in project titles, descriptions and topics.', className: 'tn-projects', body: `<div class="tn-index"><div class="tn-index-depth" aria-label="Filter project layers">${choose('data-tn-filter', 'all', true, '<strong>All projects</strong>')}${tensorLayers.map((layer, i) => choose('data-tn-filter', layer.key, false, `${tensorGlyph(i)}<strong>${layer.title}</strong>`)).join('')}</div><div class="tn-index-cards"><p class="xs-small" data-tn-status role="status">${count(rows.length)}</p>${rows.map(p => `<details class="tn-project-record" data-tn-project="${h.e(p.id)}" data-tn-layers="${tensorLayers.filter(layer => tensorMatch(p, layer)).map(layer => layer.key).join(' ')}"><summary><strong>${label(p, h)}</strong>${icon('arrow')}</summary><div>${projectDetail(p, h, { showTitle: false })}</div></details>`).join('')}<p data-tn-empty${rows.length ? ' hidden' : ''}>No projects match this layer.</p></div></div>` });
  }
  function tensorExperience(vm, h) {
    const rows = chronological(vm.experience);
    return section('experience', { title: 'Training chapters', description: 'A conceptual chapter sequence through the dated professional record.', className: 'tn-experience', body: `<ol class="tn-chapters">${rows.map((r, i) => `<li data-journey-record="${h.e(r.id)}"><span class="tn-chapter-number" aria-hidden="true">${k.number(i)}</span><div><p class="xs-small">${h.e(r.period || 'Undated record')}</p>${experienceBody(r, h)}</div></li>`).join('')}</ol>${empty(rows, 'experience records')}` });
  }
  function tensorSkills(vm, h) {
    return section('skills', { title: 'Methods matrix', description: 'Counts reflect the number of named entries in each source category.', className: 'tn-skills', body: `${k.skillsSearch({ placeholder: 'Find a listed method' })}<div class="tn-matrix">${list(vm.skillGroups).map((g, i) => `<details class="record-skill-group"${i === 0 ? ' open' : ''}><summary><strong>${h.e(g.name)}</strong><span>${skills(g).length} entries</span></summary><table><thead><tr><th scope="col">Source category</th><th scope="col">Named methods</th><th scope="col">Entries</th></tr></thead>${list(g.groups).map(s => `<tbody class="record-skill-sub"><tr><th scope="row">${h.e(s.name)}</th><td>${skillItems(s, h)}</td><td>${list(s.items).length}</td></tr></tbody>`).join('')}</table></details>`).join('')}</div>` });
  }
  function mountTensor(root, { signal, model }) {
    const rows = list(model.projects), range = root.querySelector('[data-tn-range]');
    const depth = root.querySelector('[data-tn-depth]');
    const planes = all(depth, '[data-tn-depth-choice]'), filters = all(root, '[data-tn-filter]');
    const records = all(root, '[data-tn-project]');
    function select(index, filter = true) {
      const layer = tensorLayers[index];
      depth.dataset.tnDepth = index;
      range.value = index;
      range.setAttribute('aria-valuetext', layer.title);
      pressed(planes, 'data-tn-depth-choice', String(index));
      root.querySelector('#tn-depth-info').innerHTML = tensorInfo(rows, layer);
      if (filter) setFilter(layer.key);
    }
    function setFilter(key) {
      pressed(filters, 'data-tn-filter', key);
      const visible = records.filter(record => {
        const show = key === 'all' || record.dataset.tnLayers.split(' ').includes(key);
        record.hidden = !show;
        return show;
      }).length;
      root.querySelector('[data-tn-status]').textContent = count(visible);
      root.querySelector('[data-tn-empty]').hidden = visible > 0;
    }
    range.addEventListener('input', () => select(Number(range.value)), { signal });
    root.addEventListener('click', event => {
      const plane = event.target.closest('[data-tn-depth-choice]');
      const filter = event.target.closest('[data-tn-filter]');
      if (plane) select(Number(plane.dataset.tnDepthChoice));
      if (filter) {
        const index = tensorLayers.findIndex(layer => layer.key === filter.dataset.tnFilter);
        if (index >= 0) select(index, false);
        setFilter(filter.dataset.tnFilter);
      }
    }, { signal });
  }

  // Patchbay uses complete skill names and short names as literal text associations.
  function patchGroups(vm) {
    return list(vm.skillGroups).flatMap(domain => list(domain.groups).map(group => {
      const terms = [group.name, ...list(group.items).flatMap(item => [item.name, item.shortName])];
      const words = [...new Set(terms.map(phrase).filter(term => term.length >= 3 || term === 'r'))];
      const related = list(vm.projects).filter(p => {
        const project = ` ${phrase(subject(p))} `;
        return words.some(term => project.includes(` ${term} `));
      });
      return { group, related };
    }));
  }
  function patchMatches(item, h) {
    return item?.related.length ? `<ul>${item.related.map(p => `<li><button type="button" class="xs-textlink" data-open-project="${h.e(p.id)}">${label(p, h)}${icon('external')}</button></li>`).join('')}</ul>` : '<p>No project title, description or topic contains a listed term from this group.</p>';
  }
  function patchHero(vm, h) {
    const groups = patchGroups(vm);
    const first = groups.find(item => item.related.length) || groups[0];
    return hero(`<div class="pb-heading"><div>${title(vm, h)}${caption(vm, h)}</div><p>Patch a skill group into the project archive to find records that mention its terms.</p></div><div class="pb-machine" data-pb-machine>
      <svg class="pb-cable" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true"><path data-pb-cable-shadow/><path data-pb-cable/></svg><div class="pb-machine-top"><strong>Patchbay / Skill-to-project routing</strong><span>Text associations</span></div>
      <div class="pb-machine-grid"><div class="pb-port-side"><label class="xs-search">Find a source port<input type="search" data-pb-search placeholder="Search skill groups"></label><div class="pb-port-bank">${groups.map(item => choose('data-pb-port', h.e(item.group.id), item === first, `<strong>${h.e(item.group.name)}</strong><span>${item.related.length}</span><i aria-hidden="true"></i>`, 'aria-controls="pb-monitor"')).join('')}</div><p data-pb-no-port hidden>No ports match this search.</p></div>
      <div id="pb-monitor" class="pb-monitor" aria-live="polite"><div class="pb-monitor-head"><i data-pb-sink aria-hidden="true"></i><span data-pb-monitor-title>${first ? h.e(first.group.name) : 'Project matches'}</span></div><div data-pb-matches>${patchMatches(first, h)}</div>${action('projects', 'Open the signal rack')}</div></div></div>`, 'pb-hero');
  }
  function patchProjects(vm, h) {
    const rows = list(vm.projects);
    return section('projects', { title: 'Project signal rack', description: 'Browse all records, or isolate the projects associated with the connected skill group.', className: 'pb-projects', body: `<div class="pb-rack-toolbar"><span data-pb-rack-status role="status">${count(rows.length)}</span><div aria-label="Signal rack filters">${choose('data-pb-rack', 'all', true, 'All projects')}${choose('data-pb-rack', 'connected', false, 'Connected projects')}</div></div><div class="pb-rack">${rows.map(p => `<details data-pb-project="${h.e(p.id)}"><summary><i aria-hidden="true"></i><strong>${label(p, h)}</strong>${icon('arrow')}</summary><div>${projectDetail(p, h, { showTitle: false })}</div></details>`).join('')}</div><p data-pb-rack-empty${rows.length ? ' hidden' : ''}>No projects are connected to this port.</p>` });
  }
  function patchExperience(vm, h) {
    const rows = chronological(vm.experience);
    return section('experience', { title: 'Experience sequencer', description: 'Select a step to read a dated role.', className: 'pb-experience', body: `<div class="pb-step-bank" aria-label="Experience steps">${rows.map((r, i) => choose('data-pb-step', h.e(r.id), i === 0, `<span aria-hidden="true">${k.number(i)}</span><strong>${h.e(r.title)}</strong><small>${h.e(r.period || 'Undated')}</small>`, 'aria-controls="pb-step-output"')).join('')}</div><div id="pb-step-output" class="pb-step-output" aria-live="polite">${rows.map((r, i) => `<article data-journey-record="${h.e(r.id)}"${i ? ' hidden' : ''}>${experienceBody(r, h)}</article>`).join('')}${empty(rows, 'experience records')}</div>` });
  }
  function patchSkills(vm, h) {
    return section('skills', { title: 'Instrument ports', description: 'Each source group can be patched into the project archive.', className: 'pb-skills', body: `${k.skillsSearch({ placeholder: 'Find a listed tool' })}<div class="pb-instruments">${list(vm.skillGroups).map((g, i) => `<details class="record-skill-group"${i === 0 ? ' open' : ''}><summary>${icon('ports')}<strong>${h.e(g.name)}</strong></summary>${list(g.groups).map(s => `<div class="record-skill-sub pb-instrument"><header><h3>${h.e(s.name)}</h3>${choose('data-pb-patch', h.e(s.id), false, '<i aria-hidden="true"></i><span>Connect port</span>')}</header>${skillItems(s, h)}</div>`).join('')}</details>`).join('')}</div>` });
  }
  function mountPatchbay(root, { signal, model, helpers: h }) {
    const entries = patchGroups(model), entryMap = new Map(entries.map(item => [item.group.id, item]));
    const ports = all(root, '[data-pb-port]'), skillPorts = all(root, '[data-pb-patch]'), rack = all(root, '[data-pb-rack]');
    const records = all(root, '[data-pb-project]'), machine = root.querySelector('[data-pb-machine]');
    const sink = root.querySelector('[data-pb-sink]'), cable = machine.querySelector('.pb-cable');
    let selected = entries.find(item => item.related.length) || entries[0], rackMode = 'all';
    function draw() {
      const source = ports.find(port => port.dataset.pbPort === selected?.group.id && !port.hidden)?.querySelector('i');
      cable.hidden = false;
      const frame = cable.getBoundingClientRect();
      if (!source || !frame.width || !frame.height) { cable.hidden = true; return; }
      cable.hidden = false;
      const a = source.getBoundingClientRect(), b = sink.getBoundingClientRect();
      const viewport = bank.getBoundingClientRect();
      if (a.top < viewport.top || a.bottom > viewport.bottom) { cable.hidden = true; return; }
      const ax = 100 * (a.x + a.width / 2 - frame.x) / frame.width;
      const ay = 100 * (a.y + a.height / 2 - frame.y) / frame.height;
      const bx = 100 * (b.x + b.width / 2 - frame.x) / frame.width;
      const by = 100 * (b.y + b.height / 2 - frame.y) / frame.height;
      const reach = (bx - ax) / 2;
      const dip = Math.min(94, Math.max(ay, by) + 17);
      const path = `M${ax},${ay} C${ax + reach},${dip} ${bx - reach},${dip} ${bx},${by}`;
      all(cable, 'path').forEach(line => line.setAttribute('d', path));
    }
    function updateRack(mode) {
      rackMode = mode;
      pressed(rack, 'data-pb-rack', mode);
      const matches = new Set(list(selected?.related).map(p => p.id));
      const total = records.filter(record => {
        const visible = mode === 'all' || matches.has(record.dataset.pbProject);
        record.hidden = !visible;
        return visible;
      }).length;
      root.querySelector('[data-pb-rack-status]').textContent = `${count(total)}${mode === 'connected' && selected ? ` · ${selected.group.name}` : ''}`;
      root.querySelector('[data-pb-rack-empty]').hidden = total > 0;
    }
    function connect(item, filter = true) {
      selected = item;
      pressed(ports, 'data-pb-port', item?.group.id);
      pressed(skillPorts, 'data-pb-patch', item?.group.id);
      root.querySelector('[data-pb-monitor-title]').textContent = item?.group.name || 'Project matches';
      root.querySelector('[data-pb-matches]').innerHTML = patchMatches(item, h);
      updateRack(filter ? 'connected' : rackMode);
      draw();
    }
    const steps = all(root, '[data-pb-step]'), output = root.querySelector('#pb-step-output');
    root.addEventListener('click', event => {
      const port = event.target.closest('[data-pb-port], [data-pb-patch]');
      const filter = event.target.closest('[data-pb-rack]'), step = event.target.closest('[data-pb-step]');
      if (port) connect(entryMap.get(port.dataset.pbPort || port.dataset.pbPatch));
      if (filter) updateRack(filter.dataset.pbRack);
      if (step) {
        pressed(steps, 'data-pb-step', step.dataset.pbStep);
        all(output, '[data-journey-record]').forEach(record => { record.hidden = record.dataset.journeyRecord !== step.dataset.pbStep; });
      }
    }, { signal });
    const bank = machine.querySelector('.pb-port-bank');
    root.querySelector('[data-pb-search]').addEventListener('input', event => {
      const q = phrase(event.target.value);
      const matches = ports.filter(port => {
        const show = phrase(entryMap.get(port.dataset.pbPort).group.name).includes(q);
        port.hidden = !show;
        return show;
      });
      root.querySelector('[data-pb-no-port]').hidden = matches.length > 0;
      draw();
    }, { signal });
    bank.addEventListener('scroll', draw, { passive: true, signal });
    if (w.ResizeObserver) {
      const observer = new w.ResizeObserver(draw);
      observer.observe(machine);
      signal.addEventListener('abort', () => observer.disconnect(), { once: true });
    } else w.addEventListener('resize', draw, { passive: true, signal });
    connect(selected, false);
  }

  const prismParts = [
    { key: 'biology', name: 'Biology', icon: 'cell', description: 'Cells, organisms and sequences', test: /biolog|bioinform|biotech|genom|\b(?:rna|dna)\b|transcript|protein|microbi|enzyme|cell|ferment|organism|metagenom/i },
    { key: 'chemistry', name: 'Chemistry', icon: 'molecule', description: 'Molecules, compounds and assays', test: /chem(?:is|ical)|molecul|chromatog|spectrom|assay|metabol|enzym|biosynth|compound/i },
    { key: 'computation', name: 'Computation', icon: 'grid', description: 'Code, data and learning methods', test: /bioinform|comput|program|software|machine learning|deep learning|\b(?:ml|sql)\b|neural|algorithm|data (?:scien|engineer|analysis|visual)|python|javascript|typescript|web |linux|github|automation|pytorch/i },
  ];
  const prismText = p => [subject(p), p.name, p.shortName, p.organization].filter(Boolean).join(' ');
  const prismKeys = p => prismParts.filter(part => part.test.test(prismText(p))).map(part => part.key);
  function prismDrawing(index) {
    const shapes = [
      '<path d="M20 32c4-6 16-5 32 3s25 20 22 28c-4 8-21 6-37-4S15 40 20 32Zm7 2c4-4 14-2 25 4s21 17 17 22c-4 5-18 3-30-5S23 38 27 34Z"/><ellipse cx="49" cy="46" rx="10" ry="5" transform="rotate(32 49 46)"/><ellipse cx="35" cy="44" rx="4" ry="2"/><ellipse cx="59" cy="56" rx="3" ry="2"/>',
      '<path d="m25 50 10-13h12l9 13-9 13H35Zm31 0 9-13h12l10 13-10 13H65ZM35 37l-5-9m35 9 4-8m8 34 5 9M35 63l-4 8"/><g fill="currentColor"><circle cx="30" cy="28" r="2"/><circle cx="69" cy="29" r="2"/><circle cx="82" cy="72" r="2"/><circle cx="31" cy="71" r="2"/></g>',
      '<path d="M15 66l16-5 9-10 17-5 13 6 14-5M15 55l20-6 8 9 13-4 14-14 14-5M15 73l22-8 12 3 16-5 8-6 11-4"/><g fill="currentColor"><circle cx="15" cy="66" r="2"/><circle cx="57" cy="46" r="2"/><circle cx="70" cy="52" r="2"/><circle cx="84" cy="47" r="2"/><circle cx="84" cy="35" r="2"/><circle cx="84" cy="53" r="2"/></g>',
    ];
    return `<svg viewBox="0 0 100 100" preserveAspectRatio="none" fill="none" stroke="currentColor" stroke-width=".8" aria-hidden="true">${shapes[index]}</svg>`;
  }
  const prismChoices = () => `<div class="pr-choices" aria-label="Discipline focus">${choose('data-pr-focus', 'all', true, 'All disciplines')}${prismParts.map(part => choose('data-pr-focus', part.key, false, `${icon(part.icon)}${part.name}`)).join('')}</div>`;
  function prismHero(vm, h) {
    return hero(`<div class="pr-grid" data-pr-assembly="all"><div class="pr-copy">${title(vm, h)}${caption(vm, h)}<p>Three disciplines, one body of work. Select a component to bring its projects forward.</p>${prismChoices()}<p class="pr-focus-description" data-pr-summary aria-live="polite">Complete assembly</p>${action('projects', 'View the project assembly')}</div><figure class="pr-figure"><div class="pr-planes">${prismParts.map((part, i) => choose('data-pr-focus', part.key, false, `${prismDrawing(i)}<span>${part.name}</span>`, `class="pr-plane pr-face-${part.key}" aria-label="Focus ${part.name}"`)).join('')}</div><figcaption>Prism / Conceptual assembly</figcaption></figure></div>`, 'pr-hero');
  }
  function prismProjects(vm, h) {
    const rows = list(vm.projects);
    return section('projects', { title: 'Project components', description: 'Focus changes the arrangement using matches in project titles, descriptions and topics.', className: 'pr-projects', body: `${prismChoices()}<p class="xs-small" data-pr-count role="status">${count(rows.length)}</p><div class="pr-project-layout" data-pr-layout="all">${rows.map((p, i) => `<article data-pr-project="${h.e(p.id)}" data-pr-parts="${prismKeys(p).join(' ')}"><div class="pr-project-topics" aria-label="Matched disciplines">${prismParts.filter(part => prismKeys(p).includes(part.key)).map(part => `<span>${icon(part.icon)}${part.name}</span>`).join('')}</div><h3>${label(p, h)}</h3>${p.description ? `<p>${h.e(excerpt(p.description, 260))}</p>` : ''}${tags(p.tags, h)}<div class="xs-actions">${projectLinks(p, h)}</div>${i === 0 ? `<div class="pr-project-visual">${k.projectVisual(p, i, h)}</div>` : ''}</article>`).join('')}</div><p data-pr-empty${rows.length ? ' hidden' : ''}>No projects match this discipline.</p>` });
  }
  function prismExperience(vm, h) {
    const rows = chronological(vm.experience);
    return section('experience', { title: 'Layers of experience', description: 'One chronology, with discipline markings based on the words in each record.', className: 'pr-experience', body: `<div class="pr-timeline"><div class="pr-timeline-key" aria-hidden="true">${prismParts.map(part => `<span>${icon(part.icon)}${part.name}</span>`).join('')}</div>${rows.map(r => {
      const keys = prismKeys(r);
      return `<article data-journey-record="${h.e(r.id)}"><div class="pr-timeline-dots" aria-label="${h.e(prismParts.filter(part => keys.includes(part.key)).map(part => part.name).join(', ') || 'No discipline match')}">${prismParts.map(part => `<span data-pr-mark="${keys.includes(part.key)}" aria-hidden="true">${icon(part.icon)}</span>`).join('')}</div><div><p class="xs-small">${h.e(r.period || 'Undated record')}</p>${experienceBody(r, h)}</div></article>`;
    }).join('')}</div>${empty(rows, 'experience records')}` });
  }
  function prismSkills(vm, h) {
    return section('skills', { title: 'Capability matrix', description: 'Discipline marks follow the wording of each source skill.', className: 'pr-skills', body: `${k.skillsSearch({ placeholder: 'Find a capability' })}<div class="pr-capabilities">${list(vm.skillGroups).map((g, i) => `<details class="record-skill-group"${i === 0 ? ' open' : ''}><summary>${h.e(g.name)}${icon('arrow')}</summary>${list(g.groups).map(s => `<div class="record-skill-sub"><h3>${h.e(s.name)}</h3><ul>${list(s.items).map(item => {
      const keys = prismKeys(item);
      return `<li data-skill-item="${h.e(item.id)}"><div><strong>${skillName(item, h)}</strong>${tags(item.tags, h)}</div><div class="pr-skill-marks" aria-label="Matched disciplines">${prismParts.filter(part => keys.includes(part.key)).map(part => `<span>${icon(part.icon)}${part.name}</span>`).join('')}</div></li>`;
    }).join('')}</ul></div>`).join('')}</details>`).join('')}</div>` });
  }
  function mountPrism(root, { signal }) {
    const controls = all(root, '[data-pr-focus]'), records = all(root, '[data-pr-project]');
    root.addEventListener('click', event => {
      const control = event.target.closest('[data-pr-focus]');
      if (!control) return;
      const key = control.dataset.prFocus, part = prismParts.find(item => item.key === key);
      root.querySelector('[data-pr-assembly]').dataset.prAssembly = key;
      root.querySelector('[data-pr-layout]').dataset.prLayout = key;
      root.querySelector('[data-pr-summary]').textContent = part?.description || 'Complete assembly';
      pressed(controls, 'data-pr-focus', key);
      const total = records.filter(record => {
        const visible = key === 'all' || record.dataset.prParts.split(' ').includes(key);
        record.hidden = !visible;
        return visible;
      }).length;
      root.querySelector('[data-pr-count]').textContent = `${count(total)}${part ? ` · ${part.name}` : ''}`;
      root.querySelector('[data-pr-empty]').hidden = total > 0;
    }, { signal });
  }

  const chapters = [
    { key: 'question', title: 'Biological questions', classifier: 'biology', brief: 'Projects that mention living systems, molecules or sequences.', position: [58, 218] },
    { key: 'method', title: 'Computational methods', classifier: 'both', brief: 'Projects whose descriptions connect life-science and computing terms.', position: [161, 159] },
    { key: 'tool', title: 'Engineered tools', classifier: 'programming', brief: 'Projects that mention programming, data or machine learning.', position: [261, 185] },
    { key: 'archive', title: 'Wider archive', classifier: 'other', brief: 'Additional projects in the source collection.', position: [363, 59] },
  ];
  const expeditionRows = (rows, chapter) => rows.filter(p => classify(p) === chapter.classifier);
  function expeditionMap(rows, active) {
    return `<svg viewBox="0 0 414 260" class="ex-map-art" fill="none" aria-hidden="true"><path class="ex-contours" d="M0 51q98 24 150-23T414 26M0 64q102 26 163-22T414 37M0 82q104 29 175-22T414 48M0 101q102 36 182-20T414 59M0 121q102 37 190-19T414 70M0 142q99 37 192-17T414 82M0 165q95 40 194-15T414 94M0 188q91 41 194-12T414 110M0 210q88 42 191-7T414 126M0 232q82 42 190-4T414 143M52 260q69-5 128-22t234-80M169 260q110-16 245-86M245 260q99-27 169-70M302 260q73-29 112-58"/><path class="ex-base-route" d="M58 218C102 215 104 142 161 159S212 219 261 185 285 104 363 59"/><path class="ex-route-progress" pathLength="100" d="M58 218C102 215 104 142 161 159S212 219 261 185 285 104 363 59"/>${chapters.map((chapter, i) => `<g class="ex-map-node" data-ex-map-node="${chapter.key}" data-ex-active="${chapter.key === active}" transform="translate(${chapter.position.join(' ')})"><circle r="12"/><text y="4" text-anchor="middle">${i + 1}</text>${expeditionRows(rows, chapter).slice(0, 22).map((_, n) => `<circle class="ex-record-dot" cx="${(n % 6) * 6 - 15}" cy="${24 + Math.floor(n / 6) * 6}" r="1.6"/>`).join('')}</g>`).join('')}<path class="ex-compass" d="M370 200v32m-16-16h32m-16-14 4 14-4 10-4-10z"/></svg>`;
  }
  function expeditionControls(active, rows, inAtlas = false) {
    return `<nav class="ex-chapter-nav" aria-label="${inAtlas ? 'Jump to route chapter' : 'Preview a route chapter'}">${chapters.map((chapter, i) => inAtlas ? `<a href="#ex-${chapter.key}" data-ex-jump="${chapter.key}"${chapter.key === active ? ' aria-current="step"' : ''}><span>${i + 1}</span><strong>${chapter.title}</strong><small>${expeditionRows(rows, chapter).length}</small></a>` : choose('data-ex-chapter', chapter.key, chapter.key === active, `<span>${i + 1}</span><strong>${chapter.title}</strong>`, 'aria-controls="ex-hero-preview"')).join('')}</nav>`;
  }
  function expeditionPreview(rows, chapter, h) {
    const selection = expeditionRows(rows, chapter);
    return `<div><p>${chapter.brief}</p>${selection[0] ? `<button type="button" class="xs-textlink" data-open-project="${h.e(selection[0].id)}">${label(selection[0], h)}${icon('external')}</button>` : '<p>No matching project records.</p>'}</div><a class="xs-action" href="#ex-${chapter.key}" data-ex-jump="${chapter.key}">Open chapter${icon('arrow')}</a>`;
  }
  function expeditionHero(vm, h) {
    const rows = list(vm.projects), active = chapters.find(chapter => expeditionRows(rows, chapter).length) || chapters[0];
    return hero(`<div class="ex-masthead"><div class="ex-hero-title">${title(vm, h)}${caption(vm, h)}<p class="ex-hero-lead">A field route from biological questions to engineered tools.</p></div>${h.portrait(vm.identity || {}, 'ex-portrait')}<figure class="ex-hero-map" data-ex-map="hero" style="--ex-progress:${chapters.indexOf(active) * 100 / (chapters.length - 1)}">${expeditionMap(rows, active.key)}<figcaption>Expedition / Conceptual project route</figcaption></figure></div>${expeditionControls(active.key, rows)}<div class="ex-hero-preview" id="ex-hero-preview" aria-live="polite">${expeditionPreview(rows, active, h)}</div>`, 'ex-hero');
  }
  function expeditionProjects(vm, h) {
    const rows = list(vm.projects);
    return section('projects', { title: 'Route atlas', description: 'A conceptual route grouped by terms in the project records. Each project appears at one waypoint.', className: 'ex-projects', body: `<div class="ex-route-atlas"><aside class="ex-route-sidebar" aria-label="Route navigator"><div class="ex-route-map" data-ex-map="atlas" style="--ex-progress:0">${expeditionMap(rows, chapters[0].key)}</div>${expeditionControls(chapters[0].key, rows, true)}<p class="xs-small" data-ex-route-position>Chapter 1 of ${chapters.length}</p></aside><div class="ex-route-chapters">${chapters.map((chapter, i) => {
      const selection = expeditionRows(rows, chapter);
      return `<section class="ex-route-chapter" id="ex-${chapter.key}" aria-labelledby="ex-title-${chapter.key}" data-ex-route="${chapter.key}"><header><span>${k.number(i)}</span><div><h3 id="ex-title-${chapter.key}" tabindex="-1">${chapter.title}</h3><p>${chapter.brief}</p></div></header><div class="ex-route-records">${selection.map(p => `<article data-ex-project="${h.e(p.id)}"><h4>${label(p, h)}</h4>${p.description ? `<p>${h.e(excerpt(p.description, 270))}</p>` : ''}${tags(p.tags, h)}<div class="xs-actions">${projectLinks(p, h)}</div></article>`).join('')}${empty(selection, 'matching projects')}</div></section>`;
    }).join('')}</div></div>` });
  }
  function expeditionExperience(vm, h) {
    const rows = chronological(vm.experience);
    return section('experience', { title: 'Career waypoints', description: 'A chronology of roles, with locations as recorded.', className: 'ex-experience', body: `<ol class="ex-waypoints">${rows.map(r => `<li data-journey-record="${h.e(r.id)}"><div class="ex-waypoint-time">${icon('compass')}<span>${h.e(r.period || 'Undated record')}</span></div><div>${experienceBody(r, h)}</div></li>`).join('')}</ol>${empty(rows, 'experience records')}` });
  }
  function expeditionSkills(vm, h) {
    return section('skills', { title: 'Field guide to methods', description: 'Open a field entry for the tools, techniques and topics recorded in the CV.', className: 'ex-skills', body: `${k.skillsSearch({ placeholder: 'Search the field guide' })}<div class="ex-field-guide">${list(vm.skillGroups).map((g, i) => `<details class="record-skill-group"${i === 0 ? ' open' : ''}><summary><span>${h.e(g.name)}</span>${icon('compass')}</summary><div class="ex-guide-index">${list(g.groups).map(s => `<div class="record-skill-sub"><h3>${h.e(s.name)}</h3>${skillItems(s, h)}</div>`).join('')}</div></details>`).join('')}</div>` });
  }
  function mountExpedition(root, { signal, model, helpers: h }) {
    const rows = list(model.projects), sections = all(root, '[data-ex-route]');
    const heroMap = root.querySelector('[data-ex-map="hero"]'), atlas = root.querySelector('[data-ex-map="atlas"]');
    const buttons = all(root, '[data-ex-chapter]');
    const chapterNav = all(root, '.ex-route-sidebar [data-ex-jump]');
    const select = (map, key) => {
      const index = chapters.findIndex(chapter => chapter.key === key);
      map.style.setProperty('--ex-progress', index * 100 / (chapters.length - 1));
      all(map, '[data-ex-map-node]').forEach(node => { node.dataset.exActive = String(node.dataset.exMapNode === key); });
    };
    function route(key) {
      select(atlas, key);
      chapterNav.forEach(anchor => {
        if (anchor.dataset.exJump === key) anchor.setAttribute('aria-current', 'step');
        else anchor.removeAttribute('aria-current');
      });
      root.querySelector('[data-ex-route-position]').textContent = `Chapter ${chapters.findIndex(chapter => chapter.key === key) + 1} of ${chapters.length}`;
    }
    root.addEventListener('click', event => {
      const preview = event.target.closest('[data-ex-chapter]');
      const jump = event.target.closest('[data-ex-jump]');
      if (preview) {
        const key = preview.dataset.exChapter;
        select(heroMap, key);
        pressed(buttons, 'data-ex-chapter', key);
        root.querySelector('#ex-hero-preview').innerHTML = expeditionPreview(rows, chapters.find(chapter => chapter.key === key), h);
      }
      if (jump) {
        const key = jump.dataset.exJump;
        if (w.PortfolioStudio?.section === 'hero') w.PortfolioStudio.setSection('projects');
        route(key);
        // Give keyboard and assistive technology users the same chapter context as a pointer jump.
        root.querySelector(`#ex-title-${key}`)?.focus({ preventScroll: true });
      }
    }, { signal });
    const linked = chapters.find(chapter => w.location?.hash === `#ex-${chapter.key}`);
    if (linked) route(linked.key);
    if (w.IntersectionObserver) {
      const observer = new w.IntersectionObserver(entries => {
        const active = entries.filter(entry => entry.isIntersecting).sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
        if (active) route(active.target.dataset.exRoute);
      }, { rootMargin: '-22% 0px -57% 0px' });
      sections.forEach(node => observer.observe(node));
      signal.addEventListener('abort', () => observer.disconnect(), { once: true });
    }
  }

  const systemDirections = [
    { id: 'foundry', title: 'Foundry', family: 'Pipeline', defaultTheme: 'dark', focus: 'programming', description: 'A project graph with source, method and artifact stations.', hero: foundryHero, projects: foundryProjects, experience: foundryExperience, skills: foundrySkills, mount: mountFoundry },
    { id: 'runtime', title: 'Runtime', family: 'Desktop', defaultTheme: 'dark', focus: 'programming', description: 'A desktop workspace for opening and inspecting project files.', hero: runtimeHero, projects: runtimeProjects, experience: runtimeExperience, skills: runtimeSkills, mount: mountRuntime },
    { id: 'tensor', title: 'Tensor', family: 'Machine learning', defaultTheme: 'dark', focus: 'programming', description: 'An exploded stack of machine learning projects and methods.', hero: tensorHero, projects: tensorProjects, experience: tensorExperience, skills: tensorSkills, mount: mountTensor },
    { id: 'patchbay', title: 'Patchbay', family: 'Signal routing', defaultTheme: 'dark', focus: 'programming', description: 'A routing panel that connects skill terms to project records.', hero: patchHero, projects: patchProjects, experience: patchExperience, skills: patchSkills, mount: mountPatchbay },
    { id: 'prism', title: 'Prism', family: 'Configurator', defaultTheme: 'light', focus: 'all', description: 'An exploded assembly of biology, chemistry and computation.', hero: prismHero, projects: prismProjects, experience: prismExperience, skills: prismSkills, mount: mountPrism },
    { id: 'expedition', title: 'Expedition', family: 'Scrollytelling', defaultTheme: 'light', focus: 'all', description: 'A field atlas from biological questions to engineered tools.', hero: expeditionHero, projects: expeditionProjects, experience: expeditionExperience, skills: expeditionSkills, mount: mountExpedition },
  ];
  systemDirections.forEach(({ hero, projects, experience, skills, ...design }) => k.register({ ...design, renderers: { hero, projects, experience, skills } }));
})(window);
