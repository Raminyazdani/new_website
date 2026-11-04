import type { Metadata } from 'next';
import { setRequestLocale } from 'next-intl/server';
import { PrivateDesign } from '@/components/shared/PrivateDesign';
import CircosDesign from '@/designs/circos/CircosDesign';
import { jetbrains } from '@/fonts/jetbrains';
import { manrope } from '@/fonts/manrope';
import type { Locale } from '@/i18n/routing';
import { designMetadata } from '@/lib/designPage';

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  return designMetadata(locale, 'circos');
}

export default async function Page({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  return (
    <div className={`${manrope.variable} ${jetbrains.variable}`}>
      <PrivateDesign Design={CircosDesign} locale={locale as Locale} current="circos" />
    </div>
  );
}
