'use client';

import { cn } from '@/lib/utils';
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
  const { locale, locales, switchTo } = useLocaleSwitch();
  return (
    <div role="group" aria-label="Language" className={cn('inline-flex items-center', className)}>
      {locales.map((l) => (
        <button
          key={l.code}
          type="button"
          lang={l.code}
          aria-pressed={l.code === locale}
          onClick={() => switchTo(l.code)}
          className={cn(itemClassName, l.code === locale && activeClassName)}
        >
          {variant === 'short' ? l.short : l.native}
        </button>
      ))}
    </div>
  );
}
