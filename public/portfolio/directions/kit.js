/* Semantic data atoms. Composition and art direction belong to each renderer. */
(function (w) {
  'use strict';
  const list = value => Array.isArray(value) ? value : [];
  const present = value => value !== '' && value !== null && value !== undefined;
  const e = value => String(value ?? '').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  function excerpt(value, max = 220) { const text = String(value || ''); return text.length > max ? text.slice(0,max-1).replace(/\s+\S*$/,'')+'…' : text; }
  function section(id,title,body,extraClass='') { return `<section id="${e(id)}" data-section="${e(id)}" class="pf-section di-section ${e(extraClass)}" aria-labelledby="${id==='hero'?'direction-hero-title':`di-${e(id)}-title`}"><div class="pf-wrap">${id==='hero'?'':`<header class="di-section-head"><h2 id="di-${e(id)}-title">${e(title)}</h2></header>`}${body}</div></section>`; }
  function name(vm,h,cls='') { const i=vm.identity||{};return `<h1 id="direction-hero-title" class="di-name ${h.e(cls)}">${i.givenName?`<span class="given">${h.e(i.givenName)}</span> <span class="family">${h.e(i.familyName)}</span>`:h.e(i.name)}</h1>`; }
  const portrait=(vm,h,cls='')=>h.portrait(vm.identity||{},`di-portrait ${cls}`);
  const profile=(vm,h)=>vm.identity?.summary?`<p class="di-profile">${h.e(vm.identity.summary)}</p>`:'';
  const tags=(items,h)=>`<div class="di-tags">${h.chips(list(items),99)}</div>`;
  const actions=()=>'<div class="di-actions"><a href="#projects">Explore the work ↗</a><a href="#about">Read the profile ↓</a></div>';
  const preview=(p,i,h)=>w.PortfolioPreviews?.renderProject(p,i,h)||'';
  function projectAction(p,h) { return `<div class="di-project-actions"><button type="button" data-open-project="${h.e(p.id)}">Read project ↗</button>${p.url?h.link(p.url,'Open source ↗'):''}</div>`; }
  function projectTools(vm,h) { const topics=[...new Set(list(vm.projects).flatMap(p=>list(p.tags)).filter(Boolean))];return `<div class="di-project-tools"><label>Search projects<input type="search" data-project-search placeholder="Search projects, tools, topics…"></label><label>Topic<select data-project-filter><option value="">All topics</option>${topics.map(t=>`<option value="${h.e(t)}">${h.e(t)}</option>`).join('')}</select></label></div>`; }
  const metadata=(values,h)=>`<span class="di-meta">${values.filter(v=>v!==''&&v!==null&&v!==undefined).map(v=>`<span>${h.e(v)}</span>`).join('')}</span>`;
  function records(id,vm,h,flavor='list') {
    let content='',title='';
    if(id==='publications') {
      const rows=list(vm.publications);if(!rows.length)return '';title='Research & writing';
      content=`<div class="di-record-list">${rows.map((p,i)=>{
        const citation=p.citation||[list(p.authors).join(', '),p.title,p.venue,p.year].filter(Boolean).join('. ');
        return `<article class="di-record-item di-paper record-paper" data-record-id="${h.e(p.id)}"><span class="di-index">${String(i+1).padStart(2,'0')}</span><div class="di-record-copy">${metadata([p.kind,p.status,p.year,p.venue,p.publisher,present(p.isbn)?`ISBN ${p.isbn}`:''],h)}<h3>${h.e(p.title)}</h3>${list(p.authors).length?`<p class="di-authors">${h.e(p.authors.join(' · '))}</p>`:''}${p.notes?`<details><summary>Read notes</summary><p>${h.e(p.notes)}</p></details>`:''}<div class="di-record-actions">${citation?`<button type="button" data-copy-citation="${h.e(p.id)}">Copy citation</button>`:''}${p.url?h.link(p.url,'Open publication ↗'):''}${p.doi?h.link(`https://doi.org/${encodeURIComponent(p.doi)}`,`DOI ${p.doi} ↗`):''}</div><span class="record-citation" hidden>${h.e(citation)}</span></div></article>`;
      }).join('')}</div>`;
    } else if(id==='education') {
      const rows=list(vm.education);if(!rows.length)return '';title='Education';
      content=`<ol class="di-record-list di-education-list">${rows.map((p,i)=>`<li class="di-record-item di-education-item"><span class="di-index">${String(i+1).padStart(2,'0')}</span><div class="di-record-copy">${metadata([p.start,p.end,p.location],h)}<h3>${h.e(p.institution)}</h3><p class="di-degree">${h.e(p.degree)}${p.field?` / ${h.e(p.field)}`:''}</p>${present(p.gpa)?`<p>GPA <strong>${h.e(p.gpa)}</strong></p>`:''}${tags(p.tags,h)}${p.logoUrl?`<img class="di-institution-mark" src="${h.e(p.logoUrl)}" alt="" loading="lazy">`:''}</div></li>`).join('')}</ol>`;
    } else if(id==='skills') {
      const rows=list(vm.skillGroups);if(!rows.length)return '';title='Tools & methods';
      content=`<div class="record-skill-tools di-skill-tools"><label for="direction-skill-search">Find a skill</label><input id="direction-skill-search" type="search" data-skill-search placeholder="Search all skills"></div><div class="di-record-list di-skill-list">${rows.map((g,i)=>`<details class="record-skill-group di-record-item di-skill-group"${i===0?' open':''}><summary><span>${h.e(g.name)}</span><span aria-hidden="true">+</span></summary><div class="di-skill-subgroups">${list(g.groups).map(s=>`<div class="record-skill-sub di-skill-sub"><h3>${h.e(s.name)}</h3><ul>${list(s.items).map(x=>`<li data-skill-item="${h.e(x.name)}"><span>${h.e(x.name)}${x.shortName&&x.shortName!==x.name?` <small>(${h.e(x.shortName)})</small>`:''}</span>${list(x.tags).length?`<details class="di-skill-context"><summary>Source context</summary>${tags(x.tags,h)}</details>`:''}</li>`).join('')}</ul></div>`).join('')}</div></details>`).join('')}</div>`;
    } else if(id==='certificates') {
      const rows=list(vm.certificates);if(!rows.length)return '';title='Learning & credentials';
      const issuers=[...new Set(rows.map(c=>c.issuer).filter(Boolean))];
      content=`<div class="di-project-tools"><label>Search credentials<input type="search" data-cert-search placeholder="Search certificates"></label><label>Issuer<select data-cert-issuer><option value="">All issuers</option>${issuers.map(i=>`<option value="${h.e(i)}">${h.e(i)}</option>`).join('')}</select></label></div><div class="di-record-list di-credential-list">${rows.map((c,i)=>`<article class="di-record-item di-credential" data-cert-card data-cert-id="${h.e(c.id)}">${w.PortfolioPreviews?.renderCertificate(c,i,h)||''}<div class="di-record-copy"><span class="di-index">${String(i+1).padStart(2,'0')} / ${c.hasCertificate?'Credential available':'Course record'}</span><h3>${h.e(c.title)}</h3>${metadata([c.issuer,c.date,c.duration],h)}${tags(c.tags,h)}<div class="di-record-actions">${w.PortfolioPreviews?.renderDocumentAction(c,h)||''}${c.url?h.link(c.url,'View credential ↗'):''}</div></div></article>`).join('')}</div><p data-cert-empty hidden>No credentials match this search.</p><button type="button" data-cert-more hidden>Show more credentials ↓</button>`;
    } else if(id==='languages') {
      const rows=list(vm.languages);if(!rows.length)return '';title='Languages';
      content=`<div class="di-record-list di-language-list">${rows.map(l=>`<article class="di-record-item di-language"><h3>${h.e(l.name)}</h3><p>${h.e(l.cefr||l.level||'Level not supplied')}</p>${l.cefr&&l.level&&l.cefr!==l.level?`<p>${h.e(l.level)}</p>`:''}${l.status?`<p>${h.e(l.status)}</p>`:''}${list(l.tests).length?`<details><summary>Test results</summary>${l.tests.map(t=>`<div class="di-language-test"><h4>${h.e(t.name)}</h4>${metadata([t.issuer,t.date],h)}${list(t.scores).map(s=>`<p>${h.e(s.label)} <strong>${h.e(s.value)}${present(s.max)?` / ${h.e(s.max)}`:''}</strong></p>`).join('')}${t.url?h.link(t.url,'View result ↗'):''}</div>`).join('')}</details>`:''}</article>`).join('')}</div>`;
    } else if(id==='references') {
      const rows=list(vm.references);if(!rows.length)return '';title='People & references';
      content=`<div class="di-record-list di-reference-list">${rows.map(r=>`<details class="di-record-item di-reference"><summary><span><strong>${h.e(r.name)}</strong>${metadata([r.title,r.department,r.organization,r.location],h)}</span><span aria-hidden="true">+</span></summary><div class="di-reference-contact">${r.email?h.link(`mailto:${r.email}`,r.email):''}${r.phone?h.link(`tel:${r.phone}`,r.phone):''}${r.url?h.link(r.url,'Profile ↗'):''}</div></details>`).join('')}</div>`;
    } else if(id==='contact') {
      title='Correspondence';const c=vm.contact||{};
      if(!c.email&&!c.phone&&!list(vm.profiles).length)return '';
      content=`<div class="di-contact"><p class="di-contact-name">${h.e(vm.identity?.name)}</p><div class="di-contact-links">${c.email?h.link(`mailto:${c.email}`,c.email):''}${c.phone?h.link(`tel:${c.phone}`,c.phone):''}</div><nav aria-label="Social profiles" class="di-social-links">${list(vm.profiles).map(p=>h.link(p.url,p.label||p.network)).join('')}</nav><a class="di-back-top" href="#hero">Back to the beginning ↑</a></div>`;
    }
    return content?section(id,title,content,`di-record di-record-${id} di-format-${flavor}`):'';
  }
  let observer;
  function unmount() { observer?.disconnect();observer=null; }
  function mount(root) {
    unmount();const sections=[...root.querySelectorAll('.di-section')];
    if(!w.IntersectionObserver){sections.forEach(s=>s.setAttribute('data-in-view',''));return;}
    observer=new w.IntersectionObserver(entries=>entries.forEach(entry=>entry.target.toggleAttribute('data-in-view',entry.isIntersecting)),{rootMargin:'100px',threshold:0});
    sections.forEach(s=>observer.observe(s));
  }
  w.PortfolioDirectionKit={list,excerpt,section,name,portrait,profile,tags,actions,preview,projectTools,projectAction,records,mount,unmount};
})(window);
