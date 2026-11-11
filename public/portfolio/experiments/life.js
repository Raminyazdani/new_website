(function (w) {
  'use strict';
  const k = w.PortfolioExperiences;
  if (!k) return;
  const { list, excerpt } = k;
  const clamp = (n, a = 0, b = 1) => Math.max(a, Math.min(b, n));
  const seq = i => String(i + 1).padStart(2, '0');
  const round = n => Number(n.toFixed(2));
  const tau = Math.PI * 2;
  const locus = (x, y, a, b) => `--x:${x}%;--y:${y}%;--a:${a}%;--b:${b}%`;
  const arrow = '<svg viewBox="0 0 20 20" width="18" height="18" aria-hidden="true"><path d="M4 10h11m-5-5 5 5-5 5" fill="none" stroke="currentColor" stroke-width="1.5"/></svg>';
  const plus = '<svg viewBox="0 0 16 16" width="16" height="16" aria-hidden="true"><path d="M2 8h12M8 2v12" fill="none" stroke="currentColor" stroke-width="1.3"/></svg>';
  const more = '<p data-project-empty hidden>No projects match your search.</p><button type="button" class="lf-button lf-project-more" data-project-more hidden>Show more projects</button>';
  const tags = (p, h) => `<div class="lf-tags">${h.chips(list(p?.tags), 99)}</div>`;
  const photo = (vm, h, cls = '') => h.portrait(vm.identity || {}, `lf-portrait ${cls}`);
  const name = (vm, h, cls = '') => `<h1 id="xp-hero-title" class="lf-name ${cls}">${vm.identity?.givenName && vm.identity?.familyName ? `<span>${h.e(vm.identity.givenName)}</span> <span>${h.e(vm.identity.familyName)}</span>` : h.e(vm.identity?.name || 'Portfolio')}</h1>`;
  const section = (id, title, description, body, cls) => k.section(id, { title, description, body, className: `lf-section ${cls || ''}` });
  const hero = (id, body) => section('hero', '', '', body, `lf-hero lf-${id}-hero`);
  const roles = (vm, h) => `<div class="lf-role-strip">${list(vm.identity?.roles).map(r => `<span>${h.e(r)}</span>`).join('')}</div>`;
  const cta = (href, label, cls = '') => `<a class="lf-link ${cls}" href="${href}">${label}${arrow}</a>`;
  const action = (p, h, label = 'Open project record') => `<button type="button" class="lf-link" data-open-project="${h.e(p.id)}">${label}${arrow}</button>`;
  const tools = (vm, h, text) => k.projectTools(vm, h, { placeholder: text });
  const projectAttrs = (p, h) => `data-project-card data-project-id="${h.e(p.id)}"`;
  const description = (p, h, max) => p?.description ? `<p class="lf-description">${h.e(max ? excerpt(p.description, max) : p.description)}</p>` : '';
  const statuses = (text = '') => `<p class="lf-sr" data-lf-status role="status">${text}</p>`;
  const notAvailable = (label) => `<p class="lf-empty">No ${label} records are listed.</p>`;

  function selectedProject(p, h, label = 'Open project record') {
    return p ? `<h3>${h.e(p.title)}</h3>${description(p,h,200)}${tags({tags:list(p.tags).slice(0,5)},h)}${action(p,h,label)}` : notAvailable('project');
  }
  function roleCopy(r, h, detailLabel) {
    return `<h3>${h.e(r.title)}</h3>${r.organization || r.location ? `<p class="lf-role-org">${[r.organization, r.location].filter(Boolean).map(h.e).join(' · ')}</p>` : ''}${r.description || list(r.tags).length ? `<details><summary>${detailLabel}</summary>${description(r,h)}${tags(r,h)}</details>` : ''}${r.url || r.profileUrl ? `<div class="lf-record-links">${r.url ? h.link(r.url,'Experience source') : ''}${r.profileUrl ? h.link(r.profileUrl,'Related profile') : ''}</div>` : ''}`;
  }
  function roleRows(vm, h, cls, label, variant = 'default') {
    const rows = k.chronological(list(vm.experience));
    const labels = { biology: 'Life sciences', chemistry: 'Chemistry', programming: 'Computing', both: 'Interdisciplinary', other: 'Other records' };
    return rows.length ? `<ol class="lf-role-list ${cls}">${rows.map((r,i) => {
      const domain = k.classify(r);
      const period = r.period ? `<span class="lf-period">${h.e(r.period)}</span>` : '';
      const copy = roleCopy(r,h,label);
      const idx = `<span aria-hidden="true" class="lf-role-index">${seq(i)}</span>`;
      const content = variant === 'tray' ? `<div class="lf-artifact-tab">${idx}${period}</div><div class="lf-artifact-card">${copy}</div>` :
        variant === 'braid' ? `<div class="lf-braid-axis">${period}<small>${h.e(labels[domain] || labels.other)}</small></div><div class="lf-role-copy">${copy}</div>` :
        variant === 'rings' ? `<span class="lf-ring-node" aria-hidden="true"></span><div class="lf-role-copy">${period}${copy}</div>` :
        variant === 'protocol' ? `${idx}<div class="lf-protocol-when">${period}</div><div class="lf-role-copy">${copy}</div>` :
        variant === 'reaction' ? `<div class="lf-reaction-node">${idx}</div><div class="lf-role-copy">${period}${copy}</div>` :
        `<div class="lf-branch-date">${period}</div><div class="lf-role-copy">${copy}</div>`;
      return `<li data-journey-record="${h.e(r.id)}" data-lf-domain="${h.e(domain)}">${content}</li>`;
    }).join('')}</ol>` : notAvailable('experience');
  }
  function skillRecord(item, h) {
    return `<li data-skill-item="${h.e(item.id)}"><span>${h.e(item.name || item.shortName)}${item.name && item.shortName && item.name !== item.shortName ? ` <small>(${h.e(item.shortName)})</small>` : ''}</span>${list(item.tags).length ? `<details><summary>Source topics</summary>${tags(item,h)}</details>` : ''}</li>`;
  }
  function skillGroup(group, index, h, variant) {
    const groups = list(group.groups);
    const total = groups.reduce((n,sub) => n + list(sub.items).length, 0);
    const prefix = variant === 'matrix' || variant === 'drawer' ? `<span class="lf-skill-index" aria-hidden="true">${seq(index)}</span>` : '';
    return `<details class="record-skill-group lf-skill-domain" data-syn-disclosure="${h.e(group.id)}"${index === 0 ? ' open' : ''}><summary>${prefix}<strong>${h.e(group.name)}</strong><span class="lf-skill-count">${h.number(total)} ${total === 1 ? 'skill' : 'skills'}</span>${plus}</summary><div class="lf-skill-subgroups">${groups.map(sub => `<div class="record-skill-sub lf-skill-sub"><h3>${h.e(sub.name)}</h3><ul>${list(sub.items).map(x => skillRecord(x,h)).join('')}</ul></div>`).join('')}</div></details>`;
  }
  function skills(vm,h,id,title,copy,variant,extra='') {
    const groups = list(vm.skillGroups);
    return section('skills',title,copy,`${k.skillsSearch({placeholder:'Find a method or tool'})}${extra}${groups.length ? `<div class="lf-skill-groups lf-${variant}-skills">${groups.map((g,i) => skillGroup(g,i,h,variant)).join('')}</div><p class="lf-empty" data-skill-empty hidden>No skills match your search.</p>` : notAvailable('skill')}`, `lf-${id}-skills`);
  }

  // Deterministic paths represent the surface of one continuous stylized tissue volume.
  function irregular(cx, cy, r, seed, ratio = 1) {
    const points = Array.from({length:12}, (_,i) => {
      const a = i*tau/12;
      const n = r * (1 + .16*Math.sin(i*2.4+seed) + .11*Math.cos(i*1.7+seed*.8));
      return [round(cx + Math.cos(a)*n), round(cy + Math.sin(a)*n*ratio)];
    });
    const mid = (p,q) => [round((p[0]+q[0])/2),round((p[1]+q[1])/2)].join(' ');
    return `M${mid(points[11],points[0])}` + points.map((p,i) => `Q${p.join(' ')} ${mid(p,points[(i+1)%12])}`).join('')+'Z';
  }
  function tissueField() {
    const contours = [
      'M-34 238C125 230 171 63 315 47S459 167 567 130s114-148 293-133L875 406C736 361 740 543 574 550S412 431 287 494 105 570-21 497Z',
      'M-32 287C102 307 206 82 348 109s115 122 243 62S752 40 899 93L852 427c-94-60-163 90-279 72s-150-112-276-60S129 537-30 449Z',
      'M-31 366C106 414 220 152 372 177s126 90 252 17S786 113 892 153l-28 221c-156 25-166 100-282 75s-154-83-256-39S109 494-31 433Z'
    ];
    const cells = (layer) => Array.from({length:39},(_,i) => {
      const x = 19+(i*53.7 + 41*layer)%809, y = 298+96*Math.sin(i*1.91+layer)+67*Math.sin(x/143+layer*.54);
      const r = 13+(i*7%23);
      return `<path d="${irregular(x,y,r,i+layer,r%5*.08+.62)}"/><path class="lf-tissue-nucleus" d="${irregular(x+r*.13,y-r*.12,r*.25,i+.5,.78)}"/>`;
    }).join('');
    return `<svg class="lf-tissue-svg" viewBox="0 0 820 560" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
      <defs><radialGradient id="lf-optical-field"><stop offset="0" stop-color="var(--lf-field-1)"/><stop offset=".78" stop-color="var(--lf-field-2)"/><stop offset="1" stop-color="var(--lf-field-3)"/></radialGradient></defs>
      <rect width="820" height="560" fill="url(#lf-optical-field)"/>
      <g class="lf-tissue-guides"><circle cx="410" cy="280" r="254"/><circle cx="410" cy="280" r="205"/><path d="M410 14v33m0 466v33M30 280h34m692 0h34M393 280h34m-17-17v34"/></g>
      ${contours.map((path,i) => `<g class="lf-tissue-layer" data-lf-layer="${i}" style="opacity:${[.91,.51,.3][i]}"><path class="lf-tissue-contour" d="${path}"/><g class="lf-tissue-cells">${cells(i)}</g></g>`).join('')}
      <g class="lf-tissue-guides"><path d="M37 514h57m-57-5v10m57-10v10M724 44h48m0 0v48M48 82V44h44M724 518h48v-48"/><circle cx="410" cy="280" r="8"/></g></svg>`;
  }
  const tissuePlanes = ['Surface layer','Middle layer','Deep layer'];
  function tissueHero(vm,h) {
    return hero('tissue',`<div class="lf-tissue-stage">
      <figure class="lf-scope"><div class="lf-scope-field">${tissueField()}<div class="lf-scope-id" aria-hidden="true">Optical field / 01</div></div><figcaption>Conceptual tissue cross-section</figcaption></figure>
      <div class="lf-scope-side"><div class="lf-scope-ident">${name(vm,h)}<p>Life sciences in focus</p></div>
      <div class="lf-scope-console"><div class="lf-scope-metadata"><span>Specimen inspector</span>${photo(vm,h,'lf-optical-portrait')}</div>
      <p>Move through one cross-section to bring its tissue layers into focus.</p>
      <label class="lf-range-label" for="lf-tissue-focus">Focal plane <output for="lf-tissue-focus" data-lf-plane>${tissuePlanes[0]}</output></label><input id="lf-tissue-focus" data-lf-tissue-focus type="range" min="0" max="2" step=".01" value="0" aria-valuetext="${tissuePlanes[0]}">
      <div class="lf-plane-keys">${tissuePlanes.map((t,i) => `<button type="button" data-lf-plane-key="${i}" aria-pressed="${i===0}">${t.split(' ')[0]}</button>`).join('')}</div></div>
      ${cta('#projects','Browse specimen slides')}</div></div>`);
  }
  function slideArt(i) {
    return `<svg viewBox="0 0 250 85" aria-hidden="true"><rect x="2" y="2" width="246" height="81" rx="6"/><path d="M41 4v77m163-77v77"/><circle cx="123" cy="42" r="33"/>${Array.from({length:6},(_,j) => `<path d="${irregular(123+Math.sin(j*2.41)*24,42+Math.cos(j*2.41)*20,7+(j+i)%6,j+i,.72)}"/>`).join('')}</svg>`;
  }
  function tissueProjects(vm,h) {
    return section('projects','Specimen slides','Look up a project, then open its record from the slide tray.',`${tools(vm,h,'Find a specimen by project or topic')}<div class="lf-slide-tray">${list(vm.projects).map((p,i) => `<article class="lf-slide" ${projectAttrs(p,h)}><div class="lf-slide-glass">${slideArt(i)}<span>Slide ${seq(i)}</span></div><div><h3>${h.e(p.title)}</h3>${description(p,h,132)}${action(p,h,'Inspect slide')}</div></article>`).join('')}</div>${more}`,'lf-tissue-work');
  }
  function mountTissue(root,{signal}) {
    const range = root.querySelector('[data-lf-tissue-focus]');
    if (!range) return;
    const output = root.querySelector('[data-lf-plane]');
    const layers = [...root.querySelectorAll('[data-lf-layer]')];
    const buttons = [...root.querySelectorAll('[data-lf-plane-key]')];
    const update = () => {
      const p = Number(range.value), i = Math.round(p);
      layers.forEach((g,j) => {
        const delta = j-p, distance = Math.abs(delta);
        g.style.transform = `translate(${round(delta*21)}px,${round(delta*-14)}px) scale(${round(1+delta*.067)})`;
        g.style.opacity = String(clamp(.95-distance*.35,.22,.95));
        g.style.filter = `blur(${round(distance*1.35)}px)`;
      });
      output.textContent = tissuePlanes[i];
      const low=Math.floor(p), fraction=Math.round((p-low)*100);
      range.setAttribute('aria-valuetext',fraction ? `${tissuePlanes[low]}, ${fraction}% toward the ${tissuePlanes[low+1].toLowerCase()}` : tissuePlanes[i]);
      buttons.forEach((b,j) => b.setAttribute('aria-pressed',String(i===j)));
    };
    range.addEventListener('input',update,{signal});
    buttons.forEach((b,i) => b.addEventListener('click',() => {range.value = i; update();},{signal}));
    update();
  }

  // Map geometry is editorial; the pinned labels and details come from real project records.
  const culturePositions = [[24,31,22,29],[57,28,64,24],[76,52,81,51],[54,69,55,77],[21,66,17,71],[80,78,85,85]];
  const cultureRoutes = ['M157 135C205 75 275 89 303 134s-18 111-69 116-134-52-77-115Z','M423 95c69-58 130-30 145 20s-8 92-86 98c-79 7-122-59-59-118Z','M557 212c51-36 106-32 137 26s4 122-59 124-115-92-78-150Z','M342 331c17-57 90-63 145-36s57 97-6 128-156-35-139-92Z','M105 303c44-47 135-46 158 12s-21 109-95 98S65 345 105 303Z','M615 367c44-35 99-30 123 20s-4 91-53 94-116-78-70-114Z'];
  const featuredCulture = vm => list(vm.projects).slice(0,culturePositions.length);
  function colonyArt(count) {
    return `<svg class="lf-culture-svg" viewBox="0 0 820 520" aria-hidden="true"><defs><pattern id="lf-culture-mark" patternUnits="userSpaceOnUse" width="22" height="22"><circle cx="3" cy="3" r=".95" fill="var(--lf-line)"/></pattern></defs><path class="lf-culture-soil" d="M105 180c37-92 99-119 218-124s198-61 298 19S752 233 758 331s-8 168-162 154-160-3-283 8S74 438 69 331s-2-59 36-151Z"/><path fill="url(#lf-culture-mark)" d="M105 180c37-92 99-119 218-124s198-61 298 19S752 233 758 331s-8 168-162 154-160-3-283 8S74 438 69 331s-2-59 36-151Z"/>
      <g class="lf-culture-filaments"><path d="M181 175C274 140 380 161 465 146s101 19 159 117-103 89-175 105-181-31-267-15m267 15c69-1 160 10 220 46m-488-239c71 25 139 129 86 147"/></g>
      ${cultureRoutes.slice(0,count).map((path,i) => {
        const [x,y] = culturePositions[i], cx=x*8.2,cy=y*5.2;
        return `<g data-lf-colony="${i}"${i===0?' class="is-active"':''}><path class="lf-colony-shell" d="${path}"/>${Array.from({length:28},(_,j) => {
          const r=10+j*1.65, a=j*2.399;
          return `<circle cx="${round(cx+Math.cos(a)*r*1.55)}" cy="${round(cy+Math.sin(a)*r*.91)}" r="${round(1.5+(j*3+i)%7*.66)}"/>`;
        }).join('')}</g>`;
      }).join('')}</svg>`;
  }
  function cultureHero(vm,h) {
    const rows=featuredCulture(vm);
    return hero('culture',`<div class="lf-culture-stage"><header class="lf-culture-identity">${name(vm,h)}<p>Research has a habitat.</p>${photo(vm,h,'lf-culture-portrait')}</header><div class="lf-culture-map">
      ${colonyArt(rows.length)}${rows.map((p,i) => `<button class="lf-map-pin" type="button" data-lf-culture="${i}" aria-label="Cluster ${seq(i)}: ${h.e(p.title)}" aria-pressed="${i===0}" aria-controls="lf-culture-inspector" style="${locus(...culturePositions[i])}"><span>${seq(i)}</span></button>`).join('')}
      <span class="lf-map-key" aria-hidden="true">Choose a cluster</span></div><aside class="lf-culture-inspector" id="lf-culture-inspector"><div data-lf-culture-record>${selectedProject(rows[0],h,'Read project')}</div>${cta('#projects','Explore every project')}</aside></div>
      <div class="lf-culture-caption"><span>Conceptual habitat map · clusters open project records</span>${statuses()}</div>`);
  }
  function cultureProjects(vm,h) {
    return section('projects','Project habitats','The map above opens individual projects; this collection includes every record.',`${tools(vm,h,'Search the project habitats')}<div class="lf-habitat-banks">${list(vm.projects).map((p,i) => `<article class="lf-habitat" ${projectAttrs(p,h)}><div class="lf-habitat-origin" aria-hidden="true"><svg viewBox="0 0 140 110">${[39,29,17].map((r,j) => `<path d="${irregular(70,54,r,i+j*.3,.83)}"/>`).join('')}</svg><span>${seq(i)}</span></div><div><h3>${h.e(p.title)}</h3>${description(p,h,210)}${tags(p,h)}${action(p,h,'Enter project')}</div></article>`).join('')}</div>${more}`,'lf-culture-work');
  }
  function cultureExperience(vm,h) {
    return section('experience','Growth rings','The sequence follows the dates listed in the CV.',`<div class="lf-growth-plot"><svg viewBox="0 0 480 480" aria-hidden="true">${Array.from({length:11},(_,i) => `<path d="${irregular(237,245,44+i*17,i*.12,.92)}"/>`).join('')}</svg>${roleRows(vm,h,'lf-growth-chronology','Read experience','rings')}</div>`,'lf-culture-journey');
  }
  function mountCulture(root,{signal,model,helpers:h}) {
    const rows=featuredCulture(model), record=root.querySelector('[data-lf-culture-record]');
    const pins=[...root.querySelectorAll('[data-lf-culture]')], colonies=[...root.querySelectorAll('[data-lf-colony]')];
    const status=root.querySelector('[data-lf-status]');
    pins.forEach((button,i) => button.addEventListener('click',() => {
      pins.forEach((p,j) => p.setAttribute('aria-pressed',String(i===j)));
      colonies.forEach((g,j) => g.classList.toggle('is-active',i===j));
      record.innerHTML=selectedProject(rows[i],h,'Read project');
      status.textContent=rows[i].title;
    },{signal}));
  }

  function chromatogramLanes(vm) {
    const rows=list(vm.projects), topics=new Map();
    rows.forEach(p => list(p.tags).filter(Boolean).forEach(topic => {
      if (!topics.has(topic)) topics.set(topic,[]);
      if (!topics.get(topic).some(r => r.id===p.id)) topics.get(topic).push(p);
    }));
    const lanes=[...topics].slice(0,7).map(([title,projects]) => ({title,projects,topic:title}));
    return lanes.length ? lanes : rows.slice(0,7).map(p => ({title:p.title,projects:[p],topic:''}));
  }
  function separationTrace(n, active) {
    const x = i => 48+(i+.5)*922/Math.max(1,n);
    const curve = (variant) => Array.from({length:345},(_,j) => {
      const dx=48+j*922/344;
      let y=247 + variant*12 + 2.2*Math.sin(j*.17+variant);
      for (let i=0;i<n;i++) {
        const shift= x(i) + (variant ? 6 : -6), width=8+(i*5%7);
        y-=(38+(i*29%89))*(variant ? .43 : 1)*Math.exp(-Math.pow((dx-shift)/width,2));
        y-= (18+(i*7%34))*Math.exp(-Math.pow((dx-shift-21)/(width*.65),2));
      }
      return `${j?'L':'M'}${round(dx)} ${round(y)}`;
    }).join(' ');
    return `<svg viewBox="0 0 1018 292" preserveAspectRatio="none" class="lf-trace" aria-hidden="true"><defs><pattern id="lf-trace-grid" width="20" height="20" patternUnits="userSpaceOnUse"><path d="M20 0H0v20"/></pattern></defs><rect x="48" y="32" width="922" height="229" fill="url(#lf-trace-grid)"/>
      ${Array.from({length:n},(_,i) => `<rect class="lf-trace-slot${i===active?' is-active':''}" data-lf-trace-slot="${i}" x="${round(48+i*922/Math.max(1,n))}" y="32" width="${round(922/Math.max(1,n))}" height="229"/>`).join('')}
      <path class="lf-trace-base" d="M48 32v229h922"/><path class="lf-trace-secondary" d="${curve(1)}"/><path class="lf-trace-primary" d="${curve(0)}"/>${n ? `<path class="lf-trace-head" data-lf-trace-head d="M${x(0)} 17V271"/><circle class="lf-trace-marker" data-lf-trace-marker cx="${x(0)}" cy="18" r="5"/>` : ''}</svg>`;
  }
  function laneRecord(lane,h) {
    if (!lane) return notAvailable('project');
    const n=lane.projects.length;
    return `<div><p class="lf-mono">Selected topic · ${h.number(n)} ${n===1?'project':'projects'}</p><h3>${h.e(lane.title)}</h3></div><div class="lf-trace-record-links">${lane.projects.slice(0,2).map(p => action(p,h,h.e(p.title))).join('')}${lane.topic ? `<a href="#projects" class="lf-link" data-lf-apply-lane="${h.e(lane.topic)}">Filter projects by topic${arrow}</a>` : ''}</div>`;
  }
  function chromatogramHero(vm,h) {
    const lanes=chromatogramLanes(vm);
    return hero('chromatogram',`<div class="lf-chroma-title"><div>${name(vm,h)}<p>Chemistry, by method and topic.</p></div>${photo(vm,h,'lf-chroma-portrait')}</div><figure class="lf-chroma-instrument"><div class="lf-chroma-head"><span class="lf-mono">Topic trace</span><span>Illustrative curves · no measured data</span></div>
    ${separationTrace(lanes.length,0)}${lanes.length ? `<div class="lf-chroma-lanes" style="--lanes:${lanes.length}">${lanes.map((lane,i) => `<button type="button" data-lf-lane="${i}" aria-label="${h.e(lane.title)}" aria-pressed="${i===0}"><span>${seq(i)}</span><span class="lf-lane-title">${h.e(lane.title)}</span></button>`).join('')}</div>
    <label for="lf-chroma-range" class="lf-range-label">Reading head <output for="lf-chroma-range" data-lf-lane-value>${h.e(lanes[0].title)}</output></label><input id="lf-chroma-range" data-lf-lane-range type="range" min="0" max="${lanes.length-1}" step="1" value="0" aria-valuetext="${h.e(lanes[0].title)}"${lanes.length===1?' disabled':''}>` : ''}
    <figcaption data-lf-lane-record>${laneRecord(lanes[0],h)}</figcaption>${statuses()}</figure>`);
  }
  function chromatogramProjects(vm,h) {
    return section('projects','Laboratory runs','Project records arranged as lanes. Topic labels are taken from each record.',`${tools(vm,h,'Find a run by method or project')}<div class="lf-run-heading" aria-hidden="true"><span>Run</span><span>Project</span><span>Topics</span><span>Record</span></div><div class="lf-run-table">${list(vm.projects).map((p,i) => `<article class="lf-run-row" ${projectAttrs(p,h)}><span class="lf-run-number">${seq(i)}</span><h3>${h.e(p.title)}</h3>${tags(p,h)}${action(p,h,'Read run')}</article>`).join('')}</div>${more}`,'lf-chroma-work');
  }
  function mountChromatogram(root,{signal,model,helpers:h}) {
    const lanes=chromatogramLanes(model), range=root.querySelector('[data-lf-lane-range]');
    if (!range) return;
    const panels=[...root.querySelectorAll('[data-lf-trace-slot]')], keys=[...root.querySelectorAll('[data-lf-lane]')];
    const head=root.querySelector('[data-lf-trace-head]'), marker=root.querySelector('[data-lf-trace-marker]');
    const output=root.querySelector('[data-lf-lane-value]'), record=root.querySelector('[data-lf-lane-record]'), status=root.querySelector('[data-lf-status]');
    let current=0;
    const select = i => {
      if (!lanes[i] || i===current) return;
      current=i;
      const x=48+(i+.5)*922/lanes.length;
      range.value=i;
      head.setAttribute('d',`M${x} 17V271`);
      marker.setAttribute('cx',String(x));
      keys.forEach((b,j) => b.setAttribute('aria-pressed',String(i===j)));
      panels.forEach((p,j) => p.classList.toggle('is-active',i===j));
      output.textContent=lanes[i].title;
      range.setAttribute('aria-valuetext',lanes[i].title);
      record.innerHTML=laneRecord(lanes[i],h);
      status.textContent=lanes[i].title;
    };
    range.addEventListener('input',() => select(Number(range.value)),{signal});
    keys.forEach((button,i) => button.addEventListener('click',() => select(i),{signal}));
    record.addEventListener('click',event => {
      const topic=event.target.closest('[data-lf-apply-lane]')?.dataset.lfApplyLane;
      const filter=root.querySelector('[data-project-filter]');
      if (!topic || !filter) return;
      const search=root.querySelector('[data-project-search]');
      if (search) search.value='';
      filter.value=topic;
      // Use the existing filter event to reset pagination along with the topic.
      filter.dispatchEvent(new w.Event('change',{bubbles:true}));
    },{signal});
  }

  const residuePositions = [[18,42,13,43],[38,25,35,22],[57,45,58,48],[79,24,83,19],[82,66,86,68],[49,74,47,77]];
  function residueRecords(vm) {
    const projects=list(vm.projects), papers=list(vm.publications);
    const mix = [
      [projects[0], 'project'], [papers[0], 'publication'], [projects[1], 'project'],
      [projects[2], 'project'], [papers[1], 'publication'], [projects[3], 'project']
    ];
    return mix.filter(([record]) => record);
  }
  function residueArt(rows) {
    const coords=residuePositions.slice(0,rows.length).map(([x,y]) => [x*7.8,y*5.2]);
    const skeleton=[[0,1],[1,2],[2,3],[2,4],[2,5],[0,5],[1,4]];
    return `<svg viewBox="0 0 780 520" class="lf-residue-art" aria-hidden="true"><defs>
      <radialGradient id="lf-residue-pearl" cx=".31" cy=".22" r=".83"><stop stop-color="var(--lf-pearl-hi)"/><stop offset=".47" stop-color="var(--lf-pearl-mid)"/><stop offset="1" stop-color="var(--lf-pearl-low)"/></radialGradient>
      <linearGradient id="lf-residue-bond"><stop stop-color="var(--lf-bond-hi)"/><stop offset=".48" stop-color="var(--lf-bond-mid)"/><stop offset="1" stop-color="var(--lf-bond-lo)"/></linearGradient></defs>
      <ellipse class="lf-residue-orbit" cx="390" cy="260" rx="325" ry="150" transform="rotate(-13 390 260)"/>
      <ellipse class="lf-residue-orbit" cx="390" cy="260" rx="315" ry="169" transform="rotate(21 390 260)"/>
      <g class="lf-residue-bonds">${skeleton.filter(([i,j]) => coords[i] && coords[j]).map(([i,j]) => `<path d="M${coords[i].join(' ')}L${coords[j].join(' ')}"/>`).join('')}</g>
      ${coords.map(([x,y],i) => `<g data-lf-bond-node="${i}"${i===0?' class="is-active"':''}><circle class="lf-residue-node-ring" cx="${x}" cy="${y}" r="${[46,38,71,39,34,49][i]}"/><circle class="lf-residue-pearl" cx="${x}" cy="${y}" r="${[31,22,51,23,19,32][i]}"/><circle class="lf-residue-specular" cx="${x-6}" cy="${y-8}" r="${[5,3,8,3,3,5][i]}"/></g>`).join('')}
      <path class="lf-residue-orbit" d="M394 44h38m-19-19v38M73 376h28m-14-14v28m596-273h26m-13-13v26"/></svg>`;
  }
  function residueRecord(row,h) {
    if (!row) return notAvailable('research');
    const [p,kind]=row;
    if (kind==='project') return `<p class="lf-mono">Project record</p>${selectedProject(p,h)}`;
    return `<p class="lf-mono">${[p.kind || 'Research record',p.year].filter(Boolean).map(h.e).join(' · ')}</p><h3>${h.e(p.title)}</h3>${p.venue ? `<p>${h.e(p.venue)}</p>` : ''}${p.notes ? `<p>${h.e(excerpt(p.notes,170))}</p>` : ''}<div class="lf-record-links">${p.url ? h.link(p.url,'Open publication source','lf-link') : ''}${cta('#publications','Browse bibliography')}</div>`;
  }
  function residueHero(vm,h) {
    const rows=residueRecords(vm);
    return hero('residue',`<div class="lf-residue-layout"><header class="lf-residue-heading">${name(vm,h)}<p>At the molecular scale.</p>${photo(vm,h,'lf-residue-portrait')}</header>
      <figure class="lf-residue-field"><div class="lf-residue-board">${residueArt(rows)}${rows.map(([p,kind],i) => `<button type="button" class="lf-bond-button" data-lf-bond="${i}" style="${locus(...residuePositions[i])}" aria-label="${h.e(kind+' '+seq(i)+': '+p.title)}" aria-pressed="${i===0}" aria-controls="lf-residue-inspector">${seq(i)}</button>`).join('')}</div><figcaption>Conceptual connections between portfolio records.</figcaption></figure>
      <aside class="lf-residue-inspector" id="lf-residue-inspector"><div data-lf-residue-record>${residueRecord(rows[0],h)}</div>${statuses()}</aside></div>`);
  }
  function residueProjects(vm,h) {
    return section('projects','Bond index','Open any project from the index to read its methods, context and sources.',`${tools(vm,h,'Find a project or method')}<div class="lf-bond-index">${list(vm.projects).map((p,i) => `<article class="lf-bond-entry" ${projectAttrs(p,h)}><div class="lf-bond-end" aria-hidden="true"><span>${seq(i)}</span></div><div><h3>${h.e(p.title)}</h3>${description(p,h,156)}${tags(p,h)}</div>${action(p,h,'Open record')}</article>`).join('')}</div>${more}`,'lf-residue-work');
  }
  function mountResidue(root,{signal,model,helpers:h}) {
    const rows=residueRecords(model), target=root.querySelector('[data-lf-residue-record]');
    const buttons=[...root.querySelectorAll('[data-lf-bond]')], nodes=[...root.querySelectorAll('[data-lf-bond-node]')];
    buttons.forEach((button,i) => button.addEventListener('click',() => {
      buttons.forEach((p,j) => p.setAttribute('aria-pressed',String(i===j)));
      nodes.forEach((node,j) => node.classList.toggle('is-active',i===j));
      target.innerHTML=residueRecord(rows[i],h);
      root.querySelector('[data-lf-status]').textContent=rows[i][0].title;
    },{signal}));
  }

  const phases = [
    ['Cell','A folded membrane is the first reading of the form.'],
    ['Molecule','The same surface narrows at the joints and gathers around three junctions.'],
    ['Computational mesh','The same vertices unfold into a grid of computational paths.']
  ];
  const meshRows=18, meshColumns=24;
  const meshFraction=(i,n) => i/(n-1);
  const mix=(a,b,t) => a+(b-a)*t;
  function meshPose(v,u,phase) {
    const a=u*tau;
    if (phase===0) {
      const n=Math.pow(Math.sin(Math.PI*v),.82), fold=1+.11*Math.sin(a*5+v*10)+.07*Math.cos(a*3-v*14);
      return [n*fold*206*Math.cos(a)+22*Math.sin(v*6.7), (v-.5)*338+12*n*Math.cos(a*2+v*3), n*fold*166*Math.sin(a)];
    }
    if (phase===1) {
      const radius=12 + 64*Math.exp(-((v-.21)**2)/.0085) + 75*Math.exp(-((v-.49)**2)/.013) + 52*Math.exp(-((v-.81)**2)/.0058);
      return [radius*Math.cos(a)+94*Math.sin(v*7-2.5), (v-.5)*385+radius*.18*Math.cos(a), radius*Math.sin(a)+51*Math.sin(v*11)];
    }
    const wave = 23*Math.sin(u*8+v*8)+13*Math.cos(v*12-u*5);
    return [(u-.5)*411+(v-.5)*107, (v-.5)*274+wave*.46, wave + 45*Math.cos(u*4+v*3)];
  }
  function meshGeometry(progress) {
    const phase=Math.min(1,Math.floor(progress)), t=clamp(progress-phase);
    const smoothing=t*t*(3-2*t);
    return Array.from({length:meshRows},(_,i) => Array.from({length:meshColumns},(_,j) => {
      const v=meshFraction(i,meshRows),u=meshFraction(j,meshColumns), a=meshPose(v,u,phase), b=meshPose(v,u,phase+1);
      const x=mix(a[0],b[0],smoothing), y=mix(a[1],b[1],smoothing), z=mix(a[2],b[2],smoothing);
      const turn=.31+progress*.32, roll=-.27+progress*.11;
      const x1=x*Math.cos(turn)-z*Math.sin(turn), z1=x*Math.sin(turn)+z*Math.cos(turn);
      const x2=x1*Math.cos(roll)-y*Math.sin(roll), y2=x1*Math.sin(roll)+y*Math.cos(roll);
      const depth=1+z1/1050;
      return [round(312+x2*depth),round(228+y2*depth)];
    }));
  }
  const svgLine = points => points.map((p,i) => `${i?'L':'M'}${p.join(' ')}`).join('');
  const glints = [[4,3],[6,11],[8,19],[10,6],[12,13],[14,21],[15,8],[2,14]];
  function continuumArt() {
    const grid=meshGeometry(0);
    return `<svg class="lf-continuum-art" viewBox="0 0 624 456" aria-hidden="true">
      <defs><radialGradient id="lf-continuum-halo"><stop stop-color="var(--lf-form-halo)" stop-opacity=".54"/><stop offset="1" stop-color="var(--lf-form-halo)" stop-opacity="0"/></radialGradient><linearGradient id="lf-continuum-thread" x2="1" y2="1"><stop stop-color="var(--lf-form-edge)"/><stop offset=".49" stop-color="var(--lf-form-core)"/><stop offset="1" stop-color="var(--lf-form-tip)"/></linearGradient></defs>
      <ellipse cx="312" cy="230" rx="300" ry="222" fill="url(#lf-continuum-halo)"/><path class="lf-mesh-axis" d="M34 40h44m-44 0v44m512-44h44v44m0 290v44h-44M34 374v44h44m234-372v29m0 307v29M52 228h34m452 0h34"/><circle class="lf-mesh-axis" cx="312" cy="228" r="205"/>
      <g class="lf-mesh-horizontal">${grid.map(row => `<path data-lf-mesh-row d="${svgLine(row)}"/>`).join('')}</g><g class="lf-mesh-vertical">${grid[0].map((_,j) => `<path data-lf-mesh-column d="${svgLine(grid.map(row=>row[j]))}"/>`).join('')}</g><g class="lf-mesh-glints">${glints.map(([i,j]) => `<circle data-lf-mesh-dot cx="${grid[i][j][0]}" cy="${grid[i][j][1]}" r="2.7"/>`).join('')}</g>
      </svg>`;
  }
  function continuumHero(vm,h) {
    return hero('continuum',`<div class="lf-continuum-scroll" data-lf-continuum-scroll><div class="lf-continuum-sticky">
      <div class="lf-continuum-type">${name(vm,h)}<p>One form.<br>Three ways of seeing.</p>${photo(vm,h,'lf-continuum-portrait')}</div>
      <figure class="lf-continuum-scene" data-lf-phase="0"><div class="lf-continuum-view">${continuumArt()}<span class="lf-mesh-counter lf-mono">Form <span data-lf-phase-index>01</span> / 03</span></div>
      <figcaption><h2 data-lf-phase-title>${phases[0][0]}</h2><p data-lf-phase-copy>${phases[0][1]}</p><div class="lf-range-row"><label for="lf-form-range">Scrub the form</label><button type="button" class="lf-link" data-lf-follow hidden>Follow scroll</button></div><input type="range" id="lf-form-range" data-lf-form-range min="0" max="200" value="0" aria-valuetext="${phases[0][0]}"><div class="lf-phase-keys">${phases.map(([title],i) => `<button type="button" data-lf-phase-key="${i}" aria-pressed="${i===0}">${title}</button>`).join('')}</div><p class="lf-form-caption" data-lf-form-caption>Conceptual geometry. Use the controls to change the form.</p></figcaption></figure>
      ${cta('#projects','Read the project chapters','lf-continuum-cta')}</div></div>`);
  }
  function continuumProjects(vm,h) {
    return section('projects','Project chapters','Read the work across research and computation.',`${tools(vm,h,'Find a chapter by topic or project')}<div class="lf-continuum-chapters">${list(vm.projects).map((p,i) => `<article class="lf-story-chapter" ${projectAttrs(p,h)}><figure class="lf-chapter-figure" aria-hidden="true"><div class="lf-chapter-index">${seq(i)}</div><svg viewBox="0 0 330 155">${Array.from({length:11},(_,j) => `<path d="M0 ${j*14} Q ${113+i%6*18} ${-28+(j*16)} 330 ${150-j*13}"/>`).join('')}</svg></figure><div class="lf-chapter-copy"><h3>${h.e(p.title)}</h3>${description(p,h,355)}${tags(p,h)}${action(p,h,'Read full chapter')}</div></article>`).join('')}</div>${more}`,'lf-continuum-work');
  }
  function mountContinuum(root,{signal}) {
    const track=root.querySelector('[data-lf-continuum-scroll]'), range=root.querySelector('[data-lf-form-range]');
    if (!track || !range) return;
    const scene=track.querySelector('.lf-continuum-scene'), title=track.querySelector('[data-lf-phase-title]');
    const counter=track.querySelector('[data-lf-phase-index]'), copy=track.querySelector('[data-lf-phase-copy]');
    const keys=[...track.querySelectorAll('[data-lf-phase-key]')], follow=track.querySelector('[data-lf-follow]');
    const caption=track.querySelector('[data-lf-form-caption]');
    const rows=[...track.querySelectorAll('[data-lf-mesh-row]')], columns=[...track.querySelectorAll('[data-lf-mesh-column]')], dots=[...track.querySelectorAll('[data-lf-mesh-dot]')];
    const sticky=track.firstElementChild;
    let manual=false, frame=0, previous=-1, lastPhase=-1, visible=true, wasAvailable;
    const draw = progress => {
      progress=Math.round(clamp(progress,0,2)*100)/100;
      if (progress===previous) return;
      previous=progress;
      const g=meshGeometry(progress), phase=Math.round(progress);
      rows.forEach((el,i) => el.setAttribute('d',svgLine(g[i])));
      columns.forEach((el,j) => el.setAttribute('d',svgLine(g.map(row=>row[j]))));
      dots.forEach((el,n) => {
        const [i,j]=glints[n];
        el.setAttribute('cx',String(g[i][j][0]));el.setAttribute('cy',String(g[i][j][1]));
      });
      range.value=String(Math.round(progress*100));
      if (lastPhase!==phase) {
        lastPhase=phase;
        title.textContent=phases[phase][0];
        copy.textContent=phases[phase][1];
        counter.textContent=seq(phase);
        range.setAttribute('aria-valuetext',phases[phase][0]);
        scene.dataset.lfPhase=phase;
        keys.forEach((b,i) => b.setAttribute('aria-pressed',String(i===phase)));
      }
    };
    const span = () => track.offsetHeight - sticky.offsetHeight;
    const canScroll = () => document.body.dataset.effects==='on' && span()>24;
    const followScroll = () => {
      frame=0;
      const available=canScroll();
      follow.hidden=!manual || !available;
      if (available!==wasAvailable) {
        wasAvailable=available;
        track.dataset.lfFollow=available?'available':'manual-only';
        caption.textContent=available?'Conceptual geometry. Scroll or use the controls.':'Conceptual geometry. Use the controls to change the form.';
      }
      if (manual || !available) return;
      const rect=track.getBoundingClientRect();
      const top=parseFloat(w.getComputedStyle(sticky).top)||0;
      draw((top-rect.top)/span()*2);
    };
    const schedule = () => { if (!frame && visible) frame=w.requestAnimationFrame(followScroll); };
    const useManual = value => {manual=true; follow.hidden=!canScroll(); draw(value);};
    range.addEventListener('input',() => useManual(Number(range.value)/100),{signal});
    keys.forEach((b,i) => b.addEventListener('click',() => useManual(i),{signal}));
    follow.addEventListener('click',() => {manual=false; followScroll();range.focus();},{signal});
    w.addEventListener('scroll',schedule,{passive:true,signal});
    w.addEventListener('resize',schedule,{passive:true,signal});
    const observer=typeof w.MutationObserver==='function' ? new w.MutationObserver(schedule) : null;
    observer?.observe(document.body,{attributes:true,attributeFilter:['data-effects']});
    const visibility=typeof w.IntersectionObserver==='function' ? new w.IntersectionObserver(([entry]) => { visible=entry.isIntersecting;schedule(); },{rootMargin:'80px'}) : null;
    visibility?.observe(track);
    signal.addEventListener('abort',() => {if (frame) w.cancelAnimationFrame(frame);observer?.disconnect();visibility?.disconnect();},{once:true});
    draw(0);
    schedule();
  }

  const cabinetKinds = [
    ['projects','Project files','Browse project files'],
    ['certificates','Credentials','Browse all credentials'],
    ['publications','Research papers','Browse the bibliography']
  ];
  function credentialCopy(p,h) {
    if (!p) return notAvailable('credential');
    const state=p.hasCertificate===true?'Certificate recorded':p.hasCertificate===false?'No certificate recorded':p.hasCertificate;
    return `<h3>${h.e(p.title)}</h3><p>${[p.issuer,p.date,p.duration,state].filter(Boolean).map(h.e).join(' · ')}</p><div class="lf-record-links">${w.PortfolioPreviews?.renderDocumentAction(p,h)||''}${p.url ? h.link(p.url,'Credential source','lf-link') : ''}</div>`;
  }
  function fileCopy(p,kind,h) {
    if (kind==='certificates') return credentialCopy(p,h);
    if (kind==='publications') return residueRecord(p ? [p,'publication'] : null,h);
    return selectedProject(p,h,'Open project file');
  }
  function cabinetDrawers(vm,h) {
    return `<div class="lf-cabinet-case">${cabinetKinds.map(([kind,title,link],i) => {
      const all=list(vm[kind]), rows=all.slice(0,3);
      return `<details class="lf-cabinet-drawer" data-lf-drawer="${kind}"${i===0?' open':''}><summary><span class="lf-drawer-id" aria-hidden="true">${seq(i)}</span><strong>${title}</strong><span class="lf-drawer-count">${h.number(all.length)}</span><span class="lf-drawer-handle" aria-hidden="true"></span></summary><div class="lf-drawer-bed"><div class="lf-drawer-tabs">${rows.map((p,j) => `<button type="button" class="lf-file-tab" data-lf-file="${j}" aria-pressed="${j===0}" aria-controls="lf-file-${kind}"><span aria-hidden="true">${seq(j)}</span>${h.e(p.title)}</button>`).join('')}</div><div class="lf-drawer-file" id="lf-file-${kind}" data-lf-file-panel>${fileCopy(rows[0],kind,h)}</div>${cta('#'+kind,link)}</div></details>`;
    }).join('')}</div>`;
  }
  function cabinetHero(vm,h) {
    return hero('cabinet',`<div class="lf-cabinet-layout"><header class="lf-cabinet-heading">${name(vm,h)}<p>An archive of lab work and engineering.</p>${photo(vm,h,'lf-cabinet-portrait')}${roles(vm,h)}</header><div class="lf-cabinet-furniture"><div class="lf-cabinet-top"><span>Specimen cabinet</span><span>Projects, research &amp; credentials</span></div>${cabinetDrawers(vm,h)}<div class="lf-cabinet-base" aria-hidden="true"></div></div>${statuses()}</div>`);
  }
  function cabinetProjects(vm,h) {
    return section('projects','Project drawers','Pull open any drawer to read the project and reach its source files.',`${tools(vm,h,'Search the archive by project or topic')}<div class="lf-file-bank">${list(vm.projects).map((p,i) => `<article class="lf-file-row" ${projectAttrs(p,h)}><details><summary><span class="lf-file-index" aria-hidden="true">${seq(i)}</span><h3>${h.e(p.title)}</h3><span class="lf-drawer-handle" aria-hidden="true"></span></summary><div class="lf-file-body"><div>${description(p,h)}${tags(p,h)}</div><div class="lf-record-links">${action(p,h,'Open full file')}${p.repositoryUrl ? h.link(p.repositoryUrl,p.repositoryLabel||'Repository') : ''}${p.url && p.url!==p.repositoryUrl ? h.link(p.url,p.urlLabel||'Project source') : ''}</div></div></details></article>`).join('')}</div>${more}`,'lf-cabinet-work');
  }
  function mountCabinet(root,{signal,model,helpers:h}) {
    const status=root.querySelector('[data-lf-status]');
    const drawers=[...root.querySelectorAll('[data-lf-drawer]')];
    drawers.forEach(drawer => {
      const kind=drawer.dataset.lfDrawer, rows=list(model[kind]).slice(0,3);
      const files=[...drawer.querySelectorAll('[data-lf-file]')], panel=drawer.querySelector('[data-lf-file-panel]');
      files.forEach((button,i) => button.addEventListener('click',() => {
        files.forEach((b,j) => b.setAttribute('aria-pressed',String(i===j)));
        panel.innerHTML=fileCopy(rows[i],kind,h);
        status.textContent=rows[i].title;
      },{signal}));
    });
  }

  const register = ({id,title,description,focus,palette,fingerprint,renderers,mount,defaultTheme='light'}) => k.register({
    id, name:title, title, description, focus, palette, fingerprint, renderers, mount, defaultTheme, family:'Experiential', signature:id, collection:'experiential'
  });
  register({id:'tissue',title:'Tissue / Focal Plane',description:'A microscope field with three planes of the same tissue, plus specimen slides and branching field notes.',focus:'biology',palette:['#edf3fd','#352564','#7448a1'],
    fingerprint:{composition:'Clipped optical field with a specimen inspector',type:'Space Grotesk and optical metadata',material:'Ice-blue light and violet tissue',project:'Slide tray',experience:'Branching field notes',navigation:'Focus slider and plane keys',motion:'Depth and focus change within one volume'},
    renderers:{hero:tissueHero,projects:tissueProjects,experience:(vm,h)=>section('experience','Field notes','The dated record, with each role on its own branch.',roleRows(vm,h,'lf-branch-timeline','Read field note'),'lf-tissue-journey'),
      skills:(vm,h)=>skills(vm,h,'tissue','Method taxonomy','Trace each listed method to its source category.','taxonomy')},mount:mountTissue});
  register({id:'culture',title:'Culture / Project Habitat',description:'An organic colony map where each cluster opens an actual project, with growth rings for the career history.',focus:'biology',palette:['#f5f0df','#30381f','#596732'],
    fingerprint:{composition:'Asymmetric colony field and an inset field note',type:'Fraunces and plain sans-serif',material:'Ivory stock and olive pigment',project:'Open habitat banks',experience:'Growth ring chronology',navigation:'Numbered interactive clusters',motion:'Selected colony expands as its record changes'},
    renderers:{hero:cultureHero,projects:cultureProjects,experience:cultureExperience,
      skills:(vm,h)=>skills(vm,h,'culture','Skill habitats','Explore the methods in their original groups.','habitat')},mount:mountCulture});
  register({id:'chromatogram',title:'Chromatogram / Topic Trace',description:'Move a reading head over an illustrative trace to inspect real project topics and laboratory runs.',focus:'chemistry',palette:['#f5f7fe','#122650','#a5550c'],
    fingerprint:{composition:'Horizontal precision instrument with full-width trace',type:'Grotesk and ruled instrument labels',material:'Cobalt, white and amber',project:'Laboratory run lanes',experience:'Protocol steps',navigation:'Reading head and topic keys',motion:'Reading head tracks the selected lane'},
    renderers:{hero:chromatogramHero,projects:chromatogramProjects,experience:(vm,h)=>section('experience','Protocol history','A chronological record of roles and institutions.',roleRows(vm,h,'lf-protocol','Read protocol entry','protocol'),'lf-chroma-journey'),
      skills:(vm,h)=>skills(vm,h,'chroma','Method matrix','Listed skills organized by their documented method groups.','matrix')},mount:mountChromatogram});
  register({id:'residue',title:'Residue / Bond Index',description:'A sculptural field of conceptual bonds and selectable nodes for project and research records.',focus:'chemistry',palette:['#f4f6fb','#1a2641','#9e4369'],
    fingerprint:{composition:'Sculptural field between a compact title and an inspection pane',type:'Editorial serif and compact captions',material:'Icy paper, navy bonds and pink pearls',project:'Numbered bond index',experience:'Chronological reaction chain',navigation:'Selectable molecular nodes',motion:'Selection rings and the associated record update together'},
    renderers:{hero:residueHero,projects:residueProjects,experience:(vm,h)=>section('experience','Reaction chain','A dated sequence of real appointments and work.',roleRows(vm,h,'lf-reaction-chain','Read appointment','reaction'),'lf-residue-journey'),
      skills:(vm,h)=>skills(vm,h,'residue','Skill bond groups','Methods are grouped by their source categories.','bond')},mount:mountResidue});
  register({id:'continuum',title:'Continuum / One Form',description:'Scroll or scrub a single sculptural form from cell to molecule to computational mesh.',focus:'all',palette:['#171729','#f2edf9','#c5adff'],defaultTheme:'dark',
    fingerprint:{composition:'Cinematic pinned scene and portrait, with alternating chapters',type:'Large Space Grotesk display',material:'Violet, ivory and lime wireframe light',project:'Expanded story chapters',experience:'Braided timeline',navigation:'Scroll, scrub or select phases',motion:'A single vertex mesh interpolates through three phases'},
    renderers:{hero:continuumHero,projects:continuumProjects,experience:(vm,h)=>section('experience','Braided timeline','Explore where the listed fields appear across the career record.',roleRows(vm,h,'lf-braided-chronology','Read experience','braid'),'lf-continuum-journey'),
      skills:(vm,h)=>skills(vm,h,'continuum','Skill bridges','Open the source categories to see the tools and methods in each discipline.','bridge')},mount:mountContinuum});
  register({id:'cabinet',title:'Cabinet / Working Archive',description:'A specimen cabinet with real project files, credential drawers and a chronological artifact tray.',focus:'all',palette:['#f3e9d3','#142f45','#425e70'],
    fingerprint:{composition:'Furniture-scale drawers alongside a portrait and a title',type:'Editorial serif and engraved labels',material:'Parchment, enamel and blueprint metal',project:'Expandable file drawers',experience:'Chronological artifact tray',navigation:'Drawer handles and selectable file tabs',motion:'Drawers open independently and reveal the selected file'},
    renderers:{hero:cabinetHero,projects:cabinetProjects,experience:(vm,h)=>section('experience','Artifact tray','Explore the appointments and their original periods.',roleRows(vm,h,'lf-artifact-tray','Open artifact notes','tray'),'lf-cabinet-journey'),
      skills:(vm,h)=>skills(vm,h,'cabinet','Tool drawers','Each drawer keeps the original categories and listed tools together.','drawer')},mount:mountCabinet});
})(window);
