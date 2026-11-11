import type { Metadata } from 'next';
import { setRequestLocale } from 'next-intl/server';
import { PrivateDesign } from '@/components/shared/PrivateDesign';
import { GradientDesign } from '@/designs/gradient/GradientDesign';
import type { Locale } from '@/i18n/routing';
import { designMetadata } from '@/lib/designPage';

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  return designMetadata(locale, 'gradient', { describeDesign: true });
}

export default async function Page({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  return <PrivateDesign Design={GradientDesign} locale={locale as Locale} current="gradient" />;
}
