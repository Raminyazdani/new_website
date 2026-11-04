'use client';

import { useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion, useScroll, useSpring } from 'motion/react';
import { MapPin } from 'lucide-react';
import { useTranslations } from 'next-intl';
import SpotlightCard from '@/components/reactbits/SpotlightCard';
import type { ExperienceKind, SiteData } from '@/lib/types';
import { cn } from '@/lib/utils';
import { SectionHeader } from './ui';

const KINDS: Array<ExperienceKind | 'all'> = ['all', 'research', 'teaching', 'industry', 'business'];
const KIND_COLOR: Record<ExperienceKind, string> = {
  research: '#2ee6c5',
  teaching: '#4cc9f0',
  industry: '#ffb547',
  business: '#ff5c8a',
};

export function Experience({ data }: { data: SiteData }) {
  const t = useTranslations();
  const [kind, setKind] = useState<ExperienceKind | 'all'>('all');
  const listRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: listRef, offset: ['start 70%', 'end 60%'] });
  const fill = useSpring(scrollYProgress, { stiffness: 120, damping: 30 });
  const items = useMemo(() => data.experiences.filter((e) => kind === 'all' || e.kind === kind), [data.experiences, kind]);

  return (
    <section id="experience" className="relative py-32">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-[60%] bg-[radial-gradient(ellipse_50%_40%_at_50%_0%,rgba(46,230,197,0.08),transparent)]" />
      <div className="mx-auto max-w-6xl px-6 sm:px-10">
        <SectionHeader index={2} kicker={t('sections.experience.kicker')} title={t('sections.experience.title')} subtitle={t('sections.experience.subtitle')} />

        <div className="mb-14 flex flex-wrap gap-2" role="tablist">
          {KINDS.map((k) => (
            <button
              key={k}
              type="button"
              role="tab"
              aria-selected={kind === k}
              onClick={() => setKind(k)}
              className={cn('relative isolate rounded-full px-4 py-2 text-sm transition', kind === k ? 'text-[#04110f]' : 'text-[#9fb3c8] hover:text-white')}
            >
              {kind === k && (
                <motion.span layoutId="hx-kind" className="absolute inset-0 -z-10 rounded-full bg-[#2ee6c5]" transition={{ type: 'spring', stiffness: 400, damping: 34 }} />
              )}
              {k === 'all' ? t('common.all') : t(`kinds.${k}`)}
            </button>
          ))}
        </div>

        <div ref={listRef} className="relative">
          {/* the strand: thin track + glowing progress */}
          <div className="absolute bottom-0 start-[11px] top-0 w-px bg-white/10 md:start-[calc(12rem+1.5rem)]" />
          <motion.div
            style={{ scaleY: fill }}
            className="absolute bottom-0 start-[11px] top-0 w-px origin-top bg-gradient-to-b from-[#2ee6c5] via-[#4cc9f0] to-[#ffb547] shadow-[0_0_14px_#2ee6c5] md:start-[calc(12rem+1.5rem)]"
          />

          <ul className="space-y-6">
            <AnimatePresence mode="popLayout" initial={false}>
              {items.map((e) => (
                <motion.li
                  key={e.id}
                  layout
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.96 }}
                  viewport={{ once: true, amount: 0.25 }}
                  transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
                  className="relative grid gap-3 ps-10 md:grid-cols-[12rem_minmax(0,1fr)] md:gap-12 md:ps-0"
                >
                  <div className="hidden pt-7 text-end md:block">
                    <p className="font-mono text-xs text-[#2ee6c5]">{e.period}</p>
                    <p className="mt-2 text-xs font-medium" style={{ color: KIND_COLOR[e.kind] }}>
                      {t(`kinds.${e.kind}`)}
                    </p>
                    {e.location && <p className="mt-1 text-xs text-[#6f879c]">{e.location}</p>}
                  </div>

                  <span
                    className="absolute start-[5px] top-8 size-[13px] rounded-full border-2 border-[#04060c] md:start-[calc(12rem+1.5rem-6px)]"
                    style={{ background: KIND_COLOR[e.kind], boxShadow: `0 0 16px ${KIND_COLOR[e.kind]}` }}
                  >
                    {e.current && <span className="absolute inset-0 animate-ping rounded-full" style={{ background: KIND_COLOR[e.kind] }} />}
                  </span>

                  <SpotlightCard className="rounded-3xl border border-white/[0.08] bg-[#070c17]/80 p-6 sm:p-7" spotlightColor="rgba(46, 230, 197, 0.16)" theme="dark">
                    <div className="mb-3 flex flex-wrap items-center gap-2 md:hidden">
                      <span className="font-mono text-xs text-[#2ee6c5]">{e.period}</span>
                      <span className="rounded-full px-2 py-0.5 text-[11px]" style={{ color: KIND_COLOR[e.kind], background: `${KIND_COLOR[e.kind]}14` }}>
                        {t(`kinds.${e.kind}`)}
                      </span>
                    </div>
                    <div className="flex items-start justify-between gap-4">
                      <h3 className="font-display text-xl font-semibold leading-snug text-white">{e.role}</h3>
                      {e.current && (
                        <span className="mt-1 shrink-0 rounded-full bg-[#2ee6c5]/15 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider text-[#2ee6c5]">
                          {t('common.current')}
                        </span>
                      )}
                    </div>
                    <p className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-[#8ea3b7]">
                      <span className="text-[#cfe3f2]">{e.org}</span>
                      {e.location && (
                        <span className="inline-flex items-center gap-1 md:hidden">
                          <MapPin className="size-3.5" /> {e.location}
                        </span>
                      )}
                    </p>
                    <p className="mt-4 text-[15px] leading-relaxed text-[#9fb3c8]">{e.description}</p>
                  </SpotlightCard>
                </motion.li>
              ))}
            </AnimatePresence>
          </ul>
        </div>
      </div>
    </section>
  );
}
