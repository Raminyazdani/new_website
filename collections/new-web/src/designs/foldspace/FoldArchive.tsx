'use client';

import { ArrowDownLeft, ArrowUpRight, Search } from 'lucide-react';
import { useRef, useState, type ReactNode } from 'react';
import { useTranslations } from 'next-intl';
import { Authors } from '@/components/kit/Authors';
import { Dialog } from '@/components/kit/Dialog';
import { CopyButton } from '@/components/shared/CopyButton';
import { ProfilePhoto } from '@/components/shared/ProfilePhoto';
import { allProjects } from '@/lib/derive';
import { fmtNum, fmtYear, publicationLabel } from '@/lib/format';
import type { Certification, Education, Experience, LanguageSkill, Project, Publication, SiteData, SkillItem } from '@/lib/types';
import type { FoldStrings } from './strings';

export const archiveKinds = ['project', 'role', 'study', 'paper', 'skill', 'course', 'language', 'profile'] as const;
export type ArchiveKind = typeof archiveKinds[number];
type ArchiveBase = { id: string; title: string; sub: string; find: string };
type ArchiveEntry = ArchiveBase & (
  { kind: 'project'; source: Project } | { kind: 'role'; source: Experience } | { kind: 'study'; source: Education } |
  { kind: 'paper'; source: Publication } | { kind: 'skill'; source: SkillItem } | { kind: 'course'; source: Certification } |
  { kind: 'language'; source: LanguageSkill } | { kind: 'profile'; source: SiteData['person'] }
);

export function archiveEntries(data: SiteData): ArchiveEntry[] {
  const rows: ArchiveEntry[] = [];
  for (const source of allProjects(data)) rows.push({ kind: 'project', id: `project:${source.id}`, title: source.title, sub: source.tags.join(' · '), find: `${source.description} ${source.category} ${source.metric ?? ''}`, source });
  for (const source of data.experiences) rows.push({ kind: 'role', id: `role:${source.id}`, title: source.role, sub: source.org, find: `${source.description} ${source.period} ${source.location}`, source });
  for (const source of data.education) rows.push({ kind: 'study', id: `study:${source.id}`, title: source.degree, sub: source.institution, find: `${source.period} ${source.location}`, source });
  for (const source of data.publications) rows.push({ kind: 'paper', id: `paper:${source.id}`, title: source.title, sub: [source.venue, source.publisher].filter(Boolean).filter((a, i, list) => i === list.indexOf(a)).join(' · '), find: `${source.authors.join(' ')} ${source.year ?? ''} ${source.type} ${source.status} ${source.doi ?? ''}`, source });
  for (const c of data.skills) for (const g of c.groups) for (const [i, source] of g.items.entries()) rows.push({ kind: 'skill', id: `skill:${c.id}:${g.id}:${i}`, title: source.name, sub: g.label, find: `${source.long} ${c.label}`, source });
  for (const [i, source] of data.certifications.entries()) rows.push({ kind: 'course', id: `course:${i}`, title: source.name, sub: source.issuer, find: `${source.date ?? ''} ${source.year ?? ''}`, source });
  for (const source of data.languages) rows.push({ kind: 'language', id: `language:${source.id}`, title: source.name, sub: source.level, find: `${source.cefr ?? ''} ${source.cert?.test ?? ''}`, source });
  const source = data.person;
  rows.push({ kind: 'profile', id: 'profile', title: source.displayName, sub: source.headline, find: `${source.fullName} ${source.about.join(' ')} ${source.email} ${source.location}`, source });
  return rows;
}

function LinkOut({ href, children }: { href: string | null | undefined; children: ReactNode }) {
  if (!href) return null;
  return <a className="fld-archive-link" href={href} target={href.startsWith('mailto:') ? undefined : '_blank'} rel={href.startsWith('mailto:') ? undefined : 'noreferrer'}>{children}<ArrowUpRight size={15} aria-hidden /></a>;
}

function Detail({ entry, data, s }: { entry: ArchiveEntry; data: SiteData; s: FoldStrings }) {
  const t = useTranslations();
  const num = (n: number) => fmtNum(data.locale, n);
  const field = (key: string, value: ReactNode) => value !== null && value !== undefined && value !== '' && value !== false ? <div key={key}><dt>{key}</dt><dd>{value}</dd></div> : null;
  switch (entry.kind) {
    case 'project': {
      const p = entry.source;
      const repo = p.repo ? `https://github.com/${p.repo}` : null;
      return <><p>{p.description}</p>{p.metric && <blockquote>{p.metric}</blockquote>}<dl>{field(s.methods, p.tags.join(' · '))}</dl><div className="fld-archive-links"><LinkOut href={repo}>{t('common.code')}</LinkOut>{p.url?.replace(/\/$/, '') !== repo && <LinkOut href={p.url}>{t('common.visit')}</LinkOut>}</div></>;
    }
    case 'role': {
      const p = entry.source;
      return <><p>{p.description}</p><dl>{field(s.sequence, p.period)}{field(t('common.location'), p.location)}{field(s.current, p.current && t('common.current'))}</dl></>;
    }
    case 'study': {
      const p = entry.source;
      return <dl>{field(s.sequence, p.period)}{field(t('common.location'), p.location)}{field(t('common.gpa'), p.gpa)}{field(s.current, p.current && t('common.current'))}</dl>;
    }
    case 'paper': {
      const p = entry.source;
      return <><p><Authors p={p} ownerName={data.person.fullName} etAl="et al." /></p><dl>
        {field(s.paper, publicationLabel(t, 'pubType', p.type))}{field(t('common.status'), publicationLabel(t, 'pubStatus', p.status))}{field(s.sequence, p.year != null ? fmtYear(data.locale, p.year) : null)}
        {field(t('common.doi'), p.doi)}{field(t('common.isbn'), p.isbn)}{field(t('common.supervisors'), p.supervisors?.join(' · '))}</dl>
        <div className="fld-archive-links"><LinkOut href={p.url}>{t('common.visit')}</LinkOut>{p.bibtex && <CopyButton value={p.bibtex} className="fld-archive-link">{t('common.copyBibtex')}</CopyButton>}</div></>;
    }
    case 'skill': return entry.source.long !== entry.title ? <p>{entry.source.long}</p> : null;
    case 'course': {
      const p = entry.source;
      return <><dl>{field(s.sequence, p.date)}{field(s.hours, p.hours != null ? num(p.hours) : null)}{field(s.weeks, p.weeks != null ? num(p.weeks) : null)}{field(t('common.status'), p.certificate && t('common.certificate'))}</dl><LinkOut href={p.url}>{t('common.certificateLink')}</LinkOut></>;
    }
    case 'language': {
      const p = entry.source;
      return <><dl>{field('CEFR', p.cefr)}{p.cert && field(p.cert.test, `${num(p.cert.overall)} / ${num(p.cert.max)}`)}{field(s.sequence, p.cert?.date)}{p.cert && Object.entries(p.cert.bands).map(([key, value]) => field(s[key as 'reading' | 'listening' | 'writing' | 'speaking'], num(value)))}</dl><LinkOut href={p.cert?.url}>{t('common.certificateLink')}</LinkOut></>;
    }
    case 'profile': {
      const p = entry.source;
      const brief = [...new Set([p.tagline, p.intro, p.statement, ...p.about])].filter((x) => x && x !== p.headline);
      return <><ProfilePhoto src={p.photo} alt={p.displayName} className="fld-archive-photo" size={256} />{brief.map((x, i) => <p key={i}>{x}</p>)}
        <dl>{field(t('common.location'), p.location)}{field(t('common.status'), p.status || p.availability)}{field(t('common.email'), p.email)}</dl>
        {p.availability && p.status && p.availability !== p.status && <p>{p.availability}</p>}
        {data.journey.length > 0 && <><h4>{t('sections.journey.title')}</h4><dl>{data.journey.map((x) => field(x.city, x.period))}</dl></>}
        <div className="fld-archive-links"><LinkOut href={data.links.email}>{t('common.email')}</LinkOut>{p.email && <CopyButton value={p.email} className="fld-archive-link" />}<LinkOut href={data.links.github}>GitHub</LinkOut><LinkOut href={data.links.linkedin}>LinkedIn</LinkOut><LinkOut href={data.links.orcid}>ORCID</LinkOut><LinkOut href={data.links.scholar}>Scholar</LinkOut><LinkOut href={data.links.website}>{t('common.visit')}</LinkOut></div></>;
    }
  }
}

export type ArchiveTarget = { kind?: ArchiveKind; id?: string };
export function FoldArchive({ data, rows, target, s, onClose }: { data: SiteData; rows: ArchiveEntry[]; target: ArchiveTarget; s: FoldStrings; onClose: () => void }) {
  const [kind, setKind] = useState<ArchiveKind | 'all'>(target.kind ?? 'all');
  const [query, setQuery] = useState('');
  const [id, setId] = useState(target.id);
  const title = useRef<HTMLHeadingElement>(null);
  const search = useRef<HTMLInputElement>(null);
  const item = rows.find((r) => r.id === id);
  const terms = query.toLocaleLowerCase(data.locale).normalize('NFKC').trim().split(/\s+/).filter(Boolean);
  const results = rows.filter((r) => (kind === 'all' || r.kind === kind) && terms.every((term) => `${r.title} ${r.sub} ${r.find}`.toLocaleLowerCase(data.locale).normalize('NFKC').includes(term)));
  return <Dialog open onClose={onClose} title={s.archive} className="fld-dialog" overlayClassName="fld-dialog-overlay" closeClassName="fld-dialog-close">
    {item ? <div className="fld-archive-detail">
      <button className="fld-archive-back" type="button" onClick={() => { setId(undefined); requestAnimationFrame(() => search.current?.focus()); }}><ArrowDownLeft size={15} aria-hidden />{s.back}</button>
      <span className="fld-eyebrow">{s[item.kind]}</span><h3 ref={title} tabIndex={-1} dir="auto">{item.title}</h3>{item.sub && <p className="fld-record-sub" dir="auto">{item.sub}</p>}
      <Detail entry={item} data={data} s={s} />
    </div> : <div className="fld-archive-index">
      <label className="fld-archive-search"><Search size={17} aria-hidden /><input ref={search} type="search" placeholder={s.search} aria-label={s.search} value={query} onChange={(e) => setQuery(e.target.value)} /></label>
      <div className="fld-archive-tabs" role="group" aria-label={s.archive}>{(['all', ...archiveKinds] as const).map((k) => <button key={k} type="button" aria-pressed={kind === k} onClick={() => setKind(k)}>{s[k]}</button>)}</div>
      <p className="sr-only" role="status">{fmtNum(data.locale, results.length)} {s.details}</p>
      {results.length ? <ul className="fld-archive-list">{results.map((row) => <li key={row.id}><button type="button" onClick={() => { setId(row.id); requestAnimationFrame(() => title.current?.focus()); }}>
        <span dir="auto"><strong>{row.title}</strong><small>{row.sub || s[row.kind]}</small></span><ArrowUpRight size={17} aria-hidden />
      </button></li>)}</ul> : <p className="fld-archive-empty">{s.empty}</p>}
    </div>}
  </Dialog>;
}
