'use client';

import { useEffect, useId, useRef, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { cn } from '@/lib/utils';

/**
 * Accessible modal dialog (APG pattern): focus moves into the dialog, Tab is trapped,
 * Esc / backdrop / close button close it, focus returns to the opener. Styling via props.
 */
export function Dialog({
  open,
  onClose,
  title,
  children,
  className,
  overlayClassName,
  closeClassName,
  hideTitle = false,
  portal = false,
}: {
  open: boolean;
  onClose: () => void;
  title: ReactNode;
  children: ReactNode;
  className?: string;
  overlayClassName?: string;
  closeClassName?: string;
  hideTitle?: boolean;
  /** render into document.body (loses the design's CSS variables) — default: in place */
  portal?: boolean;
}) {
  const t = useTranslations('common');
  const ref = useRef<HTMLDivElement>(null);
  const titleId = useId();
  const opener = useRef<Element | null>(null);

  useEffect(() => {
    if (!open) return;
    opener.current = document.activeElement;
    const el = ref.current;
    const focusables = () =>
      Array.from(el?.querySelectorAll<HTMLElement>('a[href], button:not([disabled]), input, select, textarea, [tabindex]:not([tabindex="-1"])') ?? []).filter(
        (n) => n.offsetParent !== null || n === document.activeElement,
      );
    (focusables()[0] ?? el)?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.stopPropagation();
        onClose();
      } else if (e.key === 'Tab') {
        const f = focusables();
        if (!f.length) return;
        const first = f[0];
        const last = f[f.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };
    document.addEventListener('keydown', onKey, true);
    const prevOverflow = document.documentElement.style.overflow;
    document.documentElement.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey, true);
      document.documentElement.style.overflow = prevOverflow;
      (opener.current as HTMLElement | null)?.focus?.();
    };
  }, [open, onClose]);

  if (!open || typeof document === 'undefined') return null;
  const node = (
    <div className={cn('fixed inset-0 z-[90] grid place-items-center bg-black/50 p-4', overlayClassName)} onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div ref={ref} role="dialog" aria-modal="true" aria-labelledby={titleId} tabIndex={-1} className={cn('relative max-h-[88dvh] w-full max-w-xl overflow-auto outline-none', className)}>
        <h2 id={titleId} className={cn(hideTitle && 'sr-only')}>
          {title}
        </h2>
        <button type="button" onClick={onClose} aria-label={t('close')} className={cn('absolute end-3 top-3 grid size-9 place-items-center rounded-full', closeClassName)}>
          <X className="size-4" />
        </button>
        {children}
      </div>
    </div>
  );
  return portal ? createPortal(node, document.body) : node;
}
