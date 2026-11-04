import rough from 'roughjs';
import type { Options } from 'roughjs/bin/core';

/* rough.js generator with fixed seeds → SVG paths rendered on the server and the client alike.
   Numbers are rounded so tiny trig differences between Node and the browser never break hydration. */
const gen = rough.generator();
const rd = (d: string) => d.replace(/-?\d+(?:\.\d+)?(?:e-?\d+)?/g, (m) => String(Math.round(+m * 10) / 10));
type Drawable = ReturnType<typeof gen.rectangle>;

export const INK = { graphite: '#2b2b2b', blue: '#1d4ed8', red: '#c92a2a', hl: '#ffec85', margin: '#f0a3a3' };

function Paths({ items }: { items: Drawable[] }) {
  return (
    <>
      {items
        .flatMap((d) => gen.toPaths(d))
        .map((p, i) => (
          <path key={i} d={rd(p.d)} stroke={p.stroke} strokeWidth={p.strokeWidth} fill={p.fill ?? 'none'} strokeLinecap="round" strokeLinejoin="round" />
        ))}
    </>
  );
}

const base = (seed: number, o: Options = {}): Options => ({ seed: (seed % 2147483646) + 1, roughness: 1.3, bowing: 1.2, stroke: INK.graphite, strokeWidth: 1.4, ...o });

/** a stable integer seed from a string */
export const seedOf = (s: string) => {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 16777619);
  return Math.abs(h) % 100000;
};

/** hand-drawn checkbox, optionally ticked */
export function Check({ seed, on = true, color = INK.blue, size = 20 }: { seed: number; on?: boolean; color?: string; size?: number }) {
  const items = [gen.rectangle(2, 3, 15, 15, base(seed, { roughness: 1.1 }))];
  if (on) items.push(gen.linearPath([[5, 10], [9, 15], [19, 1]], base(seed + 1, { stroke: color, strokeWidth: 2.1, roughness: 0.8 })));
  return (
    <svg width={size} height={size} viewBox="0 0 22 21" aria-hidden className="shrink-0 overflow-visible">
      <Paths items={items} />
    </svg>
  );
}

/** a pen loop around a short word; width from the character count */
export function Loop({ seed, chars, color = INK.red }: { seed: number; chars: number; color?: string }) {
  const w = Math.max(30, chars * 7.4 + 18);
  return (
    <svg width={w + 6} height={30} viewBox={`0 0 ${w + 6} 30`} aria-hidden className="pointer-events-none absolute -top-[4px] start-[-6px] overflow-visible">
      <Paths items={[gen.ellipse(w / 2 + 3, 15, w, 24, base(seed, { stroke: color, strokeWidth: 1.2, roughness: 1.1 }))]} />
    </svg>
  );
}

/** a curved hand arrow pointing down (between notebook entries) */
export function ArrowDown({ seed, color = INK.blue }: { seed: number; color?: string }) {
  const s = base(seed, { stroke: color, strokeWidth: 1.6, roughness: 1 });
  return (
    <svg width="34" height="54" viewBox="0 0 34 54" aria-hidden className="overflow-visible">
      <Paths items={[gen.curve([[18, 2], [8, 18], [20, 34], [16, 50]], s), gen.linearPath([[8, 42], [16, 51], [24, 41]], base(seed + 7, { stroke: color, strokeWidth: 1.6, roughness: 0.9 }))]} />
    </svg>
  );
}

/** two hand strokes under a total */
export function DoubleUnderline({ seed, width = 120, color = INK.red }: { seed: number; width?: number; color?: string }) {
  return (
    <svg width={width} height="12" viewBox={`0 0 ${width} 12`} aria-hidden className="block overflow-visible">
      <Paths items={[gen.line(2, 3, width - 2, 4, base(seed, { stroke: color, strokeWidth: 1.6 })), gen.line(6, 9, width - 6, 10, base(seed + 3, { stroke: color, strokeWidth: 1.6 }))]} />
    </svg>
  );
}

/** doodles for the cover: a DNA helix, an Erlenmeyer flask and a laptop */
export function Doodle({ kind, seed, size = 120 }: { kind: 'helix' | 'flask' | 'laptop'; seed: number; size?: number }) {
  let items: Drawable[] = [];
  if (kind === 'helix') {
    const a: [number, number][] = [];
    const b: [number, number][] = [];
    for (let i = 0; i <= 12; i++) {
      const y = 6 + i * 9;
      a.push([50 + Math.round(Math.sin(i * 0.7) * 26), y]);
      b.push([50 - Math.round(Math.sin(i * 0.7) * 26), y]);
    }
    items = [gen.curve(a, base(seed, { stroke: INK.blue, strokeWidth: 1.8 })), gen.curve(b, base(seed + 1, { stroke: INK.red, strokeWidth: 1.8 }))];
    for (let i = 1; i < 12; i += 2) items.push(gen.line(a[i][0], a[i][1], b[i][0], b[i][1], base(seed + 10 + i, { strokeWidth: 1.1 })));
  } else if (kind === 'flask') {
    items = [
      gen.polygon(
        [
          [40, 8],
          [60, 8],
          [60, 44],
          [88, 100],
          [12, 100],
          [40, 44],
        ],
        base(seed, { strokeWidth: 1.8 }),
      ),
      gen.polygon(
        [
          [33, 68],
          [67, 68],
          [82, 96],
          [18, 96],
        ],
        base(seed + 1, { stroke: 'none', fill: '#b9e3c6', fillStyle: 'hachure', hachureGap: 5, fillWeight: 1.4 }),
      ),
      gen.line(36, 8, 64, 8, base(seed + 2, { strokeWidth: 2.4 })),
      gen.circle(46, 84, 6, base(seed + 3, { stroke: INK.blue })),
      gen.circle(60, 76, 4, base(seed + 4, { stroke: INK.blue })),
    ];
  } else {
    items = [
      gen.rectangle(18, 18, 64, 44, base(seed, { strokeWidth: 1.8 })),
      gen.rectangle(25, 25, 50, 30, base(seed + 1, { stroke: INK.blue, strokeWidth: 1.1, fill: '#dbe7f3', fillStyle: 'hachure', hachureGap: 4 })),
      gen.polygon(
        [
          [10, 64],
          [90, 64],
          [98, 76],
          [2, 76],
        ],
        base(seed + 2, { strokeWidth: 1.8 }),
      ),
      gen.linearPath(
        [
          [32, 34],
          [26, 40],
          [32, 46],
        ],
        base(seed + 3, { stroke: INK.red, strokeWidth: 1.6 }),
      ),
      gen.linearPath(
        [
          [68, 34],
          [74, 40],
          [68, 46],
        ],
        base(seed + 4, { stroke: INK.red, strokeWidth: 1.6 }),
      ),
    ];
  }
  return (
    <svg width={size} height={size} viewBox="0 0 100 120" aria-hidden className="overflow-visible">
      <Paths items={items} />
    </svg>
  );
}

/** hachure bar chart of real band scores (0 … max) */
export function Bars({ rows, max, seed }: { rows: Array<{ label: string; value: number; text: string }>; max: number; seed: number }) {
  const W = 520;
  const rowH = 44;
  const L = 120;
  const H = rows.length * rowH + 30;
  const x = (v: number) => L + (v / max) * (W - L - 50);
  const items: Drawable[] = [gen.line(L, 8, L, H - 22, base(seed, { strokeWidth: 1.4 })), gen.line(L, H - 22, W - 30, H - 22, base(seed + 1, { strokeWidth: 1.4 }))];
  rows.forEach((r, i) => items.push(gen.rectangle(L + 2, 14 + i * rowH, x(r.value) - L - 2, 24, base(seed + 10 + i, { stroke: INK.blue, fill: i === rows.length - 1 ? '#c92a2a' : '#1d4ed8', fillStyle: 'hachure', hachureGap: 5, fillWeight: 1.2, strokeWidth: 1.4 }))));
  for (let t = 0; t <= max; t++) items.push(gen.line(x(t), H - 25, x(t), H - 18, base(seed + 40 + t, { strokeWidth: 1 })));
  return { W, H, L, rowH, x, paths: <Paths items={items} /> };
}

/** the education timeline: a hand line with one circle per step */
export function Timeline({ steps, seed }: { steps: number; seed: number }) {
  const W = 900;
  const xs = Array.from({ length: steps }, (_, i) => 80 + (i * (W - 160)) / Math.max(1, steps - 1));
  const items: Drawable[] = [gen.line(30, 40, W - 30, 42, base(seed, { strokeWidth: 1.8 })), gen.linearPath([[W - 46, 30], [W - 28, 42], [W - 46, 54]], base(seed + 1, { strokeWidth: 1.8 }))];
  xs.forEach((cx, i) => items.push(gen.circle(cx, 41, 30, base(seed + 5 + i, { stroke: i === steps - 1 ? INK.red : INK.blue, strokeWidth: 2, fill: '#fffdf6', fillStyle: 'solid' }))));
  return (
    <svg viewBox={`0 0 ${W} 80`} aria-hidden className="block h-auto w-full overflow-visible">
      <Paths items={items} />
    </svg>
  );
}

/** a stamp frame (box drawn twice) */
export function StampBox({ seed, w, color }: { seed: number; w: number; color: string }) {
  return (
    <svg width={w} height="30" viewBox={`0 0 ${w} 30`} aria-hidden className="pointer-events-none absolute inset-0 overflow-visible">
      <Paths items={[gen.rectangle(1, 1, w - 2, 28, base(seed, { stroke: color, strokeWidth: 1.8, roughness: 1.6 }))]} />
    </svg>
  );
}
