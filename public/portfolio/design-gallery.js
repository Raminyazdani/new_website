(function (w) {
  'use strict';
  const registry = w.PortfolioDesigns;
  const navigation = w.PortfolioDesignNavigation;
  if (!registry || !navigation) return;
  const e = value => String(value ?? '').replace(/[&<>"']/g, c => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' }[c]));
  const palette = {
    journal:['#f6f0e5','#9f352c','#27221d'],helix:['#071019','#65e3cd','#e4f7f5'],organic:['#f5f4e9','#366e52','#263c31'],monograph:['#f3f2ed','#b2462d','#232220'],specimen:['#eef1ed','#287148','#24372b'],
    pipeline:['#10151c','#90dfa8','#e8f0f9'],bento:['#12150f','#c5ef75','#f0f4e8'],'atlas-map':['#fafbfe','#354fbb','#152343'],console:['#151811','#d0e59c','#edf1e4'],blueprint:['#edf4fc','#1d579b','#173e69'],
    chromatography:['#f7f4eb','#27674d','#23392f'],gallery:['#f7f5f0','#85502d','#262521'],dossier:['#f0f2ed','#23563f','#1a2c24'],kinetic:['#151a19','#d7f080','#f0f2de'],horizon:['#0f2028','#90d5d7','#e3f4ec']
  };
  const familyLabels = { editorial:'Editorial', systems:'Systems', experimental:'Experimental', life:'Life sciences', data:'Data', lab:'Laboratory', product:'Product', story:'Story' };
  const imported = w.PortfolioImportedTemplates || [];
  const names = { unified:'Connected Science', atlas:'Archived Biology Atlas', molecular:'Archived Molecular Form', terminal:'Archived Code Notebook' };
  const $ = selector => document.querySelector(selector);
  const familyLabel = value => familyLabels[String(value || '').toLowerCase()] || String(value || 'Other').replace(/(^|[-\s])\w/g, part => part.toUpperCase());

  function open() {
    syncImportedLinks();
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
    if ($('#designCollectionCount')) $('#designCollectionCount').textContent = String(imported.length ? registry.list().length + imported.length : entries().length);
    syncImportedLinks();
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
  const params = new URLSearchParams(w.location?.search || '');
  const requestedLocale = params.get('lang');
  const locale = ['en', 'de', 'fa'].includes(requestedLocale) ? requestedLocale : 'en';
  const internalEntries = group => registry.collection ? registry.collection(group) : registry.list();
  const nativeEntries = () => [...internalEntries('independent'), ...internalEntries('previous')];
  const collectionOf = id => registry.get(id)?.collection === 'independent' ? 'independent' : 'previous';
  const scopes = imported.length ? ['all', 'imported', 'independent', 'previous'] : ['independent', 'previous'];
  let activeId = params.get('design') || 'unified';
  let scope = imported.length ? 'all' : registry.get(activeId) ? collectionOf(activeId) : internalEntries('independent').length ? 'independent' : 'previous';
  if (scopes.includes(params.get('collection'))) scope = params.get('collection');

  function entries() {
    if (scope === 'imported') return imported;
    if (scope === 'all') return [...imported, ...nativeEntries()];
    return internalEntries(scope);
  }

  function importedHref(id) {
    const preferences = navigation.readPreferences(w.location.search);
    const studio = w.PortfolioStudio;
    if (studio) {
      preferences.theme = studio.theme;
      preferences.background = studio.background;
    }
    preferences.motion = w.portfolioView?.motionMode || preferences.motion;
    return navigation.templateHref({ collection: 'imported', id }, locale, preferences);
  }

  function syncImportedLinks() {
    const prefix = 'imported-';
    document.querySelectorAll(`[data-gallery-design^="${prefix}"]`).forEach(card => {
      card.querySelector('a')?.setAttribute('href', importedHref(card.dataset.galleryDesign.slice(prefix.length)));
    });
  }

  function stepDesign(direction) {
    const studio = w.PortfolioStudio;
    if (!studio) return;
    const cycle = navigation.templateCycle(imported.map(design => design.id), nativeEntries().map(design => design.id));
    const next = navigation.adjacentTemplate(cycle, { collection: 'native', id: studio.concept }, direction);
    if (next?.collection === 'imported') w.location.assign(importedHref(next.id));
    else if (next) studio.setConcept(next.id, { keepTheme: true });
  }

  function renderCard(design, index) {
    const isImported = imported.includes(design);
    const colors = design.palette || palette[design.id] || palette.journal;
    const number = String(index + 1).padStart(2, '0');
    const id = isImported ? `imported-${design.id}` : design.id;
    const family = String(design.family).toLowerCase();
    const source = isImported ? 'New Web' : collectionOf(design.id) === 'independent' ? 'Independent' : 'Earlier study';
    const search = [design.id, design.name, design.description, design.family, source, design.signature, ...Object.values(design.fingerprint || {})].join(' ').toLowerCase();
    const content = `<span class="dg-card-content">
      <span class="dg-card-meta"><span>${number} · ${e(source)}</span><span>${e(familyLabel(design.family))}</span></span>
      <strong>${e(design.name)}</strong>
      <span class="dg-card-description">${e(design.description)}</span>
      <span class="dg-card-signature">${e(isImported ? 'English · Deutsch · فارسی' : design.signature)}</span>
      <span class="dg-card-action">Open template <span aria-hidden="true">↗</span></span>
      ${isImported ? '' : '<span class="dg-selected" hidden>Current selection</span>'}
    </span>`;
    const style = `--accent:${colors[1]};--accent-ink:${colors[2]}`;
    const preview = `<span class="dg-preview" style="--preview-paper:${colors[0]}">
      <img src="/portfolio/previews/${e(id)}.webp" width="640" height="400" loading="lazy" decoding="async" alt="${e(design.name)} layout preview">
    </span>`;
    const action = isImported
      ? `<a href="${e(importedHref(design.id))}" style="${style}">${preview}${content}</a>`
      : `<button type="button" data-design-choice="${e(design.id)}" style="${style}" aria-pressed="false">${preview}${content}</button>`;
    return `<article class="dg-card" data-gallery-design="${e(id)}" data-gallery-family="${e(family)}" data-gallery-search="${e(search)}">${action}</article>`;
  }

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
    const introductions = {
      all: `${designs.length} templates from all three collections. Search by name or filter by collection.`,
      imported: `${designs.length} New Web templates with their original layouts and interactions.`,
      independent: `${designs.length} independent visual worlds. Open a direction to explore its complete portfolio.`,
      previous: 'The earlier collection, preserved with its original layouts.',
    };
    if (intro) intro.textContent = `${introductions[scope]} Previews show the layouts with a sample CV.`;
    host.innerHTML = designs.map(renderCard).join('');
    filter();
  }
  const reflectSelection = reflect;
  reflect = function (id) {
    activeId = id;
    if (!imported.length && registry.has(id) && collectionOf(id) !== scope) {
      scope = collectionOf(id);
      populate();
    }
    reflectSelection(id);
  };
  function init() {
    if (!$('#designGalleryBody')) return;
    const collectionSelect = $('#designGalleryCollection');
    if (collectionSelect) {
      const labels = {
        all: `All ${registry.list().length + imported.length} templates`,
        imported: `New Web · ${imported.length}`,
        independent: `Independent · ${internalEntries('independent').length}`,
        previous: `Earlier studies · ${internalEntries('previous').length}`,
      };
      collectionSelect.innerHTML = scopes.map(group => `<option value="${group}">${e(labels[group])}</option>`).join('');
    }
    populate();
    $('#designGallerySearch')?.addEventListener('input', filter);
    $('#designGalleryFamily')?.addEventListener('change', filter);
    document.addEventListener('change', event => {
      if (event.target.matches('#motionMode, #studioMotion')) syncImportedLinks();
    });
    $('#designGalleryCollection')?.addEventListener('change', event => {
      if (!scopes.includes(event.target.value)) return;
      scope = event.target.value;
      if ($('#designGallerySearch')) $('#designGallerySearch').value = '';
      populate(); reflectSelection(activeId);
    });
    $('#designGallery')?.addEventListener('click', event => { if (event.target === event.currentTarget) close(); });
    document.addEventListener('click', event => {
      if (event.target.closest('[data-open-design-gallery]')) { const dialog=$('#designDialog');if(dialog?.open)dialog.close();open(); }
      if (event.target.closest('[data-close-design-gallery]')) close();
      const choice=event.target.closest('[data-design-choice]');
      if(choice){ w.PortfolioStudio?.setConcept(choice.dataset.designChoice);close(); }
      const step = event.target.closest('[data-design-step]');
      if (step) stepDesign(step.dataset.designStep === '-1' ? -1 : 1);
      if (event.target.closest('#enableEffects')) syncImportedLinks();
    });
    reflect(w.PortfolioStudio?.concept||activeId);
    if(new URLSearchParams(w.location?.search||'').get('gallery')==='1')open();
  }
  w.PortfolioDesignGallery = { open, close, reflect, init };
  init();
})(window);
