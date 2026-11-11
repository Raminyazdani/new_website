(()=>{
 'use strict';
 const $=s=>document.querySelector(s), $$=s=>[...document.querySelectorAll(s)];
 const requestedMotion=new URLSearchParams(window.location?.search||'').get('motion');
 const state=window.portfolioView={raw:null,model:null,motionMode:['auto','full','still'].includes(requestedMotion)?requestedMotion:'auto',projectLimit:6,certLimit:6};
 const order=['hero','about','projects','experience','publications','education','skills','certificates','languages','references','contact'];
 const labels={hero:'Home',about:'About',projects:'Work',experience:'Journey',publications:'Research',education:'Education',skills:'Skills',certificates:'Credentials',languages:'Languages',references:'References',contact:'Contact'};
 const reduced=typeof window.matchMedia==='function'?window.matchMedia('(prefers-reduced-motion: reduce)'):{matches:false};
 const escape=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 function href(v){return /^(?:https?:\/\/|mailto:|tel:|#)/i.test(String(v||''))?String(v):'';}
 const h={e:escape,number:v=>Number.isFinite(Number(v))?new Intl.NumberFormat('en').format(Number(v)):'',chips:(items,limit=4)=>(Array.isArray(items)?items:[]).slice(0,limit).map(x=>`<span class="pf-chip">${escape(x)}</span>`).join(''),link:(url,label,cls='')=>href(url)?`<a class="${escape(cls)}" href="${escape(href(url))}"${/^https?:/i.test(url)?' target="_blank" rel="noopener noreferrer"':''}>${escape(label)}</a>`:'',portrait:(identity,cls='')=>`<figure class="pf-portrait ${escape(cls)}"${identity.avatarUrl?'':' data-image-error="true"'}>${identity.avatarUrl?`<img src="${escape(identity.avatarUrl)}" alt="${escape(identity.name)}" decoding="async" referrerpolicy="no-referrer">`:''}<span class="pf-photo-fallback" aria-hidden="true">${escape(identity.initials)}</span></figure>`,heading:(number,kicker,title,description='')=>`<div class="pf-heading pf-reveal"><span class="pf-section-number">${escape(number)}</span><div><p class="pf-kicker">${escape(kicker)}</p><h2 class="pf-title">${escape(title)}</h2></div>${description?`<p class="pf-description">${escape(description)}</p>`:''}</div>`};
 let toastTimer,observer,scrollPending=false,experienceController,renderedDesign;
 function unmountExperience(){experienceController?.abort();experienceController=null;}
 function message(text){$('#toast').textContent=text;$('#toast').classList.add('show');clearTimeout(toastTimer);toastTimer=setTimeout(()=>$('#toast').classList.remove('show'),2600);}
 function effects(){return state.motionMode==='full'||state.motionMode==='auto'&&!reduced.matches;}
 function updateMotion(){const on=effects();document.body.dataset.effects=on?'on':'off';document.body.dataset.motion=state.motionMode;document.documentElement.style.scrollBehavior=on?'smooth':'auto';$('#motionMode').value=state.motionMode;if($('#studioMotion'))$('#studioMotion').value=state.motionMode;try{const url=new URL(window.location.href);url.searchParams.set('motion',state.motionMode);window.history?.replaceState(null,'',url);}catch{}$('#motionNotice').hidden=!(state.motionMode==='auto'&&reduced.matches);if(!on){$$('.pf-reveal').forEach(n=>n.classList.add('is-visible'));$$('[data-tilt]').forEach(n=>{n.style.removeProperty('--tilt-x');n.style.removeProperty('--tilt-y');});}window.PortfolioMotion?.sync();window.PortfolioSynthesis?.sync();}
 function showAccess(text,login=false){unmountExperience();renderedDesign=null;window.PortfolioSynthesis?.unmount();state.viewModel=null;window.PortfolioDirectionKit?.unmount();window.PortfolioMotion?.unmount();window.PortfolioScience?.unmount();window.PortfolioHeroScene?.unmount();window.PortfolioStory?.unmount();window.PortfolioPointer?.unmount();window.PortfolioBackground?.unmount();window.PortfolioPreviews?.unmount();window.PortfolioInsights?.unmount();state.projectLimit=6;state.certLimit=6;state.raw=null;state.model=null;observer?.disconnect();$('#portfolio').replaceChildren();$('#portfolio').hidden=true;$('#accessPanel').hidden=false;$('#accessMessage').textContent=text;$('#accessForm').hidden=!login;$('#retryBtn').hidden=login;['#siteFooter','#mainNav','#jumpBtn','#logoutBtn'].forEach(s=>$(s).hidden=true);$('#brandName').textContent='RESEARCH & CODE';$('#brandMark').textContent='✳';$('#footerName').textContent='';$('#jumpLinks').replaceChildren();$('#projectDialogBody').replaceChildren();closeDialog($('#projectDialog'));}
 async function load(){ $('#accessMessage').textContent='Opening the portfolio…';$('#accessForm').hidden=true;$('#retryBtn').hidden=true;try{const loaded=await window.PortfolioData.load();state.raw=loaded.raw;state.model=loaded.model;render();const target=/^#([a-z][a-z0-9-]*)$/.exec(window.location.hash||'')?.[1];if(target)document.getElementById(target)?.scrollIntoView?.({behavior:'instant',block:'start'});}catch(error){showAccess(error.code==='AUTH_REQUIRED'?'A private collection of work, research and code. Enter your access phrase to explore.':'The portfolio could not be loaded. Your data has not been replaced with sample content.',error.code==='AUTH_REQUIRED');}}
 async function login(event){event.preventDefault();const button=$('#accessForm button');button.disabled=true;try{const response=await fetch('/api/session',{method:'POST',credentials:'same-origin',cache:'no-store',headers:{'Content-Type':'application/json'},body:JSON.stringify({password:$('#accessPassword').value})});if(!response.ok){$('#accessMessage').textContent='That access phrase did not work. Please try again.';return;}$('#accessPassword').value='';await load();}catch{$('#accessMessage').textContent='Connection unavailable. Please try again.';}finally{button.disabled=false;}}
 function readSynthesisAnchor() {
   if (!(window.scrollY > 1)) return null;
   const toolbarBottom = $('#synthesisToolbar')?.getBoundingClientRect().bottom || 0;
   const line = toolbarBottom + 8;
   const visible = $$('#portfolio [data-section]').map(section=>({ section, rect: section.getBoundingClientRect() }))
     .filter(({rect})=>rect.height > 0);
   // Fragment navigation leaves a small breathing space below the toolbar.
   // Treat that newly reached section as the anchor rather than the tail of its predecessor.
   const entry = visible.find(({rect})=>rect.top >= line-4 && rect.top <= line+62) ||
     visible.find(({rect})=>rect.top <= line && rect.bottom > line);
   return entry ? { id: entry.section.id, offset: entry.rect.top } : null;
 }
 function perspectiveFocus(root, filters) {
   const node = document.activeElement;
   if (!node || !root.contains(node)) return null;
   const filter = filters.find(selector => node.matches(selector));
   if (filter) return () => {
     const next = $(filter);
     next?.focus({preventScroll:true});
     if (typeof node.selectionStart === 'number') next?.setSelectionRange?.(node.selectionStart,node.selectionEnd);
   };
   const record = node.dataset.synProjectSelect || node.dataset.openProject;
   if (record) return () => {
     const options = $$('[data-syn-project-select], [data-open-project]');
     options.find(button => (button.dataset.synProjectSelect || button.dataset.openProject) === record && !button.closest('[hidden]'))?.focus({preventScroll:true});
   };
   if (node.localName === 'summary' && node.parentElement?.hasAttribute('data-syn-disclosure')) {
     const record = node.parentElement.dataset.synDisclosure;
     return () => $$('[data-syn-disclosure]').find(el => el.dataset.synDisclosure === record)?.querySelector('summary')?.focus({preventScroll:true});
   }
   return null;
 }
 function render({ perspectiveSwitch = false, animate = false, anchor = null } = {}) {
   const root = $('#portfolio'), synthesis = window.PortfolioSynthesis;
   const isSynthesis = synthesis?.active();
   const designId = window.PortfolioStudio?.concept;
   const design = window.PortfolioDesigns?.get(designId);
   const experience = design?.collection === 'experiential' ? design : null;
   const sameDesign = renderedDesign === designId;
   const preserveFilters = sameDesign || (!experience && window.PortfolioDesigns?.get(renderedDesign)?.collection !== 'experiential');
   renderedDesign = designId;
   unmountExperience();
   if (!preserveFilters) { state.projectLimit=6;state.certLimit=6; }
   const current = perspectiveSwitch ? anchor || readSynthesisAnchor() : null;
   const disclosures = perspectiveSwitch ? new Map($$('[data-syn-disclosure]').map(el => [el.dataset.synDisclosure, el.hasAttribute('open')])) : null;
   const filters = ['[data-project-search]','[data-project-filter]','[data-cert-search]','[data-cert-issuer]','[data-skill-search]'];
   const restoreFocus = perspectiveSwitch ? perspectiveFocus(root,filters) : null;
   window.PortfolioDirectionKit?.unmount();window.PortfolioMotion?.unmount();window.PortfolioStory?.unmount();
   window.PortfolioPointer?.unmount();window.PortfolioBackground?.unmount();window.PortfolioPreviews?.unmount();window.PortfolioInsights?.unmount();
   const previous = preserveFilters ? filters.map(selector => [selector,$(selector)?.value || '']) : [];
   const vm = state.model, renderers = window.PortfolioRenderers || {};
   state.viewModel = isSynthesis ? synthesis.project(vm) : experience ? window.PortfolioExperiences.prioritize(vm, experience.focus) : null;
   if (isSynthesis) synthesis.render(root,state.viewModel,h);
   else {
     synthesis?.unmount();
     if (order.some(id=>typeof renderers[id]!=='function')) throw Error('SECTION_RENDERER_MISSING');
     const model = state.viewModel || vm;
     root.innerHTML = order.map(id=>window.PortfolioDesigns?.render(designId,id,model,h)??renderers[id](model,h)).join('');
   }
   root.querySelectorAll('[aria-labelledby]').forEach(section => {
     const id=section.getAttribute('aria-labelledby');
     if(!document.getElementById(id)){const heading=section.querySelector('h2');if(heading)heading.id=id;}
   });
   root.hidden=false;$('#accessPanel').hidden=true;$('#siteFooter').hidden=false;$('#logoutBtn').hidden=false;
   $('#brandName').textContent=vm.identity.name||'RESEARCH & CODE';$('#brandMark').textContent=vm.identity.initials||'✳';
   $('#footerName').textContent=vm.identity.name;
   const title = isSynthesis ? 'Synthesis' : experience?.name || 'Portfolio';
   document.title=vm.identity.name ? vm.identity.name+' — '+title : isSynthesis?'Synthesis — Portfolio':title;
   buildNavigation(isSynthesis ? synthesis.nav() : undefined);
   previous.forEach(([selector,value])=>{if($(selector))$(selector).value=value;});
   wireFilters();
   if (disclosures) $$('[data-syn-disclosure]').forEach(el=>{
     if(disclosures.has(el.dataset.synDisclosure))el.toggleAttribute('open',disclosures.get(el.dataset.synDisclosure));
   });
   observe();
   window.PortfolioStudio?.afterRender();
   updateMotion();
   if (isSynthesis) synthesis.mount(root,{animate,model:state.viewModel,helpers:h});
   if (experience?.mount) {
     experienceController = new AbortController();
     experience.mount(root,{signal:experienceController.signal,model:state.viewModel,helpers:h,refreshProjects:filterProjects,refreshSkills:filterSkills});
   }
   restoreFocus?.();
   const heroRoot=$('#hero'), heroParts=heroRoot?.querySelectorAll('[data-motion-part]');
   if (experience && !heroRoot?.hasAttribute('aria-labelledby')) {
     const titleId = heroRoot?.querySelector('h1')?.id;
     if(titleId)heroRoot.setAttribute('aria-labelledby',titleId);
   }
   if(heroRoot&&!heroParts?.length){
     heroRoot.querySelector('h1')?.setAttribute('data-motion-part','');
     heroRoot.querySelector('.dl-portrait')?.setAttribute('data-motion-part','');
   }
   window.PortfolioMotion?.mount(root);
   if (!isSynthesis && !experience) window.PortfolioDirectionKit?.mount(root);
   root.querySelectorAll('.pf-portrait img').forEach(img=>{
     const onError=()=>{img.hidden=true;img.closest('.pf-portrait').dataset.imageError='true';};
     img.onerror=onError;
     if(img.complete&&!img.naturalWidth)onError();
   });
   const restored = current && document.getElementById(current.id);
   if (restored && Number.isFinite(current.offset)) {
     const top = window.scrollY + restored.getBoundingClientRect().top - current.offset;
     window.scrollTo?.({top,behavior:'instant'});
   }
   requestScroll();
 }
 function buildNavigation(featured=['about','projects','experience','publications','skills','contact']){
   const actual=order.filter(id=>$('#'+id));
   const navLabels=window.PortfolioSynthesis?.active()?window.PortfolioSynthesis.sections:labels;
   $('#mainNav').innerHTML=featured.filter(id=>actual.includes(id)).map(id=>`<a href="#${id}" data-nav="${id}">${navLabels[id]}</a>`).join('');
   $('#mainNav').hidden=false;$('#jumpBtn').hidden=false;
   $('#jumpLinks').innerHTML=actual.map((id,i)=>`<a href="#${id}" data-jump="${id}"><small>${String(i+1).padStart(2,'0')}</small> &nbsp; ${navLabels[id]}</a>`).join('');
 }

 function observe(){observer?.disconnect();if(typeof window.IntersectionObserver!=='function'){$$('.pf-reveal').forEach(n=>n.classList.add('is-visible'));return;}observer=new window.IntersectionObserver(entries=>{entries.forEach(entry=>{if(entry.isIntersecting){entry.target.classList.add('is-visible');observer.unobserve(entry.target);}});},{threshold:.08});document.body.classList.add('pf-observe-ready');$$('.pf-reveal').forEach(n=>observer.observe(n));}
 function filtered(items,query,predicate){const q=query.toLowerCase().trim();return items.filter(item=>(!q||[item.title,item.description,item.issuer,...(item.tags||[])].join(' ').toLowerCase().includes(q))&&predicate(item));}
 function filterProjects(){
   const vm=state.viewModel||state.model;if(!vm)return;
   const query=$('[data-project-search]')?.value||'',category=$('[data-project-filter]')?.value||'';
   const more=$('[data-project-more]'),empty=$('[data-project-empty]'),count=$('[data-syn-project-count]');
   const items=filtered(vm.projects,query,p=>!category||p.tags.includes(category));
   const visible=new Set((more?items.slice(0,state.projectLimit):items).map(p=>p.id));
   const synthesis = window.PortfolioSynthesis;
   const selected = synthesis?.active() ? synthesis.selectedProject() : null;
   if(selected&&items.some(item=>item.id===selected))visible.add(selected);
   $$('[data-project-card]').forEach(n=>{n.hidden=!visible.has(n.dataset.projectId);if(!n.hidden)n.classList.add('is-visible');});
   if(more){more.hidden=items.length<=visible.size;more.textContent=`Show more work (${items.length-visible.size}) ↘`;}
   if(empty)empty.hidden=items.length>0;
   if(count)count.textContent=items.length+' '+(items.length===1?'project':'projects')+(query||category?' matching':' total');
   $('#portfolio').dispatchEvent(new (window.Event||Event)('portfolio:project-filtered'));
 }
 function filterCertificates(){const vm=state.viewModel||state.model;if(!vm)return;const query=$('[data-cert-search]')?.value||'',issuer=$('[data-cert-issuer]')?.value||'';const items=filtered(vm.certificates,query,c=>!issuer||c.issuer===issuer),visible=new Set(items.slice(0,state.certLimit).map(c=>c.id));$$('[data-cert-card]').forEach(n=>n.hidden=!visible.has(n.dataset.certId));const more=$('[data-cert-more]'),empty=$('[data-cert-empty]');if(more){more.hidden=items.length<=state.certLimit;more.textContent=`Show more credentials (${Math.max(0,items.length-state.certLimit)}) ↘`;}if(empty)empty.hidden=items.length>0;}
 const skillDisclosures = new WeakMap();
 function filterSkills(){
   const q=($('[data-skill-search]')?.value||'').toLowerCase().trim();
   const items=$$('[data-skill-item]');
   items.forEach(n=>n.hidden=!(n.dataset.skillSearch||n.textContent).toLowerCase().includes(q));
   const hasMatches = n => [...n.querySelectorAll('[data-skill-item]')].some(x=>!x.hidden);
   $$('.record-skill-sub').forEach(n=>n.hidden=!hasMatches(n));
   $$('.record-skill-group').forEach(n=>{
     n.hidden=!hasMatches(n);
     if(n.localName!=='details')return;
     if(q){if(!skillDisclosures.has(n))skillDisclosures.set(n,n.hasAttribute('open'));if(!n.hidden)n.setAttribute('open','');}
     else if(skillDisclosures.has(n)){n.toggleAttribute('open',skillDisclosures.get(n));skillDisclosures.delete(n);}
   });
   const count=$('[data-skill-count]'),empty=$('[data-skill-empty]'),matches=items.filter(n=>!n.hidden).length;
   if(count)count.textContent=`${matches} ${matches===1?'skill':'skills'}${q?' matching':''}`;
   if(empty)empty.hidden=matches>0;
 }
 function wireFilters(){$('[data-project-search]')?.addEventListener('input',()=>{state.projectLimit=6;filterProjects();});$('[data-project-filter]')?.addEventListener('change',()=>{state.projectLimit=6;filterProjects();});$('[data-project-more]')?.addEventListener('click',()=>{state.projectLimit+=6;filterProjects();});$('[data-cert-search]')?.addEventListener('input',()=>{state.certLimit=6;filterCertificates();});$('[data-cert-issuer]')?.addEventListener('change',()=>{state.certLimit=6;filterCertificates();});$('[data-cert-more]')?.addEventListener('click',()=>{state.certLimit+=6;filterCertificates();});$('[data-skill-search]')?.addEventListener('input',filterSkills);const tools=$('.record-skill-tools');if(tools){const group=document.createElement('div');group.className='pf-inline-tools';group.innerHTML='<button type="button" data-skill-open>Expand all</button><button type="button" data-skill-close>Collapse all</button>';tools.append(group);}filterProjects();filterCertificates();filterSkills();}
 function openDialog(dialog){if(typeof dialog.showModal==='function')dialog.showModal();else dialog.setAttribute('open','');}
 function closeDialog(dialog){if(!dialog?.hasAttribute('open'))return;if(typeof dialog.close==='function')dialog.close();else dialog.removeAttribute('open');}
 function projectDetails(id){const p=state.model?.projects.find(x=>x.id===id);if(!p)return;$('#projectDialogBody').innerHTML=`<p class="pf-kicker">PROJECT RECORD</p><h2 id="projectDialogTitle">${h.e(p.title)}</h2>${window.PortfolioSynthesis?.active()?window.PortfolioSynthesis.projectVisual(p,state.model.projects.indexOf(p),h):window.PortfolioPreviews?.renderProject(p,state.model.projects.indexOf(p),h)||''}<p>${h.e(p.description)}</p><div class="pf-dialog-tags">${h.chips(p.tags,p.tags.length)}</div>${p.url?h.link(p.url,p.urlLabel||'Open project ↗','pf-button primary'):''}${p.repositoryUrl?h.link(p.repositoryUrl,p.repositoryLabel||'Repository ↗','pf-button'):''}${(p.links||[]).map(link=>h.link(link.url,link.label||'Project resource ↗','pf-button')).join('')}${!p.url&&!p.repositoryUrl&&!p.links?.length?'<span class="pf-description">No external project link was supplied.</span>':''}${window.PortfolioPreviews?.renderReadmeAction(p,h)||''}`;openDialog($('#projectDialog'));}
 async function copyCitation(button){const text=button.closest('.record-paper')?.querySelector('.record-citation')?.textContent||'';if(!text)return;try{if(!window.navigator?.clipboard?.writeText)throw Error();await window.navigator.clipboard.writeText(text);message('Reference copied.');}catch{$('#projectDialogBody').innerHTML=`<p class="pf-kicker">REFERENCE TEXT</p><h2 id="projectDialogTitle">Citation</h2><p>${h.e(text)}</p>`;openDialog($('#projectDialog'));}}
 function requestScroll(){if(scrollPending)return;scrollPending=true;const frame=typeof window.requestAnimationFrame==='function'?window.requestAnimationFrame.bind(window):cb=>cb();frame(()=>{scrollPending=false;const doc=document.documentElement,top=Number(window.scrollY)||0,total=(Number(doc.scrollHeight)||0)-(Number(window.innerHeight)||0);$('#readingProgress').style.transform=`scaleX(${total>0?Math.max(0,Math.min(1,top/total)):0})`;const current=$$('[data-section]').filter(n=>typeof n.getBoundingClientRect==='function'&&n.getBoundingClientRect().top<200).at(-1)?.id;$$('[data-nav]').forEach(n=>n.classList.toggle('active',n.dataset.nav===current));});}
 document.addEventListener('click',event=>{if(event.target.closest('[data-syn-open-index]')){$('#jumpBtn').click();return;}const project=event.target.closest('[data-open-project]');if(project)projectDetails(project.dataset.openProject);const copy=event.target.closest('[data-copy-citation]');if(copy)copyCitation(copy);if(event.target.closest('[data-close-dialog]'))closeDialog(event.target.closest('dialog'));if(event.target.closest('[data-jump]'))closeDialog($('#jumpDialog'));if(event.target.closest('[data-skill-open]'))$$('.record-skill-group').forEach(n=>n.open=true);if(event.target.closest('[data-skill-close]'))$$('.record-skill-group').forEach(n=>n.open=false);});
 document.addEventListener('pointermove',event=>{if(!effects()||event.pointerType==='touch')return;const card=event.target.closest('[data-tilt]');if(!card||typeof card.getBoundingClientRect!=='function')return;const rect=card.getBoundingClientRect();if(!rect.width||!rect.height)return;card.style.setProperty('--tilt-x',`${(event.clientY-rect.top-rect.height/2)/rect.height*-3}deg`);card.style.setProperty('--tilt-y',`${(event.clientX-rect.left-rect.width/2)/rect.width*3}deg`);});
 document.addEventListener('pointerout',event=>{const card=event.target.closest('[data-tilt]');if(card&&!card.contains(event.relatedTarget)){card.style.setProperty('--tilt-x','0deg');card.style.setProperty('--tilt-y','0deg');}});
 document.addEventListener('keydown',event=>{if((event.ctrlKey||event.metaKey)&&event.key.toLowerCase()==='k'){event.preventDefault();if(state.model){openDialog($('#jumpDialog'));$('#jumpSearch').focus();}}});
 document.addEventListener('visibilitychange',()=>document.body.classList.toggle('pf-tab-hidden',Boolean(document.hidden)));
 $('#jumpBtn').addEventListener('click',()=>{openDialog($('#jumpDialog'));$('#jumpSearch').focus();});$('#jumpSearch').addEventListener('input',event=>{$$('[data-jump]').forEach(n=>n.hidden=!n.textContent.toLowerCase().includes(event.target.value.toLowerCase()));});
 $('#motionMode').addEventListener('change',event=>{state.motionMode=event.target.value;updateMotion();});$('#enableEffects').addEventListener('click',()=>{state.motionMode='full';updateMotion();});reduced.addEventListener?.('change',updateMotion);
 $('#accessForm').addEventListener('submit',login);$('#retryBtn').addEventListener('click',load);$('#logoutBtn').addEventListener('click',async()=>{try{await fetch('/api/session',{method:'DELETE',credentials:'same-origin',cache:'no-store'});}finally{document.title='Portfolio — Research & Code';showAccess('The portfolio is locked.',true);}});
 if(typeof window.addEventListener==='function')window.addEventListener('scroll',requestScroll,{passive:true});
 state.render=render;state.readSynthesisAnchor=readSynthesisAnchor;updateMotion();load();
})();
