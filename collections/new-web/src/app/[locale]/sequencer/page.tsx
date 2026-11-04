import type { Metadata } from 'next';
import { setRequestLocale } from 'next-intl/server';
import { PrivateDesign } from '@/components/shared/PrivateDesign';
import SequencerDesign from '@/designs/sequencer/SequencerDesign';
import { doto } from '@/fonts/doto';
import { inter } from '@/fonts/inter';
import { martianMono } from '@/fonts/martian';
import type { Locale } from '@/i18n/routing';
import { designMetadata } from '@/lib/designPage';

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  return designMetadata(locale, 'sequencer');
}

export default async function Page({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  return (
    <div className={`${doto.variable} ${inter.variable} ${martianMono.variable}`}>
      <PrivateDesign Design={SequencerDesign} locale={locale as Locale} current="sequencer" />
    </div>
  );
}
