'use client';

import { useEffect, useRef } from 'react';
import createGlobe from 'cobe';
import type { JourneyStop } from '@/lib/types';

/** cobe globe centred on the Iran → Germany corridor; drag to rotate, gentle sway otherwise. */
export default function BentoGlobe({ stops, dark }: { stops: JourneyStop[]; dark: boolean }) {
  const canvas = useRef<HTMLCanvasElement>(null);
  const pointer = useRef<number | null>(null);
  const drag = useRef(0);
  const dragTarget = useRef(0);

  useEffect(() => {
    const el = canvas.current;
    if (!el) return;
    let width = el.offsetWidth;
    const onResize = () => (width = el.offsetWidth);
    window.addEventListener('resize', onResize);
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    // cobe's resolution uniform must equal the drawing buffer (clientWidth × dpr), otherwise the globe is off-centre
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    // longitude ≈ 30°E faces the viewer
    const basePhi = Math.PI - ((30 * Math.PI) / 180 - Math.PI / 2);
    let t = 0;
    const globe = createGlobe(el, {
      devicePixelRatio: dpr,
      width: width * dpr,
      height: width * dpr,
      phi: basePhi,
      theta: 0.42,
      dark: dark ? 1 : 0,
      diffuse: dark ? 1.4 : 1.1,
      mapSamples: 16000,
      mapBrightness: dark ? 5 : 2.2,
      mapBaseBrightness: 0,
      baseColor: dark ? [0.22, 0.22, 0.25] : [0.95, 0.95, 0.96],
      markerColor: dark ? [0.78, 0.96, 0.2] : [0.35, 0.55, 0.05],
      glowColor: dark ? [0.12, 0.12, 0.14] : [0.86, 0.86, 0.88],
      markers: stops.map((s) => ({ location: [s.lat, s.lng] as [number, number], size: s.country === 'DE' ? 0.06 : 0.08 })),
      onRender: (state) => {
        if (!reduce) t += 0.004;
        drag.current += (dragTarget.current - drag.current) * 0.12;
        state.phi = basePhi + Math.sin(t) * 0.35 + drag.current;
        state.width = width * dpr;
        state.height = width * dpr;
      },
    });
    el.style.opacity = '1';
    // stop rendering while the tile is off-screen
    const io = new IntersectionObserver(([e]) => globe.toggle(e.isIntersecting));
    io.observe(el);
    return () => {
      io.disconnect();
      globe.destroy();
      window.removeEventListener('resize', onResize);
    };
  }, [stops, dark]);

  return (
    <canvas
      ref={canvas}
      className="aspect-square h-auto w-full cursor-grab opacity-0 transition-opacity duration-1000 [contain:layout_paint_size] active:cursor-grabbing"
      onPointerDown={(e) => {
        pointer.current = e.clientX - dragTarget.current * 200;
        (e.target as HTMLElement).setPointerCapture(e.pointerId);
      }}
      onPointerUp={() => (pointer.current = null)}
      onPointerOut={() => (pointer.current = null)}
      onPointerMove={(e) => {
        if (pointer.current !== null) dragTarget.current = (e.clientX - pointer.current) / 200;
      }}
      aria-hidden
    />
  );
}
