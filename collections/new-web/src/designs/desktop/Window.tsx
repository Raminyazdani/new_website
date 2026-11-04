'use client';

import { useRef, type CSSProperties, type PointerEvent as RPointerEvent, type ReactNode } from 'react';
import { useTranslations } from 'next-intl';
import { ChevronLeft, Maximize2, Minimize2, Minus, PanelLeft, PanelRight, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { APP, type AppId } from './apps';
import { clampWin, DOCK, MENUBAR, type Area, type Mode, type Win } from './wm';

interface Props {
  id: AppId;
  title: string;
  win: Win;
  focused: boolean;
  rtl: boolean;
  /** desktop layout (≥ 1024 px): windows can be dragged and resized */
  desk: boolean;
  /** phone layout: this app is the open full-screen sheet */
  sheet: boolean;
  area: () => Area;
  bodyRef: (el: HTMLDivElement | null) => void;
  onFocus: () => void;
  onClose: () => void;
  onBack: () => void;
  onMin: () => void;
  onMode: (m: Mode) => void;
  onGeom: (g: { x: number; y: number; w: number; h: number }) => void;
  children: ReactNode;
}

/**
 * One app window. Dragging (title bar) and resizing (corner) write CSS variables straight to the element
 * while the pointer moves and commit to the window manager on release, so a drag never re-renders the
 * app inside. Every pointer action has a button alternative (snap, maximise) — WCAG 2.5.7.
 */
export function Window({ id, title, win, focused, rtl, desk, sheet, area, bodyRef, onFocus, onClose, onBack, onMin, onMode, onGeom, children }: Props) {
  const t = useTranslations('desktop.win');
  const ref = useRef<HTMLElement>(null);
  const Icon = APP[id].icon;
  const s = rtl ? -1 : 1;

  const track = (e: RPointerEvent<HTMLElement>, apply: (dx: number, dy: number) => Win) => {
    const el = ref.current;
    const handle = e.currentTarget;
    if (!el) return;
    e.preventDefault();
    const sx = e.clientX;
    const sy = e.clientY;
    let last: Win | null = null;
    handle.setPointerCapture(e.pointerId);
    el.classList.add('dt-dragging');
    const move = (ev: PointerEvent) => {
      last = apply((ev.clientX - sx) * s, ev.clientY - sy);
      el.style.setProperty('--x', `${last.x}px`);
      el.style.setProperty('--y', `${last.y}px`);
      el.style.setProperty('--w', `${last.w}px`);
      el.style.setProperty('--h', `${last.h}px`);
    };
    const up = () => {
      handle.removeEventListener('pointermove', move);
      handle.removeEventListener('pointerup', up);
      handle.removeEventListener('pointercancel', up);
      el.classList.remove('dt-dragging');
      if (last) onGeom({ x: last.x, y: last.y, w: last.w, h: last.h });
    };
    handle.addEventListener('pointermove', move);
    handle.addEventListener('pointerup', up);
    handle.addEventListener('pointercancel', up);
  };

  const startDrag = (e: RPointerEvent<HTMLElement>) => {
    if (!desk || e.button !== 0 || (e.target as HTMLElement).closest('button, a, input')) return;
    let base = win;
    if (win.mode !== 'normal' && ref.current) {
      // leave the snapped/maximised state and keep the window under the pointer
      const r = ref.current.getBoundingClientRect();
      const rel = (rtl ? r.right - e.clientX : e.clientX - r.left) / r.width;
      const px = rtl ? window.innerWidth - e.clientX : e.clientX; // pointer, from the start edge
      base = { ...win, mode: 'normal', x: px - DOCK - rel * win.w, y: Math.max(0, e.clientY - MENUBAR - 18) };
      ref.current.dataset.mode = 'normal';
    }
    track(e, (dx, dy) => clampWin({ ...base, x: base.x + dx, y: base.y + dy }, area()));
  };

  const startResize = (e: RPointerEvent<HTMLElement>) => {
    if (!desk || e.button !== 0) return;
    track(e, (dx, dy) => clampWin({ ...win, w: win.w + dx, h: win.h + dy }, area()));
  };

  const style = { '--x': `${win.x}px`, '--y': `${win.y}px`, '--w': `${win.w}px`, '--h': `${win.h}px`, zIndex: sheet ? undefined : 10 + win.z } as CSSProperties;
  const max = win.mode === 'max';

  return (
    <section
      ref={ref}
      id={`win-${id}`}
      aria-labelledby={`win-${id}-title`}
      className={cn('dt-win', !win.open && 'dt-closed', win.min && 'dt-min', focused && 'dt-focused')}
      data-mode={win.mode}
      data-app={id}
      data-doc={APP[id].doc ? undefined : 'skip'}
      data-sheet={sheet ? '' : undefined}
      style={style}
      onPointerDown={onFocus}
      onFocus={onFocus}
    >
      <header className="dt-titlebar" onPointerDown={startDrag} onDoubleClick={(e) => desk && !(e.target as HTMLElement).closest('button') && onMode('max')}>
        <button type="button" className="dt-back" onClick={onBack}>
          <ChevronLeft className="flip-rtl size-5" aria-hidden />
          <span>{t('back')}</span>
        </button>
        <span className="dt-tile dt-tile-sm" style={{ '--a': APP[id].from, '--b': APP[id].to } as CSSProperties} aria-hidden>
          <Icon className="size-3.5" />
        </span>
        <h2 id={`win-${id}-title`} className="dt-wintitle">
          {title}
        </h2>
        <div className="dt-ctrls">
          <button type="button" className="dt-ctrl" aria-pressed={win.mode === 'start'} aria-label={t('snapStart', { app: title })} title={t('snapStart', { app: title })} onClick={() => onMode('start')}>
            <PanelLeft className="flip-rtl size-3.5" aria-hidden />
          </button>
          <button type="button" className="dt-ctrl" aria-pressed={win.mode === 'end'} aria-label={t('snapEnd', { app: title })} title={t('snapEnd', { app: title })} onClick={() => onMode('end')}>
            <PanelRight className="flip-rtl size-3.5" aria-hidden />
          </button>
          <button type="button" className="dt-ctrl" aria-label={t('minimize', { app: title })} title={t('minimize', { app: title })} onClick={onMin}>
            <Minus className="size-3.5" aria-hidden />
          </button>
          <button
            type="button"
            className="dt-ctrl"
            aria-pressed={max}
            aria-label={t(max ? 'restore' : 'maximize', { app: title })}
            title={t(max ? 'restore' : 'maximize', { app: title })}
            onClick={() => onMode('max')}
          >
            {max ? <Minimize2 className="size-3.5" aria-hidden /> : <Maximize2 className="size-3.5" aria-hidden />}
          </button>
          <button type="button" className="dt-ctrl dt-ctrl-close" aria-label={t('close', { app: title })} title={t('close', { app: title })} onClick={onClose}>
            <X className="size-3.5" aria-hidden />
          </button>
        </div>
      </header>
      <div ref={bodyRef} className="dt-body" tabIndex={-1}>
        {children}
      </div>
      <span className="dt-resize" onPointerDown={startResize} aria-hidden />
    </section>
  );
}
