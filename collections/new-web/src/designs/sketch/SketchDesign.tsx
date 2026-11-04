'use client';

import { useEffect, useMemo, useState } from 'react';
import { useReducedMotion } from 'motion/react';
import { useTranslations } from 'next-intl';
import { ArrowUpRight, Copy, Mail } from 'lucide-react';
import { Authors } from '@/components/kit/Authors';
import { ShowAll } from '@/components/kit/ShowAll';
import { BrandIcon } from '@/components/shared/BrandIcon';
import { CopyButton } from '@/components/shared/CopyButton';
import { LocaleSwitcher } from '@/components/shared/LocaleSwitcher';
import { ProfilePhoto } from '@/components/shared/ProfilePhoto';
import { hash01, skillIndex, spanOf } from '@/lib/derive';
import { fmtNum, fmtYear, publicationLabel } from '@/lib/format';
import type { SiteData } from '@/lib/types';
import { cn } from '@/lib/utils';
import { Annotate } from './Annotate';
import { ArrowDown, Bars, Check, DoubleUnderline, Doodle, INK, Loop, seedOf, StampBox, Timeline } from './rough';
import './sketch.css';

const TABS = ['cover', 'about', 'experiments', 'results', 'protocol', 'references', 'education', 'courses', 'languages', 'index', 'back'] as const;
type Tab = (typeof TABS)[number];
const NOTES = ['#fff3a3', '#ffd8e4', '#d8f3dc'];
/** a stable small rotation, exposed as a CSS variable so hover can straighten it */
const tilt = (key: string, max = 1.4) => ({ '--tilt': `${((hash01(key) - 0.5) * 2 * max).toFixed(2)}deg` }) as React.CSSProperties;

function Page({ id, n, title, margin, children, className }: { id: Tab; n: number; title: string; margin?: React.ReactNode; children: React.ReactNode; className?: string }) {
  const t = useTranslations();
  return (
    <section id={id} aria-labelledby={`${id}-h`} className={cn('sk-page relative scroll-mt-20', className)}>
      <div className="grid gap-x-8 px-5 pb-14 pt-10 sm:px-8 md:grid-cols-[140px_minmax(0,1fr)] md:px-0 md:pe-10">
        <div className="sk-margin md:px-4">{margin}</div>
        <div className="min-w-0 ps-6 md:ps-0">
          <h2 id={`${id}-h`} className="sk-hand text-[clamp(2.2rem,5vw,3.4rem)] leading-none text-[#1d4ed8]">
            {title}
          </h2>
          <div className="mt-6">{children}</div>
        </div>
      </div>
      <p aria-hidden className="sk-hand absolute bottom-3 end-6 text-[18px] text-[#6b6b6b]">
        {t('sketch.page', { n: n })}
      </p>
    </section>
  );
}

export default function SketchDesign({ data }: { data: SiteData }) {
  const t = useTranslations();
  const loc = data.locale;
  const p = data.person;
  const rm = useReducedMotion();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  const reduce = mounted ? !!rm : true;
  const skills = useMemo(() => skillIndex(data), [data]);
  const lab = data.skills.find((c) => c.id === 'laboratory-techniques');
  const soft = data.skills.find((c) => c.id === 'soft-skills');
  const thesis = data.publications.find((x) => x.type === 'Master Thesis');
  const hours = data.certifications.reduce((s, c) => s + (c.hours ?? 0), 0);
  const weeks = data.certifications.reduce((s, c) => s + (c.weeks ?? 0), 0);
  const english = data.languages.find((l) => l.cert);
  const updated = new Intl.DateTimeFormat(loc === 'fa' ? 'fa-IR' : loc === 'de' ? 'de-DE' : 'en-GB', { day: 'numeric', month: 'long', year: 'numeric' }).format(new Date(data.generatedAt));
  const sep = loc === 'fa' ? '، ' : ' · ';

  // index A–Z: every skill with its domain as the "page"
  const index = useMemo(() => {
    const rows = [...skills.map((s) => ({ key: s.uid, name: s.name, page: s.domain ? t(`domains.${s.domain}`) : s.categoryLabel })), ...(soft?.groups.flatMap((g) => g.items.map((it) => ({ key: `soft/${it.key}`, name: it.name, page: t('common.softSkills') }))) ?? [])];
    rows.sort((a, b) => a.name.localeCompare(b.name, loc === 'fa' ? 'en' : loc, { sensitivity: 'base' }));
    const groups = new Map<string, typeof rows>();
    for (const r of rows) {
      const k = /[a-z]/i.test(r.name[0]) ? r.name[0].toUpperCase() : '#';
      groups.set(k, [...(groups.get(k) ?? []), r]);
    }
    return { rows, groups: [...groups.entries()] };
  }, [skills, soft, loc, t]);

  const status = (e: SiteData['experiences'][number]) => (e.current ? 'ongoing' : spanOf(e, data) ? 'done' : 'undated');
  const stampColor = { ongoing: INK.red, done: INK.blue, undated: INK.graphite } as const;

  return (
    <div className="sk-root min-h-dvh">
      <a href="#about" className="sr-only focus:not-sr-only focus:fixed focus:start-3 focus:top-3 focus:z-50 focus:rounded focus:bg-[#2b2b2b] focus:px-4 focus:py-2 focus:text-white">
        {t('nav.skip')}
      </a>
      <header className="sk-tape sticky top-0 z-40">
        <div className="mx-auto flex h-14 max-w-[1180px] items-center gap-3 px-3 sm:px-5">
          <a href="#cover" className="sk-hand shrink-0 text-[26px] leading-none text-[#2b2b2b]">
            {t('sketch.brand')}
          </a>
          <nav aria-label={t('nav.menu')} className="relative min-w-0 flex-1 overflow-x-auto">
            <ul className="flex gap-1">
              {TABS.map((k) => (
                <li key={k}>
                  <a href={`#${k}`} className="sk-tab">
                    {t(`sketch.tabs.${k}`)}
                  </a>
                </li>
              ))}
            </ul>
          </nav>
          <LocaleSwitcher className="shrink-0 rounded-full border border-[#2b2b2b]/30 bg-[#fffdf6] p-0.5" itemClassName="h-7 min-w-8 rounded-full px-2 text-xs" activeClassName="bg-[#2b2b2b] text-white" />
        </div>
      </header>

      <main className="mx-auto max-w-[1180px] space-y-10 px-2 py-10 sm:px-5">
        {/* 1 — cover */}
        <section id="cover" aria-labelledby="cover-h" className="sk-cover relative scroll-mt-20 overflow-hidden px-6 pb-16 pt-14 sm:px-12">
          <div className="grid items-center gap-12 md:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)]">
            <div className="relative">
              <div className="sk-label inline-block max-w-full px-6 py-5" style={tilt('label', 1)}>
                <p className="sk-hand text-[24px] leading-none text-[#c92a2a]">{t('sketch.notebook')}</p>
                <h1 id="cover-h" className="sk-hand mt-2 text-[clamp(3rem,8vw,5.6rem)] leading-[0.9] text-[#2b2b2b] rtl:leading-[1.25]">
                  {p.displayName}
                </h1>
                <p className="mt-3 text-[17px] font-bold text-[#2b2b2b]">{p.headline}</p>
              </div>
              <p className="mt-6 max-w-lg text-[16px] leading-relaxed text-[#2b2b2b]">{p.tagline}</p>
              <div className="mt-8 flex flex-wrap items-end gap-6" aria-hidden>
                <Doodle kind="helix" seed={11} size={96} />
                <Doodle kind="flask" seed={23} size={96} />
                <Doodle kind="laptop" seed={37} size={104} />
              </div>
              <p className="mt-6 max-w-lg text-[13px] text-[#555]">
                <span className="me-2 rounded-sm bg-[#2b2b2b] px-1.5 py-0.5 text-[10.5px] font-bold uppercase text-white rtl:normal-case">{t('common.metaphor')}</span>
                {t('sketch.honesty')}
              </p>
            </div>
            <div className="relative mx-auto w-full max-w-[340px]">
              <figure className="sk-polaroid relative" style={tilt('polaroid', 3)}>
                <span aria-hidden className="sk-tape-strip -top-3 start-6 -rotate-6" />
                <span aria-hidden className="sk-tape-strip -top-3 end-6 rotate-6" />
                <ProfilePhoto src={p.photo} alt={t('common.photoAlt')} size={480} className="aspect-square w-full bg-[#eae3d6]" priority />
                <figcaption className="sk-hand mt-3 text-center text-[24px] leading-none text-[#2b2b2b]">{p.location}</figcaption>
              </figure>
              <div className="sk-note relative ms-auto mt-8 w-full max-w-[250px] p-5 sm:me-[-18px]" style={{ background: NOTES[0], ...tilt('contact-note', 4) }}>
                <p className="sk-hand text-[24px] leading-none">{t('sketch.contactNote')}</p>
                <a href={data.links.email} dir="ltr" className="mt-2 block break-all text-[14px] font-bold underline decoration-[#1d4ed8] underline-offset-2">
                  {p.email}
                </a>
                <p className="mt-2 flex gap-2">
                  {(['github', 'linkedin', 'orcid', 'scholar'] as const).map((k) =>
                    data.links[k] ? (
                      <a key={k} href={data.links[k]!} target="_blank" rel="noreferrer" aria-label={k} className="grid size-8 place-items-center rounded-full border border-[#2b2b2b]/40 hover:bg-white/60">
                        <BrandIcon name={k} className="size-3.5" />
                      </a>
                    ) : null,
                  )}
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* 2 — about */}
        <Page
          id="about"
          n={2}
          title={t('sketch.tabs.about')}
          margin={
            <div className="space-y-3">
              <p className="sk-hand text-[20px] leading-tight text-[#1d4ed8]">{t('sketch.updated', { date: updated })}</p>
              <ul className="sk-hand space-y-1 text-[20px] leading-tight text-[#c92a2a]">
                {p.labels.map((l) => (
                  <li key={l} className="relative">
                    {/* hanging arrow: sits in the margin's padding so long labels keep the full width */}
                    <span className="flip-rtl me-1.5 inline-block md:absolute md:end-full md:top-0 md:me-1" aria-hidden>
                      →
                    </span>
                    {l}
                  </li>
                ))}
              </ul>
            </div>
          }
        >
          <div className="max-w-3xl space-y-4 text-[16.5px] leading-relaxed">
            <p className="font-bold">
              <span className="sk-hl">{p.statement}</span>
            </p>
            {p.about.map((x, i) => (
              <p key={i}>{x}</p>
            ))}
            <p className="font-semibold">
              <Annotate type="underline" color={INK.red} reduce={reduce} multiline>
                {p.availability}
              </Annotate>
            </p>
          </div>
        </Page>

        {/* 3 — experiments (roles) */}
        <Page id="experiments" n={3} title={t('sketch.tabs.experiments')}>
          <p className="max-w-3xl text-[15px] text-[#555]">{t('sketch.expIntro', { count: data.experiences.length })}</p>
          <ol className="mt-8 space-y-2">
            {data.experiences.map((e, i) => {
              const st = status(e);
              const word = t(`sketch.status.${st}`);
              return (
                <li key={e.id} className="relative md:-ms-[172px] md:grid md:grid-cols-[140px_minmax(0,1fr)] md:gap-x-8">
                  <div className="sk-hand text-[20px] leading-tight text-[#1d4ed8] md:px-4 md:text-end">
                    <span className="block">{e.period || t('common.undated')}</span>
                    {e.months ? <span className="block text-[17px] text-[#555]">{t('common.months', { count: e.months })}</span> : null}
                    {i < data.experiences.length - 1 && (
                      <span className="mt-2 hidden justify-end md:flex" aria-hidden>
                        <ArrowDown seed={seedOf(e.id)} />
                      </span>
                    )}
                  </div>
                  <div className="relative pb-6 pt-1">
                    <span className="sk-stamp relative mb-2 md:absolute md:end-0 md:top-0 md:mb-0" style={{ color: stampColor[st], ...tilt(`st-${e.id}`, 6) }}>
                      <StampBox seed={seedOf(`b-${e.id}`)} w={word.length * 10 + 26} color={stampColor[st]} />
                      <span className="relative px-3">{word}</span>
                    </span>
                    <dl className="grid max-w-3xl grid-cols-[4.5rem_minmax(0,1fr)] gap-x-3 gap-y-1 text-[15.5px] leading-relaxed md:pe-28">
                      <dt className="sk-hand text-[19px] leading-tight text-[#c92a2a]">{t('sketch.where')}</dt>
                      <dd>
                        {e.org}
                        {e.location ? <span className="text-[#555]">{sep + e.location}</span> : null}
                      </dd>
                      <dt className="sk-hand text-[19px] leading-tight text-[#c92a2a]">{t('sketch.role')}</dt>
                      <dd className="font-bold">
                        {e.role} <span className="font-normal text-[#555]">({t(`kinds.${e.kind}`)})</span>
                      </dd>
                      <dt className="sk-hand text-[19px] leading-tight text-[#c92a2a]">{t('sketch.notes')}</dt>
                      <dd>{e.description}</dd>
                    </dl>
                  </div>
                </li>
              );
            })}
          </ol>
        </Page>

        {/* 4 — results board (projects) */}
        <section id="results" aria-labelledby="results-h" className="sk-cork relative scroll-mt-20 px-4 pb-14 pt-10 sm:px-8">
          <h2 id="results-h" className="sk-hand sk-board-title inline-block px-4 text-[clamp(2.2rem,5vw,3.4rem)] leading-tight text-[#2b2b2b]">
            {t('sketch.tabs.results')}
          </h2>
          <p className="mt-3 max-w-3xl rounded bg-[#fffdf6]/85 px-3 py-1.5 text-[15px]">{t('sketch.resultsIntro', { count: data.projects.length + data.archive.length, featured: data.projects.length, archive: data.archive.length })}</p>
          <ol className="mt-8 grid gap-7 sm:grid-cols-2 lg:grid-cols-3">
            {data.projects.map((x) => (
              <li key={x.id} className="sk-card relative" style={tilt(x.id)}>
                <span aria-hidden className="sk-tape-strip -top-3 start-1/2 -translate-x-1/2 rotate-2" />
                <p className="sk-hand text-[19px] leading-none text-[#c92a2a]">{t(`categories.${x.category}`)}</p>
                <h3 className="mt-1.5 text-[16.5px] font-extrabold leading-snug" dir="auto">
                  {x.title}
                </h3>
                {x.metric && (
                  <p className="sk-hand mt-1 text-[22px] leading-none text-[#c92a2a]" dir="ltr">
                    {x.metric}
                  </p>
                )}
                <p className="mt-2 text-[14px] leading-relaxed" dir="auto">
                  {x.description}
                </p>
                {x.tags.length > 0 && (
                  <ul className="mt-3 flex flex-wrap gap-x-3 gap-y-2" dir="ltr">
                    {x.tags.map((tag) => (
                      <li key={tag} className="relative px-1 text-[13px] font-semibold">
                        <Loop seed={seedOf(x.id + tag)} chars={tag.length} />
                        <span className="relative">{tag}</span>
                      </li>
                    ))}
                  </ul>
                )}
                {x.url && (
                  <a href={x.url} target="_blank" rel="noreferrer" aria-label={`${t('common.code')}: ${x.title}`} className="mt-3 inline-flex items-center gap-1 text-[13.5px] font-bold text-[#1d4ed8] underline underline-offset-2">
                    <BrandIcon name="github" className="size-3.5" /> {t('common.code')}
                  </a>
                )}
              </li>
            ))}
          </ol>
          <h3 className="sk-hand sk-board-title mt-14 inline-block px-3 text-[30px] leading-tight">{t('sketch.stickies', { count: data.archive.length })}</h3>
          <ShowAll
            as="ol"
            className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-4"
            items={data.archive}
            initial={8}
            getKey={(x) => x.id}
            buttonWrapClassName="mt-6"
            buttonClassName="sk-btn"
            render={(x, i) => (
              <div className="sk-note h-full p-4" style={{ background: NOTES[i % 3], ...tilt(`n-${x.id}`, 2.5) }}>
                <p className="text-[14.5px] font-extrabold leading-snug" dir="auto">
                  {x.url ? (
                    <a href={x.url} target="_blank" rel="noreferrer" className="underline decoration-[#2b2b2b]/40 underline-offset-2">
                      {x.title}
                    </a>
                  ) : (
                    x.title
                  )}
                </p>
                <p className="sk-hand mt-0.5 text-[17px] leading-none text-[#c92a2a]">{t(`categories.${x.category}`)}</p>
                <p className="mt-2 text-[13px] leading-relaxed" dir="auto">
                  {x.description}
                </p>
                {x.tags.length > 0 && (
                  <p className="mt-2 text-[12px] font-semibold text-[#444]" dir="ltr">
                    {x.tags.join(' · ')}
                  </p>
                )}
              </div>
            )}
          />
        </section>

        {/* 5 — protocol (wet-lab techniques) */}
        {lab && (
          <Page id="protocol" n={5} title={t('sketch.tabs.protocol')} margin={<p className="sk-hand text-[20px] leading-tight text-[#c92a2a]">{t('sketch.protocolNote')}</p>}>
            <p className="max-w-3xl text-[15px] text-[#555]">{t('sketch.protocolIntro', { count: lab.groups.reduce((s, g) => s + g.items.length, 0) })}</p>
            <div className="mt-6 columns-1 gap-10 md:columns-2">
              {(() => {
                let n = 0;
                return lab.groups.map((g) => (
                  <div key={g.id} className="mb-6 break-inside-avoid">
                    <h3 className="sk-hand text-[24px] leading-tight text-[#1d4ed8]">{g.label}</h3>
                    <ol className="mt-1 space-y-1">
                      {g.items.map((it) => {
                        n++;
                        return (
                          <li key={it.key} className="flex items-start gap-2 text-[15px] leading-snug">
                            <span className="sk-hand w-7 shrink-0 text-end text-[18px] leading-none text-[#555]">{fmtNum(loc, n)}.</span>
                            <Check seed={seedOf(it.key)} />
                            <span>
                              <bdi>{it.name}</bdi>
                              {it.long !== it.name && <span className="text-[13px] text-[#555]"> — {it.long}</span>}
                            </span>
                          </li>
                        );
                      })}
                    </ol>
                  </div>
                ));
              })()}
            </div>
          </Page>
        )}

        {/* 6 — references */}
        <Page id="references" n={6} title={t('sketch.tabs.references')}>
          <ol className="max-w-3xl space-y-8">
            {data.publications.map((pub, i) => (
              <li key={pub.id} className="ps-4">
                <Annotate type="bracket" brackets={loc === 'fa' ? ['right', 'left'] : ['left', 'right']} color={INK.blue} padding={6} reduce={reduce} className="relative block">
                  <span className="block text-[15.5px] leading-relaxed">
                    <span className="sk-hand me-2 text-[22px] text-[#c92a2a]">[{fmtNum(loc, i + 1)}]</span>
                    <Authors ownerName={data.person.fullName} p={pub} meClassName="font-extrabold" etAl={t('common.withCoAuthors')} />
                    {pub.year ? ` (${fmtYear(loc, pub.year)})` : ''}. <bdi lang="en" className="font-bold">{pub.title}</bdi>.{' '}
                    {pub.venue && (
                      <bdi lang="en">
                        <i>{pub.venue}</i>
                        {pub.publisher ? `, ${pub.publisher}` : ''}.
                      </bdi>
                    )}{' '}
                    <span className="text-[#555]">
                      {publicationLabel(t, 'pubType', pub.type)} · {publicationLabel(t, 'pubStatus', pub.status)}
                    </span>
                  </span>
                  <span className="mt-1 flex flex-wrap gap-4 text-[14px] font-bold">
                    {pub.url && (
                      <a href={pub.url} target="_blank" rel="noreferrer" dir="ltr" className="text-[#1d4ed8] underline underline-offset-2">
                        {pub.doi ? `doi:${pub.doi}` : t('common.visit')}
                      </a>
                    )}
                    {pub.bibtex && (
                      <CopyButton value={pub.bibtex} className="inline-flex items-center gap-1 text-[#1d4ed8] underline underline-offset-2">
                        <Copy className="size-3.5" aria-hidden /> {t('common.copyBibtex')}
                      </CopyButton>
                    )}
                  </span>
                </Annotate>
              </li>
            ))}
          </ol>
        </Page>

        {/* 7 — education */}
        <Page id="education" n={7} title={t('sketch.tabs.education')}>
          <div className="max-w-4xl" dir="ltr">
            <Timeline steps={data.education.length} seed={71} />
          </div>
          <ol className="mt-4 grid max-w-4xl gap-6 md:grid-cols-3">
            {[...data.education].reverse().map((e, i) => (
              <li key={e.id} className="text-[15px] leading-relaxed">
                <p className="sk-hand text-[22px] leading-none text-[#1d4ed8]">
                  {fmtNum(loc, i + 1)}. {e.period}
                </p>
                <p className="mt-1 font-extrabold leading-snug">{e.degree}</p>
                <p>{e.institution}</p>
                <p className="text-[14px] text-[#555]">
                  {e.location}
                  {e.gpa ? (
                    <>
                      {sep}
                      {t('common.gpa')} <bdi dir="ltr">{e.gpa}</bdi>
                    </>
                  ) : null}
                </p>
              </li>
            ))}
          </ol>
          {thesis && (
            <div className="sk-note mt-8 max-w-xl p-5" style={{ background: NOTES[1], ...tilt('thesis', 1.5) }}>
              <p className="sk-hand text-[22px] leading-none text-[#c92a2a]">{t('common.thesis')}</p>
              <p className="mt-2 text-[14.5px] font-bold leading-snug">
                <bdi lang="en">{thesis.title}</bdi>
              </p>
              <p className="text-[13px] text-[#444]">
                {thesis.venue ? <bdi lang="en">{thesis.venue}</bdi> : null}
                {thesis.year ? ` · ${fmtYear(loc, thesis.year)}` : ''} · {publicationLabel(t, 'pubStatus', thesis.status)}
              </p>
            </div>
          )}
        </Page>

        {/* 8 — courses */}
        <Page id="courses" n={8} title={t('sketch.tabs.courses')}>
          <ShowAll
            as="ol"
            className="space-y-1"
            items={data.certifications}
            initial={14}
            getKey={(c) => c.name + c.issuer}
            buttonWrapClassName="mt-4"
            buttonClassName="sk-btn"
            render={(c) => (
              <div className="grid grid-cols-[3.6rem_minmax(0,1fr)] items-start gap-x-3 md:-ms-[172px] md:grid-cols-[140px_minmax(0,1fr)] md:gap-x-8">
                <span className="sk-hand pt-0.5 text-[19px] leading-none text-[#c92a2a] md:px-4 md:text-end">{c.hours ? t('common.hours', { count: fmtNum(loc, c.hours) }) : c.weeks ? t('common.weeks', { count: fmtNum(loc, c.weeks) }) : '—'}</span>
                <span className="flex items-start gap-2 text-[15px] leading-snug">
                  <Check seed={seedOf(c.name)} />
                  <span>
                    <bdi lang="en" className="font-semibold">
                      {c.name}
                    </bdi>
                    <span className="text-[#555]">
                      {' '}
                      — <bdi>{c.issuer}</bdi>
                      {c.year ? `${sep}${fmtYear(loc, c.year)}` : ''}
                    </span>
                    {c.url && (
                      <a href={c.url} target="_blank" rel="noreferrer" aria-label={`${t('common.certificate')}: ${c.name}`} className="ms-2 inline-flex items-center gap-0.5 text-[13px] font-bold text-[#1d4ed8] underline underline-offset-2">
                        {t('common.certificate')}
                        <ArrowUpRight className="flip-rtl size-3" aria-hidden />
                      </a>
                    )}
                  </span>
                </span>
              </div>
            )}
          />
          <div className="mt-8 inline-block">
            <p className="sk-hand text-[30px] leading-none text-[#c92a2a]">{t('sketch.coursesTotal', { hours, count: data.certifications.length })}</p>
            {weeks > 0 && <p className="text-[13px] text-[#555]">+ {t('common.weeks', { count: fmtNum(loc, weeks) })}</p>}
            <DoubleUnderline seed={91} width={240} />
          </div>
        </Page>

        {/* 9 — languages */}
        <Page id="languages" n={9} title={t('sketch.tabs.languages')}>
          <ul className="space-y-2 text-[16px]">
            {data.languages.map((l) => (
              <li key={l.id}>
                <b>{l.name}</b> — {l.level}
              </li>
            ))}
          </ul>
          {english?.cert && (
            <figure className="mt-8 max-w-[560px]">
              {(() => {
                const c = english.cert!;
                const rows = [...(['listening', 'reading', 'writing', 'speaking'] as const).map((k) => ({ label: t(`ielts.${k}`), value: c.bands[k], text: fmtNum(loc, c.bands[k], { minimumFractionDigits: 1 }) })), { label: t('sketch.overall'), value: c.overall, text: fmtNum(loc, c.overall, { minimumFractionDigits: 1 }) }];
                const g = Bars({ rows, max: c.max, seed: 101 });
                return (
                  <svg viewBox={`0 0 ${g.W} ${g.H}`} className="block h-auto w-full" role="img" aria-label={`${c.test}: ${rows.map((r) => `${r.label} ${r.text}`).join(', ')}`} direction="ltr">
                    {g.paths}
                    {rows.map((r, i) => (
                      <g key={r.label}>
                        <text x={g.L - 10} y={i * g.rowH + 31} textAnchor="end" className="sk-svg-hand">
                          {r.label}
                        </text>
                        <text x={g.x(r.value) + 8} y={i * g.rowH + 32} className="sk-svg-hand" fill={i === rows.length - 1 ? INK.red : INK.blue}>
                          {r.text}
                        </text>
                      </g>
                    ))}
                    {Array.from({ length: c.max + 1 }, (_, v) => (
                      <text key={v} x={g.x(v)} y={g.H - 4} textAnchor="middle" className="sk-svg-small">
                        {fmtNum(loc, v)}
                      </text>
                    ))}
                  </svg>
                );
              })()}
              <figcaption className="mt-2 text-[13.5px] text-[#555]">{t('sketch.ieltsCaption', { test: english.cert.test, max: english.cert.max })}</figcaption>
            </figure>
          )}
        </Page>

        {/* 10 — index A–Z */}
        <Page id="index" n={10} title={t('sketch.tabs.index')}>
          <p className="max-w-3xl text-[15px] text-[#555]">{t('sketch.indexIntro', { count: index.rows.length })}</p>
          <div className="mt-6 columns-1 gap-8 text-[14px] sm:columns-2 lg:columns-3" dir="ltr">
            {index.groups.map(([letter, rows]) => (
              <div key={letter} className="mb-4 break-inside-avoid">
                <p className="sk-hand text-[28px] leading-none text-[#c92a2a]">{letter}</p>
                <ul className="mt-1">
                  {rows.map((r) => (
                    <li key={r.key} className="sk-leader flex items-baseline gap-1 py-[1px]">
                      <span className="min-w-0 [overflow-wrap:anywhere]">{r.name}</span>
                      <span aria-hidden className="sk-dots min-w-3 flex-1" />
                      <span className="max-w-[48%] shrink-0 text-end text-[12.5px] text-[#555]" dir="auto">
                        {r.page}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </Page>

        {/* 11 — back cover */}
        <section id="back" aria-labelledby="back-h" className="sk-cover relative scroll-mt-20 px-6 pb-20 pt-14 sm:px-12">
          <div className="grid items-center gap-10 md:grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)]">
            <div>
              <h2 id="back-h" className="sk-hand text-[clamp(2.4rem,5vw,3.6rem)] leading-none text-[#1d4ed8]">
                {t('sketch.tabs.back')}
              </h2>
              <p className="mt-4 max-w-xl text-[16.5px] leading-relaxed">
                {p.availability} {t('sections.contact.subtitle')}
              </p>
              <a href={data.links.email} dir="ltr" className="sk-btn sk-btn-solid mt-6 inline-flex items-center gap-2 break-all">
                <Mail className="size-4 shrink-0" aria-hidden /> {p.email}
              </a>
              <div className="mt-5 flex flex-wrap gap-2">
                {(['github', 'linkedin', 'orcid', 'scholar'] as const).map((k) =>
                  data.links[k] ? (
                    <a key={k} href={data.links[k]!} target="_blank" rel="noreferrer" aria-label={k} className="grid size-11 place-items-center rounded-full border-2 border-[#2b2b2b] bg-[#fffdf6] hover:bg-[#ffec85]">
                      <BrandIcon name={k} className="size-4" />
                    </a>
                  ) : null,
                )}
              </div>
            </div>
            <div className="sk-note p-6 text-center" style={{ background: NOTES[2], ...tilt('end', 3) }}>
              <p className="sk-hand text-[30px] leading-tight">{t('sketch.endNote')}</p>
              <div className="mt-2 flex justify-center" aria-hidden>
                <Doodle kind="helix" seed={131} size={80} />
              </div>
            </div>
          </div>
          <footer className="mt-14 flex flex-wrap justify-between gap-3 text-[12.5px] text-[#555]">
            <span>{t('common.rights', { year: fmtYear(loc, new Date(data.generatedAt).getUTCFullYear()) })}</span>
            <span>{t('sketch.footer')}</span>
          </footer>
        </section>
      </main>
    </div>
  );
}
