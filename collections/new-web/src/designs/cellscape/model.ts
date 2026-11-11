import { allProjects, hash01, r2 } from '@/lib/derive';
import type { Certification, Education, Experience, LanguageSkill, Project, Publication, SiteData, SkillItem } from '@/lib/types';

export const populations = ['biology', 'software', 'laboratory', 'training', 'career', 'literature', 'other', 'identity'] as const;
export type Population = typeof populations[number];
export const kinds = ['project', 'skill', 'course', 'position', 'publication', 'education', 'language', 'profile'] as const;
export type Kind = typeof kinds[number];
type Base = { id: string; title: string; sub: string; search: string; year: number | null; population: Population };
export type RecordItem = Base & (
  | { kind: 'project'; source: Project }
  | { kind: 'position'; source: Experience }
  | { kind: 'publication'; source: Publication }
  | { kind: 'education'; source: Education }
  | { kind: 'skill'; source: SkillItem }
  | { kind: 'course'; source: Certification }
  | { kind: 'language'; source: LanguageSkill }
  | { kind: 'profile'; source: SiteData['person'] }
);
type WithoutSearch<T> = T extends { search: string } ? Omit<T, 'search'> : never;

export const kindColor: Record<Kind, string> = {
  project: '#2246e7', skill: '#5c79f1', position: '#f36d62', publication: '#8254bb',
  education: '#c65b54', course: '#8dab29', language: '#527388', profile: '#112275',
};
export const cluster: Record<Population, { x: number; y: number; rx: number; ry: number; hue: string; label: [number, number] }> = {
  biology: { x: 284, y: 172, rx: 150, ry: 100, hue: '#2b4bea', label: [159, 59] },
  software: { x: 622, y: 151, rx: 155, ry: 94, hue: '#2b4bea', label: [520, 49] },
  laboratory: { x: 491, y: 351, rx: 106, ry: 89, hue: '#447bd6', label: [404, 453] },
  training: { x: 727, y: 389, rx: 142, ry: 106, hue: '#9eb439', label: [642, 514] },
  career: { x: 243, y: 415, rx: 104, ry: 73, hue: '#f36d62', label: [161, 505] },
  literature: { x: 385, y: 281, rx: 46, ry: 31, hue: '#a278dc', label: [350, 320] },
  other: { x: 820, y: 249, rx: 65, ry: 40, hue: '#7796ee', label: [784, 298] },
  identity: { x: 123, y: 276, rx: 48, ry: 42, hue: '#55768b', label: [68, 334] },
};

export function indexPortfolio(data: SiteData, profileLabel: string) {
  const out: RecordItem[] = [];
  const add = (entry: WithoutSearch<RecordItem>, search: unknown[]) => {
    const item = { ...entry, search: [entry.title, entry.sub, ...search].filter(Boolean).join(' ').normalize('NFKC').toLocaleLowerCase(data.locale) } as RecordItem;
    out.push(item);
  };
  for (const p of allProjects(data)) add({ id: `project:${p.id}`, kind: 'project', title: p.title, sub: p.tags.join(' · '), year: null, population: p.category === 'biotech' ? 'laboratory' : p.category === 'software' || p.category === 'ml' ? 'software' : 'biology', source: p }, [p.description, p.category, p.metric]);
  for (const p of data.experiences) add({ id: `position:${p.id}`, kind: 'position', title: p.role, sub: p.org, year: p.startYear, population: 'career', source: p }, [p.location, p.period, p.kind, p.description]);
  for (const p of data.publications) add({ id: `publication:${p.id}`, kind: 'publication', title: p.title, sub: p.venue ?? p.publisher ?? p.type, year: p.year, population: 'literature', source: p }, [p.authors.join(' '), p.doi, p.isbn, p.year, p.status, p.type]);
  for (const p of data.education) add({ id: `education:${p.id}`, kind: 'education', title: p.degree, sub: p.institution, year: p.startYear, population: 'career', source: p }, [p.period, p.location, p.gpa]);
  for (const c of data.skills) for (const g of c.groups) for (const [i, p] of g.items.entries()) {
    const domain = data.domains.find((d) => d.groupLabels.includes(g.label))?.id;
    const population = domain && ['singlecell', 'genomics', 'systems', 'structural'].includes(domain) ? 'biology'
      : domain && ['ml', 'software', 'data', 'devops'].includes(domain) ? 'software'
        : domain && ['wetlab', 'bioprocess'].includes(domain) ? 'laboratory'
          : /bioinformatic|biology|genom|omic|molecular/i.test(`${g.key} ${c.key}`) ? 'biology'
            : /lab|experiment|bioengineering/i.test(`${g.key} ${c.key}`) ? 'laboratory'
              : /data|software|computer|programming|tool/i.test(`${g.key} ${c.key}`) ? 'software' : 'other';
    add({ id: `skill:${c.id}:${g.id}:${p.key}:${i}`, kind: 'skill', title: p.name, sub: g.label, year: null, population, source: p }, [p.long, c.label, g.key]);
  }
  for (const [i, p] of data.certifications.entries()) add({ id: `course:${i}`, kind: 'course', title: p.name, sub: p.issuer, year: p.year, population: 'training', source: p }, [p.date, p.year]);
  for (const p of data.languages) add({ id: `language:${p.id}`, kind: 'language', title: p.name, sub: p.level, year: null, population: 'identity', source: p }, [p.cefr, p.cert?.test]);
  const p = data.person;
  add({ id: 'profile', kind: 'profile', title: p.displayName, sub: profileLabel, year: null, population: 'identity', source: p }, [p.fullName, p.headline, p.statement, p.intro, p.about.join(' '), p.location, p.email]);
  return out;
}

export type MapPoint = { item: RecordItem; x: number; y: number; r: number };
export const mapWidth = 940;
export const mapHeight = 550;

/** Editorial grouping only. Placement within each population is deterministic spacing. */
export function clusterPoints(records: RecordItem[]): MapPoint[] {
  return populations.flatMap((id) => {
    const rows = records.filter((r) => r.population === id);
    const c = cluster[id];
    return rows.map((item, i) => {
      const a = i * 2.39996323 + hash01(id) * Math.PI * 2;
      const d = Math.sqrt((i + 0.7) / Math.max(rows.length, 3)) * (0.79 + 0.17 * hash01(item.id, 2));
      const wave = 1 + Math.sin(a * 3 + 2) * 0.12 + Math.cos(a * 2) * 0.1;
      return { item, x: r2(c.x + Math.cos(a) * c.rx * d * wave), y: r2(c.y + Math.sin(a) * c.ry * d * wave), r: pointSize(item) };
    });
  });
}

function pointSize(item: RecordItem) {
  if (item.kind === 'profile') return 8;
  if (item.kind === 'project' && item.source.featured) return 5.7;
  if (['publication', 'education', 'position', 'language'].includes(item.kind)) return 5.6;
  return r2(2.9 + hash01(item.id, 1) * 1.7);
}

export const dateTicks = (records: RecordItem[]) => [...new Set(records.flatMap((item) => item.year == null ? [] : [item.year]))].sort((a, b) => a - b);

export function chronologyPoints(records: RecordItem[], years: number[]): MapPoint[] {
  const lanes = new Map<string, number>();
  return records.map((item) => {
    const lane = kinds.indexOf(item.kind);
    const index = item.year == null ? years.length : years.indexOf(item.year);
    const key = `${lane}:${index}`;
    const n = lanes.get(key) ?? 0;
    lanes.set(key, n + 1);
    const x = 143 + index * (645 / Math.max(1, years.length));
    const y = 88 + lane * 51;
    return { item, x: r2(x + (n ? 21 * (hash01(item.id) - 0.5) : 0)), y: r2(y + (n ? 38 * (hash01(item.id, 3) - 0.5) : 0)), r: item.year == null ? Math.min(3.5, pointSize(item)) : pointSize(item) };
  });
}
