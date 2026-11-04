'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { geoCircle, geoDistance, geoGraticule10, geoOrthographic, geoPath, geoStereographic } from 'd3';
import { KIND_STYLE, type BgStar, type Constellation, type Star, type StarKind } from './sky';

type Model = { constellations: Constellation[]; bg: BgStar[] };
const RAD = Math.PI / 180;
const graticule = geoGraticule10();

/** point south of a constellation (for its label) */
function below(c: Constellation): [number, number] {
  return [c.lon, Math.max(-89, c.lat - c.radius - 3)];
}

function useBox(ref: React.RefObject<HTMLElement | null>, fallback: { w: number; h: number }) {
  const [box, setBox] = useState(fallback);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const ro = new ResizeObserver(([e]) => {
      const w = Math.round(e.contentRect.width);
      const h = Math.round(e.contentRect.height);
      if (w > 0 && h > 0) setBox((b) => (b.w === w && b.h === h ? b : { w, h }));
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, [ref]);
  return box;
}

/** the display font as the browser resolved it (canvas cannot read CSS variables) */
function useFontFamily(probe: React.RefObject<HTMLElement | null>) {
  const font = useRef('Georgia, serif');
  const [ready, setReady] = useState(0);
  useEffect(() => {
    const read = () => {
      if (probe.current) font.current = getComputedStyle(probe.current).fontFamily || font.current;
      setReady((n) => n + 1);
    };
    read();
    document.fonts?.ready.then(read);
  }, [probe]);
  return { font, ready };
}

/* ─────────────────────────────── explorer: a turning celestial globe ─────────────────────────────── */

export function SkyGlobe({
  model,
  selected,
  onSelect,
  pulseKeys,
  labels,
  kindLabels,
  reduce,
  rtl,
  ariaLabel,
}: {
  model: Model;
  selected: string;
  onSelect: (domain: string, key?: string) => void;
  pulseKeys: Set<string>;
  labels: Record<string, string>;
  kindLabels: Record<StarKind, string>;
  reduce: boolean;
  rtl: boolean;
  ariaLabel: string;
}) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const probeRef = useRef<HTMLSpanElement>(null);
  const box = useBox(wrapRef, { w: 560, h: 560 });
  const S = Math.max(240, Math.min(box.w, 680));
  const { font, ready } = useFontFamily(probeRef);
  const first = model.constellations.find((c) => c.id === selected) ?? model.constellations[0];
  const rot = useRef<[number, number]>([-first.lon, -first.lat]);
  const anim = useRef<{ from: [number, number]; to: [number, number]; t0: number; dur: number } | null>(null);
  const hover = useRef<Star | null>(null);
  const pts = useRef<Array<{ s: Star; c: Constellation; x: number; y: number }>>([]);
  const raf = useRef(0);
  const visible = useRef(true);
  const live = useRef({ selected, pulseKeys, reduce });
  live.current = { selected, pulseKeys, reduce };
  const [tip, setTip] = useState<{ x: number; y: number; s: Star } | null>(null);
  const projection = useMemo(() => geoOrthographic().clipAngle(90).precision(0.7), []);

  const draw = useCallback(
    (now: number) => {
      const cv = canvasRef.current;
      const ctx = cv?.getContext('2d');
      if (!cv || !ctx) return;
      const dpr = Math.min(2, window.devicePixelRatio || 1);
      if (cv.width !== Math.round(S * dpr)) {
        cv.width = Math.round(S * dpr);
        cv.height = Math.round(S * dpr);
      }
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, S, S);
      const R = S / 2 - 4;
      const cx = S / 2;
      projection.scale(R).translate([cx, cx]).rotate([rot.current[0], rot.current[1], 0]);
      const path = geoPath(projection, ctx);
      const center: [number, number] = [-rot.current[0], -rot.current[1]];
      const vis = (lon: number, lat: number) => geoDistance([lon, lat], center) < Math.PI / 2 - 0.03;
      const k = S / 620;
      const { selected: selId, pulseKeys: pk, reduce: red } = live.current;

      const g = ctx.createRadialGradient(cx - R * 0.35, cx - R * 0.4, R * 0.05, cx, cx, R);
      g.addColorStop(0, '#1b2b5e');
      g.addColorStop(0.6, '#0b1434');
      g.addColorStop(1, '#050816');
      ctx.beginPath();
      path({ type: 'Sphere' });
      ctx.fillStyle = g;
      ctx.fill();
      ctx.lineWidth = 1;
      ctx.strokeStyle = 'rgba(127,212,255,0.32)';
      ctx.stroke();
      ctx.beginPath();
      path(graticule);
      ctx.strokeStyle = 'rgba(163,174,203,0.13)';
      ctx.lineWidth = 0.6;
      ctx.stroke();

      ctx.fillStyle = '#dfe6ff';
      for (const b of model.bg) {
        if (!vis(b.lon, b.lat)) continue;
        const p = projection([b.lon, b.lat]);
        if (!p) continue;
        ctx.globalAlpha = 0.16 + 0.6 * b.m;
        const z = (0.6 + 1.2 * b.m) * k;
        ctx.fillRect(p[0] - z / 2, p[1] - z / 2, z, z);
      }
      ctx.globalAlpha = 1;

      const cs = model.constellations.find((c) => c.id === selId);
      if (cs) {
        ctx.beginPath();
        path(geoCircle().center([cs.lon, cs.lat]).radius(cs.radius + 3.5)());
        ctx.setLineDash([3, 5]);
        ctx.strokeStyle = 'rgba(127,212,255,0.5)';
        ctx.lineWidth = 1;
        ctx.stroke();
        ctx.setLineDash([]);
      }

      const hv = hover.current;
      for (const c of model.constellations) {
        const on = c.id === selId;
        const hoverHere = !!hv && hv.id.startsWith(`${c.id}|`);
        for (const [a, b] of c.edges) {
          const A = c.stars[a];
          const B = c.stars[b];
          if (!vis(A.lon, A.lat) && !vis(B.lon, B.lat)) continue;
          const touch = !!hv && (hv.id === A.id || hv.id === B.id);
          ctx.beginPath();
          path({ type: 'LineString', coordinates: [[A.lon, A.lat], [B.lon, B.lat]] });
          ctx.strokeStyle = touch ? 'rgba(127,212,255,0.95)' : on ? (hoverHere ? 'rgba(230,194,122,0.3)' : 'rgba(230,194,122,0.75)') : hoverHere ? 'rgba(230,194,122,0.12)' : 'rgba(230,194,122,0.2)';
          ctx.lineWidth = touch ? 1.8 : on ? 1.1 : 0.7;
          ctx.stroke();
        }
      }

      const out: typeof pts.current = [];
      const phase = (now % 1500) / 1500;
      for (const c of model.constellations) {
        const on = c.id === selId;
        for (const s of c.stars) {
          if (!vis(s.lon, s.lat)) continue;
          const p = projection([s.lon, s.lat]);
          if (!p) continue;
          const st = KIND_STYLE[s.kind];
          const r = st.r * k * (on ? 1 : 0.78);
          ctx.globalAlpha = on ? 1 : 0.5;
          if (on && s.kind !== 'skill') {
            ctx.shadowColor = st.color;
            ctx.shadowBlur = 9 * k;
          }
          ctx.beginPath();
          ctx.arc(p[0], p[1], r, 0, 2 * Math.PI);
          ctx.fillStyle = st.color;
          ctx.fill();
          ctx.shadowBlur = 0;
          if (pk.has(s.key)) {
            const q = red ? 0.35 : phase;
            ctx.globalAlpha = 1 - q;
            ctx.beginPath();
            ctx.arc(p[0], p[1], r + 3 + 12 * q * k, 0, 2 * Math.PI);
            ctx.strokeStyle = '#7fd4ff';
            ctx.lineWidth = 1.6;
            ctx.stroke();
          }
          if (hv?.id === s.id) {
            ctx.globalAlpha = 1;
            ctx.beginPath();
            ctx.arc(p[0], p[1], r + 4, 0, 2 * Math.PI);
            ctx.strokeStyle = '#ffffff';
            ctx.lineWidth = 1.4;
            ctx.stroke();
          }
          out.push({ s, c, x: p[0], y: p[1] });
        }
      }
      ctx.globalAlpha = 1;
      pts.current = out;

      ctx.textAlign = 'center';
      ctx.direction = rtl ? 'rtl' : 'ltr';
      ctx.lineJoin = 'round';
      for (const c of model.constellations) {
        if (!vis(c.lon, c.lat)) continue;
        const p = projection(below(c));
        if (!p) continue;
        const on = c.id === selId;
        const name = labels[c.id] ?? c.id;
        ctx.font = `${rtl ? '' : 'italic '}${on ? 600 : 500} ${Math.round((on ? 20 : 15) * k * (rtl ? 0.9 : 1))}px ${font.current}`;
        // keep the label inside the canvas and fade it out towards the rim
        const tw = ctx.measureText(name).width;
        const x = Math.min(Math.max(p[0], tw / 2 + 6), S - tw / 2 - 6);
        const rim = Math.max(0, Math.min(1, (Math.PI / 2 - geoDistance([c.lon, c.lat], center)) / 0.4));
        ctx.globalAlpha = on ? 1 : rim;
        ctx.lineWidth = 4;
        ctx.strokeStyle = 'rgba(5,8,22,0.9)';
        ctx.strokeText(name, x, p[1]);
        ctx.fillStyle = on ? '#f1dca6' : 'rgba(232,236,246,0.62)';
        ctx.fillText(name, x, p[1]);
      }
      ctx.globalAlpha = 1;
    },
    [S, font, labels, model, projection, rtl],
  );

  const tick = useCallback(
    (now: number) => {
      raf.current = 0;
      const a = anim.current;
      if (a) {
        const t = Math.min(1, (now - a.t0) / a.dur);
        const e = t < 0.5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2;
        rot.current = [a.from[0] + (a.to[0] - a.from[0]) * e, a.from[1] + (a.to[1] - a.from[1]) * e];
        if (t >= 1) anim.current = null;
      }
      draw(now);
      const pulsing = live.current.pulseKeys.size > 0 && !live.current.reduce;
      if ((anim.current || pulsing) && visible.current) raf.current = requestAnimationFrame(tick);
    },
    [draw],
  );
  const kick = useCallback(() => {
    if (!raf.current) raf.current = requestAnimationFrame(tick);
  }, [tick]);

  // turn to the selected constellation
  useEffect(() => {
    const c = model.constellations.find((x) => x.id === selected);
    if (!c) return;
    const from = rot.current;
    const to: [number, number] = [from[0] + ((((-c.lon - from[0] + 540) % 360) + 360) % 360) - 180, -c.lat];
    if (reduce) {
      rot.current = to;
      anim.current = null;
    } else anim.current = { from, to, t0: performance.now(), dur: 950 };
    kick();
  }, [selected, model, reduce, kick]);

  useEffect(() => {
    kick();
  }, [kick, pulseKeys, ready, S]);

  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    const io = new IntersectionObserver(([e]) => {
      visible.current = e.isIntersecting;
      if (e.isIntersecting) kick();
    });
    io.observe(el);
    return () => {
      io.disconnect();
      cancelAnimationFrame(raf.current);
      raf.current = 0;
    };
  }, [kick]);

  // pointer: hover a star, drag to turn, click to select
  const drag = useRef<{ x: number; y: number; rot: [number, number]; moved: boolean } | null>(null);
  const pick = (x: number, y: number) => {
    let best: (typeof pts.current)[number] | null = null;
    let bd = 13;
    for (const p of pts.current) {
      const d = Math.hypot(p.x - x, p.y - y);
      if (d < bd) {
        bd = d;
        best = p;
      }
    }
    return best;
  };
  const local = (e: React.PointerEvent) => {
    const r = canvasRef.current!.getBoundingClientRect();
    return { x: ((e.clientX - r.left) / r.width) * S, y: ((e.clientY - r.top) / r.height) * S };
  };

  return (
    <div ref={wrapRef} className="relative mx-auto aspect-square w-full max-w-[680px]">
      <span ref={probeRef} className="obs-display pointer-events-none absolute opacity-0" aria-hidden>
        x
      </span>
      <canvas
        ref={canvasRef}
        role="img"
        aria-label={ariaLabel}
        className="block size-full cursor-grab touch-pan-y active:cursor-grabbing"
        style={{ width: S, height: S }}
        onPointerDown={(e) => {
          drag.current = { ...local(e), rot: [...rot.current] as [number, number], moved: false };
          (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
        }}
        onPointerMove={(e) => {
          const { x, y } = local(e);
          const d = drag.current;
          if (d) {
            const dx = x - d.x;
            const dy = y - d.y;
            if (Math.hypot(dx, dy) > 4) d.moved = true;
            if (d.moved) {
              anim.current = null;
              rot.current = [d.rot[0] + dx * 0.32, Math.max(-85, Math.min(85, d.rot[1] - dy * 0.32))];
              kick();
              return;
            }
          }
          const p = pick(x, y);
          if ((p?.s.id ?? null) !== (hover.current?.id ?? null)) {
            hover.current = p?.s ?? null;
            setTip(p ? { x: p.x, y: p.y, s: p.s } : null);
            kick();
          }
        }}
        onPointerUp={(e) => {
          const d = drag.current;
          drag.current = null;
          if (d?.moved) return;
          const { x, y } = local(e);
          const p = pick(x, y);
          if (p) return onSelect(p.c.id, p.s.key);
          // otherwise the constellation whose centre is nearest (within its drawn size)
          let best: Constellation | null = null;
          let bd = Infinity;
          for (const c of model.constellations) {
            const q = projection([c.lon, c.lat]);
            if (!q || geoDistance([c.lon, c.lat], [-rot.current[0], -rot.current[1]]) > Math.PI / 2) continue;
            const dd = Math.hypot(q[0] - x, q[1] - y);
            const reach = (S / 2) * Math.sin((c.radius + 4) * RAD);
            if (dd < reach && dd < bd) {
              bd = dd;
              best = c;
            }
          }
          if (best) onSelect(best.id);
        }}
        onPointerLeave={() => {
          drag.current = null;
          if (hover.current) {
            hover.current = null;
            setTip(null);
            kick();
          }
        }}
      />
      {tip && (
        <div
          className="pointer-events-none absolute z-10 max-w-[16rem] -translate-x-1/2 -translate-y-full rounded-md border border-[var(--o-line)] bg-[#0b1430]/95 px-2.5 py-1.5 text-[12.5px] leading-snug shadow-lg"
          style={{ left: `${(tip.x / S) * 100}%`, top: `calc(${(tip.y / S) * 100}% - 12px)` }}
          aria-hidden
        >
          <span className="obs-mono block text-[10.5px] uppercase tracking-wider text-[var(--o-gold)] rtl:normal-case rtl:tracking-normal">{kindLabels[tip.s.kind]}</span>
          <bdi>{tip.s.name}</bdi>
        </div>
      )}
    </div>
  );
}

/* ─────────────────────────────── hero: a drifting stereographic chart ─────────────────────────────── */

export function HeroSky({ model, labels, reduce, rtl }: { model: Model; labels: Record<string, string>; reduce: boolean; rtl: boolean }) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const probeRef = useRef<HTMLSpanElement>(null);
  const box = useBox(wrapRef, { w: 1440, h: 820 });
  const { font, ready } = useFontFamily(probeRef);
  const lam = useRef(150);
  const projection = useMemo(() => geoStereographic().clipAngle(118).precision(0.8), []);

  const draw = useCallback(
    (now: number) => {
      const cv = canvasRef.current;
      const ctx = cv?.getContext('2d');
      if (!cv || !ctx) return;
      const { w, h } = box;
      const dpr = Math.min(2, window.devicePixelRatio || 1);
      if (cv.width !== Math.round(w * dpr) || cv.height !== Math.round(h * dpr)) {
        cv.width = Math.round(w * dpr);
        cv.height = Math.round(h * dpr);
      }
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, w, h);
      const sc = Math.max(w, h * 1.3) * 0.36;
      projection
        .scale(sc)
        .translate([w * (rtl ? 0.36 : 0.64), h * 0.56])
        .rotate([lam.current, -6, 0]);
      const path = geoPath(projection, ctx);
      const center: [number, number] = [-lam.current, 6];
      const vis = (lon: number, lat: number) => geoDistance([lon, lat], center) < 118 * RAD;
      const k = Math.min(1.25, Math.max(0.7, w / 1300));

      ctx.beginPath();
      path(graticule);
      ctx.strokeStyle = 'rgba(163,174,203,0.08)';
      ctx.lineWidth = 0.6;
      ctx.stroke();

      ctx.fillStyle = '#e4eaff';
      model.bg.forEach((b, i) => {
        if (!vis(b.lon, b.lat)) return;
        const p = projection([b.lon, b.lat]);
        if (!p) return;
        const tw = reduce ? 1 : 0.75 + 0.25 * Math.sin(now / 900 + i * 1.7);
        ctx.globalAlpha = (0.14 + 0.62 * b.m) * tw;
        const z = (0.7 + 1.5 * b.m) * k;
        ctx.fillRect(p[0] - z / 2, p[1] - z / 2, z, z);
      });

      for (const c of model.constellations) {
        ctx.globalAlpha = 0.3;
        ctx.strokeStyle = '#e6c27a';
        ctx.lineWidth = 0.8;
        for (const [a, b] of c.edges) {
          const A = c.stars[a];
          const B = c.stars[b];
          if (!vis(A.lon, A.lat) && !vis(B.lon, B.lat)) continue;
          ctx.beginPath();
          path({ type: 'LineString', coordinates: [[A.lon, A.lat], [B.lon, B.lat]] });
          ctx.stroke();
        }
        for (const s of c.stars) {
          if (!vis(s.lon, s.lat)) continue;
          const p = projection([s.lon, s.lat]);
          if (!p) continue;
          const st = KIND_STYLE[s.kind];
          ctx.globalAlpha = s.kind === 'skill' ? 0.55 : 0.85;
          ctx.beginPath();
          ctx.arc(p[0], p[1], st.r * k * 0.85, 0, 2 * Math.PI);
          ctx.fillStyle = st.color;
          ctx.fill();
        }
        const q = w >= 700 ? projection(below(c)) : null;
        if (q && vis(c.lon, c.lat)) {
          ctx.globalAlpha = 0.5;
          ctx.textAlign = 'center';
          ctx.direction = rtl ? 'rtl' : 'ltr';
          ctx.font = `${rtl ? '' : 'italic '}500 ${Math.round(16 * k)}px ${font.current}`;
          ctx.fillStyle = '#e8ecf6';
          ctx.fillText(labels[c.id] ?? c.id, q[0], q[1]);
        }
      }
      ctx.globalAlpha = 1;
    },
    [box, font, labels, model, projection, reduce, rtl],
  );

  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    let raf = 0;
    let last = performance.now();
    let visible = true;
    const frame = (now: number) => {
      raf = 0;
      lam.current += Math.min(64, now - last) * 0.0016 * (rtl ? -1 : 1);
      last = now;
      draw(now);
      if (visible && !document.hidden) raf = requestAnimationFrame(frame);
    };
    const start = () => {
      if (!raf && !reduce) {
        last = performance.now();
        raf = requestAnimationFrame(frame);
      }
    };
    const io = new IntersectionObserver(([e]) => {
      visible = e.isIntersecting;
      if (visible) start();
    });
    io.observe(el);
    const onVis = () => !document.hidden && visible && start();
    document.addEventListener('visibilitychange', onVis);
    draw(performance.now());
    start();
    return () => {
      cancelAnimationFrame(raf);
      io.disconnect();
      document.removeEventListener('visibilitychange', onVis);
    };
  }, [draw, reduce, rtl, ready]);

  return (
    <div ref={wrapRef} className="absolute inset-0" aria-hidden>
      <span ref={probeRef} className="obs-display pointer-events-none absolute opacity-0">
        x
      </span>
      <canvas ref={canvasRef} className="block size-full" />
    </div>
  );
}
