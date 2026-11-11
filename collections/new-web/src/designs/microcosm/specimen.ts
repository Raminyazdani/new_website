import { fmtNum, fmtYear } from '@/lib/format';
import type { SiteData } from '@/lib/types';

export type Collection = 'profile' | 'roles' | 'projects' | 'papers' | 'methods' | 'education' | 'courses' | 'languages' | 'journey' | 'contact';

export interface Specimen {
  id: string;
  title: string;
  subtitle?: string;
  body: string[];
  methods?: string[];
  facts?: Array<[string, string]>;
  links?: Array<[string, string]>;
  citation?: string | null;
}

export type PortfolioRecords = Record<Collection, Specimen[]>;
export const collectionLabels: Record<Collection, string> = {
  profile: 'sections.about.title', roles: 'sections.experience.title', projects: 'sections.projects.title',
  papers: 'sections.publications.title', methods: 'sections.skills.title', education: 'sections.education.title',
  courses: 'sections.certifications.title', languages: 'sections.languages.title',
  journey: 'sections.journey.title', contact: 'nav.contact',
};

export function makeSpecimens(data: SiteData, t: (key: string) => string): PortfolioRecords {
  const p = data.person;
  const n = (count: number) => fmtNum(data.locale, count);
  const year = (value: number | null) => value === null ? '' : fmtYear(data.locale, value);
  const fact = (label: string, value: string | null | undefined): Array<[string, string]> => value ? [[label, value]] : [];
  const compact = (values: Array<string | null | undefined>) => values.filter((v): v is string => !!v);
  const links: Array<[string, string]> = [];
  const linkNames = { github: 'GitHub', linkedin: 'LinkedIn', orcid: 'ORCID', scholar: 'Google Scholar', website: t('common.visit'), email: t('common.email') };
  for (const key of Object.keys(linkNames) as Array<keyof SiteData['links']>) {
    links.push(...fact(linkNames[key], data.links[key]));
  }
  const profileText = compact([p.statement, p.intro, p.tagline, ...p.about]);
  const profileBody = [...new Set(profileText)].filter((piece) => !profileText.some((other) =>
    other !== piece && other.split(/\n\s*\n/).includes(piece)));

  return {
    profile: [{
      id: 'profile', title: p.displayName, subtitle: p.headline,
      body: profileBody,
      facts: [...fact(t('common.location'), p.location), ...fact(t('common.status'), p.status),
        ...data.stats.map((item): [string, string] => [item.label, n(item.value) + item.suffix])],
      methods: p.labels,
    }],
    roles: data.experiences.map((item) => ({
      id: item.id, title: item.role, subtitle: compact([item.org, item.period]).join(' · '),
      body: compact([item.description]),
      facts: [...fact(t('common.location'), item.location), ...fact(t('common.type'), t(`kinds.${item.kind}`)),
        ...fact(t('common.status'), item.current ? t('common.current') : '')],
    })),
    projects: [...data.projects, ...data.archive].map((item) => ({
      id: item.id, title: item.title, subtitle: t(`categories.${item.category}`), body: compact([item.description]),
      methods: item.tags, links: fact(item.repo || t('common.visit'), item.url), facts: fact(t('common.status'), item.metric),
    })),
    papers: data.publications.map((item) => ({
      id: item.id, title: item.title, subtitle: compact([item.venue, year(item.year), item.type]).join(' · '),
      body: compact([item.authors.join(', '), item.hasMoreAuthors ? t('common.withCoAuthors') : '']),
      facts: [...fact(t('common.status'), item.status), ...fact(t('common.firstAuthor'), item.firstAuthor ? t('common.firstAuthor') : ''),
        ...fact(t('common.doi'), item.doi), ...fact(t('common.isbn'), item.isbn),
        ...fact(t('common.organisation'), item.publisher), ...fact(t('common.supervisors'), item.supervisors?.join(', '))],
      citation: item.bibtex, links: fact(t('common.visit'), item.url),
    })),
    education: data.education.map((item) => ({
      id: item.id, title: item.degree, subtitle: compact([item.institution, item.period]).join(' · '), body: [],
      facts: [...fact(t('common.location'), item.location), ...fact(t('common.gpa'), item.gpa),
        ...fact(t('common.status'), item.current ? t('common.current') : '')],
    })),
    methods: data.skills.flatMap((category) => category.groups.flatMap((group) => group.items.map((item) => ({
      id: `${category.id}/${group.id}/${item.key}`, title: item.name, subtitle: group.label,
      body: item.long && item.long !== item.name ? [item.long] : [], facts: fact(t('common.type'), category.label),
    })))),
    courses: data.certifications.map((item, i) => ({
      id: `course-${i}`, title: item.name, subtitle: compact([item.issuer, item.date || year(item.year)]).join(' · '),
      body: [], links: fact(t('common.certificateLink'), item.url),
      facts: [...fact(t('common.certificate'), item.certificate ? t('common.certificate') : ''),
        ...fact(data.locale === 'fa' ? 'مدت' : data.locale === 'de' ? 'Dauer' : 'Duration',
          compact([item.hours === null ? '' : `${n(item.hours)} h`, item.weeks === null ? '' : `${n(item.weeks)} wk`]).join(' · ')),
        ...fact(t('common.issuer'), item.issuer)],
    })),
    languages: data.languages.map((item) => ({
      id: item.id, title: item.name, subtitle: compact([item.level, item.cefr]).join(' · '),
      body: [], links: fact(t('common.certificateLink'), item.cert?.url),
      facts: item.cert ? [
        [item.cert.test, `${n(item.cert.overall)} / ${n(item.cert.max)}`],
        ...Object.entries(item.cert.bands).map(([key, value]): [string, string] => [t(`ielts.${key}`), n(value)]),
        ...fact(t('common.year'), item.cert.date),
      ] : [],
    })),
    journey: data.journey.map((item) => ({ id: item.id, title: item.city, subtitle: item.period, body: compact([item.note]) })),
    contact: [{ id: 'contact', title: p.email || p.displayName, subtitle: p.location, body: compact([p.availability]), links }],
  };
}

export const matchesSpecimen = (item: Specimen, query: string, locale: SiteData['locale']) =>
  !query.trim() || [item.title, item.subtitle, ...item.body, ...(item.methods ?? []), ...(item.facts ?? []).flat(), ...(item.links ?? []).flat()]
    .some((value) => value?.toLocaleLowerCase(locale).includes(query.trim().toLocaleLowerCase(locale)));
