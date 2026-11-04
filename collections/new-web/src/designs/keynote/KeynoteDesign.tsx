'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useReducedMotion } from 'motion/react';
import { useTranslations } from 'next-intl';
import { Moon, Play, Printer, Sun } from 'lucide-react';
import { LocaleSwitcher } from '@/components/shared/LocaleSwitcher';
import { fmtNum, fmtYear } from '@/lib/format';
import type { SiteData } from '@/lib/types';
import { Present } from './Present';
import { SlideView } from './Slide';
import { buildDeck } from './slides';
import './keynote.css';

type Theme = 'dark' | 'light';

export default function KeynoteDesign({ data }: { data: SiteData }) {
  const t = useTranslations();
  const loc = data.locale;
  const deck = useMemo(() => buildDeck(data), [data]);
  const rm = useReducedMotion();
  const [mounted, setMounted] = useState(false);
  const reduce = mounted ? !!rm : true;
  const [present, setPresent] = useState<number | null>(null);
  const [theme, setTheme] = useState<Theme>('dark');
  const opener = useRef<HTMLButtonElement>(null);
  const back = useRef<HTMLElement | null>(null);
  const presenting = present !== null;
  const open = (n: number) => {
    back.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    setPresent(n);
  };

  useEffect(() => {
    setMounted(true);
    try {
      const saved = localStorage.getItem('kn-theme');
      if (saved === 'light' || saved === 'dark') setTheme(saved);
    } catch {
      /* storage unavailable: keep dark */
    }
    // deep link: #/12 opens present mode on slide 12 (on load, or when the hash is changed by hand)
    const fromHash = () => {
      const m = /^#\/(\d+)$/.exec(location.hash);
      if (!m) return;
      back.current = null; // focus returns to the header button
      setPresent((v) => (v === null ? Math.max(0, Math.min(deck.length - 1, Number(m[1]) - 1)) : v));
    };
    fromHash();
    window.addEventListener('hashchange', fromHash);
    return () => window.removeEventListener('hashchange', fromHash);
  }, [deck.length]);

  const toggleTheme = () =>
    setTheme((v) => {
      const n = v === 'dark' ? 'light' : 'dark';
      try {
        localStorage.setItem('kn-theme', n);
      } catch {
        /* ignore */
      }
      return n;
    });

  const close = useCallback(() => {
    setPresent(null);
    history.replaceState(null, '', location.pathname + location.search);
    // back to the button that opened the deck (or the header button after a deep link)
    requestAnimationFrame(() => {
      const el = back.current && document.contains(back.current) ? back.current : opener.current;
      el?.focus({ preventScroll: true });
    });
  }, []);

  return (
    <div className="kn-root min-h-dvh" data-kn-theme={theme}>
      <header className="kn-header sticky top-0 z-40 print:hidden" inert={presenting}>
        <div className="mx-auto flex h-14 max-w-[1240px] items-center gap-3 px-4 sm:px-6">
          <a href="#slide-1" className="kn-brand shrink-0 text-[15px] font-semibold">
            {t('keynote.brand')}
          </a>
          <span className="kn-mono hidden text-[12px] text-[var(--kn-muted)] md:inline">{t('keynote.count', { count: deck.length })}</span>
          <div className="ms-auto flex min-w-0 items-center gap-1.5 sm:gap-2">
            <button
              ref={opener}
              type="button"
              onClick={() => open(0)}
              aria-label={t('keynote.present')}
              className="kn-btn kn-btn-solid inline-flex items-center gap-2 !px-3 text-[13.5px] sm:!px-4"
            >
              <Play className="flip-rtl size-3.5" aria-hidden /> <span className="hidden sm:inline">{t('keynote.present')}</span>
            </button>
            <button type="button" onClick={toggleTheme} aria-pressed={theme === 'light'} aria-label={t('keynote.lightSlides')} title={t('keynote.lightSlides')} className="kn-icon !size-9">
              {theme === 'dark' ? <Sun className="size-4" aria-hidden /> : <Moon className="size-4" aria-hidden />}
            </button>
            <button type="button" onClick={() => window.print()} aria-label={t('common.print')} title={t('common.print')} className="kn-icon hidden !size-9 sm:grid">
              <Printer className="size-4" aria-hidden />
            </button>
            <LocaleSwitcher
              className="rounded-full border border-[var(--kn-line)] p-0.5"
              itemClassName="h-7 min-w-8 rounded-full px-2 text-xs"
              activeClassName="bg-[var(--kn-ink)] text-[var(--kn-stage)]"
            />
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-[1240px] px-3 pb-28 pt-8 sm:px-6" inert={presenting} data-presenting={presenting ? '' : undefined}>
        <div className="mb-8 print:hidden">
          <p className="max-w-3xl text-[15px] text-[var(--kn-muted-strong)]">{t('keynote.intro')}</p>
          <p className="kn-mono mt-2 text-[12px] text-[var(--kn-muted)]">{t('keynote.keys')}</p>
        </div>
        <ol className="space-y-8 print:space-y-0">
          {deck.map((s, i) => (
            <li key={i} id={`slide-${i + 1}`} className="kn-scroll-item scroll-mt-20">
              <SlideView slide={s} n={i} total={deck.length} data={data} deck={deck} present={false} still={presenting} />
              <div className="mt-2 flex justify-end print:hidden">
                <button type="button" onClick={() => open(i)} className="kn-link text-[12.5px] text-[var(--kn-muted)]">
                  {t('keynote.presentFrom', { n: i + 1 })}
                </button>
              </div>
            </li>
          ))}
        </ol>
        <footer className="mt-12 flex flex-wrap justify-between gap-3 text-[12.5px] text-[var(--kn-muted)] print:hidden">
          <span>{t('common.rights', { year: fmtYear(loc, new Date(data.generatedAt).getUTCFullYear()) })}</span>
          <span>
            {t('keynote.footer')} · {fmtNum(loc, deck.length)}
          </span>
        </footer>
      </main>

      {present !== null && <Present deck={deck} data={data} start={present} onClose={close} reduce={reduce} />}
    </div>
  );
}
