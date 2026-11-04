'use client';

import { useEffect, useMemo, useRef, useState, type KeyboardEvent } from 'react';
import { useTranslations } from 'next-intl';
import { allProjects, skillIndex } from '@/lib/derive';
import type { SiteData } from '@/lib/types';
import { APPS, isAppId, type AppId } from '../apps';
import { fold } from './ui';

export interface TermApi {
  open: (app: AppId, id?: string) => void;
  theme: (t: 'light' | 'dark') => void;
  lang: (l: 'en' | 'de' | 'fa') => void;
  doc: () => void;
}

interface Line {
  id: number;
  kind: 'in' | 'out' | 'err' | 'dim';
  text: string;
  href?: string;
}

const COMMANDS = ['help', 'whoami', 'about', 'ls', 'open', 'cat', 'find', 'skills', 'contact', 'lang', 'theme', 'doc', 'date', 'history', 'echo', 'clear'] as const;
const LS_WHAT = ['apps', 'projects', 'roles', 'skills', 'courses', 'papers'];

/** A small shell over the CV. Commands are English (like any shell); answers are in the page language. */
export function Terminal({ data, api }: { data: SiteData; api: TermApi }) {
  const t = useTranslations('desktop.term');
  const ta = useTranslations('desktop.apps');
  const [lines, setLines] = useState<Line[]>(() => [{ id: 0, kind: 'dim', text: t('welcome') }]);
  const [value, setValue] = useState('');
  const [hist, setHist] = useState<string[]>([]);
  const [hpos, setHpos] = useState<number | null>(null);
  const seq = useRef(1);
  const input = useRef<HTMLInputElement>(null);
  const log = useRef<HTMLDivElement>(null);
  const projects = useMemo(() => allProjects(data), [data]);
  const skills = useMemo(() => skillIndex(data), [data]);

  useEffect(() => {
    log.current?.scrollTo({ top: log.current.scrollHeight });
  }, [lines]);

  const run = (raw: string) => {
    const out: Array<Omit<Line, 'id'>> = [{ kind: 'in', text: raw }];
    const say = (text: string, kind: Line['kind'] = 'out', href?: string) => out.push({ kind, text, href });
    const [cmd = '', ...args] = raw.trim().split(/\s+/);
    const arg = args.join(' ');
    switch (cmd) {
      case '':
        break;
      case 'help':
        COMMANDS.forEach((c) => say(`${c.padEnd(9)} ${t(`help.${c}`)}`));
        break;
      case 'whoami':
        say(`${data.person.displayName} — ${data.person.headline}`);
        say(`${data.person.status} · ${data.person.location}`, 'dim');
        break;
      case 'about':
        say(data.person.intro);
        break;
      case 'ls': {
        const what = args[0] ?? 'apps';
        if (what === 'apps') APPS.forEach((a) => say(`${a.id.padEnd(11)} ${ta(a.id)}`));
        else if (what === 'projects') projects.forEach((p) => say(`${p.id}  ${p.title}`));
        else if (what === 'roles') data.experiences.forEach((e) => say(`${(e.period || '—').padEnd(22)} ${e.role} — ${e.org}`));
        else if (what === 'skills') data.skills.forEach((c, i) => say(`${String(i + 1).padStart(2)}  ${c.label} (${c.groups.reduce((s, g) => s + g.items.length, 0)})`));
        else if (what === 'courses') data.certifications.forEach((c) => say(`${String(c.year ?? '—').padEnd(5)} ${c.name} — ${c.issuer}`));
        else if (what === 'papers') data.publications.forEach((p) => say(`${String(p.year ?? '—').padEnd(5)} ${p.title}`));
        else say(t('lsUsage', { list: LS_WHAT.join(' | ') }), 'err');
        break;
      }
      case 'open': {
        if (!arg) say(t('openUsage'), 'err');
        else if (isAppId(arg)) {
          say(t('opening', { name: ta(arg) }), 'dim');
          api.open(arg);
        } else {
          const p = projects.find((x) => x.id === arg);
          if (p) {
            say(t('opening', { name: p.title }), 'dim');
            api.open('projects', p.id);
          } else say(t('notFound', { name: arg }), 'err');
        }
        break;
      }
      case 'cat': {
        const p = projects.find((x) => x.id === arg);
        if (!p) {
          say(arg ? t('notFound', { name: arg }) : t('catUsage'), 'err');
          break;
        }
        say(p.title);
        say(p.description);
        if (p.metric) say(p.metric);
        say(`# ${p.tags.join(' · ')}`, 'dim');
        if (p.url) say(p.url, 'out', p.url);
        break;
      }
      case 'find': {
        const k = fold(arg);
        if (!k) {
          say(t('findUsage'), 'err');
          break;
        }
        const hits = [
          ...projects.filter((p) => fold(`${p.title} ${p.tags.join(' ')}`).includes(k)).map((p) => `project  ${p.title}`),
          ...data.experiences.filter((e) => fold(`${e.role} ${e.org}`).includes(k)).map((e) => `role     ${e.role} — ${e.org}`),
          ...skills.filter((s) => fold(`${s.name} ${s.long}`).includes(k)).map((s) => `skill    ${s.name} (${s.groupLabel})`),
          ...data.certifications.filter((c) => fold(`${c.name} ${c.issuer}`).includes(k)).map((c) => `course   ${c.name}`),
        ];
        if (!hits.length) say(t('noHits', { q: arg }), 'dim');
        hits.slice(0, 40).forEach((h) => say(h));
        if (hits.length > 40) say(t('more', { count: hits.length - 40 }), 'dim');
        break;
      }
      case 'skills': {
        if (!arg) {
          data.skills.forEach((c, i) => say(`${String(i + 1).padStart(2)}  ${c.label}`));
          say(t('skillsUsage'), 'dim');
          break;
        }
        const c = data.skills[Number(arg) - 1] ?? data.skills.find((x) => x.id === arg);
        if (!c) {
          say(t('notFound', { name: arg }), 'err');
          break;
        }
        c.groups.forEach((g) => say(`${g.label}: ${g.items.map((i) => i.name).join(', ')}`));
        break;
      }
      case 'contact':
        say(data.person.email, 'out', data.links.email);
        (['github', 'linkedin', 'orcid', 'scholar', 'website'] as const).forEach((k) => data.links[k] && say(data.links[k]!, 'out', data.links[k]!));
        break;
      case 'lang':
        if (arg === 'en' || arg === 'de' || arg === 'fa') api.lang(arg);
        else say(t('langUsage'), 'err');
        break;
      case 'theme':
        if (arg === 'light' || arg === 'dark') {
          api.theme(arg);
          say(t('themeSet', { theme: arg }), 'dim');
        } else say(t('themeUsage'), 'err');
        break;
      case 'doc':
        api.doc();
        break;
      case 'date':
        say(new Date().toLocaleString(data.locale === 'fa' ? 'fa-IR' : data.locale === 'de' ? 'de-DE' : 'en-GB'));
        break;
      case 'history':
        hist.forEach((h, i) => say(`${String(i + 1).padStart(3)}  ${h}`));
        break;
      case 'echo':
        say(arg);
        break;
      case 'clear':
        setLines([]);
        return;
      default:
        say(t('unknown', { cmd }), 'err');
    }
    setLines((prev) => [...prev, ...out.map((l) => ({ ...l, id: seq.current++ }))].slice(-500));
  };

  const complete = () => {
    const parts = value.split(/\s+/);
    if (parts.length === 1) {
      const m = COMMANDS.filter((c) => c.startsWith(parts[0]));
      if (m.length === 1) setValue(`${m[0]} `);
      else if (m.length > 1) setLines((prev) => [...prev, { id: seq.current++, kind: 'dim', text: m.join('  ') }]);
      return;
    }
    const pool =
      parts[0] === 'open' || parts[0] === 'cat'
        ? [...APPS.map((a) => a.id as string), ...projects.map((p) => p.id)]
        : parts[0] === 'ls'
          ? LS_WHAT
          : parts[0] === 'lang'
            ? ['en', 'de', 'fa']
            : parts[0] === 'theme'
              ? ['light', 'dark']
              : [];
    const last = parts[parts.length - 1];
    const m = pool.filter((x) => x.startsWith(last));
    if (m.length === 1) setValue([...parts.slice(0, -1), m[0]].join(' '));
    else if (m.length > 1) setLines((prev) => [...prev, { id: seq.current++, kind: 'dim', text: m.slice(0, 30).join('  ') }]);
  };

  const onKey = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (value.trim()) setHist((h) => [...h, value.trim()].slice(-100));
      setHpos(null);
      run(value);
      setValue('');
    } else if (e.key === 'Tab' && value.trim()) {
      e.preventDefault();
      complete();
    } else if (e.key === 'ArrowUp' || e.key === 'ArrowDown') {
      if (!hist.length) return;
      e.preventDefault();
      const next = hpos === null ? (e.key === 'ArrowUp' ? hist.length - 1 : null) : hpos + (e.key === 'ArrowUp' ? -1 : 1);
      if (next === null || next >= hist.length) {
        setHpos(null);
        setValue('');
      } else {
        const k = Math.max(0, next);
        setHpos(k);
        setValue(hist[k]);
      }
    } else if (e.key === 'Escape' && value) {
      e.stopPropagation();
      setValue('');
    } else if (e.key === 'l' && e.ctrlKey) {
      e.preventDefault();
      setLines([]);
    }
  };

  return (
    <div className="dt-term" dir="ltr" lang="en" onClick={() => window.getSelection()?.isCollapsed && input.current?.focus()}>
      <div ref={log} className="dt-term-log" role="log" aria-live="polite" aria-label={t('log')}>
        {lines.map((l) => (
          <div key={l.id} className={`dt-term-${l.kind}`} dir="auto" lang={l.kind === 'in' ? 'en' : data.locale}>
            {l.kind === 'in' && <span className="dt-term-prompt">portfolio@desktop:~$ </span>}
            {l.href ? (
              <a href={l.href} target={l.href.startsWith('mailto:') ? undefined : '_blank'} rel="noreferrer">
                {l.text}
              </a>
            ) : (
              l.text
            )}
          </div>
        ))}
      </div>
      <label className="dt-term-line">
        <span className="dt-term-prompt" aria-hidden>
          portfolio@desktop:~$
        </span>
        <span className="sr-only">{t('input')}</span>
        <input
          ref={input}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={onKey}
          spellCheck={false}
          autoCapitalize="off"
          autoComplete="off"
          autoCorrect="off"
          enterKeyHint="send"
        />
      </label>
    </div>
  );
}
