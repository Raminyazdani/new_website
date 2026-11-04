import type { Metadata } from 'next';
import { setRequestLocale } from 'next-intl/server';
import { PrivateDesign } from '@/components/shared/PrivateDesign';
import ObservatoryDesign from '@/designs/observatory/ObservatoryDesign';
import { cormorant } from '@/fonts/cormorant';
import { inter } from '@/fonts/inter';
import { naskh } from '@/fonts/naskh';
import { spaceMono } from '@/fonts/spacemono';
import type { Locale } from '@/i18n/routing';
import { designMetadata } from '@/lib/designPage';

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  return designMetadata(locale, 'observatory');
}

export default async function Page({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  return (
    <div className={`${cormorant.variable} ${inter.variable} ${spaceMono.variable} ${naskh.variable}`}>
      <PrivateDesign Design={ObservatoryDesign} locale={locale as Locale} current="observatory" />
    </div>
  );
}
