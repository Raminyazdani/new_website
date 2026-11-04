/**
 * The Observatory's sky: constellations = skill domains, stars = evidence items (roles, projects,
 * courses, skills) that back a domain up, plus a star catalogue of every unique item.
 * Positions are decorative but deterministic (hash of ids); membership comes from derive.ts.
 */
import { geoDistance } from 'd3';
import { allProjects, courseDomains, hash01, projectDomains, roleDomains, skillIndex } from '@/lib/derive';
import { fmtYear, numberLocale } from '@/lib/format';
import type { SiteData } from '@/lib/types';

export type StarKind = 'role' | 'project' | 'course' | 'skill';
export type CatKind = StarKind | 'soft';
export const STAR_KINDS: StarKind[] = ['role', 'project', 'course', 'skill'];

export const KIND_STYLE: Record<StarKind, { r: number; color: string }> = {
  role: { r: 4.6, color: '#e6c27a' },
  project: { r: 3.4, color: '#f6f2e8' },
  course: { r: 2.6, color: '#8fc7ff' },
  skill: { r: 1.8, color: '#b9c3dc' },
};

export interface CatalogueItem {
  /** 1-based catalogue number → RY-0001 */
  no: number;
  kind: CatKind;
  /** stable id, e.g. `project:cv-generator` */
  key: string;
  name: string;
  domains: string[];
  /** display date (period / month + year) */
  date: string | null;
  href: string | null;
  /** in-page anchor of the full entry */
  anchor: string | null;
}

export interface Star {
  /** `${domain}|${key}` — a project in two domains is a star in two constellations */
  id: string;
  key: string;
  kind: StarKind;
  name: string;
  lon: number;
  lat: number;
}
export interface Constellation {
  id: string;
  index: number;
  lon: number;
  lat: number;
  radius: number;
  stars: Star[];
  /** minimum spanning tree over the stars (indices into `stars`) */
  edges: Array<[number, number]>;
}
export interface BgStar {
  lon: number;
  lat: number;
  m: number;
}

export const catNo = (n: number, loc: string) =>
  `RY-${new Intl.NumberFormat(numberLocale(loc), { minimumIntegerDigits: 4, useGrouping: false }).format(n)}`;

const monthYear = (loc: string, s: string | null, y: number | null) => {
  if (s) {
    const [yy, mm] = s.split('-').map(Number);
    if (mm) return new Intl.DateTimeFormat(numberLocale(loc), { month: 'short', year: 'numeric', timeZone: 'UTC' }).format(new Date(Date.UTC(yy, mm - 1, 1)));
    if (yy) return fmtYear(loc, yy);
  }
  return y ? fmtYear(loc, y) : null;
};

/** Every unique evidence item, numbered: roles, projects, courses, skills, soft skills. */
export function buildCatalogue(data: SiteData): CatalogueItem[] {
  const loc = data.locale;
  const skills = skillIndex(data);
  const out: Omit<CatalogueItem, 'no'>[] = [];
  for (const e of data.experiences)
    out.push({ kind: 'role', key: `role:${e.id}`, name: e.role, domains: roleDomains(e), date: e.period || null, href: null, anchor: `log-${e.id}` });
  for (const p of allProjects(data))
    out.push({ kind: 'project', key: `project:${p.id}`, name: p.title, domains: projectDomains(p, skills), date: null, href: p.url ?? p.repo, anchor: `dso-${p.id}` });
  data.certifications.forEach((c, i) =>
    out.push({ kind: 'course', key: `course:${i}`, name: c.name, domains: courseDomains(c), date: monthYear(loc, c.date, c.year), href: c.url, anchor: null }),
  );
  for (const s of skills) out.push({ kind: 'skill', key: `skill:${s.uid}`, name: s.name, domains: s.domain ? [s.domain] : [], date: null, href: null, anchor: null });
  for (const s of data.softSkills) out.push({ kind: 'soft', key: `soft:${s.key}`, name: s.name, domains: [], date: null, href: null, anchor: null });
  return out.map((x, i) => ({ ...x, no: i + 1 }));
}

const RAD = Math.PI / 180;
/** point at angular distance `dist` (deg) and `bearing` (rad) from [lon, lat] */
function dest(lon: number, lat: number, bearing: number, dist: number): [number, number] {
  const p1 = lat * RAD;
  const l1 = lon * RAD;
  const d = dist * RAD;
  const p2 = Math.asin(Math.sin(p1) * Math.cos(d) + Math.cos(p1) * Math.sin(d) * Math.cos(bearing));
  const l2 = l1 + Math.atan2(Math.sin(bearing) * Math.sin(d) * Math.cos(p1), Math.cos(d) - Math.sin(p1) * Math.sin(p2));
  return [(((l2 / RAD + 540) % 360) + 360) % 360 - 180, p2 / RAD];
}

const KIND_REACH: Record<StarKind, number> = { role: 0.5, project: 0.82, course: 0.95, skill: 1 };

export function buildSky(data: SiteData, catalogue: CatalogueItem[]): { constellations: Constellation[]; bg: BgStar[] } {
  const constellations: Constellation[] = data.domains.map((d, index) => {
    const members = catalogue
      .filter((c) => c.kind !== 'soft' && c.domains.includes(d.id))
      .sort((a, b) => STAR_KINDS.indexOf(a.kind as StarKind) - STAR_KINDS.indexOf(b.kind as StarKind));
    const n = Math.max(members.length, 1);
    const radius = 7 + 1.45 * Math.sqrt(n);
    const lon = -162 + index * 36;
    const lat = index % 2 ? -17 : 17;
    const dmin = 0.72 * Math.sqrt((Math.PI * radius * radius) / n);
    const stars: Star[] = [];
    for (const m of members) {
      const id = `${d.id}|${m.key}`;
      const reach = radius * KIND_REACH[m.kind as StarKind];
      let best: [number, number] = [lon, lat];
      let bestD = -1;
      for (let k = 0; k < 16; k++) {
        const p = dest(lon, lat, 2 * Math.PI * hash01(id, 2 * k + 1), reach * Math.sqrt(hash01(id, 2 * k + 2)));
        const near = stars.length ? Math.min(...stars.map((s) => geoDistance(p, [s.lon, s.lat]) / RAD)) : 99;
        if (near >= dmin) {
          best = p;
          break;
        }
        if (near > bestD) {
          bestD = near;
          best = p;
        }
      }
      stars.push({ id, key: m.key, kind: m.kind as StarKind, name: m.name, lon: best[0], lat: best[1] });
    }
    // Prim's minimum spanning tree on angular distance
    const edges: Array<[number, number]> = [];
    if (stars.length > 1) {
      const inTree = new Array(stars.length).fill(false);
      const dist = new Array(stars.length).fill(Infinity);
      const from = new Array(stars.length).fill(-1);
      dist[0] = 0;
      for (let it = 0; it < stars.length; it++) {
        let u = -1;
        for (let i = 0; i < stars.length; i++) if (!inTree[i] && (u < 0 || dist[i] < dist[u])) u = i;
        inTree[u] = true;
        if (from[u] >= 0) edges.push([from[u], u]);
        for (let v = 0; v < stars.length; v++) {
          if (inTree[v]) continue;
          const w = geoDistance([stars[u].lon, stars[u].lat], [stars[v].lon, stars[v].lat]);
          if (w < dist[v]) {
            dist[v] = w;
            from[v] = u;
          }
        }
      }
    }
    return { id: d.id, index, lon, lat, radius, stars, edges };
  });
  const bg: BgStar[] = Array.from({ length: 700 }, (_, i) => ({
    lon: 360 * hash01(`bg${i}`, 1) - 180,
    lat: Math.asin(2 * hash01(`bg${i}`, 2) - 1) / RAD,
    m: hash01(`bg${i}`, 3) ** 3,
  }));
  return { constellations, bg };
}
