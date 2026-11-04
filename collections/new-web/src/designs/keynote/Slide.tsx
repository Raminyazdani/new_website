'use client';

import { useMemo } from 'react';
import { useTranslations } from 'next-intl';
import { ArrowUpRight, Copy, Mail, MapPin } from 'lucide-react';
import qrcode from 'qrcode-generator';
import { createMap } from 'svg-dotted-map';
import { Authors } from '@/components/kit/Authors';
import { NumberTicker } from '@/components/magicui/number-ticker';
import { BrandIcon } from '@/components/shared/BrandIcon';
import { CopyButton } from '@/components/shared/CopyButton';
import { r2 } from '@/lib/derive';
import { fmtNum, fmtYear, numberLocale, seqNo, publicationLabel } from '@/lib/format';
import type { SiteData } from '@/lib/types';
import { cn } from '@/lib/utils';
import { Aurora } from './Aurora';
import { CHAPTERS, chapterStarts, type Slide } from './slides';

function Kicker({ slide, n, total, loc }: { slide: Slide; n: number; total: number; loc: string }) {
  const t = useTranslations('keynote');
  return (
    <p className="kn-kicker flex items-center justify-between gap-4">
      <span>{t(`chapters.${slide.chapter}`)}</span>
      <span className="kn-mono" dir="ltr">
        {fmtNum(loc, n + 1)} / {fmtNum(loc, total)}
      </span>
    </p>
  );
}

function Journey({ data }: { data: SiteData }) {
  const map = useMemo(() => {
    const { points, addMarkers } = createMap({ width: 480, height: 240, mapSamples: 40000 });
    const pins = addMarkers(data.journey.map((j) => ({ lat: j.lat, lng: j.lng })));
    const xs = pins.map((p) => p.x);
    const ys = pins.map((p) => p.y);
    const box = { x0: Math.min(...xs) - 30, x1: Math.max(...xs) + 30, y0: Math.min(...ys) - 22, y1: Math.max(...ys) + 22 };
    return { pts: points.filter((p) => p.x > box.x0 && p.x < box.x1 && p.y > box.y0 && p.y < box.y1).map((p) => [r2(p.x), r2(p.y)] as const), pins: pins.map((p) => [r2(p.x), r2(p.y)] as const), box };
  }, [data.journey]);
  const { box } = map;
  return (
    <svg viewBox={`${r2(box.x0)} ${r2(box.y0)} ${r2(box.x1 - box.x0)} ${r2(box.y1 - box.y0)}`} className="block h-auto w-full" aria-hidden direction="ltr">
      {map.pts.map(([x, y], i) => (
        <circle key={i} cx={x} cy={y} r={0.55} className="kn-dot" />
      ))}
      <polyline points={map.pins.map((p) => p.join(',')).join(' ')} fill="none" className="kn-route" />
      {map.pins.map(([x, y], i) => (
        <circle key={`p${i}`} cx={x} cy={y} r={i === map.pins.length - 1 ? 2.2 : 1.6} className={i === map.pins.length - 1 ? 'kn-pin-now' : 'kn-pin'} />
      ))}
    </svg>
  );
}

function Qr({ url }: { url: string }) {
  const cells = useMemo(() => {
    const q = qrcode(0, 'M');
    q.addData(url);
    q.make();
    const n = q.getModuleCount();
    const out: Array<[number, number]> = [];
    for (let r = 0; r < n; r++) for (let c = 0; c < n; c++) if (q.isDark(r, c)) out.push([c, r]);
    return { n, out };
  }, [url]);
  return (
    <svg viewBox={`-2 -2 ${cells.n + 4} ${cells.n + 4}`} className="block h-auto w-full" role="img" aria-label={url} shapeRendering="crispEdges">
      <rect x={-2} y={-2} width={cells.n + 4} height={cells.n + 4} fill="#fff" />
      <path d={cells.out.map(([x, y]) => `M${x} ${y}h1v1h-1z`).join('')} fill="#07070b" />
    </svg>
  );
}

/** One slide. The same markup serves scroll mode (a card) and present mode (the stage). */
export function SlideView({
  slide,
  n,
  total,
  data,
  deck,
  present,
  onJump,
  still = false,
}: {
  slide: Slide;
  n: number;
  total: number;
  data: SiteData;
  deck: Slide[];
  present: boolean;
  onJump?: (i: number) => void;
  /** pause decorative animation (the scroll-mode copy while the deck is being presented on top) */
  still?: boolean;
}) {
  const t = useTranslations();
  const loc = data.locale;
  const p = data.person;
  const sep = loc === 'fa' ? '، ' : ' · ';
  const body = (() => {
    switch (slide.kind) {
      case 'title':
        return (
          <div className="relative flex h-full flex-col justify-end">
            <p className="kn-kicker">{t('keynote.talk')}</p>
            <h1 className="kn-h1 kn-grad mt-[1.5cqw]">{p.displayName}</h1>
            <p className="kn-lead mt-[1.6cqw]">{p.headline}</p>
            <p className="kn-body mt-[0.8cqw] text-[var(--kn-muted)]">{p.tagline}</p>
            <p className="kn-small mt-[1.2cqw] inline-flex items-center gap-[0.5em] text-[var(--kn-muted)]">
              <MapPin className="size-[1.1em] shrink-0" aria-hidden />
              {p.location}
            </p>
          </div>
        );
      case 'agenda': {
        const starts = chapterStarts(deck);
        return (
          <div>
            <h2 className="kn-h2">{t('keynote.agenda')}</h2>
            <ol className="kn-body mt-[2.4cqw] grid gap-x-[4cqw] gap-y-[0.9cqw] sm:grid-cols-2">
              {CHAPTERS.map((c, i) => (
                <li key={c} className="flex items-baseline gap-[1.2cqw]">
                  <span className="kn-mono text-[var(--kn-muted)]">{seqNo(loc, i + 1)}</span>
                  {onJump ? (
                    <button type="button" onClick={() => onJump(starts.get(c) ?? 0)} className="kn-link text-start">
                      {t(`keynote.chapters.${c}`)}
                    </button>
                  ) : (
                    <a href={`#slide-${(starts.get(c) ?? 0) + 1}`} className="kn-link">
                      {t(`keynote.chapters.${c}`)}
                    </a>
                  )}
                </li>
              ))}
            </ol>
          </div>
        );
      }
      case 'about':
        return (
          <div>
            <h2 className="kn-h2">{slide.part === 0 ? t('keynote.aboutTitle') : t('keynote.aboutTitle2')}</h2>
            {slide.part === 0 && <p className="kn-lead mt-[2cqw] max-w-[85%]">{p.statement}</p>}
            <div className="kn-body mt-[1.6cqw] max-w-[90%] space-y-[1cqw] text-[var(--kn-muted-strong)]">
              {slide.paras.map((x, i) => (
                <p key={i}>{x}</p>
              ))}
            </div>
            {slide.part === 1 && (
              <p className="mt-[1.6cqw] flex flex-wrap gap-[0.8cqw]">
                {p.labels.map((l) => (
                  <span key={l} className="kn-chip">
                    {l}
                  </span>
                ))}
              </p>
            )}
          </div>
        );
      case 'stats':
        return (
          <div>
            <h2 className="kn-h2">{t('keynote.statsTitle')}</h2>
            <dl className="mt-[2.4cqw] grid grid-cols-2 gap-x-[3cqw] gap-y-[2cqw] md:grid-cols-4">
              {data.stats.map((s) => (
                <div key={s.id}>
                  <dt className="sr-only">{s.label}</dt>
                  <dd>
                    <span className="kn-big kn-grad" dir="ltr">
                      <NumberTicker value={s.value} locale={numberLocale(loc)} animateOnMount={present} className="!tracking-normal !text-inherit" />
                      {s.suffix}
                    </span>
                    <span className="kn-small mt-[0.4cqw] block text-[var(--kn-muted)]" aria-hidden>
                      {s.label}
                    </span>
                  </dd>
                </div>
              ))}
            </dl>
          </div>
        );
      case 'journey':
        return (
          <div className="grid h-full gap-[3cqw] md:grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)] md:items-center">
            <div>
              <h2 className="kn-h2">{t('keynote.journeyTitle')}</h2>
              <ol className="kn-body mt-[2cqw] space-y-[0.9cqw]">
                {data.journey.map((j) => (
                  <li key={j.id}>
                    <b>{j.city}</b> <span className="kn-mono text-[var(--kn-muted)]">{j.period}</span>
                    <span className="kn-small block text-[var(--kn-muted)]">{j.note}</span>
                  </li>
                ))}
              </ol>
            </div>
            <Journey data={data} />
          </div>
        );
      case 'education': {
        const e = slide.item;
        const thesis = e.id === 'tehran' ? data.publications.find((x) => x.type === 'Master Thesis') : undefined;
        return (
          <div>
            <h2 className="kn-h2">{e.degree}</h2>
            <p className="kn-lead mt-[1.6cqw]">{e.institution}</p>
            <p className="kn-body mt-[0.6cqw] text-[var(--kn-muted)]">
              {e.location}
              {sep}
              {e.period}
              {e.gpa ? (
                <>
                  {sep}
                  {t('common.gpa')} <bdi dir="ltr">{e.gpa}</bdi>
                </>
              ) : null}
            </p>
            {thesis && (
              <p className="kn-body mt-[2cqw] max-w-[85%] border-s-2 border-[var(--kn-accent)] ps-[1.4cqw]">
                <span className="kn-small block text-[var(--kn-muted)]">{t('common.thesis')}</span>
                <bdi lang="en">{thesis.title}</bdi>
              </p>
            )}
          </div>
        );
      }
      case 'role': {
        const e = slide.item;
        return (
          <div>
            <p className="kn-mono kn-small text-[var(--kn-accent2)]">
              {e.period || t('common.undated')}
              {e.months ? `${sep}${t('common.months', { count: e.months })}` : ''}
              {sep}
              {t(`kinds.${e.kind}`)}
            </p>
            <h2 className="kn-h2 mt-[1cqw]">{e.role}</h2>
            <p className="kn-lead mt-[1.2cqw]">
              {e.org}
              {e.location ? <span className="text-[var(--kn-muted)]">{sep + e.location}</span> : null}
            </p>
            <p className="kn-body mt-[2cqw] max-w-[88%] text-[var(--kn-muted-strong)]">{e.description}</p>
          </div>
        );
      }
      case 'project': {
        const x = slide.item;
        return (
          <div>
            <p className="kn-mono kn-small text-[var(--kn-accent2)]">{t(`categories.${x.category}`)}</p>
            <h2 className="kn-h2 mt-[1cqw]" dir="auto">
              {x.title}
            </h2>
            {x.metric && (
              <p className="kn-big kn-grad mt-[1.2cqw]" dir="ltr">
                {x.metric}
              </p>
            )}
            <p className="kn-lead mt-[1.6cqw] max-w-[88%]" dir="auto">
              {x.description}
            </p>
            <p className="mt-[2cqw] flex flex-wrap items-center gap-[0.8cqw]" dir="ltr">
              {x.tags.map((tag) => (
                <span key={tag} className="kn-chip">
                  {tag}
                </span>
              ))}
              {x.url && (
                <a href={x.url} target="_blank" rel="noreferrer" aria-label={`${t('common.code')}: ${x.title}`} className="kn-link kn-small ms-[1cqw] inline-flex items-center gap-1">
                  <BrandIcon name="github" className="size-[1.2em]" /> {t('common.code')}
                </a>
              )}
            </p>
          </div>
        );
      }
      case 'grid':
        return (
          <div>
            <h2 className="kn-h2">
              {slide.archive ? t('keynote.archiveTitle') : t('keynote.moreTitle')}
              {slide.parts > 1 && (
                <span className="kn-mono kn-small ms-[1.2cqw] align-middle text-[var(--kn-muted)]">
                  {fmtNum(loc, slide.part + 1)}/{fmtNum(loc, slide.parts)}
                </span>
              )}
            </h2>
            <ul className="mt-[2cqw] grid gap-[1.4cqw] sm:grid-cols-2 md:grid-cols-3">
              {slide.items.map((x) => (
                <li key={x.id} className="kn-card">
                  <p className="kn-small font-semibold leading-snug" dir="auto">
                    {x.url ? (
                      <a href={x.url} target="_blank" rel="noreferrer" className="kn-link">
                        {x.title}
                      </a>
                    ) : (
                      x.title
                    )}
                  </p>
                  <p className="kn-tiny mt-[0.3cqw] text-[var(--kn-accent2)]">{t(`categories.${x.category}`)}</p>
                  <p className="kn-tiny mt-[0.5cqw] text-[var(--kn-muted-strong)]" dir="auto">
                    {x.description}
                  </p>
                </li>
              ))}
            </ul>
          </div>
        );
      case 'publications':
        return (
          <div>
            <h2 className="kn-h2">{t('sections.publications.title')}</h2>
            <ol className="mt-[1.6cqw] space-y-[1.1cqw]">
              {data.publications.map((pub) => (
                <li key={pub.id} className="kn-small">
                  <b className="block leading-snug">
                    <bdi lang="en">{pub.title}</bdi>
                  </b>
                  <span className="kn-tiny block text-[var(--kn-muted-strong)]">
                    <Authors ownerName={data.person.fullName} p={pub} meClassName="font-bold text-[var(--kn-ink)]" etAl={t('common.withCoAuthors')} />
                    {pub.year ? ` · ${fmtYear(loc, pub.year)}` : ''}
                    {pub.venue ? (
                      <>
                        {' · '}
                        <bdi lang="en">
                          <i>{pub.venue}</i>
                        </bdi>
                      </>
                    ) : null}
                    {' · '}
                    {publicationLabel(t, 'pubType', pub.type)} · {publicationLabel(t, 'pubStatus', pub.status)}
                  </span>
                  <span className="kn-tiny mt-[0.2cqw] flex flex-wrap gap-[1.2cqw]">
                    {pub.url && (
                      <a href={pub.url} target="_blank" rel="noreferrer" dir="ltr" className="kn-link">
                        {pub.doi ? `doi:${pub.doi}` : t('common.visit')}
                      </a>
                    )}
                    {pub.bibtex && (
                      <CopyButton value={pub.bibtex} className="kn-link inline-flex items-center gap-1">
                        <Copy className="size-[1em]" aria-hidden /> {t('common.copyBibtex')}
                      </CopyButton>
                    )}
                  </span>
                </li>
              ))}
            </ol>
          </div>
        );
      case 'skills': {
        const c = data.skills.find((x) => x.id === slide.categoryId)!;
        const count = c.groups.reduce((s2, g) => s2 + g.items.length, 0);
        return (
          <div>
            <h2 className="kn-h2">
              {c.label} <span className="kn-mono kn-small align-middle text-[var(--kn-muted)]">{fmtNum(loc, count)}</span>
            </h2>
            <div className="mt-[1.4cqw] space-y-[0.9cqw]">
              {c.groups.map((g) => (
                <div key={g.id}>
                  {c.groups.length > 1 && <p className="kn-tiny font-semibold text-[var(--kn-accent2)]">{g.label}</p>}
                  <p className="mt-[0.3cqw] flex flex-wrap gap-[0.5cqw]">
                    {g.items.map((it) => (
                      <span key={it.key} className="kn-chip kn-chip-sm" title={it.long !== it.name ? it.long : undefined}>
                        <bdi>{it.name}</bdi>
                      </span>
                    ))}
                  </p>
                </div>
              ))}
            </div>
          </div>
        );
      }
      case 'courses':
        return (
          <div>
            <h2 className="kn-h2">
              {t('sections.certifications.title')}
              <span className="kn-mono kn-small ms-[1.2cqw] align-middle text-[var(--kn-muted)]">
                {fmtNum(loc, slide.part + 1)}/{fmtNum(loc, slide.parts)}
              </span>
            </h2>
            <ol className="mt-[1.6cqw] grid gap-x-[3cqw] gap-y-[0.35cqw] md:grid-cols-2">
              {slide.items.map((c, i) => (
                <li key={c.name + c.issuer} className="kn-tiny flex items-baseline gap-[0.8cqw]">
                  <span className="kn-mono w-[2.2em] shrink-0 text-[var(--kn-muted)]">{fmtNum(loc, slide.from + i + 1)}</span>
                  <span className="min-w-0">
                    <bdi lang="en" className="font-semibold">
                      {c.name}
                    </bdi>
                    <span className="text-[var(--kn-muted)]">
                      {' — '}
                      <bdi>{c.issuer}</bdi>
                      {c.year ? `${sep}${fmtYear(loc, c.year)}` : ''}
                      {sep}
                      {c.hours ? t('common.hours', { count: fmtNum(loc, c.hours) }) : c.weeks ? t('common.weeks', { count: fmtNum(loc, c.weeks) }) : '—'}
                    </span>
                    {c.url && (
                      <a href={c.url} target="_blank" rel="noreferrer" aria-label={`${t('common.certificate')}: ${c.name}`} className="kn-link ms-[0.6cqw] inline-flex items-center">
                        <ArrowUpRight className="flip-rtl size-[1em]" aria-hidden />
                      </a>
                    )}
                  </span>
                </li>
              ))}
            </ol>
          </div>
        );
      case 'languages':
        return (
          <div>
            <h2 className="kn-h2">{t('sections.languages.title')}</h2>
            <ul className="mt-[2.4cqw] grid gap-[2cqw] md:grid-cols-3">
              {data.languages.map((l) => (
                <li key={l.id}>
                  <p className="kn-lead font-semibold">{l.name}</p>
                  <p className="kn-body text-[var(--kn-muted-strong)]">{l.level}</p>
                  {l.cert && (
                    <p className="kn-small mt-[0.6cqw] text-[var(--kn-muted)]">
                      {l.cert.test}{' '}
                      <b className="kn-grad" dir="ltr">
                        {fmtNum(loc, l.cert.overall, { minimumFractionDigits: 1 })}
                      </b>
                      <span className="block">
                        {(['listening', 'reading', 'writing', 'speaking'] as const).map((k) => `${t(`ielts.${k}`)} ${fmtNum(loc, l.cert!.bands[k], { minimumFractionDigits: 1 })}`).join(sep)}
                      </span>
                    </p>
                  )}
                </li>
              ))}
            </ul>
          </div>
        );
      case 'contact': {
        const shareUrl = typeof window === 'undefined' ? null : new URL(`/imported/${loc}/keynote/`, window.location.origin);
        return (
          <div className="grid h-full gap-[3cqw] md:grid-cols-[minmax(0,1.4fr)_minmax(0,0.6fr)] md:items-center">
            <div>
              <h2 className="kn-h2">{t('sections.contact.title')}</h2>
              <p className="kn-body mt-[1.6cqw] max-w-[90%] text-[var(--kn-muted-strong)]">
                {p.availability} {t('sections.contact.subtitle')}
              </p>
              <a href={data.links.email} dir="ltr" className="kn-btn kn-btn-solid kn-body mt-[2cqw] inline-flex items-center gap-[0.8cqw] break-all">
                <Mail className="size-[1em] shrink-0" aria-hidden /> {p.email}
              </a>
              <p className="mt-[1.6cqw] flex flex-wrap gap-[1cqw]">
                {(['github', 'linkedin', 'orcid', 'scholar'] as const).map((k) =>
                  data.links[k] ? (
                    <a key={k} href={data.links[k]!} target="_blank" rel="noreferrer" aria-label={k} className="kn-icon">
                      <BrandIcon name={k} className="size-[45%]" />
                    </a>
                  ) : null,
                )}
              </p>
            </div>
            {shareUrl && <figure className="mx-auto w-[60%] md:w-full">
              <Qr url={shareUrl.href} />
              <figcaption className="kn-tiny mt-[0.6cqw] text-center text-[var(--kn-muted)]" dir="ltr">
                {shareUrl.host}{shareUrl.pathname}
              </figcaption>
            </figure>}
          </div>
        );
      }
      case 'thanks':
        return (
          <div className="flex h-full flex-col items-center justify-center text-center">
            <h2 className="kn-h1 kn-grad">{t('keynote.thanks')}</h2>
            <p className="kn-lead mt-[1.6cqw]">{t('keynote.qa')}</p>
            <p className="kn-small mt-[1cqw] text-[var(--kn-muted)]" dir="ltr">
              {p.email}
            </p>
          </div>
        );
    }
  })();

  return (
    <div className={cn('kn-slide', slide.kind === 'title' && 'kn-slide-title', present && 'kn-slide-present')}>
      {slide.kind === 'title' && <Aurora className="kn-aurora" paused={still} />}
      {slide.kind !== 'title' && slide.kind !== 'thanks' && (
        <span aria-hidden className="kn-ghost kn-mono" dir="ltr">
          {seqNo(loc, CHAPTERS.indexOf(slide.chapter) + 1)}
        </span>
      )}
      <div className="relative flex h-full flex-col">
        <Kicker slide={slide} n={n} total={total} loc={loc} />
        <div className={cn('kn-content mt-[2cqw] min-h-0 flex-1', (slide.kind === 'title' || slide.kind === 'thanks') && 'flex flex-col justify-end')}>{body}</div>
      </div>
    </div>
  );
}

/** Presenter notes, built from the slide's own data. */
export function notesFor(slide: Slide, data: SiteData, t: ReturnType<typeof useTranslations>): string[] {
  switch (slide.kind) {
    case 'title':
      return [data.person.headline, data.person.tagline];
    case 'agenda':
      return CHAPTERS.map((c) => t(`keynote.chapters.${c}`));
    case 'about':
      return slide.part === 0 ? [data.person.statement] : data.person.labels;
    case 'stats':
      return data.stats.map((s) => `${fmtNum(data.locale, s.value)}${s.suffix} ${s.label}`);
    case 'journey':
      return data.journey.map((j) => `${j.city} (${j.period}) — ${j.note}`);
    case 'education':
      return [slide.item.institution, slide.item.period, slide.item.gpa ? `${t('common.gpa')} ${slide.item.gpa}` : ''].filter(Boolean);
    case 'role':
      return [`${slide.item.org}${slide.item.location ? `, ${slide.item.location}` : ''}`, slide.item.period || t('common.undated'), slide.item.description];
    case 'project':
      return [t(`categories.${slide.item.category}`), slide.item.tags.join(', '), slide.item.metric ?? '', slide.item.url ?? ''].filter(Boolean);
    case 'grid':
      return slide.items.map((x) => x.title);
    case 'publications':
      return data.publications.map((x) => `${publicationLabel(t, 'pubStatus', x.status)}: ${x.title}`);
    case 'skills': {
      const c = data.skills.find((x) => x.id === slide.categoryId)!;
      return c.groups.map((g) => `${g.label}: ${g.items.length}`);
    }
    case 'courses':
      return [t('keynote.notesCourses', { count: slide.items.length, hours: slide.items.reduce((s, c) => s + (c.hours ?? 0), 0) })];
    case 'languages':
      return data.languages.map((l) => `${l.name}: ${l.level}`);
    case 'contact':
      return [data.person.availability, data.person.email];
    case 'thanks':
      return [t('keynote.qa')];
  }
}
