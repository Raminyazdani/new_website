'use client';

import { useTranslations } from 'next-intl';
import { GraduationCap } from 'lucide-react';
import type { SiteData } from '@/lib/types';
import { Badge, sepOf } from './ui';

/** Education app: the three degrees, the thesis under the Tehran entry. */
export function Education({ data }: { data: SiteData }) {
  const t = useTranslations();
  const sep = sepOf(data.locale);
  const thesis = data.publications.find((x) => x.type === 'Master Thesis');
  return (
    <div className="dt-app">
      <ol className="space-y-3">
        {data.education.map((e) => (
          <li key={e.id} className="dt-card flex gap-3">
            <span className="dt-edu-ico" aria-hidden>
              <GraduationCap className="size-5" />
            </span>
            <div className="min-w-0">
              <p className="dt-mono dt-muted flex flex-wrap items-center gap-2 text-[12.5px]">
                {e.period}
                {e.current && <Badge tone="live">{t('common.current')}</Badge>}
              </p>
              <h3 className="dt-h3 mt-0.5">{e.degree}</h3>
              <p className="text-[13.5px]">
                {e.institution}
                <span className="dt-muted">{sep + e.location}</span>
              </p>
              {e.gpa && (
                <p className="dt-muted mt-1 text-[13px]">
                  {t('common.gpa')} <bdi dir="ltr">{e.gpa}</bdi>
                </p>
              )}
              {thesis && e.id === 'tehran' && (
                <div className="dt-callout mt-3">
                  <span className="dt-meta block">{t('common.thesis')}</span>
                  <bdi lang="en">{thesis.title}</bdi>
                  {thesis.supervisors?.length ? (
                    <span className="dt-muted mt-1 block text-[12.5px]">
                      {t('common.supervisors')}: <bdi lang="en">{thesis.supervisors.join(', ')}</bdi>
                    </span>
                  ) : null}
                </div>
              )}
            </div>
          </li>
        ))}
      </ol>
    </div>
  );
}
