(function (w) {
  'use strict';
  const catalog = new Map();
  const list = v => Array.isArray(v) ? v : [];
  const e = v => String(v ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const number = n => String(n + 1).padStart(2, '0');
  const labels = { hero:'Introduction', about:'Profile', projects:'Selected work', experience:'Experience' };
  function section(id, title, inner, extraClass = '') {
    return `<section class="pf-section design-page dl-section ${e(extraClass)}" id="${e(id)}" data-section="${e(id)}" aria-labelledby="design-${e(id)}-title"><div class="pf-wrap">${id !== 'hero' ? `<header class="dl-section-heading"><p class="dl-kicker">${e(labels[id] || id)}</p><h2 id="design-${e(id)}-title">${e(title)}</h2></header>` : ''}${inner}</div></section>`;
  }
  function identity(vm, h) {
    const i = vm.identity || {};
    return `<h1 class="dl-name" id="design-hero-title">${i.givenName ? `<span class="given">${h.e(i.givenName)}</span> <span class="family">${h.e(i.familyName)}</span>` : h.e(i.name)}</h1>`;
  }
  const portrait = (vm, h) => h.portrait(vm.identity || {}, 'dl-portrait');
  const lead = (vm, h) => {const raw=String(vm.identity?.summary||'');if(!raw)return '';const first=(raw.match(/^[\s\S]*?[.!?](?=\s|$)/)||[raw])[0];const short=first.length>300?first.slice(0,297).replace(/\s+\S*$/,'')+'…':first;return `<p class="dl-lead">${h.e(short)}</p>${short!==raw?'<a class="dl-profile-link" href="#about">Read the full profile ↗</a>':''}`;};
  const roles = (vm, h) => `<div class="dl-roles">${h.chips(list(vm.identity?.roles), 99)}</div>`;
  const actions = () => '<div class="dl-actions"><a class="pf-button primary" href="#projects">Explore the work ↗</a><a class="pf-button" href="#about">Read the profile ↓</a></div>';
  function metrics(vm, h) {
    return `<div class="dl-metrics" aria-label="CV record counts">${[['projects','Projects'],['experience','Experience records'],['publications','Research records'],['skills','Listed skills']].map(([key,label]) => `<div class="dl-metric"><strong>${h.number(vm.stats?.[key] ?? 0)}</strong><span>${label}</span></div>`).join('')}</div>`;
  }
  function about(vm, h) {
    return `<div class="dl-about-text">${vm.identity?.summary?`<p class="dl-lead">${h.e(vm.identity.summary)}</p>`:''}${roles(vm,h)}</div>${metrics(vm,h)}${list(vm.interests).length ? `<div class="dl-interests">${vm.interests.map(i=>`<details><summary>${h.e(i.title)}</summary>${i.description ? `<p>${h.e(i.description)}</p>` : ''}</details>`).join('')}</div>` : ''}`;
  }
  function projectTools(vm, h) {
    const tags = [...new Set(list(vm.projects).flatMap(p=>list(p.tags)).filter(Boolean))];
    return `<div class="dl-project-tools"><label>Search projects<input type="search" data-project-search placeholder="Search projects, tools, topics…"></label><label>Topic<select data-project-filter><option value="">All topics</option>${tags.map(t=>`<option value="${h.e(t)}">${h.e(t)}</option>`).join('')}</select></label></div>`;
  }
  function projectCard(p, i, h, options = {}) {
    const layout = ['card','row','compact','poster'].includes(options.layout) ? options.layout : 'card';
    const text = String(p.description || ''), short = text.length > 250 ? text.slice(0,247).replace(/\s+\S*$/,'')+'…' : text;
    return `<article class="dl-project dl-project-${layout}" data-project-card data-project-id="${h.e(p.id)}"><div class="dl-project-media">${w.PortfolioPreviews?.renderProject(p,i,h) || ''}</div><div class="dl-project-copy"><span class="dl-index">${number(i)}</span><h3>${h.e(p.title)}</h3>${short ? `<p class="dl-project-description">${h.e(short)}</p>` : ''}<div class="dl-tags">${h.chips(list(p.tags),99)}</div><div class="dl-project-actions"><button type="button" class="pf-button" data-open-project="${h.e(p.id)}">Read project ↗</button>${p.url ? h.link(p.url,'Open source ↗','dl-source-link') : ''}</div></div></article>`;
  }
  function projectCollection(vm, h, layout = 'card') {
    return `${projectTools(vm,h)}<div class="dl-projects dl-projects-${e(layout)}">${list(vm.projects).map((p,i)=>projectCard(p,i,h,{layout})).join('')}</div><p data-project-empty hidden>No projects match your search.</p><button class="pf-button dl-more" type="button" data-project-more hidden>Show more projects ↓</button>`;
  }
  function experienceRows(vm, h, variant = 'timeline') {
    return `<div class="dl-experience dl-experience-${e(variant)}">${list(vm.experience).map((r,i)=>`<article class="dl-role" data-journey-record="${h.e(r.id)}"><span class="dl-period"><b>${number(i)}</b>${h.e(r.period)}</span><div class="dl-role-body"><h3>${h.e(r.title)}</h3>${r.organization ? `<p class="dl-org">${h.e(r.organization)}</p>` : ''}${r.description || list(r.tags).length ? `<details class="dl-role-more"><summary>Read this chapter <span aria-hidden="true">+</span></summary>${r.description ? `<p>${h.e(r.description)}</p>` : ''}<div class="dl-tags">${h.chips(list(r.tags),99)}</div></details>` : ''}</div></article>`).join('')}</div>`;
  }
  function science(kind) {
    if (kind !== 'dna' && kind !== 'helix') return w.PortfolioScience?.art(kind) || '';
    const points = [[], []];
    for (let i=0;i<=72;i++) { const t=i/72*Math.PI*5; points[0].push([200+Math.sin(t)*88,20+i*5.5]); points[1].push([200-Math.sin(t)*88,20+i*5.5]); }
    return `<figure class="dl-dna-figure" aria-label="Abstract helix illustration"><svg viewBox="0 0 400 450" fill="none" aria-hidden="true">${points[0].filter((_,i)=>i%4===0).map((p,j)=>{const q=points[1][j*4];return `<path d="M${p.join(' ')}L${q.join(' ')}" stroke="var(--line)" stroke-width="2"/>`;}).join('')}<path d="${points[0].map((p,i)=>(i?'L':'M')+p.join(' ')).join('')}" stroke="var(--lime)" stroke-width="6" stroke-linecap="round"/><path d="${points[1].map((p,i)=>(i?'L':'M')+p.join(' ')).join('')}" stroke="var(--coral)" stroke-width="6" stroke-linecap="round"/></svg><figcaption>Illustrative molecular form</figcaption></figure>`;
  }
  const ui = { section, identity, portrait, lead, roles, actions, metrics, about, projectTools, projectCard, projectCollection, experienceRows, science, story:(vm,h)=>w.PortfolioStory?.render(vm,h)||'' };
  function register(design) {
    if (!design || !/^[a-z][a-z0-9-]+$/.test(design.id) || catalog.has(design.id)) throw Error('INVALID_OR_DUPLICATE_DESIGN');
    if (!['hero','about','projects','experience'].every(k=>typeof design.renderers?.[k]==='function')) throw Error('INCOMPLETE_DESIGN');
    catalog.set(design.id, Object.freeze({defaultTheme:'light',recordStyle:'unified',family:'Collection',...design}));
  }
  w.PortfolioDesigns = { register, get:id=>catalog.get(id), list:()=>[...catalog.values()], has:id=>catalog.has(id), ui,
    render(id, sectionName, vm, h) { const renderer=catalog.get(id)?.renderers[sectionName];if(!renderer)return null;let markup=renderer(vm,h,ui);if(sectionName==='about'&&!markup.includes('data-story')&&w.PortfolioStory)markup=markup.replace(/<\/div><\/section>\s*$/,`<details class="dl-shared-study"><summary>Explore the connected visual study ↗</summary>${ui.story(vm,h)}</details></div></section>`);return markup; } };
})(window);
