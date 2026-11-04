import type { Metadata } from 'next';
import { setRequestLocale } from 'next-intl/server';
import { PrivateDesign } from '@/components/shared/PrivateDesign';
import OrganicDesign from '@/designs/organic/OrganicDesign';
import { estedad } from '@/fonts/estedad';
import { instrumentSerif } from '@/fonts/instrument';
import { jakarta } from '@/fonts/jakarta';
import type { Locale } from '@/i18n/routing';
import { designMetadata } from '@/lib/designPage';

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  return designMetadata(locale, 'organic');
}

export default async function Page({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  return (
    <div className={`${jakarta.variable} ${instrumentSerif.variable} ${estedad.variable}`}>
      <PrivateDesign Design={OrganicDesign} locale={locale as Locale} current="organic" />
    </div>
  );
}
