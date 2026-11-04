'use client';

import { useEffect, useRef, useState } from 'react';
import { useTranslations } from 'next-intl';
import { ArrowUpRight, ChevronLeft, ChevronRight } from 'lucide-react';
import { BrandIcon } from '@/components/shared/BrandIcon';
import { fmtNum } from '@/lib/format';
import type { Project } from '@/lib/types';
import { cn } from '@/lib/utils';

type Trigger = { start: number; end: number };

/**
 * The reel: every project as a frame on two film strips. Desktop (fine pointer, ≥ 1024 × 700, motion OK):
 * a short GSAP ScrollTrigger pin turns vertical scroll into horizontal travel (≈ 2.2 px of film per px of
 * scroll — well under one viewport per eight frames), with a skip link. Everywhere else: a native
 * horizontal scroller with snap points and previous/next buttons.
 */
export function Reel({ projects, loc, rtl, skipTo }: { projects: Project[]; loc: string; rtl: boolean; skipTo: string }) {
  const t = useTranslations();
  const section = useRef<HTMLDivElement>(null);
  const viewport = useRef<HTMLDivElement>(null);
  const track = useRef<HTMLDivElement>(null);
  const trig = useRef<Trigger | null>(null);
  const [pinned, setPinned] = useState(false);
  const half = Math.ceil(projects.length / 2);
  const rows = [projects.slice(0, half), projects.slice(half)];

  useEffect(() => {
    const mq = window.matchMedia('(min-width: 1024px) and (min-height: 700px) and (pointer: fine) and (prefers-reduced-motion: no-preference)');
    let ctx: { revert: () => void } | null = null;
    let cancelled = false;
    let run = 0;
    const setup = async () => {
      const mine = ++run;
      ctx?.revert();
      ctx = null;
      trig.current = null;
      if (!mq.matches) {
        setPinned(false);
        return;
      }
      const [{ gsap }, { ScrollTrigger }] = await Promise.all([import('gsap'), import('gsap/ScrollTrigger')]);
      if (cancelled || mine !== run) return;
      gsap.registerPlugin(ScrollTrigger);
      setPinned(true);
      requestAnimationFrame(() => {
        if (cancelled || mine !== run || !track.current || !viewport.current) return;
        ctx = gsap.context(() => {
          const dist = () => Math.max(0, track.current!.scrollWidth - viewport.current!.clientWidth);
          const tween = gsap.to(track.current, {
            x: () => (rtl ? dist() : -dist()),
            ease: 'none',
            scrollTrigger: {
              trigger: section.current,
              start: 'top top',
              end: () => `+=${Math.round(dist() / 2.2)}`,
              pin: true,
              scrub: 0.6,
              invalidateOnRefresh: true,
              anticipatePin: 1,
            },
          });
          const st = tween.scrollTrigger;
          if (st) trig.current = st;
        }, section);
      });
    };
    setup();
    mq.addEventListener('change', setup);
    return () => {
      cancelled = true;
      mq.removeEventListener('change', setup);
      ctx?.revert();
    };
  }, [rtl]);

  // keyboard users: bring a focused frame into view by scrolling the page to the matching pin progress
  const onFocus = (e: React.FocusEvent) => {
    const st = trig.current;
    const tr = track.current;
    const vp = viewport.current;
    if (!pinned || !st || !tr || !vp) return;
    const frame = (e.target as HTMLElement).closest('[data-frame]') as HTMLElement | null;
    if (!frame) return;
    // the browser scrolls the focused element into view after this event: correct it on the next frame
    requestAnimationFrame(() => {
      vp.scrollLeft = 0;
      const a = tr.getBoundingClientRect();
      const b = frame.getBoundingClientRect();
      const offset = rtl ? a.right - b.right : b.left - a.left;
      const dist = Math.max(1, tr.scrollWidth - vp.clientWidth);
      const p = Math.min(1, Math.max(0, (offset - vp.clientWidth * 0.3) / dist));
      window.scrollTo({ top: Math.round(st.start + p * (st.end - st.start)), behavior: 'instant' });
    });
  };

  const nudge = (dir: 1 | -1) => {
    const vp = viewport.current;
    if (!vp) return;
    vp.scrollBy({ left: dir * (rtl ? -1 : 1) * vp.clientWidth * 0.8, behavior: 'smooth' });
  };

  return (
    <div ref={section} className={cn('relative', pinned && 'flex min-h-dvh flex-col justify-center py-10')}>
      <div className="mx-auto mb-6 flex w-full max-w-[1320px] flex-wrap items-end justify-between gap-4 px-4 sm:px-6">
        <div>
          <p className="cin-kicker">{t('cinema.reelKicker')}</p>
          <h2 id="cin-reel" className="cin-display mt-1 text-[clamp(2.6rem,6vw,4.6rem)] leading-[0.9]">
            {t('cinema.reelTitle')}
          </h2>
          <p className="mt-2 text-[15px] text-[var(--c-muted)]">{t('cinema.reelSub', { count: projects.length })}</p>
        </div>
        <div className="flex items-center gap-2">
          <a href={`#${skipTo}`} className="rounded-full border border-[var(--c-line)] px-4 py-2 text-[13px] font-semibold hover:border-[var(--c-amber)]">
            {t('cinema.skipReel')}
          </a>
          {!pinned && (
            <>
              <button type="button" onClick={() => nudge(-1)} aria-label={t('common.previous')} className="grid size-10 place-items-center rounded-full border border-[var(--c-line)] hover:border-[var(--c-amber)]">
                <ChevronLeft className="flip-rtl size-5" aria-hidden />
              </button>
              <button type="button" onClick={() => nudge(1)} aria-label={t('common.next')} className="grid size-10 place-items-center rounded-full border border-[var(--c-line)] hover:border-[var(--c-amber)]">
                <ChevronRight className="flip-rtl size-5" aria-hidden />
              </button>
            </>
          )}
        </div>
      </div>
      <div
        ref={viewport}
        role="region"
        aria-labelledby="cin-reel"
        tabIndex={pinned ? -1 : 0}
        onFocusCapture={onFocus}
        className={cn('cin-reel relative', pinned ? 'overflow-hidden' : 'no-scrollbar snap-x snap-mandatory overflow-x-auto scroll-px-4 sm:scroll-px-6')}
      >
        <div ref={track} className="flex w-max flex-col gap-3 px-4 sm:px-6">
          {rows.map((row, r) => (
            <ol key={r} className="cin-strip flex w-max gap-3" start={r * half + 1}>
              {row.map((p, i) => {
                const n = r * half + i + 1;
                return (
                  <li key={p.id} data-frame className="cin-frame w-[300px] shrink-0 snap-start sm:w-[340px]">
                    <article className="flex h-full flex-col p-4">
                      <p className="cin-mono flex items-center justify-between text-[11.5px] text-[var(--c-amber)]">
                        <span>
                          #{fmtNum(loc, n, { minimumIntegerDigits: 2 })} · {t(`categories.${p.category}`)}
                        </span>
                        {p.featured ? null : <span className="text-[var(--c-muted)]">{t('cinema.archiveCut')}</span>}
                      </p>
                      <h3 className="mt-2 text-[17px] font-semibold leading-snug" dir="auto">
                        {p.url ? (
                          <a href={p.url} target="_blank" rel="noreferrer" className="hover:text-[var(--c-amber)]">
                            {p.title}
                          </a>
                        ) : (
                          p.title
                        )}
                        {p.metric && (
                          <bdi dir="ltr" className="ml-2 whitespace-nowrap text-[13px] font-bold text-[var(--c-amber)] rtl:ml-0 rtl:mr-2">
                            {p.metric}
                          </bdi>
                        )}
                      </h3>
                      <p className="mt-2 text-[13.5px] leading-relaxed text-[var(--c-muted)]" dir="auto">
                        {p.description}
                      </p>
                      <div className="mt-auto flex flex-wrap items-center gap-x-3 gap-y-1 pt-3">
                        {p.tags.length > 0 && (
                          <span className="cin-mono text-[11px] text-[#9d907e]" dir="ltr">
                            {p.tags.join(' · ')}
                          </span>
                        )}
                        {p.repo && (
                          <a href={p.url ?? `https://github.com/${p.repo}`} target="_blank" rel="noreferrer" className="ms-auto inline-flex items-center gap-1 text-[12.5px] font-semibold text-[var(--c-amber)] hover:underline">
                            <BrandIcon name="github" className="size-3.5" /> {t('common.code')}
                          </a>
                        )}
                        {!p.repo && p.url && (
                          <a href={p.url} target="_blank" rel="noreferrer" className="ms-auto inline-flex items-center gap-1 text-[12.5px] font-semibold text-[var(--c-amber)] hover:underline">
                            {t('common.visit')} <ArrowUpRight className="size-3.5" aria-hidden />
                          </a>
                        )}
                      </div>
                    </article>
                  </li>
                );
              })}
            </ol>
          ))}
        </div>
      </div>
      {!pinned && <p className="mx-auto mt-3 w-full max-w-[1320px] px-4 text-[12.5px] text-[var(--c-muted)] sm:px-6">{t('cinema.reelHint')}</p>}
    </div>
  );
}
