'use client';

import { useMemo, useState } from 'react';
import { useTranslations } from 'next-intl';
import { ArrowUpRight, Copy, Mail } from 'lucide-react';
import { Authors } from '@/components/kit/Authors';
import { BrandIcon } from '@/components/shared/BrandIcon';
import { CopyButton } from '@/components/shared/CopyButton';
import { LocaleSwitcher } from '@/components/shared/LocaleSwitcher';
import { fmtNum, fmtYear, publicationLabel } from '@/lib/format';
import type { SiteData } from '@/lib/types';
import { cn } from '@/lib/utils';
import { CircosFigure, domColor, GraphicalAbstract, KIND_COLOR, numSep, PlasmidFigure, RingsFigure, ringYears, SankeyFigure } from './Figures';
import { chordMatrix, circosModel, plasmidFeatures, type Chord, type Feature } from './model';
import './circos.css';

function FigureBlock({ n, id, title, caption, children, alt }: { n: number; id: string; title: string; caption: React.ReactNode; children: React.ReactNode; alt?: React.ReactNode }) {
  const t = useTranslations();
  return (
    <section id={id} aria-labelledby={`${id}-h`} className="scroll-mt-20 border-t border-[#e6e3dc] py-16">
      <p className="cx-mono text-[12px] uppercase tracking-[0.16em] text-[#5a5d66] rtl:normal-case rtl:tracking-normal">{t('circos.figure', { n })}</p>
      <h2 id={`${id}-h`} className="mt-1 text-[clamp(1.6rem,3vw,2.4rem)] font-bold leading-tight tracking-[-0.02em] rtl:tracking-normal">
        {title}
      </h2>
      <div className="mt-8">{children}</div>
      <p id={`fig${n}-cap`} className="mx-auto mt-6 max-w-3xl text-[14.5px] leading-relaxed text-[#3b3e46]">
        <b className="text-[#15161b]">{t('circos.figure', { n })}.</b> {caption}
      </p>
      {alt && (
        <details className="cx-details mx-auto mt-4 max-w-4xl rounded-[10px] border border-[#e6e3dc] bg-white">
          <summary className="cursor-pointer px-4 py-3 text-[14px] font-semibold">{t('circos.tableAlt')}</summary>
          <div className="border-t border-[#e6e3dc] p-4">{alt}</div>
        </details>
      )}
    </section>
  );
}

type SortKey = 'cv' | 'title' | 'category' | 'domains';

export default function CircosDesign({ data }: { data: SiteData }) {
  const t = useTranslations();
  const loc = data.locale;
  const model = useMemo(() => circosModel(data), [data]);
  const labels = useMemo(() => Object.fromEntries(data.domains.map((d) => [d.id, t(`domains.${d.id}`)])), [data, t]);
  const { ids, M } = useMemo(() => chordMatrix(model), [model]);
  const { features, lo: pLo, hi: pHi } = useMemo(() => plasmidFeatures(data), [data]);
  const rings = useMemo(() => ringYears(data), [data]);
  const ringList = Array.from({ length: rings.hi - rings.lo + 1 }, (_, i) => rings.lo + i);
  const undated = data.experiences.filter((e) => !features.some((f) => f.id === `role-${e.id}`)).length;
  const [chord, setChord] = useState<Chord | null>(null);
  const [feat, setFeat] = useState<Feature | null>(null);
  const [year, setYear] = useState<number | null>(2024);
  const [sort, setSort] = useState<SortKey>('cv');
  const p = data.person;
  const sep = numSep(loc);
  const totalSkills = model.skills.length + data.softSkills.length;
  const thesis = data.publications.find((x) => x.type === 'Master Thesis');

  const projectsSorted = useMemo(() => {
    const list = model.projects.map((x, i) => ({ x, i }));
    const by: Record<SortKey, (a: (typeof list)[number], b: (typeof list)[number]) => number> = {
      cv: (a, b) => a.i - b.i,
      title: (a, b) => a.x.title.localeCompare(b.x.title, loc),
      category: (a, b) => t(`categories.${a.x.category}`).localeCompare(t(`categories.${b.x.category}`), loc) || a.i - b.i,
      domains: (a, b) => model.pd.get(b.x.id)!.length - model.pd.get(a.x.id)!.length || a.i - b.i,
    };
    return list.sort(by[sort]).map((r) => r.x);
  }, [model, sort, loc, t]);

  const yearCourses = year ? data.certifications.filter((c) => c.year === year) : [];
  const yearPubs = year ? data.publications.filter((x) => x.year === year) : [];
  const yearAct = year ? rings.act.get(year) : undefined;

  return (
    <div className="circos-root min-h-dvh">
      <header className="sticky top-0 z-40 border-b border-[#e6e3dc] bg-[#faf9f6]/90 backdrop-blur-md">
        <div className="mx-auto flex h-14 max-w-[1240px] items-center gap-4 px-4 sm:px-6">
          <a href="#top" className="flex items-center gap-2 text-[15px] font-bold">
            <svg width="22" height="22" viewBox="0 0 22 22" aria-hidden>
              <circle cx="11" cy="11" r="9" fill="none" stroke="#15161b" strokeWidth="2.5" />
              <path d="M4 11 Q11 4 18 11" fill="none" stroke={domColor(250)} strokeWidth="2" />
              <path d="M5 13 Q11 19 17 13" fill="none" stroke={domColor(20)} strokeWidth="2" />
            </svg>
            {t('circos.brand')}
          </a>
          <nav aria-label={t('nav.menu')} className="ms-auto hidden gap-5 text-[13.5px] text-[#3b3e46] md:flex">
            {(['fig1', 'fig2', 'fig3', 'fig4', 'supp'] as const).map((k, i) => (
              <a key={k} href={`#${k}`} className="hover:text-[#15161b]">
                {k === 'supp' ? t('circos.nav.supp') : t('circos.nav.fig', { n: i + 1 })}
              </a>
            ))}
          </nav>
          <LocaleSwitcher className="ms-auto rounded-full border border-[#e6e3dc] bg-white p-0.5 md:ms-2" itemClassName="h-7 min-w-8 rounded-full px-2 text-xs" activeClassName="bg-[#15161b] text-white" />
        </div>
      </header>

      <main id="top" className="mx-auto max-w-[1240px] px-4 sm:px-6">
        <section className="grid items-center gap-10 py-14 md:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)]">
          <div>
            <p className="cx-mono text-[12px] uppercase tracking-[0.18em] text-[#5a5d66] rtl:normal-case rtl:tracking-normal">{t('circos.kicker')}</p>
            <h1 className="mt-2 text-[clamp(2.4rem,6vw,4.6rem)] font-extrabold leading-[1.02] tracking-[-0.03em] rtl:leading-[1.3] rtl:tracking-normal">{p.displayName}</h1>
            <p className="mt-3 text-[18px] font-medium">{p.headline}</p>
            <p className="mt-3 max-w-2xl text-[16px] leading-relaxed text-[#3b3e46]">{t('circos.intro')}</p>
            <p className="mt-3 text-[13px] text-[#5a5d66]">
              <span className="cx-mono me-2 rounded bg-[#15161b] px-1.5 py-0.5 text-[10.5px] uppercase text-white rtl:normal-case">{t('common.metaphor')}</span>
              {t('circos.honesty')}
            </p>
          </div>
          <figure className="mx-auto hidden w-full max-w-[340px] md:block">
            <GraphicalAbstract data={data} model={model} />
            <figcaption className="cx-mono mt-3 text-center text-[11px] uppercase tracking-[0.14em] text-[#5a5d66] rtl:normal-case rtl:tracking-normal">{t('circos.abstract')}</figcaption>
          </figure>
        </section>

        {/* Figure 1 */}
        <FigureBlock
          n={1}
          id="fig1"
          title={t('circos.f1.title')}
          caption={t('circos.f1.caption', { domains: model.doms.length, skills: totalSkills, projects: model.projects.length, chords: model.chords.length })}
          alt={
            <div className="relative overflow-x-auto" tabIndex={0} role="region" aria-label={t('circos.matrix')}>
              <table className="cx-matrix text-[12px]">
                <caption className="pb-2 text-start text-[13px] text-[#5a5d66]">{t('circos.matrixNote')}</caption>
                <thead>
                  <tr>
                    <th />
                    {ids.map((id) => (
                      <th key={id} scope="col" className="cx-vert">
                        <span>{labels[id]}</span>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {ids.map((a, i) => (
                    <tr key={a}>
                      <th scope="row" className="pe-3 text-start font-semibold">
                        {labels[a]}
                      </th>
                      {ids.map((b, j) => {
                        const v = M[i][j];
                        const c = i !== j ? model.chords.find((x) => (x.a === a && x.b === b) || (x.a === b && x.b === a)) : null;
                        return (
                          <td key={b} className={cn('text-center', i === j && 'bg-[#f1ede4] font-bold')}>
                            {c ? (
                              <button type="button" onClick={() => setChord(c)} className="cx-cell" aria-label={`${labels[a]} — ${labels[b]}: ${t('common.count.projects', { count: v })}`}>
                                {fmtNum(loc, v)}
                              </button>
                            ) : v ? (
                              fmtNum(loc, v)
                            ) : (
                              <>
                                <span className="text-[#c9c5bb]" aria-hidden data-qa-ignore>
                                  ·
                                </span>
                                <span className="sr-only">{fmtNum(loc, 0)}</span>
                              </>
                            )}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          }
        >
          <div className="grid gap-8 lg:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)] lg:items-start">
            <CircosFigure data={data} model={model} labels={labels} onChord={setChord} />
            <div className="rounded-[12px] border border-[#e6e3dc] bg-white p-5 lg:sticky lg:top-20" aria-live="polite">
              {chord ? (
                <>
                  <p className="cx-mono text-[11.5px] uppercase text-[#5a5d66] rtl:normal-case">{t('circos.chord')}</p>
                  <h3 className="mt-1 text-[17px] font-bold leading-snug">
                    {labels[chord.a]} <span className="text-[#5a5d66]">↔</span> {labels[chord.b]}
                  </h3>
                  <p className="text-[13.5px] text-[#5a5d66]">{t('common.count.projects', { count: chord.projects.length })}</p>
                  <ul className="mt-3 space-y-1.5 text-[14px]">
                    {chord.projects.map((x) => (
                      <li key={x.id}>
                        <a href={`#s1-${x.id}`} className="font-semibold underline decoration-[#c9c5bb] underline-offset-2 hover:decoration-[#15161b]" dir="auto">
                          {x.title}
                        </a>
                      </li>
                    ))}
                  </ul>
                </>
              ) : (
                <p className="text-[14px] text-[#5a5d66]">{t('circos.chordPrompt')}</p>
              )}
            </div>
          </div>
        </FigureBlock>

        {/* Figure 2 */}
        <FigureBlock n={2} id="fig2" title={t('circos.f2.title')} caption={t('circos.f2.caption', { count: features.length, lo: fmtYear(loc, pLo), hi: fmtYear(loc, pHi - 1), undated })}>
          <div className="grid gap-8 lg:grid-cols-[minmax(0,1.25fr)_minmax(0,1fr)] lg:items-start">
            <div>
              <PlasmidFigure data={data} onFeature={(f) => setFeat((cur) => (cur?.id === f.id ? null : f))} selected={feat?.id ?? null} />
              <ul className="mt-3 flex flex-wrap justify-center gap-x-5 gap-y-1.5 text-[12.5px] text-[#3b3e46]">
                {Object.entries(KIND_COLOR).map(([k, c]) => (
                  <li key={k} className="flex items-center gap-1.5">
                    <span className="h-2 w-5 rounded-sm" style={{ background: c }} aria-hidden />
                    {k === 'education' ? t('sections.education.title') : t(`kinds.${k}`)}
                  </li>
                ))}
                <li className="flex items-center gap-1.5">
                  <span className="h-2 w-5 rounded-sm bg-[#e8b93a]" aria-hidden />
                  MCS
                </li>
              </ul>
            </div>
            <div className="space-y-4">
              <div className="rounded-[12px] border border-[#e6e3dc] bg-white p-5" aria-live="polite">
                {feat ? (
                  <>
                    <p className="cx-mono text-[11.5px] uppercase text-[#5a5d66] rtl:normal-case">
                      {fmtNum(loc, features.indexOf(feat) + 1)}
                      {sep}
                      {feat.kind === 'education' ? t('sections.education.title') : t(`kinds.${feat.kind}`)} · {feat.item.period}
                    </p>
                    <h3 className="mt-1 text-[17px] font-bold leading-snug">{feat.kind === 'education' ? feat.item.degree : feat.item.role}</h3>
                    <p className="text-[14px] text-[#3b3e46]">
                      {feat.kind === 'education' ? feat.item.institution : feat.item.org}
                      {feat.item.location ? ` · ${feat.item.location}` : ''}
                    </p>
                    {feat.kind !== 'education' && <p className="mt-2 text-[14.5px] leading-relaxed">{feat.item.description}</p>}
                    {feat.kind === 'education' && feat.item.gpa && (
                      <p className="mt-2 text-[14px]">
                        {t('common.gpa')} <bdi dir="ltr">{feat.item.gpa}</bdi>
                      </p>
                    )}
                  </>
                ) : (
                  <p className="text-[14px] text-[#5a5d66]">{t('circos.featurePrompt')}</p>
                )}
              </div>
              <ol aria-label={t('circos.key')} className="grid gap-1 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
                {features.map((f, i) => (
                  <li key={f.id}>
                    <button
                      type="button"
                      aria-pressed={feat?.id === f.id}
                      onClick={() => setFeat((cur) => (cur?.id === f.id ? null : f))}
                      className={cn('cx-key flex w-full items-start gap-2 rounded-[8px] px-2 py-1.5 text-start text-[13px] leading-snug', feat?.id === f.id && 'cx-key-on')}
                    >
                      <span className="cx-keynum mt-px grid size-[20px] shrink-0 place-items-center rounded-full text-[10.5px] font-bold" style={{ borderColor: KIND_COLOR[f.kind] }}>
                        {fmtNum(loc, i + 1)}
                      </span>{' '}
                      <span>
                        <span className="font-semibold">{f.label}</span>{' '}
                        <span className="block text-[11.5px] text-[#5a5d66]">{f.item.period}</span>
                      </span>
                    </button>
                  </li>
                ))}
              </ol>
            </div>
          </div>
        </FigureBlock>

        {/* Figure 3 */}
        <FigureBlock
          n={3}
          id="fig3"
          title={t('circos.f3.title')}
          caption={t('circos.f3.caption', { lo: fmtYear(loc, rings.lo), hi: fmtYear(loc, rings.hi) })}
          alt={
            <table className="w-full text-[13.5px]">
              <thead>
                <tr className="border-b border-[#e6e3dc] text-[#5a5d66]">
                  <th scope="col" className="py-1.5 text-start">{t('common.year')}</th>
                  <th scope="col" className="py-1.5 text-end">{t('circos.courses')}</th>
                  <th scope="col" className="py-1.5 text-end">{t('circos.hours')}</th>
                  <th scope="col" className="py-1.5 text-end">{t('sections.publications.title')}</th>
                  <th scope="col" className="py-1.5 text-end">{t('circos.activeCol')}</th>
                </tr>
              </thead>
              <tbody>
                {ringList.map((y) => {
                  const cs = data.certifications.filter((c) => c.year === y);
                  const a = rings.act.get(y);
                  return (
                    <tr key={y} className="border-b border-[#f0ede6]">
                      <th scope="row" className="py-1 text-start font-semibold">
                        {fmtYear(loc, y)}
                      </th>
                      <td className="py-1 text-end">{fmtNum(loc, cs.length)}</td>
                      <td className="py-1 text-end">{fmtNum(loc, cs.reduce((n, c) => n + (c.hours ?? 0), 0))}</td>
                      <td className="py-1 text-end">{fmtNum(loc, data.publications.filter((x) => x.year === y).length)}</td>
                      <td className="py-1 text-end">{fmtNum(loc, (a?.roles.length ?? 0) + (a?.education.length ?? 0))}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          }
        >
          <div className="grid gap-8 lg:grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)] lg:items-start">
            <div>
              <RingsFigure data={data} year={year} onYear={setYear} />
              <ul className="mt-2 flex flex-wrap justify-center gap-x-4 gap-y-1 text-[12.5px] text-[#3b3e46]">
                <li className="flex items-center gap-1.5">
                  <span className="h-3 w-5 rounded-sm bg-[oklch(0.7_0.08_75)]" aria-hidden />
                  {t('circos.legend.hours')}
                </li>
                <li className="flex items-center gap-1.5">
                  <span className="h-3 w-[2px] bg-[#5a3b0a]" aria-hidden />
                  {t('circos.legend.course')}
                </li>
                <li className="flex items-center gap-1.5">
                  <span className="size-2.5 rounded-full bg-[#c0282d]" aria-hidden />
                  {t('circos.legend.pub')}
                </li>
                {Object.entries(KIND_COLOR).map(([k, c]) => (
                  <li key={k} className="flex items-center gap-1.5">
                    <span className="size-2 rounded-full" style={{ background: c }} aria-hidden />
                    {k === 'education' ? t('sections.education.title') : t(`kinds.${k}`)}
                  </li>
                ))}
              </ul>
              <div role="group" aria-label={t('circos.years')} className="mt-3 flex flex-wrap justify-center gap-1.5">
                {ringList.map((y) => (
                  <button key={y} type="button" aria-pressed={year === y} onClick={() => setYear(y)} className={cn('cx-chip', year === y && 'cx-chip-on')}>
                    {fmtYear(loc, y)}
                  </button>
                ))}
              </div>
            </div>
            <div className="rounded-[12px] border border-[#e6e3dc] bg-white p-5 lg:sticky lg:top-20" aria-live="polite">
              {year && (
                <>
                  <h3 className="text-[20px] font-bold">{fmtYear(loc, year)}</h3>
                  <p className="text-[13.5px] text-[#5a5d66]">
                    {t('common.count.courses', { count: yearCourses.length })}
                    {sep}
                    {t('common.hours', { count: fmtNum(loc, yearCourses.reduce((n, c) => n + (c.hours ?? 0), 0)) })}
                  </p>
                  {yearCourses.length > 0 && (
                    <ul className="mt-3 space-y-1 text-[13.5px]">
                      {yearCourses.map((c) => (
                        <li key={c.name + c.issuer}>
                          <bdi lang="en">{c.name}</bdi> <span className="text-[#5a5d66]">— {c.issuer}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                  {yearPubs.length > 0 && (
                    <ul className="mt-3 space-y-1 border-t border-[#e6e3dc] pt-3 text-[13.5px]">
                      {yearPubs.map((x) => (
                        <li key={x.id}>
                          <span className="me-1.5 inline-block size-2.5 rounded-full bg-[#c0282d]" aria-hidden />
                          <bdi lang="en">{x.title}</bdi>
                        </li>
                      ))}
                    </ul>
                  )}
                  {!yearCourses.length && !yearPubs.length && <p className="mt-2 text-[13.5px] text-[#5a5d66]">{t('circos.quietYear')}</p>}
                  {yearAct && yearAct.roles.length + yearAct.education.length > 0 && (
                    <div className="mt-3 border-t border-[#e6e3dc] pt-3">
                      <p className="cx-mono text-[11.5px] uppercase text-[#5a5d66] rtl:normal-case">{t('circos.active')}</p>
                      <ul className="mt-1.5 space-y-1 text-[13.5px]">
                        {yearAct.education.map((e) => (
                          <li key={e.id} className="flex items-baseline gap-2">
                            <span className="inline-block size-2 shrink-0 rounded-full" style={{ background: KIND_COLOR.education }} aria-hidden />
                            <span>
                              {e.degree} <span className="text-[#5a5d66]">— {e.institution}</span>
                            </span>
                          </li>
                        ))}
                        {yearAct.roles.map((e) => (
                          <li key={e.id} className="flex items-baseline gap-2">
                            <span className="inline-block size-2 shrink-0 rounded-full" style={{ background: KIND_COLOR[e.kind] }} aria-hidden />
                            <span>
                              {e.role} <span className="text-[#5a5d66]">— {e.org}</span>
                            </span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </FigureBlock>

        {/* Figure 4 */}
        <FigureBlock n={4} id="fig4" title={t('circos.f4.title')} caption={t('circos.f4.caption')}>
          <div className="relative overflow-x-auto rounded-[12px] border border-[#e6e3dc] bg-white p-3" tabIndex={0} role="region" aria-label={t('circos.f4.title')}>
            <SankeyFigure data={data} model={model} labels={labels} />
          </div>
        </FigureBlock>

        {/* supplementary */}
        <section id="supp" aria-labelledby="supp-h" className="scroll-mt-20 border-t-2 border-[#15161b] py-16">
          <h2 id="supp-h" className="text-[clamp(1.6rem,3vw,2.4rem)] font-bold tracking-[-0.02em] rtl:tracking-normal">
            {t('circos.supp')}
          </h2>

          {/* S1 projects */}
          <div className="mt-10">
            <div className="flex flex-wrap items-end justify-between gap-3">
              <h3 className="text-[19px] font-bold">
                <span className="cx-mono me-2 text-[13px] text-[#5a5d66]">S1</span>
                {t('sections.projects.title')} <span className="text-[#5a5d66]">({fmtNum(loc, model.projects.length)})</span>
              </h3>
              <div role="group" aria-label={t('circos.sortBy')} className="flex flex-wrap gap-1.5">
                {(['cv', 'title', 'category', 'domains'] as const).map((k) => (
                  <button key={k} type="button" aria-pressed={sort === k} onClick={() => setSort(k)} className={cn('cx-chip', sort === k && 'cx-chip-on')}>
                    {t(`circos.sort.${k}`)}
                  </button>
                ))}
              </div>
            </div>
            <ol className="mt-4 divide-y divide-[#e6e3dc] rounded-[12px] border border-[#e6e3dc] bg-white">
              {projectsSorted.map((x) => (
                <li key={x.id} id={`s1-${x.id}`} className="grid scroll-mt-24 gap-x-6 gap-y-1 p-4 md:grid-cols-[minmax(0,1.1fr)_minmax(0,1.6fr)]">
                  <div>
                    <p className="font-bold leading-snug" dir="auto">
                      {x.url ? (
                        <a href={x.url} target="_blank" rel="noreferrer" className="hover:underline">
                          {x.title}
                        </a>
                      ) : (
                        x.title
                      )}
                      {x.metric && (
                        <bdi dir="ltr" className="ml-2 text-[13px] text-[#1a8f6a] rtl:ml-0 rtl:mr-2">
                          {x.metric}
                        </bdi>
                      )}
                    </p>
                    <p className="mt-0.5 text-[12.5px] text-[#5a5d66]">{t(`categories.${x.category}`)}</p>
                    <p className="mt-1 flex flex-wrap gap-1">
                      {model.pd.get(x.id)!.map((d) => (
                        <span key={d} className="rounded-full px-2 py-0.5 text-[11.5px]" style={{ background: `oklch(0.93 0.05 ${data.domains.find((z) => z.id === d)?.hue ?? 0})` }}>
                          {labels[d]}
                        </span>
                      ))}
                    </p>
                  </div>
                  <div className="text-[14px] leading-relaxed">
                    <p dir="auto">{x.description}</p>
                    <p className="mt-1 flex flex-wrap items-center gap-x-3 text-[12px] text-[#5a5d66]">
                      {x.tags.length > 0 && (
                        <span className="cx-mono" dir="ltr">
                          {x.tags.join(' · ')}
                        </span>
                      )}
                      {x.repo && (
                        <a href={x.url ?? `https://github.com/${x.repo}`} target="_blank" rel="noreferrer" aria-label={`${t('common.code')}: ${x.title}`} className="inline-flex items-center gap-1 font-semibold text-[#1f5fbf] hover:underline">
                          <BrandIcon name="github" className="size-3.5" /> {t('common.code')}
                        </a>
                      )}
                    </p>
                  </div>
                </li>
              ))}
            </ol>
          </div>

          {/* S2 roles */}
          <div className="mt-14">
            <h3 className="text-[19px] font-bold">
              <span className="cx-mono me-2 text-[13px] text-[#5a5d66]">S2</span>
              {t('sections.experience.title')} <span className="text-[#5a5d66]">({fmtNum(loc, data.experiences.length)})</span>
            </h3>
            <ol className="mt-4 divide-y divide-[#e6e3dc] rounded-[12px] border border-[#e6e3dc] bg-white">
              {data.experiences.map((e) => (
                <li key={e.id} className="grid gap-x-6 gap-y-1 p-4 md:grid-cols-[minmax(0,1.1fr)_minmax(0,1.6fr)]">
                  <div>
                    <p className="font-bold leading-snug">{e.role}</p>
                    <p className="text-[13px] text-[#5a5d66]">
                      {e.org}
                      {e.location ? ` · ${e.location}` : ''}
                    </p>
                    <p className="text-[13px] text-[#5a5d66]">
                      {e.period || t('common.undated')}
                      {e.months ? `${sep}${t('common.months', { count: e.months })}` : ''}
                      {sep}
                      {t(`kinds.${e.kind}`)}
                    </p>
                  </div>
                  <p className="text-[14px] leading-relaxed">{e.description}</p>
                </li>
              ))}
            </ol>
          </div>

          {/* S3 skills */}
          <div className="mt-14">
            <h3 className="text-[19px] font-bold">
              <span className="cx-mono me-2 text-[13px] text-[#5a5d66]">S3</span>
              {t('sections.skills.title')} <span className="text-[#5a5d66]">({fmtNum(loc, totalSkills)})</span>
            </h3>
            <div className="mt-4 columns-1 gap-6 md:columns-2">
              {data.skills.map((c) => (
                <div key={c.id} className="mb-4 break-inside-avoid rounded-[12px] border border-[#e6e3dc] bg-white p-4">
                  <p className="font-bold">{c.label}</p>
                  {c.groups.map((g) => (
                    <p key={g.id} className="mt-1 text-[13.5px] leading-relaxed">
                      {c.groups.length > 1 && <span className="text-[#5a5d66]">{g.label}: </span>}
                      {g.items.map((it, i) => (
                        <span key={it.key}>
                          {i > 0 && ', '}
                          <bdi title={it.long !== it.name ? it.long : undefined}>{it.name}</bdi>
                        </span>
                      ))}
                    </p>
                  ))}
                </div>
              ))}
            </div>
          </div>

          {/* S4 courses */}
          <div className="mt-14">
            <h3 className="text-[19px] font-bold">
              <span className="cx-mono me-2 text-[13px] text-[#5a5d66]">S4</span>
              {t('sections.certifications.title')} <span className="text-[#5a5d66]">({fmtNum(loc, data.certifications.length)})</span>
            </h3>
            <div className="relative mt-4 overflow-x-auto rounded-[12px] border border-[#e6e3dc] bg-white" tabIndex={0} role="region" aria-label={t('sections.certifications.title')}>
              <table className="w-full min-w-[640px] text-[13.5px]">
                <thead>
                  <tr className="border-b border-[#e6e3dc] text-[#5a5d66]">
                    <th scope="col" className="px-4 py-2 text-start font-semibold">{t('common.year')}</th>
                    <th scope="col" className="px-4 py-2 text-start font-semibold">{t('common.description')}</th>
                    <th scope="col" className="px-4 py-2 text-start font-semibold">{t('common.issuer')}</th>
                    <th scope="col" className="px-4 py-2 text-end font-semibold">{t('circos.hours')}</th>
                    <th scope="col" className="px-4 py-2 text-end font-semibold">{t('common.certificate')}</th>
                  </tr>
                </thead>
                <tbody>
                  {data.certifications.map((c) => (
                    <tr key={c.name + c.issuer} className="border-b border-[#f0ede6] align-top">
                      <td className="cx-mono px-4 py-1.5">{c.year ? fmtYear(loc, c.year) : '—'}</td>
                      <td className="px-4 py-1.5 font-medium">
                        <bdi lang="en">{c.name}</bdi>
                      </td>
                      <td className="px-4 py-1.5 text-[#3b3e46]">
                        <bdi>{c.issuer}</bdi>
                      </td>
                      <td className="cx-mono px-4 py-1.5 text-end">{c.hours ? fmtNum(loc, c.hours) : c.weeks ? t('common.weeks', { count: fmtNum(loc, c.weeks) }) : '—'}</td>
                      <td className="px-4 py-1.5 text-end">
                        {c.url ? (
                          <a href={c.url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 font-semibold text-[#1f5fbf] hover:underline">
                            <ArrowUpRight className="flip-rtl size-3.5" aria-hidden />
                            <span className="sr-only">{t('common.certificate')}</span>
                          </a>
                        ) : (
                          '—'
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* references */}
          <div className="mt-14">
            <h3 className="text-[19px] font-bold">{t('circos.references')}</h3>
            <ol className="mt-4 list-decimal space-y-3 ps-6 text-[14.5px] leading-relaxed">
              {data.publications.map((pub) => (
                <li key={pub.id}>
                  <Authors ownerName={data.person.fullName} p={pub} meClassName="font-bold" etAl={t('common.withCoAuthors')} />
                  {pub.year ? ` (${fmtYear(loc, pub.year)})` : ''}. <bdi lang="en">{pub.title}</bdi>.{' '}
                  {pub.venue && (
                    <bdi lang="en">
                      <i>{pub.venue}</i>
                      {pub.publisher ? `, ${pub.publisher}` : ''}.
                    </bdi>
                  )}{' '}
                  <span className="text-[#5a5d66]">
                    {publicationLabel(t, 'pubType', pub.type)} · {publicationLabel(t, 'pubStatus', pub.status)}
                  </span>
                  <span className="ms-2 inline-flex flex-wrap gap-3 text-[13px] font-semibold">
                    {pub.url && (
                      <a href={pub.url} target="_blank" rel="noreferrer" dir="ltr" className="text-[#1f5fbf] hover:underline">
                        {pub.doi ? `doi:${pub.doi}` : t('common.visit')}
                      </a>
                    )}
                    {pub.bibtex && (
                      <CopyButton value={pub.bibtex} className="inline-flex items-center gap-1 hover:underline">
                        <Copy className="size-3.5" aria-hidden /> {t('common.copyBibtex')}
                      </CopyButton>
                    )}
                  </span>
                </li>
              ))}
            </ol>
          </div>

          {/* education + languages + contact */}
          <div className="mt-14 grid gap-10 md:grid-cols-2">
            <div>
              <h3 className="text-[19px] font-bold">{t('sections.education.title')}</h3>
              <ol className="mt-4 space-y-3 text-[14.5px]">
                {data.education.map((e) => (
                  <li key={e.id}>
                    <p className="font-bold">{e.degree}</p>
                    <p className="text-[#3b3e46]">
                      {e.institution} · {e.location} · {e.period}
                      {e.gpa ? (
                        <>
                          {' · '}
                          {t('common.gpa')} <bdi dir="ltr">{e.gpa}</bdi>
                        </>
                      ) : null}
                    </p>
                    {e.id === 'tehran' && thesis && (
                      <p className="text-[13.5px] text-[#3b3e46]">
                        {t('common.thesis')}: <bdi lang="en">{thesis.title}</bdi>
                      </p>
                    )}
                  </li>
                ))}
              </ol>
              <h3 className="mt-10 text-[19px] font-bold">{t('sections.languages.title')}</h3>
              <ul className="mt-3 space-y-1.5 text-[14.5px]">
                {data.languages.map((l) => (
                  <li key={l.id}>
                    <b>{l.name}</b> — {l.level}
                    {l.cert && (
                      <span className="text-[#5a5d66]">
                        {' '}
                        · {l.cert.test} {fmtNum(loc, l.cert.overall, { minimumFractionDigits: 1 })} ({(['listening', 'reading', 'writing', 'speaking'] as const).map((k) => `${t(`ielts.${k}`)} ${fmtNum(loc, l.cert!.bands[k], { minimumFractionDigits: 1 })}`).join(', ')})
                      </span>
                    )}
                  </li>
                ))}
              </ul>
            </div>
            <div id="contact" className="rounded-[16px] border border-[#e6e3dc] bg-white p-6">
              <h3 className="text-[clamp(1.4rem,2.6vw,1.9rem)] font-bold leading-tight">{t('sections.contact.title')}</h3>
              <p className="mt-2 text-[15px] leading-relaxed text-[#3b3e46]">
                {p.availability} {t('sections.contact.subtitle')}
              </p>
              <a href={data.links.email} dir="ltr" className="mt-4 inline-flex items-center gap-2 break-all rounded-full bg-[#15161b] px-4 py-2.5 text-[14.5px] font-semibold text-white hover:bg-black">
                <Mail className="size-4 shrink-0" aria-hidden /> {p.email}
              </a>
              <div className="mt-4 flex flex-wrap gap-2">
                {(['github', 'linkedin', 'orcid', 'scholar'] as const).map((k) =>
                  data.links[k] ? (
                    <a key={k} href={data.links[k]!} target="_blank" rel="noreferrer" aria-label={k} className="grid size-10 place-items-center rounded-full border border-[#e6e3dc] hover:border-[#15161b]">
                      <BrandIcon name={k} className="size-4" />
                    </a>
                  ) : null,
                )}
              </div>
            </div>
          </div>
        </section>

        <footer className="flex flex-wrap justify-between gap-3 border-t border-[#e6e3dc] pb-24 pt-6 text-[12.5px] text-[#5a5d66]">
          <span>{t('common.rights', { year: fmtYear(loc, new Date(data.generatedAt).getUTCFullYear()) })}</span>
          <span>{t('circos.footer')}</span>
        </footer>
      </main>
    </div>
  );
}
