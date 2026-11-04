import { intlLocale, type Locale } from '@/i18n/routing';

export const numberLocale = (locale: string) => intlLocale[(locale as Locale) ?? 'en'] ?? 'en-GB';

export const fmtNum = (locale: string, n: number, opts?: Intl.NumberFormatOptions) =>
  new Intl.NumberFormat(numberLocale(locale), opts).format(n);

/** Years without grouping separators (2024, not 2,024 / ۲٬۰۲۴). */
export const fmtYear = (locale: string, y: number) => new Intl.NumberFormat(numberLocale(locale), { useGrouping: false }).format(y);

export const isFa = (locale: string) => locale === 'fa';

/** Separator between facts. Persian uses a comma: a middle dot next to digits reads like ۰. */
export const dot = (locale: string) => (locale === 'fa' ? '، ' : ' · ');

/** Section or list number: 01, 02 … in Latin scripts; ۱, ۲ … (Persian digits, never zero-padded) in Persian. */
export const seqNo = (locale: string, n: number, pad = 2) => (locale === 'fa' ? fmtNum(locale, n) : String(n).padStart(pad, '0'));

export function publicationLabel(
  translate: { (key: string): string; has(key: string): boolean },
  catalog: 'pubType' | 'pubStatus',
  sourceLabel: string,
): string {
  const key = `${catalog}.${sourceLabel}`;
  return sourceLabel && translate.has(key) ? translate(key) : sourceLabel;
}
