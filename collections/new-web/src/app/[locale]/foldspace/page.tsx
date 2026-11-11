import type { Metadata } from 'next';
import { setRequestLocale } from 'next-intl/server';
import { PrivateDesign } from '@/components/shared/PrivateDesign';
import { FoldspaceDesign } from '@/designs/foldspace/FoldspaceDesign';
import { bebas } from '@/fonts/bebas';
import { instrumentSerif } from '@/fonts/instrument';
import { inter } from '@/fonts/inter';
import { plexMono } from '@/fonts/plex';
import type { Locale } from '@/i18n/routing';
import { designMetadata } from '@/lib/designPage';

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  return designMetadata(locale, 'foldspace', { describeDesign: true });
}

export default async function Page({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  return (
    <div className={`${bebas.variable} ${instrumentSerif.variable} ${inter.variable} ${plexMono.variable}`}>
      <PrivateDesign Design={FoldspaceDesign} locale={locale as Locale} current="foldspace" />
    </div>
  );
}
