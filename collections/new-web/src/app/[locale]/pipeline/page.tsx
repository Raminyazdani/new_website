import type { Metadata } from 'next';
import { setRequestLocale } from 'next-intl/server';
import { PrivateDesign } from '@/components/shared/PrivateDesign';
import PipelineDesign from '@/designs/pipeline/PipelineDesign';
import { inter } from '@/fonts/inter';
import { jetbrains } from '@/fonts/jetbrains';
import type { Locale } from '@/i18n/routing';
import { designMetadata } from '@/lib/designPage';

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  return designMetadata(locale, 'pipeline');
}

export default async function Page({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  return (
    <div className={`${inter.variable} ${jetbrains.variable}`}>
      <PrivateDesign Design={PipelineDesign} locale={locale as Locale} current="pipeline" />
    </div>
  );
}
