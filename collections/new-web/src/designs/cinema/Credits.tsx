'use client';

import { useEffect, useRef, useState } from 'react';
import { useTranslations } from 'next-intl';
import { Pause, Play, RotateCcw } from 'lucide-react';
import { fmtNum, fmtYear } from '@/lib/format';
import type { SiteData } from '@/lib/types';

/**
 * End credits: every skill category (incl. soft skills), all courses and the languages roll in a fixed
 * window. Auto-roll starts when the window is on screen, stops on any interaction, has Pause/Play
 * (WCAG 2.2.2), and stays a plain scrollable list under reduced motion.
 */
export function Credits({ data, reduce }: { data: SiteData; reduce: boolean }) {
  const t = useTranslations();
  const loc = data.locale;
  const box = useRef<HTMLDivElement>(null);
  const [playing, setPlaying] = useState(false);
  const [ended, setEnded] = useState(false);
  const started = useRef(false);
  const visible = useRef(false);

  // start once when it comes into view
  useEffect(() => {
    const el = box.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([e]) => {
        visible.current = e.isIntersecting;
        if (e.isIntersecting && !started.current && !reduce) {
          started.current = true;
          setPlaying(true);
        }
      },
      { threshold: 0.4 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [reduce]);

  useEffect(() => {
    if (!playing) return;
    let raf = 0;
    let last = performance.now();
    let acc = 0;
    const step = (now: number) => {
      const el = box.current;
      if (!el) return;
      const dt = Math.min(64, now - last);
      last = now;
      if (visible.current && !document.hidden) {
        acc += dt * 0.035;
        if (acc >= 1) {
          const px = Math.floor(acc);
          acc -= px;
          el.scrollTop += px;
        }
        if (el.scrollTop + el.clientHeight >= el.scrollHeight - 1) {
          setPlaying(false);
          setEnded(true);
          return;
        }
      }
      raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [playing]);

  const stop = () => playing && setPlaying(false);
  const credit = 'grid grid-cols-[minmax(0,1fr)_minmax(0,1.25fr)] gap-x-6 py-1.5 text-[14.5px]';

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={() => {
            if (ended) {
              box.current?.scrollTo({ top: 0 });
              setEnded(false);
              setPlaying(true);
            } else setPlaying((v) => !v);
          }}
          aria-pressed={playing}
          className="inline-flex items-center gap-2 rounded-full border border-[var(--c-amber)] px-4 py-2 text-[13.5px] font-semibold text-[var(--c-amber)] hover:bg-[var(--c-amber)] hover:text-[#0b0a09]"
        >
          {ended ? <RotateCcw className="size-4" aria-hidden /> : playing ? <Pause className="size-4" aria-hidden /> : <Play className="size-4" aria-hidden />}
          {ended ? t('cinema.replay') : playing ? t('common.pause') : t('common.play')}
        </button>
        <p className="text-[13px] text-[var(--c-muted)]">{t('cinema.creditsHint')}</p>
      </div>
      <div
        ref={box}
        tabIndex={0}
        role="region"
        aria-label={t('cinema.creditsTitle')}
        onWheel={stop}
        onPointerDown={stop}
        onTouchStart={stop}
        onKeyDown={stop}
        className="cin-credits relative h-[72vh] min-h-[420px] overflow-y-auto rounded-[14px] border border-[var(--c-line)] bg-black px-5 sm:px-10"
      >
        <div className="mx-auto max-w-3xl pb-[40vh] pt-[30vh] text-center">
          <p className="cin-kicker">{t('cinema.creditsKicker')}</p>
          <p className="cin-display mt-2 text-[clamp(2.4rem,5vw,3.6rem)] leading-none">{data.person.displayName}</p>

          {data.skills.map((c) => (
            <section key={c.id} className="mt-16">
              <h3 className="cin-display text-[24px] tracking-[0.06em] text-[var(--c-amber)] rtl:tracking-normal">{c.label}</h3>
              <dl className="mt-3">
                {c.groups.map((g) => (
                  <div key={g.id} className={credit}>
                    <dt className="text-end text-[var(--c-muted)]">{c.groups.length > 1 || g.label !== c.label ? g.label : t('cinema.creditsSkills')}</dt>
                    <dd className="text-start">
                      {g.items.map((it, i) => (
                        <span key={it.key}>
                          {i > 0 && <span className="text-[var(--c-muted)]"> · </span>}
                          <bdi title={it.long !== it.name ? it.long : undefined}>{it.name}</bdi>
                        </span>
                      ))}
                    </dd>
                  </div>
                ))}
              </dl>
            </section>
          ))}

          <section className="mt-16">
            <h3 className="cin-display text-[24px] tracking-[0.06em] text-[var(--c-amber)] rtl:tracking-normal">{t('cinema.creditsTraining')}</h3>
            <dl className="mt-3">
              {data.certifications.map((c) => (
                <div key={c.name + c.issuer} className={credit}>
                  <dt className="text-end text-[var(--c-muted)]">
                    <bdi>{c.issuer}</bdi>
                    {c.year ? ` · ${fmtYear(loc, c.year)}` : ''}
                  </dt>
                  <dd className="text-start">
                    <bdi lang="en">{c.name}</bdi>
                    {c.hours ? <span className="text-[var(--c-muted)]"> · {t('common.hours', { count: fmtNum(loc, c.hours) })}</span> : null}
                  </dd>
                </div>
              ))}
            </dl>
          </section>

          <section className="mt-16">
            <h3 className="cin-display text-[24px] tracking-[0.06em] text-[var(--c-amber)] rtl:tracking-normal">{t('sections.languages.title')}</h3>
            <dl className="mt-3">
              {data.languages.map((l) => (
                <div key={l.id} className={credit}>
                  <dt className="text-end text-[var(--c-muted)]">{l.name}</dt>
                  <dd className="text-start">
                    {l.level}
                    {l.cert ? ` · ${l.cert.test} ${fmtNum(loc, l.cert.overall, { minimumFractionDigits: 1 })}` : ''}
                  </dd>
                </div>
              ))}
            </dl>
          </section>

          <section className="mt-16">
            <h3 className="cin-display text-[24px] tracking-[0.06em] text-[var(--c-amber)] rtl:tracking-normal">{t('cinema.creditsLocations')}</h3>
            <p className="mt-3 text-[15px]">{data.journey.map((j) => j.city).join(' · ')}</p>
          </section>

          <p className="cin-display mt-24 text-[30px] text-[var(--c-amber)]">{t('cinema.theEnd')}</p>
        </div>
      </div>
    </div>
  );
}
