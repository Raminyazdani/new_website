import type { Metadata } from 'next';
import { setRequestLocale } from 'next-intl/server';
import { PrivateDesign } from '@/components/shared/PrivateDesign';
import { GelroomDesign } from '@/designs/gelroom/GelroomDesign';
import type { Locale } from '@/i18n/routing';
import { designMetadata } from '@/lib/designPage';

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  return designMetadata(locale, 'gelroom', { describeDesign: true });
}

export default async function Page({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  return <PrivateDesign Design={GelroomDesign} locale={locale as Locale} current="gelroom" />;
}
