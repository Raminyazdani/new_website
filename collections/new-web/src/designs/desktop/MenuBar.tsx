'use client';

import { useEffect, useId, useRef, useState, type CSSProperties, type KeyboardEvent, type ReactNode } from 'react';
import { useTranslations } from 'next-intl';
import { Check, Moon, Search, Sun } from 'lucide-react';
import { LocaleSwitcher } from '@/components/shared/LocaleSwitcher';
import { cn } from '@/lib/utils';
import { APP, LAUNCH_ORDER, type AppId } from './apps';
import type { Mode, Theme, Wall, WM } from './wm';

export interface MenuActions {
  open: (id: AppId) => void;
  win: (a: 'min' | 'close' | Mode) => void;
  reset: () => void;
  spotlight: () => void;
  theme: (t: Theme) => void;
  wall: (w: Wall) => void;
}

/** One menu of the bar: a disclosure button with a list of actions (↓ opens, ↑ ↓ move, Esc closes). */
function Menu({
  name,
  label,
  open,
  anyOpen,
  setOpen,
  children,
  className,
}: {
  name: string;
  label: ReactNode;
  open: boolean;
  anyOpen: boolean;
  setOpen: (n: string | null) => void;
  children: ReactNode;
  className?: string;
}) {
  const id = useId();
  const btn = useRef<HTMLButtonElement>(null);
  const panel = useRef<HTMLDivElement>(null);
  const items = () => [...(panel.current?.querySelectorAll<HTMLElement>('button:not([disabled]), a[href]') ?? [])];
  const onKey = (e: KeyboardEvent) => {
    if (e.key === 'Escape' && open) {
      e.preventDefault();
      e.stopPropagation();
      setOpen(null);
      btn.current?.focus();
    } else if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
      e.preventDefault();
      if (!open) {
        setOpen(name);
        requestAnimationFrame(() => items()[0]?.focus());
        return;
      }
      const list = items();
      const i = list.indexOf(document.activeElement as HTMLElement);
      list[(i + (e.key === 'ArrowDown' ? 1 : -1) + list.length) % list.length]?.focus();
    }
  };
  return (
    <div className={cn('dt-menu', className)} onKeyDown={onKey}>
      <button
        ref={btn}
        type="button"
        className="dt-mb-btn"
        aria-expanded={open}
        aria-controls={id}
        onClick={() => setOpen(open ? null : name)}
        onPointerEnter={(e) => e.pointerType === 'mouse' && anyOpen && !open && setOpen(name)}
      >
        {label}
      </button>
      <div ref={panel} id={id} className="dt-menu-panel" hidden={!open} onClick={(e) => (e.target as HTMLElement).closest('button, a') && setOpen(null)}>
        {children}
      </div>
    </div>
  );
}

const Item = ({ onClick, children, disabled, checked }: { onClick: () => void; children: ReactNode; disabled?: boolean; checked?: boolean }) => (
  <button type="button" className="dt-menu-item" onClick={onClick} disabled={disabled} aria-pressed={checked === undefined ? undefined : checked}>
    <Check className={cn('size-3.5 shrink-0', !checked && 'invisible')} aria-hidden />
    <span className="min-w-0 flex-1">{children}</span>
  </button>
);

function Clock({ locale }: { locale: string }) {
  const [now, setNow] = useState<Date | null>(null);
  useEffect(() => {
    setNow(new Date());
    const id = window.setInterval(() => setNow(new Date()), 20000);
    return () => window.clearInterval(id);
  }, []);
  const tag = locale === 'fa' ? 'fa-IR' : locale === 'de' ? 'de-DE' : 'en-GB';
  return (
    <time className="dt-clock" dateTime={now?.toISOString()} suppressHydrationWarning>
      {now ? new Intl.DateTimeFormat(tag, { weekday: 'short', hour: '2-digit', minute: '2-digit' }).format(now) : ''}
    </time>
  );
}

export function MenuBar({ locale, wm, focused, theme, wall, act }: { locale: string; wm: WM; focused: AppId | null; theme: Theme; wall: Wall; act: MenuActions }) {
  const t = useTranslations('desktop');
  const [open, setOpen] = useState<string | null>(null);
  const [mac, setMac] = useState(false);
  const bar = useRef<HTMLElement>(null);

  useEffect(() => setMac(/Mac|iPhone|iPad/.test(navigator.platform || navigator.userAgent)), []);
  useEffect(() => {
    if (!open) return;
    const down = (e: PointerEvent) => !bar.current?.contains(e.target as Node) && setOpen(null);
    const out = (e: FocusEvent) => !bar.current?.contains(e.relatedTarget as Node) && setOpen(null);
    document.addEventListener('pointerdown', down);
    bar.current?.addEventListener('focusout', out);
    const el = bar.current;
    return () => {
      document.removeEventListener('pointerdown', down);
      el?.removeEventListener('focusout', out);
    };
  }, [open]);

  const fw = focused ? wm[focused] : null;
  const openWins = LAUNCH_ORDER.filter((id) => wm[id].open);
  const menu = (name: string, label: ReactNode, body: ReactNode, cls?: string) => (
    <Menu name={name} label={label} open={open === name} anyOpen={open !== null} setOpen={setOpen} className={cls}>
      {body}
    </Menu>
  );

  return (
    <header ref={bar} className="dt-menubar">
      <nav className="dt-mb-start" aria-label={t('menu.label')}>
        {menu(
          'sys',
          <>
            <span className="dt-logo" aria-hidden />
            <span className="dt-mb-brand">{t('brand')}</span>
          </>,
          <>
            <Item onClick={() => act.open('settings')}>{t('menu.aboutDesktop')}</Item>
            <a href="#document" className="dt-menu-item">
              <Check className="invisible size-3.5 shrink-0" aria-hidden />
              {t('menu.document')}
            </a>
            <hr />
            <Item onClick={act.reset}>{t('menu.reset')}</Item>
          </>,
        )}
        <span className="dt-mb-app">{focused ? t(`apps.${focused}`) : t('menu.desktop')}</span>
        {menu(
          'go',
          t('menu.go'),
          LAUNCH_ORDER.map((id) => {
            const Icon = APP[id].icon;
            return (
              <button key={id} type="button" className="dt-menu-item" onClick={() => act.open(id)}>
                <span className="dt-tile dt-tile-xs" style={{ '--a': APP[id].from, '--b': APP[id].to } as CSSProperties} aria-hidden>
                  <Icon className="size-3" />
                </span>
                <span className="min-w-0 flex-1">{t(`apps.${id}`)}</span>
              </button>
            );
          }),
          'dt-mb-desk',
        )}
        {menu(
          'view',
          t('menu.view'),
          <>
            <a href="#document" className="dt-menu-item">
              <Check className="invisible size-3.5 shrink-0" aria-hidden />
              {t('menu.document')}
            </a>
            <hr />
            <Item checked={theme === 'light'} onClick={() => act.theme('light')}>
              {t('settings.light')}
            </Item>
            <Item checked={theme === 'dark'} onClick={() => act.theme('dark')}>
              {t('settings.dark')}
            </Item>
            <hr />
            {(['mesh', 'helix', 'night'] as const).map((w) => (
              <Item key={w} checked={wall === w} onClick={() => act.wall(w)}>
                {t(`settings.walls.${w}`)}
              </Item>
            ))}
          </>,
          'dt-mb-desk',
        )}
        {menu(
          'window',
          t('menu.window'),
          <>
            <Item disabled={!fw} onClick={() => act.win('min')}>
              {t('menu.minimize')}
            </Item>
            <Item disabled={!fw} onClick={() => act.win('max')}>
              {fw?.mode === 'max' ? t('menu.restore') : t('menu.maximize')}
            </Item>
            <Item disabled={!fw} onClick={() => act.win('start')}>
              {t('menu.snapStart')}
            </Item>
            <Item disabled={!fw} onClick={() => act.win('end')}>
              {t('menu.snapEnd')}
            </Item>
            <Item disabled={!fw} onClick={() => act.win('close')}>
              {t('menu.close')}
            </Item>
            {openWins.length > 0 && <hr />}
            {openWins.map((id) => (
              <Item key={id} checked={id === focused} onClick={() => act.open(id)}>
                {t(`apps.${id}`)}
                {wm[id].min ? ` (${t('menu.minimized')})` : ''}
              </Item>
            ))}
            <hr />
            <Item onClick={act.reset}>{t('menu.reset')}</Item>
          </>,
          'dt-mb-desk',
        )}
      </nav>
      <div className="dt-mb-end">
        <button type="button" className="dt-mb-btn dt-mb-search" onClick={act.spotlight} aria-label={t('spotlight.open')} aria-keyshortcuts={mac ? 'Meta+K' : 'Control+K'}>
          <Search className="size-4" aria-hidden />
          <kbd className="dt-mb-kbd" aria-hidden dir="ltr">
            {mac ? '⌘K' : 'Ctrl K'}
          </kbd>
        </button>
        <button
          type="button"
          className="dt-mb-btn"
          onClick={() => act.theme(theme === 'light' ? 'dark' : 'light')}
          aria-pressed={theme === 'dark'}
          aria-label={t('settings.darkWindows')}
          title={t('settings.darkWindows')}
        >
          {theme === 'dark' ? <Sun className="size-4" aria-hidden /> : <Moon className="size-4" aria-hidden />}
        </button>
        <LocaleSwitcher className="dt-mb-locale" itemClassName="dt-mb-loc" activeClassName="dt-mb-loc-on" />
        <Clock locale={locale} />
      </div>
    </header>
  );
}
