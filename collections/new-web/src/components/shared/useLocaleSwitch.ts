'use client';

import { useLocale } from 'next-intl';
import { useTransition } from 'react';
import { usePathname, useRouter } from '@/i18n/navigation';
import { localeNames, routing, type Locale } from '@/i18n/routing';
import { readPreferences, withPreferences } from '../../../../../public/portfolio/design-navigation.js';

/** Switch language while staying on the same design/page. Remembers the choice for the root redirect. */
export function useLocaleSwitch() {
  const locale = useLocale() as Locale;
  const router = useRouter();
  const pathname = usePathname();
  const [pending, start] = useTransition();
  const switchTo = (next: Locale) => {
    if (next === locale) return;
    try {
      window.localStorage.setItem('ry-locale', next);
    } catch {
      /* ignore */
    }
    const destination = withPreferences(pathname, readPreferences(window.location.search));
    start(() => router.replace(destination, { locale: next, scroll: false }));
  };
  return { locale, locales: routing.locales.map((l) => ({ code: l, ...localeNames[l] })), switchTo, pending };
}
