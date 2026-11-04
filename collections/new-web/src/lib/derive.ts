/**
 * Derived views of SiteData shared by the designs: flat skill index, project ↔ skill links,
 * evidence per skill domain, years and durations. Pure functions — safe on server and client.
 * Everything here is computed from the CV (+ the editorial mapping in content/curation.ts);
 * nothing is invented.
 */
import { categoryDomainFallback, courseDomainRules, experienceDomains, skillDomains, tagDomainHints } from '@/content/curation';
import type { Certification, Education, Experience, Project, SiteData, SkillItem } from './types';

export interface FlatSkill extends SkillItem {
  /** Unique id (`group/key`) — a few skill names appear in two groups. Use it as React key. */
  uid: string;
  /** 1-based position in CV order (stable). */
  index: number;
  categoryId: string;
  categoryLabel: string;
  groupId: string;
  groupLabel: string;
  /** Skill domain id (see curation.skillDomains) or null (soft skills, uncategorised). */
  domain: string | null;
}

/** Every skill of the CV (soft skills excluded), in CV order. */
export function skillIndex(data: SiteData): FlatSkill[] {
  // the domain of a skill follows its group (curation.skillDomains lists group keys)
  const domainOfGroup = new Map<string, string>();
  for (const d of skillDomains) for (const g of d.groups) domainOfGroup.set(g, d.id);
  const out: FlatSkill[] = [];
  for (const c of data.skills) {
    if (c.id === 'soft-skills') continue;
    for (const g of c.groups)
      for (const it of g.items)
        out.push({
          ...it,
          uid: `${g.id}/${it.key}`,
          index: out.length + 1,
          categoryId: c.id,
          categoryLabel: c.label,
          groupId: g.id,
          groupLabel: g.label,
          domain: domainOfGroup.get(g.key) ?? null,
        });
  }
  return out;
}

/** Featured projects first (curation order), then the archive. */
export const allProjects = (data: SiteData): Project[] => [...data.projects, ...data.archive];

const lc = (s: string) => s.toLowerCase();

/** Skills whose name equals one of the project's tags (case-insensitive). */
export function projectSkills(p: Project, skills: FlatSkill[]): FlatSkill[] {
  const tags = new Set(p.tags.map(lc));
  const seen = new Set<string>();
  return skills.filter((s) => tags.has(lc(s.name)) && !seen.has(lc(s.name)) && seen.add(lc(s.name)));
}

/** Domains a project is evidence for: tag → skill → domain, tag hints, else the category fallback. */
export function projectDomains(p: Project, skills: FlatSkill[]): string[] {
  const out = new Set<string>();
  for (const s of projectSkills(p, skills)) if (s.domain) out.add(s.domain);
  for (const t of p.tags) for (const d of tagDomainHints[t] ?? []) out.add(d);
  if (!out.size) for (const d of categoryDomainFallback[p.category] ?? []) out.add(d);
  return [...out];
}

export const roleDomains = (e: Experience): string[] => experienceDomains[e.id] ?? [];

export const courseDomains = (c: Certification): string[] => courseDomainRules.filter((r) => r.match.test(c.name)).map((r) => r.domain);

/** Projects that carry a skill as a tag (for "found in" lists). */
export function skillProjects(skill: { name: string }, projects: Project[]): Project[] {
  const n = lc(skill.name);
  return projects.filter((p) => p.tags.some((t) => lc(t) === n));
}

export interface DomainEvidence {
  id: string;
  label: string;
  hue: number;
  skills: FlatSkill[];
  projects: Project[];
  roles: Experience[];
  courses: Certification[];
}

/** For each skill domain: the skills in it and the projects, roles and courses that back it up. */
export function domainEvidence(data: SiteData): DomainEvidence[] {
  const skills = skillIndex(data);
  const projects = allProjects(data);
  return data.domains.map((d) => ({
    id: d.id,
    label: d.label,
    hue: d.hue,
    skills: skills.filter((s) => s.domain === d.id),
    projects: projects.filter((p) => projectDomains(p, skills).includes(d.id)),
    roles: data.experiences.filter((e) => roleDomains(e).includes(d.id)),
    courses: data.certifications.filter((c) => courseDomains(c).includes(d.id)),
  }));
}

/* ──────────────────────────────── time ──────────────────────────────── */

/** "2026-08-01" | "2026-08" | "2026" → fractional year (2026.58); null when unknown. */
export function yearFrac(s: string | null | undefined): number | null {
  if (!s || s === 'present') return null;
  const [y, m = 1, d = 1] = s.split('-').map(Number);
  if (!y) return null;
  return y + (Math.min(Math.max(m, 1), 12) - 1) / 12 + (Math.min(Math.max(d, 1), 31) - 1) / 365;
}

/** Year fraction of "now" (the build/generation time, so server and client agree). */
export const nowFrac = (data: SiteData) => {
  const g = new Date(data.generatedAt);
  return g.getUTCFullYear() + g.getUTCMonth() / 12 + (g.getUTCDate() - 1) / 365;
};

export interface Span {
  start: number;
  end: number;
  /** true when the CV says "present" (or the end is in the future). */
  open: boolean;
}

/** Time span of a dated entry; undated entries return null. Entries with a start but no end span 1 year. */
export function spanOf(e: Pick<Experience, 'start' | 'end'> | Pick<Education, 'start' | 'end'>, data: SiteData): Span | null {
  const start = yearFrac(e.start);
  if (start === null) return null;
  const now = nowFrac(data);
  if (e.end === 'present') return { start, end: Math.max(now, start + 1 / 12), open: true };
  const end = yearFrac(e.end ?? null);
  if (end === null) return { start, end: Math.min(start + 1, Math.max(now, start + 1 / 12)), open: false };
  return { start, end: Math.max(end, start + 1 / 24), open: end > now };
}

/** First and last calendar year covered by dated roles and education. */
export function yearRange(data: SiteData): [number, number] {
  const spans = [...data.experiences, ...data.education].map((e) => spanOf(e, data)).filter(Boolean) as Span[];
  const lo = Math.floor(Math.min(...spans.map((s) => s.start)));
  const hi = Math.floor(Math.max(nowFrac(data), ...spans.map((s) => s.end - 1e-6)));
  return [lo, hi];
}

/** Entries active in each calendar year of the range. */
export function activeByYear(data: SiteData) {
  const [lo, hi] = yearRange(data);
  const years: Array<{ year: number; roles: Experience[]; education: Education[]; courses: Certification[]; publications: SiteData['publications'] }> = [];
  for (let y = lo; y <= hi; y++) {
    const overlaps = (s: Span | null) => !!s && s.start < y + 1 && s.end > y;
    years.push({
      year: y,
      roles: data.experiences.filter((e) => overlaps(spanOf(e, data))),
      education: data.education.filter((e) => overlaps(spanOf(e, data))),
      courses: data.certifications.filter((c) => c.year === y),
      publications: data.publications.filter((p) => p.year === y),
    });
  }
  return years;
}

/** Deterministic pseudo-random number in [0, 1) from a string (for layouts that must match on server and client). */
export function hash01(s: string, salt = 0): number {
  let h = 2166136261 ^ salt;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  h ^= h >>> 13;
  h = Math.imul(h, 0x5bd1e995);
  h ^= h >>> 15;
  return (h >>> 0) / 4294967296;
}

/** Round for SVG attributes so server and client render identical strings. */
export const r2 = (n: number) => Math.round(n * 100) / 100;

/** Total course hours and counts (same as data.certStats, kept here for convenience in charts). */
export const courseHoursByYear = (data: SiteData) => {
  const m = new Map<number, { count: number; hours: number }>();
  for (const c of data.certifications) {
    if (!c.year) continue;
    const v = m.get(c.year) ?? { count: 0, hours: 0 };
    v.count++;
    v.hours += c.hours ?? 0;
    m.set(c.year, v);
  }
  return [...m.entries()].sort((a, b) => a[0] - b[0]).map(([year, v]) => ({ year, ...v }));
};
