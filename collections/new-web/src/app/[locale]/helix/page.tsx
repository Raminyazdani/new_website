import type { Metadata } from 'next';
import { setRequestLocale } from 'next-intl/server';
import { PrivateDesign } from '@/components/shared/PrivateDesign';
import HelixDesign from '@/designs/helix/HelixDesign';
import { inter } from '@/fonts/inter';
import { jetbrains } from '@/fonts/jetbrains';
import { spaceGrotesk } from '@/fonts/spacegrotesk';
import type { Locale } from '@/i18n/routing';
import { designMetadata } from '@/lib/designPage';

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  return designMetadata(locale, 'helix');
}

export default async function Page({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  return (
    <div className={`${inter.variable} ${spaceGrotesk.variable} ${jetbrains.variable}`}>
      <PrivateDesign Design={HelixDesign} locale={locale as Locale} current="helix" />
    </div>
  );
}
