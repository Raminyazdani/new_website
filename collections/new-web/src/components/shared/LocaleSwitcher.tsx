'use client';

import { cn } from '@/lib/utils';
import { useTranslations } from 'next-intl';
import { useLocaleSwitch } from './useLocaleSwitch';

/** Minimal segmented language switch; designs restyle it through the class props. */
export function LocaleSwitcher({
  className,
  itemClassName,
  activeClassName,
  variant = 'short',
}: {
  className?: string;
  itemClassName?: string;
  activeClassName?: string;
  variant?: 'short' | 'native';
}) {
  const t = useTranslations('dock');
  const { locale, locales, switchTo, pending } = useLocaleSwitch();
  return (
    <>
      <div role="group" aria-label={t('language')} aria-busy={pending} className={cn('inline-flex items-center', className)}>
        {locales.map((l) => (
          <button
            key={l.code}
            type="button"
            lang={l.code}
            aria-label={l.native}
            title={l.native}
            aria-pressed={l.code === locale}
            disabled={pending}
            onClick={() => switchTo(l.code)}
            className={cn('disabled:cursor-wait disabled:opacity-60', itemClassName, l.code === locale && activeClassName)}
          >
            {variant === 'short' ? l.short : l.native}
          </button>
        ))}
      </div>
      <span role="status" className="sr-only">{pending ? t('switchingLanguage') : ''}</span>
    </>
  );
}
