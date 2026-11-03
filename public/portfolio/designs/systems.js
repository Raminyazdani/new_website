(function (w) {
  'use strict';
  const list = value => Array.isArray(value) ? value : [];
  const n = value => new Intl.NumberFormat('en').format(value);
  const counts = vm => [
    { key: 'projects', name: 'Projects', value: list(vm.projects).length },
    { key: 'experience', name: 'Positions', value: list(vm.experience).length },
    { key: 'publications', name: 'Publications', value: list(vm.publications).length },
    { key: 'education', name: 'Education', value: list(vm.education).length },
    { key: 'skills', name: 'Skills', value: list(vm.skillGroups).reduce((sum, group) => sum + list(group.groups).reduce((total, subgroup) => total + list(subgroup.items).length, 0), 0) },
    { key: 'certificates', name: 'Credentials', value: list(vm.certificates).length },
    { key: 'languages', name: 'Languages', value: list(vm.languages).length }
  ];
  const eyebrow = (text, h) => `<p class="ds-eyebrow">${h.e(text)}</p>`;
  const panel = (label, content, extra = '') => `<div class="ds-pane ${extra}"><div class="ds-pane-bar"><span aria-hidden="true" class="ds-pane-light"></span><span>${label}</span></div><div class="ds-pane-content">${content}</div></div>`;
  const heading = (_title, detail, h) => `<p class="ds-section-note">${h.e(detail)}</p>`;
  const nav = (h, extra = '') => `<nav class="ds-index ${extra}" aria-label="Portfolio files">${[['about', 'profile.md'], ['projects', 'projects/'], ['experience', 'experience/'], ['publications', 'publications/'], ['education', 'education/'], ['skills', 'skills/'], ['certificates', 'credentials/'], ['languages', 'languages/'], ['references', 'references/'], ['contact', 'contact/']].map(([id, label], i) => `<a href="#${id}"><span aria-hidden="true">${String(i + 1).padStart(2, '0')}</span>${h.e(label)}</a>`).join('')}</nav>`;
  const stats = (vm, h, extra = '') => `<div class="ds-counts ${extra}">${counts(vm).map(item => `<a href="#${item.key}"><strong>${n(item.value)}</strong><span>${h.e(item.name)}</span></a>`).join('')}</div>`;
  function collection(vm, h, k, layout, extra) {
    return `<div class="ds-collection ${extra || ''}">${k.projectCollection(vm, h, layout)}</div>`;
  }
  function photo(vm, h, k, label) {
    return `<div class="ds-photo">${k.portrait(vm, h)}<p class="ds-photo-label">${h.e(label)}</p></div>`;
  }
  function workflow(vm, h) {
    const stages = counts(vm).filter(item => ['projects', 'experience', 'publications', 'skills'].includes(item.key));
    return `<div class="ds-workflow"><p class="ds-eyebrow">Explore the record</p><ol>${stages.map((item, i) => `<li><a href="#${item.key}"><span class="ds-workflow-step">${String(i + 1).padStart(2, '0')}</span><b>${h.e(item.name)}</b><small>${n(item.value)} source records</small></a></li>`).join('')}</ol><p class="ds-note">An index of this portfolio. Each module opens the corresponding records below.</p></div>`;
  }
  function unitChart(vm, h) {
    return `<figure class="ds-unit-chart"><figcaption><b>Portfolio census</b><span>One dot = one source record</span></figcaption><div class="ds-unit-rows">${counts(vm).map((item, index) => `<a class="ds-unit-row ds-unit-${index}" href="#${item.key}" aria-label="${h.e(`${item.name}: ${n(item.value)} records`)}"><span class="ds-unit-label">${h.e(item.name)}<b>${n(item.value)}</b></span><span class="ds-unit-dots" aria-hidden="true">${Array.from({ length: item.value }, () => '<i></i>').join('')}</span></a>`).join('')}</div><p class="ds-note">Categories describe the supplied CV. Dot positions are a counting grid.</p></figure>`;
  }
  function categoryIndex(vm, h) {
    return `<div class="ds-category-index">${list(vm.skillGroups).map((group, i) => `<a href="#skills"><span class="ds-category-dot" aria-hidden="true">${String(i + 1).padStart(2, '0')}</span><b>${h.e(group.name)}</b><span>${n(list(group.groups).reduce((sum, subgroup) => sum + list(subgroup.items).length, 0))} skills</span></a>`).join('')}</div>`;
  }
  function jsonIdentity(vm, h) {
    const identity = vm.identity || {};
    return `<pre class="ds-json"><code>${h.e(JSON.stringify({ name: identity.name || '', givenName: identity.givenName || '', familyName: identity.familyName || '', roles: list(identity.roles), location: identity.location || '' }, null, 2))}</code></pre>`;
  }
  function schematic(vm, h) {
    const rows = counts(vm).slice(0, 4);
    return `<figure class="ds-schematic"><svg viewBox="0 0 600 310" role="img" aria-label="Portfolio schema: identity associated with project, position, publication and education collections"><g fill="none" stroke="currentColor" stroke-width="1.2"><path d="M30 30h540v250H30zM20 20h20m-10-10v20m540-10h20m-10-10v20M20 290h20m-10-10v20m540-10h20m-10-10v20"/><rect x="220" y="110" width="160" height="80"/><path d="M220 150H150V75H90m60 75v85H90m290-85h70V75h60m-60 75v85h60"/><rect x="45" y="50" width="110" height="50"/><rect x="45" y="210" width="110" height="50"/><rect x="445" y="50" width="110" height="50"/><rect x="445" y="210" width="110" height="50"/><path stroke-dasharray="4 5" d="M300 30v80m0 80v90"/><circle cx="300" cy="150" r="65" opacity=".3"/></g><g fill="currentColor" text-anchor="middle" font-family="ui-monospace,Consolas,monospace" font-size="12"><text x="300" y="146">identity</text><text x="300" y="166">normalized CV</text>${rows.map((item, i) => `<text x="${i < 2 ? 100 : 500}" y="${i % 2 === 0 ? 72 : 232}">${h.e(item.key)}</text><text x="${i < 2 ? 100 : 500}" y="${i % 2 === 0 ? 90 : 250}">${n(item.value)} records</text>`).join('')}</g></svg><figcaption><span>FIG. 01 / SOURCE COLLECTIONS</span><span>Schema diagram · no inferred relationships</span></figcaption></figure>`;
  }
  function register(definition) {
    w.PortfolioDesigns.register(definition);
  }

  register({
    id: 'pipeline', name: 'Research Pipeline', description: 'An editor workspace with a file explorer, source panes and a navigable record workflow.', family: 'systems', defaultTheme: 'dark', recordStyle: 'terminal', signature: 'Explorer rail / editor panes / record workflow',
    renderers: {
      hero(vm, h, k) {
        const content = `<div class="ds-editor"><aside class="ds-explorer"><p class="ds-eyebrow">Portfolio explorer</p>${nav(h)}<div class="ds-explorer-footer">SOURCE / NORMALIZED CV</div></aside><div class="ds-editor-main">${panel('profile.md', `<div class="ds-pipeline-intro"><div>${eyebrow('Research / code / practice', h)}${k.identity(vm, h)}${k.roles(vm, h)}${k.lead(vm, h)}${k.actions()}</div>${photo(vm, h, k, 'Profile image · CV source')}</div>`)}${workflow(vm, h)}</div></div>`;
        return k.section('hero', 'Research workspace', content, 'ds-system ds-pipeline ds-hero');
      },
      about(vm, h, k) {
        return k.section('about', 'Profile notebook', `${heading('Profile notebook', 'The biography and interests behind the work.', h)}${panel('about.md', k.about(vm, h))}<div class="ds-pipeline-status"><span>CV collections</span>${stats(vm, h)}</div>`, 'ds-system ds-pipeline ds-about');
      },
      projects(vm, h, k) {
        return k.section('projects', 'Project workspace', `${heading('Project workspace', 'Search the collection. Open a record to inspect its description and source links.', h)}${panel('projects / collection', collection(vm, h, k, 'row', 'ds-project-files'))}`, 'ds-system ds-pipeline ds-projects');
      },
      experience(vm, h, k) {
        return k.section('experience', 'Experience log', `${heading('Experience log', 'Roles, organizations and periods as supplied in the CV.', h)}${panel('experience / records', `<div class="ds-log-rows">${k.experienceRows(vm, h, 'log')}</div>`)}`, 'ds-system ds-pipeline ds-experience');
      }
    }
  });

  register({
    id: 'bento', name: 'Portfolio Dashboard', description: 'A modular dashboard of identity, live record counts and project previews in an asymmetric tile mosaic.', family: 'systems', defaultTheme: 'dark', recordStyle: 'unified', signature: 'Asymmetric tiles / real count dashboard / preview mosaic',
    renderers: {
      hero(vm, h, k) {
        return k.section('hero', 'Portfolio dashboard', `<div class="ds-bento-grid"><div class="ds-tile ds-bento-identity">${eyebrow('The portfolio / overview', h)}${k.identity(vm, h)}${k.roles(vm, h)}${k.actions()}</div><div class="ds-tile ds-bento-photo">${photo(vm, h, k, vm.identity?.name || 'Profile')}</div><div class="ds-tile ds-bento-summary">${eyebrow('In focus', h)}${k.lead(vm, h)}</div><div class="ds-tile ds-bento-numbers">${eyebrow('Collection overview', h)}${stats(vm, h)}</div></div>`, 'ds-system ds-bento ds-hero');
      },
      about(vm, h, k) {
        return k.section('about', 'Profile & interests', `${heading('Profile & interests', 'A closer look at the person and the areas of interest.', h)}<div class="ds-tile ds-bento-about">${k.about(vm, h)}</div>`, 'ds-system ds-bento ds-about');
      },
      projects(vm, h, k) {
        return k.section('projects', 'The project board', `${heading('The project board', 'Source previews, tools and ideas across the complete collection.', h)}${collection(vm, h, k, 'poster', 'ds-bento-mosaic')}`, 'ds-system ds-bento ds-projects');
      },
      experience(vm, h, k) {
        return k.section('experience', 'Journey tiles', `${heading('Journey tiles', 'Each tile preserves a complete position record.', h)}<div class="ds-bento-journey">${k.experienceRows(vm, h, 'cards')}</div>`, 'ds-system ds-bento ds-experience');
      }
    }
  });

  register({
    id: 'atlas-map', name: 'Record Atlas', description: 'An airy data atlas with a truthful record census, category index and catalogue layouts.', family: 'systems', defaultTheme: 'light', recordStyle: 'atlas', signature: 'Entity census / dot matrix / category index',
    renderers: {
      hero(vm, h, k) {
        return k.section('hero', 'A map of the work', `<div class="ds-atlas-layout"><div class="ds-atlas-copy">${eyebrow('A map of the work', h)}${k.identity(vm, h)}${k.roles(vm, h)}${k.lead(vm, h)}${k.actions()}<div class="ds-atlas-profile">${photo(vm, h, k, vm.identity?.location || 'Profile · CV source')}</div></div><div class="ds-atlas-chart">${unitChart(vm, h)}</div></div>`, 'ds-system ds-atlas ds-hero');
      },
      about(vm, h, k) {
        return k.section('about', 'Reading the atlas', `${heading('Reading the atlas', 'Biography, interests and the areas represented in the supplied skills.', h)}<div class="ds-atlas-about"><div>${k.about(vm, h)}</div><aside class="ds-atlas-key">${eyebrow('Skill domains / source categories', h)}${categoryIndex(vm, h)}</aside></div>`, 'ds-system ds-atlas ds-about');
      },
      projects(vm, h, k) {
        return k.section('projects', 'Project catalogue', `${heading('Project catalogue', 'Browse individual records. Tags are taken from the source.', h)}${collection(vm, h, k, 'card', 'ds-atlas-catalogue')}`, 'ds-system ds-atlas ds-projects');
      },
      experience(vm, h, k) {
        return k.section('experience', 'Position register', `${heading('Position register', 'Organizations and roles, with the original period labels.', h)}<div class="ds-atlas-register">${k.experienceRows(vm, h, 'ledger')}</div>`, 'ds-system ds-atlas ds-experience');
      }
    }
  });

  register({
    id: 'console', name: 'Record Console', description: 'A readable source inspector with native disclosure panels, a real identity JSON view and compact record shelves.', family: 'systems', defaultTheme: 'dark', recordStyle: 'terminal', signature: 'Native inspectors / actual identity JSON / compact shelves',
    renderers: {
      hero(vm, h, k) {
        return k.section('hero', 'Portfolio console', `<div class="ds-console-topline"><span>PORTFOLIO / RECORD CONSOLE</span><a href="#projects">Browse records ↘</a></div><div class="ds-console-layout"><div class="ds-console-copy">${eyebrow('Identity / overview', h)}${k.identity(vm, h)}${k.roles(vm, h)}${k.lead(vm, h)}${k.actions()}</div><div class="ds-console-inspector">${photo(vm, h, k, 'identity.avatarUrl')}<details class="ds-inspect" name="ds-console-identity" open><summary><span>Identity record</span><small>JSON</small></summary>${jsonIdentity(vm, h)}</details><details class="ds-inspect" name="ds-console-identity"><summary><span>Collection manifest</span><small>COUNTS</small></summary>${stats(vm, h)}</details></div></div>`, 'ds-system ds-console ds-hero');
      },
      about(vm, h, k) {
        return k.section('about', 'Profile inspector', `${heading('Profile inspector', 'Expand a section to read the source content.', h)}<details class="ds-inspect ds-inspect-large" open><summary><span>Biography & interests</span><small>PROFILE</small></summary><div class="ds-inspect-body">${k.about(vm, h)}</div></details>`, 'ds-system ds-console ds-about');
      },
      projects(vm, h, k) {
        return k.section('projects', 'Project records', `${heading('Project records', 'Filter the source records, then open any entry for full details.', h)}<div class="ds-console-shelf">${collection(vm, h, k, 'compact', 'ds-console-projects')}</div>`, 'ds-system ds-console ds-projects');
      },
      experience(vm, h, k) {
        return k.section('experience', 'Position records', `${heading('Position records', 'Inspect the complete role descriptions and tags.', h)}<div class="ds-console-positions">${k.experienceRows(vm, h, 'console')}</div>`, 'ds-system ds-console ds-experience');
      }
    }
  });

  register({
    id: 'blueprint', name: 'Portfolio Blueprint', description: 'A drafting sheet with annotated identity, source-count schematics and technical record schedules.', family: 'systems', defaultTheme: 'light', recordStyle: 'unified', signature: 'Drafting grid / annotated portrait / collection schematic',
    renderers: {
      hero(vm, h, k) {
        return k.section('hero', 'Portfolio blueprint', `<div class="ds-blueprint-sheet"><div class="ds-drawing-header"><span>PORTFOLIO / GENERAL ARRANGEMENT</span><span>SOURCE: NORMALIZED CV</span></div><div class="ds-blueprint-hero"><div class="ds-blueprint-copy">${eyebrow('01 / identity', h)}${k.identity(vm, h)}${k.roles(vm, h)}${k.lead(vm, h)}${k.actions()}</div><div class="ds-blueprint-photo"><span class="ds-dimension ds-dimension-top">PROFILE IMAGE</span>${photo(vm, h, k, vm.identity?.name || 'Identity')}<span class="ds-dimension ds-dimension-side" aria-hidden="true">A — A</span></div></div><div class="ds-title-block"><span>DRAWING 01</span><b>Identity & practice</b><span>CV-backed portfolio</span></div></div>`, 'ds-system ds-blueprint ds-hero');
      },
      about(vm, h, k) {
        return k.section('about', 'Profile specifications', `${heading('Profile specifications', 'Biography and interests, with a diagram of the source collections.', h)}<div class="ds-blueprint-about"><div class="ds-specification">${eyebrow('02 / profile notes', h)}${k.about(vm, h)}</div>${schematic(vm, h)}</div>`, 'ds-system ds-blueprint ds-about');
      },
      projects(vm, h, k) {
        return k.section('projects', 'Project schedule', `${heading('Project schedule', 'Source previews and complete records arranged as technical sheets.', h)}<div class="ds-drawing-header"><span>SCHEDULE P / PROJECT COLLECTION</span><span>${n(list(vm.projects).length)} RECORDS</span></div>${collection(vm, h, k, 'card', 'ds-blueprint-projects')}`, 'ds-system ds-blueprint ds-projects');
      },
      experience(vm, h, k) {
        return k.section('experience', 'Position schedule', `${heading('Position schedule', 'Role, organization, period and notes from each source entry.', h)}<div class="ds-drawing-header"><span>SCHEDULE E / EXPERIENCE</span><span>${n(list(vm.experience).length)} RECORDS</span></div><div class="ds-blueprint-positions">${k.experienceRows(vm, h, 'schedule')}</div>`, 'ds-system ds-blueprint ds-experience');
      }
    }
  });
})(window);
