'use client';

import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { ArrowUpRight, BookOpen, Copy } from 'lucide-react';
import { Authors } from '@/components/kit/Authors';
import { CopyButton } from '@/components/shared/CopyButton';
import { fmtYear, publicationLabel } from '@/lib/format';
import type { SiteData } from '@/lib/types';
import { cn } from '@/lib/utils';
import type { Intent } from '../apps';
import { Badge, sepOf } from './ui';

/** Papers app: library list + reader with citation, links and BibTeX. Every reader is rendered
    (only the selected one is shown), so the document view can show them all. */
export function Papers({ data, intent }: { data: SiteData; intent: Intent | null }) {
  const t = useTranslations();
  const loc = data.locale;
  const sep = sepOf(loc);
  const pubs = data.publications;
  const [sel, setSel] = useState(pubs[0]?.id);

  useEffect(() => {
    if (intent?.app === 'papers' && intent.id) setSel(intent.id);
  }, [intent]);

  return (
    <div className="dt-split dt-papers">
      <nav className="dt-side dt-side-wide" aria-label={t('desktop.papers.library')}>
        <ul>
          {pubs.map((p) => (
            <li key={p.id}>
              <button type="button" className="dt-side-item dt-paper-item" aria-current={sel === p.id ? 'true' : undefined} onClick={() => setSel(p.id)}>
                <BookOpen className="mt-0.5 size-4 shrink-0 opacity-70" aria-hidden />
                <span className="min-w-0">
                  <bdi lang="en" className="block font-medium leading-snug">
                    {p.title}
                  </bdi>
                  <span className="dt-muted block text-[12px]">
                    {publicationLabel(t, 'pubType', p.type)}
                    {p.year ? sep + fmtYear(loc, p.year) : ''}
                  </span>
                </span>
              </button>
            </li>
          ))}
        </ul>
      </nav>
      <div className="dt-pane">
        {pubs.map((p) => (
          <article key={p.id} className={cn('dt-reader', sel !== p.id && 'dt-inactive')} aria-labelledby={`pub-${p.id}`}>
            <p className="flex flex-wrap gap-1.5">
              <Badge>{publicationLabel(t, 'pubType', p.type)}</Badge>
              <Badge tone={p.status === 'Published' ? 'live' : 'plain'}>{publicationLabel(t, 'pubStatus', p.status)}</Badge>
              {p.year && <Badge>{fmtYear(loc, p.year)}</Badge>}
            </p>
            <h3 id={`pub-${p.id}`} className="dt-h3 dt-reader-title mt-3">
              <bdi lang="en">{p.title}</bdi>
            </h3>
            <p className="mt-2 text-[13.5px]">
              <Authors ownerName={data.person.fullName} p={p} meClassName="font-semibold underline decoration-[var(--dt-accent)] decoration-2 underline-offset-2" etAl={t('common.withCoAuthors')} />
            </p>
            {(p.venue || p.publisher) && (
              <p className="dt-muted mt-1 text-[13.5px]">
                <bdi lang="en">
                  {p.venue && <i>{p.venue}</i>}
                  {p.venue && p.publisher ? ' — ' : ''}
                  {p.publisher}
                </bdi>
              </p>
            )}
            {p.supervisors?.length ? (
              <p className="dt-muted mt-1 text-[13px]">
                {t('common.supervisors')}: <bdi lang="en">{p.supervisors.join(', ')}</bdi>
              </p>
            ) : null}
            <p className="mt-3 flex flex-wrap gap-2">
              {p.url && (
                <a href={p.url} target="_blank" rel="noreferrer" className="dt-btn" dir="ltr">
                  <ArrowUpRight className="size-4" aria-hidden />
                  {p.doi ? `doi:${p.doi}` : t('common.visit')}
                </a>
              )}
              {p.isbn && (
                <span className="dt-badge" dir="ltr">
                  ISBN {p.isbn}
                </span>
              )}
            </p>
            {p.bibtex && (
              <div className="dt-bib mt-4">
                <div className="flex items-center justify-between gap-2">
                  <span className="dt-meta">{t('common.bibtex')}</span>
                  <CopyButton value={p.bibtex} className="dt-btn dt-btn-sm">
                    <Copy className="size-3.5" aria-hidden /> {t('common.copyBibtex')}
                  </CopyButton>
                </div>
                <pre dir="ltr" lang="en">
                  <code>{p.bibtex}</code>
                </pre>
              </div>
            )}
          </article>
        ))}
      </div>
    </div>
  );
}
