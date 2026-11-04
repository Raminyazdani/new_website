'use client';

import { useEffect, useMemo, useRef } from 'react';
import { Delaunay } from 'd3';
import { hash01, r2 } from '@/lib/derive';

const W = 720;
const H = 720;
const rd = (pts: [number, number][]) => pts.map(([x, y]) => `${r2(x)},${r2(y)}`).join(' ');

/** shrink a polygon towards its centroid and nudge it (a second watercolour wash) */
function wash(poly: [number, number][], k: number, dx: number, dy: number): [number, number][] {
  const cx = poly.reduce((s, p) => s + p[0], 0) / poly.length;
  const cy = poly.reduce((s, p) => s + p[1], 0) / poly.length;
  return poly.map(([x, y]) => [cx + (x - cx) * k + dx, cy + (y - cy) * k + dy]);
}

/**
 * Hero: a Voronoi tissue inside a round microscope field; one cell is highlighted. When `zoomed` turns
 * on, a CSS transform zooms into that cell (instant under reduced motion) and `onZoomEnd` follows.
 */
export function useTissue() {
  const cells = useMemo(() => {
    const pts: [number, number][] = [];
    const step = 86;
    for (let gy = -1; gy <= H / step + 1; gy++)
      for (let gx = -1; gx <= W / step + 1; gx++) {
        const k = `${gx},${gy}`;
        pts.push([gx * step + (gy % 2 ? step / 2 : 0) + (hash01(k, 1) - 0.5) * 44, gy * step * 0.9 + (hash01(k, 2) - 0.5) * 44]);
      }
    const v = Delaunay.from(pts).voronoi([-40, -40, W + 40, H + 40]);
    const out: Array<{ i: number; poly: [number, number][]; c: [number, number]; hot: boolean }> = [];
    let best = -1;
    let bestD = Infinity;
    pts.forEach((p, i) => {
      const d = Math.hypot(p[0] - W * 0.55, p[1] - H * 0.48);
      if (d < bestD) {
        bestD = d;
        best = i;
      }
    });
    pts.forEach((p, i) => {
      const poly = v.cellPolygon(i) as [number, number][] | null;
      if (!poly) return;
      out.push({ i, poly: poly.slice(0, -1), c: p, hot: i === best });
    });
    return out;
  }, []);
  return cells;
}

export function Tissue({ label, zoomed, onZoomEnd, reduce }: { label: string; zoomed: boolean; onZoomEnd: () => void; reduce: boolean }) {
  const cells = useTissue();
  const hot = cells.find((c) => c.hot)!;
  const done = useRef(onZoomEnd);
  done.current = onZoomEnd;
  const xs = hot.poly.map((p) => p[0]);
  const ys = hot.poly.map((p) => p[1]);
  const size = Math.max(Math.max(...xs) - Math.min(...xs), Math.max(...ys) - Math.min(...ys)) + 40;
  const cx = (Math.min(...xs) + Math.max(...xs)) / 2;
  const cy = (Math.min(...ys) + Math.max(...ys)) / 2;
  // zoom = a composited CSS transform around the highlighted cell; the scroll follows when it ends
  useEffect(() => {
    if (!zoomed) return;
    const id = window.setTimeout(() => done.current(), reduce ? 0 : 1000);
    return () => window.clearTimeout(id);
  }, [zoomed, reduce]);

  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      className="block h-full w-full"
      role="img"
      aria-label={label}
      style={{
        transformOrigin: `${r2((cx / W) * 100)}% ${r2((cy / H) * 100)}%`,
        transform: zoomed ? `scale(${r2(W / size)})` : 'none',
        transition: reduce ? 'none' : 'transform 0.95s cubic-bezier(0.65, 0, 0.35, 1)',
      }}
    >
      <rect x={-40} y={-40} width={W + 80} height={H + 80} fill="#fbe3cf" />
      {cells.map(({ i, poly, c, hot: isHot }) => {
        const j = hash01(`t${i}`);
        return (
          <g key={i}>
            <polygon points={rd(wash(poly, 0.94, 0, 0))} fill={isHot ? '#fde6d2' : ['#fbd9c0', '#fad2b6', '#fcdcc6'][i % 3]} />
            <polygon points={rd(wash(poly, 0.82, (j - 0.5) * 6, (hash01(`u${i}`) - 0.5) * 6))} fill="#f6b38e" fillOpacity={0.32} />
            <polygon points={rd(wash(poly, 0.94, 0, 0))} fill="none" stroke="#d9825b" strokeOpacity={isHot ? 0.95 : 0.55} strokeWidth={isHot ? 3 : 1.6} strokeLinejoin="round" />
            <ellipse cx={r2(c[0] + (j - 0.5) * 10)} cy={r2(c[1] + (hash01(`w${i}`) - 0.5) * 10)} rx={14 + j * 5} ry={12 + j * 4} fill="#c9b8ec" />
            <ellipse cx={r2(c[0] + (j - 0.5) * 10)} cy={r2(c[1] + (hash01(`w${i}`) - 0.5) * 10)} rx={14 + j * 5} ry={12 + j * 4} fill="none" stroke="#9d86d8" strokeOpacity={0.6} strokeWidth={1.2} />
            <circle cx={r2(c[0] + (j - 0.5) * 10 + 4)} cy={r2(c[1] + (hash01(`w${i}`) - 0.5) * 10 - 3)} r={4} fill="#9d86d8" />
          </g>
        );
      })}
      {/* the cell we zoom into */}
      <polygon points={rd(wash(hot.poly, 1.18, 0, 0))} fill="none" stroke="#2a2230" strokeWidth={1.6} strokeDasharray="5 5" />
    </svg>
  );
}
