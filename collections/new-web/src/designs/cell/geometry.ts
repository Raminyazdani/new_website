import { line as d3line, curveBasisClosed, curveCatmullRom } from 'd3';
import { hash01, r2 } from '@/lib/derive';

/* A deterministic cross-section of one cell in a 1000 × 680 drawing. Counts come from the caller (the CV). */
export const MAP_W = 1000;
export const MAP_H = 680;
const CX = 500;
const CY = 340;

export type OrgId = 'nucleus' | 'nucleolus' | 'chromatin' | 'mito' | 'er' | 'golgi' | 'vesicles' | 'ribosomes' | 'channels' | 'receptors';
export interface Box {
  x: number;
  y: number;
  w: number;
  h: number;
}

const rnd = (key: string) => hash01(key);
const closed = d3line<[number, number]>().curve(curveBasisClosed);
const open = d3line<[number, number]>().curve(curveCatmullRom.alpha(0.5));
const rd = (d: string | null) => (d ?? '').replace(/-?\d+\.\d+(?:e-?\d+)?/g, (m) => String(Math.round(+m * 10) / 10));

/** wobbly closed outline around (cx, cy) */
function blob(cx: number, cy: number, rx: number, ry: number, seed: string, wob = 0.05, n = 28) {
  const p1 = rnd(seed + 'a') * 6;
  const p2 = rnd(seed + 'b') * 6;
  const pts: [number, number][] = [];
  for (let i = 0; i < n; i++) {
    const a = (i / n) * Math.PI * 2;
    const k = 1 + wob * Math.sin(3 * a + p1) + wob * 0.6 * Math.sin(5 * a + p2);
    pts.push([cx + Math.cos(a) * rx * k, cy + Math.sin(a) * ry * k]);
  }
  return rd(closed(pts));
}
/** inside the (unwobbled) membrane ellipse, with a margin */
const insideCell = (x: number, y: number, m = 0) => ((x - CX) / (468 - m)) ** 2 + ((y - CY) / (312 - m)) ** 2 < 1;

export interface Counts {
  roles: number;
  courses: number;
  skills: number;
  languages: number;
  receptors: number;
  publications: number;
  degrees: number;
  /** projects per ER sheet (one sheet per category), outermost last */
  sheets: number[];
}

export function cellGeometry(c: Counts) {
  const occupied: Array<{ x: number; y: number; r: number }> = [];
  const free = (x: number, y: number, r: number, m = 4) => insideCell(x, y, r + 8) && occupied.every((o) => Math.hypot(o.x - x, o.y - y) > o.r + r + m);

  /* membrane */
  const membrane = blob(CX, CY, 470, 314, 'mem', 0.025, 36);
  const membraneIn = blob(CX, CY, 458, 302, 'mem', 0.025, 36);

  /* nucleus (identity), nucleolus (current focus), chromatin strands (degrees) */
  const N = { x: 392, y: 334, r: 132 };
  const nucleus = blob(N.x, N.y, N.r, N.r * 0.94, 'nuc', 0.03);
  const nucleusIn = blob(N.x, N.y, N.r - 8, N.r * 0.94 - 8, 'nuc', 0.03);
  const nucleolus = { x: 430, y: 298, r: 30, d: blob(430, 298, 30, 27, 'nol', 0.08, 18) };
  const chromatin = Array.from({ length: c.degrees }, (_, k) => {
    const pts: [number, number][] = [];
    let a = rnd(`ch${k}`) * Math.PI * 2;
    let x = N.x + Math.cos(a) * 40;
    let y = N.y + Math.sin(a) * 40;
    for (let i = 0; i < 16; i++) {
      pts.push([r2(x), r2(y)]);
      a += (rnd(`ch${k}-${i}`) - 0.5) * 1.6;
      x += Math.cos(a) * 16;
      y += Math.sin(a) * 16;
      const dx = x - N.x;
      const dy = y - N.y;
      const dist = Math.hypot(dx, dy);
      if (dist > N.r - 24) {
        x = N.x + (dx / dist) * (N.r - 26);
        y = N.y + (dy / dist) * (N.r - 26);
        a += Math.PI * 0.7;
      }
      if (Math.hypot(x - nucleolus.x, y - nucleolus.y) < nucleolus.r + 6) a += Math.PI / 2;
    }
    return rd(open(pts));
  });
  // nuclear pores (part of the envelope drawing, not an entry count)
  const pores = Array.from({ length: 14 }, (_, i) => {
    const a = (i / 14) * Math.PI * 2 + 0.2;
    return { x: r2(N.x + Math.cos(a) * (N.r - 3)), y: r2(N.y + Math.sin(a) * (N.r * 0.94 - 3)) };
  });
  occupied.push({ x: N.x, y: N.y, r: N.r + 6 });

  /* rough ER: one curved sheet per project category around the nucleus, bound ribosomes = projects */
  const a0 = (-78 * Math.PI) / 180;
  const a1 = (118 * Math.PI) / 180;
  const er = c.sheets.map((count, k) => {
    const R = N.r + 30 + k * 23;
    const pts: [number, number][] = [];
    for (let i = 0; i <= 24; i++) {
      const a = a0 + ((a1 - a0) * i) / 24;
      const w = 1 + 0.03 * Math.sin(a * 5 + k);
      pts.push([r2(N.x + Math.cos(a) * R * w), r2(N.y + Math.sin(a) * R * 0.97 * w)]);
    }
    const ribos = Array.from({ length: count }, (_, i) => {
      const a = a0 + ((a1 - a0) * (i + 0.5)) / Math.max(count, 1);
      const w = 1 + 0.03 * Math.sin(a * 5 + k);
      return { x: r2(N.x + Math.cos(a) * (R + 7) * w), y: r2(N.y + Math.sin(a) * (R + 7) * 0.97 * w) };
    });
    return { d: rd(open(pts)), ribos };
  });
  const erOuter = N.r + 30 + (c.sheets.length - 1) * 23 + 14;
  // the sheets only wrap the right/lower side: block that band with small circles along the arcs
  for (let k = 0; k < c.sheets.length; k++) {
    const R = N.r + 30 + k * 23;
    for (let i = 0; i <= 40; i++) {
      const a = a0 + ((a1 - a0) * i) / 40;
      occupied.push({ x: N.x + Math.cos(a) * R, y: N.y + Math.sin(a) * R * 0.97, r: 14 });
    }
  }

  /* Golgi: one cisterna per publication */
  const G = { x: 790, y: 300 };
  const golgi = Array.from({ length: c.publications }, (_, k) => {
    const len = 74 - k * 7;
    const y = G.y - 34 + k * 16;
    const bend = 14;
    return { d: `M ${G.x - len} ${y + bend} Q ${G.x} ${y - bend} ${G.x + len} ${y + bend}`, y };
  });
  occupied.push({ x: G.x, y: G.y, r: 86 });

  /* mitochondria: one per role */
  const mito: Array<{ x: number; y: number; rot: number; d: string; cristae: string }> = [];
  for (let tries = 0; mito.length < c.roles && tries < 8000; tries++) {
    const x = r2(70 + rnd(`m${tries}`) * 860);
    const y = r2(60 + rnd(`my${tries}`) * 560);
    if (!free(x, y, 34, 6)) continue;
    const rot = Math.round(rnd(`mr${tries}`) * 180);
    const L = 36;
    const H = 15;
    const d = `M ${-L + H} ${-H} H ${L - H} A ${H} ${H} 0 0 1 ${L - H} ${H} H ${-L + H} A ${H} ${H} 0 0 1 ${-L + H} ${-H} Z`;
    let cr = '';
    for (let k = 0; k < 5; k++) {
      const xx = -L + 14 + k * 11;
      cr += `M ${xx} ${k % 2 ? -10 : 10} L ${xx + 5} ${k % 2 ? 4 : -4} `;
    }
    mito.push({ x, y, rot, d, cristae: cr.trim() });
    occupied.push({ x, y, r: 34 });
  }

  /* vesicles: one per course, around the Golgi and towards the membrane */
  const vesicles: Array<{ x: number; y: number; r: number }> = [];
  for (let i = 0, tries = 0; vesicles.length < c.courses && tries < 6000; tries++) {
    const a = rnd(`v${tries}`) * Math.PI * 2;
    const dist = 92 + rnd(`vd${tries}`) * 150;
    const x = r2(G.x - 10 + Math.cos(a) * dist);
    const y = r2(G.y + 30 + Math.sin(a) * dist * 1.25);
    const r = 7 + Math.round(rnd(`vr${tries}`) * 3);
    if (free(x, y, r, 5)) {
      vesicles.push({ x, y, r });
      occupied.push({ x, y, r });
      i++;
    }
  }

  /* membrane proteins: ion channels (languages) on the left, receptors (contact) on the right */
  const onMembrane = (deg: number) => {
    const a = (deg * Math.PI) / 180;
    return { x: r2(CX + Math.cos(a) * 464), y: r2(CY + Math.sin(a) * 309), rot: r2((Math.atan2(Math.sin(a) / 309, Math.cos(a) / 464) * 180) / Math.PI) };
  };
  const channels = Array.from({ length: c.languages }, (_, i) => onMembrane(160 + i * 20));
  const receptors = Array.from({ length: c.receptors }, (_, i) => onMembrane(-40 + i * 16));

  /* free ribosomes: one per skill, scattered through the cytoplasm */
  const ribosomes: Array<{ x: number; y: number }> = [];
  for (let tries = 0; ribosomes.length < c.skills && tries < 20000; tries++) {
    const x = r2(40 + rnd(`r${tries}`) * 920);
    const y = r2(40 + rnd(`ry${tries}`) * 600);
    if (insideCell(x, y, 26) && occupied.every((o) => Math.hypot(o.x - x, o.y - y) > o.r + 4) && ribosomes.every((q) => Math.hypot(q.x - x, q.y - y) > 9)) ribosomes.push({ x, y });
  }

  const pad = (b: Box, p = 30): Box => ({ x: b.x - p, y: b.y - p, w: b.w + 2 * p, h: b.h + 2 * p });
  const union = (pts: Array<{ x: number; y: number }>, r = 0): Box => {
    const xs = pts.map((p) => p.x);
    const ys = pts.map((p) => p.y);
    const x = Math.min(...xs) - r;
    const y = Math.min(...ys) - r;
    return { x, y, w: Math.max(...xs) + r - x, h: Math.max(...ys) + r - y };
  };
  const full: Box = { x: 0, y: 0, w: MAP_W, h: MAP_H };
  const boxes: Record<OrgId, Box> = {
    nucleus: pad({ x: N.x - N.r, y: N.y - N.r, w: N.r * 2, h: N.r * 2 }, 40),
    nucleolus: pad({ x: nucleolus.x - 60, y: nucleolus.y - 50, w: 120, h: 100 }, 40),
    chromatin: pad({ x: N.x - N.r, y: N.y - N.r, w: N.r * 2, h: N.r * 2 }, 30),
    er: pad({ x: N.x - erOuter, y: N.y - erOuter, w: erOuter * 2, h: erOuter * 2 }, 10),
    golgi: pad({ x: G.x - 90, y: G.y - 60, w: 180, h: 130 }, 50),
    vesicles: pad(union(vesicles, 10), 20),
    mito: pad(union(mito, 40), 10),
    ribosomes: full,
    channels: pad(union(channels, 30), 60),
    receptors: pad(union(receptors, 30), 60),
  };
  return { membrane, membraneIn, nucleus, nucleusIn, nucleolus, chromatin, pores, er, golgi, G, vesicles, mito, channels, receptors, ribosomes, boxes, full };
}

/** fit a box to the drawing's aspect ratio (so the zoom never distorts) */
export function fitBox(b: Box): Box {
  const ar = MAP_W / MAP_H;
  let { x, y, w, h } = b;
  if (w / h > ar) {
    const nh = w / ar;
    y -= (nh - h) / 2;
    h = nh;
  } else {
    const nw = h * ar;
    x -= (nw - w) / 2;
    w = nw;
  }
  return { x: r2(x), y: r2(y), w: r2(w), h: r2(h) };
}
