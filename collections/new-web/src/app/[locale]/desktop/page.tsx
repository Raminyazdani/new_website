import type { Metadata } from 'next';
import { setRequestLocale } from 'next-intl/server';
import { PrivateDesign } from '@/components/shared/PrivateDesign';
import DesktopDesign from '@/designs/desktop/DesktopDesign';
import { inter } from '@/fonts/inter';
import { jetbrains } from '@/fonts/jetbrains';
import { plexArabic } from '@/fonts/plexArabic';
import type { Locale } from '@/i18n/routing';
import { designMetadata } from '@/lib/designPage';

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  return designMetadata(locale, 'desktop');
}

export default async function Page({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  return (
    <div className={`${inter.variable} ${jetbrains.variable} ${plexArabic.variable}`}>
      <PrivateDesign Design={DesktopDesign} locale={locale as Locale} current="desktop" />
    </div>
  );
}
