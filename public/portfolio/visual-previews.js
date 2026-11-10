(function () {
  'use strict';
  const list = value => Array.isArray(value) ? value.filter(x => typeof x === 'string' && x.trim()) : [];
  const string = value => typeof value === 'string' ? value : '';
  const escape = value => String(value ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  function resource(value) {
    try { const url = new URL(value); return /^https?:$/.test(url.protocol) && !url.username && !url.password ? url : null; } catch { return null; }
  }
  function documentSource(certificate) {
    const url = resource(certificate.url);
    if (!url) return { url: '', kind: 'link', thumbnail: '' };
    const pdf = /\.pdf$/i.test(url.pathname);
    const image = /\.(?:png|jpe?g|webp|gif|avif)$/i.test(url.pathname);
    let thumbnail = image ? url.href : '';
    // Cloudinary supports a first-page image transformation for permitted PDF assets.
    if (pdf && url.hostname === 'res.cloudinary.com' && /\/image\/upload\//.test(url.pathname)) {
      const thumb = new URL(url.href);
      thumb.pathname = thumb.pathname.replace('/image/upload/', '/image/upload/pg_1,f_jpg,w_640,c_limit/').replace(/\.pdf$/i, '.jpg');
      thumbnail = thumb.href;
    }
    return { url: url.href, kind: pdf ? 'pdf' : image ? 'image' : 'link', thumbnail };
  }
  function renderCertificate(c, index, h) {
    const e = h?.e || escape, source = documentSource(c);
    const cover = `<div class="vp-document-cover"><span class="vp-document-rule"></span><span class="vp-document-caption">${e(c.hasCertificate ? 'Certificate record' : 'Course record')}</span><strong>${e(c.title)}</strong><span>${e(c.issuer)}</span><small>${e(c.date)}</small><span class="vp-document-foot">${String(index + 1).padStart(2, '0')} / Document cover · from CV</span></div>`;
    return `<div class="vp-certificate-media${source.thumbnail ? ' has-source' : ''}">${cover}${source.thumbnail ? `<img data-vp-thumbnail src="${e(source.thumbnail)}" alt="Document preview: ${e(c.title)}" loading="lazy" decoding="async" referrerpolicy="no-referrer"><span class="vp-source-caption">${source.kind === 'pdf' ? 'Source document · page 1' : 'Source document'}</span>` : ''}</div>`;
  }
  function renderProject(p, index, h, { diagramOnly = false } = {}) {
    const e = h?.e || escape, title = string(p.title), description = string(p.description);
    // Preview vocabulary is source-derived; broad CV filing labels remain in the main card metadata.
    const tags = list(p.tags).filter(tag => !/^(?:full\s*cv|academic|student\s*projects?)$/i.test(tag.trim()));
    const key = [title, description, ...tags].join(' ');
    const unique = values => [...new Map(values.map(value => [value.toLowerCase(), value])).values()];
    const sourceMatches = expression => unique(key.match(expression) || []);
    const tools = sourceMatches(/\b(?:Flask|React(?:\.js)?|Next\.js|Vue(?:\.js)?|SQLite|PostgreSQL|MySQL|MongoDB|Python|JavaScript|TypeScript|HTML5?|CSS3?|Tailwind(?:\s+CSS)?|Bootstrap|FastAPI|Django|Docker|Streamlit|Shiny|RStudio|Bioconductor|Snakemake|Nextflow|TensorFlow|PyTorch|scikit-learn|Pandas|NumPy|GitHub\s+Actions)\b/gi);
    const omics = sourceMatches(/\b(?:metagenomic|transcriptomic|proteomic)(?:s)?\b/gi);
    const specific = sourceMatches(/\b(?:RNA[- ]seq|single[- ]cell|gene\s+expression|sequence\s+analysis|molecular\s+docking|molecular\s+dynamics|protein\s+structure|mass\s+spectrometry|machine\s+learning|deep\s+learning|data\s+visualization|differential\s+expression|genomic|microbiome|genome|phylogenetic|sequencing|proteins?|enzymes?|metabolomic|chromatography|electrophoresis|PCR|CRISPR)\b/gi);
    const specificTags = tags.filter(tag => !/^(?:bioinformatics|programming|research|biology|software|data\s+science)$/i.test(tag.trim()));
    const titleWords = title.match(/[\p{L}\p{N}][\p{L}\p{N}-]{4,}/gu) || [];
    const topics = unique([...tools, ...specific, ...specificTags, ...titleWords.filter(word => !/^(?:using|based|project|development|analysis|application|system|study|approach|through|integrated)$/i.test(word))]).slice(0, 4);
    const hash = Array.from(title).reduce((sum, char) => sum + char.charCodeAt(0), 0);
    const mode = omics.length >= 2 ? 'omics'
      : tools.length && /web|platform|application|dashboard|system|website|portal|software|Flask|React|Django|Streamlit/i.test(key) ? 'stack'
      : /pipeline|workflow|sequenc|rna-seq/i.test(key) ? 'flow'
      : /protocol|experiment|laborator|assay/i.test(key) ? 'protocol'
        : ['brief', 'outline', 'topics'][Math.abs(hash + index) % 3];
    if (diagramOnly && !['omics', 'stack', 'flow', 'protocol'].includes(mode)) return '';
    const caption = diagramOnly ? '<span class="vp-preview-origin">Illustrated project topics</span>' : `<span class="vp-preview-origin">${['omics', 'stack', 'flow'].includes(mode) ? 'Topics from CV · illustrative' : 'Project brief · from CV'}</span>`;
    const shortDescription = description.length > 100 ? description.slice(0, 97).trimEnd() + '…' : description;
    let content = '';
    if (mode === 'omics') {
      const core = key.match(/multi[- ]?omics|integrat(?:ion|ed|ive)/i)?.[0] || 'Project focus';
      content = `<div class="vp-omics"><div class="vp-omics-bands">${omics.slice(0, 3).map((term, i) => `<div class="vp-omics-band vp-band-${i}"><span>${e(term)}</span><i aria-hidden="true"><b></b><b></b><b></b><b></b><b></b><b></b><b></b><b></b></i></div>`).join('')}</div><div class="vp-omics-join" aria-hidden="true"><i></i></div><div class="vp-omics-core"><span>${e(core)}</span><i aria-hidden="true"></i></div></div><span class="vp-preview-note">${e(tools.slice(0, 3).join(' / ') || 'Shared project themes')}</span>`;
    } else if (mode === 'stack') {
      content = `<div class="vp-software-stack">${tools.slice(0, 4).map((tool, i) => `<div class="vp-stack-layer vp-stack-${i}"><span class="vp-stack-number" aria-hidden="true">0${i + 1}</span><strong>${e(tool)}</strong><i aria-hidden="true">${i % 2 ? '{ }' : '⌘'}</i></div>`).join('')}</div><span class="vp-preview-note">Tools & topics · illustrative</span>`;
    } else if (mode === 'brief') {
      content = `<div class="vp-brief-document"><span class="vp-file-label">BRIEF / ${String(index + 1).padStart(2, '0')}</span><strong>${e(title)}</strong><div class="vp-topic-pills">${topics.slice(0, 3).map(t => `<span>${e(t)}</span>`).join('')}</div></div>`;
    } else if (mode === 'outline') {
      content = `<div class="vp-brief-outline"><span class="vp-editorial-number" aria-hidden="true">${String(index + 1).padStart(2, '0')}</span><ul>${topics.slice(0, 4).map(t => `<li><span>${e(t)}</span></li>`).join('')}</ul></div><span class="vp-preview-note">Source outline</span>`;
    } else if (mode === 'protocol') {
      content = `<div class="vp-protocol"><span class="vp-file-label">RESEARCH NOTES</span><ol>${topics.slice(0, 3).map((term, i) => `<li><span aria-hidden="true">${String(i + 1).padStart(2, '0')}</span><strong>${e(term)}</strong></li>`).join('')}</ol></div><span class="vp-preview-note">Methods & topics · from CV</span>`;
    } else if (mode === 'flow') {
      content = `<div class="vp-flow"><div class="vp-flow-topics">${topics.slice(0, 3).map((t, i) => `<span><i aria-hidden="true">${String(i + 1).padStart(2, '0')}</i><strong>${e(t)}</strong></span>`).join('')}</div></div><span class="vp-preview-note">Tools & topics · illustrative</span>`;
    } else {
      content = `<div class="vp-topic-sheet"><strong>${e(topics[0] || title)}</strong><div class="vp-topic-pills">${topics.slice(1, 4).map(t => `<span>${e(t)}</span>`).join('')}</div>${!topics.length && shortDescription ? `<p>${e(shortDescription)}</p>` : ''}</div><span class="vp-preview-note">Project topics · from CV</span>`;
    }
    return `<div class="vp-project-preview vp-mode-${mode}">${caption}${content}</div>`;
  }
  function githubRepository(value) {
    const url = resource(value);
    if (!url || url.protocol !== 'https:' || url.hostname !== 'github.com' || url.port) return null;
    const [owner, repository] = url.pathname.split('/').filter(Boolean);
    const repo = (repository || '').replace(/\.git$/, '');
    if (!/^[a-z\d](?:[a-z\d-]{0,38})$/i.test(owner || '') || !/^[a-z\d_.-]{1,100}$/i.test(repo) || repo === '.' || repo === '..') return null;
    return { owner, repo };
  }
  function renderReadmeAction(project, h) {
    const e = h?.e || escape;
    return githubRepository(project.url) ? `<div class="vp-readme-control"><button class="pf-button" type="button" data-vp-readme="${e(project.id)}">Load public GitHub README</button><p>Fetches the repository’s current README from GitHub when selected.</p><div data-vp-readme-output aria-live="polite"></div></div>` : '';
  }
  function renderDocumentAction(certificate, h) {
    const e = h?.e || escape;
    return documentSource(certificate).url ? `<button type="button" class="pf-button" data-vp-document="${e(certificate.id)}" aria-label="Preview document: ${e(certificate.title)}">Preview document</button>` : '';
  }
  let cleanup = null;
  function unmount() { if (cleanup) cleanup(); cleanup = null; }
  function mount(root, vm) {
    unmount();
    if (!root || !vm) return;
    let alive = true, dialog = null, previousFocus = null;
    const controllers = new Set(), pending = new WeakSet();
    const certificateById = new Map((vm.certificates || []).map(c => [c.id, c]));
    const projectById = new Map((vm.projects || []).map(p => [p.id, p]));
    function clearDocument() {
      if (!dialog) return;
      dialog.querySelectorAll('iframe').forEach(frame => frame.removeAttribute('src'));
      dialog.replaceChildren(); dialog.remove(); dialog = null;
      if (previousFocus?.isConnected) previousFocus.focus();
      previousFocus = null;
    }
    function previewCertificate(c) {
      const source = documentSource(c);
      if (!source.url) return;
      clearDocument(); previousFocus = document.activeElement;
      dialog = document.createElement('dialog'); dialog.className = 'vp-document-dialog';
      dialog.setAttribute('aria-labelledby', 'vp-document-title');
      dialog.innerHTML = `<div class="vp-dialog-toolbar"><div><p class="pf-kicker">${source.kind === 'pdf' && source.thumbnail ? 'PAGE 1 PREVIEW' : 'SOURCE DOCUMENT'}</p><h2 id="vp-document-title">${escape(c.title)}</h2><p>${escape([c.issuer, c.date].filter(Boolean).join(' · '))}</p></div><button class="pf-button" type="button" data-vp-close aria-label="Close document preview">Close ×</button></div><div class="vp-document-view"></div><div class="vp-dialog-footer"><p>${source.kind === 'link' ? 'This credential link does not expose a direct PDF or image preview.' : source.kind === 'pdf' && source.thumbnail ? 'Page 1 preview. Open the original PDF to read all pages.' : 'Embedded previews depend on the source provider and your browser. If unavailable, open the original.'}</p><a class="pf-button primary" href="${escape(source.url)}" target="_blank" rel="noopener noreferrer">Open original ↗</a></div>`;
      const view = dialog.querySelector('.vp-document-view');
      if (source.kind === 'image' || source.kind === 'pdf' && source.thumbnail) {
        const image = document.createElement('img'); image.alt = source.kind === 'pdf' ? `Page 1: ${c.title}` : c.title; image.referrerPolicy = 'no-referrer';
        image.addEventListener('error', () => { if (alive && image.isConnected) view.textContent = 'The document preview could not be displayed here. Use Open original to view the source document.'; }, { once: true });
        image.src = source.kind === 'pdf' ? source.thumbnail.replace('w_640,c_limit', 'w_1400,c_limit') : source.url; view.append(image);
      } else if (source.kind === 'pdf') {
        const frame = document.createElement('iframe'); frame.title = `Certificate document: ${c.title}`;
        frame.referrerPolicy = 'no-referrer'; frame.setAttribute('sandbox', 'allow-same-origin');
        frame.src = source.url + (source.url.includes('#') ? '' : '#page=1&view=FitH'); view.append(frame);
      } else view.textContent = 'Use Open original to view this credential on its source website.';
      dialog.addEventListener('close', clearDocument, { once: true });
      dialog.addEventListener('cancel', event => { event.preventDefault(); clearDocument(); });
      document.body.append(dialog);
      if (typeof dialog.showModal === 'function') dialog.showModal(); else dialog.setAttribute('open', '');
      dialog.querySelector('[data-vp-close]').focus();
    }
    async function loadReadme(button, project) {
      const repository = githubRepository(project.url), output = button.parentElement.querySelector('[data-vp-readme-output]');
      if (!repository || !output || pending.has(button)) return;
      const controller = new AbortController(); controllers.add(controller); pending.add(button);
      button.disabled = true; output.textContent = 'Loading the public README from GitHub…';
      const timer = setTimeout(() => controller.abort(), 8000);
      try {
        const response = await fetch(`https://api.github.com/repos/${encodeURIComponent(repository.owner)}/${encodeURIComponent(repository.repo)}/readme`, { signal: controller.signal, credentials: 'omit', redirect: 'error', headers: { Accept: 'application/vnd.github.raw+json' } });
        if (!response.ok) throw Error('UNAVAILABLE');
        if (Number(response.headers.get('content-length')) > 400000) throw Error('TOO_LARGE');
        const readme = await response.text();
        if (readme.length > 400000) throw Error('TOO_LARGE');
        if (!alive || !output.isConnected) return;
        const label = document.createElement('p'); label.className = 'vp-readme-label'; label.textContent = 'Live repository README · GitHub';
        const pre = document.createElement('pre'); pre.className = 'vp-readme-text'; pre.textContent = readme.slice(0, 80000);
        output.replaceChildren(label, pre);
        if (readme.length > 80000) { const note = document.createElement('p'); note.textContent = 'Preview shortened. Open the repository for the complete README.'; output.append(note); }
        button.textContent = 'Reload public README';
      } catch {
        if (alive && output.isConnected) output.textContent = 'The public README could not be loaded. The repository may be private, unavailable or rate limited. Use Open project to visit GitHub.';
      } finally { clearTimeout(timer); controllers.delete(controller); pending.delete(button); if (alive && button.isConnected) button.disabled = false; }
    }
    function onClick(event) {
      const button = event.target.closest?.('[data-vp-document], [data-vp-close], [data-vp-readme]');
      if (!button) return;
      if (button.hasAttribute('data-vp-close')) { if (dialog?.contains(button)) clearDocument(); return; }
      if (button.hasAttribute('data-vp-document') && root.contains(button)) { const c = certificateById.get(button.dataset.vpDocument); if (c) previewCertificate(c); }
      if (button.hasAttribute('data-vp-readme')) { const p = projectById.get(button.dataset.vpReadme); if (p) loadReadme(button, p); }
    }
    function imageError(event) {
      if (!event.target.matches?.('[data-vp-thumbnail]')) return;
      event.target.closest('.vp-certificate-media')?.classList.remove('has-source');
      event.target.remove();
    }
    root.addEventListener('error', imageError, true);
    document.addEventListener('click', onClick);
    cleanup = () => {
      alive = false; document.removeEventListener('click', onClick); root.removeEventListener('error', imageError, true);
      controllers.forEach(controller => controller.abort()); controllers.clear(); clearDocument();
      // The project dialog lives outside the rendered root; erase fetched private-context content too.
      document.querySelectorAll('[data-vp-readme-output]').forEach(output => output.replaceChildren());
      certificateById.clear(); projectById.clear();
    };
  }
  window.PortfolioPreviews = { renderProject, renderCertificate, renderReadmeAction, renderDocumentAction, mount, unmount };
}());
