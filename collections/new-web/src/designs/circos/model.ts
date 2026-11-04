/**
 * Data for the Circos figures — everything derived from the CV through derive.ts.
 * Chords: a project whose tags/curation map it to domains A and B adds 1 to chord A–B
 * (every unordered pair of its domains). Checked by scripts/qa/test-circos.mjs.
 */
import { allProjects, projectDomains, skillIndex, spanOf, type FlatSkill } from '@/lib/derive';
import type { Education, Experience, Project, SiteData } from '@/lib/types';

export interface Dom {
  id: string;
  hue: number;
  skills: FlatSkill[];
  projects: Project[];
}
export interface Chord {
  a: string;
  b: string;
  projects: Project[];
}

export function circosModel(data: SiteData) {
  const skills = skillIndex(data);
  const projects = allProjects(data);
  const pd = new Map(projects.map((p) => [p.id, projectDomains(p, skills)]));
  const doms: Dom[] = data.domains.map((d) => ({
    id: d.id,
    hue: d.hue,
    skills: skills.filter((s) => s.domain === d.id),
    projects: projects.filter((p) => pd.get(p.id)!.includes(d.id)),
  }));
  const order = new Map(doms.map((d, i) => [d.id, i]));
  const m = new Map<string, Chord>();
  for (const p of projects) {
    const ds = [...pd.get(p.id)!].sort((x, y) => order.get(x)! - order.get(y)!);
    for (let i = 0; i < ds.length; i++)
      for (let j = i + 1; j < ds.length; j++) {
        const k = `${ds[i]}|${ds[j]}`;
        const c = m.get(k) ?? { a: ds[i], b: ds[j], projects: [] };
        c.projects.push(p);
        m.set(k, c);
      }
  }
  const chords = [...m.values()].sort((x, y) => y.projects.length - x.projects.length);
  return { doms, chords, pd, projects, skills };
}

/** symmetric domain × domain matrix of chord weights (diagonal = projects in that domain) */
export function chordMatrix(model: ReturnType<typeof circosModel>) {
  const ids = model.doms.map((d) => d.id);
  const M = ids.map(() => ids.map(() => 0));
  model.doms.forEach((d, i) => (M[i][i] = d.projects.length));
  for (const c of model.chords) {
    const i = ids.indexOf(c.a);
    const j = ids.indexOf(c.b);
    M[i][j] = M[j][i] = c.projects.length;
  }
  return { ids, M };
}

/* ── plasmid: dated roles and degrees as features on a 2015 → 2027 backbone ── */
export type Feature =
  | { id: string; kind: 'education'; start: number; end: number; open: boolean; label: string; item: Education; lane: number }
  | { id: string; kind: Experience['kind']; start: number; end: number; open: boolean; label: string; item: Experience; lane: number };

export function plasmidFeatures(data: SiteData): { features: Feature[]; lo: number; hi: number } {
  const out: Feature[] = [];
  for (const e of data.education) {
    const s = spanOf(e, data);
    if (s) out.push({ id: `edu-${e.id}`, kind: 'education', start: s.start, end: s.end, open: s.open, label: e.degree.split(' (')[0], item: e, lane: 0 });
  }
  for (const e of data.experiences) {
    const s = spanOf(e, data);
    if (s) out.push({ id: `role-${e.id}`, kind: e.kind, start: s.start, end: s.end, open: s.open, label: e.role.split(/\s[—–]\s/)[0], item: e, lane: 0 });
  }
  out.sort((a, b) => a.start - b.start || b.end - a.end);
  // greedy lanes: a feature goes to the first lane whose last feature ended before it starts
  const laneEnd: number[] = [];
  for (const f of out) {
    let lane = laneEnd.findIndex((e) => e <= f.start - 0.02);
    if (lane < 0) lane = laneEnd.length;
    laneEnd[lane] = f.end;
    f.lane = lane;
  }
  const lo = Math.floor(Math.min(...out.map((f) => f.start)));
  return { features: out, lo, hi: 2027 };
}
