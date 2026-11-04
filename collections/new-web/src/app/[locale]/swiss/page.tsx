import type { Metadata } from 'next';
import { setRequestLocale } from 'next-intl/server';
import { PrivateDesign } from '@/components/shared/PrivateDesign';
import SwissDesign from '@/designs/swiss/SwissDesign';
import { archivo } from '@/fonts/archivo';
import { estedad } from '@/fonts/estedad';
import { inter } from '@/fonts/inter';
import type { Locale } from '@/i18n/routing';
import { designMetadata } from '@/lib/designPage';

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  return designMetadata(locale, 'swiss');
}

export default async function Page({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  return (
    <div className={`${archivo.variable} ${inter.variable} ${estedad.variable}`}>
      <PrivateDesign Design={SwissDesign} locale={locale as Locale} current="swiss" />
    </div>
  );
}
