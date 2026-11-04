'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { motion } from 'motion/react';
import { useTranslations } from 'next-intl';
import { fmtNum, fmtYear } from '@/lib/format';
import type { Experience, SiteData } from '@/lib/types';
import { cn } from '@/lib/utils';

type Kind = Experience['kind'];
/** left → right roughly in the order the branches first appear */
const LANES: Kind[] = ['business', 'industry', 'research', 'teaching'];
export const KIND_COLOR: Record<Kind, string> = { research: '#0b7568', teaching: '#8b74f0', industry: '#3a8bd6', business: '#ee8457' };

const W = 440;
const TOP = 26;
const BASE = 520;
const ROOT_Y = 566;
const LANE_X: Record<Kind, number> = { business: 78, industry: 178, research: 284, teaching: 380 };
const SUB = [0, 24, -24, 48];
const r2 = (n: number) => Math.round(n * 100) / 100;

/** "2026-09-15" | "2026-08" | "2026" | "present" → decimal year */
function toYear(v: string | null, end: boolean, now: number): number | null {
  if (!v) return null;
  if (v === 'present') return now;
  const [y, m, d] = v.split('-').map(Number);
  if (!y) return null;
  if (!m) return y + (end ? 0.999 : 0);
  if (!d) return y + (m - 1) / 12 + (end ? 1 / 12 : 0);
  return y + (m - 1) / 12 + (d - 1) / 365;
}

interface Placed {
  e: Experience;
  kind: Kind;
  t0: number;
  t1: number;
  x: number;
  col: number;
}

export default function Lineage({ data }: { data: SiteData }) {
  const t = useTranslations();
  const loc = data.locale;
  const [active, setActive] = useState<string | null>(data.experiences[0]?.id ?? null);
  const cardRefs = useRef(new Map<string, HTMLElement>());

  const now = useMemo(() => {
    const d = new Date(data.generatedAt);
    // UTC getters: the same value on the server and in every visitor's time zone (hydration-safe)
    return d.getUTCFullYear() + d.getUTCMonth() / 12 + (d.getUTCDate() - 1) / 365;
  }, [data.generatedAt]);

  const { placed, undated, t0, y } = useMemo(() => {
    const dated: Placed[] = [];
    const undated: Experience[] = [];
    for (const e of data.experiences) {
      const s = toYear(e.start, false, now);
      if (s === null) {
        undated.push(e);
        continue;
      }
      const end = e.end ? toYear(e.end, true, now) : toYear(e.start, true, now);
      dated.push({ e, kind: e.kind, t0: s, t1: Math.max(end ?? s, s + 0.05), x: 0, col: 0 });
    }
    // daughter branches: greedy interval colouring per lane
    for (const k of LANES) {
      const lane = dated.filter((p) => p.kind === k).sort((a, b) => a.t0 - b.t0);
      const lastEnd: number[] = [];
      for (const p of lane) {
        let c = lastEnd.findIndex((end) => end <= p.t0 + 0.01);
        if (c === -1) c = lastEnd.length;
        lastEnd[c] = p.t1;
        p.col = c;
        p.x = LANE_X[k] + (SUB[c] ?? c * 24);
      }
    }
    const t0 = Math.floor(Math.min(...dated.map((p) => p.t0)));
    const t1 = now + 0.12;
    // recent years get more room: time is compressed toward the root
    const y = (tt: number) => r2(TOP + (BASE - TOP) * Math.pow(Math.max(0, (t1 - tt) / (t1 - t0)), 0.62));
    return { placed: dated, undated, t0, y };
  }, [data.experiences, now]);

  const ticks = useMemo(() => {
    const out: { year: number; y: number }[] = [];
    let lastY = Infinity;
    for (let yr = t0; yr <= Math.floor(now); yr++) {
      const yy = y(yr);
      if (lastY - yy >= 22) {
        out.push({ year: yr, y: yy });
        lastY = yy;
      }
    }
    return out;
  }, [t0, now, y]);

  // scroll-sync: the card crossing the middle of the viewport is the active cell
  useEffect(() => {
    const io = new IntersectionObserver(
      (entries) => {
        for (const en of entries) if (en.isIntersecting) setActive((en.target as HTMLElement).dataset.id ?? null);
      },
      { rootMargin: '-45% 0px -50% 0px' },
    );
    cardRefs.current.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, []);

  const laneFirst = (k: Kind) => Math.min(...placed.filter((p) => p.kind === k).map((p) => p.t0), now);
  const laneLast = (k: Kind) => Math.max(...placed.filter((p) => p.kind === k).map((p) => p.t1), -Infinity);
  const counts = Object.fromEntries(LANES.map((k) => [k, data.experiences.filter((e) => e.kind === k).length])) as Record<Kind, number>;
  const activePlaced = placed.find((p) => p.e.id === active);
  const yNow = y(now);

  const scrollToCard = (id: string) => {
    const el = cardRefs.current.get(id);
    if (!el) return;
    window.scrollTo({ top: el.getBoundingClientRect().top + window.scrollY - window.innerHeight * 0.4, behavior: 'smooth' });
  };

  return (
    <div className="grid gap-10 lg:grid-cols-[minmax(0,460px)_minmax(0,1fr)] lg:gap-14">
      {/* tree */}
      <div className="lg:sticky lg:top-24 lg:self-start">
        <div className="glass rounded-[32px] p-4 sm:p-5">
          <ul className="mb-2 flex flex-wrap gap-x-4 gap-y-1.5 px-1 text-xs text-[var(--o-muted)]">
            {LANES.map((k) => (
              <li key={k} className="flex items-center gap-1.5">
                <span className="size-2.5 rounded-full" style={{ background: KIND_COLOR[k] }} />
                {t(`kinds.${k}`)} <span className="tabular-nums opacity-70">{fmtNum(loc, counts[k])}</span>
              </li>
            ))}
          </ul>
          <svg viewBox={`0 0 ${W} ${ROOT_Y + 28}`} className="h-auto w-full" direction="ltr" role="img" aria-label={t('organic.lineageTitle')}>
            {/* year grid */}
            {ticks.map((tk) => (
              <g key={tk.year}>
                <line x1={40} x2={W - 8} y1={tk.y} y2={tk.y} stroke="rgb(16 32 27 / 0.07)" strokeDasharray="2 5" />
                <text x={8} y={tk.y + 4} className="fill-[#8a9993] text-[11px] tabular-nums">
                  {fmtYear(loc, tk.year)}
                </text>
              </g>
            ))}
            {/* today */}
            <line x1={40} x2={W - 8} y1={yNow} y2={yNow} stroke="var(--o-teal)" strokeOpacity={0.5} strokeDasharray="4 4" />
            <text x={W - 8} y={yNow - 7} textAnchor="end" className="fill-[var(--o-teal)] text-[11px] font-semibold">
              {t('organic.today')}
            </text>

            {/* roots → lanes */}
            {LANES.map((k, i) => {
              const x = LANE_X[k];
              const first = y(laneFirst(k));
              const last = y(laneLast(k));
              return (
                <g key={k}>
                  <motion.path
                    d={`M ${W / 2} ${ROOT_Y} C ${W / 2} ${ROOT_Y - 34}, ${x} ${BASE + 30}, ${x} ${BASE}`}
                    fill="none"
                    stroke={KIND_COLOR[k]}
                    strokeWidth={3}
                    strokeLinecap="round"
                    initial={{ pathLength: 0 }}
                    whileInView={{ pathLength: 1 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.9, delay: 0.1 * i }}
                  />
                  {/* dormant stretch of the branch before its first role */}
                  <line x1={x} x2={x} y1={BASE} y2={first} stroke={KIND_COLOR[k]} strokeOpacity={0.35} strokeWidth={2} strokeDasharray="3 6" />
                  <motion.line
                    x1={x}
                    x2={x}
                    y1={first}
                    y2={last}
                    stroke={KIND_COLOR[k]}
                    strokeWidth={3}
                    strokeLinecap="round"
                    initial={{ pathLength: 0 }}
                    whileInView={{ pathLength: 1 }}
                    viewport={{ once: true }}
                    transition={{ duration: 1.2, delay: 0.5 + 0.1 * i }}
                  />
                </g>
              );
            })}
            <circle cx={W / 2} cy={ROOT_Y} r={10} fill="#fff" stroke="var(--o-ink)" strokeWidth={2.5} />
            <circle cx={W / 2} cy={ROOT_Y} r={4} fill="var(--o-ink)" />
            <text x={W / 2} y={ROOT_Y + 26} textAnchor="middle" className="fill-[var(--o-muted)] text-[11px]">
              {t('organic.root')} · {fmtYear(loc, t0)}
            </text>

            {/* cells */}
            {placed.map((p) => {
              const ys = y(p.t0);
              const ye = y(p.t1);
              const c = KIND_COLOR[p.kind];
              const on = active === p.e.id;
              const lane = LANE_X[p.kind];
              return (
                <g
                  key={p.e.id}
                  className="cursor-pointer transition-opacity duration-300"
                  opacity={active && !on ? 0.42 : 1}
                  onClick={() => scrollToCard(p.e.id)}
                  onPointerEnter={() => setActive(p.e.id)}
                >
                  {p.col > 0 && (
                    <path d={`M ${lane} ${r2(ys + 22)} C ${lane} ${r2(ys + 8)}, ${p.x} ${r2(ys + 14)}, ${p.x} ${ys}`} fill="none" stroke={c} strokeWidth={2} />
                  )}
                  <rect x={p.x - 5.5} y={ye} width={11} height={Math.max(ys - ye, 11)} rx={5.5} fill={c} fillOpacity={on ? 0.45 : 0.24} stroke={c} strokeWidth={1.5} />
                  <circle cx={p.x} cy={ys} r={on ? 9.5 : 7.5} fill="#fff" stroke={c} strokeWidth={2.5} className="transition-all duration-300" />
                  <circle cx={p.x} cy={ys} r={on ? 4 : 3} fill={c} />
                  {p.e.current && (
                    <>
                      <circle cx={p.x} cy={ye} r={4.5} fill={c} className="o-pulse" />
                      <circle cx={p.x} cy={ye} r={4.5} fill={c} />
                    </>
                  )}
                  {on && <circle cx={p.x} cy={ys} r={16} fill="none" stroke={c} strokeOpacity={0.35} strokeWidth={6} />}
                </g>
              );
            })}
          </svg>
          <div className="min-h-[4.5rem] border-t border-[var(--o-line)] px-1 pt-3" aria-live="polite">
            {activePlaced ? (
              <>
                <p className="text-xs text-[var(--o-muted)]">
                  <span className="me-2 inline-block size-2 rounded-full align-middle" style={{ background: KIND_COLOR[activePlaced.kind] }} />
                  {activePlaced.e.period}
                </p>
                <p className="mt-1 text-sm font-semibold leading-snug">{activePlaced.e.role}</p>
                <p className="text-sm text-[var(--o-muted)]">{activePlaced.e.org}</p>
              </>
            ) : null}
          </div>
          {undated.length > 0 && <p className="mt-2 px-1 text-xs text-[var(--o-muted)]">{t('organic.undated', { count: undated.length })}</p>}
        </div>
      </div>

      {/* cards */}
      <ol className="space-y-5">
        {data.experiences.map((e) => (
          <li
            key={e.id}
            data-id={e.id}
            ref={(el) => {
              if (el) cardRefs.current.set(e.id, el);
              else cardRefs.current.delete(e.id);
            }}
          >
            <motion.article
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.3 }}
              transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
              onPointerEnter={() => setActive(e.id)}
              className={cn(
                'glass relative overflow-hidden rounded-[28px] p-6 transition-[box-shadow,transform] duration-300 sm:p-7',
                active === e.id && 'glass-strong -translate-y-0.5',
              )}
            >
              <span className="absolute inset-y-6 start-0 w-1 rounded-e-full" style={{ background: KIND_COLOR[e.kind] }} />
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5 text-xs">
                {/* tinted pill + ink text: white on the lighter branch colours would miss 4.5:1 */}
                <span className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 font-semibold text-[var(--o-ink)]" style={{ background: `color-mix(in oklab, ${KIND_COLOR[e.kind]} 20%, white)` }}>
                  <span className="size-1.5 rounded-full" style={{ background: KIND_COLOR[e.kind] }} />
                  {t(`kinds.${e.kind}`)}
                </span>
                {e.period && <span className="tabular-nums text-[var(--o-muted)]">{e.period}</span>}
                {e.current && <span className="rounded-full bg-[var(--o-ink)] px-2.5 py-1 font-semibold text-white">{t('common.current')}</span>}
              </div>
              <h3 className="font-display mt-4 text-[1.7rem] leading-tight">{e.role}</h3>
              <p className="mt-1 text-sm font-medium text-[var(--o-muted)]">
                {e.org}
                {e.location ? ` · ${e.location}` : ''}
              </p>
              {e.description && <p className="mt-4 text-[15px] leading-relaxed text-[var(--o-ink)]/85">{e.description}</p>}
            </motion.article>
          </li>
        ))}
      </ol>
    </div>
  );
}
