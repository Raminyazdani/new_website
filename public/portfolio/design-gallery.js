(function (w) {
  'use strict';
  const registry = w.PortfolioDesigns;
  if (!registry) return;
  const e = value => String(value ?? '').replace(/[&<>"']/g, c => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' }[c]));
  const palette = {
    journal:['#f6f0e5','#9f352c','#27221d'],helix:['#071019','#65e3cd','#e4f7f5'],organic:['#f5f4e9','#366e52','#263c31'],monograph:['#f3f2ed','#b2462d','#232220'],specimen:['#eef1ed','#287148','#24372b'],
    pipeline:['#10151c','#90dfa8','#e8f0f9'],bento:['#12150f','#c5ef75','#f0f4e8'],'atlas-map':['#fafbfe','#354fbb','#152343'],console:['#151811','#d0e59c','#edf1e4'],blueprint:['#edf4fc','#1d579b','#173e69'],
    chromatography:['#f7f4eb','#27674d','#23392f'],gallery:['#f7f5f0','#85502d','#262521'],dossier:['#f0f2ed','#23563f','#1a2c24'],kinetic:['#151a19','#d7f080','#f0f2de'],horizon:['#0f2028','#90d5d7','#e3f4ec']
  };
  const familyLabels = { editorial:'Editorial', systems:'Systems', experimental:'Experimental' };
  const names = { unified:'Connected Science', atlas:'Archived Biology Atlas', molecular:'Archived Molecular Form', terminal:'Archived Code Notebook' };
  const $ = selector => document.querySelector(selector);
  const familyLabel = value => familyLabels[String(value || '').toLowerCase()] || String(value || 'Other').replace(/(^|[-\s])\w/g, part => part.toUpperCase());

  function open() {
    const dialog = $('#designGallery');
    if (dialog?.showModal && !dialog.open) dialog.showModal();
    else if (dialog && !dialog.open) dialog.setAttribute('open', '');
  }
  function close() {
    const dialog = $('#designGallery');
    if (dialog?.close && dialog.open) dialog.close();
    else dialog?.removeAttribute('open');
  }
  function reflect(id) {
    const meta = registry.get(id);
    const title = meta?.name || names[id] || names.unified;
    document.querySelectorAll('[data-design-choice]').forEach(button => {
      const selected = button.dataset.designChoice === id;
      button.setAttribute('aria-pressed', String(selected));
      const badge = button.querySelector('.dg-selected');
      if (badge) badge.hidden = !selected;
      if (button.matches('.dg-card button')) button.setAttribute('aria-label', `${selected ? 'Current design' : 'Select'}: ${registry.get(button.dataset.designChoice)?.name || button.dataset.designChoice}`);
    });
    if ($('#designDockName')) $('#designDockName').textContent = title;
    if ($('#designGalleryCurrent')) $('#designGalleryCurrent').textContent = `Current selection: ${title}`;
    if ($('#designCollectionCount')) $('#designCollectionCount').textContent = String(registry.list().length);
  }
  function filter() {
    const query = ($('#designGallerySearch')?.value || '').toLowerCase().trim();
    const family = $('#designGalleryFamily')?.value || '';
    let count = 0;
    document.querySelectorAll('[data-gallery-design]').forEach(card => {
      card.hidden = Boolean((query && !card.dataset.gallerySearch.includes(query)) || (family && card.dataset.galleryFamily !== family));
      if (!card.hidden) count++;
    });
    if ($('#designGalleryEmpty')) $('#designGalleryEmpty').hidden = count > 0;
    if ($('#designGalleryResults')) $('#designGalleryResults').textContent = `${count} ${count === 1 ? 'design' : 'designs'} shown`;
  }
  function sketch(meta) {
    const colors = meta.palette || palette[meta.id] || palette.journal;
    return `<div class="dg-sketch dg-sketch-${e(meta.id)}" style="--sk-paper:${colors[0]};--sk-accent:${colors[1]};--sk-ink:${colors[2]}" aria-hidden="true"><span class="dg-mini-nav"></span><span class="dg-mini-title"></span><span class="dg-mini-copy"></span><span class="dg-mini-portrait"></span><span class="dg-mini-figure"></span><div class="dg-mini-records"><i></i><i></i><i></i><i></i></div><small>Schematic layout preview</small></div>`;
  }
  let activeId = new URLSearchParams(w.location?.search || '').get('design') || 'unified';
  let scope = registry.get(activeId) ? (registry.get(activeId).collection === 'independent' ? 'independent' : 'previous') : registry.collection?.('independent').length ? 'independent' : 'previous';
  const entries = () => registry.collection ? registry.collection(scope) : registry.list();
  function populate() {
    const host = $('#designGalleryBody'); if (!host) return;
    const designs = entries(), familySelect = $('#designGalleryFamily');
    const families = [...new Set(designs.map(design => String(design.family).toLowerCase()))].sort();
    if (familySelect) {
      familySelect.innerHTML = '<option value="">All directions</option>' + families.map(family => `<option value="${e(family)}">${e(familyLabel(family))}</option>`).join('');
      familySelect.closest('label').hidden = families.length < 2;
    }
    if ($('#designGalleryCollection')) $('#designGalleryCollection').value = scope;
    const intro = $('#designGallery')?.querySelector('.dg-header p');
    if (intro) intro.textContent = scope === 'independent' ? '15 independent visual worlds. Open a direction to explore its complete portfolio.' : 'The earlier collection, preserved with its original layouts.';
    host.innerHTML = designs.map((design, index) => {
      const colors = design.palette || palette[design.id] || palette.journal;
      return `<article class="dg-card" data-gallery-design="${e(design.id)}" data-gallery-family="${e(String(design.family).toLowerCase())}" data-gallery-search="${e([design.name,design.description,design.family,design.signature,...Object.values(design.fingerprint||{})].join(' ').toLowerCase())}"><button type="button" data-design-choice="${e(design.id)}" style="--accent:${colors[1]};--accent-ink:${colors[2]}" aria-pressed="false">${sketch(design)}<span class="dg-card-content"><span class="dg-card-meta"><span>${String(index+1).padStart(2,'0')}</span><span>${e(familyLabel(design.family))}</span></span><strong>${e(design.name)}</strong><span class="dg-card-description">${e(design.description)}</span><span class="dg-card-signature">${e(design.signature)}</span><span class="dg-card-action">Explore this world <span aria-hidden="true">↗</span></span><span class="dg-selected" hidden>Current selection</span></span></button></article>`;
    }).join('');
    filter();
  }
  const reflectSelection = reflect;
  reflect = function (id) {
    activeId = id;
    const meta = registry.get(id), desired = meta ? meta.collection === 'independent' ? 'independent' : 'previous' : scope;
    if (desired !== scope) { scope = desired; populate(); }
    reflectSelection(id);
    if ($('#designCollectionCount')) $('#designCollectionCount').textContent = String(entries().length);
  };
  function init() {
    if (!$('#designGalleryBody')) return;
    populate();
    $('#designGallerySearch')?.addEventListener('input', filter);
    $('#designGalleryFamily')?.addEventListener('change', filter);
    $('#designGalleryCollection')?.addEventListener('change', event => {
      scope = event.target.value === 'previous' ? 'previous' : 'independent';
      if ($('#designGallerySearch')) $('#designGallerySearch').value = '';
      populate(); reflectSelection(activeId);
    });
    $('#designGallery')?.addEventListener('click', event => { if (event.target === event.currentTarget) close(); });
    document.addEventListener('click', event => {
      if (event.target.closest('[data-open-design-gallery]')) { const dialog=$('#designDialog');if(dialog?.open)dialog.close();open(); }
      if (event.target.closest('[data-close-design-gallery]')) close();
      const choice=event.target.closest('[data-design-choice]');
      if(choice){ w.PortfolioStudio?.setConcept(choice.dataset.designChoice);close(); }
      const step=event.target.closest('[data-design-step]');
      if(step){
        const current=registry.get(w.PortfolioStudio?.concept), group=current?.collection==='independent'?'independent':current?'previous':scope;
        const collection=registry.collection?registry.collection(group):registry.list();
        const ids=[...(group==='previous'?['unified']:[]),...collection.map(d=>d.id)];
        const index=ids.indexOf(w.PortfolioStudio?.concept);
        w.PortfolioStudio?.setConcept(ids[(Math.max(-1,index)+Number(step.dataset.designStep)+ids.length)%ids.length]);
      }
    });
    reflect(w.PortfolioStudio?.concept||activeId);
    if(new URLSearchParams(w.location?.search||'').get('gallery')==='1')open();
  }
  w.PortfolioDesignGallery = { open, close, reflect, init };
  init();
})(window);
