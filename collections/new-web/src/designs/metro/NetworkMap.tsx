'use client';

import { useEffect, useMemo, useRef, useState, type CSSProperties, type KeyboardEvent } from 'react';
import { useTranslations } from 'next-intl';
import { nowFrac, r2, spanOf, yearFrac } from '@/lib/derive';
import { dot, fmtNum, fmtYear } from '@/lib/format';
import type { Education, Experience, SiteData } from '@/lib/types';
import { cn } from '@/lib/utils';

export type LineId = 'education' | 'research' | 'teaching' | 'industry' | 'business';
export const LINES: ReadonlyArray<{ id: LineId; color: string; letter: string }> = [
  { id: 'education', color: '#1a1a1a', letter: 'E' },
  { id: 'research', color: '#0067b1', letter: 'R' },
  { id: 'teaching', color: '#7a3f97', letter: 'T' },
  { id: 'industry', color: '#9b5b2b', letter: 'I' },
  { id: 'business', color: '#d8232a', letter: 'B' },
];
export const lineOf = (id: LineId) => LINES.find((l) => l.id === id)!;

interface StationBase {
  id: string;
  line: LineId;
  t: number;
  end: number;
  open: boolean;
  /** short name on the map */
  label: string;
  /** lines you can change to here (interchange) */
  transfers: LineId[];
  /** for roles: the education station of the same institution running at that time */
  via: string | null;
}
export type Station = (StationBase & { kind: 'role'; item: Experience }) | (StationBase & { kind: 'education'; item: Education });

export const stationTitle = (s: Station) => (s.kind === 'role' ? s.item.role : s.item.degree);
export const stationOrg = (s: Station) => (s.kind === 'role' ? s.item.org : s.item.institution);

/**
 * Dated roles and degrees become stations. A role is an interchange with the Education line when its
 * organisation contains the name of an institution Ramin was studying at during that time (derived, not curated).
 */
export function buildStations(data: SiteData): { stations: Station[]; undated: Experience[] } {
  const stations: Station[] = [];
  const undated: Experience[] = [];
  const edu = data.education.map((e) => ({ e, s: spanOf(e, data) }));
  for (const { e, s } of edu) {
    if (s) stations.push({ id: `edu-${e.id}`, line: 'education', t: s.start, end: s.end, open: s.open, label: e.degree.split(' (')[0], transfers: [], via: null, kind: 'education', item: e });
  }
  for (const e of data.experiences) {
    const s = spanOf(e, data);
    if (!s) {
      undated.push(e);
      continue;
    }
    const hub = edu.find(({ e: d, s: ds }) => ds && e.org.includes(d.institution) && s.start >= ds.start - 0.02 && s.start <= ds.end + 0.02);
    stations.push({
      id: `role-${e.id}`,
      line: e.kind,
      t: s.start,
      end: s.end,
      open: s.open,
      label: e.role.split(/\s[—–]\s/)[0],
      transfers: hub ? ['education'] : [],
      via: hub ? `edu-${hub.e.id}` : null,
      kind: 'role',
      item: e,
    });
  }
  for (const st of stations) if (st.kind === 'education') st.transfers = [...new Set(stations.filter((r) => r.via === st.id).map((r) => r.line))];
  // the same short name twice on one line → add the city to tell them apart
  const dup = new Set(stations.filter((a) => stations.some((b) => b !== a && b.line === a.line && b.label === a.label)).map((s) => s.id));
  for (const st of stations) {
    const city = data.journey.find((j) => j.id === st.item.city)?.city;
    if (dup.has(st.id) && city) st.label = `${st.label} (${city})`;
  }
  const order = (l: LineId) => LINES.findIndex((x) => x.id === l);
  stations.sort((a, b) => a.t - b.t || order(a.line) - order(b.line));
  return { stations, undated };
}

/* ─────────────────────────────── wide layout ─────────────────────────────── */

const GUTTER = 128;
const RIGHT = 26;
const GAP = 24; // minimum distance between two stations on one line
const TIER = 17; // vertical distance between label rows
const estW = (s: string, fa: boolean) => s.length * (fa ? 6.2 : 6.8);

interface WideLayout {
  W: number;
  H: number;
  px: (p: number) => number;
  pt: (v: number) => number;
  pos: Map<string, number>;
  lab: Map<string, { side: -1 | 1; tier: number; dir: 1 | -1 }>;
  laneY: Record<LineId, number>;
  icY: number;
  stops: Array<{ id: string; city: string; period: string; p: number; tier: number }>;
  years: Array<{ year: number; p: number; label: boolean }>;
  segs: Record<LineId, Array<[number, number]>>;
}

function layoutWide(stations: Station[], data: SiteData, W: number, widths: Record<string, number>): WideLayout {
  const rtl = data.dir === 'rtl';
  const fa = data.locale === 'fa';
  const now = nowFrac(data);
  const lo = Math.floor(Math.min(...stations.map((s) => s.t)));
  const hi = Math.ceil(Math.max(now, ...stations.map((s) => s.end)));
  // warped time: a year's width grows with the number of stations that open in it
  const weights = Array.from({ length: hi - lo }, (_, i) => 1 + 1.7 * stations.filter((s) => Math.floor(s.t) === lo + i).length);
  const cum = [0];
  for (const w of weights) cum.push(cum[cum.length - 1] + w);
  const total = cum[cum.length - 1];
  const span = W - GUTTER - RIGHT;
  const pt = (v: number) => {
    const y = Math.min(Math.max(v, lo), hi - 1e-6);
    const i = Math.floor(y) - lo;
    return ((cum[i] + weights[i] * (y - Math.floor(y))) / total) * span;
  };
  const px = (p: number) => (rtl ? W - GUTTER - p : GUTTER + p);

  // stations: time position, pushed apart when two would sit on top of each other
  const pos = new Map<string, number>();
  for (const l of LINES) {
    const list = stations.filter((s) => s.line === l.id);
    const ps = list.map((s) => pt(s.t));
    for (let i = 1; i < ps.length; i++) ps[i] = Math.max(ps[i], ps[i - 1] + GAP);
    if (ps.length) {
      ps[ps.length - 1] = Math.min(ps[ps.length - 1], span - 6);
      for (let i = ps.length - 2; i >= 0; i--) ps[i] = Math.min(ps[i], ps[i + 1] - GAP);
    }
    list.forEach((s, i) => pos.set(s.id, ps[i]));
  }

  // labels: above/below the line, up to three rows each side; run backwards near the right edge
  const tw = (s: Station) => widths[s.id] ?? estW(s.label, fa);
  const lab = new Map<string, { side: -1 | 1; tier: number; dir: 1 | -1 }>();
  const ext = {} as Record<LineId, { up: number; down: number }>;
  for (const l of LINES) {
    const used: Record<string, Array<[number, number]>> = {};
    let up = -1;
    let down = -1;
    stations
      .filter((s) => s.line === l.id)
      .forEach((s, i) => {
        const p = pos.get(s.id)!;
        const w = tw(s) + (s.transfers.length ? 8 + s.transfers.length * 15 : 0) + 10;
        const fwd = span + RIGHT - 4 - p;
        const back = p + GUTTER - 118;
        const dir: 1 | -1 = fwd >= w ? 1 : back >= w ? -1 : fwd >= back ? 1 : -1;
        const iv: [number, number] = dir === 1 ? [p - 3, p + w] : [p - w, p + 3];
        const sides: Array<-1 | 1> = i % 2 ? [1, -1] : [-1, 1];
        let pick: [-1 | 1, number] | null = null;
        for (let tier = 0; tier < 3 && !pick; tier++)
          for (const side of sides) {
            const u = (used[`${side}${tier}`] ??= []);
            if (u.every(([a, b]) => iv[1] + 6 < a || iv[0] > b + 6)) {
              u.push(iv);
              pick = [side, tier];
              break;
            }
          }
        const [side, tier] = pick ?? [sides[0], 0];
        if (side < 0) up = Math.max(up, tier);
        else down = Math.max(down, tier);
        lab.set(s.id, { side, tier, dir });
      });
    ext[l.id] = { up: up < 0 ? 14 : 15 + up * TIER + 12, down: down < 0 ? 14 : 23 + down * TIER + 6 };
  }

  // intercity stops: the first dated entry in that city in the stop's first year
  const entries = [...data.education, ...data.experiences];
  const stopsRaw = data.journey.map((j) => {
    const firsts = entries.filter((e) => e.city === j.id && e.startYear === j.from).map((e) => yearFrac(e.start)).filter((v): v is number => v !== null);
    return { id: j.id, city: j.city, period: j.period, p: pt(firsts.length ? Math.min(...firsts) : j.from + 0.05), tier: 0 };
  });
  const taken: Array<Array<[number, number]>> = [[], []];
  for (const s of stopsRaw) {
    const w = Math.max(estW(s.city, fa) * 1.05, s.period.length * 6.4) + 8;
    const iv: [number, number] = [s.p - w / 2, s.p + w / 2];
    s.tier = taken[0].every(([a, b]) => iv[1] < a || iv[0] > b) ? 0 : 1;
    taken[s.tier].push(iv);
  }

  // year ticks; labels from the newest year backwards so recent years always get one
  const years: WideLayout['years'] = [];
  let lastLabel = 1e9;
  for (let y = hi; y >= lo; y--) {
    const p = pt(y === hi ? hi - 1e-6 : y);
    const label = y < hi && lastLabel - p >= 38;
    if (label) lastLabel = p;
    years.unshift({ year: y, p, label });
  }

  const icY = 70;
  const laneY = {} as Record<LineId, number>;
  let y = icY + 50 + ext[LINES[0].id].up;
  LINES.forEach((l, i) => {
    if (i) y += Math.max(64, ext[LINES[i - 1].id].down + ext[l.id].up + 14);
    laneY[l.id] = y;
  });
  const H = y + ext[LINES[LINES.length - 1].id].down + 18;

  // where each line is in service (union of its stations' spans)
  const segs = {} as Record<LineId, Array<[number, number]>>;
  for (const l of LINES) {
    const iv = stations
      .filter((s) => s.line === l.id)
      .map((s) => [Math.min(pt(s.t), pos.get(s.id)!), Math.max(pt(s.open ? now : s.end), pos.get(s.id)!)] as [number, number])
      .sort((a, b) => a[0] - b[0]);
    const out: Array<[number, number]> = [];
    for (const [a, b] of iv) {
      const last = out[out.length - 1];
      if (last && a <= last[1] + 3) last[1] = Math.max(last[1], b);
      else out.push([a, b]);
    }
    segs[l.id] = out;
  }

  return { W, H, px, pt, pos, lab, laneY, icY, stops: stopsRaw, years, segs };
}

function useWidth(ref: React.RefObject<HTMLElement | null>, fallback: number) {
  const [w, setW] = useState(fallback);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const ro = new ResizeObserver(([e]) => {
      const v = Math.round(e.contentRect.width);
      if (v > 0) setW(v);
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, [ref]);
  return w;
}

/* ─────────────────────────────── the map ─────────────────────────────── */

/**
 * The network map. ≥ 900 px: an SVG diagram, time along x on a warped scale (busy years get more room),
 * one lane per line, stations in time order for keyboard users. Below: an HTML strip list (one row per
 * station) that expands in place.
 */
export function NetworkMap({
  data,
  stations,
  selected,
  onSelect,
  hl,
  onHl,
}: {
  data: SiteData;
  stations: Station[];
  selected: string | null;
  onSelect: (s: Station | null) => void;
  hl: LineId | null;
  onHl: (l: LineId | null) => void;
}) {
  const t = useTranslations();
  const loc = data.locale;
  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center gap-2" role="group" aria-label={t('metro.legendLabel')}>
        {LINES.map((l) => {
          const on = hl === l.id;
          const n = stations.filter((s) => s.line === l.id).length;
          return (
            <button
              key={l.id}
              type="button"
              aria-pressed={on}
              onClick={() => onHl(on ? null : l.id)}
              className={cn(
                'inline-flex items-center gap-2 rounded-full border-2 py-1 pe-3 ps-1 text-[13px] font-bold transition-colors',
                on ? 'border-[#1a1a1a] bg-[#1a1a1a] text-white' : 'border-[var(--m-line)] bg-white hover:border-[#1a1a1a]',
              )}
            >
              <span className="grid size-6 place-items-center rounded-full text-[11.5px] font-extrabold text-white ring-2 ring-white" style={{ background: l.color }} lang="en" aria-hidden>
                {l.letter}
              </span>
              {l.id === 'education' ? t('sections.education.title') : t(`kinds.${l.id}`)}
              <span className="mt-mono text-[12px] font-semibold opacity-75">{fmtNum(loc, n)}</span>
            </button>
          );
        })}
      </div>
      <div className="max-[899px]:hidden">
        <WideMap data={data} stations={stations} selected={selected} onSelect={onSelect} hl={hl} />
      </div>
      <div className="min-[900px]:hidden">
        <StripList data={data} stations={stations} selected={selected} onSelect={onSelect} hl={hl} />
      </div>
      <MapKey />
    </div>
  );
}

function MapKey() {
  const t = useTranslations();
  return (
    <ul className="mt-4 flex flex-wrap gap-x-6 gap-y-2 text-[12.5px] text-[var(--m-muted)]" aria-label={t('metro.keyTitle')}>
      <li className="flex items-center gap-2">
        <svg width="18" height="18" aria-hidden>
          <circle cx="9" cy="9" r="6" fill="#fff" stroke="#1a1a1a" strokeWidth="3.5" />
        </svg>
        {t('metro.keyInterchange')}
      </li>
      <li className="flex items-center gap-2">
        <svg width="30" height="10" aria-hidden>
          <line x1="2" x2="28" y1="5" y2="5" stroke="#0067b1" strokeWidth="2" strokeDasharray="4 4" />
        </svg>
        {t('metro.keyGap')}
      </li>
      <li className="flex items-center gap-2">
        <svg width="30" height="16" aria-hidden direction="ltr" className="flip-rtl">
          <line x1="2" x2="18" y1="8" y2="8" stroke="#0067b1" strokeWidth="6" strokeLinecap="round" />
          <path d="M 18 1 l 10 7 l -10 7 z" fill="#0067b1" />
        </svg>
        {t('metro.keyOpen')}
      </li>
      <li className="flex items-center gap-2">
        <svg width="10" height="18" aria-hidden>
          <line x1="5" x2="5" y1="1" y2="17" stroke="#d8232a" strokeWidth="1.5" strokeDasharray="2 3" />
        </svg>
        {t('metro.keyNow')}
      </li>
    </ul>
  );
}

function stationKeys(s: Station, onSelect: (s: Station | null) => void) {
  return (e: KeyboardEvent<Element>) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      onSelect(s);
    } else if (e.key === 'Escape') onSelect(null);
  };
}

function WideMap({ data, stations, selected, onSelect, hl }: { data: SiteData; stations: Station[]; selected: string | null; onSelect: (s: Station | null) => void; hl: LineId | null }) {
  const t = useTranslations();
  const ref = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const W = Math.max(useWidth(ref, 1200), 780);
  const rtl = data.dir === 'rtl';
  const now = nowFrac(data);
  const [widths, setWidths] = useState<Record<string, number>>({});
  const lay = useMemo(() => layoutWide(stations, data, W, widths), [stations, data, W, widths]);

  // measure the real label widths once the fonts are in, then lay out again
  useEffect(() => {
    let off = false;
    const measure = () => {
      const svg = svgRef.current;
      if (off || !svg) return;
      const next: Record<string, number> = {};
      svg.querySelectorAll<SVGTextElement>('text[data-mt-label]').forEach((n) => {
        next[n.dataset.mtLabel!] = Math.ceil(n.getComputedTextLength());
      });
      setWidths((prev) => (Object.keys(next).some((k) => Math.abs((prev[k] ?? -99) - next[k]) > 1) ? next : prev));
    };
    if (document.fonts?.ready) document.fonts.ready.then(measure);
    else measure();
    return () => {
      off = true;
    };
  }, [stations]);

  const { px, pt, laneY, icY } = lay;
  const tw = (s: Station) => widths[s.id] ?? estW(s.label, data.locale === 'fa');
  const first = lay.stops[0]?.p ?? 0;
  const nowP = pt(now);

  return (
    <div ref={ref}>
      <svg ref={svgRef} direction="ltr" viewBox={`0 0 ${lay.W} ${lay.H}`} className="block h-auto w-full" role="group" aria-label={t('metro.mapLabel')}>
        <g aria-hidden>
          {/* year grid */}
          {lay.years.map((y) => (
            <g key={y.year}>
              <line x1={r2(px(y.p))} x2={r2(px(y.p))} y1={22} y2={lay.H - 8} stroke="#ecece8" />
              {y.label && (
                <text x={r2(px(y.p) + (rtl ? -4 : 4))} y={15} textAnchor={rtl ? 'end' : 'start'} className="mt-mono fill-[#5c5c5c] text-[11px]">
                  {fmtYear(data.locale, y.year)}
                </text>
              )}
            </g>
          ))}
          <line x1={r2(px(nowP))} x2={r2(px(nowP))} y1={24} y2={lay.H - 8} stroke="#d8232a" strokeWidth={1.5} strokeDasharray="2 4" />

          {/* intercity: the cities lived in */}
          <text x={rtl ? lay.W - 8 : 8} y={icY + 4} textAnchor={rtl ? 'end' : 'start'} className="fill-[#555] text-[12px] font-bold">
            {t('metro.intercity')}
          </text>
          <line x1={r2(px(first))} x2={r2(px(nowP))} y1={icY - 3} y2={icY - 3} stroke="#8c8c8c" strokeWidth={2.5} />
          <line x1={r2(px(first))} x2={r2(px(nowP))} y1={icY + 3} y2={icY + 3} stroke="#8c8c8c" strokeWidth={2.5} />
          {lay.stops.map((s) => {
            const x = px(s.p);
            const near = rtl ? x < 60 : x > lay.W - 60;
            const anchor = near ? (rtl ? 'start' : 'end') : 'middle';
            const ax = near ? x + (rtl ? -6 : 6) : x;
            return (
              <g key={s.id}>
                <rect x={r2(x - 6)} y={icY - 9} width={12} height={18} rx={4} fill="#fff" stroke="#1a1a1a" strokeWidth={2.5} />
                <text x={r2(ax)} y={icY - 15 - s.tier * 14} textAnchor={anchor} className="mt-halo fill-[#1a1a1a] text-[12px] font-bold">
                  {s.city}
                </text>
                <text x={r2(ax)} y={icY + 24 + s.tier * 13} textAnchor={anchor} className="mt-mono mt-halo fill-[#555] text-[10.5px]">
                  {s.period}
                </text>
              </g>
            );
          })}
          <g className="mt-train" style={{ '--mt-from': `${r2(px(first) - px(nowP))}px` } as CSSProperties}>
            <rect x={r2(px(nowP) - 9)} y={icY - 5} width={18} height={10} rx={5} fill="#d8232a" stroke="#fff" strokeWidth={1.5} />
          </g>

          {/* lines */}
          {LINES.map((l) => {
            const segs = lay.segs[l.id];
            if (!segs.length) return null;
            const y = laneY[l.id];
            const a = segs[0][0];
            const b = segs[segs.length - 1][1];
            const open = stations.some((s) => s.line === l.id && s.open);
            const dim = hl !== null && hl !== l.id;
            return (
              <g key={l.id} className={cn('transition-opacity', dim && 'mt-dim')}>
                <circle cx={rtl ? lay.W - 20 : 20} cy={y} r={12} fill={l.color} />
                <text x={rtl ? lay.W - 20 : 20} y={y + 4.5} textAnchor="middle" className="fill-white text-[12.5px] font-extrabold">
                  {l.letter}
                </text>
                <text x={rtl ? lay.W - 39 : 39} y={y + 4.5} textAnchor={rtl ? 'end' : 'start'} className="fill-[#1a1a1a] text-[12.5px] font-bold">
                  {t(`metro.lines.${l.id}`)}
                </text>
                <line x1={r2(px(a))} x2={r2(px(b))} y1={y} y2={y} stroke={l.color} strokeWidth={2} strokeDasharray="5 5" opacity={0.75} />
                {segs.map(([s0, s1], i) => (
                  <line key={i} x1={r2(px(s0 - 6))} x2={r2(px(s1 + 6))} y1={y} y2={y} stroke={l.color} strokeWidth={8} strokeLinecap="round" />
                ))}
                {open && <path d={rtl ? `M ${r2(px(b) - 6)} ${y - 9} l -12 9 l 12 9 z` : `M ${r2(px(b) + 6)} ${y - 9} l 12 9 l -12 9 z`} fill={l.color} />}
              </g>
            );
          })}
        </g>

        {/* leader lines under every label */}
        <g aria-hidden>
          {stations.map((s) => {
            const x = px(lay.pos.get(s.id)!);
            const y = laneY[s.line];
            const lb = lay.lab.get(s.id)!;
            const above = lb.side < 0;
            const ly = above ? y - 15 - lb.tier * TIER : y + 23 + lb.tier * TIER;
            return <line key={s.id} x1={r2(x)} x2={r2(x)} y1={above ? y - 9 : y + 9} y2={r2(above ? ly + 3 : ly - 11)} stroke={lineOf(s.line).color} strokeWidth={1.25} opacity={0.55} className={cn(hl !== null && hl !== s.line && 'mt-dim')} />;
          })}
        </g>

        {/* stations, in time order (this is also the Tab order) */}
        {stations.map((s) => {
          const L = lineOf(s.line);
          const x = px(lay.pos.get(s.id)!);
          const y = laneY[s.line];
          const lb = lay.lab.get(s.id)!;
          const above = lb.side < 0;
          const ly = above ? y - 15 - lb.tier * TIER : y + 23 + lb.tier * TIER;
          const sx = lb.dir * (rtl ? -1 : 1); // physical direction the label runs
          const tx = x + 8 * sx;
          const w = tw(s);
          const sel = selected === s.id;
          const dim = hl !== null && hl !== s.line;
          const interchange = s.transfers.length > 0;
          return (
            <g
              key={s.id}
              role="button"
              tabIndex={0}
              aria-pressed={sel}
              aria-label={`${stationTitle(s)}, ${stationOrg(s)}, ${s.item.period}`}
              onClick={() => onSelect(s)}
              onKeyDown={stationKeys(s, onSelect)}
              className={cn('mt-station transition-opacity', dim && 'mt-dim')}
            >
              {sel && <rect x={r2(sx > 0 ? tx - 4 : tx - w - 4)} y={r2(ly - 12)} width={r2(w + 8)} height={16.5} rx={3} fill="#ffd400" />}
              <text
                data-mt-label={s.id}
                x={r2(tx)}
                y={r2(ly)}
                textAnchor={sx > 0 ? 'start' : 'end'}
                className={cn('mt-label text-[12px] font-bold', sel ? 'mt-halo-sel' : 'mt-halo')}
              >
                {s.label}
              </text>
              {s.transfers.map((tl, k) => {
                const bx = tx + sx * (w + 11 + k * 15);
                return (
                  <g key={tl}>
                    <circle cx={r2(bx)} cy={r2(ly - 4)} r={6.5} fill={lineOf(tl).color} stroke="#fff" strokeWidth={1.5} />
                    <text x={r2(bx)} y={r2(ly - 0.8)} textAnchor="middle" className="fill-white text-[8.5px] font-extrabold">
                      {lineOf(tl).letter}
                    </text>
                  </g>
                );
              })}
              <circle className="mt-ring" cx={r2(x)} cy={y} r={14} />
              {s.open && <circle cx={r2(x)} cy={y} r={12.5} fill="none" stroke={L.color} strokeWidth={1.5} strokeDasharray="3 3" className="mt-pulse" />}
              <circle cx={r2(x)} cy={y} r={sel ? 9 : 7} fill={sel ? L.color : '#fff'} stroke={interchange ? '#1a1a1a' : L.color} strokeWidth={interchange ? 4 : 3.5} />
            </g>
          );
        })}
      </svg>
      <p className="mt-2 text-[12.5px] text-[var(--m-muted)]">{t('metro.notToScale')}</p>
    </div>
  );
}

/* ─────────────────────────────── narrow screens ─────────────────────────────── */

const LANE = 15;
const LANE0 = 10;

function StripList({ data, stations, selected, onSelect, hl }: { data: SiteData; stations: Station[]; selected: string | null; onSelect: (s: Station | null) => void; hl: LineId | null }) {
  const t = useTranslations();
  const n = stations.length;
  const ranges = LINES.map((l) => {
    const idx = stations.flatMap((s, i) => (s.line === l.id ? [i] : []));
    if (!idx.length) return null;
    return [idx[0], stations.some((s) => s.line === l.id && s.open) ? n - 1 : idx[idx.length - 1]] as const;
  });
  const pad = LANE0 + LINES.length * LANE + 10;
  return (
    <div>
      <div className="mb-4 rounded-[10px] bg-[#f4f4f1] px-3 py-2.5">
        <p className="flex items-center gap-2 text-[12px] font-bold text-[var(--m-muted)]">
          <svg width="22" height="8" aria-hidden>
            <line x1="0" x2="22" y1="1.5" y2="1.5" stroke="#8c8c8c" strokeWidth="2" />
            <line x1="0" x2="22" y1="6.5" y2="6.5" stroke="#8c8c8c" strokeWidth="2" />
          </svg>
          {t('metro.intercity')}
        </p>
        <ol className="mt-1.5 flex flex-wrap items-baseline gap-x-1.5 gap-y-1 text-[13.5px]">
          {data.journey.map((j, i) => (
            <li key={j.id} className="flex items-baseline gap-1.5">
              {i > 0 && (
                <span aria-hidden className="text-[var(--m-muted)]">
                  {data.dir === 'rtl' ? '←' : '→'}
                </span>
              )}
              <span className="font-bold">{j.city}</span>
              <span className="mt-mono text-[11.5px] text-[var(--m-muted)]">{j.period}</span>
            </li>
          ))}
        </ol>
      </div>
      <div className="relative mb-1 h-5" aria-hidden>
        {LINES.map((l, k) => (
          <span
            key={l.id}
            lang="en"
            className={cn('absolute top-0 grid size-[14px] place-items-center rounded-full text-[8.5px] font-extrabold leading-none text-white', hl && hl !== l.id && 'opacity-25')}
            style={{ insetInlineStart: LANE0 + k * LANE - 4, background: l.color }}
          >
            {l.letter}
          </span>
        ))}
      </div>
      <ol>
        {stations.map((s, i) => {
          const li = LINES.findIndex((l) => l.id === s.line);
          const sel = selected === s.id;
          const dim = hl !== null && hl !== s.line;
          return (
            <li key={s.id} className="relative">
              {ranges.map((r, k) =>
                r && i >= r[0] && i <= r[1] ? (
                  <span
                    key={k}
                    aria-hidden
                    className={cn('absolute w-[6px]', i === r[0] && 'rounded-t-full', i === r[1] && 'rounded-b-full', hl && hl !== LINES[k].id && 'opacity-20')}
                    style={{ insetInlineStart: LANE0 + k * LANE, top: i === r[0] ? 22 : 0, bottom: i === r[1] ? 'calc(100% - 22px)' : 0, background: LINES[k].color }}
                  />
                ) : null,
              )}
              <span
                aria-hidden
                className={cn('absolute size-4 rounded-full border-[3.5px]', dim && 'opacity-30')}
                style={{ insetInlineStart: LANE0 + li * LANE - 5, top: 14, borderColor: s.transfers.length ? '#1a1a1a' : lineOf(s.line).color, background: sel ? lineOf(s.line).color : '#fff' }}
              />
              <button
                type="button"
                aria-expanded={sel}
                onClick={() => onSelect(sel ? null : s)}
                onKeyDown={(e) => e.key === 'Escape' && onSelect(null)}
                className={cn('mt-row block w-full rounded-[8px] py-2.5 pe-2 text-start', sel && 'bg-[#fff7c2]', dim && 'opacity-40')}
                style={{ paddingInlineStart: pad }}
              >
                <span className="block text-[15px] font-bold leading-snug">
                  {stationTitle(s)}
                  {s.transfers.map((tl) => (
                    <span key={tl} lang="en" aria-hidden className="ms-1.5 inline-grid size-[17px] place-items-center rounded-full align-[1px] text-[9.5px] font-extrabold text-white" style={{ background: lineOf(tl).color }}>
                      {lineOf(tl).letter}
                    </span>
                  ))}
                </span>
                <span className="block text-[13px] text-[var(--m-muted)]">
                  {stationOrg(s)} · {s.item.period}
                </span>
              </button>
              {sel && (
                <div className="pb-4 pe-2 pt-1" style={{ paddingInlineStart: pad }}>
                  <StationSign s={s} data={data} compact />
                </div>
              )}
            </li>
          );
        })}
      </ol>
      <p className="mt-3 text-[12.5px] text-[var(--m-muted)]">{t('metro.notToScaleVertical')}</p>
    </div>
  );
}

/* ─────────────────────────────── station sign ─────────────────────────────── */

export function StationSign({ s, data, compact = false }: { s: Station; data: SiteData; compact?: boolean }) {
  const t = useTranslations();
  const L = lineOf(s.line);
  const via = s.via ? data.education.find((e) => `edu-${e.id}` === s.via) : null;
  const thesis = s.kind === 'education' && s.item.id === 'tehran' ? data.publications.find((p) => p.type === 'Master Thesis') : null;
  const lineName = (id: LineId) => (id === 'education' ? t('sections.education.title') : t(`kinds.${id}`));
  const rows = (
    <dl className={cn('grid gap-x-4 gap-y-1.5 text-[14px]', compact ? 'grid-cols-[minmax(0,auto)_minmax(0,1fr)]' : 'px-5 py-4 sm:grid-cols-[9rem_minmax(0,1fr)]')}>
      <dt className="text-[var(--m-muted)]">{s.kind === 'role' ? t('common.organisation') : t('metro.institution')}</dt>
      <dd className="font-semibold">{stationOrg(s)}</dd>
      <dt className="text-[var(--m-muted)]">{t('common.location')}</dt>
      <dd>{s.item.location || '—'}</dd>
      <dt className="text-[var(--m-muted)]">{t('common.period')}</dt>
      <dd>
        {s.item.period}
        {s.kind === 'role' && s.item.months ? (
          <span className="text-[var(--m-muted)]">
            {dot(data.locale)}
            {t('common.months', { count: s.item.months })}
          </span>
        ) : null}
      </dd>
      {s.kind === 'education' && s.item.gpa && (
        <>
          <dt className="text-[var(--m-muted)]">{t('common.gpa')}</dt>
          <dd>
            <bdi dir="ltr">{s.item.gpa}</bdi>
          </dd>
        </>
      )}
    </dl>
  );
  const transfer =
    s.transfers.length > 0 ? (
      <p className={cn('flex flex-wrap items-center gap-2 text-[13.5px] font-semibold', compact ? 'mt-3' : 'border-t border-[var(--m-line)] px-5 py-3')}>
        {s.transfers.map((tl) => (
          <span key={tl} lang="en" aria-hidden className="grid size-5 place-items-center rounded-full text-[10.5px] font-extrabold text-white" style={{ background: lineOf(tl).color }}>
            {lineOf(tl).letter}
          </span>
        ))}
        {s.kind === 'role' && via ? t('metro.transferRole', { line: lineName('education'), place: via.institution }) : t('metro.transferEdu', { lines: s.transfers.map(lineName).join(' · ') })}
      </p>
    ) : null;
  const body = (
    <>
      {s.kind === 'role' && <p className={cn('text-[15px] leading-relaxed', compact ? 'mt-3' : 'border-t border-[var(--m-line)] px-5 py-4')}>{s.item.description}</p>}
      {thesis && (
        <p className={cn('text-[14px] text-[var(--m-muted)]', compact ? 'mt-3' : 'border-t border-[var(--m-line)] px-5 py-4')}>
          {t('common.thesis')}: <bdi lang="en">{thesis.title}</bdi>
        </p>
      )}
      {transfer}
    </>
  );
  if (compact)
    return (
      <div className="rounded-[10px] border border-[var(--m-line)] bg-white p-4">
        {rows}
        {body}
      </div>
    );
  return (
    <article className="overflow-hidden rounded-[12px] border border-[var(--m-line)] bg-white">
      <header className="flex items-center gap-3 px-5 py-3 text-white" style={{ background: L.color }}>
        <span className="grid size-8 shrink-0 place-items-center rounded-full bg-white text-[14px] font-extrabold" style={{ color: L.color }} lang="en" aria-hidden>
          {L.letter}
        </span>
        <div className="min-w-0">
          <p className="text-[12px] font-semibold uppercase tracking-wider opacity-95 rtl:normal-case rtl:tracking-normal">
            {t('metro.station')} · {lineName(s.line)}
          </p>
          <h3 className="text-[18px] font-extrabold leading-snug">{stationTitle(s)}</h3>
        </div>
      </header>
      {rows}
      {body}
    </article>
  );
}
