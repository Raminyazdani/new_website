'use client';

import { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { Menu, X } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { LocaleSwitcher } from '@/components/shared/LocaleSwitcher';
import type { SiteData } from '@/lib/types';
import { cn } from '@/lib/utils';

const SECTIONS = ['about', 'experience', 'projects', 'skills', 'publications', 'contact'] as const;

export function HelixMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" className={className} aria-hidden>
      <defs>
        <linearGradient id="hx-g" x1="0" x2="1" y1="0" y2="1">
          <stop offset="0" stopColor="#2ee6c5" />
          <stop offset="1" stopColor="#4cc9f0" />
        </linearGradient>
      </defs>
      <path d="M9 3c0 8 14 10 14 18s-14 6-14 8" fill="none" stroke="url(#hx-g)" strokeWidth="2.2" strokeLinecap="round" />
      <path d="M23 3c0 8-14 10-14 18s14 6 14 8" fill="none" stroke="#ffb547" strokeWidth="2.2" strokeLinecap="round" opacity=".9" />
      {[8, 13, 19, 24].map((y) => (
        <line key={y} x1="11" x2="21" y1={y} y2={y} stroke="#ffffff" strokeOpacity=".35" strokeWidth="1.4" strokeLinecap="round" />
      ))}
    </svg>
  );
}

export function Nav({ data }: { data: SiteData }) {
  const t = useTranslations('nav');
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState<string>('');

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    const io = new IntersectionObserver(
      (entries) => entries.forEach((e) => e.isIntersecting && setActive(e.target.id)),
      { rootMargin: '-45% 0px -50% 0px' },
    );
    SECTIONS.forEach((id) => {
      const el = document.getElementById(id);
      if (el) io.observe(el);
    });
    return () => {
      window.removeEventListener('scroll', onScroll);
      io.disconnect();
    };
  }, []);

  return (
    <header className="fixed inset-x-0 top-0 z-50 px-3 pt-3 sm:px-6">
      <nav
        className={cn(
          'mx-auto flex max-w-7xl items-center justify-between rounded-2xl border px-4 py-2.5 transition-all duration-500',
          scrolled ? 'border-white/10 bg-[#060a14]/70 shadow-[0_10px_40px_-10px_rgba(0,0,0,.6)] backdrop-blur-xl' : 'border-transparent',
        )}
      >
        <a href="#top" className="flex items-center gap-2.5">
          <HelixMark className="size-7" />
          <span className="font-display text-[15px] font-semibold tracking-tight text-white">{data.person.displayName}</span>
        </a>
        <ul className="hidden items-center gap-1 lg:flex">
          {SECTIONS.map((id) => (
            <li key={id}>
              <a
                href={`#${id}`}
                className={cn(
                  'relative rounded-full px-3.5 py-2 text-sm text-[#9fb3c8] transition hover:text-white',
                  active === id && 'text-white',
                )}
              >
                {active === id && (
                  <motion.span layoutId="hx-nav" className="absolute inset-0 -z-10 rounded-full bg-white/[0.07] ring-1 ring-white/10" />
                )}
                {t(id)}
              </a>
            </li>
          ))}
        </ul>
        <div className="flex items-center gap-2">
          <LocaleSwitcher
            className="rounded-full border border-white/10 bg-white/[0.03] p-0.5"
            itemClassName="rounded-full px-2.5 py-1 text-xs text-[#9fb3c8] transition hover:text-white"
            activeClassName="bg-[#2ee6c5] text-[#04110f] hover:text-[#04110f]"
          />
          <button
            type="button"
            className="grid size-9 place-items-center rounded-full border border-white/10 text-white lg:hidden"
            onClick={() => setOpen(true)}
            aria-label={t('menu')}
          >
            <Menu className="size-4" />
          </button>
        </div>
      </nav>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[60] bg-[#04060c]/95 p-6 backdrop-blur-xl lg:hidden"
          >
            <div className="flex justify-end">
              <button type="button" onClick={() => setOpen(false)} aria-label={t('close')} className="grid size-10 place-items-center rounded-full border border-white/15 text-white">
                <X className="size-5" />
              </button>
            </div>
            <ul className="mt-10 space-y-2">
              {SECTIONS.map((id, i) => (
                <motion.li key={id} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 * i }}>
                  <a href={`#${id}`} onClick={() => setOpen(false)} className="font-display block py-2 text-4xl font-semibold text-white">
                    <span className="me-3 font-mono text-sm text-[#2ee6c5]" lang="en">0{i + 1}</span>
                    {t(id)}
                  </a>
                </motion.li>
              ))}
            </ul>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
