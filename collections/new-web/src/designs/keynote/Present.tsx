'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { useTranslations } from 'next-intl';
import { fmtNum } from '@/lib/format';
import type { SiteData } from '@/lib/types';
import { cn } from '@/lib/utils';
import { notesFor, SlideView } from './Slide';
import { CHAPTERS, chapterStarts, type Slide } from './slides';

const STAGE_W = 1280;
const STAGE_H = 720;

/**
 * Present mode: a modal stage that scales a 1280 × 720 slide to the window. Keys: ← → Space PageUp/Down
 * Home End (mirrored in RTL), O overview, N notes, T timer, F fullscreen, Esc exit; swipe on touch.
 * The current slide lives in the URL hash (#/12) so a reload returns to it.
 */
export function Present({ deck, data, start, onClose, reduce }: { deck: Slide[]; data: SiteData; start: number; onClose: () => void; reduce: boolean }) {
  const t = useTranslations();
  const loc = data.locale;
  const rtl = loc === 'fa';
  const [i, setI] = useState(start);
  const [dir, setDir] = useState(1);
  const [overview, setOverview] = useState(false);
  const [notes, setNotes] = useState(false);
  const [timer, setTimer] = useState<number | null>(null);
  const [now, setNow] = useState(0);
  const [scale, setScale] = useState(1);
  const root = useRef<HTMLDivElement>(null);
  const stage = useRef<HTMLDivElement>(null);
  const touch = useRef<number | null>(null);
  const total = deck.length;
  const starts = chapterStarts(deck);

  const go = useCallback(
    (n: number) => {
      const k = Math.max(0, Math.min(total - 1, n));
      setDir(k >= i ? 1 : -1);
      setI(k);
    },
    [i, total],
  );

  // hash + focus
  useEffect(() => {
    history.replaceState(null, '', `#/${i + 1}`);
  }, [i]);
  useEffect(() => {
    root.current?.focus();
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, []);

  // scale the stage to the window
  useEffect(() => {
    const fit = () => {
      const w = window.innerWidth;
      const h = window.innerHeight - (notes ? 150 : 64);
      setScale(Math.min(w / STAGE_W, h / STAGE_H) * 0.96);
    };
    fit();
    window.addEventListener('resize', fit);
    return () => window.removeEventListener('resize', fit);
  }, [notes]);

  // timer
  useEffect(() => {
    if (timer === null) return;
    const id = window.setInterval(() => setNow(Date.now()), 1000);
    setNow(Date.now());
    return () => window.clearInterval(id);
  }, [timer]);

  const onKey = (e: React.KeyboardEvent) => {
    const next = rtl ? 'ArrowLeft' : 'ArrowRight';
    const prev = rtl ? 'ArrowRight' : 'ArrowLeft';
    const k = e.key;
    if (k === 'Escape') {
      e.preventDefault();
      if (overview) setOverview(false);
      else onClose();
      return;
    }
    if (k === 'Tab') {
      // keep focus inside the deck
      const f = [...(root.current?.querySelectorAll<HTMLElement>('button, a[href], [tabindex="0"]') ?? [])].filter((x) => x.offsetParent !== null);
      if (!f.length) return;
      const a = document.activeElement;
      if (e.shiftKey && (a === f[0] || a === root.current)) {
        e.preventDefault();
        f[f.length - 1].focus();
      } else if (!e.shiftKey && a === f[f.length - 1]) {
        e.preventDefault();
        f[0].focus();
      }
      return;
    }
    if ((e.target as HTMLElement).closest('input, textarea')) return;
    const map: Record<string, () => void> = {
      [next]: () => go(i + 1),
      [prev]: () => go(i - 1),
      ' ': () => go(i + (e.shiftKey ? -1 : 1)),
      PageDown: () => go(i + 1),
      PageUp: () => go(i - 1),
      Home: () => go(0),
      End: () => go(total - 1),
      o: () => setOverview((v) => !v),
      O: () => setOverview((v) => !v),
      n: () => setNotes((v) => !v),
      N: () => setNotes((v) => !v),
      t: () => setTimer((v) => (v === null ? Date.now() : null)),
      T: () => setTimer((v) => (v === null ? Date.now() : null)),
      f: () => (document.fullscreenElement ? document.exitFullscreen() : root.current?.requestFullscreen?.())?.catch?.(() => {}),
      F: () => (document.fullscreenElement ? document.exitFullscreen() : root.current?.requestFullscreen?.())?.catch?.(() => {}),
    };
    if (map[k] && !(k === ' ' && (e.target as HTMLElement).closest('button, a'))) {
      e.preventDefault();
      map[k]();
    }
  };

  const slide = deck[i];
  const elapsed = timer === null ? 0 : Math.max(0, Math.floor((now - timer) / 1000));
  const mmss = `${fmtNum(loc, Math.floor(elapsed / 60)).padStart(2, loc === 'fa' ? '۰' : '0')}:${fmtNum(loc, elapsed % 60).padStart(2, loc === 'fa' ? '۰' : '0')}`;

  return (
    <div ref={root} role="dialog" aria-modal="true" aria-label={t('keynote.presentLabel')} tabIndex={-1} onKeyDown={onKey} className="kn-present fixed inset-0 z-[120] flex flex-col outline-none">
      {/* top bar */}
      <div className="flex h-12 shrink-0 items-center gap-3 px-4 text-[13px]">
        <span className="kn-mono" dir="ltr" aria-live="polite">
          {fmtNum(loc, i + 1)} / {fmtNum(loc, total)}
        </span>
        <span className="hidden truncate text-[var(--kn-muted)] sm:inline">{t(`keynote.chapters.${slide.chapter}`)}</span>
        {timer !== null && (
          <span className="kn-mono rounded bg-white/10 px-2 py-0.5" dir="ltr">
            {mmss}
          </span>
        )}
        <div className="ms-auto flex items-center gap-1">
          <button type="button" className="kn-tool" aria-pressed={overview} onClick={() => setOverview((v) => !v)}>
            {t('keynote.overview')} <kbd>O</kbd>
          </button>
          <button type="button" className="kn-tool" aria-pressed={notes} onClick={() => setNotes((v) => !v)}>
            {t('keynote.notes')} <kbd>N</kbd>
          </button>
          <button type="button" className="kn-tool hidden sm:inline-flex" aria-pressed={timer !== null} onClick={() => setTimer((v) => (v === null ? Date.now() : null))}>
            {t('keynote.timer')} <kbd>T</kbd>
          </button>
          <button type="button" className="kn-tool" onClick={onClose}>
            {t('keynote.exit')} <kbd>Esc</kbd>
          </button>
        </div>
      </div>

      {/* progress with chapter marks */}
      <div className="relative mx-4 h-1.5 shrink-0 rounded-full bg-white/10" aria-hidden>
        <div className="kn-progress absolute inset-y-0 start-0 rounded-full" style={{ width: `${((i + 1) / total) * 100}%` }} />
        {CHAPTERS.map((c) => (
          <span key={c} className="absolute top-1/2 h-3 w-[2px] -translate-y-1/2 bg-white/40" style={{ insetInlineStart: `${((starts.get(c) ?? 0) / total) * 100}%` }} />
        ))}
      </div>

      {/* stage */}
      <div
        className="relative flex min-h-0 flex-1 items-center justify-center overflow-hidden"
        onPointerDown={(e) => (touch.current = e.pointerType === 'mouse' ? null : e.clientX)}
        onPointerUp={(e) => {
          if (touch.current === null) return;
          const dx = e.clientX - touch.current;
          touch.current = null;
          if (Math.abs(dx) < 50) return;
          const forward = rtl ? dx > 0 : dx < 0;
          go(i + (forward ? 1 : -1));
        }}
      >
        <div ref={stage} style={{ width: STAGE_W, height: STAGE_H, transform: `scale(${scale})` }} className="relative shrink-0">
          <AnimatePresence initial={false} custom={dir} mode="popLayout">
            <motion.div
              key={i}
              custom={dir}
              initial={reduce ? false : { opacity: 0, x: (rtl ? -1 : 1) * dir * 60 }}
              animate={{ opacity: 1, x: 0 }}
              exit={reduce ? { opacity: 0, transition: { duration: 0 } } : { opacity: 0, x: (rtl ? 1 : -1) * dir * 60 }}
              transition={{ duration: reduce ? 0 : 0.35, ease: [0.22, 1, 0.36, 1] }}
              className="absolute inset-0"
            >
              <SlideView slide={slide} n={i} total={total} data={data} deck={deck} present onJump={go} />
            </motion.div>
          </AnimatePresence>
        </div>
        <button type="button" onClick={() => go(i - 1)} disabled={i === 0} aria-label={t('common.previous')} className="kn-nav start-2">
          <span aria-hidden className="inline-block">
            ‹
          </span>
        </button>
        <button type="button" onClick={() => go(i + 1)} disabled={i === total - 1} aria-label={t('common.next')} className="kn-nav end-2">
          <span aria-hidden className="inline-block">
            ›
          </span>
        </button>
      </div>

      {/* notes */}
      {notes && (
        <div className="kn-notes h-[86px] shrink-0 overflow-y-auto px-6 py-3 text-[14px]">
          <p className="kn-mono mb-1 text-[11px] uppercase text-[var(--kn-muted)] rtl:normal-case">{t('keynote.notes')}</p>
          <ul className="space-y-0.5">
            {notesFor(slide, data, t).map((x, k) => (
              <li key={k}>{x}</li>
            ))}
          </ul>
        </div>
      )}

      {/* overview grid */}
      {overview && (
        <div className="kn-overview absolute inset-0 z-10 overflow-y-auto p-6" role="region" aria-label={t('keynote.overview')}>
          <div className="mb-4 flex items-center justify-between">
            <p className="text-[18px] font-semibold">{t('keynote.overview')}</p>
            <button type="button" className="kn-tool" onClick={() => setOverview(false)}>
              {t('common.close')} <kbd>Esc</kbd>
            </button>
          </div>
          <ol className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-6">
            {deck.map((s, k) => (
              <li key={k}>
                <button
                  type="button"
                  aria-current={k === i ? 'true' : undefined}
                  onClick={() => {
                    go(k);
                    setOverview(false);
                    root.current?.focus();
                  }}
                  className={cn('kn-thumb w-full text-start', k === i && 'kn-thumb-on')}
                >
                  <span className="kn-mono text-[11px] text-[var(--kn-muted)]" dir="ltr">
                    {fmtNum(loc, k + 1)}
                  </span>
                  <span className="block text-[11.5px] text-[var(--kn-accent2)]">{t(`keynote.chapters.${s.chapter}`)}</span>
                  <span className="mt-1 line-clamp-2 block text-[13px] font-semibold leading-snug">{thumbTitle(s, data, t)}</span>
                </button>
              </li>
            ))}
          </ol>
        </div>
      )}
    </div>
  );
}

function thumbTitle(s: Slide, data: SiteData, t: ReturnType<typeof useTranslations>) {
  switch (s.kind) {
    case 'title':
      return data.person.displayName;
    case 'education':
      return s.item.degree;
    case 'role':
      return s.item.role;
    case 'project':
      return s.item.title;
    case 'grid':
      return s.archive ? t('keynote.archiveTitle') : t('keynote.moreTitle');
    case 'skills':
      return data.skills.find((c) => c.id === s.categoryId)?.label ?? '';
    case 'about':
      return s.part === 0 ? t('keynote.aboutTitle') : t('keynote.aboutTitle2');
    case 'courses':
      return t('sections.certifications.title');
    default:
      return t(`keynote.thumbs.${s.kind}`);
  }
}
