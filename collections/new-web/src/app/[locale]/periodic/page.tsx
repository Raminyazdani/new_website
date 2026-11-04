import type { Metadata } from 'next';
import { setRequestLocale } from 'next-intl/server';
import { PrivateDesign } from '@/components/shared/PrivateDesign';
import PeriodicDesign from '@/designs/periodic/PeriodicDesign';
import { bricolage } from '@/fonts/bricolage';
import { estedad } from '@/fonts/estedad';
import { jetbrains } from '@/fonts/jetbrains';
import type { Locale } from '@/i18n/routing';
import { designMetadata } from '@/lib/designPage';

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  return designMetadata(locale, 'periodic');
}

export default async function Page({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  return (
    <div className={`${bricolage.variable} ${jetbrains.variable} ${estedad.variable}`}>
      <PrivateDesign Design={PeriodicDesign} locale={locale as Locale} current="periodic" />
    </div>
  );
}
