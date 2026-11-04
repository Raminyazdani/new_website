import type { Metadata } from 'next';
import { setRequestLocale } from 'next-intl/server';
import { PrivateDesign } from '@/components/shared/PrivateDesign';
import CellDesign from '@/designs/cell/CellDesign';
import { estedad } from '@/fonts/estedad';
import { frauncesSoft } from '@/fonts/frauncesSoft';
import { inter } from '@/fonts/inter';
import type { Locale } from '@/i18n/routing';
import { designMetadata } from '@/lib/designPage';

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  return designMetadata(locale, 'cell');
}

export default async function Page({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  return (
    <div className={`${frauncesSoft.variable} ${inter.variable} ${estedad.variable}`}>
      <PrivateDesign Design={CellDesign} locale={locale as Locale} current="cell" />
    </div>
  );
}
