'use client';

import { useEffect, useId, useRef, useState } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import { ChevronLeft, ChevronRight, ChevronsUpDown, LayoutGrid, LockKeyhole, Minimize2, Palette } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';
// Design links never prefetch: a prefetched design would preload its own fonts and CSS into this page.
import { designFamilies, designFamily, designIds, designMeta, type DesignId } from '@/lib/designs';
import { cn } from '@/lib/utils';
import { adjacentTemplate, readPreferences, templateCycle, templateHref, withPreferences } from '../../../../../public/portfolio/design-navigation.js';
import { useLocaleSwitch } from './useLocaleSwitch';

/**
 * Floating "design explorer" shown on every design page: previous/next design,
 * a picker with every ready design (grouped by family) and the language switch. Remove it from the
 * design pages once a final design is chosen.
 */
export function DesignDock({ current, onLock }: { current: DesignId; onLock: () => void }) {
  const t = useTranslations();
  const { locale, locales, switchTo, pending } = useLocaleSwitch();
  const reducedMotion = useReducedMotion();
  const [open, setOpen] = useState(false);
  const [hidden, setHidden] = useState(false);
  const dockRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const showRef = useRef<HTMLButtonElement>(null);
  const visibilityChanged = useRef(false);
  const panelId = useId();
  const cycle = templateCycle(designIds);
  const compactMobile = ['microcosm', 'flowcell', 'cellscape', 'foldspace'].includes(current);
  const currentTemplate = { collection: 'imported' as const, id: current };
  const idx = cycle.findIndex(entry => entry.collection === 'imported' && entry.id === current);
  const preferences = readPreferences(typeof window === 'undefined' ? '' : window.location.search);

  function step(direction: -1 | 1, Icon: typeof ChevronLeft, label: string) {
    const destination = adjacentTemplate(cycle, currentTemplate, direction);
    if (!destination) return null;
    const props = {
      'aria-label': label,
      className: 'grid size-11 shrink-0 place-items-center rounded-full transition-colors hover:bg-white/10 motion-reduce:transition-none sm:size-9',
      children: <Icon aria-hidden="true" className="flip-rtl size-4" />,
    };
    return destination.collection === 'imported'
      ? <Link href={withPreferences(`/${destination.id}`, preferences)} prefetch={false} {...props} />
      : <a href={templateHref(destination, locale, preferences)} {...props} />;
  }

  useEffect(() => {
    if (!open) return;
    const panel = panelRef.current;
    const selected = panel?.querySelector<HTMLElement>('[aria-current="page"]')
      ?? panel?.querySelector<HTMLElement>('a, button');
    (selected ?? panel)?.focus({ preventScroll: true });
    selected?.scrollIntoView({ block: 'nearest' });
    const dismissOutside = (e: Event) => {
      if (!dockRef.current?.contains(e.target as Node)) setOpen(false);
    };
    window.addEventListener('pointerdown', dismissOutside);
    window.addEventListener('focusin', dismissOutside);
    return () => {
      window.removeEventListener('pointerdown', dismissOutside);
      window.removeEventListener('focusin', dismissOutside);
    };
  }, [open]);

  useEffect(() => {
    if (visibilityChanged.current) (hidden ? showRef : triggerRef).current?.focus({ preventScroll: true });
  }, [hidden]);

  const glass = 'border border-white/12 bg-neutral-950/70 text-white shadow-[0_20px_60px_-20px_rgba(0,0,0,0.6)] backdrop-blur-xl';

  if (hidden) {
    return (
      <button
        ref={showRef}
        type="button"
        data-dock=""
        onClick={() => { visibilityChanged.current = true; setHidden(false); }}
        aria-label={t('dock.show')}
        className={cn('fixed bottom-[calc(1rem+env(safe-area-inset-bottom))] end-[max(1rem,env(safe-area-inset-left),env(safe-area-inset-right))] z-[100] grid size-11 place-items-center rounded-full transition-colors hover:bg-neutral-800 motion-reduce:transition-none print:hidden', glass)}
      >
        <Palette aria-hidden="true" className="size-5" />
      </button>
    );
  }

  return (
    <div
      ref={dockRef}
      data-dock=""
      onKeyDown={(event) => {
        if (!open || event.key !== 'Escape') return;
        event.preventDefault();
        event.stopPropagation();
        setOpen(false);
        triggerRef.current?.focus({ preventScroll: true });
      }}
      className="pointer-events-none fixed inset-x-0 bottom-[calc(1rem+env(safe-area-inset-bottom))] z-[100] flex justify-center px-[max(.75rem,env(safe-area-inset-left),env(safe-area-inset-right))] print:hidden"
    >
      <div className="pointer-events-auto relative w-full max-w-sm sm:w-auto sm:max-w-full">
        <AnimatePresence>
          {open && (
            <motion.div
              ref={panelRef}
              id={panelId}
              role="region"
              aria-label={t('dock.designs')}
              tabIndex={-1}
              initial={reducedMotion ? false : { opacity: 0, y: 12, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={reducedMotion ? { opacity: 0 } : { opacity: 0, y: 8, scale: 0.98 }}
              transition={{ duration: reducedMotion ? 0 : 0.22, ease: [0.16, 1, 0.3, 1] }}
              className={cn(
                'absolute bottom-[calc(100%+10px)] start-1/2 max-h-[min(65svh,calc(100svh-9rem-env(safe-area-inset-bottom)),34rem)] w-[min(calc(100vw-2rem),36rem)] -translate-x-1/2 overflow-y-auto overscroll-contain rounded-3xl p-2 rtl:translate-x-1/2',
                glass,
              )}
            >
              <div className="mb-1 flex flex-wrap items-center justify-between gap-1 border-b border-white/10 px-1 pb-1">
                <a href={withPreferences(`/?gallery=1&lang=${locale}`, preferences)} className="flex items-center gap-3 rounded-2xl px-3 py-2.5 text-sm text-white/80 transition hover:bg-white/10">
                  <LayoutGrid aria-hidden="true" className="size-4" /> {t('access.gallery')}
                </a>
                <button type="button" onClick={onLock} className="flex items-center gap-2 rounded-2xl px-3 py-2.5 text-sm text-white/80 transition hover:bg-white/10">
                  <LockKeyhole aria-hidden="true" className="size-4" /> {t('access.lock')}
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
                              href={withPreferences(`/${id}`, preferences)}
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
          initial={reducedMotion ? false : { y: 12, opacity: 1 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: reducedMotion ? 0 : 0.3, ease: [0.16, 1, 0.3, 1] }}
          className={cn(
            'flex max-w-full flex-wrap items-center gap-1 rounded-3xl p-1.5 sm:flex-nowrap sm:rounded-full',
            compactMobile && 'flex-nowrap rounded-full p-1 sm:p-1.5',
            glass,
          )}
        >
          {step(-1, ChevronLeft, t('dock.previous'))}
          <button
            ref={triggerRef}
            type="button"
            onClick={() => setOpen((v) => !v)}
            aria-expanded={open}
            aria-controls={panelId}
            aria-label={`${t('dock.designs')}: ${t(`designs.${current}.name`)}`}
            className="flex h-11 min-w-0 flex-1 items-center justify-center gap-2 rounded-full px-3 text-sm transition-colors hover:bg-white/10 motion-reduce:transition-none sm:h-9 sm:flex-none"
          >
            <span aria-hidden="true" className="size-2.5 shrink-0 rounded-full" style={{ background: designMeta[current].accent }} />
            <span className="truncate font-medium">{t(`designs.${current}.name`)}</span>
            <span className="hidden font-mono text-[11px] text-white/50 sm:inline" lang="en" dir="ltr">
              {idx + 1}/{cycle.length}
            </span>
            <ChevronsUpDown aria-hidden="true" className="size-3.5 shrink-0 text-white/60" />
          </button>
          {step(1, ChevronRight, t('dock.next'))}
          <span className="mx-1 hidden h-5 w-px bg-white/15 sm:block" aria-hidden />
          <div
            role="group"
            aria-label={t('dock.language')}
            aria-busy={pending}
            className={cn('order-last flex w-full items-center justify-center sm:order-none sm:w-auto', compactMobile && 'hidden sm:flex')}
          >
            {locales.map((l) => (
              <button
                key={l.code}
                type="button"
                lang={l.code}
                aria-label={l.native}
                title={l.native}
                aria-pressed={l.code === locale}
                disabled={pending}
                onClick={() => switchTo(l.code)}
                className={cn(
                  'h-11 min-w-11 rounded-full px-2 text-xs font-medium transition-colors disabled:cursor-wait disabled:opacity-60 motion-reduce:transition-none sm:h-9 sm:min-w-9',
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
            onClick={() => { visibilityChanged.current = true; setOpen(false); setHidden(true); }}
            aria-label={t('dock.hide')}
            className="grid size-11 shrink-0 place-items-center rounded-full text-white/60 transition-colors hover:bg-white/10 hover:text-white motion-reduce:transition-none sm:size-9"
          >
            <Minimize2 aria-hidden="true" className="size-4" />
          </button>
        </motion.div>
        <span role="status" className="sr-only">{pending ? t('dock.switchingLanguage') : ''}</span>
      </div>
    </div>
  );
}
