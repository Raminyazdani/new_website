(function (root, factory) {
  'use strict';
  var api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.PortfolioData = Object.assign(root.PortfolioData || {}, api);
}(typeof window !== 'undefined' ? window : globalThis, function () {
  'use strict';
  var object = function (v) { return v && typeof v === 'object' && !Array.isArray(v) ? v : {}; };
  var list = function (v) { return Array.isArray(v) ? v : []; };
  var str = function (v) { return typeof v === 'string' ? v : typeof v === 'number' || typeof v === 'boolean' ? String(v) : ''; };
  var first = function () { for (var i = 0; i < arguments.length; i++) if (str(arguments[i]) !== '') return str(arguments[i]); return ''; };
  var strings = function (v) { return (Array.isArray(v) ? v : v == null ? [] : [v]).map(str).filter(function (s) { return s !== ''; }); };
  var tags = function (v) { return strings(object(v).type_key); };
  // Only HTTP(S) destinations are valid resource URLs. Contact links are built by the UI.
  function safeUrl(value) {
    var v = str(value).trim();
    if (!v || /[\u0000-\u0020\u007f\\]/.test(v)) return '';
    if (!/^https?:\/\//i.test(v)) {
      if (!/^(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+[a-z]{2,63}(?::\d{1,5})?(?:[/?#]|$)/i.test(v)) return '';
      v = 'https://' + v;
    }
    try { var u = new URL(v); return /^https?:$/.test(u.protocol) && u.hostname && !u.username && !u.password ? u.href : ''; } catch (_) { return ''; }
  }
  function phone(value) {
    if (typeof value !== 'object' || !value) return str(value);
    return first(value.formatted, [str(value.countryCode), str(value.number)].filter(Boolean).join(' '));
  }
  function locationLabel(value) {
    if (typeof value === 'string') return value;
    var location = object(Array.isArray(value) ? value[0] : value);
    return [str(location.city), str(location.region), str(location.country)]
      .filter(function (part, index, parts) { return part && parts.indexOf(part) === index; })
      .join(', ');
  }
  function adaptCV(input) {
    var raw = object(input), basics = object(Array.isArray(raw.basics) ? raw.basics[0] : raw.basics);
    var pictures = list(basics.Pictures);
    function picture(type) { return safeUrl(object(pictures.find(function (p) { return object(p).type_of === type; })).URL); }
    var given = first(basics.fname, basics.givenName), family = first(basics.lname, basics.familyName);
    var name = first(basics.name, [given, family].filter(Boolean).join(' '));
    var model = {
      version: 1,
      identity: { name: name, givenName: given, familyName: family, initials: name.split(/\s+/).filter(Boolean).map(function (s) { return Array.from(s)[0]; }).slice(0, 2).join(''), roles: strings(basics.label), summary: str(basics.summary), location: locationLabel(basics.location), avatarUrl: picture('profile'), coverUrl: picture('cover') },
      profiles: list(raw.profiles).map(function (v, i) { v = object(v); return { id: 'profile-' + i, network: str(v.network), label: first(v.username, v.network), url: safeUrl(v.url) }; }),
      contact: { email: strings(basics.email).join(', '), phone: phone(basics.phone) },
      education: list(raw.education).map(function (v, i) { v = object(v); return { id: 'education-' + i, institution: str(v.institution), location: str(v.location), field: str(v.area), degree: str(v.studyType), start: str(v.startDate), end: str(v.endDate), gpa: str(v.gpa), logoUrl: safeUrl(v.logo_url), tags: tags(v) }; }),
      experience: list(raw.experiences).map(function (v, i) {
        v = object(v);
        return { id: 'experience-' + i, title: str(v.role), organization: str(v.institution), location: locationLabel(v.location), period: str(v.duration), description: str(v.description), tags: tags(v) };
      }),
      projects: list(raw.projects).map(function (v, i) { v = object(v); return { id: 'project-' + i, title: str(v.title), description: str(v.description), url: safeUrl(v.url), tags: tags(v) }; }),
      publications: list(raw.publications).map(function (v, i) {
        v = object(v); var ids = object(v.identifiers);
        var authors = list(v.authors).map(function (a) { return typeof a === 'object' ? first(object(a).literal, object(a).name, [str(object(a).given), str(object(a).family)].filter(Boolean).join(' ')) : str(a); }).filter(Boolean);
        if (!authors.length) authors = list(v.authors_structured).map(function (a) { a = object(a); return first(a.literal, [str(a.given), str(a.family)].filter(Boolean).join(' ')); }).filter(Boolean);
        return { id: 'publication-' + i, title: str(v.title), authors: authors, supervisors: strings(v.supervisors), kind: str(v.type), status: str(v.status), year: str(v.year), venue: first(v.journal, v.conference, v.book_title, v.institution), publisher: str(v.publisher), doi: first(v.doi, ids.doi), isbn: first(v.isbn, ids.isbn), url: safeUrl(first(v.url, v.URL, v.repository_url)), citation: str(v.citation), notes: str(v.notes) };
      }),
      skillGroups: Object.entries(object(raw.skills)).map(function (entry, i) {
        return { id: 'skill-domain-' + i, name: entry[0], groups: Object.entries(object(entry[1])).map(function (group, j) {
          return { id: 'skill-group-' + i + '-' + j, name: group[0], items: list(group[1]).map(function (v, k) { v = object(v); return { id: 'skill-' + i + '-' + j + '-' + k, name: str(v.long_name), shortName: str(v.short_name), tags: tags(v) }; }) };
        }) };
      }),
      certificates: [],
      languages: list(raw.languages).map(function (v, i) {
        v = object(v); var proficiency = object(v.proficiency);
        return { id: 'language-' + i, name: str(v.language), level: typeof v.proficiency === 'string' ? v.proficiency : str(proficiency.level), cefr: str(proficiency.CEFR), status: str(proficiency.status), tests: list(v.certifications).map(function (t, j) {
          t = object(t); var scores = [];
          ['overall', 'reading', 'listening', 'writing', 'speaking'].forEach(function (key) { if (t[key] !== null && t[key] !== undefined && str(t[key]) !== '') scores.push({ label: key, value: typeof t[key] === 'number' ? t[key] : str(t[key]), max: t.maxScore == null ? '' : typeof t.maxScore === 'number' ? t.maxScore : str(t.maxScore) }); });
          return { id: 'language-test-' + i + '-' + j, name: str(t.test), issuer: str(t.organization), date: str(t.examDate), url: safeUrl(t.URL), scores: scores };
        }) };
      }),
      references: list(raw.references).map(function (v, i) { v = object(v); return { id: 'reference-' + i, name: str(v.name), title: str(v.position), department: str(v.department), organization: str(v.institution), location: str(v.location), email: strings(v.email).join(', '), phone: phone(v.phone), url: safeUrl(v.URL) }; }),
      interests: list(raw.interests).map(function (v, i) { v = object(v); return { id: 'interest-' + i, title: str(v.name), description: str(v.description), icon: str(v.icon) }; }),
      stats: {}, warnings: []
    };
    list(raw.workshop_and_certifications).forEach(function (issuer, i) { issuer = object(issuer); list(issuer.certifications).forEach(function (v, j) { v = object(v); model.certificates.push({ id: 'certificate-' + i + '-' + j, issuer: str(issuer.issuer), title: str(v.name), date: str(v.date), duration: str(v.duration), url: safeUrl(v.URL), hasCertificate: v.certificate == null ? '' : v.certificate, tags: tags(v) }); }); });
    ['projects', 'experience', 'education', 'publications', 'certificates', 'languages', 'references'].forEach(function (key) { model.stats[key] = model[key].length; });
    model.stats.skills = model.skillGroups.reduce(function (sum, domain) { return sum + domain.groups.reduce(function (n, group) { return n + group.items.length; }, 0); }, 0);
    if (input === null || typeof input !== 'object' || Array.isArray(input)) model.warnings.push('CV source is not an object.');
    if (!name) model.warnings.push('Identity name is missing.');
    return model;
  }
  return { adaptCV: adaptCV, safeUrl: safeUrl };
}));
