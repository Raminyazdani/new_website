'use client';

import { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { ChevronLeft, ChevronRight, ChevronsUpDown, LayoutGrid, LockKeyhole, Minimize2, Palette } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';
// Design links never prefetch: a prefetched design would preload its own fonts and CSS into this page.
import { designFamilies, designFamily, designIds, designMeta, type DesignId } from '@/lib/designs';
import { cn } from '@/lib/utils';
import { useLocaleSwitch } from './useLocaleSwitch';

/**
 * Floating "design explorer" shown on every design page: previous/next design,
 * a picker with every ready design (grouped by family) and the language switch. Remove it from the
 * design pages once a final design is chosen.
 */
export function DesignDock({ current, onLock }: { current: DesignId; onLock: () => void }) {
  const t = useTranslations();
  const { locale, locales, switchTo } = useLocaleSwitch();
  const [open, setOpen] = useState(false);
  const [hidden, setHidden] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);
  // a design that is still being built (not "ready" in designs.json) joins the cycle at the end
  const cycle = designIds.includes(current) ? designIds : [...designIds, current];
  const idx = cycle.indexOf(current);
  const prev = cycle[(idx - 1 + cycle.length) % cycle.length];
  const next = cycle[(idx + 1) % cycle.length];

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (!panelRef.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false);
    window.addEventListener('mousedown', onDown);
    window.addEventListener('keydown', onKey);
    return () => {
      window.removeEventListener('mousedown', onDown);
      window.removeEventListener('keydown', onKey);
    };
  }, [open]);

  const glass = 'border border-white/12 bg-neutral-950/70 text-white shadow-[0_20px_60px_-20px_rgba(0,0,0,0.6)] backdrop-blur-xl';

  if (hidden) {
    return (
      <button
        type="button"
        data-dock=""
        onClick={() => setHidden(false)}
        aria-label={t('dock.show')}
        className={cn('fixed bottom-4 end-4 z-[100] grid size-11 place-items-center rounded-full print:hidden', glass)}
      >
        <Palette className="size-5" />
      </button>
    );
  }

  return (
    <div ref={panelRef} data-dock="" className="pointer-events-none fixed inset-x-0 bottom-4 z-[100] flex justify-center px-3 print:hidden">
      <div className="pointer-events-auto relative">
        <AnimatePresence>
          {open && (
            <motion.div
              initial={{ opacity: 0, y: 12, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 8, scale: 0.98 }}
              transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
              className={cn(
                'absolute bottom-[calc(100%+10px)] start-1/2 max-h-[min(70vh,34rem)] w-[min(94vw,36rem)] -translate-x-1/2 overflow-y-auto overscroll-contain rounded-3xl p-2 rtl:translate-x-1/2',
                glass,
              )}
            >
              <div className="mb-1 flex flex-wrap items-center justify-between gap-1 border-b border-white/10 px-1 pb-1">
                <a href={`/?gallery=1&lang=${locale}`} className="flex items-center gap-3 rounded-2xl px-3 py-2.5 text-sm text-white/80 transition hover:bg-white/10">
                  <LayoutGrid className="size-4" /> {t('access.gallery')}
                </a>
                <button type="button" onClick={onLock} className="flex items-center gap-2 rounded-2xl px-3 py-2.5 text-sm text-white/80 transition hover:bg-white/10">
                  <LockKeyhole className="size-4" /> {t('access.lock')}
                </button>
              </div>
              {designFamilies.map((family) => {
                const ids = designIds.filter((id) => designFamily(id) === family);
                if (!ids.length) return null;
                return (
                  <section key={family} aria-labelledby={`dock-fam-${family}`} className="px-1 pb-1 pt-2">
                    <h2 id={`dock-fam-${family}`} className="px-2 pb-1 text-[11px] font-medium uppercase tracking-[0.18em] text-white/45 rtl:tracking-normal">
                      {t(`gallery.families.${family}`)}
                    </h2>
                    <ul className="grid gap-0.5 sm:grid-cols-2">
                      {ids.map((id) => {
                        const m = designMeta[id];
                        const n = designIds.indexOf(id) + 1;
                        return (
                          <li key={id}>
                            <Link
                              href={`/${id}`}
                              prefetch={false}
                              onClick={() => setOpen(false)}
                              aria-current={id === current ? 'page' : undefined}
                              className={cn('flex items-center gap-3 rounded-2xl px-3 py-2 transition hover:bg-white/10', id === current && 'bg-white/10')}
                            >
                              <span className="flex -space-x-1 rtl:space-x-reverse" aria-hidden>
                                {m.swatches.slice(0, 3).map((c) => (
                                  <span key={c} className="size-3.5 rounded-full ring-2 ring-neutral-900" style={{ background: c }} />
                                ))}
                              </span>
                              <span className="min-w-0 flex-1">
                                <span className="block truncate text-sm font-medium">
                                  <span className="mr-2 font-mono text-[11px] text-white/45 rtl:ml-2 rtl:mr-0" lang="en" dir="ltr">
                                    {String(n).padStart(2, '0')}
                                  </span>
                                  {t(`designs.${id}.name`)}
                                </span>
                                <span className="block truncate text-xs text-white/55">{t(`designs.${id}.style`)}</span>
                              </span>
                            </Link>
                          </li>
                        );
                      })}
                    </ul>
                  </section>
                );
              })}
            </motion.div>
          )}
        </AnimatePresence>

        <motion.div
          initial={{ y: 40, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.8, duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          className={cn('flex items-center gap-1 rounded-full p-1.5', glass)}
        >
          <Link href={`/${prev}`} prefetch={false} aria-label={t('dock.previous')} className="grid size-9 place-items-center rounded-full transition hover:bg-white/10">
            <ChevronLeft className="flip-rtl size-4" />
          </Link>
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            aria-expanded={open}
            aria-label={t('dock.designs')}
            className="flex h-9 items-center gap-2 rounded-full px-3 text-sm transition hover:bg-white/10"
          >
            <span className="size-2.5 rounded-full" style={{ background: designMeta[current].accent }} />
            <span className="font-medium">{t(`designs.${current}.name`)}</span>
            <span className="hidden font-mono text-[11px] text-white/50 sm:inline" lang="en" dir="ltr">
              {idx + 1}/{cycle.length}
            </span>
            <ChevronsUpDown className="size-3.5 text-white/60" />
          </button>
          <Link href={`/${next}`} prefetch={false} aria-label={t('dock.next')} className="grid size-9 place-items-center rounded-full transition hover:bg-white/10">
            <ChevronRight className="flip-rtl size-4" />
          </Link>
          <span className="mx-1 h-5 w-px bg-white/15" aria-hidden />
          <div role="group" aria-label={t('dock.language')} className="flex items-center">
            {locales.map((l) => (
              <button
                key={l.code}
                type="button"
                lang={l.code}
                aria-pressed={l.code === locale}
                onClick={() => switchTo(l.code)}
                className={cn(
                  'h-9 min-w-9 rounded-full px-2 text-xs font-medium transition',
                  l.code === locale ? 'bg-white text-neutral-900' : 'text-white/70 hover:bg-white/10 hover:text-white',
                )}
              >
                {l.short}
              </button>
            ))}
          </div>
          <span className="mx-1 hidden h-5 w-px bg-white/15 sm:block" aria-hidden />
          <button
            type="button"
            onClick={() => setHidden(true)}
            aria-label={t('dock.hide')}
            className="hidden size-9 place-items-center rounded-full text-white/60 transition hover:bg-white/10 hover:text-white sm:grid"
          >
            <Minimize2 className="size-4" />
          </button>
        </motion.div>
      </div>
    </div>
  );
}
