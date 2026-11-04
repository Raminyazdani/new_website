'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { useReducedMotion } from 'motion/react';
import { ArrowUpRight, Bell, BellOff, Copy, Mail, MoveHorizontal } from 'lucide-react';
import { Authors } from '@/components/kit/Authors';
import { Dialog } from '@/components/kit/Dialog';
import { Expandable } from '@/components/kit/Expandable';
import { ShowAll } from '@/components/kit/ShowAll';
import { BrandIcon } from '@/components/shared/BrandIcon';
import { CopyButton } from '@/components/shared/CopyButton';
import { LocaleSwitcher } from '@/components/shared/LocaleSwitcher';
import { allProjects, yearFrac } from '@/lib/derive';
import { fmtNum, fmtYear, numberLocale, seqNo, publicationLabel } from '@/lib/format';
import type { ProjectCategory, SiteData } from '@/lib/types';
import { cn } from '@/lib/utils';
import { CATS, PID, type Readout, type Unit } from './PID';
import { Trends } from './Trends';
import './reactor.css';

const CAT_CODE: Record<ProjectCategory, string> = { omics: 'OM', structural: 'ST', ml: 'ML', software: 'SW', biotech: 'BT' };

const monthYear = (loc: string, s: string | null) => {
  if (!s) return null;
  const [y, m] = s.split('-').map(Number);
  if (!m) return fmtYear(loc, y);
  return new Intl.DateTimeFormat(numberLocale(loc), { month: 'short', year: 'numeric', timeZone: 'UTC' }).format(new Date(Date.UTC(y, m - 1, 1)));
};

function Screen({ id, no, title, sub, children }: { id: string; no: number; title: string; sub?: string; children: React.ReactNode }) {
  const loc = useLocale();
  return (
    <section id={id} aria-labelledby={`${id}-h`} className="scroll-mt-28 py-10">
      <div className="rx-screen-head mb-5 flex flex-wrap items-baseline gap-x-4 gap-y-1 border-b-2 border-[#9aa3ab] pb-2">
        <span className="rx-mono text-[12px] font-bold text-[#4a5560]">{seqNo(loc, no)}</span>
        <h2 id={`${id}-h`} className="text-[clamp(1.4rem,2.6vw,1.9rem)] font-bold">
          {title}
        </h2>
        {sub && <p className="w-full text-[14px] text-[#4a5560] md:ms-auto md:w-auto">{sub}</p>}
      </div>
      {children}
    </section>
  );
}

function Clock({ loc, reduce }: { loc: string; reduce: boolean }) {
  const [now, setNow] = useState<Date | null>(null);
  useEffect(() => {
    const tick = () => setNow(new Date());
    tick();
    const id = window.setInterval(tick, reduce ? 30_000 : 1000);
    return () => window.clearInterval(id);
  }, [reduce]);
  const s = now
    ? new Intl.DateTimeFormat(numberLocale(loc), { hour: '2-digit', minute: '2-digit', ...(reduce ? {} : { second: '2-digit' }), hourCycle: 'h23', timeZone: 'Europe/Berlin' }).format(now)
    : '--:--';
  return (
    <span className="rx-mono rounded bg-[#1c252c] px-2 py-1 text-[12.5px] font-bold text-[#e9ecee]" dir="ltr">
      {s}
    </span>
  );
}

export default function ReactorDesign({ data }: { data: SiteData }) {
  const t = useTranslations();
  const loc = data.locale;
  const reduceRaw = useReducedMotion();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  const reduce = mounted && !!reduceRaw;
  const projects = useMemo(() => allProjects(data), [data]);
  const [unit, setUnit] = useState<Unit | null>(null);
  const [acked, setAcked] = useState(false);
  const pidRef = useRef<HTMLDivElement>(null);
  const [paused, setPaused] = useState(false);
  useEffect(() => {
    const el = pidRef.current;
    if (!el) return;
    const io = new IntersectionObserver(([e]) => setPaused(!e.isIntersecting));
    io.observe(el);
    return () => io.disconnect();
  }, []);

  const tanks = useMemo(() => [...data.education].sort((a, b) => (yearFrac(a.start) ?? 0) - (yearFrac(b.start) ?? 0)), [data]);
  const catCounts = useMemo(() => Object.fromEntries(CATS.map((c) => [c, projects.filter((p) => p.category === c).length])) as Record<ProjectCategory, number>, [projects]);
  const stat = (id: string) => data.stats.find((s) => s.id === id);
  const sv = (id: string) => {
    const s = stat(id);
    return s ? `${fmtNum(loc, s.value)}${s.suffix}` : '—';
  };
  const readouts: Readout[] = [
    { tag: 'QI-201', label: t('reactor.ro.repos'), value: sv('repos') },
    { tag: 'QI-202', label: t('reactor.ro.projects'), value: fmtNum(loc, projects.length) },
    { tag: 'QI-203', label: t('reactor.ro.courses'), value: sv('courses') },
    { tag: 'QI-204', label: t('reactor.ro.hours'), value: sv('hours') },
    { tag: 'QI-205', label: t('reactor.ro.years'), value: sv('years') },
    { tag: 'QI-206', label: t('reactor.ro.languages'), value: sv('languages') },
  ];

  // alarms & events: every dated entry, newest first
  const events = useMemo(() => {
    type Ev = { at: number; date: string; type: 'start' | 'end' | 'course' | 'pub' | 'study'; text: string; sub: string };
    const ev: Ev[] = [];
    const now = new Date(data.generatedAt).getTime();
    for (const e of data.experiences) {
      const s = yearFrac(e.start);
      if (s !== null) ev.push({ at: s, date: monthYear(loc, e.start)!, type: 'start', text: e.role, sub: e.org });
      const en = e.end && e.end !== 'present' ? yearFrac(e.end) : null;
      if (en !== null && new Date(String(e.end)).getTime() <= now) ev.push({ at: en, date: monthYear(loc, e.end as string)!, type: 'end', text: e.role, sub: e.org });
    }
    for (const e of data.education) {
      const s = yearFrac(e.start);
      if (s !== null) ev.push({ at: s, date: monthYear(loc, e.start)!, type: 'study', text: e.degree, sub: e.institution });
      const en = e.end && e.end !== 'present' ? yearFrac(e.end) : null;
      if (en !== null) ev.push({ at: en, date: monthYear(loc, e.end as string)!, type: 'end', text: e.degree, sub: e.institution });
    }
    for (const c of data.certifications) {
      const s = yearFrac(c.date) ?? (c.year ? c.year + 0.5 : null);
      if (s !== null) ev.push({ at: s, date: monthYear(loc, c.date) ?? fmtYear(loc, c.year!), type: 'course', text: c.name, sub: c.issuer });
    }
    for (const p of data.publications) if (p.year) ev.push({ at: p.year + 0.5, date: fmtYear(loc, p.year), type: 'pub', text: p.title, sub: publicationLabel(t, 'pubType', p.type) });
    return ev.sort((a, b) => b.at - a.at);
  }, [data, loc, t]);
  const undatedRoles = data.experiences.filter((e) => yearFrac(e.start) === null);
  const undatedPubs = data.publications.filter((p) => !p.year);
  const thesis = data.publications.find((x) => x.type === 'Master Thesis');
  const p = data.person;

  const navIds = ['overview', 'trends', 'batch', 'equipment', 'recipes', 'qc', 'reports', 'alarms', 'operator'] as const;

  const faceplate = (u: Unit) => {
    switch (u.kind) {
      case 'tank':
        return (
          <dl className="grid grid-cols-[8rem_minmax(0,1fr)] gap-y-1.5 text-[14px]">
            <dt className="text-[#4a5560]">{t('reactor.fp.service')}</dt>
            <dd className="font-bold">{u.edu.degree}</dd>
            <dt className="text-[#4a5560]">{t('reactor.fp.site')}</dt>
            <dd>
              {u.edu.institution} · {u.edu.location}
            </dd>
            <dt className="text-[#4a5560]">{t('common.period')}</dt>
            <dd>{u.edu.period}</dd>
            {u.edu.gpa && (
              <>
                <dt className="text-[#4a5560]">{t('common.gpa')}</dt>
                <dd>
                  <bdi dir="ltr">{u.edu.gpa}</bdi>
                </dd>
              </>
            )}
            {u.edu.id === 'tehran' && thesis && (
              <>
                <dt className="text-[#4a5560]">{t('common.thesis')}</dt>
                <dd>
                  <bdi lang="en">{thesis.title}</bdi>
                </dd>
              </>
            )}
            <dt className="text-[#4a5560]">{t('reactor.fp.state')}</dt>
            <dd>
              <span className={u.edu.current ? 'rx-state-run' : 'rx-state'}>{u.edu.current ? t('reactor.status.running') : t('reactor.status.complete')}</span>
            </dd>
          </dl>
        );
      case 'reactor':
        return (
          <>
            <dl className="grid grid-cols-2 gap-2 sm:grid-cols-3">
              {readouts.map((r) => (
                <div key={r.tag} className="rx-readout-html rounded p-2">
                  <dt className="rx-mono text-[11px] text-[#4a5560]">
                    {r.tag} · {r.label}
                  </dt>
                  <dd className="rx-mono text-[20px] font-bold">{r.value}</dd>
                </div>
              ))}
            </dl>
            <h3 className="mt-4 text-[14px] font-bold">{t('reactor.fp.currentOps')}</h3>
            <ul className="mt-1 space-y-1 text-[14px]">
              {data.current.map((e) => (
                <li key={e.id}>
                  <b>{e.role}</b> — {e.org} <span className="text-[#4a5560]">({e.period})</span>
                </li>
              ))}
            </ul>
            <a href="#batch" onClick={() => setUnit(null)} className="mt-3 inline-block font-bold text-[#1f5fbf] underline">
              {t('reactor.fp.toBatch')}
            </a>
          </>
        );
      case 'column':
        return (
          <ul className="space-y-1.5 text-[14px]">
            {CATS.map((c, i) => (
              <li key={c} className="flex justify-between gap-4 border-b border-[#c3cad0] pb-1">
                <span>
                  <span className="rx-mono me-2 text-[12px] text-[#4a5560]">F-30{i + 1}</span>
                  {t(`categories.${c}`)}
                </span>
                <span className="rx-mono font-bold">{fmtNum(loc, catCounts[c])}</span>
              </li>
            ))}
          </ul>
        );
      case 'fraction': {
        const list = projects.filter((x) => x.category === u.cat);
        return (
          <ol className="space-y-1.5 text-[14px]">
            {list.map((x) => (
              <li key={x.id}>
                <a href={`#eq-${x.id}`} onClick={() => setUnit(null)} className="font-bold text-[#1f5fbf] underline" dir="auto">
                  {x.title}
                </a>
              </li>
            ))}
          </ol>
        );
      }
      case 'product':
        return (
          <ol className="space-y-2 text-[14px]">
            {data.publications.map((x) => (
              <li key={x.id}>
                <span className="rx-mono me-2 text-[12px] text-[#4a5560]">{publicationLabel(t, 'pubStatus', x.status)}</span>
                <bdi lang="en">{x.title}</bdi>
              </li>
            ))}
          </ol>
        );
    }
  };
  const unitTitle = (u: Unit) =>
    u.kind === 'tank'
      ? `${u.tag} · ${t('reactor.unit.tank')}`
      : u.kind === 'reactor'
        ? `${u.tag} · ${t('reactor.unit.reactor')}`
        : u.kind === 'column'
          ? `${u.tag} · ${t('reactor.unit.column')}`
          : u.kind === 'fraction'
            ? `${u.tag} · ${t(`categories.${u.cat}`)}`
            : `${u.tag} · ${t('reactor.unit.product')}`;

  return (
    <div className="reactor-root min-h-dvh">
      {/* HMI top bar */}
      <header className="sticky top-0 z-40 border-b-2 border-[#9aa3ab] bg-[#c9cfd4]">
        <div className="mx-auto flex h-12 max-w-[1320px] items-center gap-3 px-4 sm:px-6">
          <a href="#overview" className="rx-mono whitespace-nowrap text-[13px] font-bold">
            {t('reactor.brand')}
          </a>
          <nav aria-label={t('nav.menu')} className="ms-4 hidden flex-1 gap-1 overflow-hidden xl:flex">
            {navIds.map((k) => (
              <a key={k} href={`#${k}`} className="rx-navkey rounded px-2.5 py-1 text-[12.5px] font-bold">
                {t(`reactor.nav.${k}`)}
              </a>
            ))}
          </nav>
          <div className="ms-auto flex items-center gap-2">
            <Clock loc={loc} reduce={reduce} />
            <LocaleSwitcher className="rounded border border-[#9aa3ab] bg-[#e9ecee]" itemClassName="rx-mono h-7 min-w-8 px-2 text-[11px] font-bold" activeClassName="bg-[#1c252c] text-white" />
          </div>
        </div>
        {/* alarm banner */}
        <div className={cn('border-t border-[#9aa3ab]', acked ? 'bg-[#dfe4e8]' : 'bg-[#dce8f8]')}>
          <div className="mx-auto flex max-w-[1320px] flex-wrap items-center gap-x-3 gap-y-1 px-4 py-1.5 text-[12.5px] sm:px-6">
            <span className={cn('rx-mono rounded px-1.5 py-0.5 text-[11px] font-bold', acked ? 'bg-[#9aa3ab] text-[#1c252c]' : 'bg-[#1f5fbf] text-white')}>
              {t('reactor.alarm.info')} · {acked ? t('reactor.alarm.acked') : t('reactor.alarm.active')}
            </span>
            <span className="min-w-0 flex-1 truncate" title={p.availability}>
              {p.availability}
            </span>
            <a href="#alarms" className="rx-mono font-bold text-[#1f5fbf] underline">
              {t('reactor.alarm.view')}
            </a>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-[1320px] px-4 sm:px-6">
        {/* intro strip */}
        <section className="grid gap-6 pb-2 pt-8 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)] lg:items-end">
          <div>
            <p className="rx-mono text-[12px] font-bold uppercase tracking-[0.12em] text-[#4a5560] rtl:normal-case rtl:tracking-normal">{t('reactor.kicker')}</p>
            <h1 className="mt-1 text-[clamp(2.2rem,5vw,3.8rem)] font-bold leading-[1.05]">{p.displayName}</h1>
            <p className="mt-2 text-[17px]">{p.headline}</p>
            <p className="mt-2 max-w-2xl text-[15px] leading-relaxed text-[#4a5560]">{p.statement}</p>
          </div>
          <p className="rx-panel rounded-[6px] p-4 text-[13px] leading-relaxed text-[#1c252c]">
            <span className="rx-mono me-2 rounded bg-[#1c252c] px-1.5 py-0.5 text-[10.5px] uppercase text-white rtl:normal-case">{t('common.metaphor')}</span>
            {t('reactor.honesty')}
          </p>
        </section>

        {/* 1 overview */}
        <Screen id="overview" no={1} title={t('reactor.s.overview')} sub={t('reactor.s.overviewSub')}>
          <div ref={pidRef} data-paused={paused || reduce ? '' : undefined} className="rx-panel rx-pid relative overflow-x-auto rounded-[6px] p-2" role="region" aria-label={t('reactor.pidLabel')} tabIndex={0}>
            <div className="min-w-[900px]">
              <PID data={data} tanks={tanks} readouts={readouts} catCounts={catCounts} onOpen={setUnit} />
            </div>
          </div>
          <p className="mt-2 flex items-center gap-2 text-[12.5px] text-[#4a5560] lg:hidden">
            <MoveHorizontal className="size-4" aria-hidden /> {t('reactor.scrollHint')}
          </p>
          <details className="rx-panel mt-4 rounded-[6px]">
            <summary className="cursor-pointer px-4 py-3 text-[14px] font-bold">{t('reactor.textList')}</summary>
            <ol className="space-y-1.5 border-t border-[#c3cad0] px-4 py-3 text-[14px]">
              {tanks.map((e, i) => (
                <li key={e.id}>
                  <button type="button" onClick={() => setUnit({ kind: 'tank', tag: `T-10${i + 1}`, edu: e })} className="text-start underline">
                    T-10{i + 1}
                  </button>{' '}
                  — {e.degree} ({e.current ? t('reactor.status.running') : t('reactor.status.complete')})
                </li>
              ))}
              <li>
                <button type="button" onClick={() => setUnit({ kind: 'reactor', tag: 'R-201' })} className="underline">
                  R-201
                </button>{' '}
                — {t('reactor.unit.reactor')}: {readouts.map((r) => `${r.label} ${r.value}`).join(' · ')}
              </li>
              <li>
                <button type="button" onClick={() => setUnit({ kind: 'column', tag: 'C-301' })} className="underline">
                  C-301
                </button>{' '}
                — {t('reactor.unit.column')}: {CATS.map((c) => `${t(`categories.${c}`)} ${fmtNum(loc, catCounts[c])}`).join(' · ')}
              </li>
              <li>
                <button type="button" onClick={() => setUnit({ kind: 'product', tag: 'P-401' })} className="underline">
                  P-401
                </button>{' '}
                — {t('reactor.unit.product')}: {t('reactor.pubs', { count: data.publications.length })}
              </li>
            </ol>
          </details>
        </Screen>

        {/* 2 trends */}
        <Screen id="trends" no={2} title={t('reactor.s.trends')} sub={t('reactor.s.trendsSub')}>
          <Trends data={data} />
        </Screen>

        {/* 3 batch record */}
        <Screen id="batch" no={3} title={t('reactor.s.batch')} sub={t('reactor.s.batchSub', { count: data.experiences.length })}>
          <ol className="space-y-2">
            {data.experiences.map((e, i) => {
              const running = e.current || e.end === 'present';
              return (
                <li key={e.id} className="rx-panel grid gap-x-5 gap-y-1 rounded-[6px] p-4 md:grid-cols-[3rem_9.5rem_minmax(0,1fr)_8rem]">
                  <span className="rx-mono text-[13px] font-bold text-[#4a5560]">{fmtNum(loc, i + 1, { minimumIntegerDigits: 2 })}</span>
                  <span className="rx-mono text-[12.5px]">
                    {e.period || t('common.undated')}
                    {e.months ? <span className="block text-[#4a5560]">{t('common.months', { count: e.months })}</span> : null}
                  </span>
                  <div className="min-w-0">
                    <h3 className="text-[16px] font-bold leading-snug">{e.role}</h3>
                    <p className="text-[13.5px] text-[#4a5560]">
                      {t('reactor.unitLabel')}: {e.org}
                      {e.location ? ` · ${e.location}` : ''} · {t(`kinds.${e.kind}`)}
                    </p>
                    <Expandable text={e.description} lines={3} minChars={220} className="mt-1.5 text-[14.5px] leading-relaxed" buttonClassName="rx-mono text-[12px] font-bold text-[#1f5fbf]" />
                  </div>
                  <span className="md:text-end">
                    <span className={running ? 'rx-state-run' : e.start ? 'rx-state' : 'rx-state-na'}>{running ? t('reactor.status.running') : e.start ? t('reactor.status.complete') : t('reactor.status.na')}</span>
                  </span>
                </li>
              );
            })}
          </ol>
        </Screen>

        {/* 4 equipment = projects */}
        <Screen id="equipment" no={4} title={t('reactor.s.equipment')} sub={t('reactor.s.equipmentSub', { count: projects.length })}>
          <div className="space-y-10">
            {CATS.map((c, ci) => {
              const list = projects.filter((x) => x.category === c);
              return (
                <div key={c}>
                  <h3 className="rx-mono mb-3 flex items-center gap-3 text-[13px] font-bold uppercase rtl:normal-case">
                    <span className="rounded bg-[#1c252c] px-2 py-0.5 text-white">F-30{ci + 1}</span>
                    {t(`categories.${c}`)} · {fmtNum(loc, list.length)}
                  </h3>
                  <ShowAll
                    items={list}
                    initial={6}
                    getKey={(x) => x.id}
                    className="grid gap-3 md:grid-cols-2 xl:grid-cols-3"
                    buttonWrapClassName="mt-3"
                    buttonClassName="rx-btn rounded px-3 py-1.5 text-[13px] font-bold"
                    render={(x, i) => (
                      <article id={`eq-${x.id}`} className="rx-faceplate flex h-full scroll-mt-28 flex-col rounded-[6px] p-4">
                        <div className="flex items-center justify-between gap-2">
                          <span className="rx-mono text-[12px] font-bold">
                            EQ-{CAT_CODE[c]}-{fmtNum(loc, i + 1, { minimumIntegerDigits: 2 })}
                          </span>
                          <span className={x.featured ? 'rx-state-run' : 'rx-state'}>{x.featured ? t('reactor.status.inService') : t('reactor.status.archived')}</span>
                        </div>
                        <h4 className="mt-2 text-[16px] font-bold leading-snug" dir="auto">
                          {x.url ? (
                            <a href={x.url} target="_blank" rel="noreferrer" className="hover:underline">
                              {x.title}
                            </a>
                          ) : (
                            x.title
                          )}
                        </h4>
                        {x.metric && (
                          <p className="rx-mono mt-1 text-[13px] font-bold text-[#1d7a45]">
                            <bdi dir="ltr">{x.metric}</bdi>
                          </p>
                        )}
                        <p className="mt-2 text-[14px] leading-relaxed text-[#2f3b45]" dir="auto">
                          {x.description}
                        </p>
                        {x.tags.length > 0 && (
                          <p className="rx-mono mt-2 text-[11.5px] text-[#4a5560]" dir="ltr">
                            {x.tags.join(' · ')}
                          </p>
                        )}
                        <div className="mt-auto flex gap-4 pt-3 text-[13px] font-bold text-[#1f5fbf]">
                          {x.repo && (
                            <a href={x.url ?? `https://github.com/${x.repo}`} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 underline">
                              <BrandIcon name="github" className="size-3.5" /> {t('common.code')}
                            </a>
                          )}
                          {x.url && !x.repo && (
                            <a href={x.url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 underline">
                              {t('common.visit')} <ArrowUpRight className="size-3.5" aria-hidden />
                            </a>
                          )}
                        </div>
                      </article>
                    )}
                  />
                </div>
              );
            })}
          </div>
        </Screen>

        {/* 5 recipes = skills */}
        <Screen id="recipes" no={5} title={t('reactor.s.recipes')} sub={t('reactor.s.recipesSub', { count: data.skills.reduce((n, c) => n + c.groups.reduce((m, g) => m + g.items.length, 0), 0) })}>
          <div className="columns-1 gap-4 lg:columns-2">
            {data.skills.map((c, ci) => (
              <div key={c.id} className="rx-panel mb-4 break-inside-avoid overflow-hidden rounded-[6px]">
                <h3 className="flex items-center justify-between gap-3 bg-[#1c252c] px-4 py-2 text-[14px] font-bold text-white">
                  <span>{c.label}</span>
                  <span className="rx-mono text-[11.5px] text-[#c9d0d6]">RCP-{fmtNum(loc, ci + 1, { minimumIntegerDigits: 2 })}</span>
                </h3>
                <table className="w-full text-[13px]">
                  <tbody>
                    {c.groups.map((g) => (
                      <tr key={g.id} className="border-t border-[#c3cad0] align-top">
                        <th scope="row" className="w-[34%] px-4 py-2 text-start font-bold text-[#2f3b45]">
                          {g.label}
                        </th>
                        <td className="px-4 py-2">
                          {g.items.map((it, i) => (
                            <span key={it.key}>
                              {i > 0 && <span className="text-[#7b8790]"> · </span>}
                              <bdi title={it.long !== it.name ? it.long : undefined}>{it.name}</bdi>
                            </span>
                          ))}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ))}
          </div>
        </Screen>

        {/* 6 QC lab = courses */}
        <Screen id="qc" no={6} title={t('reactor.s.qc')} sub={t('sections.certifications.subtitle', { count: fmtNum(loc, data.certStats.count), hours: fmtNum(loc, data.certStats.hours), issuers: fmtNum(loc, data.certStats.issuers.length) })}>
          <dl className="mb-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
            {[
              { k: t('reactor.qc.certs'), v: fmtNum(loc, data.certStats.count) },
              { k: t('reactor.qc.hours'), v: fmtNum(loc, data.certStats.hours) },
              { k: t('reactor.qc.providers'), v: fmtNum(loc, data.certStats.issuers.length) },
              { k: t('reactor.qc.withLink'), v: fmtNum(loc, data.certifications.filter((c) => c.url).length) },
            ].map((x) => (
              <div key={x.k} className="rx-readout-html rounded-[6px] p-3">
                <dt className="text-[12px] text-[#4a5560]">{x.k}</dt>
                <dd className="rx-mono text-[24px] font-bold">{x.v}</dd>
              </div>
            ))}
          </dl>
          <ShowAll
            items={data.certifications}
            initial={12}
            getKey={(c) => c.name + c.issuer}
            className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3"
            buttonWrapClassName="mt-4"
            buttonClassName="rx-btn rounded px-3 py-1.5 text-[13px] font-bold"
            render={(c, i) => (
              <div className="rx-faceplate flex h-full flex-col rounded-[6px] p-3.5">
                <p className="rx-mono flex justify-between text-[11.5px] text-[#4a5560]">
                  <span>QC-{fmtNum(loc, i + 1, { minimumIntegerDigits: 3 })}</span>
                  <span>{monthYear(loc, c.date) ?? (c.year ? fmtYear(loc, c.year) : '')}</span>
                </p>
                <p className="mt-1 font-bold leading-snug">
                  <bdi lang="en">{c.name}</bdi>
                </p>
                <p className="text-[13px] text-[#4a5560]">
                  <bdi>{c.issuer}</bdi>
                </p>
                <p className="mt-auto flex items-center justify-between gap-2 pt-2 text-[13px]">
                  <span className="rx-mono font-bold">{c.hours ? t('common.hours', { count: fmtNum(loc, c.hours) }) : c.weeks ? t('common.weeks', { count: fmtNum(loc, c.weeks) }) : '—'}</span>
                  {c.url ? (
                    <a href={c.url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 font-bold text-[#1f5fbf] underline">
                      {t('common.certificate')} <ArrowUpRight className="flip-rtl size-3.5" aria-hidden />
                    </a>
                  ) : (
                    <span className="text-[12px] text-[#4a5560]">{t('reactor.qc.noLink')}</span>
                  )}
                </p>
              </div>
            )}
          />
        </Screen>

        {/* 7 reports + feed specs */}
        <Screen id="reports" no={7} title={t('reactor.s.reports')}>
          <div className="grid gap-8 lg:grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)]">
            <div>
              <h3 className="rx-mono mb-3 text-[13px] font-bold uppercase rtl:normal-case">P-401 · {t('sections.publications.title')}</h3>
              <ol className="space-y-3">
                {data.publications.map((pub) => (
                  <li key={pub.id} className="rx-faceplate rounded-[6px] p-4">
                    <p className="rx-mono text-[11.5px] text-[#4a5560]">
                      {publicationLabel(t, 'pubType', pub.type)} · {publicationLabel(t, 'pubStatus', pub.status)}
                      {pub.year ? ` · ${fmtYear(loc, pub.year)}` : ''}
                    </p>
                    <p lang="en" dir="ltr" className="mt-1 text-start text-[15.5px] font-bold leading-snug">
                      {pub.title}
                    </p>
                    <p className="mt-1 text-[13.5px] text-[#4a5560]">
                      <Authors ownerName={data.person.fullName} p={pub} meClassName="font-bold text-[#1c252c]" etAl={t('common.withCoAuthors')} />
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
                    <div className="mt-2 flex flex-wrap gap-4 text-[13px] font-bold">
                      {pub.url && (
                        <a href={pub.url} target="_blank" rel="noreferrer" dir="ltr" className="inline-flex items-center gap-1 text-[#1f5fbf] underline">
                          {pub.doi ? `doi:${pub.doi}` : t('common.visit')} <ArrowUpRight className="size-3.5" aria-hidden />
                        </a>
                      )}
                      {pub.bibtex && (
                        <CopyButton value={pub.bibtex} className="inline-flex items-center gap-1 hover:underline">
                          <Copy className="size-3.5" aria-hidden /> {t('common.copyBibtex')}
                        </CopyButton>
                      )}
                    </div>
                  </li>
                ))}
              </ol>
            </div>
            <div>
              <h3 className="rx-mono mb-3 text-[13px] font-bold uppercase rtl:normal-case">T-10x · {t('reactor.feedSpecs')}</h3>
              <ol className="space-y-3">
                {tanks.map((e, i) => (
                  <li key={e.id} className="rx-faceplate rounded-[6px] p-4">
                    <p className="rx-mono flex justify-between text-[11.5px] text-[#4a5560]">
                      <span>T-10{i + 1}</span>
                      <span className={e.current ? 'rx-state-run' : 'rx-state'}>{e.current ? t('reactor.status.running') : t('reactor.status.complete')}</span>
                    </p>
                    <h4 className="mt-1 text-[16px] font-bold leading-snug">{e.degree}</h4>
                    <p className="text-[14px]">{e.institution}</p>
                    <p className="text-[13px] text-[#4a5560]">
                      {e.location} · {e.period}
                      {e.gpa ? (
                        <>
                          {' · '}
                          {t('common.gpa')} <bdi dir="ltr">{e.gpa}</bdi>
                        </>
                      ) : null}
                    </p>
                    {e.id === 'tehran' && thesis && (
                      <p className="mt-1 text-[13px]">
                        {t('common.thesis')}: <bdi lang="en">{thesis.title}</bdi>
                      </p>
                    )}
                  </li>
                ))}
              </ol>
              <h3 className="rx-mono mb-3 mt-8 text-[13px] font-bold uppercase rtl:normal-case">{t('sections.languages.title')}</h3>
              <ul className="space-y-2">
                {data.languages.map((l) => (
                  <li key={l.id} className="rx-faceplate rounded-[6px] p-3 text-[14px]">
                    <b>{l.name}</b> — {l.level}
                    {l.cert && (
                      <span className="rx-mono block text-[12.5px] text-[#4a5560]">
                        {l.cert.test} {fmtNum(loc, l.cert.overall, { minimumFractionDigits: 1 })} · {(['listening', 'reading', 'writing', 'speaking'] as const).map((k) => `${t(`ielts.${k}`)} ${fmtNum(loc, l.cert!.bands[k], { minimumFractionDigits: 1 })}`).join(' · ')}
                      </span>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </Screen>

        {/* 8 alarms & events */}
        <Screen id="alarms" no={8} title={t('reactor.s.alarms')} sub={t('reactor.s.alarmsSub', { count: events.length })}>
          <div className={cn('mb-4 flex flex-wrap items-center gap-3 rounded-[6px] border-s-[6px] p-4', acked ? 'border-[#9aa3ab] bg-[#e9ecee]' : 'border-[#1f5fbf] bg-[#dce8f8]')}>
            {acked ? <BellOff className="size-5 text-[#4a5560]" aria-hidden /> : <Bell className="size-5 text-[#1f5fbf]" aria-hidden />}
            <div className="min-w-0 flex-1">
              <p className="rx-mono text-[12px] font-bold">
                AL-001 · {t('reactor.alarm.info')} · {acked ? t('reactor.alarm.acked') : t('reactor.alarm.active')}
              </p>
              <p className="text-[15px]">{p.availability}</p>
            </div>
            <button type="button" onClick={() => setAcked((a) => !a)} aria-pressed={acked} className="rx-btn rounded px-3 py-2 text-[13px] font-bold">
              {acked ? t('reactor.alarm.unack') : t('reactor.alarm.ack')}
            </button>
          </div>
          <div className="rx-panel relative max-h-[560px] overflow-y-auto rounded-[6px]" tabIndex={0} role="region" aria-label={t('reactor.s.alarms')}>
            <table className="w-full text-[13px]">
              <thead className="sticky top-0 bg-[#c9cfd4]">
                <tr>
                  <th scope="col" className="px-3 py-2 text-start">{t('reactor.ev.date')}</th>
                  <th scope="col" className="px-3 py-2 text-start">{t('reactor.ev.type')}</th>
                  <th scope="col" className="px-3 py-2 text-start">{t('reactor.ev.message')}</th>
                </tr>
              </thead>
              <tbody>
                {events.map((ev, i) => (
                  <tr key={i} className="border-t border-[#c3cad0] align-top">
                    <td className="rx-mono whitespace-nowrap px-3 py-1.5">{ev.date}</td>
                    <td className="px-3 py-1.5">
                      <span className={cn('rx-mono rounded px-1.5 py-0.5 text-[11px] font-bold', ev.type === 'start' ? 'rx-ev-start' : ev.type === 'end' ? 'rx-ev-end' : 'rx-ev-info')}>{t(`reactor.ev.${ev.type}`)}</span>
                    </td>
                    <td className="px-3 py-1.5">
                      <bdi>{ev.text}</bdi> <span className="text-[#4a5560]">— <bdi>{ev.sub}</bdi></span>
                    </td>
                  </tr>
                ))}
                {[...undatedRoles.map((e) => ({ k: e.id, text: e.role, sub: e.org })), ...undatedPubs.map((x) => ({ k: x.id, text: x.title, sub: publicationLabel(t, 'pubStatus', x.status) }))].map((u) => (
                  <tr key={u.k} className="border-t border-[#c3cad0] align-top">
                    <td className="rx-mono px-3 py-1.5 text-[#4a5560]">{t('common.undated')}</td>
                    <td className="px-3 py-1.5">
                      <span className="rx-mono rx-ev-end rounded px-1.5 py-0.5 text-[11px] font-bold">{t('reactor.ev.note')}</span>
                    </td>
                    <td className="px-3 py-1.5">
                      <bdi>{u.text}</bdi> <span className="text-[#4a5560]">— <bdi>{u.sub}</bdi></span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Screen>

        {/* 9 call operator */}
        <Screen id="operator" no={9} title={t('reactor.s.operator')}>
          <div className="rx-faceplate grid gap-6 rounded-[6px] p-6 md:grid-cols-[minmax(0,1fr)_auto] md:items-center">
            <div>
              <h3 className="text-[clamp(1.5rem,3vw,2.2rem)] font-bold leading-tight">{t('sections.contact.title')}</h3>
              <p className="mt-2 max-w-2xl text-[15px] leading-relaxed text-[#2f3b45]">
                {p.availability} {t('sections.contact.subtitle')}
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <a href={data.links.email} dir="ltr" className="rx-btn-primary inline-flex items-center gap-2 break-all rounded px-4 py-2.5 text-[14.5px] font-bold">
                <Mail className="size-4 shrink-0" aria-hidden /> {p.email}
              </a>
              {(['github', 'linkedin', 'orcid', 'scholar'] as const).map((k) =>
                data.links[k] ? (
                  <a key={k} href={data.links[k]!} target="_blank" rel="noreferrer" aria-label={k} className="rx-btn grid size-10 place-items-center rounded">
                    <BrandIcon name={k} className="size-4" />
                  </a>
                ) : null,
              )}
            </div>
          </div>
        </Screen>

        <footer className="flex flex-wrap justify-between gap-3 border-t-2 border-[#9aa3ab] pb-24 pt-6 text-[12.5px] text-[#4a5560]">
          <span>{t('common.rights', { year: fmtYear(loc, new Date(data.generatedAt).getUTCFullYear()) })}</span>
          <span>{t('reactor.footer')}</span>
        </footer>
      </main>

      <Dialog
        open={!!unit}
        onClose={() => setUnit(null)}
        title={unit ? unitTitle(unit) : ''}
        className="rx-dialog max-w-xl rounded-[8px] border-2 border-[#9aa3ab] bg-[#e9ecee] p-5 text-[#1c252c] shadow-2xl"
        closeClassName="border border-[#9aa3ab] bg-[#d6dadd] hover:bg-[#c9cfd4]"
      >
        {unit && <div className="mt-4">{faceplate(unit)}</div>}
      </Dialog>
    </div>
  );
}
