import type { ExperienceKind, JourneyId, ProjectCategory } from '@/content/curation';
import type { Locale } from '@/i18n/routing';

export type { ExperienceKind, ProjectCategory, JourneyId };

export interface Experience {
  id: string;
  kind: ExperienceKind;
  city: JourneyId | null;
  role: string;
  org: string;
  location: string;
  description: string;
  start: string | null;
  end: string | 'present' | null;
  period: string;
  months: number | null;
  startYear: number | null;
  current: boolean;
  order: number;
}

export interface Project {
  id: string;
  title: string;
  description: string;
  url: string | null;
  repo: string | null;
  category: ProjectCategory;
  tags: string[];
  highlight: boolean;
  metric: string | null;
  featured: boolean;
}

export interface Publication {
  id: string;
  title: string;
  type: string;
  status: string;
  year: number | null;
  authors: string[];
  hasMoreAuthors: boolean;
  firstAuthor: boolean;
  venue: string | null;
  publisher: string | null;
  doi: string | null;
  isbn: string | null;
  url: string | null;
  supervisors: string[] | null;
  bibtex: string | null;
}

export interface Education {
  id: string;
  city: JourneyId | null;
  institution: string;
  degree: string;
  location: string;
  start: string | null;
  end: string | 'present' | null;
  period: string;
  startYear: number | null;
  endYear: number | null;
  gpa: string | null;
  current: boolean;
}

export interface SkillItem {
  name: string;
  long: string;
  key: string;
}
export interface SkillGroup {
  id: string;
  key: string;
  label: string;
  items: SkillItem[];
}
export interface SkillCategory {
  id: string;
  key: string;
  label: string;
  groups: SkillGroup[];
}
export interface SkillDomain {
  id: string;
  hue: number;
  label: string;
  groupLabels: string[];
  count: number;
  items: SkillItem[];
}

export interface Certification {
  name: string;
  issuer: string;
  date: string | null;
  year: number | null;
  month: number | null;
  hours: number | null;
  weeks: number | null;
  certificate: boolean;
  url: string | null;
}

export interface LanguageSkill {
  id: string;
  name: string;
  level: string;
  cefr: string | null;
  native: boolean;
  cert: {
    test: string;
    overall: number;
    max: number;
    bands: { reading: number; listening: number; writing: number; speaking: number };
    date: string | null;
    url: string | null;
  } | null;
}

export interface Stat {
  id: 'repos' | 'mpi' | 'courses' | 'hours' | 'years' | 'languages' | 'chapter' | 'ocr';
  value: number;
  suffix: string;
  label: string;
}

export interface JourneyStop {
  id: JourneyId;
  lat: number;
  lng: number;
  from: number;
  to?: number;
  country: 'IR' | 'DE';
  city: string;
  note: string;
  period: string;
}

export interface SiteData {
  locale: Locale;
  dir: 'ltr' | 'rtl';
  generatedAt: string;
  person: {
    firstName: string;
    lastName: string;
    fullName: string;
    /** Name in the page language (Persian script on /fa). */
    displayName: string;
    labels: string[];
    headline: string;
    tagline: string;
    intro: string;
    statement: string;
    about: string[];
    location: string;
    status: string;
    availability: string;
    email: string;
    photo: string | null;
    cover: string | null;
  };
  links: {
    github: string | null;
    linkedin: string | null;
    orcid: string | null;
    scholar: string | null;
    website: string | null;
    email: string;
  };
  stats: Stat[];
  experiences: Experience[];
  current: Experience[];
  projects: Project[];
  archive: Project[];
  publications: Publication[];
  education: Education[];
  skills: SkillCategory[];
  domains: SkillDomain[];
  softSkills: SkillItem[];
  certifications: Certification[];
  certStats: { count: number; hours: number; withCertificate: number; issuers: string[] };
  languages: LanguageSkill[];
  journey: JourneyStop[];
}
