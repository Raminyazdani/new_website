import type { Metadata } from 'next';
import { setRequestLocale } from 'next-intl/server';
import { PrivateDesign } from '@/components/shared/PrivateDesign';
import { LoomDesign } from '@/designs/loom/LoomDesign';
import { instrumentSerif } from '@/fonts/instrument';
import { plexMono } from '@/fonts/plex';
import { inter } from '@/fonts/inter';
import type { Locale } from '@/i18n/routing';
import { designMetadata } from '@/lib/designPage';

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  return designMetadata(locale, 'loom', { describeDesign: true });
}

export default async function Page({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  return (
    <div className={`${instrumentSerif.variable} ${plexMono.variable} ${inter.variable}`}>
      <PrivateDesign Design={LoomDesign} locale={locale as Locale} current="loom" />
    </div>
  );
}
