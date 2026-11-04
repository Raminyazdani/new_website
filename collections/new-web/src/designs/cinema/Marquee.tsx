'use client';

import { useEffect, useRef, useState } from 'react';
import { hash01 } from '@/lib/derive';

/** Bulb border for the marquee sign: dim bulbs + a chasing lit bulb every third position (CSS, no JS loop). */
export function Bulbs() {
  const ref = useRef<HTMLDivElement>(null);
  const [box, setBox] = useState<{ w: number; h: number } | null>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const ro = new ResizeObserver(([e]) => setBox({ w: Math.round(e.contentRect.width), h: Math.round(e.contentRect.height) }));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  return (
    <div ref={ref} className="pointer-events-none absolute inset-0" aria-hidden>
      {box && (
        <svg width={box.w} height={box.h} className="absolute inset-0">
          <rect x={9} y={9} width={box.w - 18} height={box.h - 18} rx={18} fill="none" stroke="#5c3f0e" strokeWidth={8} strokeLinecap="round" strokeDasharray="0 20" />
          <rect x={9} y={9} width={box.w - 18} height={box.h - 18} rx={18} fill="none" stroke="#ffd27a" strokeWidth={8} strokeLinecap="round" strokeDasharray="0 60" className="cin-chase" />
        </svg>
      )}
    </div>
  );
}

/**
 * Projector beam with dust motes drifting through it. The cone is CSS; the motes are a small
 * canvas loop that only runs while the hero is on screen and never under reduced motion.
 */
export function Projector({ reduce }: { reduce: boolean }) {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const cv = ref.current;
    const ctx = cv?.getContext('2d');
    if (!cv || !ctx) return;
    const motes = Array.from({ length: 80 }, (_, i) => ({
      x: hash01(`mote${i}`, 1) * 2 - 1,
      y: hash01(`mote${i}`, 2),
      r: 0.5 + 1.5 * hash01(`mote${i}`, 3),
      v: 0.25 + hash01(`mote${i}`, 4),
      ph: hash01(`mote${i}`, 5) * Math.PI * 2,
    }));
    let w = 0;
    let h = 0;
    let raf = 0;
    let visible = true;
    const resize = () => {
      const dpr = Math.min(2, window.devicePixelRatio || 1);
      w = cv.clientWidth;
      h = cv.clientHeight;
      cv.width = Math.round(w * dpr);
      cv.height = Math.round(h * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    const draw = (t: number) => {
      ctx.clearRect(0, 0, w, h);
      for (const m of motes) {
        const y = (m.y + (t / 60000) * m.v) % 1; // slow fall
        const spread = 0.06 + 0.42 * y; // the cone widens downwards
        const x = w / 2 + m.x * spread * w + Math.sin(t / 2400 + m.ph) * 6;
        ctx.globalAlpha = (0.15 + 0.5 * (1 - y)) * (0.6 + 0.4 * Math.sin(t / 700 + m.ph));
        ctx.beginPath();
        ctx.arc(x, y * h, m.r, 0, Math.PI * 2);
        ctx.fillStyle = '#fff6e0';
        ctx.fill();
      }
      ctx.globalAlpha = 1;
    };
    let lastDraw = 0;
    const frame = (t: number) => {
      raf = 0;
      if (t - lastDraw >= 40) {
        // ~25 fps is plenty for drifting dust
        lastDraw = t;
        draw(t);
      }
      if (visible && !document.hidden) raf = requestAnimationFrame(frame);
    };
    const start = () => {
      if (!raf && !reduce) raf = requestAnimationFrame(frame);
    };
    resize();
    draw(0);
    const ro = new ResizeObserver(() => {
      resize();
      draw(performance.now());
    });
    ro.observe(cv);
    const io = new IntersectionObserver(([e]) => {
      visible = e.isIntersecting;
      if (visible) start();
    });
    io.observe(cv);
    const onVis = () => !document.hidden && start();
    document.addEventListener('visibilitychange', onVis);
    start();
    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      io.disconnect();
      document.removeEventListener('visibilitychange', onVis);
    };
  }, [reduce]);
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
      <div className="cin-beam absolute inset-x-0 top-0 h-full" />
      <canvas ref={ref} className="cin-motes absolute inset-0 size-full" />
    </div>
  );
}
