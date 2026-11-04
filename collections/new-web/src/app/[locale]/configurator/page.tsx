import type { Metadata } from 'next';
import { setRequestLocale } from 'next-intl/server';
import { PrivateDesign } from '@/components/shared/PrivateDesign';
import ConfiguratorDesign from '@/designs/configurator/ConfiguratorDesign';
import { inter } from '@/fonts/inter';
import { jetbrains } from '@/fonts/jetbrains';
import type { Locale } from '@/i18n/routing';
import { designMetadata } from '@/lib/designPage';

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  return designMetadata(locale, 'configurator');
}

export default async function Page({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  return (
    <div className={`${inter.variable} ${jetbrains.variable}`}>
      <PrivateDesign Design={ConfiguratorDesign} locale={locale as Locale} current="configurator" />
    </div>
  );
}
