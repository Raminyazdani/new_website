'use client';

import { useEffect } from 'react';
import Lenis from 'lenis';

/** Lenis smooth scrolling for a design page. Disabled for reduced-motion users and touch devices. */
export function SmoothScroll({ lerp = 0.1 }: { lerp?: number }) {
  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const lenis = new Lenis({ lerp, anchors: { offset: -72 }, autoRaf: true });
    document.documentElement.classList.add('lenis');
    return () => {
      lenis.destroy();
      document.documentElement.classList.remove('lenis');
    };
  }, [lerp]);
  return null;
}
