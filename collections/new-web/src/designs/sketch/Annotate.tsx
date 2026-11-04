'use client';

import { useEffect, useRef, type ReactNode } from 'react';
import type { RoughAnnotationConfig } from 'rough-notation/lib/model';

/**
 * rough-notation on view (client only). The annotation SVG is inserted next to the inner element,
 * inside this wrapper, so React never sees foreign siblings among its own nodes. Under reduced
 * motion the mark appears without the drawing animation.
 */
export function Annotate({ children, type, color = '#c92a2a', brackets, padding, strokeWidth, multiline, reduce, className }: { children: ReactNode; type: RoughAnnotationConfig['type']; color?: string; brackets?: RoughAnnotationConfig['brackets']; padding?: number; strokeWidth?: number; multiline?: boolean; reduce: boolean; className?: string }) {
  const el = useRef<HTMLSpanElement>(null);
  useEffect(() => {
    const target = el.current;
    if (!target) return;
    let remove: (() => void) | undefined;
    let alive = true;
    const io = new IntersectionObserver(
      async ([e]) => {
        if (!e.isIntersecting) return;
        io.disconnect();
        const { annotate } = await import('rough-notation');
        if (!alive) return;
        const a = annotate(target, { type, color, brackets, padding, strokeWidth, multiline, animate: !reduce, animationDuration: 700, iterations: type === 'highlight' ? 1 : 2 });
        a.show();
        remove = () => a.remove();
      },
      { rootMargin: '0px 0px -12% 0px' },
    );
    io.observe(target);
    return () => {
      alive = false;
      io.disconnect();
      remove?.();
    };
  }, [type, color, brackets, padding, strokeWidth, multiline, reduce]);
  return (
    <span className={className ?? 'relative inline'}>
      <span ref={el} className={className ? 'block' : undefined}>
        {children}
      </span>
    </span>
  );
}
