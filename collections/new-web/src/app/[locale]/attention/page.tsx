import type { Metadata } from 'next';
import { setRequestLocale } from 'next-intl/server';
import { PrivateDesign } from '@/components/shared/PrivateDesign';
import { AttentionDesign } from '@/designs/attention/AttentionDesign';
import { archivo } from '@/fonts/archivo';
import { jetbrains } from '@/fonts/jetbrains';
import type { Locale } from '@/i18n/routing';
import { designMetadata } from '@/lib/designPage';

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  return designMetadata(locale, 'attention', { describeDesign: true });
}

export default async function Page({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  return (
    <div className={`${archivo.variable} ${jetbrains.variable}`}>
      <PrivateDesign Design={AttentionDesign} locale={locale as Locale} current="attention" />
    </div>
  );
}
