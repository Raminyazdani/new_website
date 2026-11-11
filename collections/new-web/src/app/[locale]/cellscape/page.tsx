import type { Metadata } from 'next';
import { setRequestLocale } from 'next-intl/server';
import { PrivateDesign } from '@/components/shared/PrivateDesign';
import { CellscapeDesign } from '@/designs/cellscape/CellscapeDesign';
import { inter } from '@/fonts/inter';
import { plexMono } from '@/fonts/plex';
import type { Locale } from '@/i18n/routing';
import { designMetadata } from '@/lib/designPage';

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  return designMetadata(locale, 'cellscape', { describeDesign: true });
}

export default async function Page({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  return (
    <div className={`${inter.variable} ${plexMono.variable}`}>
      <PrivateDesign Design={CellscapeDesign} locale={locale as Locale} current="cellscape" />
    </div>
  );
}
