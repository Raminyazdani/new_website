import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import type { DesignId } from './designs';

export async function designMetadata(locale: string, design: DesignId): Promise<Metadata> {
  const t = await getTranslations({ locale });
  return {
    title: t('meta.designTitle', { design: t(`designs.${design}.name`) }),
    description: t('meta.description'),
  };
}
