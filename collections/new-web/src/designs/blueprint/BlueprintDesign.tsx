'use client';

import { useEffect, useMemo, useRef } from 'react';
import { useReducedMotion } from 'motion/react';
import { useLocale, useTranslations } from 'next-intl';
import { ArrowUpRight, Copy, Mail } from 'lucide-react';
import { Authors } from '@/components/kit/Authors';
import { ShowAll } from '@/components/kit/ShowAll';
import { BrandIcon } from '@/components/shared/BrandIcon';
import { CopyButton } from '@/components/shared/CopyButton';
import { LocaleSwitcher } from '@/components/shared/LocaleSwitcher';
import { ProfilePhoto } from '@/components/shared/ProfilePhoto';
import { skillIndex, spanOf } from '@/lib/derive';
import { dot, fmtNum, fmtYear, publicationLabel } from '@/lib/format';
import type { Experience, SiteData } from '@/lib/types';
import { cn } from '@/lib/utils';
import { Axo, type Layer } from './Axo';
import { BlockDiagram } from './BlockDiagram';
import { Sheet, SHEETS, type TitleInfo } from './Sheet';
import './blueprint.css';

const PFX: Record<string, string> = {
  'programming-scripting': 'PRG',
  'devops-infrastructure': 'DEV',
  'software-web-development': 'WEB',
  'databases-data-engineering': 'DAT',
  'data-visualization-reporting': 'VIS',
  'bioinformatics-domains': 'BIO',
  'laboratory-techniques': 'LAB',
};
const LAYERS: Array<{ id: Layer['id']; domains: string[] }> = [
  { id: 'wetlab', domains: ['wetlab'] },
  { id: 'bioprocess', domains: ['bioprocess'] },
  { id: 'omics', domains: ['singlecell', 'genomics', 'systems', 'structural'] },
  { id: 'mldata', domains: ['ml', 'data'] },
  { id: 'softdevops', domains: ['software', 'devops'] },
];
const pad = (n: number, w = 2) => String(n).padStart(w, '0');

export default function BlueprintDesign({ data }: { data: SiteData }) {
  const t = useTranslations();
  const loc = data.locale;
  const p = data.person;
  const root = useRef<HTMLDivElement>(null);
  const reduce = useReducedMotion();
  const skills = useMemo(() => skillIndex(data), [data]);
  const stat = (id: string) => data.stats.find((s) => s.id === id);

  // lines draw when a sheet enters (only with motion allowed; without JS every line is already drawn)
  useEffect(() => {
    const el = root.current;
    if (!el || reduce) return;
    el.dataset.armed = '';
    const io = new IntersectionObserver(
      (es) =>
        es.forEach((e) => {
          if (e.isIntersecting) {
            (e.target as HTMLElement).dataset.in = '';
            io.unobserve(e.target);
          }
        }),
      { threshold: 0.04 },
    );
    el.querySelectorAll('.bp-sheet').forEach((s) => io.observe(s));
    return () => io.disconnect();
  }, [reduce]);

  // revisions: dated roles lettered A… in date order; newest on top; undated entries last
  const revs = useMemo(() => {
    const dated = data.experiences
      .map((e) => ({ e, s: spanOf(e, data) }))
      .filter((x) => x.s)
      .sort((a, b) => a.s!.start - b.s!.start || a.s!.end - b.s!.end)
      .map((x, i) => ({ e: x.e, rev: String.fromCharCode(65 + i) }));
    const undated = data.experiences.filter((e) => !spanOf(e, data)).map((e) => ({ e, rev: '—' }));
    return [...dated.reverse(), ...undated];
  }, [data]);
  const lastRev = revs.find((r) => r.rev !== '—')?.rev ?? 'A';

  const info: TitleInfo = {
    project: t('blueprint.project', { name: p.displayName }),
    drawn: p.displayName,
    rev: lastRev,
    date: new Intl.DateTimeFormat(loc === 'fa' ? 'fa-IR' : loc === 'de' ? 'de-DE' : 'en-GB', { year: 'numeric', month: 'short', day: 'numeric' }).format(new Date(data.generatedAt)),
  };

  const layers: Layer[] = LAYERS.map((l) => {
    const mine = skills.filter((s) => s.domain && l.domains.includes(s.domain));
    const years = stat('years');
    return {
      id: l.id,
      label: t(`blueprint.layer.${l.id}`),
      parts: mine.length,
      href: `#bom-${mine[0]?.groupId ?? 's5'}`,
      note:
        l.id === 'softdevops' && years ? [t('blueprint.parts', { count: mine.length }), `${fmtNum(loc, years.value)}${years.suffix} ${years.label}`] : [t('blueprint.parts', { count: mine.length })],
    };
  });
  const totalParts = layers.reduce((n, l) => n + l.parts, 0);

  const projects = [...data.projects, ...data.archive];
  const code = (i: number) => `A-${pad(i + 1)}`;
  const courseHours = data.certifications.reduce((n, c) => n + (c.hours ?? 0), 0);
  const courseWeeks = data.certifications.reduce((n, c) => n + (c.weeks ?? 0), 0);
  const thesis = data.publications.find((x) => x.type === 'Master Thesis');
  const tech = data.skills.filter((c) => c.id !== 'soft-skills');
  const soft = data.skills.find((c) => c.id === 'soft-skills');
  const btn = 'bp-btn mt-3';

  return (
    <div ref={root} className="bp-root min-h-dvh">
      <a href="#s1" className="sr-only focus:not-sr-only focus:fixed focus:start-3 focus:top-3 focus:z-50 focus:bg-[#ffd479] focus:px-3 focus:py-2 focus:text-[#0d3a66]">
        {t('nav.skip')}
      </a>
      <header className="sticky top-0 z-40 border-b border-[#eef5ff]/25 bg-[#0d3a66]/92 backdrop-blur-sm">
        <div className="mx-auto flex h-14 max-w-[1320px] items-center gap-4 px-4 sm:px-6">
          <a href="#s1" className="bp-title shrink-0 text-[19px] leading-none">
            <span dir="ltr">RY-DWG</span>
          </a>
          <nav aria-label={t('blueprint.register')} className="relative min-w-0 flex-1 overflow-x-auto">
            <ul className="flex gap-1">
              {SHEETS.map((s, i) => (
                <li key={s}>
                  <a href={`#${s}`} className="bp-reg" title={t(`blueprint.sheet.${s}`)} aria-label={`S${i + 1} — ${t(`blueprint.sheet.${s}`)}`}>
                    <span dir="ltr" className="bp-mono">
                      S{i + 1}
                    </span>
                    <span className="hidden min-[1720px]:inline">{t(`blueprint.sheet.${s}`)}</span>
                  </a>
                </li>
              ))}
            </ul>
          </nav>
          <LocaleSwitcher
            className="shrink-0 rounded-[3px] border border-[#eef5ff]/40 p-0.5"
            itemClassName="h-7 min-w-8 rounded-[2px] px-2 text-xs text-[#eef5ff]"
            activeClassName="bg-[#eef5ff] text-[#0d3a66]"
          />
        </div>
      </header>

      <main className="mx-auto max-w-[1320px] space-y-10 px-3 py-10 sm:px-6">
        {/* S1 — general arrangement */}
        <Sheet id="s1" title={t('blueprint.sheet.s1')} info={info} headingAs="p">
          <div className="grid gap-10 lg:grid-cols-[minmax(0,1.55fr)_minmax(0,1fr)]">
            <div>
              <p className="bp-mono text-[12px] uppercase text-[#b8cde6] rtl:normal-case">{t('blueprint.kicker', { count: SHEETS.length })}</p>
              <h1 className="bp-name mt-2">{p.displayName}</h1>
              <p className="mt-3 text-[18px] font-semibold text-[#ffd479]">{p.headline}</p>
              <p className="mt-1 max-w-2xl text-[16px] leading-relaxed text-[#dce8f6]">{p.tagline}</p>
              <div className="mt-8">
                <Axo layers={layers} total={totalParts} loc={loc} />
              </div>
            </div>
            <div className="space-y-8">
              <div>
                <h3 className="bp-sub">{t('blueprint.register')}</h3>
                <table className="bp-table mt-3 w-full text-[14px]">
                  <thead>
                    <tr>
                      <th scope="col">{t('blueprint.tb.sheet')}</th>
                      <th scope="col">{t('blueprint.tb.title')}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {SHEETS.map((s, i) => (
                      <tr key={s}>
                        <td className="bp-mono w-14" dir="ltr">
                          S{i + 1}
                        </td>
                        <td>
                          <a href={`#${s}`} className="bp-link">
                            {t(`blueprint.sheet.${s}`)}
                          </a>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div>
                <h3 className="bp-sub">{t('blueprint.notesTitle')}</h3>
                <ol className="mt-3 list-decimal space-y-2 ps-5 text-[14px] leading-relaxed text-[#dce8f6]">
                  <li>{t('blueprint.notes.n1')}</li>
                  <li>{t('blueprint.notes.n2')}</li>
                  <li>{t('blueprint.notes.n3')}</li>
                  <li>{t('blueprint.notes.n4')}</li>
                </ol>
                <p className="mt-4 text-[13px] text-[#b8cde6]">
                  <span className="bp-mono me-2 bg-[#ffd479] px-1.5 py-0.5 text-[10.5px] uppercase text-[#0d3a66] rtl:normal-case">{t('common.metaphor')}</span>
                  {t('blueprint.honesty')}
                </p>
              </div>
            </div>
          </div>
        </Sheet>

        {/* S2 — specification */}
        <Sheet id="s2" title={t('blueprint.sheet.s2')} info={info}>
          <div className="grid gap-10 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)]">
            <table className="bp-table bp-spec w-full text-[14.5px]">
              <tbody>
                <tr>
                  <th scope="row">{t('blueprint.spec.designation')}</th>
                  <td className="font-semibold">{p.displayName}</td>
                </tr>
                <tr>
                  <th scope="row">{t('blueprint.spec.type')}</th>
                  <td>{p.labels.join(' · ')}</td>
                </tr>
                <tr>
                  <th scope="row">{t('blueprint.spec.location')}</th>
                  <td>{p.location}</td>
                </tr>
                <tr>
                  <th scope="row">{t('blueprint.spec.status')}</th>
                  <td>{p.status}</td>
                </tr>
                <tr>
                  <th scope="row">{t('blueprint.spec.availability')}</th>
                  <td className="text-[#ffd479]">{p.availability}</td>
                </tr>
                <tr>
                  <th scope="row">{t('blueprint.spec.ratings')}</th>
                  <td>
                    <dl className="grid grid-cols-1 gap-x-6 gap-y-2 sm:grid-cols-2">
                      {data.stats.map((s) => (
                        <div key={s.id} className="flex items-baseline gap-2">
                          <dt className="bp-mono min-w-[4.5rem] text-[17px] font-bold text-[#eef5ff]">
                            {fmtNum(loc, s.value)}
                            {s.suffix}
                          </dt>
                          <dd className="text-[13px] text-[#b8cde6]">{s.label}</dd>
                        </div>
                      ))}
                    </dl>
                  </td>
                </tr>
              </tbody>
            </table>
            <div>
              <figure className="flex items-start gap-4">
                <ProfilePhoto src={p.photo} alt={t('common.photoAlt')} size={320} className="bp-photo size-28 shrink-0 sm:size-32" />
                <figcaption className="bp-mono pt-1 text-[11px] uppercase text-[#b8cde6] rtl:normal-case">{t('blueprint.spec.photo')}</figcaption>
              </figure>
              <h3 className="bp-sub mt-6">{t('blueprint.spec.description')}</h3>
              <div className="mt-3 space-y-3 text-[15px] leading-relaxed text-[#dce8f6]">
                {p.about.map((para, i) => (
                  <p key={i}>{para}</p>
                ))}
              </div>
            </div>
          </div>
        </Sheet>

        {/* S3 — assemblies */}
        <Sheet id="s3" title={t('blueprint.sheet.s3')} info={info}>
          <p className="max-w-3xl text-[15px] text-[#dce8f6]">
            {t('blueprint.assy.intro', {
              count: projects.length,
              featured: data.projects.length,
              archive: data.archive.length,
            })}
          </p>
          <ol className="mt-8 grid gap-6 md:grid-cols-2">
            {data.projects.map((x, i) => (
              <li key={x.id} id={`assy-${x.id}`} className="bp-card scroll-mt-28">
                <BlockDiagram tags={x.tags} code={code(i)} />
                <h3 className="mt-4 text-[18px] font-bold leading-snug" dir="auto">
                  {x.title}
                </h3>
                <p className="mt-1.5 text-[14.5px] leading-relaxed text-[#dce8f6]" dir="auto">
                  {x.description}
                </p>
                <table className="bp-table bp-kv mt-4 w-full text-[13px]">
                  <tbody>
                    <tr>
                      <th scope="row">{t('common.category')}</th>
                      <td>{t(`categories.${x.category}`)}</td>
                    </tr>
                    <tr>
                      <th scope="row">{t('common.tags')}</th>
                      <td className="bp-mono" dir="ltr">
                        {x.tags.length ? x.tags.join(' · ') : '—'}
                      </td>
                    </tr>
                    {x.metric && (
                      <tr>
                        <th scope="row">{t('blueprint.assy.metric')}</th>
                        <td className="bp-mono font-bold text-[#ffd479]" dir="ltr">
                          {x.metric}
                        </td>
                      </tr>
                    )}
                    <tr>
                      <th scope="row">{t('blueprint.assy.links')}</th>
                      <td>
                        {x.url ? (
                          <a href={x.url} target="_blank" rel="noreferrer" aria-label={`${t('common.code')}: ${x.title}`} className="bp-link inline-flex items-center gap-1">
                            <BrandIcon name="github" className="size-3.5" /> {t('common.code')}
                            <ArrowUpRight className="flip-rtl size-3.5" aria-hidden />
                          </a>
                        ) : (
                          t('common.noLink')
                        )}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </li>
            ))}
          </ol>

          <h3 className="bp-sub mt-14">{t('blueprint.assy.partsList', { count: data.archive.length })}</h3>
          <ol className="mt-4 divide-y divide-[#eef5ff]/15 border-y border-[#eef5ff]/30">
            {data.archive.map((x, j) => (
              <li key={x.id} id={`assy-${x.id}`} className="grid scroll-mt-28 gap-x-6 gap-y-1 py-3 md:grid-cols-[5rem_minmax(0,1fr)_minmax(0,1.6fr)]">
                <span className="bp-mono text-[13px] text-[#ffd479]" dir="ltr">
                  {code(data.projects.length + j)}
                </span>
                <div>
                  <p className="font-semibold leading-snug" dir="auto">
                    {x.url ? (
                      <a href={x.url} target="_blank" rel="noreferrer" className="bp-link">
                        {x.title}
                      </a>
                    ) : (
                      x.title
                    )}
                  </p>
                  <p className="text-[12.5px] text-[#b8cde6]">
                    {t(`categories.${x.category}`)}
                    {x.tags.length > 0 && (
                      <span className="bp-mono ml-2 rtl:ml-0 rtl:mr-2" dir="ltr">
                        {x.tags.join(' · ')}
                      </span>
                    )}
                  </p>
                </div>
                <p className="text-[14px] leading-relaxed text-[#dce8f6]" dir="auto">
                  {x.description}
                </p>
              </li>
            ))}
          </ol>
        </Sheet>

        {/* S4 — revision history */}
        <Sheet id="s4" title={t('blueprint.sheet.s4')} info={info}>
          <p className="max-w-3xl text-[14px] text-[#b8cde6]">{t('blueprint.rev.note')}</p>
          <div
            aria-hidden
            className="bp-mono mt-6 hidden grid-cols-[3.5rem_10rem_minmax(0,1fr)_14rem_10rem] gap-4 border-y border-[#eef5ff]/40 py-2 text-[11.5px] uppercase text-[#b8cde6] md:grid rtl:normal-case"
          >
            <span>{t('blueprint.rev.rev')}</span>
            <span>{t('blueprint.rev.date')}</span>
            <span>{t('common.description')}</span>
            <span>{t('blueprint.rev.approved')}</span>
            <span>{t('blueprint.rev.place')}</span>
          </div>
          <ol className="divide-y divide-[#eef5ff]/15 border-b border-[#eef5ff]/30 max-md:border-t">
            {revs.map(({ e, rev }) => (
              <RevRow key={e.id} e={e} rev={rev} t={t} />
            ))}
          </ol>
        </Sheet>

        {/* S5 — bill of materials */}
        <Sheet id="s5" title={t('blueprint.sheet.s5')} info={info}>
          <p className="max-w-3xl text-[14px] text-[#b8cde6]">
            {t('blueprint.bom.note', {
              parts: skills.length,
              consumables: soft?.groups.reduce((n, g) => n + g.items.length, 0) ?? 0,
            })}
          </p>
          <div className="mt-8 columns-1 gap-8 lg:columns-2">
            {tech.map((c) => {
              const rows: Array<
                | { kind: 'g'; id: string; label: string; n: number }
                | {
                    kind: 'i';
                    key: string;
                    part: string;
                    name: string;
                    long: string;
                    no: number;
                  }
              > = [];
              let k = 0;
              for (const g of c.groups) {
                rows.push({
                  kind: 'g',
                  id: g.id,
                  label: g.label,
                  n: g.items.length,
                });
                for (const it of g.items) {
                  k++;
                  rows.push({
                    kind: 'i',
                    key: `${g.id}/${it.key}`,
                    part: `SK-${PFX[c.id] ?? 'GEN'}-${pad(k, 3)}`,
                    name: it.name,
                    long: it.long,
                    no: k,
                  });
                }
              }
              return (
                <div key={c.id} id={`bom-cat-${c.id}`} className="bp-card mb-8 break-inside-avoid">
                  <h3 className="bp-sub flex items-baseline justify-between gap-3">
                    <span>{c.label}</span>
                    <span className="bp-mono text-[12px] normal-case text-[#b8cde6]">{t('blueprint.parts', { count: k })}</span>
                  </h3>
                  <ShowAll
                    as="div"
                    className="mt-3 text-[13.5px]"
                    items={rows}
                    initial={14}
                    getKey={(r) => (r.kind === 'g' ? `g-${r.id}` : r.key)}
                    buttonWrapClassName="mt-1"
                    buttonClassName={btn}
                    render={(r) =>
                      r.kind === 'g' ? (
                        <p
                          id={`bom-${r.id}`}
                          className="bp-mono mt-3 flex scroll-mt-28 justify-between gap-3 border-b border-[#eef5ff]/40 pb-1 text-[11.5px] uppercase text-[#ffd479] first:mt-0 rtl:normal-case"
                        >
                          <span>{r.label}</span>
                          <span>{t('blueprint.bom.subtotal', { count: r.n })}</span>
                        </p>
                      ) : (
                        <p className="grid grid-cols-[2.2rem_6.6rem_minmax(0,1fr)] gap-2 border-b border-[#eef5ff]/10 py-1">
                          <span className="bp-mono text-[#b8cde6]">{fmtNum(loc, r.no)}</span>
                          <span className="bp-mono text-[12px]" dir="ltr">
                            {r.part}
                          </span>
                          <span>
                            <bdi>{r.name}</bdi>
                            {r.long !== r.name && <span className="text-[12px] text-[#b8cde6]"> — {r.long}</span>}
                          </span>
                        </p>
                      )
                    }
                  />
                </div>
              );
            })}
            {soft && (
              <div id="bom-consumables" className="bp-card mb-8 break-inside-avoid">
                <h3 className="bp-sub">{t('blueprint.bom.consumables')}</h3>
                <ul className="mt-3 text-[13.5px]">
                  {soft.groups
                    .flatMap((g) => g.items)
                    .map((it, i) => (
                      <li key={it.key} className="grid grid-cols-[2.2rem_6.6rem_minmax(0,1fr)] gap-2 border-b border-[#eef5ff]/10 py-1">
                        <span className="bp-mono text-[#b8cde6]">{fmtNum(loc, i + 1)}</span>
                        <span className="bp-mono text-[12px]" dir="ltr">
                          CON-{pad(i + 1)}
                        </span>
                        <bdi>{it.name}</bdi>
                      </li>
                    ))}
                </ul>
              </div>
            )}
          </div>
        </Sheet>

        {/* S6 — training records */}
        <Sheet id="s6" title={t('blueprint.sheet.s6')} info={info}>
          <p className="bp-mono text-[13px] text-[#ffd479]">
            {t('blueprint.tr.totals', {
              count: data.certifications.length,
              hours: courseHours,
              certs: data.certifications.filter((c) => c.url).length,
            })}
            {courseWeeks > 0 && ` + ${t('common.weeks', { count: fmtNum(loc, courseWeeks) })}`}
          </p>
          <div
            aria-hidden
            className="bp-mono mt-6 hidden grid-cols-[4.5rem_minmax(0,1fr)_14rem_4rem_5rem_5rem] gap-4 border-y border-[#eef5ff]/40 py-2 text-[11.5px] uppercase text-[#b8cde6] md:grid rtl:normal-case"
          >
            <span>{t('blueprint.tr.record')}</span>
            <span>{t('blueprint.tr.course')}</span>
            <span>{t('common.issuer')}</span>
            <span>{t('common.year')}</span>
            <span className="text-end">{t('blueprint.tr.hours')}</span>
            <span className="text-end">{t('common.certificate')}</span>
          </div>
          <ShowAll
            as="ol"
            className="divide-y divide-[#eef5ff]/15 border-b border-[#eef5ff]/30 max-md:border-t"
            items={data.certifications}
            initial={14}
            getKey={(c) => c.name + c.issuer}
            buttonWrapClassName="mt-2"
            buttonClassName={btn}
            render={(c, i) => (
              <div className="grid gap-x-4 gap-y-0.5 py-2 text-[14px] md:grid-cols-[4.5rem_minmax(0,1fr)_14rem_4rem_5rem_5rem] md:items-baseline">
                <span className="bp-mono text-[12.5px] text-[#ffd479]" dir="ltr">
                  TR-{pad(i + 1)}
                </span>
                <span className="font-medium">
                  <bdi lang="en">{c.name}</bdi>
                </span>
                <span className="text-[13px] text-[#b8cde6]">
                  <bdi>{c.issuer}</bdi>
                </span>
                <span className="flex flex-wrap gap-x-4 md:contents">
                  <span className="bp-mono text-[13px] text-[#b8cde6]">{c.year ? fmtYear(loc, c.year) : '—'}</span>
                  <span className="bp-mono text-[13px] md:text-end">
                    {c.hours ? t('common.hours', { count: fmtNum(loc, c.hours) }) : c.weeks ? t('common.weeks', { count: fmtNum(loc, c.weeks) }) : '—'}
                  </span>
                  <span className="text-[13px] md:text-end">
                    {c.url ? (
                      <a href={c.url} target="_blank" rel="noreferrer" className="bp-link inline-flex items-center gap-1">
                        {t('common.certificate')}
                        <ArrowUpRight className="flip-rtl size-3.5" aria-hidden />
                      </a>
                    ) : (
                      <span className="text-[#b8cde6]">—</span>
                    )}
                  </span>
                </span>
              </div>
            )}
          />
        </Sheet>

        {/* S7 — reference documents */}
        <Sheet id="s7" title={t('blueprint.sheet.s7')} info={info}>
          <ol className="space-y-5">
            {data.publications.map((pub, i) => (
              <li key={pub.id} className="grid gap-x-6 gap-y-1 md:grid-cols-[5rem_minmax(0,1fr)]">
                <span className="bp-mono text-[13px] text-[#ffd479]" dir="ltr">
                  DOC-{pad(i + 1)}
                </span>
                <div className="text-[15px] leading-relaxed">
                  <p className="font-semibold">
                    <bdi lang="en">{pub.title}</bdi>
                  </p>
                  <p className="text-[13.5px] text-[#dce8f6]">
                    <Authors ownerName={data.person.fullName} p={pub} meClassName="font-bold text-[#eef5ff]" etAl={t('common.withCoAuthors')} />
                  </p>
                  <p className="text-[13px] text-[#b8cde6]">
                    {pub.venue && (
                      <bdi lang="en">
                        <i>{pub.venue}</i>
                        {pub.publisher ? `, ${pub.publisher}` : ''}
                      </bdi>
                    )}
                    {pub.venue ? ' · ' : ''}
                    {pub.year ? `${fmtYear(loc, pub.year)} · ` : ''}
                    {publicationLabel(t, 'pubType', pub.type)} · {publicationLabel(t, 'pubStatus', pub.status)}
                  </p>
                  <p className="mt-1 flex flex-wrap gap-3 text-[13px]">
                    {pub.url && (
                      <a href={pub.url} target="_blank" rel="noreferrer" dir="ltr" className="bp-link">
                        {pub.doi ? `doi:${pub.doi}` : t('common.visit')}
                      </a>
                    )}
                    {pub.bibtex && (
                      <CopyButton value={pub.bibtex} className="bp-link inline-flex items-center gap-1">
                        <Copy className="size-3.5" aria-hidden /> {t('common.copyBibtex')}
                      </CopyButton>
                    )}
                  </p>
                </div>
              </li>
            ))}
          </ol>
        </Sheet>

        {/* S8 — qualifications */}
        <Sheet id="s8" title={t('blueprint.sheet.s8')} info={info}>
          <ol className="grid gap-6 md:grid-cols-3">
            {data.education.map((e, i) => (
              <li key={e.id} className="bp-card">
                <p className="bp-mono text-[12.5px] text-[#ffd479]" dir="ltr">
                  Q-{pad(i + 1)}
                </p>
                <h3 className="mt-1 text-[17px] font-bold leading-snug">{e.degree}</h3>
                <p className="mt-1 text-[14px] text-[#dce8f6]">{e.institution}</p>
                <p className="text-[13px] text-[#b8cde6]">
                  {e.location} · {e.period}
                </p>
                {e.gpa && (
                  <p className="mt-2 text-[13.5px]">
                    {t('common.gpa')}{' '}
                    <bdi dir="ltr" className="bp-mono">
                      {e.gpa}
                    </bdi>
                  </p>
                )}
                {e.id === 'tehran' && thesis && (
                  <p className="mt-2 text-[13.5px] text-[#dce8f6]">
                    {t('common.thesis')}: <bdi lang="en">{thesis.title}</bdi>
                  </p>
                )}
              </li>
            ))}
          </ol>
        </Sheet>

        {/* S9 — interfaces & sign-off */}
        <Sheet id="s9" title={t('blueprint.sheet.s9')} info={info}>
          <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
            <div>
              <h3 className="bp-sub">{t('blueprint.sign.interfaces')}</h3>
              <table className="bp-table mt-3 w-full text-[14px]">
                <tbody>
                  {data.languages.map((l) => (
                    <tr key={l.id}>
                      <th scope="row" className="w-28">
                        {l.name}
                      </th>
                      <td>
                        {l.level}
                        {l.cert && (
                          <span className="block text-[13px] text-[#b8cde6]">
                            {l.cert.test}{' '}
                            {fmtNum(loc, l.cert.overall, {
                              minimumFractionDigits: 1,
                            })}{' '}
                            — {(['listening', 'reading', 'writing', 'speaking'] as const).map((k) => `${t(`ielts.${k}`)} ${fmtNum(loc, l.cert!.bands[k], { minimumFractionDigits: 1 })}`).join(' · ')}
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div id="contact" className="relative">
              <h3 className="bp-sub">{t('blueprint.sign.signoff')}</h3>
              <p className="mt-3 max-w-md text-[15px] leading-relaxed text-[#dce8f6]">
                {p.availability} {t('sections.contact.subtitle')}
              </p>
              <a href={data.links.email} dir="ltr" className="bp-btn bp-btn-on mt-5 inline-flex items-center gap-2 break-all text-[14.5px]">
                <Mail className="size-4 shrink-0" aria-hidden /> {p.email}
              </a>
              <div className="mt-4 flex flex-wrap gap-2">
                {(['github', 'linkedin', 'orcid', 'scholar'] as const).map((k) =>
                  data.links[k] ? (
                    <a key={k} href={data.links[k]!} target="_blank" rel="noreferrer" aria-label={k} className="bp-icon">
                      <BrandIcon name={k} className="size-4" />
                    </a>
                  ) : null,
                )}
              </div>
              <div aria-hidden className="bp-stamp mt-8">
                <span className="bp-title text-[22px] leading-none">{t('common.available')}</span>
                <span className="bp-mono mt-1 block text-[11px]">{info.date}</span>
              </div>
            </div>
          </div>
        </Sheet>

        <footer className="flex flex-wrap justify-between gap-3 pb-24 pt-2 text-[12.5px] text-[#b8cde6]">
          <span>
            {t('common.rights', {
              year: fmtYear(loc, new Date(data.generatedAt).getUTCFullYear()),
            })}
          </span>
          <span>{t('blueprint.footer')}</span>
        </footer>
      </main>
    </div>
  );
}

function RevRow({ e, rev, t }: { e: Experience; rev: string; t: ReturnType<typeof useTranslations> }) {
  const loc = useLocale();
  return (
    <li className="grid gap-x-4 gap-y-1 py-3 text-[14px] md:grid-cols-[3.5rem_10rem_minmax(0,1fr)_14rem_10rem]">
      <span className={cn('bp-mono text-[15px] font-bold', rev === '—' ? 'text-[#b8cde6]' : 'text-[#ffd479]')} dir="ltr">
        <span className="sr-only">{t('blueprint.rev.rev')} </span>
        {rev}
      </span>
      <span className="text-[13px] text-[#b8cde6]">
        <span className="sr-only">{t('blueprint.rev.date')}: </span>
        {e.period || t('common.undated')}
        {e.months ? dot(loc) + t('common.months', { count: e.months }) : ''}
      </span>
      <span>
        <b className="block leading-snug">{e.role}</b>
        <span className="mt-0.5 block leading-relaxed text-[#dce8f6]">{e.description}</span>
      </span>
      <span className="text-[13.5px]">
        <span className="text-[#b8cde6] md:sr-only">{t('blueprint.rev.approved')}: </span>
        {e.org}
      </span>
      <span className="text-[13.5px] text-[#dce8f6]">
        <span className="text-[#b8cde6] md:sr-only">{t('blueprint.rev.place')}: </span>
        {e.location || '—'}
      </span>
    </li>
  );
}
