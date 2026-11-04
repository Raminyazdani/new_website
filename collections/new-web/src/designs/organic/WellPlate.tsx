'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { motion } from 'motion/react';
import { useTranslations } from 'next-intl';
import { fmtNum } from '@/lib/format';
import type { SiteData, SkillItem } from '@/lib/types';
import { cn } from '@/lib/utils';

const ROWS = 'ABCDEFGH'.split('');
const COLS = 12;
/** one liquid colour per technique group */
const LIQUIDS = ['#22b5a2', '#8f7bf5', '#f48f6b', '#4fa3e6', '#e2bf3b', '#ec7aae'];

interface Well {
  item: SkillItem;
  group: number;
  coord: string;
}

/** A 96-well plate "plated" with the wet-lab and bioprocess techniques, one technique per well. */
export default function WellPlate({ data }: { data: SiteData }) {
  const t = useTranslations('organic');
  const loc = data.locale;
  const plateRef = useRef<HTMLDivElement>(null);
  const [filled, setFilled] = useState(false);
  const [hover, setHover] = useState<number | null>(null);
  const [focusGroup, setFocusGroup] = useState<number | null>(null);

  const { groups, wells } = useMemo(() => {
    const allGroups = data.skills.flatMap((c) => c.groups);
    const groups: { label: string; color: string; count: number }[] = [];
    const wells: Well[] = [];
    for (const id of ['wetlab', 'bioprocess']) {
      const dom = data.domains.find((d) => d.id === id);
      if (!dom) continue;
      for (const label of dom.groupLabels) {
        const g = allGroups.find((x) => x.label === label);
        if (!g) continue;
        const gi = groups.length;
        groups.push({ label, color: LIQUIDS[gi % LIQUIDS.length], count: g.items.length });
        for (const item of g.items) {
          const i = wells.length;
          if (i >= ROWS.length * COLS) break;
          wells.push({ item, group: gi, coord: `${ROWS[Math.floor(i / COLS)]}${(i % COLS) + 1}` });
        }
      }
    }
    return { groups, wells };
  }, [data.domains, data.skills]);

  useEffect(() => {
    const el = plateRef.current;
    if (!el) return;
    const io = new IntersectionObserver(([e]) => e.isIntersecting && (setFilled(true), io.disconnect()), { threshold: 0.35 });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  const current = hover !== null ? wells[hover] : null;

  return (
    <div className="grid items-start gap-8 lg:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)]">
      <div className="[perspective:1600px]">
        <div
          ref={plateRef}
          dir="ltr"
          className="o-plate relative rounded-[30px] p-4 transition-transform duration-700 sm:p-7 lg:[transform:rotateX(12deg)] lg:hover:[transform:rotateX(4deg)]"
          onPointerLeave={() => setHover(null)}
        >
          <div className="grid grid-cols-[1.1rem_repeat(12,minmax(0,1fr))] gap-1 sm:grid-cols-[1.5rem_repeat(12,minmax(0,1fr))] sm:gap-2">
            <span />
            {Array.from({ length: COLS }, (_, c) => (
              <span key={c} className="pb-1 text-center text-[10px] font-semibold tabular-nums text-[#8a9993] sm:text-[11px]">
                {c + 1}
              </span>
            ))}
            {ROWS.map((r, ri) => (
              <div key={r} className="contents">
                <span className="grid place-items-center text-[10px] font-semibold text-[#8a9993] sm:text-[11px]">{r}</span>
                {Array.from({ length: COLS }, (_, ci) => {
                  const i = ri * COLS + ci;
                  const w = wells[i];
                  const dim = focusGroup !== null && w?.group !== focusGroup;
                  return (
                    <button
                      key={ci}
                      type="button"
                      disabled={!w}
                      aria-label={w ? `${w.coord}: ${w.item.long || w.item.name}` : `${r}${ci + 1}`}
                      onPointerEnter={() => w && setHover(i)}
                      onFocus={() => w && setHover(i)}
                      onClick={() => w && setHover(i)}
                      className={cn(
                        'o-well relative aspect-square rounded-full transition-[transform,opacity] duration-300 disabled:cursor-default',
                        w && 'cursor-pointer hover:scale-[1.18] focus-visible:scale-[1.18] focus-visible:outline-none',
                        hover === i && 'scale-[1.18]',
                        dim && 'opacity-30',
                      )}
                    >
                      {w && (
                        <motion.span
                          className="o-liquid absolute inset-[16%] rounded-full"
                          style={{ background: `radial-gradient(circle at 38% 32%, color-mix(in oklab, ${groups[w.group].color} 45%, white) 0, ${groups[w.group].color} 62%)` }}
                          initial={{ scale: 0, opacity: 0 }}
                          animate={filled ? { scale: 1, opacity: 1 } : undefined}
                          transition={{ delay: 0.15 + i * 0.016, type: 'spring', stiffness: 260, damping: 18 }}
                        />
                      )}
                      {hover === i && <span className="absolute -inset-1 rounded-full ring-2 ring-[var(--o-ink)]/70" />}
                    </button>
                  );
                })}
              </div>
            ))}
          </div>
        </div>
        <p className="mt-6 text-center text-sm text-[var(--o-muted)]">{t('wells', { count: wells.length })}</p>
      </div>

      <div className="space-y-5">
        <div className="glass-strong min-h-[9.5rem] rounded-3xl p-6" aria-live="polite">
          {current ? (
            <>
              <p className="flex items-center gap-3 text-sm text-[var(--o-muted)]">
                <span dir="ltr" className="rounded-full bg-[var(--o-ink)] px-2.5 py-0.5 text-xs font-semibold tabular-nums text-white">
                  {current.coord}
                </span>
                <span className="size-2.5 rounded-full" style={{ background: groups[current.group].color }} />
                <span className="truncate">{groups[current.group].label}</span>
              </p>
              <p className="font-display mt-4 text-3xl leading-tight">{current.item.long || current.item.name}</p>
            </>
          ) : (
            <p className="font-display text-2xl leading-snug text-[var(--o-muted)]">{t('wellHint')}</p>
          )}
        </div>
        <ul className="glass rounded-3xl p-3">
          {groups.map((g, gi) => (
            <li key={g.label}>
              <button
                type="button"
                onPointerEnter={() => setFocusGroup(gi)}
                onPointerLeave={() => setFocusGroup(null)}
                onFocus={() => setFocusGroup(gi)}
                onBlur={() => setFocusGroup(null)}
                className="flex w-full items-center gap-3 rounded-2xl px-3 py-2.5 text-start text-sm transition hover:bg-white/70"
              >
                <span className="size-3.5 shrink-0 rounded-full shadow-inner" style={{ background: g.color }} />
                <span className="flex-1">{g.label}</span>
                <span className="tabular-nums text-[var(--o-muted)]">{fmtNum(loc, g.count)}</span>
              </button>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
