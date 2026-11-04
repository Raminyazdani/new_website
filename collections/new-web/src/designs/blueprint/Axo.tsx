'use client';

import { useEffect, useRef, useState } from 'react';
import { motion, useMotionValue, useReducedMotion, useScroll, useTransform, type MotionValue } from 'motion/react';
import { useTranslations } from 'next-intl';
import { Lens } from '@/components/magicui/lens';
import { hash01, r2 } from '@/lib/derive';
import { fmtNum } from '@/lib/format';
import { useMedia } from '@/lib/useMedia';
import { cn } from '@/lib/utils';

/* isometric projection of a 250 × 250 slab, 16 thick; z grows upwards */
const C30 = Math.cos(Math.PI / 6);
const S = 250;
const T = 16;
const OX = 330;
const OY = 247;
export const AXO_W = 900;
export const AXO_H = 700;
const MID = 2; // index of the layer that stays put while the stack explodes around it
const GAP0 = 52;
const GAP1 = 80;

type Pt = [number, number];
const P = (x: number, y: number, z = 0): Pt => [r2(OX + (x - y) * C30), r2(OY + (x + y) * 0.5 - z)];
const pts = (...ps: Pt[]) => ps.map((p) => p.join(',')).join(' ');
const quad = (x0: number, y0: number, x1: number, y1: number, z: number) => pts(P(x0, y0, z), P(x1, y0, z), P(x1, y1, z), P(x0, y1, z));
/** a circle of radius r lying on the plane z = const projects to an axis-aligned ellipse */
const Ell = ({ x, y, z, r, className }: { x: number; y: number; z: number; r: number; className?: string }) => {
  const [cx, cy] = P(x, y, z);
  return <ellipse cx={cx} cy={cy} rx={r2(r * 1.2247)} ry={r2(r * 0.7071)} className={className ?? 'bp-face-top'} />;
};
const Ln = ({ a, b }: { a: Pt; b: Pt }) => <line x1={a[0]} y1={a[1]} x2={b[0]} y2={b[1]} />;

export interface Layer {
  id: 'wetlab' | 'bioprocess' | 'omics' | 'mldata' | 'softdevops';
  label: string;
  parts: number;
  href: string;
  note: string[];
}

/* ── what is drawn on top of each layer ── */
function Detail({ id }: { id: Layer['id'] }) {
  const z = T;
  if (id === 'wetlab') {
    return (
      <g>
        <polygon points={quad(22, 30, 228, 222, z)} className="bp-face-top" />
        {Array.from({ length: 24 }, (_, i) => (
          <Ell key={i} x={45 + (i % 6) * 32} y={60 + Math.floor(i / 6) * 42} z={z} r={10} />
        ))}
      </g>
    );
  }
  if (id === 'bioprocess') {
    const [cx, cyB] = P(125, 125, z);
    const h = 30;
    const rx = r2(44 * 1.2247);
    const ry = r2(44 * 0.7071);
    const cyT = r2(cyB - h);
    return (
      <g>
        {/* pipe to the slab edge */}
        <polyline points={pts(P(169, 125, z + 14), P(238, 125, z + 14), P(238, 125, z))} className="bp-line" />
        <polyline points={pts(P(125, 81, z + 8), P(125, 14, z + 8), P(125, 14, z))} className="bp-line" />
        {/* vessel */}
        <ellipse cx={cx} cy={cyB} rx={rx} ry={ry} className="bp-face-top" />
        <rect x={r2(cx - rx)} y={cyT} width={r2(rx * 2)} height={h} className="bp-fill" />
        <line x1={r2(cx - rx)} y1={cyT} x2={r2(cx - rx)} y2={cyB} />
        <line x1={r2(cx + rx)} y1={cyT} x2={r2(cx + rx)} y2={cyB} />
        <ellipse cx={cx} cy={cyT} rx={rx} ry={ry} className="bp-face-top" />
        {/* shaft + motor */}
        <line x1={cx} y1={cyT} x2={cx} y2={r2(cyT - 22)} />
        <rect x={r2(cx - 9)} y={r2(cyT - 34)} width={18} height={12} className="bp-face-top" />
      </g>
    );
  }
  if (id === 'omics') {
    // aligned reads (a pileup): deterministic segments along x
    const segs: Array<[number, number, number]> = [];
    for (let i = 0; i < 13; i++) {
      let x = 18 + hash01(`r${i}`) * 40;
      let j = 0;
      while (x < 205 && j < 4) {
        const len = 34 + hash01(`r${i}-${j}`) * 46;
        const end = Math.min(232, x + len);
        segs.push([r2(x), r2(end), 26 + i * 15.5]);
        x = end + 8 + hash01(`g${i}-${j}`) * 22;
        j++;
      }
    }
    return (
      <g>
        <polygon points={quad(12, 16, 238, 234, z)} className="bp-face-top bp-dash" />
        {segs.map(([a, b, y], k) => (
          <Ln key={k} a={P(a, y, z)} b={P(b, y, z)} />
        ))}
      </g>
    );
  }
  if (id === 'mldata') {
    const L = [
      { x: 55, ys: [62, 104, 146, 188] },
      { x: 125, ys: [42, 83, 125, 167, 208] },
      { x: 195, ys: [83, 125, 167] },
    ];
    return (
      <g>
        {L.slice(0, -1).flatMap((a, i) => a.ys.flatMap((y0) => L[i + 1].ys.map((y1) => <Ln key={`${i}-${y0}-${y1}`} a={P(a.x, y0, z)} b={P(L[i + 1].x, y1, z)} />)))}
        {L.flatMap((a) => a.ys.map((y) => <Ell key={`${a.x}-${y}`} x={a.x} y={y} z={z} r={9} />))}
      </g>
    );
  }
  // software & devops: a 3 × 3 grid of containers, drawn back to front
  const cubes = Array.from({ length: 9 }, (_, i) => ({
    x0: 26 + (i % 3) * 74,
    y0: 26 + Math.floor(i / 3) * 74,
    h: 12 + Math.round(hash01(`c${i}`) * 16),
  }));
  cubes.sort((a, b) => a.x0 + a.y0 - (b.x0 + b.y0));
  const s = 50;
  return (
    <g>
      {cubes.map(({ x0, y0, h }) => (
        <g key={`${x0}-${y0}`}>
          <polygon points={pts(P(x0 + s, y0, z + h), P(x0 + s, y0 + s, z + h), P(x0 + s, y0 + s, z), P(x0 + s, y0, z))} className="bp-face-r" />
          <polygon points={pts(P(x0, y0 + s, z + h), P(x0 + s, y0 + s, z + h), P(x0 + s, y0 + s, z), P(x0, y0 + s, z))} className="bp-face-l" />
          <polygon points={quad(x0, y0, x0 + s, y0 + s, z + h)} className="bp-face-top" />
        </g>
      ))}
    </g>
  );
}

function Slab({
  k,
  layer,
  gap,
  top,
  base,
  loc,
  seeLabel,
  compact,
}: {
  k: number;
  layer: Layer;
  gap: MotionValue<number>;
  top: boolean;
  base: boolean;
  loc: string;
  seeLabel: string;
  compact: boolean;
}) {
  const y = useTransform(gap, (g) => -(k - MID) * (T + g));
  const [rx, ry] = P(S, 0, T / 2);
  const by = ry;
  return (
    <motion.g style={{ y }}>
      {/* slab body */}
      <polygon points={pts(P(S, 0, T), P(S, S, T), P(S, S, 0), P(S, 0, 0))} className="bp-face-r" />
      <polygon points={pts(P(0, S, T), P(S, S, T), P(S, S, 0), P(0, S, 0))} className="bp-face-l" />
      <polygon points={quad(0, 0, S, S, T)} className="bp-face-top" />
      <Detail id={layer.id} />
      {/* top-of-stack extension line for the dimension */}
      {top && <line x1={P(0, S, T)[0] - 6} y1={P(0, S, T)[1]} x2={56} y2={P(0, S, T)[1]} className="bp-thin" />}
      {base && <line x1={P(0, S, 0)[0] - 6} y1={P(0, S, 0)[1]} x2={56} y2={P(0, S, 0)[1]} className="bp-thin" />}
      {/* leader + balloon */}
      <line x1={rx + 4} y1={by} x2={622} y2={by} className="bp-thin" />
      <a href={layer.href} aria-label={`${fmtNum(loc, k + 1)} · ${layer.label} — ${layer.note.join(loc === 'fa' ? '، ' : ' · ')} · ${seeLabel}`} className="bp-balloon">
        <circle cx={640} cy={by} r={compact ? 25 : 16} />
        <text x={640} y={by + (compact ? 8 : 5)} textAnchor="middle" className={cn('bp-balloon-n', compact && 'bp-balloon-lg')}>
          {fmtNum(loc, k + 1)}
        </text>
      </a>
      {!compact && (
        <>
          <text x={666} y={by - 3} className="bp-axo-label">
            {layer.label}
          </text>
          <text x={666} y={by + 15} className="bp-axo-sub">
            {layer.note.map((l, i) => (
              <tspan key={i} x={666} dy={i ? 15 : 0}>
                {l}
              </tspan>
            ))}
          </text>
        </>
      )}
    </motion.g>
  );
}

/**
 * S1: exploded axonometric of the skill stack. Layers separate while the sheet scrolls
 * (static under reduced motion); a crosshair with coordinate readout follows a fine pointer;
 * a magnifier (Magic UI Lens) can be switched on.
 */
export function Axo({ layers, total, loc }: { layers: Layer[]; total: number; loc: string }) {
  const t = useTranslations('blueprint');
  const wrap = useRef<HTMLDivElement>(null);
  const reduce = useReducedMotion();
  const [mounted, setMounted] = useState(false);
  const [lens, setLens] = useState(false);
  const [fine, setFine] = useState(false);
  // phones: the drawing renders at ~0.4×, so labels move into an HTML key under it
  const compact = useMedia('(max-width: 639px)');
  useEffect(() => {
    setMounted(true);
    setFine(window.matchMedia('(pointer: fine)').matches);
  }, []);
  const { scrollYProgress } = useScroll({
    target: wrap,
    offset: ['start 0.6', 'end start'],
  });
  const mapped = useTransform(scrollYProgress, [0, 0.7], [GAP0, GAP1]);
  const still = useMotionValue(GAP0);
  // direct scroll mapping (a spring kept the frame loop busy and made screenshots crawl)
  const gap = mounted && !reduce ? mapped : still;

  // dimension line between the bottom of the base and the top of the stack (both ends move)
  const n = layers.length;
  const dim = useTransform(gap, (g) => {
    const yb = r2(P(0, S, 0)[1] + MID * (T + g));
    const yt = r2(P(0, S, T)[1] - (n - 1 - MID) * (T + g));
    return `M 64 ${yb} L 64 ${yt} M 60 ${yb - 9} L 64 ${yb} L 68 ${yb - 9} M 60 ${yt + 9} L 64 ${yt} L 68 ${yt + 9}`;
  });
  const midY = r2((P(0, S, 0)[1] + P(0, S, T)[1]) / 2);

  const drawing = (
    <svg viewBox={compact ? `20 0 660 ${AXO_H}` : `0 0 ${AXO_W} ${AXO_H}`} direction="ltr" className="bp-axo block h-auto w-full" role="group" aria-label={t('axoLabel')}>
      {/* dimension (a reference count, hence the parentheses); symmetric explode keeps its middle still */}
      <motion.path d={dim} className="bp-thin" fill="none" />
      <text x={50} y={midY} transform={`rotate(-90 50 ${midY})`} textAnchor="middle" className="bp-axo-sub bp-dim">
        ({t('dimParts', { count: total })})
      </text>
      {layers.map((l, k) => (
        <Slab key={l.id} k={k} layer={l} gap={gap} top={k === n - 1} base={k === 0} loc={loc} seeLabel={t('seeBom')} compact={compact} />
      ))}
    </svg>
  );

  return (
    <div>
      <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
        <p className="bp-mono text-[11.5px] uppercase text-[#b8cde6] rtl:normal-case">{t('axoCaption')}</p>
        {fine && (
          <button type="button" aria-pressed={lens} onClick={() => setLens((v) => !v)} className={cn('bp-btn', lens && 'bp-btn-on')}>
            {t('lens')}
          </button>
        )}
      </div>
      <div ref={wrap} className="relative">
        {lens ? (
          <Lens zoomFactor={2.1} lensSize={190} lensColor="black" ariaLabel={t('lens')}>
            {drawing}
          </Lens>
        ) : (
          <Crosshair enabled={fine}>{drawing}</Crosshair>
        )}
      </div>
      {/* key under the drawing on phones (the SVG keeps only the numbered balloons there) */}
      <ol className="mt-4 space-y-2 text-[14px] sm:hidden">
        {[...layers].reverse().map((l) => {
          const k = layers.indexOf(l);
          return (
            <li key={l.id}>
              <a href={l.href} className="flex items-start gap-3">
                <span className="bp-mono grid size-7 shrink-0 place-items-center rounded-full border border-[#ffd479] text-[13px] font-bold text-[#ffd479]">{fmtNum(loc, k + 1)}</span>
                <span>
                  <span className="bp-sub block text-[15px] text-[#eef5ff]">{l.label}</span>
                  <span className="bp-mono block text-[12px] text-[#b8cde6]">{l.note.join(loc === 'fa' ? '، ' : ' · ')}</span>
                </span>
              </a>
            </li>
          );
        })}
      </ol>
    </div>
  );
}

/** Crosshair + coordinate readout in drawing units, for fine pointers over the drawing only. */
function Crosshair({ enabled, children }: { enabled: boolean; children: React.ReactNode }) {
  const box = useRef<HTMLDivElement>(null);
  const out = useRef<HTMLSpanElement>(null);
  const [on, setOn] = useState(false);
  const raf = useRef(0);
  if (!enabled) return <>{children}</>;
  return (
    <div
      ref={box}
      className={cn('bp-xhair relative', on && 'bp-xhair-on')}
      onPointerEnter={(e) => e.pointerType !== 'touch' && setOn(true)}
      onPointerLeave={() => setOn(false)}
      onPointerMove={(e) => {
        if (e.pointerType === 'touch') return;
        const el = box.current;
        if (!el) return;
        const r = el.getBoundingClientRect();
        const x = e.clientX - r.left;
        const y = e.clientY - r.top;
        cancelAnimationFrame(raf.current);
        raf.current = requestAnimationFrame(() => {
          el.style.setProperty('--hx', `${x}px`);
          el.style.setProperty('--hy', `${y}px`);
          if (out.current) out.current.textContent = `X ${((x / r.width) * AXO_W).toFixed(1).padStart(5, '0')}  Y ${((y / r.height) * AXO_H).toFixed(1).padStart(5, '0')}`;
        });
      }}
    >
      {children}
      <span aria-hidden className="bp-xh-v" />
      <span aria-hidden className="bp-xh-h" />
      <span aria-hidden ref={out} dir="ltr" className="bp-xh-out bp-mono" />
    </div>
  );
}
