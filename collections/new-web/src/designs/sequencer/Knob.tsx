'use client';

import { useRef } from 'react';
import { cn } from '@/lib/utils';

/**
 * A rotary knob: role="slider" with arrow keys / PageUp / PageDown / Home / End,
 * and vertical drag with a pointer. Disabled knobs stay visible but inert.
 */
export function Knob({
  label,
  value,
  min,
  max,
  step = 1,
  onChange,
  valueText,
  disabled = false,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step?: number;
  onChange?: (v: number) => void;
  valueText?: string;
  disabled?: boolean;
}) {
  const drag = useRef<{ y: number; v: number } | null>(null);
  const clamp = (v: number) => Math.min(max, Math.max(min, Math.round(v / step) * step));
  const set = (v: number) => !disabled && onChange?.(clamp(v));
  const frac = max > min ? (value - min) / (max - min) : 0;
  const angle = -135 + 270 * frac;
  return (
    <div className={cn('flex flex-col items-center gap-1.5', disabled && 'opacity-40')}>
      <div
        role="slider"
        tabIndex={disabled ? -1 : 0}
        aria-label={label}
        aria-valuemin={min}
        aria-valuemax={max}
        aria-valuenow={value}
        aria-valuetext={valueText}
        aria-disabled={disabled || undefined}
        className="seq-knob relative grid size-14 touch-none select-none place-items-center rounded-full"
        onKeyDown={(e) => {
          const big = Math.max(step, Math.round((max - min) / 5));
          const k = e.key;
          if (k === 'ArrowUp' || k === 'ArrowRight') set(value + step);
          else if (k === 'ArrowDown' || k === 'ArrowLeft') set(value - step);
          else if (k === 'PageUp') set(value + big);
          else if (k === 'PageDown') set(value - big);
          else if (k === 'Home') set(min);
          else if (k === 'End') set(max);
          else return;
          e.preventDefault();
        }}
        onPointerDown={(e) => {
          if (disabled) return;
          drag.current = { y: e.clientY, v: value };
          (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
        }}
        onPointerMove={(e) => {
          const d = drag.current;
          if (!d) return;
          const range = max - min;
          set(d.v + ((d.y - e.clientY) / 120) * range);
        }}
        onPointerUp={() => (drag.current = null)}
        onPointerCancel={() => (drag.current = null)}
      >
        <span className="seq-knob-cap absolute inset-[6px] rounded-full" style={{ transform: `rotate(${angle}deg)` }} aria-hidden>
          <span className="absolute left-1/2 top-[5px] h-[13px] w-[3px] -translate-x-1/2 rounded-full bg-[#ff6a13]" />
        </span>
      </div>
      <span className="seq-label max-w-[6rem] truncate text-center text-[10px] uppercase tracking-[0.12em] text-[#4a4a47] rtl:normal-case rtl:tracking-normal">{label}</span>
      <span className="seq-label text-[10.5px] font-semibold text-[#2b2b2b]" dir="auto">
        {valueText ?? value}
      </span>
    </div>
  );
}
