(function (w) {
  'use strict';

  const panes = [['files', 'Files'], ['document', 'Document'], ['properties', 'Properties']];
  const stages = [['source', 'Source'], ['method', 'Method'], ['artifact', 'Artifact']];
  const shapes = {
    workbench: '<rect x="3" y="5" width="18" height="14" rx="1.5"/><path d="M3 9h18m-13 0v10m8-10v10"/>',
    files: '<path d="M3 19V5h7l2 3h9v11z"/>',
    document: '<path d="M6 3h8l4 4v14H6zM14 3v5h4m-9 5h6m-6 4h6"/>',
    properties: '<rect x="3" y="5" width="18" height="14" rx="1.5"/><path d="M13 5v14m3-10h2m-2 4h2"/>',
    maximize: '<path d="M4 10V4h6m4 0h6v6m0 4v6h-6m-4 0H4v-6"/>',
    restore: '<path d="M9 4h11v11m-16-5h10v10H4z"/>',
    arrow: '<path d="M4 12h15m-5-5 5 5-5 5"/>',
    link: '<path d="m9 15 6-6m-4 2 3-3a4 4 0 0 1 6 6l-3 3m-6-4-3 3a4 4 0 0 1-6-6l3-3"/>',
  };
  const icon = key => `<svg class="syn-wb-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${shapes[key]}</svg>`;

  function render(navMarkup) {
    return `<div class="syn-project-desk syn-code-desk syn-workbench" data-syn-project-desk="programming" data-workbench-active="files" data-workbench-maximized="false">
      <div class="syn-wb-bar">
        <div class="syn-wb-brand">${icon('workbench')}<strong>Project workbench</strong></div>
        <div class="syn-wb-dock" aria-label="Workspace panes" role="group">${panes.map(([key, label]) => `<button type="button" data-workbench-show="${key}" aria-controls="syn-wb-${key}" aria-pressed="${key === 'files'}">${icon(key)}<span>${label}</span></button>`).join('')}</div>
        <button class="syn-wb-max" type="button" data-workbench-maximize aria-pressed="false" aria-controls="syn-wb-document">${icon('maximize')}<span>Maximize document</span></button>
      </div>
      <section class="syn-wb-files" id="syn-wb-files" data-workbench-pane="files" aria-label="Project files">${navMarkup}</section>
      <section class="syn-wb-document" id="syn-wb-document" data-workbench-pane="document" aria-label="Project document">
        <div class="syn-wb-pane-title">${icon('document')}<span>Project document</span></div>
        <div class="syn-wb-stages" role="tablist" aria-label="Project pipeline">${stages.map(([key, label], i) => `<button type="button" role="tab" id="syn-wb-tab-${key}" data-workbench-stage="${key}" aria-controls="syn-wb-stage-${key}" aria-selected="${i === 0}" tabindex="${i === 0 ? 0 : -1}"><span>${label}</span>${i < stages.length - 1 ? icon('arrow') : ''}</button>`).join('')}</div>
        <div class="syn-work-inspector" id="syn-work-inspector" data-syn-project-inspector>
          <div data-workbench-copy></div>
          ${stages.map(([key], i) => `<div class="syn-wb-stage-panel" role="tabpanel" id="syn-wb-stage-${key}" data-workbench-panel="${key}" aria-labelledby="syn-wb-tab-${key}" tabindex="0"${i ? ' hidden' : ''}></div>`).join('')}
        </div>
      </section>
      <aside class="syn-wb-properties" id="syn-wb-properties" data-workbench-pane="properties" aria-label="Project properties">
        <div class="syn-wb-pane-title">${icon('properties')}<span>Properties</span></div>
        <div class="syn-wb-properties-body" data-workbench-properties></div>
      </aside>
    </div>`;
  }

  function recordLinks(record, h) {
    const rows = [
      [record.url, record.urlLabel || 'Project link'],
      [record.repositoryUrl, record.repositoryLabel || 'Repository'],
      ...(record.links || []).map(link => [link.url, link.label || 'Project resource']),
    ];
    const seen = new Set();
    return rows.flatMap(([url, label]) => {
      if (!url || seen.has(url)) return [];
      seen.add(url);
      const link = h.link(url, label);
      return link ? [link] : [];
    });
  }

  function mount(desk, h, { signal, state }) {
    const paneControls = [...desk.querySelectorAll('[data-workbench-show]')];
    const stageControls = [...desk.querySelectorAll('[data-workbench-stage]')];
    const max = desk.querySelector('[data-workbench-maximize]');
    const copy = desk.querySelector('[data-workbench-copy]');
    const properties = desk.querySelector('[data-workbench-properties]');
    const panels = Object.fromEntries(stages.map(([key]) => [key, desk.querySelector(`[data-workbench-panel="${key}"]`)]));
    const narrow = w.matchMedia?.('(max-width: 880px)');

    function reflectPane() {
      desk.dataset.workbenchActive = state.pane;
      desk.dataset.workbenchMaximized = String(state.maximized);
      paneControls.forEach(button => button.setAttribute('aria-pressed', String(button.dataset.workbenchShow === state.pane)));
      max.setAttribute('aria-pressed', String(state.maximized));
      max.innerHTML = `${icon(state.maximized ? 'restore' : 'maximize')}<span>${state.maximized ? 'Restore workspace' : 'Maximize document'}</span>`;
    }
    function activate(pane, { focus = false } = {}) {
      state.pane = pane;
      if (pane !== 'document') state.maximized = false;
      reflectPane();
      if (focus) paneControls.find(button => button.dataset.workbenchShow === pane)?.focus();
    }
    function setStage(stage, focus = false) {
      state.stage = stage;
      stageControls.forEach(button => {
        const active = button.dataset.workbenchStage === stage;
        button.setAttribute('aria-selected', String(active));
        button.tabIndex = active ? 0 : -1;
        panels[button.dataset.workbenchStage].hidden = !active;
        if (active && focus) button.focus();
      });
    }
    function update(record, copyMarkup = '', graphicMarkup = '') {
      if (!record) {
        copy.replaceChildren();
        properties.replaceChildren();
        Object.values(panels).forEach(panel => panel.replaceChildren());
        return;
      }
      copy.innerHTML = copyMarkup;
      const details = copy.querySelector('.syn-inspector-copy');
      const source = details?.querySelector('p');
      const topics = details?.querySelector('.syn-tags');
      details?.querySelectorAll('.syn-record-actions a').forEach(link => link.remove());
      panels.source.replaceChildren();
      if (source) panels.source.append(source);
      else panels.source.innerHTML = record.description ? `<p>${h.e(record.description)}</p>` : '<p>No description was supplied.</p>';
      panels.method.replaceChildren();
      if (topics) {
        const label = desk.ownerDocument.createElement('p');
        label.className = 'syn-wb-topic-note'; label.textContent = 'Topics listed in the project record';
        panels.method.append(label, topics);
      }
      else panels.method.innerHTML = '<p>No topics were supplied.</p>';
      const links = recordLinks(record, h);
      panels.artifact.innerHTML = `${links.length ? `<ul class="syn-wb-links" aria-label="Project resources">${links.map(link => `<li>${icon('link')}${link}</li>`).join('')}</ul>` : '<p>No project links were supplied.</p>'}${graphicMarkup ? `<div class="syn-inspector-graphic">${graphicMarkup}</div>` : ''}`;
      properties.innerHTML = `<dl><div><dt>Topics</dt><dd>${record.tags?.length ? `<ul>${record.tags.map(topic => `<li>${h.e(topic)}</li>`).join('')}</ul>` : 'None supplied'}</dd></div><div><dt>Source links</dt><dd>${links.length}</dd></div></dl><button type="button" class="syn-wb-artifacts" data-workbench-artifacts>View artifacts${icon('arrow')}</button>`;
    }

    desk.addEventListener('click', event => {
      const pane = event.target.closest('[data-workbench-show]');
      const stage = event.target.closest('[data-workbench-stage]');
      if (pane) activate(pane.dataset.workbenchShow);
      if (stage) setStage(stage.dataset.workbenchStage);
      if (event.target.closest('[data-workbench-maximize]')) {
        state.maximized = !state.maximized;
        activate('document');
      }
      if (event.target.closest('[data-workbench-artifacts]')) {
        activate('document');
        setStage('artifact', true);
      }
      if (narrow?.matches && event.target.closest('[data-syn-project-select]')) activate('document', { focus: true });
    }, { signal });
    desk.addEventListener('keydown', event => {
      if (event.key === 'Escape' && state.maximized) {
        state.maximized = false;
        reflectPane();
        max.focus();
        return;
      }
      const stage = event.target.closest('[data-workbench-stage]');
      const pane = event.target.closest('[data-workbench-show]');
      if ((!stage && !pane) || !['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return;
      event.preventDefault();
      const controls = stage ? stageControls : paneControls;
      const direction = w.getComputedStyle?.(desk).direction === 'rtl' ? -1 : 1;
      const delta = event.key === 'ArrowLeft' ? -direction : direction;
      const index = event.key === 'Home' ? 0 : event.key === 'End' ? controls.length - 1
        : (controls.indexOf(stage || pane) + delta + controls.length) % controls.length;
      if (stage) setStage(controls[index].dataset.workbenchStage, true);
      else activate(controls[index].dataset.workbenchShow, { focus: true });
    }, { signal });
    reflectPane();
    setStage(state.stage);
    return { update };
  }

  w.PortfolioSynthesisWorkbench = { render, mount };
})(window);
