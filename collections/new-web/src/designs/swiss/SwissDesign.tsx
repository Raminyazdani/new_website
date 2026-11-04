'use client';

import { Fragment, useEffect, useId, useMemo, useRef, useState, type ReactNode } from 'react';
import { useReducedMotion } from 'motion/react';
import { useTranslations } from 'next-intl';
import { ArrowUpRight, BookOpenText, ChevronDown, Copy, Globe, Mail, Pause, Play } from 'lucide-react';
import { Marquee } from '@/components/magicui/marquee';
import { Authors } from '@/components/kit/Authors';
import VariableProximity from '@/components/reactbits/VariableProximity';
import { BrandIcon } from '@/components/shared/BrandIcon';
import { CopyButton } from '@/components/shared/CopyButton';
import { LocaleSwitcher } from '@/components/shared/LocaleSwitcher';
import { allProjects, domainEvidence } from '@/lib/derive';
import { fmtNum, fmtYear, publicationLabel } from '@/lib/format';
import type { Project, ProjectCategory, SiteData } from '@/lib/types';
import { cn } from '@/lib/utils';
import { Poster } from './Poster';
import './swiss.css';

type T = ReturnType<typeof useTranslations>;

/* ------------------------------------------------------------------ helpers */

/** 01, 02 … in Latin scripts; Persian numbering is not zero-padded. */
const pad = (loc: string, n: number) => fmtNum(loc, n, loc === 'fa' ? undefined : { minimumIntegerDigits: 2 });

/** Section heading on the 12-column grid: big red number, title, optional lede. */
function Head({ n, title, sub, loc }: { n: number; title: string; sub?: string; loc: string }) {
  return (
    <header className="sw-grid mb-10 border-t-2 border-[var(--sw-ink)] pt-4 md:mb-14">
      <p className="sw-num col-span-12 md:col-span-3" aria-hidden>
        {pad(loc, n)}
      </p>
      <div className="col-span-12 md:col-span-9">
        <h2 className="sw-h2">{title}</h2>
        {sub && <p className="mt-4 max-w-3xl text-[17px] leading-relaxed text-[var(--sw-muted)]">{sub}</p>}
      </div>
    </header>
  );
}

function Section({ id, children, className }: { id: string; children: ReactNode; className?: string }) {
  return (
    <section id={id} className={cn('scroll-mt-20 py-16 md:py-24', className)}>
      {children}
    </section>
  );
}

/** Persisted reader mode (CODE-069): no posters, no motion, one column. */
function useReader() {
  const [on, setOn] = useState(false);
  useEffect(() => {
    try {
      setOn(window.localStorage.getItem('ry-swiss-reader') === '1');
    } catch {
      /* storage unavailable — default off */
    }
  }, []);
  const toggle = () =>
    setOn((v) => {
      try {
        window.localStorage.setItem('ry-swiss-reader', v ? '0' : '1');
      } catch {
        /* ignore */
      }
      return !v;
    });
  return [on, toggle] as const;
}

/* ------------------------------------------------------------------- header */

const NAV = ['statement', 'evidence', 'work', 'experience', 'education', 'publications', 'skills', 'courses', 'languages', 'notes', 'contact'] as const;

function Header({ data, reader, toggleReader, labels }: { data: SiteData; reader: boolean; toggleReader: () => void; labels: Record<(typeof NAV)[number], string> }) {
  const t = useTranslations();
  const [open, setOpen] = useState(false);
  const panel = useRef<HTMLDivElement>(null);
  const id = useId();
  useEffect(() => {
    if (!open) return;
    const close = (e: MouseEvent | KeyboardEvent) => {
      if (e instanceof KeyboardEvent ? e.key === 'Escape' : !panel.current?.contains(e.target as Node)) setOpen(false);
    };
    window.addEventListener('mousedown', close);
    window.addEventListener('keydown', close);
    return () => {
      window.removeEventListener('mousedown', close);
      window.removeEventListener('keydown', close);
    };
  }, [open]);
  return (
    <header className="sticky top-0 z-40 border-b border-[var(--sw-ink)] bg-[var(--sw-paper)]/95 backdrop-blur-sm print:hidden">
      <a href="#statement" className="sr-only focus:not-sr-only focus:absolute focus:start-4 focus:top-3 focus:z-50 focus:bg-[var(--sw-paper)] focus:px-3 focus:py-2">
        {t('nav.skip')}
      </a>
      <div className="mx-auto flex h-14 max-w-[1440px] items-center gap-4 px-5 md:px-10">
        <a href="#top" className="flex items-center gap-3 font-semibold">
          <span className="grid size-7 place-items-center bg-[var(--sw-red)] text-[11px] font-bold text-white" lang="en">
            RY
          </span>
          <span className="sw-display hidden text-[15px] sm:inline">{data.person.displayName}</span>
        </a>
        <div ref={panel} className="relative ms-auto">
          <button
            type="button"
            aria-expanded={open}
            aria-controls={id}
            onClick={() => setOpen((v) => !v)}
            className="flex h-9 items-center gap-1.5 border border-[var(--sw-ink)] px-3 text-sm font-medium transition hover:bg-[var(--sw-ink)] hover:text-[var(--sw-paper)]"
          >
            {t('swiss.index')} <ChevronDown className={cn('size-4 transition', open && 'rotate-180')} />
          </button>
          {open && (
            <nav id={id} aria-label={t('swiss.index')} className="absolute end-0 top-[calc(100%+8px)] w-72 border border-[var(--sw-ink)] bg-[var(--sw-paper)] p-2 shadow-[6px_6px_0_var(--sw-ink)]">
              <ol>
                {NAV.map((k, i) => (
                  <li key={k}>
                    <a href={`#${k}`} onClick={() => setOpen(false)} className="flex items-baseline gap-3 px-2 py-1.5 text-[15px] hover:bg-[var(--sw-panel)]">
                      <span className="w-7 text-[var(--sw-red)] tabular-nums">{k === 'contact' ? <span className="flip-rtl inline-block">→</span> : pad(data.locale, i + 1)}</span>
                      {labels[k]}
                    </a>
                  </li>
                ))}
              </ol>
            </nav>
          )}
        </div>
        <button
          type="button"
          aria-pressed={reader}
          onClick={toggleReader}
          className={cn(
            'flex h-9 items-center gap-1.5 border px-3 text-sm font-medium transition',
            reader ? 'border-[var(--sw-red)] bg-[var(--sw-red)] text-white' : 'border-[var(--sw-ink)] hover:bg-[var(--sw-ink)] hover:text-[var(--sw-paper)]',
          )}
        >
          <BookOpenText className="size-4" />
          <span className="hidden sm:inline">{t('swiss.reader')}</span>
        </button>
        <LocaleSwitcher
          className="h-9 border border-[var(--sw-ink)]"
          itemClassName="h-full min-w-9 px-2 text-xs font-semibold transition hover:bg-[var(--sw-panel)]"
          activeClassName="bg-[var(--sw-ink)] text-[var(--sw-paper)] hover:bg-[var(--sw-ink)]"
        />
      </div>
    </header>
  );
}

/* ----------------------------------------------------------------- masthead */

function Masthead({ data }: { data: SiteData }) {
  const t = useTranslations();
  const p = data.person;
  const ref = useRef<HTMLDivElement>(null);
  const reduce = useReducedMotion();
  // the server cannot know the motion preference: decide only after hydration
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  const fa = data.locale === 'fa';
  return (
    <div id="top" ref={ref} className="pt-10 md:pt-14">
      <h1 className="sw-name" aria-label={p.displayName}>
        {fa || (mounted && reduce) ? (
          p.displayName
        ) : (
          <VariableProximity
            label={p.displayName}
            fromFontVariationSettings="'wght' 820, 'wdth' 64"
            toFontVariationSettings="'wght' 900, 'wdth' 125"
            containerRef={ref}
            radius={220}
            falloff="gaussian"
          />
        )}
      </h1>
      <div className="sw-grid mt-6 gap-y-5 border-t border-[var(--sw-ink)] pt-5 md:mt-8">
        <ul className="col-span-12 text-sm font-semibold uppercase leading-6 tracking-[0.12em] text-[var(--sw-red)] rtl:tracking-normal md:col-span-3">
          {p.labels.map((l) => (
            <li key={l}>{l}</li>
          ))}
        </ul>
        <div className="col-span-12 md:col-span-6">
          <p className="sw-display text-[clamp(1.4rem,2.4vw,2rem)] font-semibold leading-tight">{p.headline}</p>
          <p className="mt-3 text-[17px] leading-relaxed text-[var(--sw-muted)]">{p.tagline}</p>
        </div>
        <div className="col-span-12 space-y-1 text-[15px] md:col-span-3">
          <p>{p.location}</p>
          <p className="text-[var(--sw-muted)]">{p.status}</p>
          <a href={data.links.email} className="mt-3 inline-flex items-center gap-2 bg-[var(--sw-red)] px-4 py-2.5 font-semibold text-white transition hover:bg-[var(--sw-ink)]">
            <Mail className="size-4" /> {t('common.sendEmail')}
          </a>
        </div>
      </div>
    </div>
  );
}

/* ---------------------------------------------------------------- statement */

function Statement({ data, title }: { data: SiteData; title: string }) {
  const p = data.person;
  const loc = data.locale;
  return (
    <Section id="statement">
      <Head n={1} title={title} loc={loc} />
      <div className="sw-grid">
        <p className="sw-display col-span-12 text-[clamp(1.8rem,3.6vw,3.4rem)] font-semibold leading-[1.08] md:col-span-9 md:col-start-4">{p.statement}</p>
        <div className="col-span-12 mt-10 gap-8 text-[17px] leading-relaxed md:col-span-9 md:col-start-4 lg:columns-2">
          {p.about.map((a, i) => (
            <p key={i} className="mb-5 break-inside-avoid">
              {a}
            </p>
          ))}
        </div>
      </div>
      <dl className="sw-grid mt-14 gap-y-10">
        {data.stats.map((s) => (
          <div key={s.id} className="col-span-6 flex flex-col border-t border-[var(--sw-ink)] pt-3 md:col-span-3">
            <dt className="order-2 mt-2 text-sm leading-snug text-[var(--sw-muted)]">{s.label}</dt>
            <dd className="sw-stat order-1">
              {fmtNum(loc, s.value)}
              <span className="text-[var(--sw-red)]">{s.suffix}</span>
            </dd>
          </div>
        ))}
      </dl>
    </Section>
  );
}

/* ------------------------------------------------------------- keyword band */

function Band({ data, t }: { data: SiteData; t: T }) {
  const [paused, setPaused] = useState(false);
  const words = data.domains.map((d) => t(`domains.${d.id}`));
  return (
    <div className="sw-band relative bg-[var(--sw-red)] text-white" role="region" aria-label={t('swiss.band')}>
      <Marquee className={cn('py-3 [--duration:55s] [--gap:2.5rem]', paused && '[&>div]:[animation-play-state:paused]')} repeat={3}>
        {words.map((w, i) => (
          <span key={i} className="sw-display whitespace-nowrap text-[clamp(1.6rem,3vw,2.6rem)] font-semibold">
            {w} <span aria-hidden>—</span>
          </span>
        ))}
      </Marquee>
      <button
        type="button"
        onClick={() => setPaused((v) => !v)}
        aria-pressed={paused}
        aria-label={paused ? t('common.play') : t('common.pause')}
        className="absolute end-3 top-1/2 grid size-9 -translate-y-1/2 place-items-center bg-white text-[var(--sw-ink)]"
      >
        {paused ? <Play className="size-4" /> : <Pause className="size-4" />}
      </button>
    </div>
  );
}

/* ----------------------------------------------------------------- evidence */

function Evidence({ data, title }: { data: SiteData; title: string }) {
  const t = useTranslations();
  const loc = data.locale;
  const ev = useMemo(() => domainEvidence(data), [data]);
  return (
    <Section id="evidence">
      <Head n={2} title={title} sub={t('swiss.evidenceSub')} loc={loc} />
      <ol className="border-b border-[var(--sw-ink)]">
        {ev.map((d, i) => (
          <li key={d.id} className="sw-grid border-t border-[var(--sw-ink)] py-6">
            <div className="col-span-12 md:col-span-3">
              <p className="text-sm tabular-nums text-[var(--sw-red)]">{pad(loc, i + 1)}</p>
              <h3 className="sw-display mt-1 text-[1.6rem] font-semibold leading-tight">{t(`domains.${d.id}`)}</h3>
              <p className="sw-mono mt-3 text-[13px] leading-6 text-[var(--sw-muted)]">
                {t('common.count.skills', { count: d.skills.length })}
                <br />
                {t('common.count.projects', { count: d.projects.length })}
                <br />
                {t('common.count.roles', { count: d.roles.length })}
                <br />
                {t('common.count.courses', { count: d.courses.length })}
              </p>
            </div>
            <dl className="col-span-12 grid gap-4 text-[15px] leading-relaxed md:col-span-9 md:grid-cols-[8rem_minmax(0,1fr)] md:gap-x-6">
              <dt className="font-semibold">{t('swiss.evProjects')}</dt>
              <dd>
                {d.projects.length ? (
                  d.projects.map((p, k) => (
                    <Fragment key={p.id}>
                      {p.url ? (
                        <a href={p.url} target="_blank" rel="noreferrer" className="sw-link">
                          {p.title}
                        </a>
                      ) : (
                        p.title
                      )}
                      {k < d.projects.length - 1 && <span className="text-[var(--sw-muted)]"> · </span>}
                    </Fragment>
                  ))
                ) : (
                  <span className="text-[var(--sw-muted)]">{t('swiss.none')}</span>
                )}
              </dd>
              <dt className="font-semibold">{t('swiss.evRoles')}</dt>
              <dd>{d.roles.length ? d.roles.map((r) => r.role).join(' · ') : <span className="text-[var(--sw-muted)]">{t('swiss.none')}</span>}</dd>
              <dt className="font-semibold">{t('swiss.evCourses')}</dt>
              <dd>
                {d.courses.length ? (
                  <bdi lang="en">{d.courses.map((c) => c.name).join(' · ')}</bdi>
                ) : (
                  <span className="text-[var(--sw-muted)]">{t('swiss.none')}</span>
                )}
              </dd>
              <dt className="font-semibold">{t('swiss.evTools')}</dt>
              <dd className="text-[var(--sw-muted)]">
                {d.skills.map((s, k) => (
                  <Fragment key={s.uid}>
                    <bdi>{s.name}</bdi>
                    {k < d.skills.length - 1 && ' · '}
                  </Fragment>
                ))}
              </dd>
            </dl>
          </li>
        ))}
      </ol>
    </Section>
  );
}

/* --------------------------------------------------------------------- work */

const CATS: Array<ProjectCategory | 'all'> = ['all', 'omics', 'structural', 'ml', 'software', 'biotech'];

function IndexRow({ p, n, loc, t, hidden, expanded }: { p: Project; n: number; loc: string; t: T; hidden?: boolean; expanded?: boolean }) {
  const [userOpen, setOpen] = useState(false);
  const open = userOpen || !!expanded;
  const id = useId();
  return (
    <li className="border-t border-[var(--sw-ink)]" hidden={hidden || undefined}>
      <div className="sw-grid items-baseline py-3">
        <span className="col-span-2 text-sm tabular-nums text-[var(--sw-red)] md:col-span-1">{pad(loc, n)}</span>
        <button
          type="button"
          data-kit-more=""
          aria-expanded={open}
          aria-controls={id}
          onClick={() => setOpen((v) => !v)}
          className="col-span-10 flex items-baseline gap-2 text-start text-[17px] font-semibold leading-snug hover:text-[var(--sw-red)] md:col-span-6"
        >
          <span dir="auto">{p.title}</span>
          <ChevronDown className={cn('size-4 shrink-0 translate-y-0.5 transition', open && 'rotate-180')} aria-hidden />
        </button>
        <span className="col-span-6 col-start-3 text-sm text-[var(--sw-muted)] md:col-span-2 md:col-start-auto">{t(`categories.${p.category}`)}</span>
        <span className="sw-mono col-span-6 hidden text-[12.5px] text-[var(--sw-muted)] md:col-span-2 md:block" dir="ltr">
          {p.tags.join(' · ')}
        </span>
        <span className="col-span-4 text-end md:col-span-1">
          {p.url ? (
            <a href={p.url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-sm font-semibold hover:text-[var(--sw-red)]" aria-label={`${t('swiss.colLink')}: ${p.title}`}>
              <BrandIcon name="github" className="size-4" /> <ArrowUpRight className="flip-rtl size-3.5" />
            </a>
          ) : null}
        </span>
      </div>
      <div id={id} hidden={!open || undefined} className="sw-desc sw-grid pb-5">
        <p dir="auto" className="col-span-12 max-w-3xl text-[16px] leading-relaxed md:col-span-8 md:col-start-2">
          {p.description}
          {p.metric && <span className="ml-2 font-semibold text-[var(--sw-red)] rtl:ml-0 rtl:mr-2" dir="ltr">{p.metric}</span>}
        </p>
      </div>
    </li>
  );
}

function Work({ data, title, expanded }: { data: SiteData; title: string; expanded: boolean }) {
  const t = useTranslations();
  const loc = data.locale;
  const all = useMemo(() => allProjects(data), [data]);
  const [cat, setCat] = useState<ProjectCategory | 'all'>('all');
  // one highlighted project from three different categories
  const featured = useMemo(() => {
    const seen = new Set<string>();
    return data.projects.filter((p) => p.highlight && !seen.has(p.category) && seen.add(p.category)).slice(0, 3);
  }, [data.projects]);
  return (
    <Section id="work">
      <Head n={3} title={title} sub={t('swiss.workSub', { count: all.length })} loc={loc} />
      <div className="sw-grid gap-y-12">
        {featured.map((p, i) => (
          <article key={p.id} className="col-span-12 md:col-span-4">
            <Poster seed={p.id} count={p.tags.length} variant={[0, 1, 3][i]} rtl={data.dir === 'rtl'} label={p.title} className="sw-poster aspect-square w-full border border-[var(--sw-ink)]" />
            <p className="mt-4 text-sm tabular-nums text-[var(--sw-red)]">
              {pad(loc, i + 1)} — {t(`categories.${p.category}`)}
            </p>
            <h3 className="sw-display mt-1 text-[1.5rem] font-semibold leading-tight">{p.title}</h3>
            <p className="mt-2 text-[15.5px] leading-relaxed text-[var(--sw-muted)]">{p.description}</p>
            {p.url && (
              <a href={p.url} target="_blank" rel="noreferrer" className="sw-link mt-3 inline-flex items-center gap-1.5 text-sm font-semibold">
                <BrandIcon name="github" className="size-4" /> <span dir="ltr">{p.repo}</span> <ArrowUpRight className="flip-rtl size-3.5" />
              </a>
            )}
          </article>
        ))}
      </div>
      <p className="sw-poster mt-6 text-sm text-[var(--sw-muted)]">{t('swiss.posterNote')}</p>

      <div className="mt-16 flex flex-wrap items-end justify-between gap-4">
        <h3 className="sw-display text-[2rem] font-semibold leading-none">{t('swiss.indexTitle')}</h3>
        <div role="group" aria-label={t('swiss.filter')} className="flex flex-wrap gap-1.5">
          {CATS.map((c) => (
            <button
              key={c}
              type="button"
              aria-pressed={cat === c}
              onClick={() => setCat(c)}
              className={cn('border px-3 py-1.5 text-sm transition', cat === c ? 'border-[var(--sw-ink)] bg-[var(--sw-ink)] text-[var(--sw-paper)]' : 'border-[var(--sw-ink)] hover:bg-[var(--sw-panel)]')}
            >
              {t(`categories.${c}`)} <span className="tabular-nums opacity-70">{fmtNum(loc, c === 'all' ? all.length : all.filter((p) => p.category === c).length)}</span>
            </button>
          ))}
        </div>
      </div>
      <div className="sw-grid mt-6 hidden border-t-2 border-[var(--sw-ink)] pt-2 text-xs font-semibold uppercase tracking-[0.1em] text-[var(--sw-muted)] rtl:tracking-normal md:grid">
        <span className="md:col-span-1">{t('swiss.colNo')}</span>
        <span className="md:col-span-6">{t('swiss.colTitle')}</span>
        <span className="md:col-span-2">{t('common.category')}</span>
        <span className="md:col-span-2">{t('common.tags')}</span>
        <span className="text-end md:col-span-1">{t('swiss.colLink')}</span>
      </div>
      <ol className="border-b border-[var(--sw-ink)]">
        {all.map((p, i) => (
          <IndexRow key={p.id} p={p} n={i + 1} loc={loc} t={t} hidden={!expanded && cat !== 'all' && p.category !== cat} expanded={expanded} />
        ))}
      </ol>
    </Section>
  );
}

/* --------------------------------------------------------------- experience */

function Experience({ data }: { data: SiteData }) {
  const t = useTranslations();
  return (
    <Section id="experience">
      <Head n={4} title={t('sections.experience.title')} sub={t('sections.experience.subtitle')} loc={data.locale} />
      <ol className="border-b border-[var(--sw-ink)]">
        {data.experiences.map((e) => (
          <li key={e.id} className="sw-grid gap-y-2 border-t border-[var(--sw-ink)] py-6">
            <p className="col-span-12 text-sm md:col-span-3">
              <span className="block tabular-nums">{e.period}</span>
              <span className="mt-1 block font-semibold text-[var(--sw-red)]">{t(`kinds.${e.kind}`)}</span>
              {e.current && <span className="mt-1 inline-block border border-[var(--sw-ink)] px-1.5 text-xs">{t('common.current')}</span>}
            </p>
            <div className="col-span-12 md:col-span-4">
              <h3 className="sw-display text-[1.3rem] font-semibold leading-snug">{e.role}</h3>
              <p className="mt-1 text-[15px] text-[var(--sw-muted)]">
                {e.org}
                {e.location ? ` — ${e.location}` : ''}
              </p>
            </div>
            <p className="col-span-12 text-[16px] leading-relaxed md:col-span-5">{e.description}</p>
          </li>
        ))}
      </ol>
    </Section>
  );
}

/* --------------------------------------------------------------- education */

function Education({ data }: { data: SiteData }) {
  const t = useTranslations();
  const thesis = data.publications.find((p) => p.type === 'Master Thesis');
  return (
    <Section id="education">
      <Head n={5} title={t('sections.education.title')} loc={data.locale} />
      <ol className="border-b border-[var(--sw-ink)]">
        {data.education.map((e) => (
          <li key={e.id} className="sw-grid gap-y-2 border-t border-[var(--sw-ink)] py-6">
            <p className="col-span-12 text-sm tabular-nums md:col-span-3">{e.period}</p>
            <div className="col-span-12 md:col-span-6">
              <h3 className="sw-display text-[1.4rem] font-semibold leading-snug">{e.degree}</h3>
              <p className="mt-1 text-[15px] text-[var(--sw-muted)]">
                {e.institution} — {e.location}
              </p>
              {e.id === 'tehran' && thesis && (
                <p className="mt-2 text-[15px]">
                  {t('common.thesis')}: <bdi lang="en">{thesis.title}</bdi>
                </p>
              )}
            </div>
            <p className="col-span-12 text-[15px] md:col-span-3 md:text-end">
              {e.gpa ? (
                <>
                  {t('common.gpa')} <bdi dir="ltr">{e.gpa}</bdi>
                </>
              ) : e.current ? (
                t('common.current')
              ) : null}
            </p>
          </li>
        ))}
      </ol>
    </Section>
  );
}

/* ------------------------------------------------------------- publications */

function Publications({ data }: { data: SiteData }) {
  const t = useTranslations();
  return (
    <Section id="publications">
      <Head n={6} title={t('sections.publications.title')} loc={data.locale} />
      <ol className="border-b border-[var(--sw-ink)]">
        {data.publications.map((p, i) => (
          <li key={p.id} className="sw-grid gap-y-2 border-t border-[var(--sw-ink)] py-6">
            <p className="col-span-12 text-sm md:col-span-3">
              <span className="tabular-nums text-[var(--sw-red)]">[{fmtNum(data.locale, i + 1)}]</span> {publicationLabel(t, 'pubType', p.type)}
              <span className="mt-1 block font-semibold">{publicationLabel(t, 'pubStatus', p.status)}</span>
              {p.year && <span className="block tabular-nums text-[var(--sw-muted)]">{fmtYear(data.locale, p.year)}</span>}
            </p>
            <div className="col-span-12 md:col-span-9">
              <h3 lang="en" dir="ltr" className="sw-display text-[1.35rem] font-semibold leading-snug">
                {p.title}
              </h3>
              <p className="mt-2 text-[15px]">
                <Authors ownerName={data.person.fullName} p={p} meClassName="font-semibold underline decoration-[var(--sw-red)] decoration-2 underline-offset-4" etAl={t('common.withCoAuthors')} />
              </p>
              {(p.venue || p.publisher) && (
                <p lang="en" dir="ltr" className="mt-1 text-[15px] text-[var(--sw-muted)]">
                  <i>{p.venue}</i>
                  {p.publisher && ` — ${p.publisher}`}
                </p>
              )}
              {p.supervisors && (
                <p className="mt-1 text-[15px] text-[var(--sw-muted)]">
                  {t('common.supervisors')}: <bdi lang="en">{p.supervisors.join(', ')}</bdi>
                </p>
              )}
              <div className="mt-3 flex flex-wrap items-center gap-4 text-sm">
                {p.url && (
                  <a href={p.url} target="_blank" rel="noreferrer" className="sw-link inline-flex items-center gap-1 font-semibold">
                    {p.doi ? `${t('common.doi')} ${p.doi}` : t('common.visit')} <ArrowUpRight className="size-3.5" />
                  </a>
                )}
                {p.isbn && <span dir="ltr">ISBN {p.isbn}</span>}
                {p.bibtex && (
                  <CopyButton value={p.bibtex} className="inline-flex items-center gap-1.5 border border-[var(--sw-ink)] px-2.5 py-1 font-medium hover:bg-[var(--sw-ink)] hover:text-[var(--sw-paper)]">
                    <Copy className="size-3.5" /> {t('common.copyBibtex')}
                  </CopyButton>
                )}
              </div>
            </div>
          </li>
        ))}
      </ol>
    </Section>
  );
}

/* ------------------------------------------------------------------- skills */

function Skills({ data }: { data: SiteData }) {
  const t = useTranslations();
  const loc = data.locale;
  const cats = data.skills.filter((c) => c.id !== 'soft-skills');
  return (
    <Section id="skills">
      <Head n={7} title={t('sections.skills.title')} sub={t('sections.skills.subtitle')} loc={loc} />
      <div className="sw-grid gap-y-12">
        {cats.map((c) => (
          <div key={c.id} className="col-span-12 border-t border-[var(--sw-ink)] pt-3 md:col-span-6 xl:col-span-4">
            <h3 className="sw-display flex items-baseline justify-between gap-3 text-[1.3rem] font-semibold">
              {c.label}
              <span className="text-sm tabular-nums text-[var(--sw-red)]">{fmtNum(loc, c.groups.reduce((a, g) => a + g.items.length, 0))}</span>
            </h3>
            <dl className="mt-4 space-y-3 text-[15px] leading-relaxed">
              {c.groups.map((g) => (
                <div key={g.id}>
                  <dt className="text-xs font-semibold uppercase tracking-[0.08em] text-[var(--sw-muted)] rtl:tracking-normal">{g.label}</dt>
                  <dd>
                    {g.items.map((it, k) => (
                      <Fragment key={it.key}>
                        <bdi title={it.long !== it.name ? it.long : undefined}>{it.name}</bdi>
                        {k < g.items.length - 1 && <span className="text-[var(--sw-red)]"> · </span>}
                      </Fragment>
                    ))}
                  </dd>
                </div>
              ))}
            </dl>
          </div>
        ))}
        <div className="col-span-12 border-t border-[var(--sw-ink)] pt-3 md:col-span-6 xl:col-span-4">
          <h3 className="sw-display flex items-baseline justify-between gap-3 text-[1.3rem] font-semibold">
            {t('common.softSkills')}
            <span className="text-sm tabular-nums text-[var(--sw-red)]">{fmtNum(loc, data.softSkills.length)}</span>
          </h3>
          <ul className="mt-4 text-[15px] leading-relaxed">
            {data.softSkills.map((s) => (
              <li key={s.key}>{s.name}</li>
            ))}
          </ul>
        </div>
      </div>
    </Section>
  );
}

/* ------------------------------------------------------------------ courses */

function Courses({ data }: { data: SiteData }) {
  const t = useTranslations();
  const loc = data.locale;
  return (
    <Section id="courses">
      <Head
        n={8}
        title={t('sections.certifications.title')}
        sub={t('sections.certifications.subtitle', { count: fmtNum(data.locale, data.certStats.count), hours: fmtNum(data.locale, data.certStats.hours), issuers: fmtNum(data.locale, data.certStats.issuers.length) })}
        loc={loc}
      />
      <ol className="border-b-2 border-[var(--sw-ink)]">
        {data.certifications.map((c, i) => (
          <li key={c.name + c.issuer} className="sw-grid items-baseline gap-y-1 border-t border-[var(--sw-ink)] py-2.5 text-[15px]">
            <span className="col-span-2 text-sm tabular-nums text-[var(--sw-red)] md:col-span-1">{pad(loc, i + 1)}</span>
            <span className="col-span-10 font-medium md:col-span-6">
              <bdi lang="en">
                {c.url ? (
                  <a href={c.url} target="_blank" rel="noreferrer" className="sw-link">
                    {c.name}
                  </a>
                ) : (
                  c.name
                )}
              </bdi>
            </span>
            <span className="col-span-6 col-start-3 text-sm text-[var(--sw-muted)] md:col-span-3 md:col-start-auto">
              <bdi>{c.issuer}</bdi>
            </span>
            <span className="col-span-2 text-sm tabular-nums text-[var(--sw-muted)] md:col-span-1">{c.year ? fmtYear(loc, c.year) : ''}</span>
            <span className="col-span-2 text-end text-sm tabular-nums md:col-span-1">{c.hours ? t('common.hours', { count: fmtNum(loc, c.hours) }) : ''}</span>
          </li>
        ))}
      </ol>
      <p className="sw-grid mt-3 text-[15px] font-semibold">
        <span className="col-span-12 md:col-span-11 md:col-start-2">
          {t('common.total')}: {t('common.count.courses', { count: data.certStats.count })} · {t('common.hours', { count: fmtNum(loc, data.certStats.hours) })}
        </span>
      </p>
    </Section>
  );
}

/* ---------------------------------------------------------------- languages */

function Languages({ data }: { data: SiteData }) {
  const t = useTranslations();
  const loc = data.locale;
  return (
    <Section id="languages">
      <Head n={9} title={t('sections.languages.title')} loc={loc} />
      <ol className="border-b border-[var(--sw-ink)]">
        {data.languages.map((l) => (
          <li key={l.id} className="sw-grid gap-y-3 border-t border-[var(--sw-ink)] py-6">
            <h3 className="sw-display col-span-12 text-[1.6rem] font-semibold md:col-span-3">{l.name}</h3>
            <p className="col-span-12 text-[16px] md:col-span-3">{l.level}</p>
            {l.cert ? (
              <div className="col-span-12 md:col-span-6">
                <p className="text-sm font-semibold">
                  {l.cert.test} — {t('ielts.overall')} <span className="tabular-nums text-[var(--sw-red)]">{fmtNum(loc, l.cert.overall, { minimumFractionDigits: 1 })}</span> / {fmtNum(loc, l.cert.max)}
                </p>
                <ul className="mt-3 space-y-2">
                  {(['listening', 'reading', 'writing', 'speaking'] as const).map((k) => (
                    <li key={k} className="grid grid-cols-[6.5rem_minmax(0,1fr)_2.5rem] items-center gap-3 text-sm">
                      <span>{t(`ielts.${k}`)}</span>
                      <span className="h-3 bg-[var(--sw-panel)]">
                        <span className="block h-full bg-[var(--sw-ink)]" style={{ width: `${(l.cert!.bands[k] / l.cert!.max) * 100}%` }} />
                      </span>
                      <span className="text-end tabular-nums">{fmtNum(loc, l.cert!.bands[k], { minimumFractionDigits: 1 })}</span>
                    </li>
                  ))}
                </ul>
                {l.cert.url && (
                  <a href={l.cert.url} target="_blank" rel="noreferrer" className="sw-link mt-3 inline-flex items-center gap-1 text-sm font-semibold">
                    {t('common.certificateLink')} <ArrowUpRight className="size-3.5" />
                  </a>
                )}
              </div>
            ) : (
              <span className="col-span-12 md:col-span-6" />
            )}
          </li>
        ))}
      </ol>
    </Section>
  );
}

/* -------------------------------------------------------------------- notes */

function Notes({ data, title }: { data: SiteData; title: string }) {
  const t = useTranslations();
  const loc = data.locale;
  const stat = (id: string) => data.stats.find((s) => s.id === id)?.value ?? 0;
  const notes = [
    t('swiss.n1', { repos: stat('repos'), courses: data.certStats.count, hours: data.certStats.hours }),
    t('swiss.n2'),
    t('swiss.n3'),
    t('swiss.n4'),
    t('swiss.n5'),
  ];
  return (
    <Section id="notes">
      <Head n={10} title={title} loc={loc} />
      <ol className="sw-grid gap-y-6">
        {notes.map((n, i) => (
          <li key={i} className="col-span-12 border-t border-[var(--sw-ink)] pt-3 text-[16px] leading-relaxed md:col-span-6 xl:col-span-4">
            <span className="me-2 font-semibold tabular-nums text-[var(--sw-red)]">{fmtNum(loc, i + 1)}.</span>
            {n}
          </li>
        ))}
      </ol>
    </Section>
  );
}

/* ------------------------------------------------------------------ contact */

function Contact({ data }: { data: SiteData }) {
  const t = useTranslations();
  const links = (['github', 'linkedin', 'orcid', 'scholar', 'website'] as const).filter((k) => data.links[k]);
  return (
    <Section id="contact" className="pb-28">
      <div className="border-t-[6px] border-[var(--sw-red)] pt-8">
        <p className="text-sm font-semibold uppercase tracking-[0.12em] text-[var(--sw-red)] rtl:tracking-normal">{t('sections.contact.kicker')}</p>
        <h2 className="sw-h2 mt-3 max-w-5xl">{t('sections.contact.title')}</h2>
        <p className="mt-4 max-w-2xl text-[17px] leading-relaxed text-[var(--sw-muted)]">
          {data.person.availability} {t('sections.contact.subtitle')}
        </p>
        <a href={data.links.email} dir="ltr" className="sw-email mt-10 inline-block break-all text-[var(--sw-red)] hover:text-[var(--sw-ink)]">
          {data.person.email}
        </a>
        <div className="mt-4">
          <CopyButton value={data.person.email} className="inline-flex items-center gap-1.5 border border-[var(--sw-ink)] px-3 py-1.5 text-sm font-medium hover:bg-[var(--sw-ink)] hover:text-[var(--sw-paper)]">
            <Copy className="size-3.5" /> {t('common.copyEmail')}
          </CopyButton>
        </div>
        <ul className="mt-12 flex flex-wrap gap-x-8 gap-y-3 border-t border-[var(--sw-ink)] pt-4 text-[17px] font-semibold">
          {links.map((k) => (
            <li key={k}>
              <a href={data.links[k]!} target="_blank" rel="noreferrer" className="sw-link inline-flex items-center gap-2">
                {k === 'website' ? <Globe className="size-4" /> : <BrandIcon name={k} className="size-4" />}
                {k === 'scholar' ? 'Google Scholar' : k === 'orcid' ? 'ORCID' : k === 'website' ? t('common.visit') : k === 'github' ? 'GitHub' : 'LinkedIn'}
                <ArrowUpRight className="flip-rtl size-4" />
              </a>
            </li>
          ))}
        </ul>
      </div>
      <footer className="mt-16 flex flex-wrap justify-between gap-4 text-sm text-[var(--sw-muted)]">
        <span>{t('common.rights', { year: fmtYear(data.locale, new Date(data.generatedAt).getUTCFullYear()) })}</span>
        <span>{t('common.builtWith')}</span>
      </footer>
    </Section>
  );
}

/* ------------------------------------------------------------------- design */

export default function SwissDesign({ data }: { data: SiteData }) {
  const t = useTranslations();
  const [reader, toggleReader] = useReader();
  // printing opens every row (CSS cannot override Tailwind's layered `[hidden]` rule)
  const [printing, setPrinting] = useState(false);
  useEffect(() => {
    const on = () => setPrinting(true);
    const off = () => setPrinting(false);
    window.addEventListener('beforeprint', on);
    window.addEventListener('afterprint', off);
    return () => {
      window.removeEventListener('beforeprint', on);
      window.removeEventListener('afterprint', off);
    };
  }, []);
  const labels = {
    statement: t('swiss.statement'),
    evidence: t('swiss.evidence'),
    work: t('swiss.work'),
    experience: t('sections.experience.title'),
    education: t('sections.education.title'),
    publications: t('sections.publications.title'),
    skills: t('sections.skills.title'),
    courses: t('sections.certifications.title'),
    languages: t('sections.languages.title'),
    notes: t('swiss.notes'),
    contact: t('nav.contact'),
  };
  return (
    <div className={cn('swiss-root min-h-dvh', reader && 'reader')}>
      <Header data={data} reader={reader} toggleReader={toggleReader} labels={labels} />
      <main>
      <div className="sw-main mx-auto max-w-[1440px] px-5 md:px-10">
        <Masthead data={data} />
        <Statement data={data} title={t('swiss.statementTitle')} />
      </div>
      {!reader && <Band data={data} t={t} />}
      <div className="sw-main mx-auto max-w-[1440px] px-5 md:px-10">
        <Evidence data={data} title={t('swiss.evidenceTitle')} />
        <Work data={data} title={t('swiss.workTitle')} expanded={reader || printing} />
        <Experience data={data} />
        <Education data={data} />
        <Publications data={data} />
        <Skills data={data} />
        <Courses data={data} />
        <Languages data={data} />
        <Notes data={data} title={t('swiss.notesTitle')} />
        <Contact data={data} />
      </div>
      </main>
    </div>
  );
}
