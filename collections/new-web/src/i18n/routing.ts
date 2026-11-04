import { defineRouting } from 'next-intl/routing';

export const locales = ['en', 'de', 'fa'] as const;
export type Locale = (typeof locales)[number];

export const routing = defineRouting({
  locales,
  defaultLocale: 'en',
  localePrefix: 'always',
});

export const rtlLocales: readonly Locale[] = ['fa'];
export const isRtl = (locale: string) => (rtlLocales as readonly string[]).includes(locale);
export const dirOf = (locale: string): 'rtl' | 'ltr' => (isRtl(locale) ? 'rtl' : 'ltr');

/** BCP-47 tags used for Intl formatting (Persian digits, Gregorian calendar). */
export const intlLocale: Record<Locale, string> = {
  en: 'en-GB',
  de: 'de-DE',
  fa: 'fa-IR-u-ca-gregory-nu-arabext',
};

export const localeNames: Record<Locale, { native: string; short: string }> = {
  en: { native: 'English', short: 'EN' },
  de: { native: 'Deutsch', short: 'DE' },
  fa: { native: 'فارسی', short: 'فا' },
};
