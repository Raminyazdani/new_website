(function () {
  'use strict';
  const esc = (h, v) => h.e(v ?? '');
  const section = (id, inner, cls = '') => `<section class="pf-section record-${id} ${cls}" id="${id}" data-section="${id}"><div class="pf-wrap">${inner}</div></section>`;
  const list = v => Array.isArray(v) ? v : [];
  const text = (v, fallback = '') => String(v || fallback);
  const heading = (h, n, label, title, desc) => h.heading(n, label, title, desc || '');
  const safeUrl = (h, url, label, cls) => url ? h.link(url, label, cls || '') : '';
  const meta = (v) => v ? `<span>${v}</span>` : '';
  const scienceIcon = (name, fallback) => {
    try {
      return typeof window.PortfolioScience?.icon === 'function'
        ? window.PortfolioScience.icon(name)
        : `<span class="record-symbol-fallback">${fallback}</span>`;
    } catch { return `<span class="record-symbol-fallback">${fallback}</span>`; }
  };
  const iconFor = name => /bio|cell|gene|genom|protein|rna|dna|life/i.test(name) ? ['dna', '⌘']
    : /chem|molec|lab|reaction/i.test(name) ? ['flask', '⌬']
      : /code|comput|program|soft|data|python|workflow/i.test(name) ? ['code', '</>'] : ['branch', '↗'];
  const icon = (name, fallback) => `<span class="record-science-icon" aria-hidden="true">${scienceIcon(name, fallback)}</span>`;

  const renderers = {
    publications(vm, h) {
      const rows = list(vm.publications);
      if (!rows.length) return '';
      const body = rows.map((p, i) => {
        const cite = p.citation || [list(p.authors).join(', '), p.title, p.venue, p.year].filter(Boolean).join('. ');
        const details = [p.kind, p.status, p.year, p.venue, p.publisher, p.doi && `DOI ${p.doi}`, p.isbn && `ISBN ${p.isbn}`].filter(Boolean);
        return `<article class="record-paper" data-record-id="${esc(h, p.id)}" data-tilt><div class="record-paper-index">${String(i + 1).padStart(2, '0')}</div><span class="record-paper-art" aria-hidden="true">${scienceIcon('book', '▤')}</span><div class="record-paper-main"><div class="record-paper-meta">${details.map(x => `<span>${esc(h, x)}</span>`).join('')}</div><h3>${esc(h, p.title)}</h3>${list(p.authors).length ? `<p class="record-authors">${esc(h, list(p.authors).join(' · '))}</p>` : ''}${p.notes ? `<details class="record-notes"><summary>Read note ${icon('arrow', '↘')}</summary><p>${esc(h, p.notes)}</p></details>` : ''}</div><div class="record-paper-actions">${cite ? `<button class="pf-button record-copy" type="button" data-copy-citation="${esc(h, p.id)}">Copy citation</button>` : ''}${safeUrl(h, p.url, 'Open publication', 'record-outlink')}${p.doi ? safeUrl(h, `https://doi.org/${encodeURIComponent(p.doi)}`, 'DOI ↗', 'record-outlink') : ''}<span class="record-citation" hidden>${esc(h, cite)}</span></div></article>`;
      }).join('');
      return section('publications', `${heading(h, '05', 'Research & writing', 'Publications', 'Research and works in progress.')}<div class="record-paper-ledger">${body}</div>`);
    },
    education(vm, h) {
      const rows = list(vm.education);
      if (!rows.length) return '';
      return section('education', `${heading(h, '06', 'Study & formation', 'Education', 'Academic history and fields of study.')}<div class="record-education">${rows.map((e, i) => `<article class="record-edu-row"><div class="record-edu-date"><span>${esc(h, e.start)}</span><i aria-hidden="true">—</i><span>${esc(h, e.end)}</span></div><div class="record-edu-number">${String(i + 1).padStart(2, '0')}</div><span class="record-edu-node" aria-hidden="true">${scienceIcon('branch', '•')}</span><div class="record-edu-copy"><p class="record-overline">${esc(h, e.location)}</p><h3>${esc(h, e.institution)}</h3><p class="record-edu-degree">${esc(h, e.degree)}${e.field ? ` <span>/</span> ${esc(h, e.field)}` : ''}</p>${e.gpa ? `<p class="record-smallfact">GPA <b>${esc(h, e.gpa)}</b></p>` : ''}${h.chips(list(e.tags), 99)}</div>${e.logoUrl ? `<img class="record-edu-logo" src="${esc(h, e.logoUrl)}" alt="" loading="lazy">` : icon('branch', '↗')}</article>`).join('')}</div>`);
    },
    skills(vm, h) {
      const groups = list(vm.skillGroups);
      if (!groups.length) return '';
      const groupHtml = groups.map((g, i) => { const [glyph, fallback] = iconFor(g.name); return `<details class="record-skill-group"${i === 0 ? ' open' : ''}><summary><span class="record-skill-head">${icon(glyph, fallback)}<span>${esc(h, g.name)}</span></span><i aria-hidden="true">＋</i></summary><div class="record-skill-subgroups">${list(g.groups).map(s => `<div class="record-skill-sub"><h3>${esc(h, s.name)}</h3><ul>${list(s.items).map(x => `<li data-skill-item="${esc(h, x.name)}">${esc(h, x.name)}</li>`).join('')}</ul></div>`).join('')}</div></details>`; }).join('');
      return section('skills', `${heading(h, '07', 'Tools & methods', 'Skills', 'Tools and methods by area.')}${window.PortfolioInsights?.renderSkills(vm, h) || ''}<div class="record-skill-tools"><label for="record-skill-search">Find a skill</label><input id="record-skill-search" type="search" placeholder="Search all skills" data-skill-search></div><div class="record-skill-atlas">${groupHtml}</div>`);
    },
    certificates(vm, h) {
      const rows = list(vm.certificates);
      if (!rows.length) return '';
      const issuers = [...new Set(rows.map(x => x.issuer).filter(Boolean))];
      return section('certificates', `${heading(h, '08', 'Learning & credentials', 'Certificates', 'Courses, workshops and credentials.')}<div class="record-cert-tools"><label class="record-search-label">Search<input type="search" placeholder="Search certificates" data-cert-search></label><label class="record-search-label">Issuer<select data-cert-issuer><option value="">All issuers</option>${issuers.map(x => `<option value="${esc(h, x)}">${esc(h, x)}</option>`).join('')}</select></label></div><div class="record-cert-grid">${rows.map((c, i) => `<article class="record-cert-card record-cert-with-preview" data-cert-card data-cert-id="${esc(h, c.id)}" data-tilt>${window.PortfolioPreviews?.renderCertificate(c, i, h) || ''}<div class="record-cert-top"><span>${String(i + 1).padStart(2, '0')}</span><span>${c.hasCertificate ? 'Credential available' : 'Course record'}</span></div><p class="record-overline">${esc(h, c.issuer)}</p><h3>${esc(h, c.title)}</h3><div class="record-cert-bottom">${meta(esc(h, c.date))}${meta(esc(h, c.duration))}</div><div class="record-cert-tags">${h.chips(list(c.tags), 99)}</div><div class="record-cert-actions">${window.PortfolioPreviews?.renderDocumentAction(c, h) || ''}${safeUrl(h, c.url, 'View credential ↗', 'record-outlink')}</div></article>`).join('')}</div><p class="record-cert-empty" data-cert-empty hidden>No certificates match this search.</p><button class="pf-button record-more" type="button" data-cert-more hidden>Show more</button>`);
    },
    languages(vm, h) {
      const rows = list(vm.languages);
      if (!rows.length) return '';
      return section('languages', `${heading(h, '09', 'Communication', 'Languages', 'Languages and communication.')}<div class="record-language-grid">${rows.map((l, i) => `<article class="record-language"><span class="record-language-index">${String(i + 1).padStart(2, '0')}</span><h3>${esc(h, l.name)}</h3><p class="record-language-level">${esc(h, l.cefr || l.level || 'Level not supplied')}</p>${l.status ? `<p class="record-language-status">${esc(h, l.status)}</p>` : ''}${list(l.tests).length ? `<details><summary>Test results ${icon('arrow', '↘')}</summary><div class="record-test-list">${list(l.tests).map(t => `<div><b>${esc(h, t.name)}</b><small>${esc(h, t.issuer)} ${esc(h, t.date)}</small>${list(t.scores).map(s => `<span>${esc(h, s.label)} <b>${esc(h, s.value)}${s.max ? ` / ${esc(h, s.max)}` : ''}</b></span>`).join('')}${safeUrl(h, t.url, 'View result ↗')}</div>`).join('')}</div></details>` : ''}</article>`).join('')}</div>`);
    },
    references(vm, h) {
      const rows = list(vm.references);
      if (!rows.length) return '';
      return section('references', `${heading(h, '10', 'People', 'References', 'Contact details stay tucked away until you choose to open a card.')}<div class="record-reference-list">${rows.map(r => `<details class="record-reference"><summary><span class="record-monogram">${esc(h, (r.name || '?').trim().split(/\s+/).map(x => x[0]).slice(0, 2).join('').toUpperCase())}</span><span class="record-ref-name"><b>${esc(h, r.name)}</b><small>${esc(h, r.title)}${r.department ? ` · ${esc(h, r.department)}` : ''}</small></span><span class="record-ref-org">${esc(h, r.organization)}${r.location ? ` · ${esc(h, r.location)}` : ''}</span><i aria-hidden="true">＋</i></summary><div class="record-ref-contact">${safeUrl(h, r.email ? `mailto:${r.email}` : '', r.email)}${safeUrl(h, r.phone ? `tel:${r.phone}` : '', r.phone)}${safeUrl(h, r.url, 'Profile ↗')}</div></details>`).join('')}</div>`);
    },
    contact(vm, h) {
      const profiles = list(vm.profiles);
      const email = vm.contact && vm.contact.email;
      const phone = vm.contact && vm.contact.phone;
      if (!email && !phone && !profiles.length) return '';
      return section('contact', `<div class="record-contact-finale"><div class="record-contact-top"><span>11 / CONTACT</span><span>Direct links</span></div><div class="record-contact-content"><p class="record-contact-prelude">Correspondence</p><h2>Get in<br><em>touch.</em></h2><p class="record-contact-note">Choose a profile or contact route below.</p></div><div class="record-contact-bottom"><div>${email ? safeUrl(h, `mailto:${email}`, email, 'record-contact-mail') : ''}${phone ? safeUrl(h, `tel:${phone}`, phone, 'record-contact-phone') : ''}</div><nav aria-label="Social profiles">${profiles.map(p => safeUrl(h, p.url, p.label || p.network, 'record-social')).join('')}</nav></div></div>`);
    }
  };
  window.PortfolioRenderers = { ...(window.PortfolioRenderers || {}), ...renderers };
})();
