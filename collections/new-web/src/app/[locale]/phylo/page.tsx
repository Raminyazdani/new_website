import type { Metadata } from 'next';
import { setRequestLocale } from 'next-intl/server';
import { PrivateDesign } from '@/components/shared/PrivateDesign';
import { PhyloDesign } from '@/designs/phylo/PhyloDesign';
import type { Locale } from '@/i18n/routing';
import { designMetadata } from '@/lib/designPage';

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  return designMetadata(locale, 'phylo', { describeDesign: true });
}

export default async function Page({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  return <PrivateDesign Design={PhyloDesign} locale={locale as Locale} current="phylo" />;
}
