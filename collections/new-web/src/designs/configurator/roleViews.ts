/**
 * Role views ("isoforms" of one CV) for the Configurator design.
 *
 * EDITORIAL MAPPING — the numbers below are presentation weights chosen by hand, not facts:
 * how much a view cares about a skill domain, a project category and an experience kind (0–3).
 * Ranking = sum of the matching weights (+0.5 for projects the CV marks as highlights); ties keep
 * CV order. A view never adds, removes or rewrites anything — it only reorders and emphasises.
 * Domain membership of projects / roles / courses comes from derive.ts (tags + curation.ts).
 */
import type { ExperienceKind, ProjectCategory } from '@/content/curation';
import { allProjects, courseDomains, projectDomains, roleDomains, skillIndex, type FlatSkill } from '@/lib/derive';
import type { Certification, Experience, Project, SiteData, Stat } from '@/lib/types';

export type ViewId = 'bioinf' | 'rse' | 'ml' | 'wetlab' | 'fullstack' | 'all';
export type Depth = 'highlights' | 'complete';
export type Format = 'web' | 'json' | 'print';

export const VIEW_IDS: ViewId[] = ['bioinf', 'rse', 'ml', 'wetlab', 'fullstack', 'all'];
export const DEPTHS: Depth[] = ['highlights', 'complete'];
export const FORMATS: Format[] = ['web', 'json', 'print'];

export interface RoleView {
  id: ViewId;
  /** soft "product shot" gradient */
  shot: [string, string];
  domains: Partial<Record<string, number>>;
  categories: Partial<Record<ProjectCategory, number>>;
  kinds: Partial<Record<ExperienceKind, number>>;
  /** which of person.labels lead the emphasis line (indices) — empty = the headline */
  labels: number[];
  /** key stats shown in the hero */
  stats: Stat['id'][];
}

export const VIEWS: Record<ViewId, RoleView> = {
  bioinf: {
    id: 'bioinf',
    shot: ['#d3f3e9', '#a9dcff'],
    domains: { singlecell: 3, genomics: 3, systems: 2, structural: 2, ml: 1, wetlab: 1 },
    categories: { omics: 3, structural: 2, ml: 1 },
    kinds: { research: 3, teaching: 1 },
    labels: [0, 1],
    stats: ['mpi', 'chapter', 'courses', 'hours'],
  },
  rse: {
    id: 'rse',
    shot: ['#e3e8ff', '#c6d0ff'],
    domains: { software: 3, devops: 2, data: 2, genomics: 1, singlecell: 1, systems: 1 },
    categories: { software: 3, omics: 1, ml: 1 },
    kinds: { research: 2, industry: 2 },
    labels: [3, 0],
    stats: ['repos', 'years', 'mpi', 'ocr'],
  },
  ml: {
    id: 'ml',
    shot: ['#ffe2ea', '#ffd0b0'],
    domains: { ml: 3, systems: 2, data: 2, software: 1, singlecell: 1 },
    categories: { ml: 3, omics: 1, software: 1 },
    kinds: { research: 2, industry: 2 },
    labels: [2, 0],
    stats: ['ocr', 'mpi', 'repos', 'hours'],
  },
  wetlab: {
    id: 'wetlab',
    shot: ['#e6f6d5', '#c2ebb6'],
    domains: { wetlab: 3, bioprocess: 3, genomics: 1 },
    categories: { biotech: 3, omics: 1 },
    kinds: { research: 2, teaching: 1 },
    labels: [1, 0],
    stats: ['chapter', 'courses', 'hours', 'mpi'],
  },
  fullstack: {
    id: 'fullstack',
    shot: ['#fff0c7', '#ffd4a3'],
    domains: { software: 3, devops: 3, data: 2, ml: 1 },
    categories: { software: 3, ml: 1 },
    kinds: { industry: 3, business: 1, research: 1 },
    labels: [3, 2],
    stats: ['repos', 'years', 'ocr', 'languages'],
  },
  all: {
    id: 'all',
    shot: ['#eef0f5', '#dde2eb'],
    domains: {},
    categories: {},
    kinds: {},
    labels: [],
    stats: ['repos', 'mpi', 'courses', 'hours'],
  },
};

export const isView = (v: string | null): v is ViewId => !!v && (VIEW_IDS as string[]).includes(v);
export const isDepth = (v: string | null): v is Depth => !!v && (DEPTHS as string[]).includes(v);
export const isFormat = (v: string | null): v is Format => !!v && (FORMATS as string[]).includes(v);

/** stable sort by score (desc); equal scores keep their original order */
function rank<T>(items: T[], score: (x: T) => number): Array<{ item: T; score: number }> {
  return items
    .map((item, i) => ({ item, score: score(item), i }))
    .sort((a, b) => b.score - a.score || a.i - b.i)
    .map(({ item, score }) => ({ item, score }));
}

export interface Ranked {
  projects: Array<{ item: Project; score: number }>;
  roles: Array<{ item: Experience; score: number }>;
  courses: Array<{ item: Certification; score: number }>;
  skills: FlatSkill[];
  /** domain weight for skills (emphasis) */
  weightOf: (domain: string | null) => number;
}

export function rankFor(data: SiteData, view: RoleView): Ranked {
  const skills = skillIndex(data);
  const sum = (ds: string[]) => ds.reduce((n, d) => n + (view.domains[d] ?? 0), 0);
  const projects = rank(allProjects(data), (p) => (view.id === 'all' ? 0 : sum(projectDomains(p, skills)) + (view.categories[p.category] ?? 0) + (p.highlight ? 0.5 : 0)));
  const roles = rank(data.experiences, (e) => (view.kinds[e.kind] ?? 0) + sum(roleDomains(e)));
  const courses = rank(data.certifications, (c) => sum(courseDomains(c)));
  return { projects, roles, courses, skills, weightOf: (d) => (d ? (view.domains[d] ?? 0) : 0) };
}

/** how many items the "Highlights" depth shows per section */
export const HIGHLIGHT_N = { projects: 6, roles: 5, courses: 8 } as const;
