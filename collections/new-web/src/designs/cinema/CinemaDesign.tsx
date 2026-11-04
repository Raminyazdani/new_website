'use client';

import { useEffect, useMemo, useState } from 'react';
import { useTranslations } from 'next-intl';
import { useReducedMotion } from 'motion/react';
import { ArrowUpRight, Copy, Mail, Ticket } from 'lucide-react';
import { Authors } from '@/components/kit/Authors';
import { Dialog } from '@/components/kit/Dialog';
import { BrandIcon } from '@/components/shared/BrandIcon';
import { CopyButton } from '@/components/shared/CopyButton';
import { LocaleSwitcher } from '@/components/shared/LocaleSwitcher';
import { allProjects } from '@/lib/derive';
import { fmtNum, fmtYear, publicationLabel } from '@/lib/format';
import type { Project, ProjectCategory, SiteData } from '@/lib/types';
import { cn } from '@/lib/utils';
import { Credits } from './Credits';
import { Bulbs, Projector } from './Marquee';
import { Reel } from './Reel';
import './cinema.css';

const POSTER: Record<ProjectCategory, { from: string; to: string; accent: string }> = {
  omics: { from: '#15403f', to: '#071a1b', accent: '#86dccf' },
  structural: { from: '#33194f', to: '#120822', accent: '#d0b0ff' },
  ml: { from: '#4a1218', to: '#1a0608', accent: '#ff9c8c' },
  software: { from: '#14305a', to: '#070f1e', accent: '#9cc2ff' },
  biotech: { from: '#1b4226', to: '#08170d', accent: '#a6e6ae' },
};

function Kicker({ children }: { children: React.ReactNode }) {
  return <p className="cin-kicker">{children}</p>;
}

function Poster({ p, n, onOpen, loc }: { p: Project; n: number; onOpen: () => void; loc: string }) {
  const t = useTranslations();
  const pal = POSTER[p.category];
  const size = p.title.length < 22 ? 'text-[46px]' : p.title.length < 40 ? 'text-[38px]' : 'text-[31px]';
  return (
    <button
      type="button"
      onClick={onOpen}
      aria-haspopup="dialog"
      className="cin-poster group relative flex aspect-[2/3] w-full flex-col overflow-hidden rounded-[6px] p-5 text-start"
      style={{ background: `radial-gradient(120% 80% at 50% 0%, ${pal.from}, ${pal.to} 70%)`, ['--acc' as string]: pal.accent }}
    >
      <span className="cin-mono flex justify-between text-[11px] uppercase tracking-[0.18em] text-[var(--acc)] rtl:normal-case rtl:tracking-normal">
        <span>{t(`categories.${p.category}`)}</span>
        <span>#{fmtNum(loc, n, { minimumIntegerDigits: 2 })}</span>
      </span>
      <span className={cn('cin-display mt-auto leading-[0.92] text-[#fff8ec] transition-transform duration-300 group-hover:-translate-y-1', size)} dir="auto">
        {p.title}
      </span>
      {p.tags.length > 0 && (
        <span className="mt-4 block">
          <span className="cin-mono block text-[10.5px] uppercase tracking-[0.22em] text-[var(--acc)] rtl:normal-case rtl:tracking-normal">{t('cinema.starring')}</span>
          <span className="cin-display mt-1 block text-[19px] leading-tight tracking-[0.04em] text-[#f2ece3] rtl:tracking-normal" dir="ltr">
            {p.tags.join(' · ')}
          </span>
        </span>
      )}
      <span className="mt-4 flex items-center justify-between border-t border-white/15 pt-3 text-[12px] text-[#e9dfcf]">
        <span>{p.metric ? <bdi dir="ltr">{p.metric}</bdi> : t('cinema.details')}</span>
        <ArrowUpRight className="flip-rtl size-4 opacity-70 transition-transform group-hover:translate-x-0.5" aria-hidden />
      </span>
    </button>
  );
}

export default function CinemaDesign({ data }: { data: SiteData }) {
  const t = useTranslations();
  const loc = data.locale;
  const rtl = data.dir === 'rtl';
  const reduceRaw = useReducedMotion();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  const reduce = mounted && !!reduceRaw;
  const projects = useMemo(() => allProjects(data), [data]);
  const showing = data.projects.filter((p) => p.highlight);
  const [open, setOpen] = useState<Project | null>(null);
  const p = data.person;
  const firstName = p.displayName.split(' ')[0];
  const feature = useMemo(() => {
    const score = (x: Project) => (x.metric ? 3 : 0) + x.tags.length + (x.url ? 1 : 0) + (x.repo ? 1 : 0) + x.description.length / 100;
    return [...showing].sort((a, b) => score(b) - score(a))[0];
  }, [showing]);
  const thesis = data.publications.find((x) => x.type === 'Master Thesis');

  return (
    <div className="cinema-root min-h-dvh">
      <header className="sticky top-0 z-40 border-b border-[var(--c-line)] bg-[#0b0a09]/85 backdrop-blur-md">
        <div className="mx-auto flex h-14 max-w-[1320px] items-center gap-4 px-4 sm:px-6">
          <a href="#top" className="cin-display flex items-center gap-2 text-[24px] leading-none tracking-[0.06em] text-[var(--c-amber)] rtl:tracking-normal">
            <Ticket className="size-5" aria-hidden /> {t('cinema.brand')}
          </a>
          <nav aria-label={t('nav.menu')} className="ms-auto hidden gap-1 text-[13.5px] lg:flex">
            {(['showing', 'reel', 'screenplay', 'credits', 'tickets'] as const).map((k) => (
              <a key={k} href={`#${k}`} className="rounded-full px-3 py-1.5 text-[var(--c-muted)] hover:text-[var(--c-ink)]">
                {t(`cinema.nav.${k}`)}
              </a>
            ))}
          </nav>
          <LocaleSwitcher className="ms-auto rounded-full border border-[var(--c-line)] p-0.5 lg:ms-2" itemClassName="h-7 min-w-8 rounded-full px-2 text-xs" activeClassName="bg-[var(--c-amber)] text-[#0b0a09]" />
        </div>
      </header>

      {/* marquee */}
      <section id="top" className="relative isolate flex min-h-[88vh] items-center overflow-hidden py-24">
        <Projector reduce={reduce} />
        <div className="cin-curtain cin-curtain-l" aria-hidden />
        <div className="cin-curtain cin-curtain-r" aria-hidden />
        <div className="relative z-10 mx-auto w-full max-w-[1100px] px-6 text-center sm:px-10">
          <p className="cin-kicker">{t('cinema.tonight')}</p>
          <div className="cin-sign relative mx-auto mt-6 rounded-[26px] px-6 pb-10 pt-9 sm:px-14">
            <Bulbs />
            <p className="cin-mono text-[12px] uppercase tracking-[0.3em] text-[var(--c-amber)] rtl:normal-case rtl:tracking-normal">{t('cinema.nowShowing')}</p>
            <h1 className="cin-display cin-glow mt-3 text-[clamp(3.6rem,11vw,9rem)] leading-[0.86] text-[#fff6e0]">{p.displayName}</h1>
            <p className="cin-display mt-4 text-[clamp(1.2rem,2.6vw,1.9rem)] tracking-[0.08em] text-[var(--c-amber)] rtl:tracking-normal">{p.headline}</p>
          </div>
          <p className="mx-auto mt-8 max-w-2xl text-[17px] leading-relaxed text-[var(--c-muted)]">{p.tagline}</p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <a href="#reel" className="rounded-full bg-[var(--c-amber)] px-6 py-2.5 text-[14px] font-bold text-[#0b0a09] hover:bg-[#ffc457]">
              {t('cinema.ctaReel')}
            </a>
            <a href="#screenplay" className="rounded-full border border-[var(--c-line)] bg-black/40 px-6 py-2.5 text-[14px] font-semibold hover:border-[var(--c-amber)]">
              {t('cinema.ctaScript')}
            </a>
          </div>
          <p className="mt-6 text-[12.5px] text-[var(--c-muted)]">
            <span className="cin-mono me-2 rounded border border-[var(--c-amber)]/50 px-1.5 py-0.5 text-[10.5px] uppercase text-[var(--c-amber)] rtl:normal-case">{t('common.metaphor')}</span>
            {t('cinema.honesty')}
          </p>
        </div>
      </section>

      <main>
        {/* trailer */}
        <section id="trailer" className="mx-auto max-w-[1320px] scroll-mt-16 px-4 py-24 sm:px-6">
          <Kicker>{t('cinema.trailerKicker')}</Kicker>
          <div className="mt-4 grid gap-12 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)]">
            <div>
              <p className="cin-display text-[clamp(2.2rem,4.6vw,3.8rem)] leading-[0.98]">{p.statement}</p>
              <div className="mt-8 space-y-4 text-[16.5px] leading-relaxed text-[var(--c-muted)]">
                {p.about.map((a, i) => (
                  <p key={i}>{a}</p>
                ))}
              </div>
            </div>
            <dl className="grid grid-cols-2 gap-px self-start overflow-hidden rounded-[10px] border border-[var(--c-line)] bg-[var(--c-line)]">
              {data.stats.map((s) => (
                <div key={s.id} className="bg-[#0f0d0b] p-5">
                  <dd className="cin-display text-[44px] leading-none text-[var(--c-amber)]">
                    {fmtNum(loc, s.value)}
                    {s.suffix}
                  </dd>
                  <dt className="mt-2 text-[13.5px] leading-snug text-[var(--c-muted)]">{s.label}</dt>
                </div>
              ))}
            </dl>
          </div>
        </section>

        {/* now showing */}
        <section id="showing" aria-labelledby="cin-showing" className="mx-auto max-w-[1320px] scroll-mt-16 px-4 py-20 sm:px-6">
          <Kicker>{t('cinema.showingKicker')}</Kicker>
          <h2 id="cin-showing" className="cin-display mt-1 text-[clamp(2.6rem,6vw,4.6rem)] leading-[0.9]">
            {t('cinema.showingTitle')}
          </h2>
          <p className="mt-2 max-w-2xl text-[15px] text-[var(--c-muted)]">{t('cinema.showingSub', { count: showing.length })}</p>
          <ul className="mt-10 grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-4">
            {showing.map((pr, i) => (
              <li key={pr.id}>
                <Poster p={pr} n={i + 1} loc={loc} onOpen={() => setOpen(pr)} />
              </li>
            ))}
          </ul>
        </section>

        {/* the reel */}
        <section id="reel" aria-labelledby="cin-reel" className="scroll-mt-14 py-12">
          <Reel projects={projects} loc={loc} rtl={rtl} skipTo="screenplay" />
        </section>

        {/* screenplay */}
        <section id="screenplay" aria-labelledby="cin-script" className="mx-auto max-w-[1320px] scroll-mt-16 px-4 py-24 sm:px-6">
          <Kicker>{t('cinema.scriptKicker')}</Kicker>
          <h2 id="cin-script" className="cin-display mt-1 text-[clamp(2.6rem,6vw,4.6rem)] leading-[0.9]">
            {t('cinema.scriptTitle')}
          </h2>
          <p className="mt-2 max-w-2xl text-[15px] text-[var(--c-muted)]">{t('cinema.scriptSub', { count: data.experiences.length })}</p>
          <div className="cin-page mx-auto mt-10 max-w-[860px] rounded-[4px] px-6 py-12 sm:px-16">
            <p className="cin-script text-[15px] font-bold uppercase rtl:normal-case">{t('cinema.fadeIn')}</p>
            <ol>
              {data.experiences.map((e, i) => (
                <li key={e.id} className="cin-script mt-10 text-[15px] leading-[1.65]">
                  <p className="flex flex-wrap items-baseline justify-between gap-x-6 font-bold uppercase rtl:normal-case">
                    <span>
                      <span className="me-3 inline-block min-w-[2ch] text-[#7a6f60]">{fmtNum(loc, i + 1)}</span>
                      {t('cinema.int')} {e.org}
                      {e.location ? ` — ${e.location}` : ''}
                    </span>
                    <span className="text-[13px] font-normal text-[#5f564b]">{e.period || t('common.undated')}</span>
                  </p>
                  <p className="mt-4 text-center font-bold uppercase rtl:normal-case">{firstName}</p>
                  <p className="text-center italic text-[#5f564b] rtl:not-italic">({e.role})</p>
                  <p className="mx-auto mt-3 max-w-[40rem]">{e.description}</p>
                  <p className="mt-4 text-end font-bold uppercase rtl:normal-case">{i === data.experiences.length - 1 ? t('cinema.fadeOut') : t('cinema.cutTo')}</p>
                </li>
              ))}
            </ol>
          </div>
        </section>

        {/* feature presentation */}
        {feature && (
          <section id="feature" aria-labelledby="cin-feature" className="relative scroll-mt-16 overflow-hidden border-y border-[var(--c-line)] bg-[radial-gradient(90%_70%_at_50%_0%,#2a1d0c,#0b0a09_70%)] py-24">
            <div className="mx-auto grid max-w-[1320px] gap-12 px-4 sm:px-6 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,1fr)]">
              <div>
                <Kicker>{t('cinema.featureKicker')}</Kicker>
                <h2 id="cin-feature" className="cin-display cin-glow mt-2 text-[clamp(3rem,7vw,5.6rem)] leading-[0.88] text-[#fff6e0]" dir="auto">
                  {feature.title}
                </h2>
                <dl className="mt-8 space-y-6">
                  <div>
                    <dt className="cin-mono text-[11.5px] uppercase tracking-[0.2em] text-[var(--c-amber)] rtl:normal-case rtl:tracking-normal">{t('cinema.logline')}</dt>
                    <dd className="mt-1.5 text-[18px] leading-relaxed" dir="auto">
                      {feature.description}
                    </dd>
                  </div>
                  <div>
                    <dt className="cin-mono text-[11.5px] uppercase tracking-[0.2em] text-[var(--c-amber)] rtl:normal-case rtl:tracking-normal">{t('cinema.cast')}</dt>
                    <dd className="cin-display mt-1.5 text-[28px] leading-tight tracking-[0.04em] rtl:tracking-normal" dir="ltr">
                      {feature.tags.join(' · ')}
                    </dd>
                  </div>
                  <div>
                    <dt className="cin-mono text-[11.5px] uppercase tracking-[0.2em] text-[var(--c-amber)] rtl:normal-case rtl:tracking-normal">{t('cinema.result')}</dt>
                    <dd className="mt-1.5 flex flex-wrap items-center gap-3 text-[15px]">
                      {feature.metric ? (
                        <span>
                          <bdi dir="ltr" className="cin-display text-[36px] text-[var(--c-amber)]">
                            {feature.metric}
                          </bdi>{' '}
                          <span className="text-[var(--c-muted)]">{t('cinema.asStated')}</span>
                        </span>
                      ) : null}
                      {feature.url && (
                        <a href={feature.url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 rounded-full bg-[var(--c-amber)] px-4 py-2 font-bold text-[#0b0a09] hover:bg-[#ffc457]">
                          {t('common.visit')} <ArrowUpRight className="size-4" aria-hidden />
                        </a>
                      )}
                      {feature.repo && (
                        <a href={feature.url ?? `https://github.com/${feature.repo}`} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 rounded-full border border-[var(--c-line)] px-4 py-2 font-semibold hover:border-[var(--c-amber)]">
                          <BrandIcon name="github" className="size-4" /> {t('common.code')}
                        </a>
                      )}
                    </dd>
                  </div>
                </dl>
              </div>
              <figure className="self-center rounded-[12px] border border-[var(--c-line)] bg-black/40 p-5">
                <svg viewBox="0 0 400 230" className="block w-full" role="img" aria-label={t('cinema.curveLabel')}>
                  <g transform={rtl ? 'translate(400 0) scale(-1 1)' : undefined}>
                    <line x1="30" y1="200" x2="385" y2="200" stroke="#3a332b" />
                    <line x1="30" y1="200" x2="30" y2="20" stroke="#3a332b" />
                    <path d="M30 150 C 90 150, 110 150, 140 110 S 190 30, 210 30 S 260 90, 290 150 S 340 180, 385 180" fill="none" stroke="#ffb22c" strokeWidth="3" className="cin-curve" />
                    <circle cx="210" cy="30" r="5" fill="#fff6e0" />
                  </g>
                  {[
                    { x: 70, y: 140, k: 'actI' },
                    { x: 210, y: 18, k: 'actII' },
                    { x: 345, y: 170, k: 'actIII' },
                  ].map((a) => (
                    <text key={a.k} x={rtl ? 400 - a.x : a.x} y={a.y} textAnchor="middle" className="fill-[#f2ece3] text-[12px]">
                      {t(`cinema.${a.k}`)}
                    </text>
                  ))}
                  <text x={rtl ? 370 : 30} y="220" textAnchor={rtl ? 'end' : 'start'} className="fill-[#b9ad9c] text-[10.5px]">
                    {t('cinema.curveAxis')}
                  </text>
                </svg>
                <figcaption className="mt-2 text-[12.5px] text-[var(--c-muted)]">
                  <span className="cin-mono me-1.5 rounded border border-[var(--c-amber)]/50 px-1 py-0.5 text-[10px] uppercase text-[var(--c-amber)] rtl:normal-case">{t('common.metaphor')}</span>
                  {t('cinema.curveNote')}
                </figcaption>
              </figure>
            </div>
          </section>
        )}

        {/* programme: publications + education */}
        <section id="programme" aria-labelledby="cin-prog" className="mx-auto max-w-[1320px] scroll-mt-16 px-4 py-24 sm:px-6">
          <Kicker>{t('cinema.programmeKicker')}</Kicker>
          <h2 id="cin-prog" className="cin-display mt-1 text-[clamp(2.6rem,6vw,4.6rem)] leading-[0.9]">
            {t('sections.publications.title')}
          </h2>
          <ol className="mt-8 grid gap-4 lg:grid-cols-2">
            {data.publications.map((pub) => (
              <li key={pub.id} className="rounded-[10px] border border-[var(--c-line)] bg-[#0f0d0b] p-5">
                <p className="cin-mono text-[11px] uppercase tracking-[0.16em] text-[var(--c-amber)] rtl:normal-case rtl:tracking-normal">
                  {publicationLabel(t, 'pubType', pub.type)} · {publicationLabel(t, 'pubStatus', pub.status)}
                  {pub.year ? ` · ${fmtYear(loc, pub.year)}` : ''}
                </p>
                <p lang="en" dir="ltr" className="mt-2 text-start text-[17px] font-semibold leading-snug">
                  {pub.title}
                </p>
                <p className="mt-1.5 text-[14px] text-[var(--c-muted)]">
                  <Authors ownerName={data.person.fullName} p={pub} meClassName="font-semibold text-[var(--c-ink)]" etAl={t('common.withCoAuthors')} />
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
                <div className="mt-3 flex flex-wrap gap-4 text-[13.5px] font-semibold">
                  {pub.url && (
                    <a href={pub.url} target="_blank" rel="noreferrer" dir="ltr" className="inline-flex items-center gap-1 text-[var(--c-amber)] hover:underline">
                      {pub.doi ? `doi:${pub.doi}` : t('common.visit')} <ArrowUpRight className="size-3.5" aria-hidden />
                    </a>
                  )}
                  {pub.bibtex && (
                    <CopyButton value={pub.bibtex} className="inline-flex items-center gap-1 hover:text-[var(--c-amber)]">
                      <Copy className="size-3.5" aria-hidden /> {t('common.copyBibtex')}
                    </CopyButton>
                  )}
                </div>
              </li>
            ))}
          </ol>

          <h2 className="cin-display mt-20 text-[clamp(2.2rem,4.6vw,3.6rem)] leading-[0.9]">{t('sections.education.title')}</h2>
          <ol className="mt-8 grid gap-5 md:grid-cols-3">
            {data.education.map((e, i) => (
              <li key={e.id} className="cin-clapper overflow-hidden rounded-[8px] border border-[#3a332b] bg-[#141210]">
                <div className="cin-clapper-top h-7" aria-hidden />
                <dl className="cin-script grid grid-cols-[auto_minmax(0,1fr)] gap-x-4 gap-y-2 p-5 text-[14px]">
                  <dt className="text-[var(--c-muted)]">{t('cinema.clapScene')}</dt>
                  <dd className="font-bold">{e.degree}</dd>
                  <dt className="text-[var(--c-muted)]">{t('cinema.clapProd')}</dt>
                  <dd>{e.institution}</dd>
                  <dt className="text-[var(--c-muted)]">{t('cinema.clapTake')}</dt>
                  <dd>
                    {fmtNum(loc, data.education.length - i)} · {e.period}
                  </dd>
                  <dt className="text-[var(--c-muted)]">{t('cinema.clapRoll')}</dt>
                  <dd>{e.location}</dd>
                  {e.gpa && (
                    <>
                      <dt className="text-[var(--c-muted)]">{t('common.gpa')}</dt>
                      <dd>
                        <bdi dir="ltr">{e.gpa}</bdi>
                      </dd>
                    </>
                  )}
                  {e.id === 'tehran' && thesis && (
                    <>
                      <dt className="text-[var(--c-muted)]">{t('common.thesis')}</dt>
                      <dd>
                        <bdi lang="en">{thesis.title}</bdi>
                      </dd>
                    </>
                  )}
                </dl>
              </li>
            ))}
          </ol>
        </section>

        {/* end credits */}
        <section id="credits" aria-labelledby="cin-credits" className="mx-auto max-w-[1320px] scroll-mt-16 px-4 py-20 sm:px-6">
          <Kicker>{t('cinema.creditsKicker2')}</Kicker>
          <h2 id="cin-credits" className="cin-display mt-1 text-[clamp(2.6rem,6vw,4.6rem)] leading-[0.9]">
            {t('cinema.creditsTitle')}
          </h2>
          <p className="mb-6 mt-2 max-w-2xl text-[15px] text-[var(--c-muted)]">{t('cinema.creditsSub', { skills: data.skills.reduce((n, c) => n + c.groups.reduce((m, g) => m + g.items.length, 0), 0), courses: data.certifications.length })}</p>
          <Credits data={data} reduce={reduce} />
        </section>

        {/* tickets */}
        <section id="tickets" aria-labelledby="cin-tickets" className="mx-auto max-w-[1320px] scroll-mt-16 px-4 py-24 sm:px-6">
          <div className="cin-ticket relative mx-auto grid max-w-4xl overflow-hidden rounded-[14px] bg-[var(--c-amber)] text-[#0b0a09] md:grid-cols-[minmax(0,1fr)_13rem]">
            <div className="p-7 sm:p-9">
              <p className="cin-mono text-[12px] font-bold uppercase tracking-[0.24em] rtl:normal-case rtl:tracking-normal">{t('cinema.ticketsKicker')}</p>
              <h2 id="cin-tickets" className="cin-display mt-2 text-[clamp(2.4rem,5vw,3.8rem)] leading-[0.92]">
                {t('sections.contact.title')}
              </h2>
              <p className="mt-3 text-[15.5px] leading-relaxed">
                {p.availability} {t('sections.contact.subtitle')}
              </p>
              <a href={data.links.email} dir="ltr" className="mt-6 inline-flex items-center gap-2 break-all rounded-full bg-[#0b0a09] px-5 py-2.5 text-[15px] font-bold text-[var(--c-amber)] hover:bg-black">
                <Mail className="size-4 shrink-0" aria-hidden /> {p.email}
              </a>
              <div className="mt-5 flex flex-wrap gap-2">
                {(['github', 'linkedin', 'orcid', 'scholar'] as const).map((k) =>
                  data.links[k] ? (
                    <a key={k} href={data.links[k]!} target="_blank" rel="noreferrer" aria-label={k} className="grid size-10 place-items-center rounded-full border-2 border-[#0b0a09] hover:bg-[#0b0a09] hover:text-[var(--c-amber)]">
                      <BrandIcon name={k} className="size-4" />
                    </a>
                  ) : null,
                )}
              </div>
            </div>
            <div className="cin-stub flex flex-col justify-between border-t-2 border-dashed border-[#0b0a09]/60 p-7 md:border-s-2 md:border-t-0">
              <p className="cin-display text-[34px] leading-none tracking-[0.06em] rtl:tracking-normal">{t('cinema.admitOne')}</p>
              <dl className="mt-6 space-y-2 text-[13px]">
                <div>
                  <dt className="font-bold uppercase opacity-70 rtl:normal-case">{t('cinema.seat')}</dt>
                  <dd className="font-semibold">{p.location}</dd>
                </div>
                <div>
                  <dt className="font-bold uppercase opacity-70 rtl:normal-case">{t('cinema.languages')}</dt>
                  <dd className="font-semibold">{data.languages.map((l) => l.name).join(' · ')}</dd>
                </div>
              </dl>
            </div>
          </div>
          <footer className="mt-16 flex flex-wrap justify-between gap-3 border-t border-[var(--c-line)] pb-20 pt-6 text-[12.5px] text-[var(--c-muted)]">
            <span>{t('common.rights', { year: fmtYear(loc, new Date(data.generatedAt).getUTCFullYear()) })}</span>
            <span>{t('cinema.footer')}</span>
          </footer>
        </section>
      </main>

      <Dialog
        open={!!open}
        onClose={() => setOpen(null)}
        title={open?.title ?? ''}
        className="max-w-2xl rounded-[12px] border border-[var(--c-line)] bg-[#12100d] p-7 text-[var(--c-ink)] shadow-2xl cin-dialog"
        closeClassName="border border-[var(--c-line)] hover:border-[var(--c-amber)]"
      >
        {open && (
          <div className="mt-4">
            <p className="cin-mono text-[11.5px] uppercase tracking-[0.18em] text-[var(--c-amber)] rtl:normal-case rtl:tracking-normal">
              {t(`categories.${open.category}`)}
              {open.metric ? (
                <>
                  {' · '}
                  <bdi dir="ltr">{open.metric}</bdi>
                </>
              ) : null}
            </p>
            <p className="mt-3 text-[16px] leading-relaxed" dir="auto">
              {open.description}
            </p>
            {open.tags.length > 0 && (
              <p className="mt-4 text-[14px]">
                <span className="cin-mono me-2 text-[11px] uppercase tracking-[0.2em] text-[var(--c-amber)] rtl:normal-case rtl:tracking-normal">{t('cinema.starring')}</span>
                <span dir="ltr">{open.tags.join(' · ')}</span>
              </p>
            )}
            <div className="mt-6 flex flex-wrap gap-3 text-[14px] font-semibold">
              {open.url && (
                <a href={open.url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 rounded-full bg-[var(--c-amber)] px-4 py-2 text-[#0b0a09]">
                  {t('common.visit')} <ArrowUpRight className="size-4" aria-hidden />
                </a>
              )}
              {open.repo && (
                <a href={open.url ?? `https://github.com/${open.repo}`} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 rounded-full border border-[var(--c-line)] px-4 py-2 hover:border-[var(--c-amber)]">
                  <BrandIcon name="github" className="size-4" /> {t('common.code')}
                </a>
              )}
            </div>
          </div>
        )}
      </Dialog>
    </div>
  );
}
