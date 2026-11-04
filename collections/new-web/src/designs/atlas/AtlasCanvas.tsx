'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useTranslations } from 'next-intl';
import { createMap } from 'svg-dotted-map';
import { fmtNum, fmtYear } from '@/lib/format';
import type { SiteData } from '@/lib/types';

export type EntityType = 'skill' | 'project' | 'course' | 'position' | 'education' | 'publication';

export const TYPE_COLOR: Record<Exclude<EntityType, 'skill'>, string> = {
  project: '#0f1222',
  course: '#8c93ad',
  position: '#f2683c',
  education: '#3b5bfd',
  publication: '#c03ea6',
};
export const domainColor = (hue: number) => `hsl(${hue} 72% 48%)`;

interface Entity {
  type: EntityType;
  label: string;
  group: string;
  color: string;
  year?: number;
  city?: string | null;
}
type P = { x: number; y: number; r: number; a: number };
type Label = { key: string; x: number; y: number; text: string; sub?: string; align?: 'center' | 'start' | 'end'; rotate?: number; color?: string };

function rng(seed: number) {
  let s = seed;
  return () => {
    s = (s * 16807) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

const CLUSTER_POS: Record<string, [number, number]> = {
  singlecell: [0.3, 0.27],
  genomics: [0.15, 0.45],
  systems: [0.33, 0.5],
  structural: [0.5, 0.24],
  ml: [0.53, 0.5],
  software: [0.75, 0.3],
  data: [0.82, 0.55],
  devops: [0.68, 0.75],
  wetlab: [0.2, 0.76],
  bioprocess: [0.42, 0.8],
  project: [0.66, 0.5],
  course: [0.88, 0.82],
  position: [0.9, 0.17],
  education: [0.08, 0.15],
  publication: [0.6, 0.08],
};

export default function AtlasCanvas({ data, step }: { data: SiteData; step: number }) {
  const t = useTranslations();
  const rtl = data.dir === 'rtl';
  const wrap = useRef<HTMLDivElement>(null);
  const canvas = useRef<HTMLCanvasElement>(null);
  const [size, setSize] = useState({ w: 800, h: 600 });
  const [hover, setHover] = useState<{ x: number; y: number; e: Entity } | null>(null);
  const cur = useRef<P[]>([]);
  const mapAlpha = useRef(0);
  const raf = useRef(0);
  const reduce = useRef(false);

  /* -------- entities from the CV -------- */
  const entities = useMemo<Entity[]>(() => {
    const list: Entity[] = [];
    data.domains.forEach((d) => d.items.forEach((it) => list.push({ type: 'skill', label: it.name, group: d.id, color: domainColor(d.hue) })));
    data.projects.forEach((p) => list.push({ type: 'project', label: p.title, group: 'project', color: TYPE_COLOR.project }));
    data.certifications.forEach((c) => list.push({ type: 'course', label: c.name, group: 'course', color: TYPE_COLOR.course, year: c.year ? c.year + ((c.month ?? 6) - 1) / 12 : undefined }));
    data.experiences.forEach((e) =>
      list.push({ type: 'position', label: `${e.role} — ${e.org}`, group: 'position', color: TYPE_COLOR.position, year: e.start ? +e.start.slice(0, 4) + (+(e.start.slice(5, 7) || 6) - 1) / 12 : undefined, city: e.city }),
    );
    data.education.forEach((e) => list.push({ type: 'education', label: `${e.degree} — ${e.institution}`, group: 'education', color: TYPE_COLOR.education, year: e.startYear ?? undefined, city: e.city }));
    data.publications.forEach((p) => list.push({ type: 'publication', label: p.title, group: 'publication', color: TYPE_COLOR.publication, year: p.year ?? undefined }));
    return list;
  }, [data]);

  /* -------- map projection (crop around the journey) -------- */
  const map = useMemo(() => {
    const { points, addMarkers } = createMap({ width: 480, height: 240, mapSamples: 60000 });
    const pins = addMarkers(data.journey.map((j) => ({ lat: j.lat, lng: j.lng })));
    const xs = pins.map((p) => p.x);
    const ys = pins.map((p) => p.y);
    const pad = 26;
    const box = { x0: Math.min(...xs) - pad, x1: Math.max(...xs) + pad, y0: Math.min(...ys) - pad * 0.8, y1: Math.max(...ys) + pad * 0.8 };
    return { points: points.filter((p) => p.x > box.x0 && p.x < box.x1 && p.y > box.y0 && p.y < box.y1), pins, box };
  }, [data.journey]);

  /* -------- layouts -------- */
  const layouts = useMemo(() => {
    const { w, h } = size;
    const mirror = (x: number) => (rtl ? w - x : x);
    const unit = Math.min(w, h);
    const out: Array<{ targets: P[]; labels: Label[] }> = [];

    // 0 — embedding
    {
      const r = rng(7);
      const counts: Record<string, number> = {};
      entities.forEach((e) => (counts[e.group] = (counts[e.group] ?? 0) + 1));
      const targets = entities.map((e) => {
        const [cx, cy] = CLUSTER_POS[e.group] ?? [0.5, 0.5];
        const spread = Math.sqrt(counts[e.group]) * unit * 0.011 + 6;
        const u = Math.max(1e-6, r());
        const v = r();
        const g = Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
        const g2 = Math.sqrt(-2 * Math.log(Math.max(1e-6, r()))) * Math.sin(2 * Math.PI * r());
        return { x: mirror(cx * w + g * spread), y: cy * h + g2 * spread * 0.85, r: e.type === 'skill' ? 3.2 : e.type === 'course' ? 2.6 : 4.2, a: 0.9 };
      });
      const labels: Label[] = Object.keys(CLUSTER_POS)
        .filter((k) => counts[k])
        .map((k) => {
          const [cx, cy] = CLUSTER_POS[k];
          const isDomain = data.domains.some((d) => d.id === k);
          return {
            key: `c-${k}`,
            x: mirror(cx * w),
            y: cy * h - Math.sqrt(counts[k]) * unit * 0.011 * 2.2 - 14,
            text: isDomain ? t(`domains.${k}`) : t(`atlas.types.${k}`),
            sub: fmtNum(data.locale, counts[k]),
            color: isDomain ? domainColor(data.domains.find((d) => d.id === k)!.hue) : TYPE_COLOR[k as keyof typeof TYPE_COLOR],
          };
        });
      out.push({ targets, labels });
    }

    // 1 — timeline
    {
      const r = rng(11);
      const y0 = 2015;
      const y1 = 2027;
      const sx = (y: number) => mirror(w * 0.08 + ((y - y0) / (y1 - y0)) * w * 0.84);
      const lanes: Partial<Record<EntityType, number>> = { education: 0.2, position: 0.4, course: 0.6, publication: 0.78 };
      const laneCount: Record<string, number> = {};
      const targets = entities.map((e) => {
        if (e.year && lanes[e.type] !== undefined) {
          const k = (laneCount[e.type] = (laneCount[e.type] ?? 0) + 1);
          const jitter = ((k % 7) - 3) * 7 + (r() - 0.5) * 4;
          return { x: sx(Math.min(y1 - 0.2, Math.max(y0, e.year))) + (r() - 0.5) * 6, y: lanes[e.type]! * h + jitter, r: e.type === 'course' ? 3 : 5, a: 0.95 };
        }
        return { x: mirror(w * 0.08 + r() * w * 0.84), y: h * 0.93 + (r() - 0.5) * 10, r: 1.6, a: 0.18 };
      });
      const labels: Label[] = [];
      for (let y = y0; y <= y1; y += 2) labels.push({ key: `y-${y}`, x: sx(y), y: h * 0.07, text: fmtYear(data.locale, y) });
      (['education', 'position', 'course', 'publication'] as const).forEach((k) =>
        labels.push({ key: `l-${k}`, x: mirror(w * 0.08), y: (lanes[k] ?? 0) * h - 30, text: t(`atlas.types.${k}`), align: 'start', color: TYPE_COLOR[k] }),
      );
      labels.push({ key: 'undated', x: mirror(w * 0.08), y: h * 0.93 - 22, text: `${t('atlas.undated')}${data.locale === 'fa' ? '، ' : ' · '}${t('atlas.types.skill')} / ${t('atlas.types.project')}`, align: 'start', color: '#8c93ad' });
      out.push({ targets, labels });
    }

    // 2 — unit chart by domain
    {
      const doms = [...data.domains].sort((a, b) => b.count - a.count);
      const colW = (w * 0.86) / doms.length;
      const per = Math.max(2, Math.min(4, Math.floor(colW / 10)));
      const rows = Math.ceil(Math.max(...doms.map((d) => d.count)) / per);
      const cell = Math.min(colW / per, (h * 0.6) / rows, 18);
      const base = h * 0.8;
      const seen: Record<string, number> = {};
      const targets = entities.map((e) => {
        if (e.type !== 'skill') return { x: w / 2, y: h * 0.95, r: 0, a: 0 };
        const di = doms.findIndex((d) => d.id === e.group);
        const k = (seen[e.group] = (seen[e.group] ?? 0) + 1) - 1;
        const col = k % per;
        const row = Math.floor(k / per);
        const cx = w * 0.07 + di * colW + colW / 2 - ((per - 1) * cell) / 2 + col * cell;
        return { x: mirror(cx), y: base - row * cell, r: cell * 0.38, a: 0.95 };
      });
      const labels: Label[] = doms.map((d, i) => ({
        key: `d-${d.id}`,
        x: mirror(w * 0.07 + i * colW + colW / 2),
        y: base + 16,
        text: t(`domains.${d.id}`),
        sub: fmtNum(data.locale, d.count),
        rotate: rtl ? 35 : -35,
        align: rtl ? 'start' : 'end',
        color: domainColor(d.hue),
      }));
      out.push({ targets, labels });
    }

    // 3 — journey map
    {
      const r = rng(5);
      const { box } = map;
      const scale = Math.min((w * 0.9) / (box.x1 - box.x0), (h * 0.8) / (box.y1 - box.y0));
      const ox = (w - (box.x1 - box.x0) * scale) / 2;
      const oy = (h - (box.y1 - box.y0) * scale) / 2;
      const proj = (x: number, y: number) => ({ x: ox + (x - box.x0) * scale, y: oy + (y - box.y0) * scale });
      const pinOf = (city?: string | null) => {
        const i = data.journey.findIndex((j) => j.id === city);
        return i >= 0 ? proj(map.pins[i].x, map.pins[i].y) : null;
      };
      const perCity: Record<string, number> = {};
      const targets = entities.map((e) => {
        const p = pinOf(e.city);
        if (!p || (e.type !== 'position' && e.type !== 'education')) return { x: w / 2, y: h / 2, r: 0, a: 0 };
        const k = (perCity[e.city!] = (perCity[e.city!] ?? 0) + 1);
        const ang = k * 2.4;
        const rad = 5 + Math.sqrt(k) * 6;
        return { x: p.x + Math.cos(ang) * rad + (r() - 0.5) * 2, y: p.y + Math.sin(ang) * rad, r: 5, a: 0.95 };
      });
      const labels: Label[] = data.journey.map((j, i) => {
        const p = proj(map.pins[i].x, map.pins[i].y);
        const off: Record<string, [number, number, 'start' | 'end' | 'center']> = {
          saarbruecken: [-14, 0, 'end'],
          martinsried: [14, 22, 'start'],
          jena: [14, -16, 'start'],
          tehran: [16, 22, 'start'],
          roudehen: [16, -22, 'start'],
        };
        const [dx, dy, align] = off[j.id] ?? [0, -28, 'center'];
        return { key: `j-${j.id}`, x: p.x + dx, y: p.y + dy, text: j.city, sub: j.period, align, color: '#0f1222' };
      });
      out.push({ targets, labels });
    }
    return out;
  }, [size, entities, data, rtl, t, map]);

  /* -------- canvas sizing -------- */
  useEffect(() => {
    reduce.current = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const el = wrap.current;
    if (!el) return;
    const ro = new ResizeObserver(([e]) => {
      const { width, height } = e.contentRect;
      setSize({ w: Math.max(320, width), h: Math.max(320, height) });
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  /* -------- render loop -------- */
  useEffect(() => {
    const c = canvas.current;
    if (!c) return;
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    c.width = size.w * dpr;
    c.height = size.h * dpr;
    const ctx = c.getContext('2d');
    if (!ctx) return;
    const targets = layouts[step]?.targets ?? layouts[0].targets;
    if (cur.current.length !== targets.length) cur.current = targets.map((p) => ({ ...p, x: size.w / 2, y: size.h / 2, a: 0 }));
    const { box } = map;
    const scale = Math.min((size.w * 0.9) / (box.x1 - box.x0), (size.h * 0.8) / (box.y1 - box.y0));
    const ox = (size.w - (box.x1 - box.x0) * scale) / 2;
    const oy = (size.h - (box.y1 - box.y0) * scale) / 2;
    let frames = 0;
    const draw = () => {
      frames++;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, size.w, size.h);
      // map dots
      mapAlpha.current += ((step === 3 ? 1 : 0) - mapAlpha.current) * 0.08;
      if (mapAlpha.current > 0.01) {
        ctx.fillStyle = `rgba(15,18,34,${0.16 * mapAlpha.current})`;
        for (const p of map.points) {
          ctx.beginPath();
          ctx.arc(ox + (p.x - box.x0) * scale, oy + (p.y - box.y0) * scale, Math.max(0.8, scale * 0.14), 0, Math.PI * 2);
          ctx.fill();
        }
        // route
        const pts = data.journey.map((_, i) => ({ x: ox + (map.pins[i].x - box.x0) * scale, y: oy + (map.pins[i].y - box.y0) * scale }));
        ctx.strokeStyle = `rgba(242,104,60,${0.7 * mapAlpha.current})`;
        ctx.lineWidth = 1.5;
        ctx.setLineDash([4, 5]);
        ctx.beginPath();
        pts.forEach((p, i) => {
          if (i === 0) ctx.moveTo(p.x, p.y);
          else {
            const q = pts[i - 1];
            ctx.quadraticCurveTo((p.x + q.x) / 2, Math.min(p.y, q.y) - 40, p.x, p.y);
          }
        });
        ctx.stroke();
        ctx.setLineDash([]);
      }
      let moving = false;
      const ease = reduce.current ? 1 : 0;
      cur.current.forEach((p, i) => {
        const tg = targets[i];
        const k = ease || 0.06 + ((i * 37) % 50) / 1000;
        p.x += (tg.x - p.x) * k;
        p.y += (tg.y - p.y) * k;
        p.r += (tg.r - p.r) * k;
        p.a += (tg.a - p.a) * k;
        if (Math.abs(tg.x - p.x) + Math.abs(tg.y - p.y) > 0.3 || Math.abs(tg.a - p.a) > 0.01) moving = true;
        if (p.a < 0.02 || p.r < 0.3) return;
        const e = entities[i];
        ctx.globalAlpha = p.a;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        if (e.type === 'project') {
          ctx.strokeStyle = e.color;
          ctx.lineWidth = 1.6;
          ctx.stroke();
        } else {
          ctx.fillStyle = e.color;
          ctx.fill();
          if (e.type === 'position' || e.type === 'education') {
            ctx.strokeStyle = '#fbfbfd';
            ctx.lineWidth = 1.2;
            ctx.stroke();
          }
        }
      });
      ctx.globalAlpha = 1;
      if (moving || frames < 5 || Math.abs((step === 3 ? 1 : 0) - mapAlpha.current) > 0.01) raf.current = requestAnimationFrame(draw);
    };
    cancelAnimationFrame(raf.current);
    raf.current = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(raf.current);
  }, [layouts, step, size, entities, map, data.journey]);

  const labels = layouts[step]?.labels ?? [];

  return (
    <div
      ref={wrap}
      className="relative h-full w-full"
      onPointerMove={(ev) => {
        const rect = wrap.current!.getBoundingClientRect();
        const x = ev.clientX - rect.left;
        const y = ev.clientY - rect.top;
        let best = -1;
        let bd = 14 * 14;
        cur.current.forEach((p, i) => {
          if (p.a < 0.3) return;
          const d = (p.x - x) ** 2 + (p.y - y) ** 2;
          if (d < bd) {
            bd = d;
            best = i;
          }
        });
        setHover(best >= 0 ? { x: cur.current[best].x, y: cur.current[best].y, e: entities[best] } : null);
      }}
      onPointerLeave={() => setHover(null)}
    >
      <canvas ref={canvas} className="absolute inset-0 h-full w-full" aria-hidden />
      {labels.map((l) => (
        <span
          key={l.key}
          className="atlas-label pointer-events-none absolute whitespace-nowrap text-[11px] font-medium"
          style={{
            left: l.x,
            top: l.y,
            color: l.color ?? '#5a6077',
            transform: `translate(${l.align === 'start' ? '0' : l.align === 'end' ? '-100%' : '-50%'}, -50%) ${l.rotate ? `rotate(${l.rotate}deg)` : ''}`,
            transformOrigin: l.align === 'end' ? 'right center' : l.align === 'start' ? 'left center' : 'center',
          }}
        >
          {l.text}
          {l.sub && <span className="ms-1.5 font-mono text-[10px] opacity-60">{l.sub}</span>}
        </span>
      ))}
      {hover && (
        <div
          className="pointer-events-none absolute z-10 max-w-64 -translate-x-1/2 -translate-y-[calc(100%+12px)] rounded-lg bg-[#0f1222] px-3 py-2 text-xs text-white shadow-xl"
          style={{ left: hover.x, top: hover.y }}
        >
          <span className="mb-0.5 flex items-center gap-1.5 text-[10px] uppercase tracking-wider text-white/60">
            <span className="size-2 rounded-full" style={{ background: hover.e.color }} />
            {t(`atlas.types.${hover.e.type}`)}
            {hover.e.type === 'skill' && <> · {t(`domains.${hover.e.group}`)}</>}
          </span>
          <bdi>{hover.e.label}</bdi>
        </div>
      )}
    </div>
  );
}
