/**
 * Data model of the Genome design: CV entries as features on a time "chromosome" (chrRY)
 * and projects as genes on an ordinal chromosome (chrP). Everything comes from SiteData.
 */
import { allProjects, nowFrac, spanOf, yearFrac, yearRange } from '@/lib/derive';
import type { Certification, Education, Experience, Project, Publication, SiteData } from '@/lib/types';

export type TrackId = 'education' | 'research' | 'teaching' | 'industry' | 'business' | 'courses' | 'publications';
export const TRACKS: TrackId[] = ['education', 'research', 'teaching', 'industry', 'business', 'courses', 'publications'];

/** Fill colours for feature glyphs; all carry white labels at ≥ 4.5:1. */
export const TRACK_COLOR: Record<TrackId, string> = {
  education: '#374151',
  research: '#0b7568',
  teaching: '#6b4fd1',
  industry: '#2c6db0',
  business: '#b4532b',
  courses: '#475569',
  publications: '#b42318',
};

export const CATEGORY_COLOR: Record<Project['category'], string> = {
  omics: '#0b7568',
  structural: '#6b4fd1',
  ml: '#b42318',
  software: '#2c6db0',
  biotech: '#8a6a00',
};

interface Base {
  id: string;
  track: TrackId;
  start: number;
  end: number;
  open: boolean;
  label: string;
  row: number;
}
export type Feature =
  | (Base & { kind: 'role'; item: Experience })
  | (Base & { kind: 'education'; item: Education })
  | (Base & { kind: 'course'; item: Certification; index: number })
  | (Base & { kind: 'publication'; item: Publication });
export type Gene = { kind: 'project'; id: string; index: number; item: Project };
export type Selectable = Feature | Gene;

/** Greedy interval packing: overlapping features of one track go to separate rows. */
function pack<T extends { start: number; end: number; row: number }>(items: T[], gap: number) {
  const rowsEnd: number[] = [];
  for (const f of [...items].sort((a, b) => a.start - b.start || b.end - a.end)) {
    let r = rowsEnd.findIndex((e) => e + gap <= f.start);
    if (r === -1) r = rowsEnd.length;
    rowsEnd[r] = f.end;
    f.row = r;
  }
  return Math.max(1, rowsEnd.length);
}

export interface Model {
  domain: [number, number];
  now: number;
  features: Feature[];
  rows: Record<TrackId, number>;
  undatedRoles: Experience[];
  undatedPubs: Publication[];
  genes: Gene[];
  /** year → number of entries active in it (roles, education, courses, publications) */
  density: Array<{ year: number; count: number }>;
  /** moving to Germany (start of the Saarland degree) — the "centromere" */
  centromere: number | null;
}

export function buildModel(data: SiteData): Model {
  const now = nowFrac(data);
  const [lo, hi] = yearRange(data);
  const features: Feature[] = [];

  for (const e of data.education) {
    const s = spanOf(e, data);
    if (s) features.push({ kind: 'education', id: `edu-${e.id}`, track: 'education', start: s.start, end: s.end, open: s.open, label: e.degree, row: 0, item: e });
  }
  const undatedRoles: Experience[] = [];
  for (const e of data.experiences) {
    const s = spanOf(e, data);
    if (!s) {
      undatedRoles.push(e);
      continue;
    }
    features.push({ kind: 'role', id: `role-${e.id}`, track: e.kind, start: s.start, end: s.end, open: s.open, label: e.role, row: 0, item: e });
  }
  data.certifications.forEach((c, i) => {
    const s = yearFrac(c.date);
    if (s === null) return;
    features.push({ kind: 'course', id: `course-${i}`, track: 'courses', start: s, end: s + 1 / 24, open: false, label: c.name, row: 0, item: c, index: i });
  });
  const undatedPubs: Publication[] = [];
  for (const p of data.publications) {
    if (!p.year) {
      undatedPubs.push(p);
      continue;
    }
    features.push({ kind: 'publication', id: `pub-${p.id}`, track: 'publications', start: p.year + 0.5, end: p.year + 0.5 + 1 / 24, open: false, label: p.title, row: 0, item: p });
  }

  const rows = {} as Record<TrackId, number>;
  for (const t of TRACKS) rows[t] = pack(features.filter((f) => f.track === t), t === 'courses' ? 0.01 : 0.03);

  const domainEnd = Math.ceil(Math.max(now, ...features.map((f) => f.end)) + 0.001);
  const domain: [number, number] = [lo, Math.max(domainEnd, hi + 1)];

  const density: Model['density'] = [];
  for (let y = domain[0]; y < domain[1]; y++) {
    const count = features.filter((f) => f.start < y + 1 && f.end > y).length;
    density.push({ year: y, count });
  }

  const de = data.education.find((e) => e.city === 'saarbruecken');
  const centromere = de ? yearFrac(de.start) : null;

  // genes grouped by category (one band each); featured projects first inside a category
  const order: Project['category'][] = ['omics', 'structural', 'ml', 'software', 'biotech'];
  const projects = allProjects(data)
    .map((p, i) => ({ p, i }))
    .sort((a, b) => order.indexOf(a.p.category) - order.indexOf(b.p.category) || a.i - b.i)
    .map((x) => x.p);
  const genes: Gene[] = projects.map((p, i) => ({ kind: 'project', id: `gene-${p.id}`, index: i + 1, item: p }));
  return { domain, now, features, rows, undatedRoles, undatedPubs, genes, density, centromere };
}

/** Grey level of an ideogram band (Giemsa-like stain) from the number of active entries. */
export function stain(count: number): string {
  if (count === 0) return '#f3f4f6';
  if (count <= 2) return '#d1d5db';
  if (count <= 4) return '#9ca3af';
  if (count <= 9) return '#4b5563';
  return '#1f2937';
}

/* ─────────────────────────────── text exports ─────────────────────────────── */

const ym = (f: number) => {
  const y = Math.floor(f);
  const m = Math.min(12, Math.floor((f - y) * 12) + 1);
  return `${y}-${String(m).padStart(2, '0')}`;
};
const esc = (s: string) => s.replace(/%/g, '%25').replace(/;/g, '%3B').replace(/=/g, '%3D').replace(/&/g, '%26').replace(/,/g, '%2C').replace(/\t/g, ' ');

/** GFF3-style text of every feature (dates instead of base positions). */
export function toGff(model: Model, data: SiteData): string {
  const lines = ['##gff-version 3', `##sequence-region chrRY ${model.domain[0]} ${model.domain[1]}`, `##sequence-region chrP 1 ${model.genes.length}`];
  const type: Record<Feature['kind'], string> = { role: 'role', education: 'degree', course: 'course', publication: 'publication' };
  for (const f of [...model.features].sort((a, b) => a.start - b.start)) {
    const attrs = [`ID=${f.id}`, `Name=${esc(f.label)}`];
    if (f.kind === 'role') attrs.push(`Org=${esc(f.item.org)}`, `Track=${f.track}`);
    if (f.kind === 'education') attrs.push(`Institution=${esc(f.item.institution)}`);
    if (f.kind === 'course') attrs.push(`Issuer=${esc(f.item.issuer)}`, ...(f.item.hours ? [`Hours=${f.item.hours}`] : []));
    if (f.kind === 'publication') attrs.push(`Status=${esc(f.item.status)}`);
    lines.push(['chrRY', 'cv', type[f.kind], ym(f.start), f.open ? 'present' : ym(f.end), '.', '+', '.', attrs.join(';')].join('\t'));
  }
  for (const e of model.undatedRoles) lines.push(['chrRY', 'cv', 'role', '.', '.', '.', '+', '.', `ID=role-${e.id};Name=${esc(e.role)};Org=${esc(e.org)};Note=undated`].join('\t'));
  for (const g of model.genes)
    lines.push(
      ['chrP', 'cv', 'project', String(g.index), String(g.index), '.', g.index % 2 ? '+' : '-', '.', `ID=${g.id};Name=${esc(g.item.title)};Category=${g.item.category}${g.item.tags.length ? `;Tags=${esc(g.item.tags.join(','))}` : ''}`].join('\t'),
    );
  void data;
  return lines.join('\n');
}

/** One-letter amino-acid code → one of its codons (first in the standard table). */
const CODON: Record<string, string> = {
  A: 'GCT', R: 'CGT', N: 'AAT', D: 'GAT', C: 'TGT', Q: 'CAA', E: 'GAA', G: 'GGT', H: 'CAT', I: 'ATT',
  L: 'CTT', K: 'AAA', M: 'ATG', F: 'TTT', P: 'CCT', S: 'TCT', T: 'ACT', W: 'TGG', Y: 'TAT', V: 'GTT',
};
/** "Ramin Yazdani" → letters + codons; letters that are no amino-acid code (B J O U X Z) → NNN. */
export function signature(name: string) {
  return name
    .toUpperCase()
    .replace(/[^A-Z]/g, '')
    .split('')
    .map((l) => ({ letter: l, codon: CODON[l] ?? 'NNN' }));
}
