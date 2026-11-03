(function (w) {
  'use strict';
  const registry = w.PortfolioDesigns;
  if (!registry) return;
  const e = v => String(v ?? '').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const palette = {
    journal:['#f6f0e5','#9f352c','#27221d'],helix:['#071019','#65e3cd','#e4f7f5'],organic:['#f5f4e9','#366e52','#263c31'],monograph:['#f3f2ed','#b2462d','#232220'],specimen:['#eef1ed','#287148','#24372b'],
    pipeline:['#10151c','#90dfa8','#e8f0f9'],bento:['#12150f','#c5ef75','#f0f4e8'],'atlas-map':['#fafbfe','#354fbb','#152343'],console:['#151811','#d0e59c','#edf1e4'],blueprint:['#edf4fc','#1d579b','#173e69'],
    chromatography:['#f7f4eb','#27674d','#23392f'],gallery:['#f7f5f0','#85502d','#262521'],dossier:['#f0f2ed','#23563f','#1a2c24'],kinetic:['#151a19','#d7f080','#f0f2de'],horizon:['#0f2028','#90d5d7','#e3f4ec']
  };
  const names = {unified:'Connected Science',atlas:'Archived Biology Atlas',molecular:'Archived Molecular Form',terminal:'Archived Code Notebook'};
  const $ = s => document.querySelector(s);
  function open() { const dialog=$('#designGallery');if(dialog?.showModal)dialog.showModal();else dialog?.setAttribute('open',''); }
  function close() { const dialog=$('#designGallery');if(dialog?.close)dialog.close();else dialog?.removeAttribute('open'); }
  function reflect(id) {
    const meta=registry.get(id); const title=meta?.name||names[id]||names.unified;
    document.querySelectorAll('[data-design-choice]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.designChoice===id)));
    if($('#designDockName'))$('#designDockName').textContent=title;
    if($('#designGalleryCurrent'))$('#designGalleryCurrent').textContent=`Current: ${title}`;
    if($('#designCollectionCount'))$('#designCollectionCount').textContent=String(registry.list().length);
  }
  function filter() {
    const q=($('#designGallerySearch')?.value||'').toLowerCase().trim();
    const family=$('#designGalleryFamily')?.value||'';
    let count=0;
    document.querySelectorAll('[data-gallery-design]').forEach(card=>{card.hidden=!!((q&&!card.dataset.gallerySearch.includes(q))||(family&&card.dataset.galleryFamily!==family));if(!card.hidden)count++;});
    if($('#designGalleryEmpty'))$('#designGalleryEmpty').hidden=count>0;
    if($('#designGalleryResults'))$('#designGalleryResults').textContent=`${count} designs`;
  }
  function sketch(meta) {
    const p=palette[meta.id]||palette.journal;
    return `<div class="dg-sketch dg-sketch-${e(meta.id)}" style="--sk-paper:${p[0]};--sk-accent:${p[1]};--sk-ink:${p[2]}" aria-hidden="true"><span class="dg-mini-nav"></span><span class="dg-mini-title"></span><span class="dg-mini-copy"></span><span class="dg-mini-portrait"></span><span class="dg-mini-figure"></span><div class="dg-mini-records"><i></i><i></i><i></i><i></i></div><small>Layout sketch</small></div>`;
  }
  function init() {
    const host=$('#designGalleryBody'); if(!host)return;
    const designs=registry.list();
    const families=[...new Set(designs.map(d=>String(d.family).toLowerCase()))].sort();
    const familySelect=$('#designGalleryFamily');
    if(familySelect)familySelect.innerHTML='<option value="">All directions</option>'+families.map(f=>`<option value="${e(f)}">${e(f[0].toUpperCase()+f.slice(1))}</option>`).join('');
    host.innerHTML=designs.map((d,i)=>`<article class="dg-card" data-gallery-design="${e(d.id)}" data-gallery-family="${e(String(d.family).toLowerCase())}" data-gallery-search="${e([d.name,d.description,d.family,d.signature].join(' ').toLowerCase())}"><button type="button" data-design-choice="${e(d.id)}" aria-pressed="false" aria-label="Open ${e(d.name)} design">${sketch(d)}<span class="dg-card-content"><span class="dg-card-meta">${String(i+1).padStart(2,'0')} / ${e(d.family)}</span><strong>${e(d.name)}</strong><span class="dg-card-description">${e(d.description)}</span><span class="dg-card-signature">${e(d.signature)}</span><span class="dg-card-action">Explore this design ↗</span></span></button></article>`).join('');
    $('#designGallerySearch')?.addEventListener('input',filter);familySelect?.addEventListener('change',filter);
    document.addEventListener('click',event=>{
      if(event.target.closest('[data-open-design-gallery]')){const d=$('#designDialog');if(d?.open)d.close();open();}
      if(event.target.closest('[data-close-design-gallery]'))close();
      const choice=event.target.closest('[data-design-choice]');if(choice){w.PortfolioStudio?.setConcept(choice.dataset.designChoice);close();}
      const step=event.target.closest('[data-design-step]');if(step){const ids=['unified',...registry.list().map(d=>d.id)], index=Math.max(0,ids.indexOf(w.PortfolioStudio?.concept));w.PortfolioStudio?.setConcept(ids[(index+Number(step.dataset.designStep)+ids.length)%ids.length]);}
    });
    filter();reflect(w.PortfolioStudio?.concept||'unified');
    if(new URLSearchParams(w.location?.search||'').get('gallery')==='1')open();
  }
  w.PortfolioDesignGallery={open,close,reflect,init};
  init();
})(window);
