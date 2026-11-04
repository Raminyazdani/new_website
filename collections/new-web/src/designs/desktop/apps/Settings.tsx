'use client';

import { useTranslations } from 'next-intl';
import { RotateCcw } from 'lucide-react';
import { LocaleSwitcher } from '@/components/shared/LocaleSwitcher';
import type { SiteData } from '@/lib/types';
import { cn } from '@/lib/utils';
import type { Theme, Wall } from '../wm';

const WALLS: Wall[] = ['mesh', 'helix', 'night'];

/** System settings: window colour, wallpaper, language, layout reset, keyboard help, about. */
export function SettingsApp({
  data,
  theme,
  wall,
  onTheme,
  onWall,
  onReset,
}: {
  data: SiteData;
  theme: Theme;
  wall: Wall;
  onTheme: (t: Theme) => void;
  onWall: (w: Wall) => void;
  onReset: () => void;
}) {
  const t = useTranslations('desktop.settings');
  const loc = data.locale;
  const date = new Intl.DateTimeFormat(loc === 'fa' ? 'fa-IR' : loc === 'de' ? 'de-DE' : 'en-GB', { dateStyle: 'long', timeZone: 'UTC' }).format(new Date(data.generatedAt));
  const keys: Array<[string, string]> = [
    ['Ctrl / ⌘ K', t('keys.spotlight')],
    ['Esc', t('keys.esc')],
    ['Tab', t('keys.tab')],
    ['↑ ↓ Home End', t('keys.lists')],
    [t('keys.dblclick'), t('keys.max')],
  ];
  return (
    <div className="dt-app dt-settings-app">
      <fieldset className="dt-group">
        <legend className="dt-h4">{t('windows')}</legend>
        <div className="dt-radios">
          {(['light', 'dark'] as const).map((v) => (
            <label key={v} className="dt-radio">
              <input type="radio" name="dt-theme" value={v} checked={theme === v} onChange={() => onTheme(v)} />
              <span className={cn('dt-theme-swatch', v === 'dark' && 'dt-theme-swatch-dark')} aria-hidden />
              {t(v)}
            </label>
          ))}
        </div>
      </fieldset>

      <fieldset className="dt-group">
        <legend className="dt-h4">{t('wallpaper')}</legend>
        <div className="dt-radios">
          {WALLS.map((v) => (
            <label key={v} className="dt-radio">
              <input type="radio" name="dt-wall" value={v} checked={wall === v} onChange={() => onWall(v)} />
              <span className="dt-wall-swatch" data-wall={v} aria-hidden />
              {t(`walls.${v}`)}
            </label>
          ))}
        </div>
      </fieldset>

      <div className="dt-group">
        <p className="dt-h4">{t('language')}</p>
        <LocaleSwitcher variant="native" className="dt-seg mt-2" itemClassName="dt-seg-item" activeClassName="dt-seg-on" />
      </div>

      <div className="dt-group">
        <p className="dt-h4">{t('layout')}</p>
        <p className="dt-muted mt-1 text-[13px]">{t('layoutNote')}</p>
        <button type="button" className="dt-btn mt-2" onClick={onReset}>
          <RotateCcw className="size-4" aria-hidden />
          {t('reset')}
        </button>
      </div>

      <div className="dt-group">
        <p className="dt-h4">{t('keyboard')}</p>
        <dl className="dt-keys mt-2">
          {keys.map(([k, v]) => (
            <div key={k}>
              <dt>{k === t('keys.dblclick') ? <span className="text-[12.5px]">{k}</span> : <kbd dir="ltr">{k}</kbd>}</dt>
              <dd>{v}</dd>
            </div>
          ))}
        </dl>
      </div>

      <div className="dt-group">
        <p className="dt-h4">{t('about')}</p>
        <p className="dt-muted mt-1 text-[13px]">{t('aboutText', { date })}</p>
      </div>
    </div>
  );
}
