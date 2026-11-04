'use client';

import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { useReducedMotion } from 'motion/react';
import { ArrowUpRight, Copy, Mail } from 'lucide-react';
import { Authors } from '@/components/kit/Authors';
import { ShowAll } from '@/components/kit/ShowAll';
import { BrandIcon } from '@/components/shared/BrandIcon';
import { CopyButton } from '@/components/shared/CopyButton';
import { LocaleSwitcher } from '@/components/shared/LocaleSwitcher';
import { allProjects } from '@/lib/derive';
import { dot, fmtNum, fmtYear, publicationLabel } from '@/lib/format';
import type { SiteData } from '@/lib/types';
import { Device, NW_A, NW_B, SEED_Q, SEED_T, SEQ_K } from './Device';
import './sequencer.css';

function H({ n, id, children }: { n: string; id: string; children: React.ReactNode }) {
  return (
    <h2 id={id} className="flex items-baseline gap-4 border-b-2 border-[#2b2b2b] pb-2 text-[22px] font-semibold">
      <span className="seq-label text-[13px] text-[#c24e00]">{n}</span>
      {children}
    </h2>
  );
}

export default function SequencerDesign({ data }: { data: SiteData }) {
  const t = useTranslations();
  const loc = data.locale;
  const reduceRaw = useReducedMotion();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  const reduce = mounted && !!reduceRaw;
  const projects = allProjects(data);
  const p = data.person;
  // section numbers 1.0 / 2.1 — the Persian decimal mark (٫) keeps the digits together
  const num = (a: number, b?: number) => `${fmtNum(loc, a)}${loc === 'fa' ? '٫' : '.'}${fmtNum(loc, b ?? 0)}`;
  const thesis = data.publications.find((x) => x.type === 'Master Thesis');

  return (
    <div className="sequencer-root min-h-dvh">
      <header className="border-b border-[#b9b3a8] bg-[#d8d3ca]/80 backdrop-blur-sm">
        <div className="mx-auto flex h-14 max-w-[1240px] items-center gap-4 px-4 sm:px-6">
          <a href="#top" className="seq-label text-[13px] font-bold uppercase tracking-[0.14em] rtl:normal-case rtl:tracking-normal">
            {t('sequencer.brand')}
          </a>
          <nav aria-label={t('nav.menu')} className="seq-label ms-auto hidden gap-5 text-[12px] uppercase md:flex rtl:normal-case">
            <a href="#device" className="hover:text-[#c24e00]">
              {t('sequencer.nav.device')}
            </a>
            <a href="#manual" className="hover:text-[#c24e00]">
              {t('sequencer.nav.manual')}
            </a>
            <a href="#m-algo" className="hover:text-[#c24e00]">
              {t('sequencer.nav.algo')}
            </a>
            <a href="#m-contact" className="hover:text-[#c24e00]">
              {t('sequencer.nav.contact')}
            </a>
          </nav>
          <LocaleSwitcher className="ms-auto rounded-full border border-[#2b2b2b] md:ms-2" itemClassName="seq-label h-7 min-w-8 rounded-full px-2 text-[11px]" activeClassName="bg-[#2b2b2b] text-white" />
        </div>
      </header>

      <main id="top" className="mx-auto max-w-[1240px] px-4 sm:px-6">
        <section className="py-10 sm:py-14">
          <p className="seq-label text-[12px] font-semibold uppercase tracking-[0.2em] text-[#c24e00] rtl:normal-case rtl:tracking-normal">{t('sequencer.kicker')}</p>
          <h1 className="mt-2 text-[clamp(2.4rem,5.6vw,4.4rem)] font-semibold leading-[1.02] tracking-[-0.02em] rtl:leading-[1.3] rtl:tracking-normal">{p.displayName}</h1>
          <p className="mt-3 max-w-2xl text-[17px] leading-relaxed text-[#3d3d39]">{t('sequencer.intro')}</p>
          <p className="mt-3 text-[13px] text-[#4a4a47]">
            <span className="seq-label me-2 rounded bg-[#2b2b2b] px-1.5 py-0.5 text-[10.5px] uppercase text-white rtl:normal-case">{t('common.metaphor')}</span>
            {t('sequencer.honesty')}
          </p>
        </section>

        <section id="device" aria-label={t('sequencer.deviceName')} className="scroll-mt-6 pb-16">
          <Device data={data} reduce={reduce} />
          <p className="mt-4 text-center text-[13px] text-[#4a4a47]">{t('sequencer.keysHint')}</p>
        </section>

        {/* the manual */}
        <section id="manual" aria-labelledby="m-title" className="seq-manual mx-auto mb-24 max-w-[980px] rounded-[6px] px-6 py-12 sm:px-14">
          <p className="seq-label text-[11px] uppercase tracking-[0.2em] text-[#6b6b66] rtl:normal-case rtl:tracking-normal">RY-16 · {t('sequencer.manualKicker')}</p>
          <h2 id="m-title" className="mt-2 text-[34px] font-semibold leading-tight">
            {t('sequencer.manualTitle')}
          </h2>

          {/* 1 profile */}
          <section aria-labelledby="m-profile" className="mt-12">
            <H n={num(1)} id="m-profile">
              {t('sequencer.m.profile')}
            </H>
            <p className="mt-4 text-[17px] font-medium">{p.headline}</p>
            <p className="mt-1 text-[14.5px] text-[#4a4a47]">
              {p.status} · {p.location}
            </p>
            <div className="mt-4 space-y-3 text-[15.5px] leading-relaxed">
              <p>{p.statement}</p>
              {p.about.map((a, i) => (
                <p key={i}>{a}</p>
              ))}
            </div>
            <dl className="mt-6 grid grid-cols-2 gap-x-6 gap-y-3 sm:grid-cols-4">
              {data.stats.map((s) => (
                <div key={s.id} className="border-t border-[#c9c3b8] pt-2">
                  <dd className="seq-label text-[22px] font-semibold">
                    {fmtNum(loc, s.value)}
                    {s.suffix}
                  </dd>
                  <dt className="text-[12.5px] leading-snug text-[#4a4a47]">{s.label}</dt>
                </div>
              ))}
            </dl>
          </section>

          {/* 2 roles */}
          <section aria-labelledby="m-roles" className="mt-14">
            <H n={num(2)} id="m-roles">
              {t('sections.experience.title')}
            </H>
            <ol className="mt-4 divide-y divide-[#d9d3c8]">
              {data.experiences.map((e, i) => (
                <li key={e.id} className="grid gap-x-6 py-4 sm:grid-cols-[4rem_minmax(0,1fr)]">
                  <span className="seq-label text-[12px] text-[#c24e00]">{num(2, i + 1)}</span>
                  <div>
                    <h3 className="text-[16.5px] font-semibold leading-snug">{e.role}</h3>
                    <p className="text-[13.5px] text-[#4a4a47]">
                      {e.org}
                      {e.location ? dot(loc) + e.location : ''}
                      {dot(loc)}
                      {e.period || t('common.undated')}
                      {e.months ? dot(loc) + t('common.months', { count: e.months }) : ''}
                      {dot(loc)}
                      {t(`kinds.${e.kind}`)}
                    </p>
                    <p className="mt-1.5 text-[15px] leading-relaxed">{e.description}</p>
                  </div>
                </li>
              ))}
            </ol>
          </section>

          {/* 3 projects */}
          <section aria-labelledby="m-projects" className="mt-14">
            <H n={num(3)} id="m-projects">
              {t('sections.projects.title')}
            </H>
            <p className="mt-2 text-[13.5px] text-[#4a4a47]">{t('sequencer.m.projectsNote', { count: projects.length })}</p>
            <ShowAll
              items={projects}
              initial={12}
              getKey={(pr) => pr.id}
              as="ol"
              className="mt-4 grid gap-x-8 gap-y-5 md:grid-cols-2"
              buttonWrapClassName="mt-6"
              buttonClassName="seq-label rounded-full border-2 border-[#2b2b2b] px-4 py-1.5 text-[12px] font-bold uppercase hover:bg-[#2b2b2b] hover:text-white rtl:normal-case"
              render={(pr, i) => (
                <div className="border-t border-[#d9d3c8] pt-3">
                  <p className="seq-label text-[11.5px] text-[#c24e00]">
                    {num(3, i + 1)} · {t(`categories.${pr.category}`)} · {t('sequencer.bankPad', { bank: 'ABC'[Math.floor(i / 16)], pad: fmtNum(loc, (i % 16) + 1) })}
                  </p>
                  <h3 className="mt-1 text-[16px] font-semibold leading-snug" dir="auto">
                    {pr.url ? (
                      <a href={pr.url} target="_blank" rel="noreferrer" className="hover:text-[#c24e00]">
                        {pr.title}
                      </a>
                    ) : (
                      pr.title
                    )}
                    {pr.metric && (
                      <bdi dir="ltr" className="ml-2 text-[13px] text-[#1a7f37] rtl:ml-0 rtl:mr-2">
                        {pr.metric}
                      </bdi>
                    )}
                  </h3>
                  <p className="mt-1 text-[14.5px] leading-relaxed" dir="auto">
                    {pr.description}
                  </p>
                  <p className="mt-1 flex flex-wrap items-center gap-x-3 text-[12.5px] text-[#4a4a47]">
                    {pr.tags.length > 0 && (
                      <span className="seq-label" dir="ltr">
                        {pr.tags.join(' · ')}
                      </span>
                    )}
                    {pr.repo && (
                      <a href={pr.url ?? `https://github.com/${pr.repo}`} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 font-semibold text-[#0b5cad] hover:underline">
                        <BrandIcon name="github" className="size-3.5" /> {t('common.code')}
                      </a>
                    )}
                  </p>
                </div>
              )}
            />
          </section>

          {/* 4 publications */}
          <section aria-labelledby="m-pubs" className="mt-14">
            <H n={num(4)} id="m-pubs">
              {t('sections.publications.title')}
            </H>
            <ol className="mt-4 space-y-4">
              {data.publications.map((pub, i) => (
                <li key={pub.id} className="grid gap-x-6 sm:grid-cols-[4rem_minmax(0,1fr)]">
                  <span className="seq-label text-[12px] text-[#c24e00]">{num(4, i + 1)}</span>
                  <div>
                    <p className="seq-label text-[11.5px] uppercase text-[#4a4a47] rtl:normal-case">
                      {publicationLabel(t, 'pubType', pub.type)} · {publicationLabel(t, 'pubStatus', pub.status)}
                      {pub.year ? ` · ${fmtYear(loc, pub.year)}` : ''}
                    </p>
                    <p lang="en" dir="ltr" className="mt-1 text-start text-[16px] font-semibold leading-snug">
                      {pub.title}
                    </p>
                    <p className="text-[14px] text-[#4a4a47]">
                      <Authors ownerName={data.person.fullName} p={pub} meClassName="font-semibold text-[#1d1d1b]" etAl={t('common.withCoAuthors')} />
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
                    <div className="mt-1 flex flex-wrap gap-4 text-[13px] font-semibold">
                      {pub.url && (
                        <a href={pub.url} target="_blank" rel="noreferrer" dir="ltr" className="inline-flex items-center gap-1 text-[#0b5cad] hover:underline">
                          {pub.doi ? `doi:${pub.doi}` : t('common.visit')} <ArrowUpRight className="size-3.5" aria-hidden />
                        </a>
                      )}
                      {pub.bibtex && (
                        <CopyButton value={pub.bibtex} className="inline-flex items-center gap-1 hover:text-[#c24e00]">
                          <Copy className="size-3.5" aria-hidden /> {t('common.copyBibtex')}
                        </CopyButton>
                      )}
                    </div>
                  </div>
                </li>
              ))}
            </ol>
          </section>

          {/* 5 education */}
          <section aria-labelledby="m-edu" className="mt-14">
            <H n={num(5)} id="m-edu">
              {t('sections.education.title')}
            </H>
            <ol className="mt-4 space-y-4">
              {data.education.map((e, i) => (
                <li key={e.id} className="grid gap-x-6 sm:grid-cols-[4rem_minmax(0,1fr)]">
                  <span className="seq-label text-[12px] text-[#c24e00]">{num(5, i + 1)}</span>
                  <div>
                    <h3 className="text-[16.5px] font-semibold">{e.degree}</h3>
                    <p className="text-[14px] text-[#4a4a47]">
                      {e.institution} · {e.location} · {e.period}
                      {e.gpa ? (
                        <>
                          {' · '}
                          {t('common.gpa')} <bdi dir="ltr">{e.gpa}</bdi>
                        </>
                      ) : null}
                    </p>
                    {e.id === 'tehran' && thesis && (
                      <p className="mt-1 text-[14px]">
                        {t('common.thesis')}: <bdi lang="en">{thesis.title}</bdi>
                      </p>
                    )}
                  </div>
                </li>
              ))}
            </ol>
          </section>

          {/* 6 skills */}
          <section aria-labelledby="m-skills" className="mt-14">
            <H n={num(6)} id="m-skills">
              {t('sections.skills.title')}
            </H>
            <div className="mt-4 columns-1 gap-8 md:columns-2">
              {data.skills.map((c, ci) => (
                <div key={c.id} className="mb-5 break-inside-avoid">
                  <h3 className="text-[15px] font-semibold">
                    <span className="seq-label me-2 text-[11.5px] text-[#c24e00]">{num(6, ci + 1)}</span>
                    {c.label}
                  </h3>
                  {c.groups.map((g) => (
                    <p key={g.id} className="mt-1 text-[13.5px] leading-relaxed">
                      {c.groups.length > 1 && <span className="text-[#4a4a47]">{g.label}: </span>}
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
          </section>

          {/* 7 courses */}
          <section aria-labelledby="m-courses" className="mt-14">
            <H n={num(7)} id="m-courses">
              {t('sections.certifications.title')}
            </H>
            <p className="mt-2 text-[13.5px] text-[#4a4a47]">{t('sections.certifications.subtitle', { count: fmtNum(loc, data.certStats.count), hours: fmtNum(loc, data.certStats.hours), issuers: fmtNum(loc, data.certStats.issuers.length) })}</p>
            <ShowAll
              items={data.certifications}
              initial={12}
              getKey={(c) => c.name + c.issuer}
              as="ol"
              className="mt-4 divide-y divide-[#d9d3c8]"
              buttonWrapClassName="mt-5"
              buttonClassName="seq-label rounded-full border-2 border-[#2b2b2b] px-4 py-1.5 text-[12px] font-bold uppercase hover:bg-[#2b2b2b] hover:text-white rtl:normal-case"
              render={(c, i) => (
                <div className="grid grid-cols-[3.5rem_minmax(0,1fr)_auto] gap-x-4 py-2 text-[14px]">
                  <span className="seq-label text-[11.5px] text-[#c24e00]">{num(7, i + 1)}</span>
                  <span>
                    <bdi lang="en" className="font-medium">
                      {c.name}
                    </bdi>
                    <span className="block text-[12.5px] text-[#4a4a47]">
                      <bdi>{c.issuer}</bdi>
                      {c.year ? ` · ${fmtYear(loc, c.year)}` : ''}
                    </span>
                  </span>
                  <span className="text-end text-[12.5px]">
                    {c.hours ? t('common.hours', { count: fmtNum(loc, c.hours) }) : c.weeks ? t('common.weeks', { count: fmtNum(loc, c.weeks) }) : ''}
                    {c.url && (
                      <a href={c.url} target="_blank" rel="noreferrer" className="block font-semibold text-[#0b5cad] hover:underline">
                        {t('common.certificate')}
                      </a>
                    )}
                  </span>
                </div>
              )}
            />
          </section>

          {/* 8 languages */}
          <section aria-labelledby="m-lang" className="mt-14">
            <H n={num(8)} id="m-lang">
              {t('sections.languages.title')}
            </H>
            <ul className="mt-4 space-y-2 text-[15px]">
              {data.languages.map((l) => (
                <li key={l.id}>
                  <b>{l.name}</b> — {l.level}
                  {l.cert && (
                    <span className="text-[#4a4a47]">
                      {' '}
                      · {l.cert.test} {fmtNum(loc, l.cert.overall, { minimumFractionDigits: 1 })} ({(['listening', 'reading', 'writing', 'speaking'] as const).map((k) => `${t(`ielts.${k}`)} ${fmtNum(loc, l.cert!.bands[k], { minimumFractionDigits: 1 })}`).join(', ')})
                    </span>
                  )}
                </li>
              ))}
            </ul>
          </section>

          {/* 9 contact */}
          <section aria-labelledby="m-contact" className="mt-14">
            <H n={num(9)} id="m-contact">
              {t('sequencer.m.contact')}
            </H>
            <p className="mt-4 max-w-2xl text-[15.5px] leading-relaxed">
              {p.availability} {t('sections.contact.subtitle')}
            </p>
            <div className="mt-4 flex flex-wrap items-center gap-3">
              <a href={data.links.email} dir="ltr" className="seq-key-accent inline-flex items-center gap-2 break-all rounded-[10px] px-4 py-2.5 text-[14.5px] font-bold">
                <Mail className="size-4 shrink-0" aria-hidden /> {p.email}
              </a>
              {(['github', 'linkedin', 'orcid', 'scholar'] as const).map((k) =>
                data.links[k] ? (
                  <a key={k} href={data.links[k]!} target="_blank" rel="noreferrer" aria-label={k} className="seq-key grid size-11 place-items-center rounded-[10px]">
                    <BrandIcon name={k} className="size-4" />
                  </a>
                ) : null,
              )}
            </div>
          </section>

          {/* appendix: algorithms */}
          <section aria-labelledby="m-algo" className="mt-16 border-t-4 border-double border-[#2b2b2b] pt-8">
            <H n="A" id="m-algo">
              {t('sequencer.m.algo')}
            </H>
            <p className="mt-3 text-[14px] text-[#4a4a47]">
              <span className="seq-label me-2 rounded bg-[#2b2b2b] px-1.5 py-0.5 text-[10.5px] uppercase text-white rtl:normal-case">{t('common.illustrative')}</span>
              {t('sequencer.m.algoNote')}
            </p>
            {(['kmer', 'seed', 'nw'] as const).map((a, i) => (
              <div key={a} className="mt-6">
                <h3 className="text-[16.5px] font-semibold">
                  <span className="seq-label me-2 text-[12px] text-[#c24e00]">A.{fmtNum(loc, i + 1)}</span>
                  {t(`sequencer.algo.${a}`)}
                </h3>
                <p className="mt-1.5 text-[15px] leading-relaxed">{t(`sequencer.how.${a}`)}</p>
                <p className="seq-label mt-1.5 break-all text-[12px] text-[#4a4a47]" dir="ltr">
                  {a === 'kmer' ? `input: ${SEQ_K}` : a === 'seed' ? `query: ${SEED_Q} · target: ${SEED_T}` : `a: ${NW_A} · b: ${NW_B}`}
                </p>
              </div>
            ))}
          </section>
        </section>

        <footer className="flex flex-wrap justify-between gap-3 border-t border-[#b9b3a8] pb-24 pt-6 text-[12.5px] text-[#4a4a47]">
          <span>{t('common.rights', { year: fmtYear(loc, new Date(data.generatedAt).getUTCFullYear()) })}</span>
          <span>{t('sequencer.footer')}</span>
        </footer>
      </main>
    </div>
  );
}
