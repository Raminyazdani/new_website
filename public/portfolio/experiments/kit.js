(function (w) {
  'use strict';

  const list = value => Array.isArray(value) ? value : [];
  const escape = value => String(value ?? '').replace(/[&<>"']/g, c => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' }[c]));
  const number = index => String(index + 1).padStart(2, '0');
  const science = /biolog|bioinform|biotech|biochem|genom|\b(?:rna|dna)\b|transcriptom|prote(?:in|om)|microbi|molecul|metabol|chromato|ferment|enzyme|cellular|\bchemistr|sequenc|microscop|cultivat|culture/i;
  const computation = /program(?:ming|mer)|software|computer science|machine learning|deep learning|\b(?:ml|sql)\b|neural|data (?:scien|engineer|pipeline|visual|analyt)|developer|python|javascript|typescript|pytorch|tensorflow|web (?:app|dev)|react|algorithm|devops|linux|github|nextflow|automation|computational|bioinform/i;
  const chemistry = /chromato|chemis|spectrom|chemical|analyt(?:e|ical)|compound|metabol|ferment|biochem|polymer|molecule/i;
  const topics = row => [row.title, row.name, row.shortName, row.field, ...list(row.tags)];
  const text = row => [...topics(row), row.description, row.notes, row.organization, row.venue, row.issuer].filter(Boolean).join(' ');
  function classify(row) {
    const content = text(row);
    const a = science.test(content), b = computation.test(content);
    return a && b ? 'both' : a ? 'biology' : b ? 'programming' : 'other';
  }

  function prioritize(vm, focus) {
    const pattern = { biology: science, programming: computation, chemistry }[focus];
    if (!pattern) return vm;
    const rank = row => (topics(row).some(value => pattern.test(value || '')) ? 3 : 0)
      + (pattern.test(text(row)) ? 1 : 0)
      + (list(row.groups).some(group => list(group.items).some(item => pattern.test(text(item)))) ? 2 : 0);
    const sort = items => list(items).map((row, index) => ({ row, index, score: rank(row) }))
      .sort((a, b) => b.score - a.score || a.index - b.index).map(x => x.row);
    return { ...vm, projects: sort(vm.projects), experience: sort(vm.experience), publications: sort(vm.publications),
      certificates: sort(vm.certificates), education: sort(vm.education), skillGroups: sort(vm.skillGroups) };
  }

  // Source dates stay verbatim. The sort uses a recorded start year only; ties and undated records retain source order.
  function startYear(record) {
    return Number(String(record.start || record.period || '').match(/\b(?:19|20)\d{2}\b/)?.[0] || 0);
  }
  function chronological(records) {
    return [...list(records)].sort((a,b) => (startYear(b) - startYear(a)));
  }

  function section(id, { title, description, body = '', className = '' } = {}) {
    const heading = id === 'hero' ? '' : `<header class="xp-heading"><h2 id="xp-${escape(id)}-title">${escape(title)}</h2>${description ? `<p>${escape(description)}</p>` : ''}</header>`;
    return `<section class="pf-section xp-page xp-${escape(id)} ${escape(className)}" id="${escape(id)}" data-section="${escape(id)}"${id !== 'hero' ? ` aria-labelledby="xp-${escape(id)}-title"` : ''}><div class="xp-wrap">${heading}${body}</div></section>`;
  }
  function projectTools(vm, h, { placeholder = 'Search titles, descriptions and topics' } = {}) {
    const tags = [...new Set(list(vm.projects).flatMap(p => list(p.tags)).filter(Boolean))];
    return `<div class="syn-search xp-project-tools"><label>Search projects<input type="search" data-project-search placeholder="${h.e(placeholder)}"></label><label>Topic<select data-project-filter><option value="">All topics</option>${tags.map(t => `<option value="${h.e(t)}">${h.e(t)}</option>`).join('')}</select></label><span data-syn-project-count role="status"></span></div>`;
  }
  function skillsSearch({ placeholder = 'Search all skills' } = {}) {
    return `<div class="syn-search xp-skill-tools"><label>Find a skill<input type="search" data-skill-search placeholder="${escape(placeholder)}"></label><span data-skill-count role="status"></span></div>`;
  }
  function excerpt(value, limit = 220) {
    const source = String(value || '').trim().replace(/\s+/g, ' ');
    if (source.length <= limit) return source;
    return (source.slice(0, limit + 1).replace(/\s+\S*$/, '').trimEnd() || source.slice(0, limit)) + '…';
  }
  function register(design) {
    const custom = ['hero','projects','experience','skills'];
    if (custom.some(key => typeof design.renderers?.[key] !== 'function')) throw Error('INCOMPLETE_EXPERIENCE');
    const renderers = Object.fromEntries(w.PortfolioSynthesis.order.filter(key => !custom.includes(key))
      .map(key => [key, (vm, h) => w.PortfolioSynthesis.canonicalRecordSection(key, vm, h)]));
    w.PortfolioDesigns.register({ ...design, name: design.name || design.title, collection: 'experiential',
      renderers: { ...renderers, ...design.renderers } });
  }

  w.PortfolioExperiences = { register, list, number, section, projectTools, skillsSearch, excerpt, classify, chronological, prioritize,
    projectVisual: (...args) => w.PortfolioSynthesis.projectVisual(...args),
    experienceRecord: (...args) => w.PortfolioSynthesis.experienceRecord(...args) };
})(window);
