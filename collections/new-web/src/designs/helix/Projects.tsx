'use client';

import { useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { ArrowUpRight, Lock } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { BorderBeam } from '@/components/magicui/border-beam';
import { MagicCard } from '@/components/magicui/magic-card';
import { Expandable } from '@/components/kit/Expandable';
import { ShowAll } from '@/components/kit/ShowAll';
import { BrandIcon } from '@/components/shared/BrandIcon';
import type { ProjectCategory, SiteData } from '@/lib/types';
import { cn } from '@/lib/utils';
import { categoryIcon, Chip, SectionHeader } from './ui';
import { dot, fmtNum } from '@/lib/format';

const CATS: Array<ProjectCategory | 'all'> = ['all', 'omics', 'structural', 'ml', 'software', 'biotech'];

export function Projects({ data }: { data: SiteData }) {
  const t = useTranslations();
  const [cat, setCat] = useState<ProjectCategory | 'all'>('all');
  const [showAll, setShowAll] = useState(false);

  // in "all" the highlighted projects lead; the rest stay in the DOM (hidden) until "show all"
  const filtered = useMemo(() => {
    const list = data.projects.filter((p) => cat === 'all' || p.category === cat);
    return cat === 'all' ? [...list.filter((p) => p.highlight), ...list.filter((p) => !p.highlight)] : list;
  }, [data.projects, cat]);
  const isHidden = (highlight: boolean) => cat === 'all' && !showAll && !highlight;
  const visibleCount = filtered.filter((p) => !isHidden(p.highlight)).length;

  return (
    <section id="projects" className="relative py-32">
      <div className="mx-auto max-w-7xl px-6 sm:px-10">
        <SectionHeader index={3} kicker={t('sections.projects.kicker')} title={t('sections.projects.title')} subtitle={t('sections.projects.subtitle')} />

        <div className="mb-10 flex flex-wrap items-center gap-2">
          {CATS.map((c) => {
            const Icon = c === 'all' ? null : categoryIcon[c];
            return (
              <button
                key={c}
                type="button"
                onClick={() => setCat(c)}
                aria-pressed={cat === c}
                className={cn(
                  'inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm transition',
                  cat === c ? 'border-[#2ee6c5]/60 bg-[#2ee6c5]/10 text-white' : 'border-white/10 text-[#9fb3c8] hover:border-white/25 hover:text-white',
                )}
              >
                {Icon && <Icon className="size-4" />}
                {t(`categories.${c}`)}
              </button>
            );
          })}
          <span className="ms-auto font-mono text-xs text-[#6f879c]">{t('helix.results', { count: visibleCount })}</span>
        </div>

        <motion.ul layout className="grid grid-flow-dense gap-5 md:grid-cols-2 lg:grid-cols-3">
          <AnimatePresence mode="popLayout">
            {filtered.map((p, i) => {
              const Icon = categoryIcon[p.category];
              const wide = i === 0;
              return (
                <motion.li
                  key={p.id}
                  hidden={isHidden(p.highlight) || undefined}
                  layout
                  initial={{ opacity: 0, y: 24, scale: 0.98 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
                  className={cn('rounded-3xl', wide && 'lg:col-span-2 md:col-span-2')}
                >
                  <MagicCard
                    mode="orb"
                    glowFrom="#2ee6c5"
                    glowTo="#4cc9f0"
                    glowSize={360}
                    glowOpacity={0.35}
                    className="h-full rounded-3xl [--color-background:#070c17] [--color-border:rgba(255,255,255,0.08)]"
                  >
                    <article className="relative flex h-full flex-col p-6 sm:p-7">
                      <div className="mb-6 flex items-center justify-between gap-4">
                        <span className="inline-flex items-center gap-2 text-xs text-[#8ea3b7]">
                          <span className="grid size-8 place-items-center rounded-xl bg-[#2ee6c5]/10 text-[#2ee6c5] ring-1 ring-[#2ee6c5]/20">
                            <Icon className="size-4" />
                          </span>
                          {t(`categories.${p.category}`)}
                        </span>
                        {p.metric && (
                          <span className="font-display text-3xl font-semibold text-[#ffb547]" dir="ltr">
                            {p.metric}
                          </span>
                        )}
                      </div>
                      <h3 className={cn('font-display font-semibold leading-snug text-white', wide ? 'text-2xl sm:text-3xl' : 'text-xl')}>{p.title}</h3>
                      <p className={cn('mt-3 flex-1 leading-relaxed text-[#9fb3c8]', wide ? 'text-base max-w-2xl' : 'text-[15px]')}>{p.description}</p>
                      <div className="mt-6 flex flex-wrap items-center gap-2">
                        {p.tags.map((tag) => (
                          <Chip key={tag}>{tag}</Chip>
                        ))}
                      </div>
                      <div className="mt-6 border-t border-white/[0.06] pt-4 text-sm">
                        {p.url ? (
                          <a href={p.url} target="_blank" rel="noreferrer" className="group inline-flex items-center gap-2 text-[#cfe3f2] transition hover:text-[#2ee6c5]">
                            <BrandIcon name="github" className="size-4" />
                            <span className="font-mono text-xs" dir="ltr">{p.repo}</span>
                            <ArrowUpRight className="flip-rtl size-3.5 transition group-hover:-translate-y-0.5" />
                          </a>
                        ) : (
                          <span className="inline-flex items-center gap-2 text-xs text-[#5d7186]">
                            <Lock className="size-3.5" /> {t('common.noLink')}
                          </span>
                        )}
                      </div>
                    </article>
                    {wide && <BorderBeam size={220} duration={10} colorFrom="#2ee6c5" colorTo="#ffb547" />}
                  </MagicCard>
                </motion.li>
              );
            })}
          </AnimatePresence>
        </motion.ul>

        {cat === 'all' && (
          <div className="mt-10 flex justify-center">
            <button
              type="button"
              data-kit-more=""
              aria-expanded={showAll}
              onClick={() => setShowAll((v) => !v)}
              className="rounded-full border border-white/15 px-6 py-3 text-sm text-white transition hover:border-[#2ee6c5]/50 hover:bg-[#2ee6c5]/5"
            >
              {showAll ? t('common.showFewer') : t('common.showAll', { count: filtered.length })}
            </button>
          </div>
        )}

        <div className="mt-20">
          <p className="mb-5 font-mono text-xs uppercase tracking-[0.25em] text-[#6f879c]">
            {t('common.archive')}
            {dot(data.locale)}
            {fmtNum(data.locale, data.archive.length)}
          </p>
          <ShowAll
            items={data.archive}
            initial={6}
            getKey={(p) => p.id}
            className="grid gap-3 md:grid-cols-2 lg:grid-cols-3"
            buttonWrapClassName="mt-6 flex justify-center"
            buttonClassName="rounded-full border border-white/15 px-5 py-2.5 text-sm text-white transition hover:border-[#2ee6c5]/50"
            render={(p) => (
              <article className="flex h-full flex-col rounded-2xl border border-white/[0.08] bg-white/[0.02] p-5">
                <p className="text-xs text-[#8ea3b7]">{t(`categories.${p.category}`)}</p>
                <h3 className="mt-1.5 font-display font-semibold leading-snug text-white">{p.title}</h3>
                <Expandable
                  text={p.description}
                  lines={3}
                  minChars={150}
                  className="mt-2 text-sm leading-relaxed text-[#9fb3c8]"
                  buttonClassName="text-xs text-[#2ee6c5]"
                />
                {p.url && (
                  <a
                    href={p.url}
                    target="_blank"
                    rel="noreferrer"
                    className="group mt-auto inline-flex items-center gap-1.5 pt-4 font-mono text-xs text-[#cfe3f2] transition hover:text-[#2ee6c5]"
                    dir="ltr"
                  >
                    <BrandIcon name="github" className="size-3.5" />
                    {p.repo?.split('/')[1]}
                    <ArrowUpRight className="size-3 opacity-50 transition group-hover:opacity-100" />
                  </a>
                )}
              </article>
            )}
          />
        </div>
      </div>
    </section>
  );
}
