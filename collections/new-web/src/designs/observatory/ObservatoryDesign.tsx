'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useTranslations } from 'next-intl';
import { useReducedMotion } from 'motion/react';
import { ArrowUpRight, Copy, Mail, Search, Telescope } from 'lucide-react';
import { Authors } from '@/components/kit/Authors';
import { Expandable } from '@/components/kit/Expandable';
import { ShowAll } from '@/components/kit/ShowAll';
import { Meteors } from '@/components/magicui/meteors';
import { Ripple } from '@/components/magicui/ripple';
import { BrandIcon } from '@/components/shared/BrandIcon';
import { CopyButton } from '@/components/shared/CopyButton';
import { LocaleSwitcher } from '@/components/shared/LocaleSwitcher';
import { allProjects, courseHoursByYear, domainEvidence, hash01, projectDomains, roleDomains, skillIndex, skillProjects } from '@/lib/derive';
import { fmtNum, fmtYear, numberLocale, publicationLabel } from '@/lib/format';
import type { SiteData } from '@/lib/types';
import { cn } from '@/lib/utils';
import { HeroSky, SkyGlobe } from './SkyCanvas';
import { buildCatalogue, buildSky, catNo, KIND_STYLE, STAR_KINDS, type CatKind, type StarKind } from './sky';
import './observatory.css';

const CAT_KINDS: CatKind[] = ['role', 'project', 'course', 'skill', 'soft'];

const monthYear = (loc: string, s: string | null, y: number | null) => {
  if (s) {
    const [yy, mm] = s.split('-').map(Number);
    if (mm) return new Intl.DateTimeFormat(numberLocale(loc), { month: 'short', year: 'numeric', timeZone: 'UTC' }).format(new Date(Date.UTC(yy, mm - 1, 1)));
  }
  return y ? fmtYear(loc, y) : '—';
};

function SectionHead({ id, kicker, title, sub }: { id: string; kicker: string; title: string; sub?: string }) {
  return (
    <div className="mb-10 max-w-3xl">
      <p className="obs-mono text-[12px] uppercase tracking-[0.2em] text-[var(--o-gold)] rtl:normal-case rtl:tracking-normal">{kicker}</p>
      <h2 id={id} className="obs-display mt-2 text-[clamp(2.2rem,4.4vw,3.6rem)] font-medium leading-[1.02] rtl:leading-[1.35]">
        {title}
      </h2>
      {sub && <p className="mt-3 text-[16px] leading-relaxed text-[var(--o-muted)]">{sub}</p>}
    </div>
  );
}

function Nebula({ seed, hue, size = 56 }: { seed: string; hue: number; size?: number }) {
  const x = 30 + 40 * hash01(seed, 8);
  const y = 30 + 40 * hash01(seed, 9);
  const h2 = (hue + 40 + 60 * hash01(seed, 10)) % 360;
  return (
    <span
      aria-hidden
      className="obs-nebula block shrink-0 rounded-full"
      style={{
        width: size,
        height: size,
        background: `radial-gradient(circle at ${x}% ${y}%, #fff 0 3%, oklch(0.86 0.12 ${hue} / 0.95) 6%, oklch(0.62 0.16 ${hue} / 0.55) 22%, oklch(0.42 0.14 ${h2} / 0.3) 46%, transparent 70%)`,
        transform: `rotate(${Math.round(360 * hash01(seed, 7))}deg) scaleX(${(0.75 + 0.4 * hash01(seed, 11)).toFixed(2)})`,
      }}
    />
  );
}

export default function ObservatoryDesign({ data }: { data: SiteData }) {
  const t = useTranslations();
  const loc = data.locale;
  const rtl = data.dir === 'rtl';
  const reduceRaw = useReducedMotion();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  const reduce = mounted && !!reduceRaw;

  const catalogue = useMemo(() => buildCatalogue(data), [data]);
  const sky = useMemo(() => buildSky(data, catalogue), [data, catalogue]);
  const evidence = useMemo(() => domainEvidence(data), [data]);
  const projects = useMemo(() => allProjects(data), [data]);
  const skills = useMemo(() => skillIndex(data), [data]);
  const noOf = useMemo(() => new Map(catalogue.map((c) => [c.key, c.no])), [catalogue]);
  const labels = useMemo(() => Object.fromEntries(data.domains.map((d) => [d.id, t(`domains.${d.id}`)])), [data, t]);
  const hueOf = (id: string) => data.domains.find((d) => d.id === id)?.hue ?? 230;
  const kindLabels = Object.fromEntries(CAT_KINDS.map((k) => [k, t(`observatory.kinds.${k}`)])) as Record<CatKind, string>;

  const [sel, setSel] = useState(data.domains[0]?.id ?? '');
  const [focusKey, setFocusKey] = useState<string | null>(null);
  const [skillFocus, setSkillFocus] = useState<string | null>(null);
  const pulseKeys = useMemo(() => new Set(skillFocus ? skillProjects({ name: skillFocus }, projects).map((p) => `project:${p.id}`) : []), [skillFocus, projects]);
  const select = (domain: string, key?: string) => {
    setSel(domain);
    setFocusKey(key ?? null);
  };
  const goSky = (domain: string) => {
    select(domain);
    document.getElementById('sky')?.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'start' });
  };

  const ev = evidence.find((e) => e.id === sel) ?? evidence[0];
  const panelRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!focusKey) return;
    const el = panelRef.current?.querySelector<HTMLElement>(`[data-key="${CSS.escape(focusKey)}"]`);
    el?.scrollIntoView({ block: 'nearest', behavior: reduce ? 'auto' : 'smooth' });
  }, [focusKey, sel, reduce]);

  const p = data.person;
  const constName = labels[sel] ?? sel;
  const hours = courseHoursByYear(data);
  const years = hours.length ? Array.from({ length: hours[hours.length - 1].year - hours[0].year + 1 }, (_, i) => hours[0].year + i) : [];
  const maxH = Math.max(1, ...hours.map((h) => h.hours));
  const courseNo = (i: number) => noOf.get(`course:${i}`) ?? 0;

  return (
    <div className="observatory-root min-h-dvh">
      <header className="sticky top-0 z-40 border-b border-[var(--o-line)] bg-[#050816]/80 backdrop-blur-md">
        <div className="mx-auto flex h-14 max-w-[1320px] items-center gap-4 px-4 sm:px-6">
          <a href="#top" className="flex items-center gap-2.5">
            <Telescope className="size-5 text-[var(--o-gold)]" aria-hidden />
            <span className="obs-display text-[19px] font-semibold italic rtl:not-italic">{t('observatory.brand')}</span>
          </a>
          <nav aria-label={t('nav.menu')} className="ms-auto hidden gap-0.5 text-[13.5px] lg:flex">
            {(['sky', 'deepsky', 'log', 'hours', 'catalogue', 'signal'] as const).map((k) => (
              <a key={k} href={`#${k}`} className="rounded-full px-3 py-1.5 text-[var(--o-muted)] hover:bg-white/5 hover:text-[var(--o-ink)]">
                {t(`observatory.nav.${k}`)}
              </a>
            ))}
          </nav>
          <LocaleSwitcher className="ms-auto rounded-full border border-[var(--o-line)] p-0.5 lg:ms-2" itemClassName="h-7 min-w-8 rounded-full px-2 text-xs" activeClassName="bg-[var(--o-gold)] text-[#050816]" />
        </div>
      </header>

      {/* hero */}
      <section id="top" className="relative isolate flex min-h-[86vh] items-end overflow-hidden">
        <HeroSky model={sky} labels={labels} reduce={reduce} rtl={rtl} />
        {mounted && !reduce && <Meteors number={12} className="bg-[#dfe6ff] shadow-[0_0_0_1px_#ffffff18]" tailClassName="bg-gradient-to-r from-[#dfe6ff] to-transparent" />}
        <div className="obs-scrim pointer-events-none absolute inset-0" aria-hidden />
        <div className="relative mx-auto w-full max-w-[1320px] px-4 pb-16 pt-28 sm:px-6">
          <div className="max-w-2xl">
            <p className="obs-mono text-[12.5px] uppercase tracking-[0.22em] text-[var(--o-gold)] rtl:normal-case rtl:tracking-normal">{t('observatory.kicker')}</p>
            <h1 className="obs-display mt-4 text-[clamp(3.2rem,8vw,6.6rem)] font-medium leading-[0.92] rtl:leading-[1.3]">{p.displayName}</h1>
            <p className="mt-5 text-[clamp(1.05rem,1.8vw,1.3rem)] font-medium">{p.headline}</p>
            <p className="mt-3 text-[16px] leading-relaxed text-[var(--o-muted)]">{p.statement}</p>
            <div className="mt-8 flex flex-wrap gap-3">
              <a href="#sky" className="rounded-full bg-[var(--o-gold)] px-5 py-2.5 text-[14px] font-semibold text-[#050816] hover:bg-[#f0d394]">
                {t('observatory.ctaSky')}
              </a>
              <a href="#catalogue" className="rounded-full border border-[var(--o-line)] bg-[#050816]/60 px-5 py-2.5 text-[14px] font-semibold hover:border-[var(--o-gold)]">
                {t('observatory.ctaCatalogue')}
              </a>
            </div>
            <p className="mt-8 max-w-xl text-[12.5px] leading-relaxed text-[var(--o-muted)]">
              <span className="obs-mono me-2 rounded border border-[var(--o-gold)]/50 px-1.5 py-0.5 text-[10.5px] uppercase text-[var(--o-gold)] rtl:normal-case">{t('common.metaphor')}</span>
              {t('observatory.honesty')}
            </p>
          </div>
        </div>
      </section>

      <main className="mx-auto max-w-[1320px] px-4 sm:px-6">
        {/* sky explorer */}
        <section id="sky" aria-labelledby="obs-sky" className="scroll-mt-16 py-20">
          <SectionHead id="obs-sky" kicker={t('observatory.skyKicker')} title={t('observatory.skyTitle')} sub={t('observatory.skySub')} />
          <div role="group" aria-label={t('observatory.claimsLabel')} className="mb-8 flex flex-wrap gap-2">
            {sky.constellations.map((c) => {
              const on = c.id === sel;
              return (
                <button
                  key={c.id}
                  type="button"
                  aria-pressed={on}
                  onClick={() => select(c.id)}
                  className={cn(
                    'flex items-baseline gap-2 rounded-full border px-3.5 py-1.5 text-[13.5px] transition-colors',
                    on ? 'border-[var(--o-gold)] bg-[var(--o-gold)] text-[#050816]' : 'border-[var(--o-line)] hover:border-[var(--o-gold)]',
                  )}
                >
                  <span className={cn('obs-mono text-[11px]', on ? 'text-[#050816]/70' : 'text-[var(--o-gold)]')}>C{fmtNum(loc, c.index + 1)}</span>
                  <span className="font-medium">{labels[c.id]}</span>
                  <span className={cn('obs-mono text-[11px]', on ? 'text-[#050816]/70' : 'text-[var(--o-muted)]')}>{fmtNum(loc, c.stars.length)}</span>
                </button>
              );
            })}
          </div>
          <div className="grid items-start gap-8 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,1fr)]">
            <div>
              <SkyGlobe
                model={sky}
                selected={sel}
                onSelect={select}
                pulseKeys={pulseKeys}
                labels={labels}
                kindLabels={kindLabels}
                reduce={reduce}
                rtl={rtl}
                ariaLabel={t('observatory.skyLabel', { name: constName })}
              />
              <ul className="mt-4 flex flex-wrap justify-center gap-x-5 gap-y-2 text-[12.5px] text-[var(--o-muted)]" aria-label={t('observatory.legendTitle')}>
                {STAR_KINDS.map((k) => (
                  <li key={k} className="flex items-center gap-2">
                    <span className="rounded-full" style={{ width: KIND_STYLE[k].r * 2.4, height: KIND_STYLE[k].r * 2.4, background: KIND_STYLE[k].color, boxShadow: `0 0 8px ${KIND_STYLE[k].color}` }} aria-hidden />
                    {kindLabels[k]}
                  </li>
                ))}
              </ul>
              <p className="mt-3 text-center text-[12.5px] text-[var(--o-muted)]">{t('observatory.dragHint')}</p>
            </div>

            {/* evidence panel */}
            <div ref={panelRef} className="obs-panel rounded-[18px] border border-[var(--o-line)] bg-[var(--o-card)] p-5 sm:p-6 lg:max-h-[760px] lg:overflow-y-auto" aria-live="polite">
              <p className="obs-mono text-[11.5px] uppercase tracking-[0.18em] text-[var(--o-gold)] rtl:normal-case rtl:tracking-normal">
                {t('observatory.constellation')} C{fmtNum(loc, (sky.constellations.find((c) => c.id === sel)?.index ?? 0) + 1)}
              </p>
              <h3 className="obs-display mt-1 text-[clamp(1.8rem,3vw,2.4rem)] font-medium italic leading-tight rtl:not-italic">{constName}</h3>
              <p className="mt-2 text-[13.5px] text-[var(--o-muted)]">
                {[
                  t('common.count.roles', { count: ev.roles.length }),
                  t('common.count.projects', { count: ev.projects.length }),
                  t('common.count.courses', { count: ev.courses.length }),
                  t('common.count.skills', { count: ev.skills.length }),
                ].join(' · ')}
              </p>

              {ev.roles.length > 0 && (
                <div className="mt-6">
                  <h4 className="obs-kind" style={{ ['--k' as string]: KIND_STYLE.role.color }}>
                    {t('observatory.kindsPlural.role')}
                  </h4>
                  <ul className="mt-2 space-y-2.5">
                    {ev.roles.map((e) => {
                      const key = `role:${e.id}`;
                      return (
                        <li key={key} data-key={key} className={cn('obs-item', focusKey === key && 'obs-item-on')}>
                          <a href={`#log-${e.id}`} className="font-semibold hover:text-[var(--o-gold)]">
                            {e.role}
                          </a>
                          <span className="block text-[13px] text-[var(--o-muted)]">
                            {e.org} · {e.period || t('common.undated')}
                          </span>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              )}

              {ev.projects.length > 0 && (
                <div className="mt-6">
                  <h4 className="obs-kind" style={{ ['--k' as string]: KIND_STYLE.project.color }}>
                    {t('observatory.kindsPlural.project')}
                  </h4>
                  <ul className="mt-2 space-y-2">
                    {ev.projects.map((pr) => {
                      const key = `project:${pr.id}`;
                      return (
                        <li key={key} data-key={key} className={cn('obs-item', focusKey === key && 'obs-item-on', pulseKeys.has(key) && 'obs-item-pulse')}>
                          <span className="obs-mono me-2 text-[11px] text-[var(--o-gold)]">{catNo(noOf.get(key) ?? 0, loc)}</span>
                          <a href={`#dso-${pr.id}`} className="font-semibold hover:text-[var(--o-gold)]" dir="auto">
                            {pr.title}
                          </a>
                          {(pr.url || pr.repo) && (
                            <a href={(pr.url || pr.repo)!} target="_blank" rel="noreferrer" className="ms-1.5 inline-flex align-middle text-[var(--o-muted)] hover:text-[var(--o-cyan)]" aria-label={`${pr.title} — ${t('common.visit')}`}>
                              <ArrowUpRight className="size-3.5" aria-hidden />
                            </a>
                          )}
                        </li>
                      );
                    })}
                  </ul>
                </div>
              )}

              {ev.courses.length > 0 && (
                <div className="mt-6">
                  <h4 className="obs-kind" style={{ ['--k' as string]: KIND_STYLE.course.color }}>
                    {t('observatory.kindsPlural.course')}
                  </h4>
                  <ul className="mt-2 space-y-2">
                    {ev.courses.map((c) => {
                      const i = data.certifications.indexOf(c);
                      const key = `course:${i}`;
                      return (
                        <li key={key} data-key={key} className={cn('obs-item text-[14px]', focusKey === key && 'obs-item-on')}>
                          <bdi lang="en" className="font-medium">
                            {c.name}
                          </bdi>
                          <span className="block text-[12.5px] text-[var(--o-muted)]">
                            <bdi>{c.issuer}</bdi> · {monthYear(loc, c.date, c.year)}
                            {c.url && (
                              <>
                                {' · '}
                                <a href={c.url} target="_blank" rel="noreferrer" className="text-[var(--o-cyan)] hover:underline">
                                  {t('common.certificate')}
                                </a>
                              </>
                            )}
                          </span>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              )}

              {ev.skills.length > 0 && (
                <div className="mt-6">
                  <h4 className="obs-kind" style={{ ['--k' as string]: KIND_STYLE.skill.color }}>
                    {t('observatory.kindsPlural.skill')}
                  </h4>
                  <p className="mt-1 text-[12.5px] text-[var(--o-muted)]">{t('observatory.skillHint')}</p>
                  <ul className="mt-2.5 flex flex-wrap gap-1.5">
                    {ev.skills.map((s) => {
                      const key = `skill:${s.uid}`;
                      const n = skillProjects(s, projects).length;
                      return (
                        <li key={key} data-key={key}>
                          <button
                            type="button"
                            onMouseEnter={() => setSkillFocus(s.name)}
                            onMouseLeave={() => setSkillFocus(null)}
                            onFocus={() => setSkillFocus(s.name)}
                            onBlur={() => setSkillFocus(null)}
                            title={n ? t('observatory.usedIn', { count: n }) : undefined}
                            className={cn(
                              'rounded-full border px-2.5 py-1 text-[12.5px] transition-colors',
                              focusKey === key ? 'border-[var(--o-cyan)] text-[var(--o-cyan)]' : 'border-[var(--o-line)] hover:border-[var(--o-cyan)]',
                            )}
                          >
                            <bdi>{s.name}</bdi>
                            {n > 0 && <span className="obs-mono ms-1.5 text-[10.5px] text-[var(--o-gold)]">{fmtNum(loc, n)}</span>}
                          </button>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              )}
            </div>
          </div>
        </section>

        {/* deep-sky objects = projects */}
        <section id="deepsky" aria-labelledby="obs-deep" className="scroll-mt-16 py-20">
          <SectionHead id="obs-deep" kicker={t('observatory.deepKicker')} title={t('observatory.deepTitle')} sub={t('observatory.deepSub', { count: projects.length })} />
          <ShowAll
            items={projects}
            initial={12}
            getKey={(pr) => pr.id}
            className="grid gap-4 md:grid-cols-2 xl:grid-cols-3"
            buttonWrapClassName="mt-8 text-center"
            buttonClassName="rounded-full border border-[var(--o-gold)] px-5 py-2 text-[14px] font-semibold text-[var(--o-gold)] hover:bg-[var(--o-gold)] hover:text-[#050816]"
            render={(pr) => {
              const doms = projectDomains(pr, skills);
              return (
                <article id={`dso-${pr.id}`} className="obs-card flex h-full scroll-mt-20 flex-col rounded-[16px] border border-[var(--o-line)] bg-[var(--o-card)] p-5">
                  <div className="flex items-start gap-4">
                    <Nebula seed={pr.id} hue={hueOf(doms[0] ?? '')} />
                    <div className="min-w-0">
                      <p className="obs-mono text-[11px] text-[var(--o-gold)]">
                        {catNo(noOf.get(`project:${pr.id}`) ?? 0, loc)} · {t(`categories.${pr.category}`)}
                      </p>
                      <h3 className="mt-1 text-[16.5px] font-semibold leading-snug" dir="auto">
                        {pr.url ? (
                          <a href={pr.url} target="_blank" rel="noreferrer" className="hover:text-[var(--o-gold)]">
                            {pr.title}
                          </a>
                        ) : (
                          pr.title
                        )}
                        {pr.metric && (
                          <bdi dir="ltr" className="obs-mono ml-2 whitespace-nowrap text-[12px] font-bold text-[var(--o-cyan)] rtl:ml-0 rtl:mr-2">
                            {pr.metric}
                          </bdi>
                        )}
                      </h3>
                    </div>
                  </div>
                  <Expandable text={pr.description} lines={4} minChars={180} className="mt-3 text-[14px] leading-relaxed text-[var(--o-muted)]" buttonClassName="text-[12.5px] font-semibold text-[var(--o-cyan)]" />
                  {pr.tags.length > 0 && (
                    <p className="obs-mono mt-3 text-[11px] leading-relaxed text-[#8e99b8]" dir="ltr">
                      {pr.tags.join(' · ')}
                    </p>
                  )}
                  <div className="mt-auto flex flex-wrap items-center gap-2 pt-4">
                    {doms.map((d) => (
                      <button key={d} type="button" onClick={() => goSky(d)} className="rounded-full border border-[var(--o-line)] px-2.5 py-0.5 text-[12px] italic hover:border-[var(--o-gold)] hover:text-[var(--o-gold)] rtl:not-italic">
                        {labels[d]}
                      </button>
                    ))}
                    {pr.repo && (
                      <a href={pr.url ?? `https://github.com/${pr.repo}`} target="_blank" rel="noreferrer" className="ms-auto inline-flex items-center gap-1 text-[12.5px] font-semibold text-[var(--o-cyan)] hover:underline">
                        <BrandIcon name="github" className="size-3.5" /> {t('common.code')}
                      </a>
                    )}
                  </div>
                </article>
              );
            }}
          />
        </section>

        {/* observing log = roles */}
        <section id="log" aria-labelledby="obs-log" className="scroll-mt-16 py-20">
          <SectionHead id="obs-log" kicker={t('observatory.logKicker')} title={t('observatory.logTitle')} sub={t('observatory.logSub')} />
          <ol className="border-t border-[var(--o-line)]">
            {data.experiences.map((e) => (
              <li key={e.id} id={`log-${e.id}`} className="grid scroll-mt-20 gap-x-8 gap-y-2 border-b border-[var(--o-line)] py-6 md:grid-cols-[12rem_minmax(0,1fr)]">
                <div className="obs-mono text-[12.5px] leading-relaxed">
                  <span className="text-[var(--o-gold)]">{e.period || t('common.undated')}</span>
                  {e.months ? <span className="block text-[var(--o-muted)]">{t('common.months', { count: e.months })}</span> : null}
                  <span className="block text-[var(--o-muted)]">{catNo(noOf.get(`role:${e.id}`) ?? 0, loc)}</span>
                </div>
                <div>
                  <h3 className="text-[18px] font-semibold leading-snug">{e.role}</h3>
                  <p className="mt-0.5 text-[14px] text-[var(--o-muted)]">
                    {e.org}
                    {e.location ? ` · ${e.location}` : ''} · {t(`kinds.${e.kind}`)}
                  </p>
                  <p className="mt-2.5 max-w-3xl text-[15px] leading-relaxed">{e.description}</p>
                  {roleDomains(e).length > 0 && (
                    <div className="mt-3 flex flex-wrap gap-2">
                      {roleDomains(e).map((d) => (
                        <button key={d} type="button" onClick={() => goSky(d)} className="rounded-full border border-[var(--o-line)] px-2.5 py-0.5 text-[12px] italic hover:border-[var(--o-gold)] hover:text-[var(--o-gold)] rtl:not-italic">
                          {labels[d]}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </li>
            ))}
          </ol>
        </section>

        {/* discoveries = publications · observatories = education */}
        <section id="discoveries" aria-labelledby="obs-disc" className="scroll-mt-16 grid gap-14 py-20 lg:grid-cols-[minmax(0,1.35fr)_minmax(0,1fr)]">
          <div>
            <SectionHead id="obs-disc" kicker={t('observatory.discKicker')} title={t('sections.publications.title')} />
            <ol className="space-y-4">
              {data.publications.map((pub) => (
                <li key={pub.id} className="rounded-[16px] border border-[var(--o-line)] bg-[var(--o-card)] p-5">
                  <p className="obs-mono text-[11.5px] uppercase tracking-wider text-[var(--o-gold)] rtl:normal-case rtl:tracking-normal">
                    {publicationLabel(t, 'pubType', pub.type)} · {publicationLabel(t, 'pubStatus', pub.status)}
                    {pub.year ? ` · ${fmtYear(loc, pub.year)}` : ''}
                  </p>
                  <p lang="en" dir="ltr" className="obs-display mt-2 text-start text-[21px] font-semibold leading-snug">
                    {pub.title}
                  </p>
                  <p className="mt-1.5 text-[14px] text-[var(--o-muted)]">
                    <Authors ownerName={data.person.fullName} p={pub} meClassName="font-semibold text-[var(--o-ink)]" etAl={t('common.withCoAuthors')} />
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
                      <a href={pub.url} target="_blank" rel="noreferrer" dir="ltr" className="inline-flex items-center gap-1 text-[var(--o-cyan)] hover:underline">
                        {pub.doi ? `doi:${pub.doi}` : t('common.visit')} <ArrowUpRight className="size-3.5" aria-hidden />
                      </a>
                    )}
                    {pub.bibtex && (
                      <CopyButton value={pub.bibtex} className="inline-flex items-center gap-1 hover:text-[var(--o-gold)]">
                        <Copy className="size-3.5" aria-hidden /> {t('common.copyBibtex')}
                      </CopyButton>
                    )}
                  </div>
                </li>
              ))}
            </ol>
          </div>
          <div id="observatories" className="scroll-mt-16">
            <SectionHead id="obs-edu" kicker={t('observatory.eduKicker')} title={t('sections.education.title')} />
            <ol className="space-y-4">
              {data.education.map((e) => (
                <li key={e.id} className="rounded-[16px] border border-[var(--o-line)] bg-[var(--o-card)] p-5">
                  <p className="obs-mono text-[12px] text-[var(--o-gold)]">{e.period}</p>
                  <h3 className="obs-display mt-1.5 text-[22px] font-semibold leading-snug">{e.degree}</h3>
                  <p className="mt-1 text-[14.5px]">{e.institution}</p>
                  <p className="text-[13.5px] text-[var(--o-muted)]">
                    {e.location}
                    {e.gpa ? (
                      <>
                        {' · '}
                        {t('common.gpa')} <bdi dir="ltr">{e.gpa}</bdi>
                      </>
                    ) : null}
                  </p>
                  {e.id === 'tehran' && data.publications.find((x) => x.type === 'Master Thesis') && (
                    <p className="mt-2 text-[13.5px] text-[var(--o-muted)]">
                      {t('common.thesis')}: <bdi lang="en">{data.publications.find((x) => x.type === 'Master Thesis')!.title}</bdi>
                    </p>
                  )}
                </li>
              ))}
            </ol>
          </div>
        </section>

        {/* observing hours = courses */}
        <section id="hours" aria-labelledby="obs-hours" className="scroll-mt-16 py-20">
          <SectionHead id="obs-hours" kicker={t('observatory.hoursKicker')} title={t('observatory.hoursTitle')} sub={t('observatory.hoursSub', { count: data.certStats.count, hours: data.certStats.hours, issuers: data.certStats.issuers.length })} />
          <div className="grid items-start gap-10 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
            <figure className="rounded-[16px] border border-[var(--o-line)] bg-[var(--o-card)] p-6 lg:sticky lg:top-20">
              <p className="obs-display text-[clamp(3rem,6vw,4.6rem)] font-medium leading-none text-[var(--o-gold)]">{fmtNum(loc, data.certStats.hours)}</p>
              <p className="mt-1 text-[14px] text-[var(--o-muted)]">{t('observatory.hoursTotal')}</p>
              <svg viewBox="0 0 320 170" className="mt-6 block w-full" role="img" aria-label={t('observatory.hoursChart')}>
                {years.map((y, i) => {
                  const h = hours.find((x) => x.year === y);
                  const bw = 320 / years.length;
                  const bh = h ? (h.hours / maxH) * 118 : 0;
                  const x = rtl ? 320 - (i + 1) * bw : i * bw;
                  return (
                    <g key={y}>
                      <rect x={x + bw * 0.22} y={140 - bh} width={bw * 0.56} height={Math.max(bh, 1)} rx={3} fill={h ? '#e6c27a' : '#3a4566'} />
                      <text x={x + bw / 2} y={134 - bh} textAnchor="middle" className="obs-mono fill-[#e8ecf6] text-[11px]">
                        {h ? fmtNum(loc, h.hours) : '0'}
                      </text>
                      <text x={x + bw / 2} y={160} textAnchor="middle" className="obs-mono fill-[#a3aecb] text-[11px]">
                        {fmtYear(loc, y)}
                      </text>
                    </g>
                  );
                })}
              </svg>
              <figcaption className="mt-2 text-[12.5px] text-[var(--o-muted)]">{t('observatory.hoursChart')}</figcaption>
            </figure>
            <ShowAll
              items={data.certifications}
              initial={10}
              getKey={(c) => c.name + c.issuer}
              as="ol"
              className="divide-y divide-[var(--o-line)] border-y border-[var(--o-line)]"
              buttonWrapClassName="mt-5"
              buttonClassName="rounded-full border border-[var(--o-gold)] px-4 py-1.5 text-[13.5px] font-semibold text-[var(--o-gold)] hover:bg-[var(--o-gold)] hover:text-[#050816]"
              render={(c, i) => (
                <div className="grid grid-cols-[minmax(0,1fr)_auto] gap-x-4 py-3">
                  <div className="min-w-0">
                    <p className="font-medium leading-snug">
                      <bdi lang="en">{c.name}</bdi>
                    </p>
                    <p className="text-[13px] text-[var(--o-muted)]">
                      <bdi>{c.issuer}</bdi> · {monthYear(loc, c.date, c.year)} · <span className="obs-mono text-[11.5px]">{catNo(courseNo(i), loc)}</span>
                    </p>
                  </div>
                  <div className="text-end">
                    <p className="obs-mono text-[13px] text-[var(--o-gold)]">{c.hours ? t('common.hours', { count: fmtNum(loc, c.hours) }) : c.weeks ? t('common.weeks', { count: fmtNum(loc, c.weeks) }) : ''}</p>
                    {c.url && (
                      <a href={c.url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-[12.5px] font-semibold text-[var(--o-cyan)] hover:underline">
                        {t('common.certificate')} <ArrowUpRight className="flip-rtl size-3.5" aria-hidden />
                      </a>
                    )}
                  </div>
                </div>
              )}
            />
          </div>
        </section>

        {/* instruments = all skills */}
        <section id="instruments" aria-labelledby="obs-inst" className="scroll-mt-16 py-20">
          <SectionHead id="obs-inst" kicker={t('observatory.instKicker')} title={t('observatory.instTitle')} sub={t('observatory.instSub', { count: skills.length + data.softSkills.length })} />
          <div className="columns-1 gap-4 md:columns-2 xl:columns-3">
            {data.skills.map((c) => (
              <div key={c.id} className="mb-4 break-inside-avoid rounded-[16px] border border-[var(--o-line)] bg-[var(--o-card)] p-5">
                <h3 className="obs-display text-[21px] font-semibold leading-snug">{c.label}</h3>
                {c.groups.map((g) => (
                  <div key={g.id} className="mt-3">
                    {c.groups.length > 1 && <p className="obs-mono text-[11px] uppercase tracking-wider text-[var(--o-gold)] rtl:normal-case rtl:tracking-normal">{g.label}</p>}
                    <ul className="mt-1.5 flex flex-wrap gap-1.5 text-[12.5px]">
                      {g.items.map((it) => (
                        <li key={it.key} title={it.long !== it.name ? it.long : undefined} className="rounded-full border border-[var(--o-line)] px-2.5 py-0.5">
                          <bdi>{it.name}</bdi>
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            ))}
          </div>
        </section>

        {/* star catalogue */}
        <section id="catalogue" aria-labelledby="obs-cat" className="scroll-mt-16 py-20">
          <SectionHead id="obs-cat" kicker={t('observatory.catKicker')} title={t('observatory.catTitle')} sub={t('observatory.catSub', { count: catalogue.length })} />
          <Catalogue items={catalogue} labels={labels} kindLabels={kindLabels} loc={loc} onSky={goSky} />
        </section>

        {/* frequencies + signal */}
        <section id="signal" aria-labelledby="obs-signal" className="scroll-mt-16 grid gap-10 py-20 lg:grid-cols-[minmax(0,0.85fr)_minmax(0,1.15fr)]">
          <div>
            <SectionHead id="obs-freq" kicker={t('observatory.freqKicker')} title={t('sections.languages.title')} />
            <ul className="space-y-4">
              {data.languages.map((l) => (
                <li key={l.id} className="rounded-[16px] border border-[var(--o-line)] bg-[var(--o-card)] p-5">
                  <p className="obs-display text-[23px] font-semibold">{l.name}</p>
                  <p className="text-[14px] text-[var(--o-muted)]">{l.level}</p>
                  {l.cert && (
                    <dl className="mt-3 grid grid-cols-5 gap-1.5 text-center text-[11.5px]">
                      <div className="rounded-lg bg-[var(--o-gold)] px-1 py-1.5 text-[#050816]">
                        <dt>{t('ielts.overall')}</dt>
                        <dd className="text-[16px] font-bold">{fmtNum(loc, l.cert.overall, { minimumFractionDigits: 1 })}</dd>
                      </div>
                      {(['listening', 'reading', 'writing', 'speaking'] as const).map((k) => (
                        <div key={k} className="rounded-lg border border-[var(--o-line)] px-1 py-1.5">
                          <dt className="truncate text-[var(--o-muted)]">{t(`ielts.${k}`)}</dt>
                          <dd className="text-[16px] font-bold">{fmtNum(loc, l.cert!.bands[k], { minimumFractionDigits: 1 })}</dd>
                        </div>
                      ))}
                    </dl>
                  )}
                </li>
              ))}
            </ul>
          </div>
          <div className="relative isolate flex min-h-[460px] flex-col items-center justify-center overflow-hidden rounded-[24px] border border-[var(--o-line)] bg-[radial-gradient(circle_at_50%_55%,#14214a,#070b1f_70%)] px-6 py-14 text-center">
            {mounted && !reduce && <Ripple className="text-[var(--o-gold)]/40 [--foreground:#e6c27a]" mainCircleSize={160} numCircles={6} mainCircleOpacity={0.2} />}
            <p className="obs-mono relative text-[12px] uppercase tracking-[0.2em] text-[var(--o-gold)] rtl:normal-case rtl:tracking-normal">{t('observatory.signalKicker')}</p>
            <h2 id="obs-signal" className="obs-display relative mt-3 text-[clamp(2.2rem,4.4vw,3.4rem)] font-medium leading-tight">
              {t('sections.contact.title')}
            </h2>
            <p className="relative mt-3 max-w-md text-[15px] leading-relaxed text-[var(--o-muted)]">
              {p.availability} {t('sections.contact.subtitle')}
            </p>
            <a href={data.links.email} dir="ltr" className="relative mt-6 inline-flex items-center gap-2 break-all rounded-full bg-[var(--o-gold)] px-5 py-2.5 text-[15px] font-semibold text-[#050816] hover:bg-[#f0d394]">
              <Mail className="size-4 shrink-0" aria-hidden /> {p.email}
            </a>
            <div className="relative mt-5 flex flex-wrap justify-center gap-2">
              {(['github', 'linkedin', 'orcid', 'scholar'] as const).map((k) =>
                data.links[k] ? (
                  <a key={k} href={data.links[k]!} target="_blank" rel="noreferrer" aria-label={k} className="grid size-10 place-items-center rounded-full border border-[var(--o-line)] bg-[#050816]/60 hover:border-[var(--o-gold)]">
                    <BrandIcon name={k} className="size-4" />
                  </a>
                ) : null,
              )}
            </div>
          </div>
        </section>

        <footer className="flex flex-wrap justify-between gap-3 border-t border-[var(--o-line)] pb-24 pt-8 text-[12.5px] text-[var(--o-muted)]">
          <span>{t('common.rights', { year: fmtYear(loc, new Date(data.generatedAt).getUTCFullYear()) })}</span>
          <span>{t('observatory.footer')}</span>
        </footer>
      </main>
    </div>
  );
}

/* ─────────────────────────────── star catalogue ─────────────────────────────── */

function Catalogue({
  items,
  labels,
  kindLabels,
  loc,
  onSky,
}: {
  items: ReturnType<typeof buildCatalogue>;
  labels: Record<string, string>;
  kindLabels: Record<CatKind, string>;
  loc: string;
  onSky: (d: string) => void;
}) {
  const t = useTranslations();
  const [q, setQ] = useState('');
  const [kind, setKind] = useState<CatKind | 'all'>('all');
  const nq = q.trim().toLowerCase();
  const list = items.filter((it) => (kind === 'all' || it.kind === kind) && (!nq || it.name.toLowerCase().includes(nq) || `ry-${String(it.no).padStart(4, '0')}`.includes(nq)));
  const count = (k: CatKind) => items.filter((it) => it.kind === k).length;
  return (
    <div>
      <div className="flex flex-wrap items-center gap-3">
        <label className="relative block w-full sm:w-80">
          <span className="sr-only">{t('observatory.catSearch')}</span>
          <Search className="pointer-events-none absolute start-3 top-1/2 size-4 -translate-y-1/2 text-[var(--o-muted)]" aria-hidden />
          <input
            type="search"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder={t('observatory.catSearch')}
            className="w-full rounded-full border border-[var(--o-line)] bg-[#050816]/70 py-2 pe-4 ps-9 text-[14px] outline-none placeholder:text-[#8e99b8] focus:border-[var(--o-gold)]"
          />
        </label>
        <div role="group" aria-label={t('common.type')} className="flex flex-wrap gap-1.5">
          {(['all', ...CAT_KINDS] as const).map((k) => (
            <button
              key={k}
              type="button"
              aria-pressed={kind === k}
              onClick={() => setKind(k)}
              className={cn('rounded-full border px-3 py-1 text-[12.5px]', kind === k ? 'border-[var(--o-gold)] bg-[var(--o-gold)] text-[#050816]' : 'border-[var(--o-line)] hover:border-[var(--o-gold)]')}
            >
              {k === 'all' ? t('observatory.catAll') : kindLabels[k]} <span className="obs-mono text-[11px] opacity-75">{fmtNum(loc, k === 'all' ? items.length : count(k))}</span>
            </button>
          ))}
        </div>
      </div>
      <p className="mt-4 text-[13px] text-[var(--o-muted)]" aria-live="polite">
        {list.length ? t('observatory.catShown', { shown: list.length, total: items.length }) : t('common.noResults')}
      </p>
      <div className="mt-3 hidden grid-cols-[7rem_7rem_minmax(0,1fr)_minmax(0,14rem)_8rem] gap-4 border-b border-[var(--o-line)] pb-2 text-[11.5px] uppercase tracking-wider text-[var(--o-muted)] md:grid rtl:normal-case rtl:tracking-normal" aria-hidden>
        <span>{t('observatory.colNo')}</span>
        <span>{t('common.type')}</span>
        <span>{t('observatory.colName')}</span>
        <span>{t('observatory.colConst')}</span>
        <span>{t('observatory.colDate')}</span>
      </div>
      <ShowAll
        key={`${kind}|${nq}`}
        items={list}
        initial={30}
        getKey={(it) => it.key}
        as="ol"
        className="divide-y divide-[var(--o-line)]"
        buttonWrapClassName="mt-5"
        buttonClassName="rounded-full border border-[var(--o-gold)] px-4 py-1.5 text-[13.5px] font-semibold text-[var(--o-gold)] hover:bg-[var(--o-gold)] hover:text-[#050816]"
        render={(it) => (
          <div className="grid grid-cols-[auto_minmax(0,1fr)] gap-x-4 gap-y-1 py-2.5 text-[14px] md:grid-cols-[7rem_7rem_minmax(0,1fr)_minmax(0,14rem)_8rem] md:items-baseline">
            <span className="obs-mono text-[12px] text-[var(--o-gold)]">{catNo(it.no, loc)}</span>
            <span className="text-[12.5px] text-[var(--o-muted)] max-md:text-end">
              <span className="me-1.5 inline-block size-2 rounded-full align-middle" style={{ background: it.kind === 'soft' ? '#7d88a6' : KIND_STYLE[it.kind as StarKind].color }} aria-hidden />
              {kindLabels[it.kind]}
            </span>
            <span className="min-w-0 max-md:col-span-2">
              {it.href ? (
                <a href={it.href} target="_blank" rel="noreferrer" className="font-medium hover:text-[var(--o-gold)]" dir="auto">
                  {it.name} <ArrowUpRight className="inline size-3 align-baseline text-[var(--o-muted)]" aria-hidden />
                </a>
              ) : it.anchor ? (
                <a href={`#${it.anchor}`} className="font-medium hover:text-[var(--o-gold)]" dir="auto">
                  {it.name}
                </a>
              ) : (
                <bdi className="font-medium">{it.name}</bdi>
              )}
            </span>
            <span className="text-[12.5px] italic text-[var(--o-muted)] max-md:col-span-2 rtl:not-italic">
              {it.domains.length
                ? it.domains.map((d, i) => (
                    <span key={d}>
                      {i > 0 && ', '}
                      <button type="button" onClick={() => onSky(d)} className="hover:text-[var(--o-gold)] hover:underline">
                        {labels[d]}
                      </button>
                    </span>
                  ))
                : '—'}
            </span>
            <span className="obs-mono text-[12px] text-[var(--o-muted)] max-md:col-span-2">{it.date ?? ''}</span>
          </div>
        )}
      />
    </div>
  );
}
