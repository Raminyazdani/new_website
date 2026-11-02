'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const { adaptCV, safeUrl } = require('../public/data/cv-adapter.js');
const { load, PortfolioAuthError, PortfolioSourceError } = require('../public/data/portfolio-source.js');

function fixture() {
  return {
    config: { ID: 'private-synthetic-id' },
    basics: [{ fname: 'Sample', lname: 'Researcher', label: ['Research', 'Engineering'], summary: '<exact source summary>', location: [{ city: 'Example City', country: 'Example Country' }], email: 'sample@example.test', phone: { countryCode: '+00', number: '123', formatted: '+00 123' }, Pictures: [{ type_of: 'profile', URL: 'example.test/portrait.jpg' }, { type_of: 'cover', URL: 'https://example.test/cover.jpg' }] }],
    profiles: [{ network: 'Example', username: 'sample', url: 'example.test/sample' }],
    education: [{ institution: 'Example Institute', area: 'Example Field', studyType: 'Degree', startDate: 'source start', endDate: '', gpa: 0, logo_url: 'data:image/svg+xml,unsafe', type_key: ['education'] }],
    experiences: Array.from({ length: 15 }, (_, i) => ({ role: 'Role ' + i, institution: 'Organization ' + i, duration: i === 0 ? 'incomplete source date' : '', description: 'Description ' + i, type_key: ['work'] })),
    projects: Array.from({ length: 79 }, (_, i) => ({ title: 'Project ' + i, description: 'Source description ' + i, url: i === 0 ? 'example.test/project' : null, type_key: ['project', 'tag-' + i] })),
    publications: [{ title: 'Unfinished work', authors: ['Author A', 'Author B'], type: 'article', status: 'In preparation', year: null, notes: 'Original notes', identifiers: { doi: '10.synthetic/example' } }, { title: 'Another work', authors_structured: [{ given: 'Sample', family: 'Author' }], status: 'Under review', year: 0, journal: 'Example Journal', url: 'javascript:alert(1)' }],
    skills: { 'Domain A': { 'Group A': [{ long_name: 'Long Skill', short_name: 'LS', type_key: ['synthetic'] }, { long_name: 'Second Skill', short_name: '' }] }, 'Domain B': { 'Group B': [{ long_name: 'Third Skill', short_name: 'TS' }] } },
    workshop_and_certifications: [{ issuer: 'Issuer A', certifications: [{ name: 'Workshop A', date: 'unparsed date', duration: '3 source hours', certificate: false, URL: 'https://example.test/a', type_key: ['workshop'] }, { name: 'Certificate B', certificate: true }] }, { issuer: 'Issuer B', certifications: [{ name: 'Workshop C' }] }],
    languages: [{ language: 'Example language', proficiency: { level: 'Original level', CEFR: 'B2', status: 'Studying' }, certifications: [{ test: 'Example Exam', organization: 'Exam Issuer', overall: 0, reading: 1.5, listening: null, writing: 0, speaking: 2, maxScore: 0, examDate: 'provided date', URL: 'example.test/exam' }] }],
    references: [{ name: 'Synthetic Referee', position: 'Source position', department: 'Department', institution: 'Institution', location: 'Location', email: ['ref@example.test', 'second@example.test'], phone: null, URL: 'example.test/ref' }]
  };
}

test('complete model preserves all ordered source records without date, proficiency or result inference', () => {
  const raw = fixture(), before = JSON.stringify(raw), model = adaptCV(raw);
  assert.equal(JSON.stringify(raw), before, 'adapter must not mutate source');
  assert.equal(model.version, 1);
  assert.deepEqual(model.projects.map(p => p.title), raw.projects.map(p => p.title));
  assert.deepEqual(model.experience.map(p => p.title), raw.experiences.map(p => p.role));
  assert.deepEqual(model.stats, { projects: 79, experience: 15, education: 1, publications: 2, certificates: 3, languages: 1, references: 1, skills: 3 });
  assert.equal(model.experience[0].period, 'incomplete source date');
  assert.equal(model.education[0].gpa, '0');
  assert.equal(model.education[0].end, '');
  assert.equal(model.education[0].logoUrl, '');
  assert.equal(model.publications[0].status, 'In preparation');
  assert.equal(model.publications[0].year, '');
  assert.equal(model.publications[0].citation, '');
  assert.equal(model.publications[0].doi, '10.synthetic/example');
  assert.equal(model.publications[1].status, 'Under review');
  assert.deepEqual(model.publications[1].authors, ['Sample Author']);
  assert.equal(model.publications[1].year, '0');
  assert.equal(model.publications[1].url, '');
  assert.equal(model.identity.avatarUrl, 'https://example.test/portrait.jpg');
  assert.equal(model.contact.phone, '+00 123');
  assert.equal(model.references[0].email, 'ref@example.test, second@example.test');
  assert(!JSON.stringify(model).includes('private-synthetic-id'));
  const ids = ['profiles', 'education', 'experience', 'projects', 'publications', 'certificates', 'languages', 'references'].flatMap(k => model[k].map(v => v.id));
  assert.equal(new Set(ids).size, ids.length);
});

test('nested domains, certificate issuers and language scores retain order, empty values and false/zero', () => {
  const model = adaptCV(fixture());
  assert.deepEqual(model.skillGroups.map(d => d.name), ['Domain A', 'Domain B']);
  assert.deepEqual(model.skillGroups[0].groups[0].items.map(i => [i.name, i.shortName, i.tags]), [['Long Skill', 'LS', ['synthetic']], ['Second Skill', '', []]]);
  assert.deepEqual(model.certificates.map(c => [c.issuer, c.title, c.hasCertificate]), [['Issuer A', 'Workshop A', false], ['Issuer A', 'Certificate B', true], ['Issuer B', 'Workshop C', '']]);
  assert.equal(model.certificates[0].date, 'unparsed date');
  assert.equal(model.languages[0].cefr, 'B2');
  assert.equal(model.languages[0].status, 'Studying');
  assert.deepEqual(model.languages[0].tests[0].scores, [{ label: 'overall', value: 0, max: 0 }, { label: 'reading', value: 1.5, max: 0 }, { label: 'writing', value: 0, max: 0 }, { label: 'speaking', value: 2, max: 0 }]);
});

test('URL normalization accepts real web destinations and rejects unsafe or ambiguous values', () => {
  for (const value of ['javascript:alert(1)', 'JaVaScRiPt:alert(1)', 'data:text/html,a', 'file:///secret', '//example.test/path', '/relative', 'not a domain', 'example', 'https://user:secret@example.test', 'https://example.test\\evil', 'java\nscript:alert(1)']) assert.equal(safeUrl(value), '', value);
  assert.equal(safeUrl('example.test/path?q=1#part'), 'https://example.test/path?q=1#part');
  assert.equal(safeUrl('https://example.test/path'), 'https://example.test/path');
  assert.equal(safeUrl('http://example.test'), 'http://example.test/');
});

test('missing and malformed optional sections return complete empty collections with safe warnings', () => {
  for (const raw of [null, undefined, {}, [], 'bad', { basics: [null], skills: null, projects: 'bad', languages: [null], references: [null] }]) {
    const model = adaptCV(raw);
    assert.equal(model.identity.name, '');
    assert.equal(model.contact.email, '');
    for (const key of ['profiles', 'education', 'experience', 'projects', 'publications', 'skillGroups', 'certificates', 'languages', 'references', 'warnings']) assert(Array.isArray(model[key]), key);
    assert(model.warnings.every(w => typeof w === 'string' && !w.includes('bad')));
  }
});

test('source boundary owns cookie transport, parsing, raw retention and cancellation signal', async () => {
  const raw = fixture(), signal = new AbortController().signal;
  const result = await load({ signal, fetchImpl: async (url, options) => {
    assert.equal(url, '/api/cv'); assert.equal(options.credentials, 'same-origin'); assert.equal(options.signal, signal);
    assert.equal(options.headers.Accept, 'application/json');
    return { status: 200, ok: true, json: async () => raw };
  } });
  assert.equal(result.raw, raw);
  assert.deepEqual(result.model, adaptCV(raw));
});

test('future schema and alternate transport need changes only at the injected source/adapter boundary', async () => {
  const original = fixture(), future = { document: { person: original.basics, work: original.experiences, portfolio: original.projects }, other: original };
  const result = await load({ source: async () => future, adapter: raw => adaptCV({ ...raw.other, basics: raw.document.person, experiences: raw.document.work, projects: raw.document.portfolio }) });
  assert.equal(result.raw, future);
  assert.deepEqual(result.model, adaptCV(original), 'renderer receives identical stable model after schema/transport change');
});

test('source failures never silently substitute fixtures and authentication is typed', async () => {
  await assert.rejects(load({ fetchImpl: async () => ({ status: 401, ok: false, json: () => { throw Error('must not parse'); } }) }), err => err instanceof PortfolioAuthError && err.code === 'AUTH_REQUIRED' && err.status === 401);
  await assert.rejects(load({ fetchImpl: async () => ({ status: 503, ok: false }) }), err => err instanceof PortfolioSourceError && err.code === 'HTTP_ERROR' && err.status === 503);
  await assert.rejects(load({ fetchImpl: async () => ({ status: 200, ok: true, json: async () => { throw Error('sensitive payload'); } }) }), err => err.code === 'PARSE_ERROR' && !err.message.includes('sensitive'));
  await assert.rejects(load({ source: async () => ({}), adapter: () => ({ version: 2 }) }), err => err.code === 'MODEL_INVALID');
  const abort = new Error('aborted');
  await assert.rejects(load({ fetchImpl: async () => { throw abort; } }), err => err === abort);
});

test('same pure adapter and loader are available as browser globals', async () => {
  const context = vm.createContext({ window: {}, URL });
  for (const file of ['cv-adapter.js', 'portfolio-source.js']) vm.runInContext(fs.readFileSync(path.join(__dirname, '../public/data', file), 'utf8'), context);
  assert.equal(typeof context.window.PortfolioData.adaptCV, 'function');
  assert.equal(typeof context.window.PortfolioData.load, 'function');
  const result = await context.window.PortfolioData.load({ source: async () => fixture() });
  assert.equal(result.model.stats.projects, 79);
});
