import type { Metadata } from 'next';
import { setRequestLocale } from 'next-intl/server';
import { PrivateDesign } from '@/components/shared/PrivateDesign';
import CinemaDesign from '@/designs/cinema/CinemaDesign';
import { bebas } from '@/fonts/bebas';
import { courierPrime } from '@/fonts/courier';
import { inter } from '@/fonts/inter';
import { lalezar } from '@/fonts/lalezar';
import type { Locale } from '@/i18n/routing';
import { designMetadata } from '@/lib/designPage';

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  return designMetadata(locale, 'cinema');
}

export default async function Page({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  return (
    <div className={`${bebas.variable} ${courierPrime.variable} ${inter.variable} ${lalezar.variable}`}>
      <PrivateDesign Design={CinemaDesign} locale={locale as Locale} current="cinema" />
    </div>
  );
}
