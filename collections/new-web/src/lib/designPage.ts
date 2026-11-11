import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import type { DesignId } from './designs';

export async function designMetadata(locale: string, design: DesignId, { describeDesign = false } = {}): Promise<Metadata> {
  const t = await getTranslations({ locale });
  return {
    title: t('meta.designTitle', { design: t(`designs.${design}.name`) }),
    description: describeDesign ? t(`designs.${design}.description`) : t('meta.description'),
  };
}
