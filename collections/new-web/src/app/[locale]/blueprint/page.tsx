import type { Metadata } from 'next';
import { setRequestLocale } from 'next-intl/server';
import { PrivateDesign } from '@/components/shared/PrivateDesign';
import BlueprintDesign from '@/designs/blueprint/BlueprintDesign';
import { barlow, barlowCondensed } from '@/fonts/barlow';
import { estedad } from '@/fonts/estedad';
import { jetbrains } from '@/fonts/jetbrains';
import type { Locale } from '@/i18n/routing';
import { designMetadata } from '@/lib/designPage';

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  return designMetadata(locale, 'blueprint');
}

export default async function Page({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  return (
    <div className={`${barlow.variable} ${barlowCondensed.variable} ${jetbrains.variable} ${estedad.variable}`}>
      <PrivateDesign Design={BlueprintDesign} locale={locale as Locale} current="blueprint" />
    </div>
  );
}
