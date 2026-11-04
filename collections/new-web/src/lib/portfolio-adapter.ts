import { adaptCV, safeUrl } from '../../../../public/data/cv-adapter.js';
import { skillDomains } from '../content/curation';
import { dirOf, intlLocale } from '../i18n/routing';
import type { Locale } from '../i18n/routing';
import type {
  Certification, Experience, JourneyId, JourneyStop, LanguageSkill,
  Project, ProjectCategory, Publication, SiteData, SkillCategory, Stat,
} from './types';

type SourceDate = { year: number; month?: number; day?: number; iso: string };
type SourceCertificate = {
  title: string;
  issuer: string;
  date: string;
  duration: string;
  url: string;
  hasCertificate: unknown;
};

const number = (value: unknown): number | null => {
  if (typeof value !== 'number' && !(typeof value === 'string' && /^\d+(?:\.\d+)?$/.test(value.trim()))) return null;
  const result = Number(value);
  return Number.isFinite(result) ? result : null;
};
const slug = (value: string) => value.toLowerCase().normalize('NFKD').replace(/[\u0300-\u036f]/g, '')
  .replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

function parseDate(value: string): SourceDate | null {
  const match = /^(\d{4})(?:-(\d{1,2})(?:-(\d{1,2}))?)?$/.exec(value.trim());
  if (!match) return null;
  const year = Number(match[1]);
  const month = match[2] ? Number(match[2]) : undefined;
  const day = match[3] ? Number(match[3]) : undefined;
  if (year < 1000 || (month !== undefined && (month < 1 || month > 12))) return null;
  if (day !== undefined && (day < 1 || day > new Date(Date.UTC(year, month!, 0)).getUTCDate())) return null;
  const iso = [year, month === undefined ? null : String(month).padStart(2, '0'), day === undefined ? null : String(day).padStart(2, '0')]
    .filter((part) => part !== null).join('-');
  return { year, month, day, iso };
}

function parseEnd(value: string): SourceDate | 'present' | null {
  return /^(present|now|ongoing|current)$/i.test(value.trim()) ? 'present' : parseDate(value);
}

const present: Record<Locale, string> = { en: 'Present', de: 'Heute', fa: 'اکنون' };

function dateLabel(value: SourceDate, locale: Locale): string {
  return new Intl.DateTimeFormat(intlLocale[locale], {
    year: 'numeric', month: value.month ? 'short' : undefined,
    day: value.day ? 'numeric' : undefined, timeZone: 'UTC',
  }).format(new Date(Date.UTC(value.year, (value.month ?? 1) - 1, value.day ?? 1)));
}

function periodLabel(start: SourceDate | null, end: SourceDate | 'present' | null, locale: Locale, fallback: string): string {
  const labels = [start ? dateLabel(start, locale) : '', end === 'present' ? present[locale] : end ? dateLabel(end, locale) : ''];
  return [...new Set(labels.filter(Boolean))].join(' – ') || fallback;
}

function durationMonths(start: SourceDate | null, end: SourceDate | 'present' | null, now: Date): number | null {
  if (!start || !end) return null;
  const lastYear = end === 'present' ? now.getUTCFullYear() : end.year;
  const lastMonth = end === 'present' ? now.getUTCMonth() + 1 : end.month ?? 12;
  const months = (lastYear - start.year) * 12 + lastMonth - (start.month ?? 1) + 1;
  return months > 0 ? months : null;
}

// Geographic lookup is applied only when the supplied records identify a city
// or a campus named in the template. Dates come from those records.
type Place = Pick<JourneyStop, 'id' | 'city' | 'lat' | 'lng' | 'country'> & { match: RegExp };
const places: Place[] = [
  { id: 'roudehen', city: 'Roudehen', lat: 35.735, lng: 51.91, country: 'IR', match: /roudehen|rodehen|رودهن/i },
  { id: 'tehran', city: 'Tehran', lat: 35.6892, lng: 51.389, country: 'IR', match: /tehran|تهران/i },
  { id: 'saarbruecken', city: 'Saarbrücken', lat: 49.2402, lng: 6.9969, country: 'DE', match: /saarbr(?:ü|ue|u)cken|saarland university|زاربروکن|ساربروکن/i },
  { id: 'martinsried', city: 'Martinsried', lat: 48.11, lng: 11.46, country: 'DE', match: /martinsried|max planck institute for biological intelligence/i },
  { id: 'jena', city: 'Jena', lat: 50.9271, lng: 11.5892, country: 'DE', match: /\bjena\b|max planck institute for biogeochemistry/i },
];

const identifyPlace = (value: string): Place | undefined => places.find((place) => place.match.test(value));

function buildJourney(entries: Array<{ city: JourneyId | null; start: string | null; end: string | null }>, locale: Locale): JourneyStop[] {
  const years = new Intl.NumberFormat(intlLocale[locale], { useGrouping: false });
  return places.flatMap(({ id, city, lat, lng, country }) => {
    const dates = entries.filter((entry) => entry.city === id && entry.start).map((entry) => ({
      start: parseDate(entry.start!)?.year,
      end: entry.end === 'present' ? 'present' : entry.end ? parseDate(entry.end)?.year : undefined,
    }));
    const starts = dates.flatMap(({ start }) => start === undefined ? [] : [start]);
    if (!starts.length) return [];
    const from = Math.min(...starts);
    const ends = dates.flatMap(({ end }) => typeof end === 'number' ? [end] : []);
    const isCurrent = dates.some(({ end }) => end === 'present');
    const to = !isCurrent && ends.length ? Math.max(...ends) : undefined;
    const period = isCurrent ? `${years.format(from)} – ${present[locale]}` :
      to && to !== from ? `${years.format(from)} – ${years.format(to)}` : years.format(from);
    return [{ id, city, lat, lng, country, from, to, period, note: '' }];
  }).sort((a, b) => a.from - b.from);
}

function repository(url: string): string | null {
  if (!url) return null;
  const parsed = new URL(url);
  if (!/^(?:www\.)?github\.com$/i.test(parsed.hostname)) return null;
  const [, owner, name] = parsed.pathname.split('/');
  return /^[a-z0-9-]+$/i.test(owner ?? '') && /^[a-z0-9._-]+$/i.test(name ?? '')
    ? `${owner}/${name.replace(/\.git$/i, '')}` : null;
}

function projectCategory(tags: string[], title: string): ProjectCategory {
  const value = [title, ...tags].join(' ');
  if (/protein structure|structural bioinformatics|alphafold|homology model/i.test(value)) return 'structural';
  if (/bioinformatics|omics|sequencing|genom|rna-seq/i.test(value)) return 'omics';
  if (/machine learning|deep learning|data science|\bocr\b|\bai\b/i.test(value)) return 'ml';
  if (/biotech|fermentation|molecular biology|synthetic biology/i.test(value)) return 'biotech';
  return 'software';
}

function roleKind(title: string, tags: string[]): Experience['kind'] {
  if (/research|thesis|laboratory|bioinformatics|synthetic biology/i.test(title)) return 'research';
  if (/teach|coach|tutor|academic assistant/i.test(title)) return 'teaching';
  if (/sales|business|commercial/i.test([title, ...tags].join(' '))) return 'business';
  return 'industry';
}

function durationValue(duration: string, unit: string): number | null {
  return number(new RegExp(`(?:^|\\s)(\\d+(?:\\.\\d+)?)\\s*${unit}\\b`, 'i').exec(duration)?.[1]);
}

function publicationBibtex(publication: Omit<Publication, 'bibtex'>): string | null {
  if (!publication.title) return null;
  const kind = /chapter/i.test(publication.type) ? 'incollection' : /thesis/i.test(publication.type) ? 'thesis' : 'misc';
  const venue = kind === 'incollection' ? 'booktitle' : kind === 'thesis' ? 'school' : 'howpublished';
  const fields = [
    ['title', publication.title], ['author', publication.authors.join(' and ')],
    ['year', publication.year], [venue, publication.venue], ['publisher', publication.publisher],
    ['doi', publication.doi], ['isbn', publication.isbn], ['url', publication.url],
  ].filter(([, value]) => value !== null && value !== '');
  const escaped = (value: unknown) => String(value).replace(/[{}&%$#_]/g, '\\$&').replace(/[\r\n]+/g, ' ');
  return `@${kind}{${publication.id},\n${fields.map(([key, value]) => `  ${key} = {${escaped(value)}}`).join(',\n')}\n}`;
}

const labels: Record<Locale, Partial<Record<Stat['id'], string>>> = {
  en: { repos: 'Linked repositories', mpi: 'Max Planck roles', courses: 'Courses', hours: 'Documented course hours', languages: 'Languages', chapter: 'Published book chapters' },
  de: { repos: 'Verlinkte Repositories', mpi: 'Max-Planck-Stationen', courses: 'Kurse', hours: 'Dokumentierte Kursstunden', languages: 'Sprachen', chapter: 'Veröffentlichte Buchkapitel' },
  fa: { repos: 'مخزن‌های پیوندشده', mpi: 'سوابق مکس پلانک', courses: 'دوره‌ها', hours: 'ساعت ثبت‌شدهٔ دوره‌ها', languages: 'زبان‌ها', chapter: 'فصل‌های منتشرشدهٔ کتاب' },
};

export function adaptPortfolio(input: unknown, locale: Locale): SiteData {
  const model = adaptCV(input);
  if (!model.identity.name) throw new Error('The authenticated portfolio has no name.');
  const now = new Date();
  const profiles = new Map(model.profiles.filter((profile) => profile.url)
    .map((profile) => [profile.network.toLowerCase().replace(/\s+/g, ''), profile.url]));
  const email = model.contact.email.split(',').map((value) => value.trim())
    .find((value) => /^[^\s?#,:@]+@[^\s?#,:@]+\.[^\s?#,:@]+$/.test(value)) ?? '';

  const thesisIndex = model.experience.findIndex((record) => /master.s thesis/i.test(record.title) && /university of tehran/i.test(record.organization));
  const experiences: Experience[] = model.experience.map((record, index) => {
    const parts = record.period.split(/\s+[-–—]\s+|[–—]/);
    const start = parseDate(parts[0] ?? '');
    const end = parseEnd(parts[1] ?? '');
    const location = record.location;
    const place = identifyPlace(location) ?? identifyPlace(record.organization);
    return {
      id: index === thesisIndex ? 'ut-thesis' : record.id,
      kind: roleKind(record.title, record.tags),
      city: place?.id ?? null, role: record.title, org: record.organization,
      location, description: record.description, start: start?.iso ?? null,
      end: end === 'present' ? end : end?.iso ?? null,
      period: periodLabel(start, end, locale, record.period), months: durationMonths(start, end, now),
      startYear: start?.year ?? null, current: end === 'present', order: index,
    };
  });

  const education: SiteData['education'] = model.education.map((record) => {
    const start = parseDate(record.start);
    const end = parseEnd(record.end);
    return {
      id: record.id, city: (identifyPlace(record.location) ?? identifyPlace(record.institution))?.id ?? null,
      institution: record.institution, degree: [record.degree, record.field].filter(Boolean).join(' · '),
      location: record.location, start: start?.iso ?? null, end: end === 'present' ? end : end?.iso ?? null,
      period: periodLabel(start, end, locale, [record.start, record.end].filter(Boolean).join(' – ')),
      startYear: start?.year ?? null, endYear: end === 'present' ? null : end?.year ?? null,
      gpa: record.gpa || null, current: end === 'present',
    };
  });

  const projectRecords: Project[] = model.projects.map((record, index) => {
    const repo = repository(record.url);
    return {
      id: record.id, title: record.title, description: record.description,
      url: record.url || null, repo, category: projectCategory(record.tags, record.title),
      tags: record.tags, highlight: index < 4, metric: null, featured: index < 8,
    };
  });

  const publications: Publication[] = model.publications.map((record) => {
    const authors = record.authors.filter((name: string) => !/^\s*(?:and\s+)?(?:other\s+)?co-authors\s*$/i.test(name))
      .map((name: string) => name.replace(/\s*\(co-author\)\s*$/i, ''));
    const doiUrl = record.doi && /^10\.\d{4,9}\/\S+$/.test(record.doi) ? safeUrl(`https://doi.org/${record.doi}`) : '';
    const publication: Omit<Publication, 'bibtex'> = {
      id: record.id, title: record.title, type: record.kind, status: record.status,
      year: number(record.year), authors, hasMoreAuthors: authors.length < record.authors.length,
      firstAuthor: authors.length > 1 && authors[0].trim().toLowerCase() === model.identity.name.trim().toLowerCase(),
      venue: record.venue || null, publisher: record.publisher || null, doi: record.doi || null,
      isbn: record.isbn || null, url: record.url || doiUrl || null,
      supervisors: record.supervisors.length ? record.supervisors : null,
    };
    return { ...publication, bibtex: publicationBibtex(publication) };
  });

  const skills: SkillCategory[] = model.skillGroups.map((domain) => ({
    id: slug(domain.name) || domain.id, key: domain.name, label: domain.name,
    groups: domain.groups.map((group) => ({
      id: group.id, key: group.name, label: group.name,
      items: group.items.map((item) => ({ name: item.shortName || item.name, long: item.name || item.shortName, key: item.id })),
    })),
  }));
  const groups = skills.flatMap((category) => category.groups);
  const domains = skillDomains.map(({ id, hue, groups: keys }) => {
    const matched = groups.filter((group) => keys.includes(group.key));
    const items = matched.flatMap((group) => group.items);
    return { id, hue, label: matched[0]?.label ?? id, groupLabels: matched.map((group) => group.label), count: items.length, items };
  });
  // The JavaScript adapter fills this initially empty array after construction.
  const sourceCertificates: SourceCertificate[] = model.certificates;
  const certifications: Certification[] = sourceCertificates.map((record) => {
    const date = parseDate(record.date);
    return {
      name: record.title, issuer: record.issuer, date: record.date || null,
      year: date?.year ?? null, month: date?.month ?? null,
      hours: durationValue(record.duration, 'hours?|hrs?'), weeks: durationValue(record.duration, 'weeks?'),
      certificate: record.hasCertificate === true, url: record.url || null,
    };
  });
  const languages: LanguageSkill[] = model.languages.map((record) => {
    let cert: LanguageSkill['cert'] = null;
    for (const test of record.tests) {
      const score = (key: string) => number(test.scores.find((item) => item.label === key)?.value);
      const overall = score('overall');
      const max = number(test.scores.find((item) => item.label === 'overall')?.max);
      const reading = score('reading'), listening = score('listening'), writing = score('writing'), speaking = score('speaking');
      if (!test.name || overall === null || max === null || max <= 0 ||
          reading === null || listening === null || writing === null || speaking === null) continue;
      cert = { test: test.name, overall, max, bands: { reading, listening, writing, speaking }, date: test.date || null, url: test.url || null };
      break;
    }
    return {
      id: slug(record.name) || record.id, name: record.name, level: record.level || record.status,
      cefr: record.cefr || null, native: /native|mother tongue/i.test(`${record.level} ${record.status}`), cert,
    };
  });
  const certStats = {
    count: certifications.length,
    hours: certifications.reduce((sum, record) => sum + (record.hours ?? 0), 0),
    withCertificate: certifications.filter((record) => record.certificate).length,
    issuers: [...new Set(certifications.map((record) => record.issuer).filter(Boolean))],
  };
  const statValues: Array<[Stat['id'], number]> = [
    ['repos', new Set(projectRecords.flatMap((project) => project.repo ? [project.repo.toLowerCase()] : [])).size],
    ['mpi', experiences.filter((record) => /max planck/i.test(record.org)).length],
    ['courses', certStats.count], ['hours', certStats.hours], ['languages', languages.length],
    ['chapter', publications.filter((record) => /chapter/i.test(record.type) && /^published$/i.test(record.status)).length],
  ];
  const stats = statValues.map(([id, value]) => ({ id, value, suffix: '', label: labels[locale][id] ?? id }));
  const { name, givenName, familyName, roles, summary, location, avatarUrl, coverUrl } = model.identity;
  return {
    locale, dir: dirOf(locale), generatedAt: now.toISOString(),
    person: {
      firstName: givenName || name, lastName: familyName, fullName: name, displayName: name,
      labels: roles, headline: roles[0] ?? '', tagline: roles.slice(1).join(' · '),
      intro: summary, statement: summary, about: summary.split(/\n\s*\n/).filter(Boolean),
      location, status: '', availability: '', email, photo: avatarUrl || null, cover: coverUrl || null,
    },
    links: {
      github: profiles.get('github') || null, linkedin: profiles.get('linkedin') || null,
      orcid: profiles.get('orcid') || null, scholar: profiles.get('googlescholar') || profiles.get('scholar') || null,
      website: profiles.get('website') || null, email: email ? `mailto:${email}` : '',
    },
    stats, experiences, current: experiences.filter((record) => record.current && record.kind === 'research'),
    projects: projectRecords.filter((record) => record.featured), archive: projectRecords.filter((record) => !record.featured),
    publications, education, skills, domains, softSkills: skills.find((category) => category.id === 'soft-skills')?.groups.flatMap((group) => group.items) ?? [],
    certifications, certStats, languages, journey: buildJourney([...education, ...experiences], locale),
  };
}

export const getSiteData = adaptPortfolio;
