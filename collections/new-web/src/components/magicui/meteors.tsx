'use client';

/**
 * Meteors — adapted from Magic UI (https://magicui.design, MIT).
 * Changes: positions/timings come from a deterministic hash instead of Math.random (no hydration
 * mismatch, same sky on every visit), colours via props, keyframes `meteor` live in the design CSS.
 */
import type { CSSProperties } from 'react';
import { hash01 } from '@/lib/derive';
import { cn } from '@/lib/utils';

export function Meteors({
  number = 14,
  angle = 215,
  minDuration = 4,
  maxDuration = 11,
  maxDelay = 9,
  className,
  tailClassName,
}: {
  number?: number;
  angle?: number;
  minDuration?: number;
  maxDuration?: number;
  maxDelay?: number;
  className?: string;
  tailClassName?: string;
}) {
  return (
    <>
      {Array.from({ length: number }, (_, i) => {
        const style = {
          '--angle': `${-angle}deg`,
          top: `${-5 + 30 * hash01(`m${i}`, 1)}%`,
          left: `${100 * hash01(`m${i}`, 2)}%`,
          animationDelay: `${(maxDelay * hash01(`m${i}`, 3)).toFixed(2)}s`,
          animationDuration: `${(minDuration + (maxDuration - minDuration) * hash01(`m${i}`, 4)).toFixed(2)}s`,
        } as CSSProperties;
        return (
          <span key={i} style={style} className={cn('meteor pointer-events-none absolute size-0.5 rounded-full', className)} aria-hidden>
            <span className={cn('absolute top-1/2 -z-10 h-px w-[60px] -translate-y-1/2', tailClassName)} />
          </span>
        );
      })}
    </>
  );
}
