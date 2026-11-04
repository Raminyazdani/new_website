'use client';

import { useEffect, useMemo, useState } from 'react';
import { useTranslations } from 'next-intl';
import { motion, useReducedMotion } from 'motion/react';
import { ArrowUpRight, Check, Copy, Link2, Mail, Printer } from 'lucide-react';
import { Authors } from '@/components/kit/Authors';
import { BorderBeam } from '@/components/magicui/border-beam';
import { ShimmerButton } from '@/components/magicui/shimmer-button';
import { BrandIcon } from '@/components/shared/BrandIcon';
import { CopyButton } from '@/components/shared/CopyButton';
import { LocaleSwitcher } from '@/components/shared/LocaleSwitcher';
import { ProfilePhoto } from '@/components/shared/ProfilePhoto';
import { allProjects, projectDomains } from '@/lib/derive';
import { fmtNum, fmtYear, publicationLabel } from '@/lib/format';
import type { SiteData } from '@/lib/types';
import { cn } from '@/lib/utils';
import { JsonView } from './JsonView';
import { PrintSheet } from './PrintSheet';
import { DEPTHS, FORMATS, HIGHLIGHT_N, isDepth, isFormat, isView, rankFor, VIEW_IDS, VIEWS, type Depth, type Format, type ViewId } from './roleViews';
import './configurator.css';

function Radios<T extends string>({ name, legend, value, options, onChange, label }: { name: string; legend: string; value: T; options: T[]; onChange: (v: T) => void; label: (v: T) => string }) {
  const id = `${name}-label`;
  return (
    <div role="radiogroup" aria-labelledby={id} className="flex min-w-0 flex-col gap-1.5 lg:flex-row lg:items-center lg:gap-3">
      <span id={id} className="shrink-0 text-[12px] font-medium text-[#6e6e73] lg:w-[5.5rem]">
        {legend}
      </span>
      <div className="no-scrollbar relative -mx-1 flex min-w-0 gap-1.5 overflow-x-auto px-1 py-0.5">
        {options.map((o) => (
          <label key={o} className={cn('cfg-chip relative shrink-0', value === o && 'cfg-chip-on')}>
            <input type="radio" name={name} value={o} checked={value === o} onChange={() => onChange(o)} className="sr-only" />
            {label(o)}
          </label>
        ))}
      </div>
    </div>
  );
}

function Section({ id, title, sub, children, aside }: { id: string; title: string; sub?: string; children: React.ReactNode; aside?: React.ReactNode }) {
  return (
    <section id={id} aria-labelledby={`${id}-h`} className="scroll-mt-40 border-t border-[#e5e5ea] py-14">
      <div className="mb-7 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 id={`${id}-h`} className="cfg-display text-[clamp(1.8rem,3.4vw,2.6rem)] font-semibold leading-tight">
            {title}
          </h2>
          {sub && <p className="mt-1.5 max-w-2xl text-[15.5px] text-[#6e6e73]">{sub}</p>}
        </div>
        {aside}
      </div>
      {children}
    </section>
  );
}

export default function ConfiguratorDesign({ data }: { data: SiteData }) {
  const t = useTranslations();
  const loc = data.locale;
  const reduceRaw = useReducedMotion();
  const [mounted, setMounted] = useState(false);
  const reduce = mounted && !!reduceRaw;

  const [view, setView] = useState<ViewId>('all');
  const [depth, setDepth] = useState<Depth>('highlights');
  const [format, setFormat] = useState<Format>('web');
  const [shareUrl, setShareUrl] = useState('');
  const [copied, setCopied] = useState(false);

  // URL ↔ state (client-side search params, safe for the static export)
  useEffect(() => {
    const q = new URLSearchParams(window.location.search);
    const v = q.get('view');
    const d = q.get('depth');
    const f = q.get('format');
    if (isView(v)) setView(v);
    if (isDepth(d)) setDepth(d);
    if (isFormat(f)) setFormat(f);
    setMounted(true);
  }, []);
  useEffect(() => {
    if (!mounted) return;
    const q = new URLSearchParams(window.location.search);
    q.set('view', view);
    q.set('depth', depth);
    q.set('format', format);
    const url = `${window.location.pathname}?${q.toString()}`;
    window.history.replaceState(window.history.state, '', url + window.location.hash);
    setShareUrl(window.location.origin + url);
  }, [view, depth, format, mounted]);

  const v = VIEWS[view];
  const ranked = useMemo(() => rankFor(data, v), [data, v]);
  const projectsAll = useMemo(() => allProjects(data), [data]);
  const p = data.person;
  const emphasis = v.labels.length ? v.labels.map((i) => p.labels[i]).filter(Boolean).join(' · ') : p.headline;
  const viewName = (id: ViewId) => t(`configurator.views.${id}`);
  const hl = depth === 'highlights';
  const layoutT = { duration: reduce ? 0 : 0.45, ease: [0.22, 1, 0.36, 1] as const };
  const domainName = (d: string) => t(`domains.${d}`);
  const shown = (n: number, total: number) => (hl ? Math.min(n, total) : total);
  const json = useMemo(
    () =>
      format === 'json'
        ? JSON.stringify(
            {
              view: view,
              depth,
              locale: data.locale,
              generatedAt: data.generatedAt,
              person: data.person,
              links: data.links,
              stats: data.stats,
              experiences: ranked.roles.map((r) => r.item),
              projects: ranked.projects.map((r) => r.item),
              publications: data.publications,
              education: data.education,
              skills: data.skills,
              certifications: ranked.courses.map((r) => r.item),
              languages: data.languages,
            },
            null,
            2,
          )
        : '',
    [format, view, depth, data, ranked],
  );

  const ShowAllBtn = ({ total, n }: { total: number; n: number }) =>
    hl && total > n ? (
      <button type="button" data-kit-more="" aria-expanded={false} onClick={() => setDepth('complete')} className="mt-6 rounded-full border border-[#0a66d8] px-4 py-2 text-[14px] font-medium text-[#0a66d8] hover:bg-[#0a66d8] hover:text-white">
        {t('common.showAll', { count: total })}
      </button>
    ) : null;

  const copyShare = () => {
    if (!shareUrl) return;
    navigator.clipboard?.writeText(shareUrl).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    });
  };

  const top3 = ranked.projects.slice(0, 3).map((r) => r.item);
  const compareViews = VIEW_IDS.filter((x) => x !== 'all');
  const compareRanks = useMemo(() => Object.fromEntries(compareViews.map((id) => [id, rankFor(data, VIEWS[id])])), [data]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="configurator-root min-h-dvh" data-format={format}>
      <header className="cfg-noprint border-b border-[#e5e5ea] bg-white/80 backdrop-blur-md">
        <div className="mx-auto flex h-12 max-w-[1280px] items-center gap-4 px-4 sm:px-6">
          <a href="#top" className="text-[15px] font-semibold tracking-[-0.01em] rtl:tracking-normal">
            {t('configurator.brand')}
          </a>
          <nav aria-label={t('nav.menu')} className="ms-auto hidden gap-5 text-[13px] text-[#424245] md:flex">
            {(['projects', 'experience', 'skills', 'courses', 'contact'] as const).map((k) => (
              <a key={k} href={`#cfg-${k}`} className="hover:text-[#0a66d8]">
                {t(`configurator.nav.${k}`)}
              </a>
            ))}
          </nav>
          <LocaleSwitcher className="ms-auto rounded-full bg-[#f5f5f7] p-0.5 md:ms-2" itemClassName="h-7 min-w-8 rounded-full px-2 text-xs" activeClassName="bg-[#1d1d1f] text-white" />
        </div>
      </header>

      {/* configure bar */}
      <div className="cfg-noprint cfg-bar z-30 border-b border-[#e5e5ea] bg-[#f5f5f7]/90 backdrop-blur-md lg:sticky lg:top-0">
        <div className="mx-auto grid max-w-[1280px] grid-cols-1 gap-2.5 px-4 py-2.5 sm:px-6">
          <Radios name="cfg-view" legend={t('configurator.role')} value={view} options={VIEW_IDS} onChange={setView} label={viewName} />
          <div className="flex min-w-0 flex-wrap gap-x-10 gap-y-2.5 [&>*]:max-w-full">
            <Radios name="cfg-depth" legend={t('configurator.depth')} value={depth} options={DEPTHS} onChange={setDepth} label={(d) => t(`configurator.depths.${d}`)} />
            <Radios name="cfg-format" legend={t('configurator.format')} value={format} options={FORMATS} onChange={setFormat} label={(f) => t(`configurator.formats.${f}`)} />
          </div>
        </div>
      </div>

      <div className="mx-auto grid max-w-[1280px] grid-cols-1 gap-10 px-4 sm:px-6 lg:grid-cols-[minmax(0,1fr)_300px]">
        <main id="top" className="min-w-0">
          <div className="cfg-noprint">
            {format === 'web' && (
              <>
                {/* hero */}
                <section className="grid items-center gap-10 py-14 md:grid-cols-[minmax(0,1fr)_minmax(0,0.8fr)]">
                  <div>
                    <p className="text-[14px] font-semibold" style={{ color: '#0a66d8' }}>
                      {viewName(view)}
                    </p>
                    <h1 className="cfg-display mt-2 text-[clamp(2.8rem,6.4vw,5rem)] font-semibold leading-[1.02]">{p.displayName}</h1>
                    <motion.p key={view} initial={reduce ? false : { opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }} className="cfg-display mt-3 text-[clamp(1.3rem,2.6vw,1.9rem)] font-medium leading-snug text-[#424245]">
                      {emphasis}
                    </motion.p>
                    <p className="mt-4 max-w-xl text-[16.5px] leading-relaxed text-[#424245]">{p.statement}</p>
                    <dl className="mt-8 grid max-w-xl grid-cols-2 gap-x-6 gap-y-5 sm:grid-cols-4">
                      {v.stats.map((id) => {
                        const s = data.stats.find((x) => x.id === id);
                        if (!s) return null;
                        return (
                          <div key={id}>
                            <dd className="cfg-display text-[30px] font-semibold leading-none">
                              {fmtNum(loc, s.value)}
                              {s.suffix}
                            </dd>
                            <dt className="mt-1.5 text-[12.5px] leading-snug text-[#6e6e73]">{s.label}</dt>
                          </div>
                        );
                      })}
                    </dl>
                  </div>
                  <div className="relative mx-auto aspect-square w-full max-w-[380px]">
                    <motion.div
                      className="absolute inset-0 rounded-full"
                      animate={{ background: `radial-gradient(circle at 35% 30%, #ffffff, ${v.shot[0]} 38%, ${v.shot[1]} 100%)` }}
                      transition={{ duration: reduce ? 0 : 0.6 }}
                      aria-hidden
                    />
                    <ProfilePhoto src={p.photo} alt={t('common.photoAlt')} size={560} priority className="absolute inset-[12%] rounded-full shadow-[0_30px_60px_-25px_rgb(0_0_0/0.45)]" imgClassName="size-full object-cover" monogramClassName="cfg-display text-6xl text-[#1d1d1f]/70" />
                  </div>
                </section>

                {/* highlights: 3 tiles */}
                <section aria-labelledby="cfg-top-h" className="pb-14">
                  <h2 id="cfg-top-h" className="sr-only">
                    {t('configurator.topTitle')}
                  </h2>
                  <ol className="grid gap-4 md:grid-cols-3">
                    {top3.map((pr, i) => (
                      <motion.li key={pr.id} layout transition={layoutT} className="cfg-tile relative overflow-hidden rounded-[22px] p-6" style={{ background: `linear-gradient(160deg, ${v.shot[0]}, #ffffff 70%)` }}>
                        <p className="text-[12.5px] font-semibold text-[#6e6e73]">
                          {t('configurator.pick', { n: i + 1 })} · {t(`categories.${pr.category}`)}
                        </p>
                        <h3 className="cfg-display mt-2 text-[22px] font-semibold leading-snug" dir="auto">
                          {pr.title}
                        </h3>
                        {pr.metric && (
                          <p className="mt-1 text-[14px] font-semibold text-[#1a7f37]">
                            <bdi dir="ltr">{pr.metric}</bdi>
                          </p>
                        )}
                        <p className="mt-2 text-[14.5px] leading-relaxed text-[#424245]" dir="auto">
                          {pr.description}
                        </p>
                        <div className="mt-4 flex gap-3 text-[13.5px] font-medium text-[#0a66d8]">
                          {pr.url && (
                            <a href={pr.url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 hover:underline">
                              {t('common.visit')} <ArrowUpRight className="size-3.5" aria-hidden />
                            </a>
                          )}
                          {pr.repo && (
                            <a href={pr.url ?? `https://github.com/${pr.repo}`} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 hover:underline">
                              <BrandIcon name="github" className="size-3.5" /> {t('common.code')}
                            </a>
                          )}
                        </div>
                      </motion.li>
                    ))}
                  </ol>
                </section>

                {/* compare views */}
                <Section id="cfg-compare" title={t('configurator.compareTitle')} sub={t('configurator.compareSub')}>
                  <div className="relative overflow-x-auto rounded-[18px] border border-[#e5e5ea] bg-white" tabIndex={0} role="region" aria-labelledby="cfg-compare-h">
                    <table className="w-full min-w-[720px] text-[13.5px]">
                      <thead>
                        <tr className="border-b border-[#e5e5ea] bg-[#f5f5f7]">
                          <th scope="col" className="px-4 py-3 text-start font-medium text-[#6e6e73]">
                            {t('configurator.compareDomain')}
                          </th>
                          {compareViews.map((id) => (
                            <th key={id} scope="col" className={cn('px-3 py-3 text-center font-semibold', id === view && 'bg-[#e8f0fc] text-[#0a66d8]')}>
                              {viewName(id)}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {data.domains.map((d) => (
                          <tr key={d.id} className="border-b border-[#f0f0f2]">
                            <th scope="row" className="px-4 py-2.5 text-start font-medium">
                              {domainName(d.id)}
                            </th>
                            {compareViews.map((id) => {
                              const w = VIEWS[id].domains[d.id] ?? 0;
                              return (
                                <td key={id} className={cn('px-3 py-2.5 text-center', id === view && 'bg-[#f4f8fe]')}>
                                  {w >= 2 ? (
                                    <>
                                      <Check className="mx-auto size-4 text-[#1a7f37]" aria-hidden />
                                      <span className="sr-only">{t('configurator.lead')}</span>
                                    </>
                                  ) : w === 1 ? (
                                    <span className="text-[#6e6e73]">
                                      <span aria-hidden>○</span>
                                      <span className="sr-only">{t('configurator.minor')}</span>
                                    </span>
                                  ) : (
                                    <span className="text-[#c7c7cc]" aria-label={t('configurator.none')}>
                                      —
                                    </span>
                                  )}
                                </td>
                              );
                            })}
                          </tr>
                        ))}
                        <tr className="align-top">
                          <th scope="row" className="px-4 py-3 text-start font-medium">
                            {t('configurator.compareTop')}
                          </th>
                          {compareViews.map((id) => (
                            <td key={id} className={cn('px-3 py-3', id === view && 'bg-[#f4f8fe]')}>
                              <ol className="list-decimal space-y-1 ps-4 text-[12.5px] leading-snug">
                                {compareRanks[id].projects.slice(0, 3).map((r) => (
                                  <li key={r.item.id} dir="auto">
                                    {r.item.title}
                                  </li>
                                ))}
                              </ol>
                            </td>
                          ))}
                        </tr>
                      </tbody>
                    </table>
                  </div>
                  <p className="mt-3 text-[12.5px] text-[#6e6e73]">{t('configurator.compareNote')}</p>
                </Section>

                {/* projects */}
                <Section id="cfg-projects" title={t('sections.projects.title')} sub={t('configurator.shownOf', { shown: shown(HIGHLIGHT_N.projects, projectsAll.length), total: projectsAll.length })}>
                  <ul className="grid gap-4 md:grid-cols-2">
                    {ranked.projects.map(({ item: pr, score }, i) => (
                      <motion.li key={pr.id} layout transition={layoutT} hidden={hl && i >= HIGHLIGHT_N.projects ? true : undefined} className="cfg-card rounded-[20px] bg-white p-6">
                        <div className="flex items-center justify-between gap-3 text-[12px] font-medium text-[#6e6e73]">
                          <span>{t(`categories.${pr.category}`)}</span>
                          {view !== 'all' && score >= 3 && <span className="rounded-full bg-[#e9f6ec] px-2 py-0.5 text-[#1a7f37]">{t('configurator.fit')}</span>}
                        </div>
                        <h3 className="mt-1.5 text-[18px] font-semibold leading-snug" dir="auto">
                          {pr.url ? (
                            <a href={pr.url} target="_blank" rel="noreferrer" className="hover:text-[#0a66d8]">
                              {pr.title}
                            </a>
                          ) : (
                            pr.title
                          )}
                        </h3>
                        <p className="mt-2 text-[14.5px] leading-relaxed text-[#424245]" dir="auto">
                          {pr.description}
                        </p>
                        <dl className="cfg-spec mt-4 grid grid-cols-[6.5rem_minmax(0,1fr)] gap-y-1.5 border-t border-[#f0f0f2] pt-3 text-[13px]">
                          {pr.tags.length > 0 && (
                            <>
                              <dt className="text-[#6e6e73]">{t('configurator.specStack')}</dt>
                              <dd dir="ltr" className="text-start">
                                {pr.tags.join(' · ')}
                              </dd>
                            </>
                          )}
                          <dt className="text-[#6e6e73]">{t('configurator.specDomains')}</dt>
                          <dd>{projectDomains(pr, ranked.skills).map(domainName).join(' · ')}</dd>
                          {pr.metric && (
                            <>
                              <dt className="text-[#6e6e73]">{t('configurator.specResult')}</dt>
                              <dd className="font-semibold text-[#1a7f37]">
                                <bdi dir="ltr">{pr.metric}</bdi>
                              </dd>
                            </>
                          )}
                          {(pr.url || pr.repo) && (
                            <>
                              <dt className="text-[#6e6e73]">{t('configurator.specLinks')}</dt>
                              <dd className="flex flex-wrap gap-3 font-medium text-[#0a66d8]">
                                {pr.url && (
                                  <a href={pr.url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 hover:underline">
                                    {t('common.visit')} <ArrowUpRight className="size-3.5" aria-hidden />
                                  </a>
                                )}
                                {pr.repo && (
                                  <a href={pr.url ?? `https://github.com/${pr.repo}`} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 hover:underline">
                                    <BrandIcon name="github" className="size-3.5" /> {t('common.code')}
                                  </a>
                                )}
                              </dd>
                            </>
                          )}
                        </dl>
                      </motion.li>
                    ))}
                  </ul>
                  <ShowAllBtn total={projectsAll.length} n={HIGHLIGHT_N.projects} />
                </Section>

                {/* experience */}
                <Section id="cfg-experience" title={t('sections.experience.title')} sub={t('configurator.shownOf', { shown: shown(HIGHLIGHT_N.roles, data.experiences.length), total: data.experiences.length })}>
                  <ol className="space-y-3">
                    {ranked.roles.map(({ item: e, score }, i) => (
                      <motion.li key={e.id} layout transition={layoutT} hidden={hl && i >= HIGHLIGHT_N.roles ? true : undefined} className="cfg-card grid gap-x-8 gap-y-1 rounded-[20px] bg-white p-6 md:grid-cols-[11rem_minmax(0,1fr)]">
                        <div className="text-[13px] text-[#6e6e73]">
                          <p className="font-medium text-[#1d1d1f]">{e.period || t('common.undated')}</p>
                          {e.months ? <p>{t('common.months', { count: e.months })}</p> : null}
                          <p>{t(`kinds.${e.kind}`)}</p>
                        </div>
                        <div>
                          <h3 className="flex flex-wrap items-center gap-2 text-[17px] font-semibold leading-snug">
                            {e.role}
                            {view !== 'all' && score >= 3 && <span className="rounded-full bg-[#e9f6ec] px-2 py-0.5 text-[11.5px] font-medium text-[#1a7f37]">{t('configurator.fit')}</span>}
                          </h3>
                          <p className="text-[14px] text-[#6e6e73]">
                            {e.org}
                            {e.location ? ` · ${e.location}` : ''}
                          </p>
                          <p className="mt-2 text-[15px] leading-relaxed text-[#424245]">{e.description}</p>
                        </div>
                      </motion.li>
                    ))}
                  </ol>
                  <ShowAllBtn total={data.experiences.length} n={HIGHLIGHT_N.roles} />
                </Section>

                {/* education + publications */}
                <Section id="cfg-education" title={t('sections.education.title')}>
                  <ol className="grid gap-4 md:grid-cols-3">
                    {data.education.map((e) => (
                      <li key={e.id} className="cfg-card rounded-[20px] bg-white p-6">
                        <p className="text-[13px] text-[#6e6e73]">{e.period}</p>
                        <h3 className="mt-1 text-[17px] font-semibold leading-snug">{e.degree}</h3>
                        <p className="mt-1 text-[14px]">{e.institution}</p>
                        <p className="text-[13.5px] text-[#6e6e73]">
                          {e.location}
                          {e.gpa ? (
                            <>
                              {' · '}
                              {t('common.gpa')} <bdi dir="ltr">{e.gpa}</bdi>
                            </>
                          ) : null}
                        </p>
                        {e.id === 'tehran' && data.publications.find((x) => x.type === 'Master Thesis') && (
                          <p className="mt-2 text-[13px] text-[#6e6e73]">
                            {t('common.thesis')}: <bdi lang="en">{data.publications.find((x) => x.type === 'Master Thesis')!.title}</bdi>
                          </p>
                        )}
                      </li>
                    ))}
                  </ol>
                </Section>

                <Section id="cfg-publications" title={t('sections.publications.title')}>
                  <ol className="space-y-3">
                    {data.publications.map((pub) => (
                      <li key={pub.id} className="cfg-card rounded-[20px] bg-white p-6">
                        <p className="text-[12.5px] font-medium text-[#6e6e73]">
                          {publicationLabel(t, 'pubType', pub.type)} · {publicationLabel(t, 'pubStatus', pub.status)}
                          {pub.year ? ` · ${fmtYear(loc, pub.year)}` : ''}
                        </p>
                        <p lang="en" dir="ltr" className="mt-1 text-start text-[16.5px] font-semibold leading-snug">
                          {pub.title}
                        </p>
                        <p className="mt-1 text-[14px] text-[#6e6e73]">
                          <Authors ownerName={data.person.fullName} p={pub} meClassName="font-semibold text-[#1d1d1f]" etAl={t('common.withCoAuthors')} />
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
                        <div className="mt-2 flex flex-wrap gap-4 text-[13.5px] font-medium">
                          {pub.url && (
                            <a href={pub.url} target="_blank" rel="noreferrer" dir="ltr" className="inline-flex items-center gap-1 text-[#0a66d8] hover:underline">
                              {pub.doi ? `doi:${pub.doi}` : t('common.visit')} <ArrowUpRight className="size-3.5" aria-hidden />
                            </a>
                          )}
                          {pub.bibtex && (
                            <CopyButton value={pub.bibtex} className="inline-flex items-center gap-1 hover:text-[#0a66d8]">
                              <Copy className="size-3.5" aria-hidden /> {t('common.copyBibtex')}
                            </CopyButton>
                          )}
                        </div>
                      </li>
                    ))}
                  </ol>
                </Section>

                {/* skills */}
                <Section id="cfg-skills" title={t('sections.skills.title')} sub={view === 'all' ? t('configurator.skillsSubAll', { count: ranked.skills.length + data.softSkills.length }) : t('configurator.skillsSub', { view: viewName(view) })}>
                  <div className="columns-1 gap-4 md:columns-2">
                    {data.skills.map((c) => (
                      <div key={c.id} className="cfg-card mb-4 break-inside-avoid rounded-[20px] bg-white p-5">
                        <h3 className="text-[16px] font-semibold">{c.label}</h3>
                        {c.groups.map((g) => (
                          <div key={g.id} className="mt-3">
                            {c.groups.length > 1 && <p className="text-[12px] font-medium text-[#6e6e73]">{g.label}</p>}
                            <ul className="mt-1.5 flex flex-wrap gap-1.5 text-[13px]">
                              {g.items.map((it) => {
                                const s = ranked.skills.find((x) => x.groupId === g.id && x.key === it.key);
                                const w = s ? ranked.weightOf(s.domain) : 0;
                                return (
                                  <li key={it.key} title={it.long !== it.name ? it.long : undefined} className={cn('rounded-full px-2.5 py-1', w >= 2 ? 'bg-[#0a66d8] text-white' : w === 1 ? 'bg-[#e8f0fc] text-[#0a4fa8]' : 'bg-[#f5f5f7] text-[#1d1d1f]')}>
                                    <bdi>{it.name}</bdi>
                                  </li>
                                );
                              })}
                            </ul>
                          </div>
                        ))}
                      </div>
                    ))}
                  </div>
                </Section>

                {/* courses */}
                <Section id="cfg-courses" title={t('sections.certifications.title')} sub={t('configurator.shownOf', { shown: shown(HIGHLIGHT_N.courses, data.certifications.length), total: data.certifications.length })}>
                  <ol className="cfg-card divide-y divide-[#f0f0f2] overflow-hidden rounded-[20px] bg-white">
                    {ranked.courses.map(({ item: c }, i) => (
                      <motion.li key={c.name + c.issuer} layout="position" transition={layoutT} hidden={hl && i >= HIGHLIGHT_N.courses ? true : undefined} className="grid grid-cols-[minmax(0,1fr)_auto] gap-x-4 px-5 py-3">
                        <div className="min-w-0">
                          <p className="font-medium leading-snug">
                            <bdi lang="en">{c.name}</bdi>
                          </p>
                          <p className="text-[13px] text-[#6e6e73]">
                            <bdi>{c.issuer}</bdi>
                            {c.year ? ` · ${fmtYear(loc, c.year)}` : ''}
                          </p>
                        </div>
                        <div className="text-end text-[13px]">
                          <p className="text-[#424245]">{c.hours ? t('common.hours', { count: fmtNum(loc, c.hours) }) : c.weeks ? t('common.weeks', { count: fmtNum(loc, c.weeks) }) : ''}</p>
                          {c.url && (
                            <a href={c.url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 font-medium text-[#0a66d8] hover:underline">
                              {t('common.certificate')} <ArrowUpRight className="flip-rtl size-3.5" aria-hidden />
                            </a>
                          )}
                        </div>
                      </motion.li>
                    ))}
                  </ol>
                  <ShowAllBtn total={data.certifications.length} n={HIGHLIGHT_N.courses} />
                </Section>

                {/* languages + contact */}
                <Section id="cfg-languages" title={t('sections.languages.title')}>
                  <ul className="grid gap-4 md:grid-cols-4">
                    {data.languages.map((l) => (
                      <li key={l.id} className={cn('cfg-card rounded-[20px] bg-white p-6', l.cert && 'md:col-span-2')}>
                        <p className="text-[18px] font-semibold">{l.name}</p>
                        <p className="text-[14px] text-[#6e6e73]">{l.level}</p>
                        {l.cert && (
                          <dl className="mt-3 grid grid-cols-5 gap-1 text-center text-[11px]">
                            <div className="rounded-lg bg-[#1d1d1f] px-1 py-1.5 text-white">
                              <dt>{t('ielts.overall')}</dt>
                              <dd className="text-[15px] font-semibold">{fmtNum(loc, l.cert.overall, { minimumFractionDigits: 1 })}</dd>
                            </div>
                            {(['listening', 'reading', 'writing', 'speaking'] as const).map((k) => (
                              <div key={k} className="rounded-lg bg-[#f5f5f7] px-1 py-1.5">
                                <dt className="truncate text-[#6e6e73]">{t(`ielts.${k}`)}</dt>
                                <dd className="text-[15px] font-semibold">{fmtNum(loc, l.cert!.bands[k], { minimumFractionDigits: 1 })}</dd>
                              </div>
                            ))}
                          </dl>
                        )}
                      </li>
                    ))}
                  </ul>
                </Section>

                <Section id="cfg-contact" title={t('sections.contact.title')} sub={`${p.availability} ${t('sections.contact.subtitle')}`}>
                  <div className="flex flex-wrap items-center gap-3">
                    <a href={data.links.email} dir="ltr" className="inline-flex items-center gap-2 break-all rounded-full bg-[#0a66d8] px-5 py-2.5 text-[15px] font-medium text-white hover:bg-[#0858bd]">
                      <Mail className="size-4 shrink-0" aria-hidden /> {p.email}
                    </a>
                    {(['github', 'linkedin', 'orcid', 'scholar'] as const).map((k) =>
                      data.links[k] ? (
                        <a key={k} href={data.links[k]!} target="_blank" rel="noreferrer" aria-label={k} className="grid size-11 place-items-center rounded-full bg-[#f5f5f7] hover:bg-[#e8e8ed]">
                          <BrandIcon name={k} className="size-4" />
                        </a>
                      ) : null,
                    )}
                  </div>
                </Section>
              </>
            )}

            {format === 'json' && (
              <section className="py-10" aria-labelledby="cfg-json-h">
                <h1 id="cfg-json-h" className="cfg-display text-[clamp(1.8rem,3.4vw,2.6rem)] font-semibold">
                  {t('configurator.jsonTitle')}
                </h1>
                <p className="mb-6 mt-1.5 max-w-2xl text-[15.5px] text-[#6e6e73]">{t('configurator.jsonSub')}</p>
                <JsonView json={json} filename={`portfolio.${view}.${loc}.json`} />
              </section>
            )}

            {format === 'print' && (
              <section className="pt-10" aria-labelledby="cfg-print-h">
                <div className="flex flex-wrap items-end justify-between gap-3">
                  <div>
                    <h1 id="cfg-print-h" className="cfg-display text-[clamp(1.8rem,3.4vw,2.6rem)] font-semibold">
                      {t('configurator.printTitle')}
                    </h1>
                    <p className="mt-1.5 max-w-2xl text-[15.5px] text-[#6e6e73]">{t('configurator.printSub')}</p>
                  </div>
                  <button type="button" onClick={() => window.print()} className="inline-flex items-center gap-2 rounded-full bg-[#0a66d8] px-5 py-2.5 text-[14.5px] font-medium text-white hover:bg-[#0858bd]">
                    <Printer className="size-4" aria-hidden /> {t('configurator.printNow')}
                  </button>
                </div>
              </section>
            )}
          </div>

          <div className="cfg-print-wrap py-8">
            <PrintSheet data={data} ranked={ranked} emphasis={emphasis} />
          </div>

          <footer className="cfg-noprint border-t border-[#e5e5ea] pb-24 pt-6 text-[12.5px] text-[#6e6e73]">
            <p>{t('configurator.honesty')}</p>
            <p className="mt-2">{t('common.rights', { year: fmtYear(loc, new Date(data.generatedAt).getUTCFullYear()) })}</p>
          </footer>
        </main>

        {/* summary card */}
        <aside className="cfg-noprint lg:py-14" aria-labelledby="cfg-sum-h">
          <div className="relative overflow-hidden rounded-[22px] border border-[#e5e5ea] bg-white p-5 lg:sticky lg:top-[124px]">
            {mounted && !reduce && <BorderBeam size={90} duration={8} colorFrom="#0a66d8" colorTo="#7fb2ff" borderWidth={1.5} />}
            <h2 id="cfg-sum-h" className="text-[15px] font-semibold">
              {t('configurator.summary')}
            </h2>
            <dl className="mt-3 space-y-2.5 text-[13.5px]">
              <div className="flex items-center justify-between gap-3">
                <dt className="text-[#6e6e73]">{t('configurator.role')}</dt>
                <dd className="flex items-center gap-2 text-end font-medium">
                  <span className="size-3.5 shrink-0 rounded-full" style={{ background: `linear-gradient(135deg, ${v.shot[0]}, ${v.shot[1]})` }} aria-hidden />
                  {viewName(view)}
                </dd>
              </div>
              <div className="flex justify-between gap-3">
                <dt className="text-[#6e6e73]">{t('configurator.depth')}</dt>
                <dd className="font-medium">{t(`configurator.depths.${depth}`)}</dd>
              </div>
              <div className="flex justify-between gap-3">
                <dt className="text-[#6e6e73]">{t('configurator.format')}</dt>
                <dd className="font-medium">{t(`configurator.formats.${format}`)}</dd>
              </div>
              <div className="flex justify-between gap-3 border-t border-[#f0f0f2] pt-2.5">
                <dt className="text-[#6e6e73]">{t('sections.projects.title')}</dt>
                <dd className="font-medium">{t('configurator.nOfM', { n: shown(HIGHLIGHT_N.projects, projectsAll.length), m: projectsAll.length })}</dd>
              </div>
              <div className="flex justify-between gap-3">
                <dt className="text-[#6e6e73]">{t('sections.experience.title')}</dt>
                <dd className="font-medium">{t('configurator.nOfM', { n: shown(HIGHLIGHT_N.roles, data.experiences.length), m: data.experiences.length })}</dd>
              </div>
            </dl>
            <ShimmerButton onClick={copyShare} background="#0a66d8" shimmerColor="#cfe2ff" borderRadius="999px" className="mt-5 w-full px-4 py-2.5 text-[14px] font-medium">
              <span className="inline-flex items-center gap-2">
                {copied ? <Check className="size-4" aria-hidden /> : <Link2 className="size-4" aria-hidden />}
                {copied ? t('configurator.linkCopied') : t('configurator.copyLink')}
              </span>
            </ShimmerButton>
            <p className="cfg-mono mt-2 truncate text-[11px] text-[#6e6e73]" dir="ltr" title={shareUrl}>
              {shareUrl || '…'}
            </p>
            <div className="mt-3 grid grid-cols-2 gap-2 text-[13px] font-medium">
              <button type="button" onClick={() => window.print()} className="inline-flex items-center justify-center gap-1.5 rounded-full border border-[#d2d2d7] px-3 py-2 hover:border-[#0a66d8]">
                <Printer className="size-3.5" aria-hidden /> {t('configurator.printShort')}
              </button>
              <button type="button" onClick={() => setFormat('json')} className="inline-flex items-center justify-center gap-1.5 rounded-full border border-[#d2d2d7] px-3 py-2 hover:border-[#0a66d8]">
                {'{ }'} JSON
              </button>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
