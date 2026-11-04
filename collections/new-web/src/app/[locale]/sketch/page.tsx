import type { Metadata } from 'next';
import { setRequestLocale } from 'next-intl/server';
import { PrivateDesign } from '@/components/shared/PrivateDesign';
import SketchDesign from '@/designs/sketch/SketchDesign';
import { arefRuqaa } from '@/fonts/arefRuqaa';
import { caveat } from '@/fonts/caveat';
import { nunito } from '@/fonts/nunito';
import type { Locale } from '@/i18n/routing';
import { designMetadata } from '@/lib/designPage';

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  return designMetadata(locale, 'sketch');
}

export default async function Page({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  return (
    <div className={`${caveat.variable} ${nunito.variable} ${arefRuqaa.variable}`}>
      <PrivateDesign Design={SketchDesign} locale={locale as Locale} current="sketch" />
    </div>
  );
}
