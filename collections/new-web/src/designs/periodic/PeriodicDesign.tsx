'use client';

import { useEffect, useMemo, useRef, useState, type CSSProperties, type KeyboardEvent as RKeyboardEvent } from 'react';
import { useReducedMotion } from 'motion/react';
import { useTranslations } from 'next-intl';
import { ArrowLeft, ArrowRight, ArrowUpRight, Copy, Mail, Search } from 'lucide-react';
import { Authors } from '@/components/kit/Authors';
import { Dialog } from '@/components/kit/Dialog';
import { Expandable } from '@/components/kit/Expandable';
import { OrbitingCircles } from '@/components/magicui/orbiting-circles';
import { BrandIcon } from '@/components/shared/BrandIcon';
import { CopyButton } from '@/components/shared/CopyButton';
import { LocaleSwitcher } from '@/components/shared/LocaleSwitcher';
import { allProjects, projectDomains, projectSkills, r2, skillIndex, skillProjects, yearFrac, type FlatSkill } from '@/lib/derive';
import { dot, fmtNum, fmtYear, publicationLabel } from '@/lib/format';
import type { Project, SiteData } from '@/lib/types';
import { cn } from '@/lib/utils';
import { makeSymbols, tableSlots } from './table';
import './periodic.css';

type Fam = string; // skill-domain id or 'soft'

interface El {
  uid: string;
  key: string;
  name: string;
  long: string;
  symbol: string;
  n: number;
  family: Fam;
  hue: number;
  group: string;
  category: string;
  skill: FlatSkill | null;
}

const famStyle = (hue: number, soft = false) => ({ ['--h' as string]: String(hue), ['--c' as string]: soft ? '0.012' : '0.05' }) as CSSProperties;

/* ─────────────────────────────── tile ─────────────────────────────── */

function Tile({
  el,
  dim,
  active,
  style,
  onOpen,
  onKey,
  refCb,
  loc,
}: {
  el: El;
  dim: boolean;
  active: boolean;
  style?: CSSProperties;
  onOpen: () => void;
  onKey: (e: RKeyboardEvent) => void;
  refCb: (b: HTMLButtonElement | null) => void;
  loc: string;
}) {
  return (
    <button
      ref={refCb}
      type="button"
      tabIndex={active ? 0 : -1}
      onClick={onOpen}
      onKeyDown={onKey}
      aria-label={`${el.name} (${el.symbol}), ${el.group}`}
      className={cn('pt-tile group relative flex aspect-square flex-col rounded-[6px] border p-1.5 text-start transition', dim && 'pt-dim')}
      style={{ ...famStyle(el.hue, el.family === 'soft'), ...style }}
    >
      <span className="pt-mono text-[9px] leading-none text-[var(--pt-ink)]/70">{fmtNum(loc, el.n)}</span>
      <span className="pt-sym mx-auto my-auto text-[clamp(1rem,1.7vw,1.5rem)] font-bold leading-none" lang="en">
        {el.symbol}
      </span>
      <span className="line-clamp-2 text-center text-[8.5px] font-medium leading-[1.15] text-[var(--pt-ink)]" dir="auto">
        {el.name}
      </span>
    </button>
  );
}

/* ─────────────────────────────── design ─────────────────────────────── */

export default function PeriodicDesign({ data }: { data: SiteData }) {
  const t = useTranslations();
  const loc = data.locale;
  const rtl = data.dir === 'rtl';
  // the server cannot know the motion preference: render the motion version until mounted (no hydration mismatch)
  const rm = useReducedMotion();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  const reduce = mounted && !!rm;
  const projects = useMemo(() => allProjects(data), [data]);
  const skills = useMemo(() => skillIndex(data), [data]);

  // elements ordered by family (domain order), then CV order; soft skills form the detached series
  const { main, soft, bySkillUid } = useMemo(() => {
    const order = data.domains.map((d) => d.id);
    const hue = Object.fromEntries(data.domains.map((d) => [d.id, d.hue]));
    const sorted = [...skills].sort((a, b) => (order.indexOf(a.domain ?? '') + 1 || 99) - (order.indexOf(b.domain ?? '') + 1 || 99) || a.index - b.index);
    const symbols = makeSymbols([...sorted.map((s) => s.key), ...data.softSkills.map((s) => s.key)]);
    const main: El[] = sorted.map((s, i) => ({
      uid: s.uid,
      key: s.key,
      name: s.name,
      long: s.long,
      symbol: symbols[i],
      n: i + 1,
      family: s.domain ?? 'other',
      hue: hue[s.domain ?? ''] ?? 40,
      group: s.groupLabel,
      category: s.categoryLabel,
      skill: s,
    }));
    const soft: El[] = data.softSkills.map((s, i) => ({
      uid: `soft/${s.key}`,
      key: s.key,
      name: s.name,
      long: s.long,
      symbol: symbols[sorted.length + i],
      n: sorted.length + i + 1,
      family: 'soft',
      hue: 60,
      group: t('common.softSkills'),
      category: t('common.softSkills'),
      skill: null,
    }));
    return { main, soft, bySkillUid: new Map(main.map((e) => [e.uid, e])) };
  }, [skills, data.domains, data.softSkills, t]);

  const all = useMemo(() => [...main, ...soft], [main, soft]);
  const slots = useMemo(() => tableSlots(main.length), [main.length]);
  const lastRow = slots.at(-1)?.r ?? 1;

  const [q, setQ] = useState('');
  const [fam, setFam] = useState<Fam | null>(null);
  const [open, setOpen] = useState<El | null>(null);
  const [active, setActive] = useState(0);
  const btns = useRef<Array<HTMLButtonElement | null>>([]);

  const needle = q.trim().toLowerCase();
  const matches = (el: El) => (!fam || el.family === fam) && (!needle || `${el.name} ${el.long} ${el.symbol} ${el.key}`.toLowerCase().includes(needle));
  const matchCount = all.filter(matches).length;

  const families = [...data.domains.map((d) => ({ id: d.id, hue: d.hue, label: t(`domains.${d.id}`), count: main.filter((e) => e.family === d.id).length })), { id: 'soft', hue: 60, label: t('common.softSkills'), count: soft.length }];

  // roving tabindex over the visual grid (desktop silhouette) or the plain list (phones)
  const move = (i: number, e: RKeyboardEvent) => {
    const key = e.key;
    if (!['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Home', 'End'].includes(key)) return;
    e.preventDefault();
    const wide = window.innerWidth >= 1024;
    const horiz = (k: string) => (k === 'ArrowRight' ? (rtl ? -1 : 1) : k === 'ArrowLeft' ? (rtl ? 1 : -1) : 0);
    let next = i;
    if (key === 'Home') next = 0;
    else if (key === 'End') next = all.length - 1;
    else if (!wide || i >= main.length) {
      const cols = wide ? soft.length : 6;
      next = i + horiz(key) + (key === 'ArrowDown' ? cols : key === 'ArrowUp' ? -cols : 0);
    } else {
      const s = slots[i];
      if (horiz(key)) next = slots.findIndex((x) => x.r === s.r && x.c === s.c + horiz(key));
      else {
        const dr = key === 'ArrowDown' ? 1 : -1;
        let best = -1;
        for (let r = s.r + dr; r >= 1 && r <= lastRow && best < 0; r += dr) {
          const row = slots.map((x, k) => ({ x, k })).filter((o) => o.x.r === r);
          if (row.length) best = row.reduce((a, b) => (Math.abs(b.x.c - s.c) < Math.abs(a.x.c - s.c) ? b : a)).k;
        }
        next = best >= 0 ? best : key === 'ArrowDown' ? main.length : i;
      }
    }
    if (next < 0 || next >= all.length) return;
    setActive(next);
    btns.current[next]?.focus();
  };

  const symOf = (s: FlatSkill) => bySkillUid.get(s.uid)?.symbol;
  const famSymbol = (d: string) => cnSym(d);

  const sections = ['table', 'compounds', 'reactions', 'isotopes', 'spectrum', 'reference', 'bond'] as const;
  const p = data.person;
  const repos = data.stats.find((s) => s.id === 'repos')?.value ?? 0;
  const hours = data.certStats.hours;

  return (
    <div className="periodic-root min-h-dvh">
      {/* header */}
      <header className="sticky top-0 z-40 border-b border-[var(--pt-line)] bg-[var(--pt-paper)]/90 backdrop-blur">
        <div className="mx-auto flex h-14 max-w-[1400px] items-center gap-4 px-4 sm:px-6">
          <a href="#top" className="flex items-center gap-2.5">
            <span className="pt-tile grid size-9 place-items-center rounded-[5px] border text-[15px] font-bold" style={famStyle(20)} lang="en">
              Ry
            </span>
            <span className="hidden font-semibold sm:inline">{p.displayName}</span>
          </a>
          <nav aria-label={t('nav.menu')} className="ms-auto hidden gap-1 text-[14px] lg:flex">
            {sections.map((s) => (
              <a key={s} href={`#${s}`} className="rounded-full px-3 py-1.5 hover:bg-[var(--pt-card)]">
                {t(`periodic.nav.${s}`)}
              </a>
            ))}
          </nav>
          <LocaleSwitcher
            className="ms-auto rounded-full border border-[var(--pt-line)] p-0.5 lg:ms-2"
            itemClassName="h-8 min-w-8 rounded-full px-2 text-xs font-semibold"
            activeClassName="bg-[var(--pt-ink)] text-[var(--pt-paper)]"
          />
        </div>
      </header>

      <main className="mx-auto max-w-[1400px] px-4 sm:px-6">
        {/* hero: element Ry */}
        <section id="top" className="grid items-center gap-10 py-14 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] lg:py-20">
          <div>
            <p className="pt-mono text-[13px] text-[var(--pt-accent)]">{t('periodic.kicker')}</p>
            <h1 className="pt-display mt-3 text-[clamp(2.6rem,6vw,5rem)] font-extrabold leading-[0.95]">{p.displayName}</h1>
            <p className="mt-4 text-[clamp(1.1rem,1.8vw,1.4rem)] font-medium">{p.headline}</p>
            <p className="mt-4 max-w-xl text-[16.5px] leading-relaxed text-[var(--pt-muted)]">{p.statement}</p>
            <div className="mt-7 flex flex-wrap gap-3">
              <a href="#table" className="rounded-full bg-[var(--pt-ink)] px-5 py-2.5 text-sm font-semibold text-[var(--pt-paper)] hover:bg-[var(--pt-accent)]">
                {t('periodic.ctaTable')}
              </a>
              <a href={data.links.email} className="inline-flex items-center gap-2 rounded-full border border-[var(--pt-ink)] px-5 py-2.5 text-sm font-semibold hover:bg-[var(--pt-card)]">
                <Mail className="size-4" /> {t('common.sendEmail')}
              </a>
            </div>
            <p className="mt-6 max-w-xl text-[13px] text-[var(--pt-muted)]">{t('periodic.metaphorNote', { repos, hours })}</p>
          </div>
          <div className="relative mx-auto grid aspect-square w-full max-w-[460px] place-items-center">
            {!reduce && (
              <div aria-hidden className="absolute inset-0 hidden items-center justify-center sm:flex">
                <OrbitingCircles radius={222} iconSize={14} speed={0.6} path className="text-[var(--pt-accent)]">
                  {Array.from({ length: 2 }, (_, i) => (
                    <span key={i} className="block size-3.5 rounded-full bg-[var(--pt-accent)]" />
                  ))}
                </OrbitingCircles>
                <OrbitingCircles radius={176} iconSize={12} speed={0.9} reverse path>
                  {Array.from({ length: 8 }, (_, i) => (
                    <span key={i} className="block size-3 rounded-full bg-[var(--pt-ink)]" />
                  ))}
                </OrbitingCircles>
              </div>
            )}
            <div className="pt-tile relative z-10 flex aspect-square w-[min(62vw,240px)] flex-col rounded-[14px] border-2 p-4 shadow-[0_24px_60px_-30px_rgb(22_23_27/0.45)]" style={famStyle(20)}>
              <div className="pt-mono flex justify-between text-[13px]" dir="ltr">
                <span>
                  <span className="text-[var(--pt-muted)]">Z</span> {fmtNum(loc, repos)}
                </span>
                <span>{fmtNum(loc, hours, { minimumFractionDigits: 1, maximumFractionDigits: 1, useGrouping: false })}</span>
              </div>
              <span className="pt-sym m-auto text-[clamp(4rem,14vw,6.5rem)] font-extrabold leading-none" lang="en">
                Ry
              </span>
              <span className="text-center text-[14px] font-semibold leading-tight">{p.displayName}</span>
              <span className="mt-0.5 text-center text-[11px] text-[var(--pt-muted)]">{p.status}</span>
            </div>
          </div>
        </section>

        {/* periodic table */}
        <section id="table" className="scroll-mt-16 py-10">
          <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
            <div>
              <h2 className="pt-display text-[clamp(1.9rem,3.6vw,3rem)] font-extrabold leading-tight">{t('periodic.tableTitle')}</h2>
              <p className="mt-2 max-w-2xl text-[15.5px] text-[var(--pt-muted)]">{t('periodic.tableSub', { count: all.length })}</p>
            </div>
            <form role="search" onSubmit={(e) => e.preventDefault()} className="flex w-full max-w-sm items-center gap-2 rounded-full border border-[var(--pt-line)] bg-[var(--pt-card)] px-4">
              <Search className="size-4 shrink-0 text-[var(--pt-muted)]" />
              <label htmlFor="pt-q" className="sr-only">
                {t('periodic.search')}
              </label>
              <input id="pt-q" value={q} onChange={(e) => setQ(e.target.value)} placeholder={t('periodic.search')} className="h-10 w-full bg-transparent text-[14px] outline-none placeholder:text-[var(--pt-muted)]" />
            </form>
          </div>
          <div role="group" aria-label={t('periodic.families')} className="mb-5 flex flex-wrap gap-1.5">
            {families.map((f) => (
              <button
                key={f.id}
                type="button"
                aria-pressed={fam === f.id}
                onClick={() => setFam(fam === f.id ? null : f.id)}
                className={cn('pt-chip inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-[13px] font-medium transition', fam === f.id && 'pt-chip-on')}
                style={famStyle(f.hue, f.id === 'soft')}
              >
                <span className="size-2.5 rounded-full bg-[oklch(0.62_0.12_var(--h))]" style={f.id === 'soft' ? { background: '#8a8478' } : undefined} />
                {f.label}
                <span className="pt-mono text-[11px] opacity-70">{fmtNum(loc, f.count)}</span>
              </button>
            ))}
          </div>
          <p aria-live="polite" className="sr-only">
            {needle || fam ? t('periodic.results', { count: matchCount }) : ''}
          </p>

          {/* desktop: the classic silhouette; phones: a plain 6-column grid */}
          <div className="pt-grid grid grid-cols-6 gap-1 lg:grid-cols-18">
            <div className="col-span-6 mb-3 rounded-[8px] border border-dashed border-[var(--pt-line)] p-4 text-[13px] lg:col-[3/13] lg:row-[1/4] lg:mb-2 lg:me-2" style={{ order: -1 }}>
              <p className="font-semibold">{t('periodic.keyTitle')}</p>
              <div className="mt-3 flex items-center gap-4">
                <div className="pt-tile flex aspect-square w-[72px] shrink-0 flex-col rounded-[6px] border p-1.5" style={famStyle(172)}>
                  <span className="pt-mono text-[9px]">1</span>
                  <span className="pt-sym m-auto text-xl font-bold" lang="en">
                    De
                  </span>
                  <span className="text-center text-[8.5px] font-medium">DESeq2</span>
                </div>
                <ul className="space-y-0.5 text-[12.5px] text-[var(--pt-muted)]">
                  <li>{t('periodic.keyIndex')}</li>
                  <li>{t('periodic.keySymbol')}</li>
                  <li>{t('periodic.keyName')}</li>
                  <li>{t('periodic.keyFamily')}</li>
                </ul>
              </div>
            </div>
            {main.map((el, i) => (
              <Tile
                key={el.uid}
                el={el}
                loc={loc}
                dim={!matches(el)}
                active={active === i}
                style={{ ['--r' as string]: String(slots[i].r), ['--col' as string]: String(slots[i].c) }}
                onOpen={() => {
                  setActive(i);
                  setOpen(el);
                }}
                onKey={(e) => move(i, e)}
                refCb={(b) => {
                  btns.current[i] = b;
                }}
              />
            ))}
          </div>
          <h3 className="mt-8 text-[14px] font-semibold text-[var(--pt-muted)]">{t('periodic.softSeries')}</h3>
          <div className="mt-2 grid grid-cols-5 gap-1 sm:grid-cols-10 lg:ms-[calc((100%/18)*2)] lg:w-[calc((100%/18)*10)]">
            {soft.map((el, k) => {
              const i = main.length + k;
              return (
                <Tile
                  key={el.uid}
                  el={el}
                  loc={loc}
                  dim={!matches(el)}
                  active={active === i}
                  onOpen={() => {
                    setActive(i);
                    setOpen(el);
                  }}
                  onKey={(e) => move(i, e)}
                  refCb={(b) => {
                    btns.current[i] = b;
                  }}
                />
              );
            })}
          </div>

          {/* full names — the tiles shorten long ones */}
          <details className="pt-details mt-8 rounded-[10px] border border-[var(--pt-line)] bg-[var(--pt-card)]">
            <summary className="cursor-pointer list-none px-4 py-3 text-[14px] font-semibold [&::-webkit-details-marker]:hidden">{t('periodic.indexTitle', { count: all.length })}</summary>
            <ol className="columns-1 gap-8 px-4 pb-4 text-[13.5px] sm:columns-2 lg:columns-4">
              {all.map((el) => (
                <li key={el.uid} className="flex break-inside-avoid gap-2 py-0.5">
                  <span className="pt-mono w-7 shrink-0 text-end text-[var(--pt-muted)]">{fmtNum(loc, el.n)}</span>
                  <span className="pt-mono w-9 shrink-0 font-semibold" lang="en">
                    {el.symbol}
                  </span>
                  <bdi title={el.long !== el.name ? el.long : undefined}>{el.name}</bdi>
                </li>
              ))}
            </ol>
          </details>
        </section>

        {/* compounds */}
        <section id="compounds" className="scroll-mt-16 py-14">
          <h2 className="pt-display text-[clamp(1.9rem,3.6vw,3rem)] font-extrabold leading-tight">{t('periodic.compoundsTitle')}</h2>
          <p className="mt-2 max-w-3xl text-[15.5px] text-[var(--pt-muted)]">{t('periodic.compoundsSub', { count: projects.length })}</p>
          <ul className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {projects.map((pr) => (
              <Compound key={pr.id} p={pr} skills={skills} symOf={symOf} famSymbol={famSymbol} t={t} />
            ))}
          </ul>
        </section>

        {/* reactions */}
        <section id="reactions" className="scroll-mt-16 py-14">
          <h2 className="pt-display text-[clamp(1.9rem,3.6vw,3rem)] font-extrabold leading-tight">{t('periodic.reactionsTitle')}</h2>
          <p className="mt-2 max-w-3xl text-[15.5px] text-[var(--pt-muted)]">{t('periodic.reactionsSub')}</p>
          <ol className="mt-8 grid gap-4 lg:grid-cols-2">
            {data.experiences.map((e) => (
              <li key={e.id} className="rounded-[12px] border border-[var(--pt-line)] bg-[var(--pt-card)] p-5">
                <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
                  <span className="rounded-[6px] border border-[var(--pt-line)] bg-[var(--pt-paper)] px-2.5 py-1.5 text-[13px] font-semibold">{e.org}</span>
                  <span className="flex min-w-[8rem] flex-1 flex-col items-center text-[11.5px] text-[var(--pt-muted)]">
                    <span>{e.period || t('common.undated')}</span>
                    <span className="flex w-full items-center" aria-hidden>
                      <span className="h-px flex-1 bg-[var(--pt-ink)]" />
                      {rtl ? <ArrowLeft className="-ms-1 size-4" /> : <ArrowRight className="-ms-1 size-4" />}
                    </span>
                    <span>{e.location || t(`kinds.${e.kind}`)}</span>
                  </span>
                  <span className="rounded-[6px] bg-[var(--pt-ink)] px-2.5 py-1.5 text-[13px] font-semibold text-[var(--pt-paper)]">{e.role}</span>
                </div>
                <p className="mt-3 text-[12px] font-semibold uppercase tracking-wide text-[var(--pt-accent)] rtl:tracking-normal">
                  {t(`kinds.${e.kind}`)}
                  {e.current ? ` · ${t('common.current')}` : ''}
                </p>
                <p className="mt-1.5 text-[14.5px] leading-relaxed">{e.description}</p>
              </li>
            ))}
          </ol>
        </section>

        {/* isotopes */}
        <section id="isotopes" className="scroll-mt-16 py-14">
          <h2 className="pt-display text-[clamp(1.9rem,3.6vw,3rem)] font-extrabold leading-tight">{t('periodic.isotopesTitle')}</h2>
          <p className="mt-2 max-w-3xl text-[15.5px] text-[var(--pt-muted)]">{t('periodic.isotopesSub', { repos })}</p>
          <ul className="mt-8 grid gap-4 md:grid-cols-3">
            {data.education.map((ed) => (
              <li key={ed.id} className="rounded-[12px] border border-[var(--pt-line)] bg-[var(--pt-card)] p-5">
                <p className="flex items-start gap-1" dir="ltr" aria-hidden>
                  <span className="pt-mono flex flex-col text-end text-[13px] leading-tight">
                    <span>{ed.startYear ?? ''}</span>
                    <span>{repos}</span>
                  </span>
                  <span className="pt-sym text-[2.6rem] font-extrabold leading-none">Ry</span>
                </p>
                <h3 className="mt-3 text-[17px] font-bold leading-snug">{ed.degree}</h3>
                <p className="mt-1 text-[14px] text-[var(--pt-muted)]">
                  {ed.institution} · {ed.location}
                </p>
                <p className="mt-2 text-[14px]">
                  {ed.period}
                  {ed.gpa && (
                    <>
                      {' · '}
                      {t('common.gpa')} <bdi dir="ltr">{ed.gpa}</bdi>
                    </>
                  )}
                </p>
              </li>
            ))}
          </ul>
        </section>

        {/* emission spectrum */}
        <section id="spectrum" className="scroll-mt-16 py-14">
          <h2 className="pt-display text-[clamp(1.9rem,3.6vw,3rem)] font-extrabold leading-tight">{t('periodic.spectrumTitle')}</h2>
          <p className="mt-2 max-w-3xl text-[15.5px] text-[var(--pt-muted)]">
            {t('sections.certifications.subtitle', { count: fmtNum(data.locale, data.certStats.count), hours: fmtNum(data.locale, data.certStats.hours), issuers: fmtNum(data.locale, data.certStats.issuers.length) })} — {t('periodic.spectrumNote')}
          </p>
          <Spectrum data={data} rtl={rtl} />
          <ol className="mt-6 grid gap-x-8 sm:grid-cols-2 lg:grid-cols-3">
            {data.certifications.map((c) => (
              <li key={c.name + c.issuer} className="border-b border-[var(--pt-line)] py-2 text-[14px]">
                <bdi lang="en" className="font-medium">
                  {c.url ? (
                    <a href={c.url} target="_blank" rel="noreferrer" className="underline decoration-1 underline-offset-2 hover:text-[var(--pt-accent)]">
                      {c.name}
                    </a>
                  ) : (
                    c.name
                  )}
                </bdi>
                <span className="block text-[12.5px] text-[var(--pt-muted)]">
                  <bdi>{c.issuer}</bdi>
                  {c.year ? dot(loc) + fmtYear(loc, c.year) : null}
                  {c.hours ? dot(loc) + t('common.hours', { count: fmtNum(loc, c.hours) }) : null}
                </span>
              </li>
            ))}
          </ol>
        </section>

        {/* reference data */}
        <section id="reference" className="scroll-mt-16 py-14">
          <h2 className="pt-display text-[clamp(1.9rem,3.6vw,3rem)] font-extrabold leading-tight">{t('periodic.referenceTitle')}</h2>
          <ol className="mt-8 divide-y divide-[var(--pt-line)] rounded-[12px] border border-[var(--pt-line)] bg-[var(--pt-card)]">
            {data.publications.map((pub, i) => (
              <li key={pub.id} className="grid gap-x-6 gap-y-1 p-5 md:grid-cols-[10rem_minmax(0,1fr)]">
                <p className="text-[13px] text-[var(--pt-muted)]">
                  <span className="pt-mono text-[var(--pt-accent)]">[{fmtNum(loc, i + 1)}]</span> {publicationLabel(t, 'pubType', pub.type)}
                  <br />
                  <span className="font-semibold text-[var(--pt-ink)]">{publicationLabel(t, 'pubStatus', pub.status)}</span>
                  {pub.year ? ` · ${fmtYear(loc, pub.year)}` : ''}
                </p>
                <div>
                  <p lang="en" dir="ltr" className="font-bold leading-snug">
                    {pub.title}
                  </p>
                  <p className="mt-1 text-[14px] text-[var(--pt-muted)]">
                    <Authors ownerName={data.person.fullName} p={pub} meClassName="font-semibold text-[var(--pt-ink)]" etAl={t('common.withCoAuthors')} />
                    {pub.venue && (
                      <>
                        {' — '}
                        <bdi lang="en">
                          <i>{pub.venue}</i>
                          {pub.publisher ? `, ${pub.publisher}` : ''}
                        </bdi>
                      </>
                    )}
                  </p>
                  <div className="mt-2 flex flex-wrap gap-4 text-[13px]">
                    {pub.url && (
                      <a href={pub.url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 font-semibold text-[var(--pt-accent)] hover:underline" dir="ltr">
                        {pub.doi ? `doi:${pub.doi}` : t('common.visit')} <ArrowUpRight className="size-3.5" />
                      </a>
                    )}
                    {pub.bibtex && (
                      <CopyButton value={pub.bibtex} className="inline-flex items-center gap-1 font-semibold hover:text-[var(--pt-accent)]">
                        <Copy className="size-3.5" /> {t('common.copyBibtex')}
                      </CopyButton>
                    )}
                  </div>
                </div>
              </li>
            ))}
          </ol>

          {/* electron configuration = languages */}
          <h3 className="pt-display mt-14 text-[clamp(1.5rem,2.6vw,2.1rem)] font-extrabold">{t('periodic.configTitle')}</h3>
          <ul className="mt-5 grid gap-4 md:grid-cols-3">
            {data.languages.map((l) => (
              <li key={l.id} className="rounded-[12px] border border-[var(--pt-line)] bg-[var(--pt-card)] p-5">
                <p className="text-[18px] font-bold">{l.name}</p>
                <p className="text-[14px] text-[var(--pt-muted)]">{l.level}</p>
                {l.cert && (
                  <>
                    <p className="pt-mono mt-3 text-[13px]" dir="ltr">
                      [{l.cert.test}] {fmtNum(loc, l.cert.overall, { minimumFractionDigits: 1, maximumFractionDigits: 1 })}
                    </p>
                    <ul className="mt-2 space-y-1.5">
                      {(['listening', 'reading', 'writing', 'speaking'] as const).map((k) => (
                        <li key={k} className="grid grid-cols-[5.5rem_minmax(0,1fr)_2.2rem] items-center gap-2 text-[12.5px]">
                          <span>{t(`ielts.${k}`)}</span>
                          <span className="flex gap-0.5" aria-hidden>
                            {Array.from({ length: 9 }, (_, n) => (
                              <span key={n} className={cn('h-2 flex-1 rounded-sm', n < Math.round(l.cert!.bands[k]) ? 'bg-[var(--pt-accent)]' : 'bg-[var(--pt-line)]')} />
                            ))}
                          </span>
                          <span className="pt-mono text-end">{fmtNum(loc, l.cert!.bands[k], { minimumFractionDigits: 1 })}</span>
                        </li>
                      ))}
                    </ul>
                  </>
                )}
              </li>
            ))}
          </ul>
        </section>

        {/* bond = contact */}
        <section id="bond" className="scroll-mt-16 py-16">
          <div className="grid items-center gap-10 rounded-[18px] border border-[var(--pt-line)] bg-[var(--pt-card)] p-6 md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] md:p-10">
            <Bond reduce={!!reduce} />
            <div>
              <p className="pt-mono text-[13px] text-[var(--pt-accent)]">{t('sections.contact.kicker')}</p>
              <h2 className="pt-display mt-2 text-[clamp(1.9rem,3.6vw,3rem)] font-extrabold leading-tight">{t('periodic.bondTitle')}</h2>
              <p className="mt-3 text-[15.5px] leading-relaxed text-[var(--pt-muted)]">
                {p.availability} {t('sections.contact.subtitle')}
              </p>
              <a href={data.links.email} dir="ltr" className="mt-5 inline-block break-all text-[clamp(1.1rem,2vw,1.5rem)] font-bold text-[var(--pt-accent)] hover:underline">
                {p.email}
              </a>
              <div className="mt-5 flex flex-wrap gap-2">
                {(['github', 'linkedin', 'orcid', 'scholar'] as const).map((k) =>
                  data.links[k] ? (
                    <a key={k} href={data.links[k]!} target="_blank" rel="noreferrer" aria-label={k} className="grid size-10 place-items-center rounded-full border border-[var(--pt-line)] hover:bg-[var(--pt-paper)]">
                      <BrandIcon name={k} className="size-4" />
                    </a>
                  ) : null,
                )}
              </div>
            </div>
          </div>
          <footer className="mt-10 flex flex-wrap justify-between gap-3 pb-20 text-[12.5px] text-[var(--pt-muted)]">
            <span>{t('common.rights', { year: fmtYear(loc, new Date(data.generatedAt).getUTCFullYear()) })}</span>
            <span>{t('periodic.footer')}</span>
          </footer>
        </section>
      </main>

      <Dialog
        open={!!open}
        onClose={() => setOpen(null)}
        title={open ? `${open.name} (${open.symbol})` : ''}
        hideTitle
        className="rounded-[16px] border border-[var(--pt-line)] bg-[var(--pt-paper)] p-6 text-[var(--pt-ink)] shadow-2xl"
        closeClassName="border border-[var(--pt-line)] hover:bg-[var(--pt-card)]"
      >
        {open && <ElementCard el={open} projects={projects} t={t} loc={loc} siblings={[...main, ...soft].filter((x) => x.group === open.group && x.uid !== open.uid)} />}
      </Dialog>
    </div>
  );
}

/* family "symbols" for formulas when no tag matches a skill */
const cnSym = (d: string) => ({ singlecell: 'Sc', genomics: 'Gn', systems: 'Sy', structural: 'St', ml: 'Ml', software: 'Sw', data: 'Da', devops: 'Do', wetlab: 'Wl', bioprocess: 'Bp' })[d] ?? 'X';

function Compound({
  p,
  skills,
  symOf,
  famSymbol,
  t,
}: {
  p: Project;
  skills: FlatSkill[];
  symOf: (s: FlatSkill) => string | undefined;
  famSymbol: (d: string) => string;
  t: ReturnType<typeof useTranslations>;
}) {
  const matched = projectSkills(p, skills);
  const syms = matched.length ? matched.map((s) => ({ sym: symOf(s) ?? '?', hue: 0, title: s.name, fam: s.domain })) : projectDomains(p, skills).map((d) => ({ sym: famSymbol(d), hue: 0, title: t(`domains.${d}`), fam: d }));
  return (
    <li className={cn('flex flex-col rounded-[12px] border border-[var(--pt-line)] bg-[var(--pt-card)] p-5', p.highlight && 'ring-2 ring-[var(--pt-accent)]/40')}>
      <div className="flex flex-wrap items-center gap-1" dir="ltr" aria-label={t('periodic.formula')}>
        {syms.map((s, i) => (
          <span key={i} title={s.title} className="pt-mono rounded-[4px] border border-[var(--pt-line)] bg-[var(--pt-paper)] px-1.5 py-0.5 text-[13px] font-semibold">
            {s.sym}
          </span>
        ))}
        {p.metric && <span className="pt-mono ms-auto text-[15px] font-bold text-[var(--pt-accent)]">{p.metric}</span>}
      </div>
      <p className="mt-3 text-[12px] font-semibold uppercase tracking-wide text-[var(--pt-muted)] rtl:tracking-normal">{t(`categories.${p.category}`)}</p>
      <h3 className="mt-1 text-[17px] font-bold leading-snug" dir="auto">
        {p.title}
      </h3>
      <Expandable text={p.description} lines={4} minChars={200} className="mt-2 text-[14.5px] leading-relaxed text-[var(--pt-ink)]/85" buttonClassName="text-[13px] font-semibold text-[var(--pt-accent)]" />
      {p.url && (
        <a href={p.url} target="_blank" rel="noreferrer" className="mt-auto inline-flex items-center gap-1.5 pt-4 text-[13.5px] font-semibold hover:text-[var(--pt-accent)]">
          <BrandIcon name="github" className="size-4" /> <span dir="ltr" className="truncate">{p.repo?.split('/').pop()}</span> <ArrowUpRight className="flip-rtl size-3.5" />
        </a>
      )}
    </li>
  );
}

function ElementCard({ el, projects, siblings, t, loc }: { el: El; projects: Project[]; siblings: El[]; t: ReturnType<typeof useTranslations>; loc: string }) {
  const found = el.skill ? skillProjects(el.skill, projects) : [];
  return (
    <div>
      <div className="flex items-start gap-5">
        <div className="pt-tile flex aspect-square w-28 shrink-0 flex-col rounded-[10px] border-2 p-2.5" style={famStyle(el.hue, el.family === 'soft')}>
          <span className="pt-mono text-[11px]">{fmtNum(loc, el.n)}</span>
          <span className="pt-sym m-auto text-[2.6rem] font-extrabold leading-none" lang="en">
            {el.symbol}
          </span>
        </div>
        <div className="min-w-0 pe-8">
          <p className="text-[12px] font-semibold uppercase tracking-wide text-[var(--pt-muted)] rtl:tracking-normal">{el.family === 'soft' ? t('common.softSkills') : t(`domains.${el.family}`)}</p>
          <p className="mt-1 text-[22px] font-extrabold leading-tight">
            <bdi>{el.name}</bdi>
          </p>
          {el.long !== el.name && <p className="mt-1 text-[14px] text-[var(--pt-muted)]">{el.long}</p>}
          <p className="mt-2 text-[13px] text-[var(--pt-muted)]">
            {el.category} › {el.group}
          </p>
        </div>
      </div>
      <div className="mt-6">
        <p className="text-[13px] font-semibold">{t('periodic.foundIn')}</p>
        {found.length ? (
          <ul className="mt-2 space-y-1.5 text-[14px]">
            {found.map((p) => (
              <li key={p.id}>
                {p.url ? (
                  <a href={p.url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 underline decoration-1 underline-offset-2 hover:text-[var(--pt-accent)]">
                    {p.title} <ArrowUpRight className="flip-rtl size-3.5" />
                  </a>
                ) : (
                  p.title
                )}
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-1 text-[14px] text-[var(--pt-muted)]">{t('periodic.notTagged')}</p>
        )}
      </div>
      {siblings.length > 0 && (
        <div className="mt-5">
          <p className="text-[13px] font-semibold">{t('periodic.groupmates')}</p>
          <p className="mt-1.5 flex flex-wrap gap-1">
            {siblings.map((s) => (
              <span key={s.uid} className="rounded-[4px] border border-[var(--pt-line)] px-1.5 py-0.5 text-[12.5px]">
                <span className="pt-mono me-1 font-semibold" lang="en">
                  {s.symbol}
                </span>
                <bdi>{s.name}</bdi>
              </span>
            ))}
          </p>
        </div>
      )}
    </div>
  );
}

/* ─────────────────────────────── spectrum ─────────────────────────────── */

function Spectrum({ data, rtl }: { data: SiteData; rtl: boolean }) {
  const t = useTranslations();
  const pts = data.certifications.map((c) => ({ c, x: yearFrac(c.date) })).filter((p): p is { c: (typeof data.certifications)[number]; x: number } => p.x !== null);
  const lo = Math.floor(Math.min(...pts.map((p) => p.x)));
  const hi = Math.ceil(Math.max(...pts.map((p) => p.x)) + 0.01);
  const W = 1000;
  const H = 150;
  const sx = (v: number) => {
    const f = (v - lo) / (hi - lo);
    return 20 + (rtl ? 1 - f : f) * (W - 40);
  };
  const maxH = Math.max(...pts.map((p) => p.c.hours ?? 4));
  // visible-spectrum colours along the axis (decorative)
  const hue = (v: number) => 270 - ((v - lo) / (hi - lo)) * 270;
  return (
    <figure className="mt-8">
      <svg viewBox={`0 0 ${W} ${H + 26}`} className="w-full rounded-[12px] bg-[#0d0e12]" role="img" aria-label={t('periodic.spectrumTitle')}>
        {pts.map(({ c, x }, i) => {
          const h = 18 + (Math.sqrt(c.hours ?? 4) / Math.sqrt(maxH)) * (H - 30);
          return <rect key={i} x={r2(sx(x) - 1.5)} y={r2(H - h)} width={3} height={r2(h)} fill={`hsl(${r2(hue(x))} 95% 60%)`} opacity={0.9}><title>{c.name}</title></rect>;
        })}
        {Array.from({ length: hi - lo + 1 }, (_, i) => lo + i).map((y) => (
          <text key={y} x={r2(sx(y))} y={H + 18} textAnchor="middle" className="fill-[#c9c4b8] text-[13px]" direction="ltr">
            {fmtYear(data.locale, y)}
          </text>
        ))}
      </svg>
    </figure>
  );
}

/* ─────────────────────────────── bond ─────────────────────────────── */

function Bond({ reduce }: { reduce: boolean }) {
  return (
    <svg viewBox="0 0 360 200" className="w-full max-w-md" aria-hidden>
      <circle cx={110} cy={100} r={58} fill="oklch(0.94 0.05 20)" stroke="oklch(0.6 0.12 20)" strokeWidth={2} />
      <circle cx={250} cy={100} r={58} fill="oklch(0.94 0.05 230)" stroke="oklch(0.6 0.12 230)" strokeWidth={2} />
      <text x={110} y={112} textAnchor="middle" className="fill-[#16171b] text-[34px] font-extrabold" direction="ltr">
        Ry
      </text>
      <text x={250} y={112} textAnchor="middle" className="fill-[#16171b] text-[30px] font-extrabold" direction="ltr">
        You
      </text>
      <g className={reduce ? undefined : 'pt-pair'}>
        <circle cx={180} cy={88} r={6} fill="#b9380a" />
        <circle cx={180} cy={112} r={6} fill="#b9380a" />
      </g>
    </svg>
  );
}
