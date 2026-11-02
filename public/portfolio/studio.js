(function(w){
 'use strict';
 const $=s=>document.querySelector(s),$$=s=>[...document.querySelectorAll(s)];
 const concepts=['atlas','molecular','terminal'],themes=['light','dark'];
 const sections={all:'Whole portfolio',hero:'Hero',about:'About',projects:'Projects',experience:'Experience',publications:'Publications',education:'Education',skills:'Skills',certificates:'Credentials',languages:'Languages',references:'References',contact:'Contact'};
 let saved={};try{saved=JSON.parse(w.localStorage?.getItem('portfolio.design.preferences.v1')||'{}')||{};}catch{}
 const params=new URLSearchParams(w.location?.search||'');
 const studio=w.PortfolioStudio={concept:concepts.includes(params.get('design'))?params.get('design'):concepts.includes(saved.concept)?saved.concept:'atlas',theme:themes.includes(params.get('theme'))?params.get('theme'):themes.includes(saved.theme)?saved.theme:'light',section:Object.hasOwn(sections,params.get('section'))?params.get('section'):'all',setConcept,setTheme,setSection,afterRender};
 function save(){try{w.localStorage?.setItem('portfolio.design.preferences.v1',JSON.stringify({concept:studio.concept,theme:studio.theme}));}catch{}try{const url=new URL(w.location.href);url.searchParams.set('design',studio.concept);url.searchParams.set('theme',studio.theme);if(studio.section==='all')url.searchParams.delete('section');else url.searchParams.set('section',studio.section);w.history?.replaceState(null,'',url);}catch{}}
 function reflect(){document.body.dataset.concept=studio.concept;document.body.dataset.theme=studio.theme;document.body.classList.toggle('studio-isolated',studio.section!=='all');$$('[data-concept-choice]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.conceptChoice===studio.concept)));$$('[data-theme-choice]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.themeChoice===studio.theme)));const toggle=$('#themeToggle');if(toggle){toggle.textContent=studio.theme==='dark'?'Light ◐':'Dark ◑';toggle.setAttribute('aria-label',`Switch to ${studio.theme==='dark'?'light':'dark'} theme`);}if($('#studioSection'))$('#studioSection').value=studio.section;$$('[data-section]').forEach(el=>el.toggleAttribute('data-studio-selected',studio.section==='all'||el.id===studio.section));if($('#studioStatus'))$('#studioStatus').textContent=`${{atlas:'Biology Atlas',molecular:'Molecular Form',terminal:'Code Notebook'}[studio.concept]} · ${studio.theme} · ${sections[studio.section]}`;const meta=$('meta[name="theme-color"]');if(meta)meta.content=studio.theme==='dark'?'#0b1728':'#f8fcff';}
 function afterRender(){reflect();w.PortfolioScience?.mount($('#portfolio'));}
 function setConcept(value){if(!concepts.includes(value))return;studio.concept=value;save();reflect();if(w.portfolioView?.model)w.portfolioView.render?.();close();jumpToFocus();}
 function setTheme(value){if(!themes.includes(value))return;studio.theme=value;reflect();save();}
 function setSection(value){if(!Object.hasOwn(sections,value))return;studio.section=value;reflect();save();close();jumpToFocus();}
 function jumpToFocus(){const id=studio.section==='all'?'hero':studio.section;$('#'+id)?.scrollIntoView?.({behavior:'instant',block:'start'});}
 function open(){const d=$('#designDialog');if(!d)return;if(d.showModal)d.showModal();else d.setAttribute('open','');}
 function close(){const d=$('#designDialog');if(!d)return;if(d.close)d.close();else d.removeAttribute('open');}
 document.addEventListener('click',event=>{const b=event.target.closest('[data-concept-choice]');if(b)setConcept(b.dataset.conceptChoice);const t=event.target.closest('[data-theme-choice]');if(t)setTheme(t.dataset.themeChoice);if(event.target.closest('[data-open-studio]'))open();if(event.target.closest('[data-close-studio]'))close();if(event.target.closest('#themeToggle'))setTheme(studio.theme==='dark'?'light':'dark');if(event.target.closest('[data-show-all]'))setSection('all');const nav=event.target.closest('a[href^="#"]');if(nav&&studio.section!=='all'){const id=nav.getAttribute('href').slice(1);if(Object.hasOwn(sections,id))setSection(id);}});
 $('#studioSection')?.addEventListener('change',e=>setSection(e.target.value));
 $('#studioMotion')?.addEventListener('change',e=>{const original=$('#motionMode');if(original){original.value=e.target.value;original.dispatchEvent(new (w.Event||Event)('change',{bubbles:true}));}});
 $('#motionMode')?.addEventListener('change',e=>{if($('#studioMotion'))$('#studioMotion').value=e.target.value;});
 reflect();
})(window);
