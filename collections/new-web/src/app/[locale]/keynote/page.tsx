import type { Metadata } from 'next';
import { setRequestLocale } from 'next-intl/server';
import { PrivateDesign } from '@/components/shared/PrivateDesign';
import KeynoteDesign from '@/designs/keynote/KeynoteDesign';
import { estedad } from '@/fonts/estedad';
import { jetbrains } from '@/fonts/jetbrains';
import { sora } from '@/fonts/sora';
import type { Locale } from '@/i18n/routing';
import { designMetadata } from '@/lib/designPage';

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  return designMetadata(locale, 'keynote');
}

export default async function Page({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  return (
    <div className={`${sora.variable} ${jetbrains.variable} ${estedad.variable}`}>
      <PrivateDesign Design={KeynoteDesign} locale={locale as Locale} current="keynote" />
    </div>
  );
}
