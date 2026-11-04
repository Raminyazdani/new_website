import type { Metadata } from 'next';
import { setRequestLocale } from 'next-intl/server';
import { PrivateDesign } from '@/components/shared/PrivateDesign';
import GenomeDesign from '@/designs/genome/GenomeDesign';
import { plexMono, plexSans } from '@/fonts/plex';
import type { Locale } from '@/i18n/routing';
import { designMetadata } from '@/lib/designPage';

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  return designMetadata(locale, 'genome');
}

export default async function Page({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  return (
    <div className={`${plexSans.variable} ${plexMono.variable}`}>
      <PrivateDesign Design={GenomeDesign} locale={locale as Locale} current="genome" />
    </div>
  );
}
