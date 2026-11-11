import type { Project } from '@/lib/types';

export const normalizeTag = (s: string) => s.normalize('NFKC').trim().toLocaleLowerCase('en');
export const tagsOf = (p: Project) => [...new Set(p.tags.map(normalizeTag).filter(Boolean))];

export function topicIndex(projects: Project[]) {
  const tags = new Map<string, { key: string; label: string; count: number }>();
  for (const p of projects) for (const key of tagsOf(p)) {
    const found = tags.get(key);
    if (found) found.count++;
    else tags.set(key, { key, label: p.tags.find((t) => normalizeTag(t) === key)!, count: 1 });
  }
  return [...tags.values()].sort((a, b) => b.count - a.count || a.key.localeCompare(b.key));
}

export function sharedTags(a: Project, b: Project) {
  const other = new Set(tagsOf(b));
  return [...new Set(a.tags)].filter((tag) => other.has(normalizeTag(tag))).filter((tag, i, list) => list.findIndex((v) => normalizeTag(v) === normalizeTag(tag)) === i);
}

export type RelationMode = 'tags' | 'text' | 'shared';
export function topicRelation(project: Project, topic: string, mode: 'tags' | 'text') {
  const key = normalizeTag(topic);
  return mode === 'tags' ? tagsOf(project).includes(key) : normalizeTag(`${project.title}\n${project.description}`).includes(key);
}
