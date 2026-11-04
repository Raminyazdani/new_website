'use client';

import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { fmtNum } from '@/lib/format';
import type { ExperienceKind, SiteData } from '@/lib/types';
import { cn } from '@/lib/utils';
import type { Intent } from '../apps';
import { Badge, scrollToId, sepOf } from './ui';

const KINDS: ExperienceKind[] = ['research', 'teaching', 'industry', 'business'];

/** Timeline app: all 15 roles with their descriptions; filter chips only hide, never remove. */
export function Experience({ data, intent }: { data: SiteData; intent: Intent | null }) {
  const t = useTranslations();
  const loc = data.locale;
  const sep = sepOf(loc);
  const [kind, setKind] = useState<'all' | ExperienceKind>('all');
  const [flash, setFlash] = useState<string | null>(null);
  const kinds = KINDS.filter((k) => data.experiences.some((e) => e.kind === k));

  useEffect(() => {
    if (intent?.app !== 'experience') return;
    setKind('all');
    setFlash(intent.id);
    const a = window.setTimeout(() => scrollToId(`role-${intent.id}`), 60);
    const b = window.setTimeout(() => setFlash(null), 1800);
    return () => {
      window.clearTimeout(a);
      window.clearTimeout(b);
    };
  }, [intent]);

  return (
    <div className="dt-app">
      <div className="dt-toolbar" role="group" aria-label={t('desktop.experience.filter')}>
        {(['all', ...kinds] as const).map((k) => {
          const n = k === 'all' ? data.experiences.length : data.experiences.filter((e) => e.kind === k).length;
          return (
            <button key={k} type="button" className="dt-chip" aria-pressed={kind === k} onClick={() => setKind(k)}>
              {k === 'all' ? t('common.all') : t(`kinds.${k}`)}
              <span className="dt-count">{fmtNum(loc, n)}</span>
            </button>
          );
        })}
      </div>
      <ol className="dt-timeline">
        {data.experiences.map((e) => (
          <li key={e.id} id={`role-${e.id}`} className={cn('dt-tl-item', kind !== 'all' && e.kind !== kind && 'dt-filtered', flash === e.id && 'dt-flash')}>
            <span className="dt-tl-dot" data-kind={e.kind} aria-hidden />
            <p className="dt-mono dt-muted text-[12.5px]">
              {e.period || t('common.undated')}
              {e.months ? `${sep}${t('common.months', { count: e.months })}` : ''}
            </p>
            <h3 className="dt-h3 mt-0.5">{e.role}</h3>
            <p className="text-[13.5px]">
              {e.org}
              {e.location ? <span className="dt-muted">{sep + e.location}</span> : null}
            </p>
            <p className="mt-1.5 flex flex-wrap gap-1.5">
              <Badge>{t(`kinds.${e.kind}`)}</Badge>
              {e.current && <Badge tone="live">{t('common.current')}</Badge>}
            </p>
            <p className="dt-desc mt-2">{e.description}</p>
          </li>
        ))}
      </ol>
    </div>
  );
}
