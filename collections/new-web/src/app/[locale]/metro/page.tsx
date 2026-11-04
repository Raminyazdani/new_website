import type { Metadata } from 'next';
import { setRequestLocale } from 'next-intl/server';
import { PrivateDesign } from '@/components/shared/PrivateDesign';
import MetroDesign from '@/designs/metro/MetroDesign';
import { overpass, overpassMono } from '@/fonts/overpass';
import type { Locale } from '@/i18n/routing';
import { designMetadata } from '@/lib/designPage';

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  return designMetadata(locale, 'metro');
}

export default async function Page({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  return (
    <div className={`${overpass.variable} ${overpassMono.variable}`}>
      <PrivateDesign Design={MetroDesign} locale={locale as Locale} current="metro" />
    </div>
  );
}
