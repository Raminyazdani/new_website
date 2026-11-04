'use client';

import { useEffect, useRef, useState, type ReactNode } from 'react';

/**
 * Mounts heavy children (WebGL canvases) only while they are near the viewport,
 * so several animated backgrounds can live on one page without burning the GPU.
 */
export function InView({
  children,
  className,
  rootMargin = '200px',
  keepMounted = false,
  fallback = null,
}: {
  children: ReactNode;
  className?: string;
  rootMargin?: string;
  keepMounted?: boolean;
  fallback?: ReactNode;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  const [seen, setSeen] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([e]) => {
        setVisible(e.isIntersecting);
        if (e.isIntersecting) setSeen(true);
      },
      { rootMargin },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [rootMargin]);
  const show = keepMounted ? seen : visible;
  return (
    <div ref={ref} className={className}>
      {show ? children : fallback}
    </div>
  );
}
