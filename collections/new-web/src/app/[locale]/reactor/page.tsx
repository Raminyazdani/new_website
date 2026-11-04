import type { Metadata } from 'next';
import { setRequestLocale } from 'next-intl/server';
import { PrivateDesign } from '@/components/shared/PrivateDesign';
import ReactorDesign from '@/designs/reactor/ReactorDesign';
import { b612, b612Mono } from '@/fonts/b612';
import type { Locale } from '@/i18n/routing';
import { designMetadata } from '@/lib/designPage';

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  return designMetadata(locale, 'reactor');
}

export default async function Page({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  return (
    <div className={`${b612.variable} ${b612Mono.variable}`}>
      <PrivateDesign Design={ReactorDesign} locale={locale as Locale} current="reactor" />
    </div>
  );
}
