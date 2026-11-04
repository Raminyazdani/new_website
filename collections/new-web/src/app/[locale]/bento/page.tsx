import type { Metadata } from 'next';
import { setRequestLocale } from 'next-intl/server';
import { PrivateDesign } from '@/components/shared/PrivateDesign';
import BentoDesign from '@/designs/bento/BentoDesign';
import { geistMono, geistSans } from '@/fonts/geist';
import type { Locale } from '@/i18n/routing';
import { designMetadata } from '@/lib/designPage';

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  return designMetadata(locale, 'bento');
}

export default async function Page({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  return (
    <div className={`${geistSans.variable} ${geistMono.variable}`}>
      <PrivateDesign Design={BentoDesign} locale={locale as Locale} current="bento" />
    </div>
  );
}
