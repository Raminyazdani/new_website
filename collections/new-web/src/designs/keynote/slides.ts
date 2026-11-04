import type { Certification, Education, Experience, Project, SiteData } from '@/lib/types';

/* The deck, generated from the CV. Every slide carries its chapter and enough data to render
   itself and its presenter notes; nothing here is invented. */
export type Chapter = 'intro' | 'about' | 'education' | 'experience' | 'projects' | 'publications' | 'skills' | 'courses' | 'languages' | 'contact';
export const CHAPTERS: Chapter[] = ['intro', 'about', 'education', 'experience', 'projects', 'publications', 'skills', 'courses', 'languages', 'contact'];

export type Slide =
  | { kind: 'title'; chapter: 'intro' }
  | { kind: 'agenda'; chapter: 'intro' }
  | { kind: 'about'; chapter: 'about'; part: number; paras: string[] }
  | { kind: 'stats'; chapter: 'about' }
  | { kind: 'journey'; chapter: 'about' }
  | { kind: 'education'; chapter: 'education'; item: Education; index: number }
  | { kind: 'role'; chapter: 'experience'; item: Experience; index: number }
  | { kind: 'project'; chapter: 'projects'; item: Project; index: number }
  | { kind: 'grid'; chapter: 'projects'; items: Project[]; part: number; parts: number; archive: boolean }
  | { kind: 'publications'; chapter: 'publications' }
  | { kind: 'skills'; chapter: 'skills'; categoryId: string }
  | { kind: 'courses'; chapter: 'courses'; items: Certification[]; part: number; parts: number; from: number }
  | { kind: 'languages'; chapter: 'languages' }
  | { kind: 'contact'; chapter: 'contact' }
  | { kind: 'thanks'; chapter: 'contact' };

const chunk = <T,>(arr: T[], size: number) => Array.from({ length: Math.ceil(arr.length / size) }, (_, i) => arr.slice(i * size, i * size + size));

export function buildDeck(data: SiteData): Slide[] {
  const s: Slide[] = [{ kind: 'title', chapter: 'intro' }, { kind: 'agenda', chapter: 'intro' }];
  const about = data.person.about;
  s.push({ kind: 'about', chapter: 'about', part: 0, paras: about.slice(0, 1) });
  s.push({ kind: 'about', chapter: 'about', part: 1, paras: about.slice(1) });
  s.push({ kind: 'stats', chapter: 'about' }, { kind: 'journey', chapter: 'about' });
  [...data.education].reverse().forEach((item, index) => s.push({ kind: 'education', chapter: 'education', item, index }));
  data.experiences.forEach((item, index) => s.push({ kind: 'role', chapter: 'experience', item, index }));
  const highlights = data.projects.filter((p) => p.highlight);
  highlights.forEach((item, index) => s.push({ kind: 'project', chapter: 'projects', item, index }));
  const rest = data.projects.filter((p) => !p.highlight);
  const g1 = chunk(rest, 6);
  g1.forEach((items, part) => s.push({ kind: 'grid', chapter: 'projects', items, part, parts: g1.length, archive: false }));
  const g2 = chunk(data.archive, 6);
  g2.forEach((items, part) => s.push({ kind: 'grid', chapter: 'projects', items, part, parts: g2.length, archive: true }));
  s.push({ kind: 'publications', chapter: 'publications' });
  data.skills.forEach((c) => s.push({ kind: 'skills', chapter: 'skills', categoryId: c.id }));
  const half = Math.ceil(data.certifications.length / 2);
  const c = chunk(data.certifications, half);
  c.forEach((items, part) => s.push({ kind: 'courses', chapter: 'courses', items, part, parts: c.length, from: part * half }));
  s.push({ kind: 'languages', chapter: 'languages' }, { kind: 'contact', chapter: 'contact' }, { kind: 'thanks', chapter: 'contact' });
  return s;
}

/** first slide index of each chapter (for the agenda and the progress marks) */
export function chapterStarts(deck: Slide[]) {
  const out = new Map<Chapter, number>();
  deck.forEach((d, i) => {
    if (!out.has(d.chapter)) out.set(d.chapter, i);
  });
  return out;
}
