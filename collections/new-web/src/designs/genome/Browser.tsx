'use client';

import { useCallback, useEffect, useMemo, useRef, useState, type KeyboardEvent as RKeyboardEvent } from 'react';
import { useReducedMotion } from 'motion/react';
import { useTranslations } from 'next-intl';
import { scaleLinear, select, zoom as d3zoom, zoomIdentity, type ZoomBehavior, type ZoomTransform } from 'd3';
import { r2 } from '@/lib/derive';
import { fmtYear, numberLocale } from '@/lib/format';
import { CATEGORY_COLOR, stain, TRACK_COLOR, TRACKS, type Feature, type Gene, type Model, type TrackId } from './model';

const ROW_H = 20;
const COURSE_ROW_H = 9;
const ROW_GAP = 4;
const TRACK_PAD = 7;
const RULER_H = 30;
const PAD = 14;

function useWidth(ref: React.RefObject<HTMLElement | null>, initial = 1100) {
  const [w, setW] = useState(initial);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const ro = new ResizeObserver(([e]) => setW(Math.round(e.contentRect.width)));
    ro.observe(el);
    return () => ro.disconnect();
  }, [ref]);
  return w;
}

const rowH = (t: TrackId) => (t === 'courses' ? COURSE_ROW_H : ROW_H);
const trackHeight = (t: TrackId, rows: number) => rows * rowH(t) + (rows - 1) * (t === 'courses' ? 2 : ROW_GAP) + TRACK_PAD * 2;

export interface ViewFocus {
  range: [number, number];
  nonce: number;
}

/* ─────────────────────────────────── main browser (chrRY) ─────────────────────────────────── */

export function Browser({
  model,
  locale,
  rtl,
  visible,
  selectedId,
  onSelect,
  focus,
  onView,
  command,
}: {
  model: Model;
  locale: string;
  rtl: boolean;
  visible: Set<TrackId>;
  selectedId: string | null;
  onSelect: (f: Feature) => void;
  focus: ViewFocus | null;
  onView: (r: [number, number]) => void;
  /** toolbar commands (zoom in/out, pan) — a new nonce triggers the command */
  command?: { op: 'in' | 'out' | 'back' | 'fwd'; nonce: number } | null;
}) {
  const t = useTranslations();
  const reduce = useReducedMotion();
  const wrap = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const zoomRef = useRef<ZoomBehavior<SVGSVGElement, unknown> | null>(null);
  const W = useWidth(wrap);
  const LABEL = W < 640 ? 74 : 116;
  const [tf, setTf] = useState<ZoomTransform>(zoomIdentity);
  const [hover, setHover] = useState<{ f: Feature; x: number; y: number } | null>(null);

  // data area: [LABEL, W - PAD] in LTR; mirrored in RTL (labels on the right, time runs right → left)
  const x0 = useMemo(() => scaleLinear().domain(model.domain).range(rtl ? [W - LABEL, PAD] : [LABEL, W - PAD]), [model.domain, W, LABEL, rtl]);
  const x = useMemo(() => tf.rescaleX(x0), [tf, x0]);
  const areaL = rtl ? PAD : LABEL;
  const areaR = rtl ? W - LABEL : W - PAD;

  const tracks = TRACKS.filter((tr) => visible.has(tr));
  const layout = useMemo(() => {
    let y = RULER_H;
    return tracks.map((tr) => {
      const h = trackHeight(tr, model.rows[tr]);
      const o = { tr, y, h };
      y += h;
      return o;
    });
  }, [tracks, model.rows]);
  const H = (layout.at(-1)?.y ?? RULER_H) + (layout.at(-1)?.h ?? 0) + 6;

  // zoom behaviour (re-created when the size changes)
  useEffect(() => {
    const svg = svgRef.current;
    if (!svg) return;
    const ext: [[number, number], [number, number]] = [
      [areaL, 0],
      [areaR, H],
    ];
    const z = d3zoom<SVGSVGElement, unknown>()
      .scaleExtent([1, 40])
      .extent(ext)
      .translateExtent(ext)
      // the page keeps scrolling: wheel zooms only with Ctrl (trackpad pinch), touch only with two fingers
      .filter((e: Event) => {
        if (e.type === 'wheel') return (e as WheelEvent).ctrlKey;
        if (e.type.startsWith('touch')) return (e as TouchEvent).touches.length > 1;
        return !(e as MouseEvent).button;
      })
      .on('zoom', (e) => setTf(e.transform));
    zoomRef.current = z;
    const sel = select(svg);
    sel.call(z);
    // horizontal wheel / trackpad swipe pans the view
    const onWheel = (e: WheelEvent) => {
      if (e.ctrlKey || Math.abs(e.deltaX) <= Math.abs(e.deltaY)) return;
      e.preventDefault();
      const k = (svg as SVGSVGElement & { __zoom?: ZoomTransform }).__zoom?.k ?? 1;
      z.translateBy(sel, -e.deltaX / k, 0);
    };
    svg.addEventListener('wheel', onWheel, { passive: false });
    return () => {
      sel.on('.zoom', null);
      svg.removeEventListener('wheel', onWheel);
    };
  }, [areaL, areaR, H]);

  // report the visible range
  useEffect(() => {
    const a = x.invert(rtl ? areaR : areaL);
    const b = x.invert(rtl ? areaL : areaR);
    onView([a, b]);
  }, [x, areaL, areaR, rtl, onView]);

  const zoomTo = useCallback(
    (range: [number, number]) => {
      const svg = svgRef.current;
      const z = zoomRef.current;
      if (!svg || !z) return;
      const [r0, r1] = x0.range();
      const k = Math.max(1, Math.min(40, (r1 - r0) / (x0(range[1]) - x0(range[0]))));
      const tx = r0 - k * x0(range[0]);
      const next = zoomIdentity.translate(tx, 0).scale(k);
      const sel = select(svg);
      if (reduce) sel.call(z.transform, next);
      else sel.transition().duration(650).call(z.transform, next);
    },
    [x0, reduce],
  );

  useEffect(() => {
    if (focus) zoomTo(focus.range);
  }, [focus, zoomTo]);

  useEffect(() => {
    const svg = svgRef.current;
    const z = zoomRef.current;
    if (!command || !svg || !z) return;
    const sel = reduce ? select(svg) : select(svg).transition().duration(300);
    const k = (svg as SVGSVGElement & { __zoom?: ZoomTransform }).__zoom?.k ?? 1;
    const dx = ((areaR - areaL) * 0.25) / k;
    // "back" = towards earlier years (left in LTR, right in RTL)
    if (command.op === 'in') z.scaleBy(sel as never, 1.6);
    else if (command.op === 'out') z.scaleBy(sel as never, 1 / 1.6);
    else z.translateBy(sel as never, (command.op === 'back' ? 1 : -1) * (rtl ? -dx : dx), 0);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [command]);

  const onKey = (e: RKeyboardEvent) => {
    const svg = svgRef.current;
    const z = zoomRef.current;
    if (!svg || !z) return;
    const sel = select(svg);
    const step = (rtl ? -1 : 1) * 60;
    if (e.key === 'ArrowLeft') z.translateBy(sel, step / tf.k, 0);
    else if (e.key === 'ArrowRight') z.translateBy(sel, -step / tf.k, 0);
    else if (e.key === '+' || e.key === '=') z.scaleBy(sel, 1.5);
    else if (e.key === '-' || e.key === '_') z.scaleBy(sel, 1 / 1.5);
    else if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
      // walk through the features in time order
      const list = model.features.filter((f) => visible.has(f.track)).sort((a, b) => a.start - b.start);
      if (!list.length) return;
      const i = list.findIndex((f) => f.id === selectedId);
      const n = e.key === 'ArrowDown' ? (i + 1) % list.length : (i - 1 + list.length) % list.length;
      onSelect(list[n]);
      const f = list[n];
      const vis = x.domain();
      if (f.start < Math.min(...vis) || f.start > Math.max(...vis)) zoomTo([f.start - 0.5, f.end + 0.5]);
    } else return;
    e.preventDefault();
  };

  // ruler ticks
  const span = Math.abs(x.invert(areaR) - x.invert(areaL));
  const ticks = useMemo(() => {
    const [a, b] = [Math.min(x.invert(areaL), x.invert(areaR)), Math.max(x.invert(areaL), x.invert(areaR))];
    if (span > 3.5) {
      const every = span > 9 && W < 700 ? 2 : 1;
      const out: Array<{ v: number; label: string; major: boolean }> = [];
      for (let y = Math.ceil(a); y <= b; y++) if (y % every === 0) out.push({ v: y, label: fmtYear(locale, y), major: true });
      return out;
    }
    const monthStep = span > 1.6 ? 3 : span > 0.7 ? 2 : 1;
    const fmt = new Intl.DateTimeFormat(numberLocale(locale), { month: 'short', timeZone: 'UTC' });
    const out: Array<{ v: number; label: string; major: boolean }> = [];
    for (let m = Math.ceil(a * 12); m <= b * 12; m++) {
      const y = Math.floor(m / 12);
      const mo = ((m % 12) + 12) % 12;
      if (mo % monthStep) continue;
      out.push({ v: m / 12, label: mo === 0 ? fmtYear(locale, y) : fmt.format(new Date(Date.UTC(2000, mo, 1))), major: mo === 0 });
    }
    return out;
  }, [x, areaL, areaR, span, locale, W]);

  const trackLabel = (tr: TrackId) => t(`genome.tracks.${tr}`);
  const clipId = 'gb-clip';

  return (
    <div ref={wrap} className="relative">
      <p id="gb-help" className="sr-only">
        {t('genome.keyboardHint')}
      </p>
      <div
        tabIndex={0}
        role="group"
        aria-label={t('genome.browserLabel')}
        aria-describedby="gb-help"
        onKeyDown={onKey}
        className="gb-focus rounded-md outline-offset-2"
      >
        {/* dir=ltr: text anchors are computed explicitly for RTL below */}
        <svg ref={svgRef} direction="ltr" width={W} height={H} viewBox={`0 0 ${W} ${H}`} className="block touch-pan-y select-none" onMouseLeave={() => setHover(null)}>
          <defs>
            <clipPath id={clipId}>
              <rect x={areaL} y={0} width={Math.max(0, areaR - areaL)} height={H} />
            </clipPath>
          </defs>

          {/* track backgrounds + labels */}
          {layout.map(({ tr, y, h }, i) => (
            <g key={tr}>
              <rect x={0} y={y} width={W} height={h} fill={i % 2 ? '#ffffff' : '#f8f9fb'} />
              <line x1={0} x2={W} y1={y + h} y2={y + h} stroke="#e3e6eb" />
              <text x={rtl ? W - 10 : 10} y={y + h / 2 + 4} textAnchor={rtl ? 'end' : 'start'} className="fill-[#3b4458] text-[11.5px] font-medium">
                {trackLabel(tr)}
              </text>
              <rect x={rtl ? W - LABEL - 1 : LABEL} y={y} width={1} height={h} fill="#e3e6eb" />
            </g>
          ))}

          {/* ruler */}
          <g>
            <rect x={0} y={0} width={W} height={RULER_H} fill="#ffffff" />
            <line x1={areaL} x2={areaR} y1={RULER_H - 0.5} y2={RULER_H - 0.5} stroke="#c4c9d2" />
            <text x={rtl ? W - 10 : 10} y={19} textAnchor={rtl ? 'end' : 'start'} className="gb-mono fill-[#566074] text-[11px]">
              chrRY
            </text>
            <g clipPath={`url(#${clipId})`}>
              {ticks.map((tk) => (
                <g key={tk.v} transform={`translate(${r2(x(tk.v))} 0)`} className={(rtl ? x(tk.v) - areaL < 30 : areaR - x(tk.v) < 30) ? '[&>text]:hidden' : undefined}>
                  <line y1={tk.major ? 8 : 16} y2={RULER_H} stroke={tk.major ? '#8a93a3' : '#c4c9d2'} />
                  <line y1={RULER_H} y2={H} stroke={tk.major ? '#eceff3' : '#f3f4f7'} />
                  <text x={rtl ? -4 : 4} y={14} textAnchor={rtl ? 'end' : 'start'} className={tk.major ? 'fill-[#1b2230] text-[11px] font-semibold' : 'fill-[#566074] text-[10.5px]'}>
                    {tk.label}
                  </text>
                </g>
              ))}
              {/* today */}
              <line x1={r2(x(model.now))} x2={r2(x(model.now))} y1={RULER_H} y2={H} stroke="#c0392b" strokeDasharray="3 3" />
            </g>
          </g>

          {/* features */}
          <g clipPath={`url(#${clipId})`}>
            {layout.map(({ tr, y }) =>
              model.features
                .filter((f) => f.track === tr)
                .map((f) => {
                  const a = x(f.start);
                  const b = x(f.end);
                  const left = Math.min(a, b);
                  const isPoint = f.kind === 'course' || f.kind === 'publication';
                  const w = isPoint ? Math.max(3, Math.abs(b - a)) : Math.max(3, Math.abs(b - a));
                  const fy = y + TRACK_PAD + f.row * (rowH(tr) + (tr === 'courses' ? 2 : ROW_GAP));
                  const h = rowH(tr);
                  const sel = f.id === selectedId;
                  // label inside the glyph, shortened with … when it does not fit
                  const maxChars = Math.floor((w - 14) / 6.3);
                  const fits = !isPoint && maxChars >= 6;
                  const shown = f.label.length > maxChars ? `${f.label.slice(0, Math.max(1, maxChars - 1)).trimEnd()}…` : f.label;
                  return (
                    <g
                      key={f.id}
                      className="cursor-pointer"
                      onClick={() => onSelect(f)}
                      onMouseMove={(e) => {
                        const r = wrap.current!.getBoundingClientRect();
                        setHover({ f, x: e.clientX - r.left, y: e.clientY - r.top });
                      }}
                      onMouseLeave={() => setHover(null)}
                    >
                      {f.kind === 'publication' ? (
                        <>
                          <line x1={r2(a)} x2={r2(a)} y1={fy + h} y2={fy + 6} stroke={TRACK_COLOR[tr]} strokeWidth={2} />
                          <circle cx={r2(a)} cy={fy + 6} r={sel ? 6.5 : 5} fill={TRACK_COLOR[tr]} stroke={sel ? '#111827' : '#fff'} strokeWidth={sel ? 2 : 1.5} />
                        </>
                      ) : (
                        <rect
                          x={r2(left)}
                          y={fy}
                          width={r2(w)}
                          height={h}
                          rx={isPoint ? 1 : 3}
                          fill={TRACK_COLOR[tr]}
                          stroke={sel ? '#111827' : 'none'}
                          strokeWidth={sel ? 2 : 0}
                          opacity={selectedId && !sel ? 0.78 : 1}
                        />
                      )}
                      {f.open && !isPoint && (
                        <path
                          d={rtl ? `M ${r2(left)} ${fy} l -7 ${h / 2} l 7 ${h / 2} z` : `M ${r2(left + w)} ${fy} l 7 ${h / 2} l -7 ${h / 2} z`}
                          fill={TRACK_COLOR[tr]}
                          opacity={0.55}
                        />
                      )}
                      {fits && (
                        <text
                          x={rtl ? r2(left + w - 7) : r2(left + 7)}
                          y={fy + 14}
                          textAnchor={rtl ? 'end' : 'start'}
                          className="pointer-events-none fill-white text-[11.5px] font-medium"
                        >
                          {shown}
                        </text>
                      )}
                    </g>
                  );
                }),
            )}
          </g>
        </svg>
      </div>

      {hover && (
        <div
          className="pointer-events-none absolute z-20 max-w-xs rounded-md border border-[#d9dde3] bg-white px-3 py-2 text-xs shadow-lg"
          style={{ left: Math.min(hover.x + 14, W - 260), top: hover.y + 16 }}
        >
          <p className="font-semibold text-[#1b2230]">{hover.f.label}</p>
          <p className="mt-0.5 text-[#566074]">{periodOf(hover.f, locale)}</p>
        </div>
      )}
    </div>
  );
}

export function periodOf(f: Feature, locale: string) {
  if (f.kind === 'role') return f.item.period;
  if (f.kind === 'education') return f.item.period;
  if (f.kind === 'course') return f.item.date ? new Intl.DateTimeFormat(numberLocale(locale), { year: 'numeric', month: 'short', timeZone: 'UTC' }).format(new Date(f.item.date + (f.item.date.length <= 7 ? '-01' : ''))) : '';
  return f.item.year ? fmtYear(locale, f.item.year) : '';
}

/* ───────────────────────────────── ideogram (overview) ───────────────────────────────── */

export function Ideogram({ model, view, rtl, locale, onJump }: { model: Model; view: [number, number]; rtl: boolean; locale: string; onJump: (center: number) => void }) {
  const t = useTranslations('genome');
  const wrap = useRef<HTMLDivElement>(null);
  const W = useWidth(wrap);
  const H = 64;
  const L = 8;
  const R = W - 8;
  const sx = scaleLinear().domain(model.domain).range(rtl ? [R, L] : [L, R]);
  const cen = model.centromere;
  const y0 = 22;
  const h = 18;
  const va = sx(Math.min(...view));
  const vb = sx(Math.max(...view));
  return (
    <div ref={wrap}>
      <svg
        direction="ltr"
        width={W}
        height={H}
        viewBox={`0 0 ${W} ${H}`}
        className="block cursor-pointer"
        role="img"
        aria-label={t('ideogramLabel')}
        onClick={(e) => {
          const r = (e.currentTarget as SVGSVGElement).getBoundingClientRect();
          onJump(sx.invert(e.clientX - r.left));
        }}
      >
        <defs>
          <clipPath id="ideo-clip">
            <path
              d={(() => {
                // rounded chromosome with a constriction at the centromere
                const a = sx(model.domain[0]);
                const b = sx(model.domain[1]);
                const c = cen ? sx(cen) : (a + b) / 2;
                const left = Math.min(a, b);
                const right = Math.max(a, b);
                const r = h / 2;
                return `M ${left + r} ${y0} L ${c - 6} ${y0} L ${c} ${y0 + 5} L ${c + 6} ${y0} L ${right - r} ${y0} A ${r} ${r} 0 0 1 ${right - r} ${y0 + h} L ${c + 6} ${y0 + h} L ${c} ${y0 + h - 5} L ${c - 6} ${y0 + h} L ${left + r} ${y0 + h} A ${r} ${r} 0 0 1 ${left + r} ${y0} Z`;
              })()}
            />
          </clipPath>
        </defs>
        <g clipPath="url(#ideo-clip)">
          {model.density.map((d) => {
            const a = sx(d.year);
            const b = sx(d.year + 1);
            return <rect key={d.year} x={r2(Math.min(a, b))} y={y0} width={r2(Math.abs(b - a))} height={h} fill={stain(d.count)} />;
          })}
        </g>
        <rect x={L} y={y0} width={R - L} height={h} rx={h / 2} fill="none" stroke="#6b7280" strokeWidth={1} clipPath="url(#ideo-clip)" />
        {cen && <path d={`M ${r2(sx(cen))} ${y0 - 2} v ${h + 4}`} stroke="#c0392b" strokeWidth={2} />}
        {/* viewport */}
        <rect x={r2(Math.min(va, vb))} y={y0 - 4} width={r2(Math.max(2, Math.abs(vb - va)))} height={h + 8} fill="none" stroke="#c0392b" strokeWidth={2} rx={2} />
        <text x={r2((sx(model.domain[0]) + (cen ? sx(cen) : sx(model.domain[0]))) / 2)} y={11} textAnchor="middle" className="fill-[#566074] text-[10.5px]">
          {t('armP')}
        </text>
        {cen && (
          <text x={r2((sx(cen) + sx(model.domain[1])) / 2)} y={11} textAnchor="middle" className="fill-[#566074] text-[10.5px]">
            {t('armQ')}
          </text>
        )}
        {[model.domain[0], model.domain[1]].map((y) => (
          <text key={y} x={r2(sx(y))} y={H - 4} textAnchor={(sx(y) < W / 2) === true ? 'start' : 'end'} className="fill-[#566074] text-[10px]">
            {fmtYear(locale, y)}
          </text>
        ))}
      </svg>
    </div>
  );
}

/* ───────────────────────────────── chrP (projects, ordinal) ───────────────────────────────── */

export function ProjectChromosome({ model, rtl, selectedId, onSelect, labels }: { model: Model; rtl: boolean; selectedId: string | null; onSelect: (g: Gene) => void; labels: Record<string, string> }) {
  const t = useTranslations('genome');
  const wrap = useRef<HTMLDivElement>(null);
  const W = useWidth(wrap);
  const n = model.genes.length;
  const L = 12;
  const R = W - 12;
  const pos = (i: number) => (rtl ? R - ((i + 0.5) / n) * (R - L) : L + ((i + 0.5) / n) * (R - L));
  const slot = (R - L) / n;
  const H = 104;
  // category bands
  const bands: Array<{ cat: string; from: number; to: number }> = [];
  model.genes.forEach((g, i) => {
    const last = bands.at(-1);
    if (last && last.cat === g.item.category) last.to = i;
    else bands.push({ cat: g.item.category, from: i, to: i });
  });
  const sel = model.genes.findIndex((g) => g.id === selectedId);
  const onKey = (e: RKeyboardEvent) => {
    const fwd = e.key === (rtl ? 'ArrowLeft' : 'ArrowRight');
    const back = e.key === (rtl ? 'ArrowRight' : 'ArrowLeft');
    if (!fwd && !back) return;
    e.preventDefault();
    const i = sel < 0 ? 0 : (sel + (fwd ? 1 : -1) + n) % n;
    onSelect(model.genes[i]);
  };
  return (
    <div ref={wrap}>
      <div tabIndex={0} role="group" aria-label={t('chrPLabel')} onKeyDown={onKey} className="gb-focus rounded-md">
        <svg direction="ltr" width={W} height={H} viewBox={`0 0 ${W} ${H}`} className="block">
          {bands.map((b, i) => {
            const a = pos(b.from) - (rtl ? -slot / 2 : slot / 2);
            const z = pos(b.to) + (rtl ? -slot / 2 : slot / 2);
            const x1 = Math.min(a, z);
            const w = Math.abs(z - a);
            return (
              <g key={b.cat + i}>
                <rect x={r2(x1)} y={8} width={r2(w)} height={12} fill={CATEGORY_COLOR[b.cat as keyof typeof CATEGORY_COLOR]} opacity={0.85} rx={i === 0 || i === bands.length - 1 ? 6 : 0} />
                {w > 70 && (
                  <text x={r2(x1 + w / 2)} y={33} textAnchor="middle" className="fill-[#3b4458] text-[10.5px] font-medium">
                    {labels[b.cat]}
                  </text>
                )}
              </g>
            );
          })}
          {model.genes.map((g, i) => {
            const cx = pos(i);
            const top = i % 2 ? 66 : 46;
            const len = Math.max(8, slot * 1.6);
            const exons = Math.max(1, g.item.tags.length);
            const color = CATEGORY_COLOR[g.item.category];
            const isSel = g.id === selectedId;
            const minus = g.index % 2 === 0;
            return (
              <g key={g.id} className="cursor-pointer" onClick={() => onSelect(g)}>
                <title>{g.item.title}</title>
                <rect x={r2(cx - slot / 2)} y={40} width={r2(slot)} height={46} fill="transparent" />
                <line x1={r2(cx - len / 2)} x2={r2(cx + len / 2)} y1={top + 5} y2={top + 5} stroke={color} strokeWidth={1.2} />
                {Array.from({ length: exons }, (_, k) => {
                  const ew = Math.max(2.5, (len / exons) * 0.55);
                  const ex = cx - len / 2 + (k + 0.5) * (len / exons) - ew / 2;
                  return <rect key={k} x={r2(ex)} y={top} width={r2(ew)} height={10} fill={color} rx={1} />;
                })}
                <path d={(minus !== rtl) ? `M ${r2(cx - len / 2 - 4)} ${top + 5} l 4 -3 v 6 z` : `M ${r2(cx + len / 2 + 4)} ${top + 5} l -4 -3 v 6 z`} fill={color} />
                {isSel && <rect x={r2(cx - len / 2 - 6)} y={top - 4} width={r2(len + 12)} height={18} fill="none" stroke="#111827" strokeWidth={1.5} rx={3} />}
              </g>
            );
          })}
        </svg>
      </div>
    </div>
  );
}
