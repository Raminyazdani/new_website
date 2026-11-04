'use client';

import { useEffect, useMemo, useState } from 'react';
import { useTranslations } from 'next-intl';
import { ArrowUpRight, Copy, Mail, TrainFront } from 'lucide-react';
import { Authors } from '@/components/kit/Authors';
import { Expandable } from '@/components/kit/Expandable';
import { ShowAll } from '@/components/kit/ShowAll';
import { BrandIcon } from '@/components/shared/BrandIcon';
import { CopyButton } from '@/components/shared/CopyButton';
import { LocaleSwitcher } from '@/components/shared/LocaleSwitcher';
import { allProjects } from '@/lib/derive';
import { dot, fmtNum, fmtYear, numberLocale, publicationLabel } from '@/lib/format';
import type { ProjectCategory, SiteData } from '@/lib/types';
import { buildStations, LINES, lineOf, NetworkMap, StationSign, stationOrg, stationTitle, type LineId, type Station } from './NetworkMap';
import './metro.css';

const CAT_LINE: Record<ProjectCategory, { color: string; letter: string }> = {
  omics: { color: '#00843d', letter: 'O' },
  structural: { color: '#7a3f97', letter: 'S' },
  ml: { color: '#d8232a', letter: 'M' },
  software: { color: '#0067b1', letter: 'W' },
  biotech: { color: '#9b5b2b', letter: 'L' },
};

/** "2026-09" / "2026-09-15" → "Sep 2026" (Persian digits on /fa); "2026" → "2026" */
const monthYear = (loc: string, s: string | null) => {
  if (!s) return '—';
  const [y, m] = s.split('-').map(Number);
  if (!m) return fmtYear(loc, y);
  return new Intl.DateTimeFormat(numberLocale(loc), { month: 'short', year: 'numeric', timeZone: 'UTC' }).format(new Date(Date.UTC(y, m - 1, 1)));
};

function Bullet({ color, letter, size = 28 }: { color: string; letter: string; size?: number }) {
  return (
    <span className="grid shrink-0 place-items-center rounded-full font-extrabold text-white" style={{ background: color, width: size, height: size, fontSize: size * 0.46 }} lang="en" aria-hidden>
      {letter}
    </span>
  );
}

function SectionHead({ title, sub, kicker }: { title: string; sub?: string; kicker?: string }) {
  return (
    <div className="mb-8">
      {kicker && <p className="mb-1 text-[13px] font-bold uppercase tracking-[0.14em] text-[#c01f26] rtl:normal-case rtl:tracking-normal">{kicker}</p>}
      <h2 className="text-[clamp(1.8rem,3.4vw,2.8rem)] font-extrabold leading-tight tracking-[-0.01em] rtl:tracking-normal">{title}</h2>
      {sub && <p className="mt-2 max-w-3xl text-[16px] leading-relaxed text-[var(--m-muted)]">{sub}</p>}
    </div>
  );
}

/* ─────────────────────────────── departure board ─────────────────────────────── */

function Clock({ loc }: { loc: string }) {
  const t = useTranslations();
  const [now, setNow] = useState<Date | null>(null);
  useEffect(() => {
    const tick = () => setNow(new Date());
    tick();
    const id = window.setInterval(tick, 20_000);
    return () => window.clearInterval(id);
  }, []);
  const s = now ? new Intl.DateTimeFormat(numberLocale(loc), { hour: '2-digit', minute: '2-digit', hourCycle: 'h23', timeZone: 'Europe/Berlin' }).format(now) : '--:--';
  return (
    <span className="flex items-center gap-2" title={t('common.localTime')}>
      <span className="sr-only">{t('common.localTime')}</span>
      <span className="mt-led mt-mono text-[15px] font-semibold" dir="ltr">
        {s}
      </span>
    </span>
  );
}

function Board({ data }: { data: SiteData }) {
  const t = useTranslations();
  const loc = data.locale;
  return (
    <div className="mt-board overflow-hidden rounded-[14px] border-[6px] border-[#2a2a2a] bg-[#0e0e0e] shadow-[0_30px_60px_-30px_rgb(0_0_0/0.6)]">
      <div className="flex items-center justify-between gap-3 border-b border-[#2b2b2b] px-4 py-2.5">
        <span className="mt-led flex items-center gap-2 text-[14px] font-semibold uppercase tracking-[0.16em] rtl:tracking-normal">
          <TrainFront className="size-4" aria-hidden /> {t('metro.boardTitle')}
        </span>
        <Clock loc={loc} />
      </div>
      <table className="w-full text-start text-[13.5px]">
        <caption className="sr-only">{t('metro.boardTitle')}</caption>
        <thead>
          <tr className="mt-led-dim text-[11px] uppercase tracking-wider rtl:tracking-normal">
            <th scope="col" className="px-4 pb-1 pt-2 text-start font-normal">
              {t('metro.boardTime')}
            </th>
            <th scope="col" className="px-2 pb-1 pt-2 text-start font-normal">
              {t('metro.boardDest')}
            </th>
            <th scope="col" className="hidden px-2 pb-1 pt-2 text-start font-normal sm:table-cell">
              {t('metro.boardOperator')}
            </th>
            <th scope="col" className="px-4 pb-1 pt-2 text-end font-normal">
              {t('metro.boardStatus')}
            </th>
          </tr>
        </thead>
        <tbody>
          {data.current.map((e, i) => (
            <tr key={e.id} className="border-t border-[#1f1f1f] align-top">
              <td className="mt-led mt-flip mt-mono whitespace-nowrap px-4 py-2.5" style={{ animationDelay: `${i * 0.18}s` }}>
                {monthYear(loc, e.start)}
              </td>
              <td className="mt-led mt-flip px-2 py-2.5 font-semibold" style={{ animationDelay: `${i * 0.18 + 0.06}s` }}>
                {e.role}
                <span className="mt-led-dim block font-normal sm:hidden">{e.org}</span>
              </td>
              <td className="mt-led-dim hidden px-2 py-2.5 sm:table-cell">{e.org}</td>
              <td className="mt-led whitespace-nowrap px-4 py-2.5 text-end">{e.end === 'present' ? t('metro.ongoing') : t('metro.until', { date: monthYear(loc, e.end) })}</td>
            </tr>
          ))}
          <tr className="border-t border-[#1f1f1f]">
            <td className="mt-led whitespace-nowrap px-4 py-3 font-semibold">
              <span className="mt-blink me-2 inline-block size-2 rounded-full bg-[#ffb000] align-middle" aria-hidden />
              {t('metro.next')}
            </td>
            <td colSpan={3} className="mt-led px-2 py-3 pe-4">
              {data.person.availability}
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  );
}

/* ─────────────────────────────── design ─────────────────────────────── */

export default function MetroDesign({ data }: { data: SiteData }) {
  const t = useTranslations();
  const loc = data.locale;
  const { stations, undated } = useMemo(() => buildStations(data), [data]);
  const projects = useMemo(() => allProjects(data), [data]);
  const [sel, setSel] = useState<Station | null>(() => stations.find((s) => s.kind === 'role' && data.current[0] && s.item.id === data.current[0].id) ?? null);
  const [hl, setHl] = useState<LineId | null>(null);
  const p = data.person;
  const lineName = (id: LineId) => (id === 'education' ? t('sections.education.title') : t(`kinds.${id}`));

  return (
    <div className="metro-root min-h-dvh">
      <header className="sticky top-0 z-40 border-b-[5px] border-[#1a1a1a] bg-white">
        <div className="mx-auto flex h-14 max-w-[1400px] items-center gap-4 px-4 sm:px-6">
          <a href="#top" className="flex items-center gap-2.5 font-extrabold">
            <span className="relative grid size-9 place-items-center" aria-hidden>
              <span className="absolute inset-0 rounded-full border-[5px] border-[#d8232a]" />
              <span className="absolute inset-x-[-4px] top-1/2 h-[10px] -translate-y-1/2 bg-[#0067b1]" />
              <span className="relative text-[9.5px] font-extrabold leading-none text-white" lang="en">
                RY
              </span>
            </span>
            <span className="text-[15px]">{t('metro.brand')}</span>
          </a>
          <nav aria-label={t('nav.menu')} className="ms-auto hidden gap-1 text-[14px] font-semibold lg:flex">
            {(['map', 'lines', 'zones', 'timetable', 'contact'] as const).map((k) => (
              <a key={k} href={`#${k}`} className="rounded px-3 py-1.5 hover:bg-[#f2f2ee]">
                {t(`metro.nav.${k}`)}
              </a>
            ))}
          </nav>
          <LocaleSwitcher className="ms-auto rounded border-2 border-[#1a1a1a] lg:ms-2" itemClassName="h-8 min-w-8 px-2 text-xs font-bold" activeClassName="bg-[#1a1a1a] text-white" />
        </div>
      </header>

      <main className="mx-auto max-w-[1400px] px-4 sm:px-6">
        {/* hero + departure board */}
        <section id="top" className="grid items-center gap-10 py-12 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)] lg:py-16">
          <div>
            <p className="flex flex-wrap items-center gap-1.5 text-[13px] font-bold uppercase tracking-[0.14em] text-[var(--m-muted)] rtl:tracking-normal">
              {LINES.map((l) => (
                <Bullet key={l.id} color={l.color} letter={l.letter} size={20} />
              ))}
              <span className="ms-1.5">{t('metro.kicker')}</span>
            </p>
            <h1 className="mt-5 text-[clamp(2.6rem,6vw,5rem)] font-black leading-[0.98] tracking-[-0.02em] rtl:leading-[1.15] rtl:tracking-normal">{p.displayName}</h1>
            <p className="mt-4 text-[clamp(1.1rem,1.9vw,1.4rem)] font-semibold">{p.headline}</p>
            <p className="mt-4 max-w-xl text-[16.5px] leading-relaxed text-[var(--m-muted)]">{p.statement}</p>
            <div className="mt-7 flex flex-wrap gap-3">
              <a href="#map" className="rounded-full bg-[#0067b1] px-5 py-2.5 text-[14px] font-bold text-white hover:bg-[#00558f]">
                {t('metro.ctaMap')}
              </a>
              <a href={data.links.email} className="inline-flex items-center gap-2 rounded-full border-2 border-[#1a1a1a] px-5 py-2 text-[14px] font-bold hover:bg-[#f2f2ee]">
                <Mail className="size-4" aria-hidden /> {t('common.sendEmail')}
              </a>
            </div>
          </div>
          <Board data={data} />
        </section>

        {/* network map */}
        <section id="map" aria-labelledby="mt-map-title" className="scroll-mt-20 py-10">
          <div className="mb-6">
            <h2 id="mt-map-title" className="text-[clamp(1.8rem,3.4vw,2.8rem)] font-extrabold leading-tight tracking-[-0.01em] rtl:tracking-normal">
              {t('metro.mapTitle')}
            </h2>
            <p className="mt-2 max-w-3xl text-[16px] leading-relaxed text-[var(--m-muted)]">{t('metro.mapSub')}</p>
            <p className="mt-2 text-[13px] text-[var(--m-muted)]">
              <span className="me-1.5 rounded bg-[#1a1a1a] px-1.5 py-0.5 text-[11px] font-bold uppercase text-white rtl:normal-case">{t('common.metaphor')}</span>
              {t('metro.metaphorNote')}
            </p>
          </div>
          <div className="rounded-[16px] border-2 border-[#1a1a1a] bg-white p-3 sm:p-5">
            <NetworkMap data={data} stations={stations} selected={sel?.id ?? null} onSelect={setSel} hl={hl} onHl={setHl} />
          </div>
          <div className="mt-5 grid gap-5 min-[900px]:grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)]">
            <div className="max-[899px]:hidden" aria-live="polite">
              {sel ? <StationSign s={sel} data={data} /> : <p className="rounded-[12px] border border-dashed border-[#9a9a94] bg-white p-5 text-[14px] text-[var(--m-muted)]">{t('metro.selectPrompt')}</p>}
            </div>
            <div className="rounded-[12px] border border-[var(--m-line)] bg-white p-5">
              <h3 className="text-[16px] font-extrabold">{t('metro.undatedTitle')}</h3>
              <p className="mt-1 text-[13.5px] text-[var(--m-muted)]">{t('metro.undatedNote')}</p>
              <ul className="mt-4 space-y-4">
                {undated.map((e) => (
                  <li key={e.id} className="flex gap-3">
                    <Bullet color={lineOf(e.kind).color} letter={lineOf(e.kind).letter} size={22} />
                    <div className="min-w-0">
                      <p className="font-bold leading-snug">{e.role}</p>
                      <p className="text-[13.5px] text-[var(--m-muted)]">
                        {e.org}
                        {e.location ? ` · ${e.location}` : ''} · {lineName(e.kind)}
                      </p>
                      <Expandable text={e.description} lines={3} minChars={200} className="mt-1 text-[14px] leading-relaxed" buttonClassName="text-[12.5px] font-bold text-[#0067b1]" />
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          </div>
          {/* line guide: every station as text */}
          <details className="mt-details mt-5 rounded-[12px] border border-[var(--m-line)] bg-white">
            <summary className="cursor-pointer list-none px-5 py-4 text-[15px] font-bold [&::-webkit-details-marker]:hidden">{t('metro.lineGuide', { count: stations.length })}</summary>
            <div className="grid gap-8 border-t border-[var(--m-line)] p-5 md:grid-cols-2">
              {LINES.map((l) => (
                <div key={l.id}>
                  <h3 className="flex items-center gap-2 text-[16px] font-extrabold">
                    <Bullet color={l.color} letter={l.letter} size={22} /> {lineName(l.id)}
                  </h3>
                  <ol className="ms-[8px] mt-3 border-s-[5px] ps-4" style={{ borderColor: l.color }}>
                    {stations
                      .filter((s) => s.line === l.id)
                      .map((s) => (
                        <li key={s.id} className="pb-4">
                          <button type="button" onClick={() => setSel(s)} className="text-start font-bold leading-snug hover:underline">
                            {stationTitle(s)}
                          </button>
                          <p className="text-[13px] text-[var(--m-muted)]">
                            {stationOrg(s)}
                            {s.item.location ? dot(loc) + s.item.location : ''}
                            {dot(loc)}
                            {s.item.period}
                            {s.kind === 'role' && s.item.months ? dot(loc) + t('common.months', { count: s.item.months }) : ''}
                            {s.kind === 'education' && s.item.gpa ? (
                              <>
                                {' · '}
                                {t('common.gpa')} <bdi dir="ltr">{s.item.gpa}</bdi>
                              </>
                            ) : null}
                          </p>
                          {s.kind === 'role' && <p className="mt-1 text-[14px] leading-relaxed">{s.item.description}</p>}
                        </li>
                      ))}
                  </ol>
                </div>
              ))}
            </div>
          </details>
        </section>

        {/* project lines */}
        <section id="lines" className="scroll-mt-20 py-14">
          <SectionHead title={t('metro.projectLinesTitle')} sub={t('metro.projectLinesSub', { count: projects.length })} />
          <div className="grid items-start gap-5 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-5">
            {(Object.keys(CAT_LINE) as ProjectCategory[]).map((c) => {
              const list = projects.filter((pr) => pr.category === c);
              if (!list.length) return null;
              return (
                <div key={c} className="rounded-[14px] border border-[var(--m-line)] bg-white p-4">
                  <h3 className="flex items-center gap-2 text-[15.5px] font-extrabold">
                    <Bullet color={CAT_LINE[c].color} letter={CAT_LINE[c].letter} size={26} />
                    {t(`categories.${c}`)}
                  </h3>
                  <p className="ms-[34px] text-[12.5px] text-[var(--m-muted)]">{t('common.count.projects', { count: list.length })}</p>
                  <ShowAll
                    items={list}
                    initial={6}
                    getKey={(pr) => pr.id}
                    as="ol"
                    className="ms-[10px] mt-3 border-s-[6px] ps-4"
                    buttonWrapClassName="mt-1 ms-[10px]"
                    buttonClassName="rounded-full border-2 border-[#1a1a1a] px-3 py-1 text-[12.5px] font-bold hover:bg-[#f2f2ee]"
                    render={(pr) => (
                      <div className="relative pb-4" style={{ '--c': CAT_LINE[c].color } as React.CSSProperties}>
                        <span className="absolute -start-[25px] top-1 size-3 rounded-full border-[3px] bg-white" style={{ borderColor: CAT_LINE[c].color }} aria-hidden />
                        <p className="text-[14px] font-bold leading-snug" dir="auto">
                          {pr.url ? (
                            <a href={pr.url} target="_blank" rel="noreferrer" className="hover:underline">
                              {pr.title}
                            </a>
                          ) : (
                            pr.title
                          )}
                          {pr.metric && (
                            <bdi className="ml-1.5 whitespace-nowrap text-[12.5px] font-extrabold text-[#c01f26] rtl:ml-0 rtl:mr-1.5" dir="ltr">
                              {pr.metric}
                            </bdi>
                          )}
                        </p>
                        <Expandable text={pr.description} lines={3} minChars={140} className="mt-1 text-[13.5px] leading-relaxed text-[var(--m-muted)]" buttonClassName="text-[12px] font-bold text-[#0067b1]" />
                        {pr.tags.length > 0 && (
                          <p className="mt-mono mt-1.5 text-[11.5px] text-[var(--m-muted)]" dir="ltr">
                            {pr.tags.join(' · ')}
                          </p>
                        )}
                        {pr.repo && pr.repo !== pr.url && (
                          <a href={pr.url ?? `https://github.com/${pr.repo}`} target="_blank" rel="noreferrer" className="mt-1 inline-flex items-center gap-1 text-[12px] font-bold text-[#0067b1] hover:underline">
                            <BrandIcon name="github" className="size-3.5" /> {t('common.code')}
                          </a>
                        )}
                      </div>
                    )}
                  />
                </div>
              );
            })}
          </div>
        </section>

        {/* fare zones = skills */}
        <section id="zones" className="scroll-mt-20 py-14">
          <SectionHead title={t('metro.zonesTitle')} sub={t('metro.zonesSub', { count: data.domains.length })} />
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {data.domains.map((d, i) => (
              <div key={d.id} className="overflow-hidden rounded-[14px] border border-[var(--m-line)] bg-white">
                <div className="flex items-center justify-between gap-3 px-4 py-2.5" style={{ background: `oklch(0.93 0.05 ${d.hue})` }}>
                  <h3 className="font-extrabold">
                    <span className="me-2 rounded bg-[#1a1a1a] px-1.5 py-0.5 text-[12px] text-white">{t('metro.zone', { n: i + 1 })}</span>
                    {t(`domains.${d.id}`)}
                  </h3>
                  <span className="mt-mono text-[12.5px] font-semibold">{fmtNum(loc, d.count)}</span>
                </div>
                <ul className="flex flex-wrap gap-1.5 p-4 text-[13px]">
                  {d.items.map((it) => (
                    <li key={it.key} title={it.long !== it.name ? it.long : undefined} className="rounded-full border border-[var(--m-line)] px-2.5 py-1">
                      <bdi>{it.name}</bdi>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
            <div className="overflow-hidden rounded-[14px] border border-[var(--m-line)] bg-white">
              <div className="flex items-center justify-between gap-3 bg-[#ececea] px-4 py-2.5">
                <h3 className="font-extrabold">
                  <span className="me-2 rounded bg-[#1a1a1a] px-1.5 py-0.5 text-[12px] text-white">{t('metro.zone', { n: 0 })}</span>
                  {t('common.softSkills')}
                </h3>
                <span className="mt-mono text-[12.5px] font-semibold">{fmtNum(loc, data.softSkills.length)}</span>
              </div>
              <ul className="flex flex-wrap gap-1.5 p-4 text-[13px]">
                {data.softSkills.map((s) => (
                  <li key={s.key} className="rounded-full border border-[var(--m-line)] px-2.5 py-1">
                    {s.name}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </section>

        {/* timetable = courses */}
        <section id="timetable" className="scroll-mt-20 py-14">
          <SectionHead
            title={t('metro.timetableTitle')}
            sub={t('sections.certifications.subtitle', { count: fmtNum(loc, data.certStats.count), hours: fmtNum(loc, data.certStats.hours), issuers: fmtNum(loc, data.certStats.issuers.length) })}
          />
          <div className="overflow-hidden rounded-[10px] border-2 border-[#1a1a1a] bg-[#ffd400]">
            <p className="flex items-center gap-2 px-4 py-2.5 text-[18px] font-black">
              <TrainFront className="size-5" aria-hidden /> {t('metro.departures')}
            </p>
            <div className="hidden grid-cols-[7.5rem_minmax(0,1fr)_12rem_5.5rem_7.5rem] gap-3 border-y-2 border-[#1a1a1a] px-4 py-2 text-[12px] font-bold uppercase md:grid rtl:normal-case" aria-hidden>
              <span>{t('metro.colDate')}</span>
              <span>{t('metro.colCourse')}</span>
              <span>{t('metro.colOperator')}</span>
              <span className="text-end">{t('metro.colDuration')}</span>
              <span className="text-end">{t('metro.colTicket')}</span>
            </div>
            <ShowAll
              items={data.certifications}
              initial={12}
              getKey={(c) => c.name + c.issuer}
              as="ol"
              className="bg-white"
              buttonWrapClassName="border-t-2 border-[#1a1a1a] bg-white px-4 py-3"
              buttonClassName="rounded-full border-2 border-[#1a1a1a] bg-[#ffd400] px-4 py-1.5 text-[13px] font-bold hover:bg-[#ffe14d]"
              render={(c) => (
                <div className="grid grid-cols-[minmax(0,1fr)_auto] gap-x-3 gap-y-0.5 border-b border-[#e5e5e0] px-4 py-2.5 text-[14px] md:grid-cols-[7.5rem_minmax(0,1fr)_12rem_5.5rem_7.5rem] md:items-baseline">
                  <span className="mt-mono text-[13px] font-semibold">{monthYear(loc, c.date ?? (c.year ? String(c.year) : null))}</span>
                  <span className="col-span-2 font-bold md:col-span-1">
                    <bdi lang="en">{c.name}</bdi>
                  </span>
                  <span className="text-[13.5px] text-[var(--m-muted)] max-md:col-start-1 max-md:row-start-3">
                    <bdi>{c.issuer}</bdi>
                  </span>
                  <span className="mt-mono text-end text-[13px] max-md:col-start-2 max-md:row-start-1">{c.hours ? t('common.hours', { count: fmtNum(loc, c.hours) }) : c.weeks ? t('common.weeks', { count: fmtNum(loc, c.weeks) }) : ''}</span>
                  <span className="text-end max-md:col-start-2 max-md:row-start-3">
                    {c.url ? (
                      <a href={c.url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-[13px] font-bold text-[#0067b1] hover:underline">
                        {t('common.certificate')} <ArrowUpRight className="flip-rtl size-3.5" aria-hidden />
                      </a>
                    ) : null}
                  </span>
                </div>
              )}
            />
          </div>
        </section>

        {/* terminus + announcements */}
        <section className="grid gap-10 py-14 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
          <div>
            <SectionHead kicker={t('metro.terminusTitle')} title={t('sections.publications.title')} />
            <ol className="space-y-4">
              {data.publications.map((pub) => (
                <li key={pub.id} className="rounded-[12px] border border-[var(--m-line)] bg-white p-5">
                  <p className="text-[12.5px] font-bold uppercase tracking-wide text-[var(--m-muted)] rtl:normal-case rtl:tracking-normal">
                    {publicationLabel(t, 'pubType', pub.type)} · {publicationLabel(t, 'pubStatus', pub.status)}
                    {pub.year ? ` · ${fmtYear(loc, pub.year)}` : ''}
                  </p>
                  <p lang="en" dir="ltr" className="mt-1.5 text-start text-[16px] font-extrabold leading-snug">
                    {pub.title}
                  </p>
                  <p className="mt-1 text-[14px] text-[var(--m-muted)]">
                    <Authors ownerName={data.person.fullName} p={pub} meClassName="font-bold text-[#1a1a1a]" etAl={t('common.withCoAuthors')} />
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
                  <div className="mt-2 flex flex-wrap gap-4 text-[13.5px] font-bold">
                    {pub.url && (
                      <a href={pub.url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-[#0067b1] hover:underline" dir="ltr">
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
            <SectionHead kicker={t('metro.announcementsTitle')} title={t('sections.languages.title')} />
            <ul className="space-y-4">
              {data.languages.map((l) => (
                <li key={l.id} className="rounded-[12px] border border-[var(--m-line)] bg-white p-5">
                  <p className="flex items-center gap-2 text-[17px] font-extrabold">
                    <span className="mt-blink-dot size-2.5 rounded-full bg-[#d8232a]" aria-hidden />
                    {l.name}
                  </p>
                  <p className="text-[14px] text-[var(--m-muted)]">{l.level}</p>
                  {l.cert && (
                    <dl className="mt-3 grid grid-cols-5 gap-1 text-center text-[12px]">
                      <div className="rounded bg-[#1a1a1a] px-1 py-1.5 text-white">
                        <dt>{t('ielts.overall')}</dt>
                        <dd className="text-[15px] font-black">{fmtNum(loc, l.cert.overall, { minimumFractionDigits: 1 })}</dd>
                      </div>
                      {(['listening', 'reading', 'writing', 'speaking'] as const).map((k) => (
                        <div key={k} className="rounded bg-[#f2f2ee] px-1 py-1.5">
                          <dt className="truncate">{t(`ielts.${k}`)}</dt>
                          <dd className="text-[15px] font-black">{fmtNum(loc, l.cert!.bands[k], { minimumFractionDigits: 1 })}</dd>
                        </div>
                      ))}
                    </dl>
                  )}
                </li>
              ))}
            </ul>
          </div>
        </section>

        {/* ticket = contact */}
        <section id="contact" className="scroll-mt-20 py-14">
          <div className="mt-ticket relative mx-auto grid max-w-4xl overflow-hidden rounded-[18px] border-2 border-[#1a1a1a] bg-white md:grid-cols-[minmax(0,1fr)_15rem]">
            <div className="p-6 sm:p-8">
              <p className="text-[12.5px] font-bold uppercase tracking-[0.14em] text-[#c01f26] rtl:normal-case rtl:tracking-normal">{t('metro.ticketTitle')}</p>
              <h2 className="mt-2 text-[clamp(1.7rem,3.2vw,2.6rem)] font-black leading-tight">{t('sections.contact.title')}</h2>
              <p className="mt-3 text-[15.5px] leading-relaxed text-[var(--m-muted)]">
                {p.availability} {t('sections.contact.subtitle')}
              </p>
              <a href={data.links.email} dir="ltr" className="mt-5 inline-block break-all text-[clamp(1.1rem,2vw,1.4rem)] font-black text-[#0067b1] hover:underline">
                {p.email}
              </a>
              <div className="mt-5 flex flex-wrap gap-2">
                {(['github', 'linkedin', 'orcid', 'scholar'] as const).map((k) =>
                  data.links[k] ? (
                    <a key={k} href={data.links[k]!} target="_blank" rel="noreferrer" aria-label={k} className="grid size-10 place-items-center rounded-full border-2 border-[#1a1a1a] hover:bg-[#f2f2ee]">
                      <BrandIcon name={k} className="size-4" />
                    </a>
                  ) : null,
                )}
              </div>
            </div>
            <div className="mt-stub border-t-2 border-dashed border-[#1a1a1a] bg-[#f2f2ee] p-6 md:border-s-2 md:border-t-0">
              <dl className="space-y-3 text-[13px]">
                <div>
                  <dt className="font-bold uppercase text-[var(--m-muted)] rtl:normal-case">{t('metro.ticketFrom')}</dt>
                  <dd className="text-[15px] font-extrabold">{data.journey[0]?.city}</dd>
                </div>
                <div>
                  <dt className="font-bold uppercase text-[var(--m-muted)] rtl:normal-case">{t('metro.ticketVia')}</dt>
                  <dd className="text-[15px] font-extrabold">{data.journey.slice(1).map((j) => j.city).join(' · ')}</dd>
                </div>
                <div>
                  <dt className="font-bold uppercase text-[var(--m-muted)] rtl:normal-case">{t('metro.ticketTo')}</dt>
                  <dd className="text-[15px] font-extrabold">{t('metro.ticketAny')}</dd>
                </div>
                <div>
                  <dt className="font-bold uppercase text-[var(--m-muted)] rtl:normal-case">{t('metro.ticketValid')}</dt>
                  <dd className="text-[15px] font-extrabold">{p.location}</dd>
                </div>
              </dl>
            </div>
          </div>
          <footer className="mt-12 flex flex-wrap justify-between gap-3 pb-20 text-[12.5px] text-[var(--m-muted)]">
            <span>{t('common.rights', { year: fmtYear(loc, new Date(data.generatedAt).getUTCFullYear()) })}</span>
            <span>{t('metro.footer')}</span>
          </footer>
        </section>
      </main>
    </div>
  );
}
