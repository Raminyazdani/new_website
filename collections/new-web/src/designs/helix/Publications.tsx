'use client';

import { BookOpen, Check, Copy, ExternalLink, FileText } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { BorderBeam } from '@/components/magicui/border-beam';
import { CopyButton } from '@/components/shared/CopyButton';
import { Reveal } from '@/components/shared/Reveal';
import { fmtYear, publicationLabel } from '@/lib/format';
import type { SiteData } from '@/lib/types';
import { cn } from '@/lib/utils';
import { SectionHeader } from './ui';

export function Publications({ data }: { data: SiteData }) {
  const t = useTranslations();
  return (
    <section id="publications" className="relative py-32">
      <div className="mx-auto max-w-7xl px-6 sm:px-10">
        <SectionHeader index={5} kicker={t('sections.publications.kicker')} title={t('sections.publications.title')} />
        <div className="grid gap-5 lg:grid-cols-2">
          {data.publications.map((p, i) => {
            const published = p.status === 'Published';
            const prep = p.status === 'Manuscript in Preparation';
            return (
              <Reveal key={p.id} delay={i * 0.05} className={cn(published && 'lg:col-span-2')}>
                <article
                  className={cn(
                    'relative h-full overflow-hidden rounded-3xl border p-6 sm:p-8',
                    published ? 'border-[#2ee6c5]/25 bg-gradient-to-br from-[#08201f] via-[#070c17] to-[#0a1222]' : 'border-white/[0.08] bg-[#070c17]/70',
                    prep && 'opacity-80',
                  )}
                >
                  <div className="mb-4 flex flex-wrap items-center gap-2 text-xs">
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-white/[0.06] px-2.5 py-1 text-[#cfe3f2]">
                      {p.type === 'Book Chapter' ? <BookOpen className="size-3.5" /> : <FileText className="size-3.5" />}
                      {publicationLabel(t, 'pubType', p.type)}
                    </span>
                    <span
                      className={cn(
                        'rounded-full px-2.5 py-1',
                        published ? 'bg-[#2ee6c5]/15 text-[#2ee6c5]' : p.status === 'Submitted' ? 'bg-[#4cc9f0]/15 text-[#4cc9f0]' : 'bg-white/[0.05] text-[#8ea3b7]',
                      )}
                    >
                      {publicationLabel(t, 'pubStatus', p.status)}
                    </span>
                    {p.firstAuthor && <span className="rounded-full bg-[#ffb547]/15 px-2.5 py-1 text-[#ffb547]">{t('common.firstAuthor')}</span>}
                    {p.year && <span className="ms-auto font-mono text-[#6f879c]">{fmtYear(data.locale, p.year)}</span>}
                  </div>
                  <h3 lang="en" dir="ltr" className={cn('font-display font-semibold leading-snug text-white', published ? 'text-2xl sm:text-3xl' : 'text-lg')}>
                    {p.title}
                  </h3>
                  <p lang="en" dir="ltr" className="mt-3 text-sm leading-relaxed text-[#8ea3b7]">
                    {p.authors.map((a, k) => (
                      <span key={a}>
                        <span className={cn(Boolean(data.person.fullName && a.includes(data.person.fullName)) && 'font-semibold text-white')}>{a}</span>
                        {k < p.authors.length - 1 ? ', ' : ''}
                      </span>
                    ))}
                    {p.hasMoreAuthors && <span className="italic"> · {t('common.withCoAuthors')}</span>}
                  </p>
                  {(p.venue || p.publisher) && (
                    <p lang="en" dir="ltr" className="mt-2 text-sm text-[#b6c7d6]">
                      <span className="italic">{p.venue}</span>
                      {p.publisher && <> · {p.publisher}</>}
                    </p>
                  )}
                  {p.supervisors && (
                    <p className="mt-2 text-sm text-[#8ea3b7]">
                      {t('common.supervisors')}: <span lang="en">{p.supervisors.join(', ')}</span>
                    </p>
                  )}
                  {(p.doi || p.bibtex) && (
                    <div className="mt-6 flex flex-wrap items-center gap-3">
                      {p.doi && p.url && (
                        <a href={p.url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 rounded-full bg-[#2ee6c5] px-4 py-2 text-sm font-medium text-[#04110f] transition hover:brightness-110">
                          {t('common.doi')} <span className="font-mono text-xs" dir="ltr">{p.doi}</span>
                          <ExternalLink className="size-3.5" />
                        </a>
                      )}
                      {p.isbn && (
                        <span className="font-mono text-xs text-[#6f879c]" dir="ltr">
                          ISBN {p.isbn}
                        </span>
                      )}
                      {p.bibtex && (
                        <CopyButton
                          value={p.bibtex}
                          className="inline-flex items-center gap-2 rounded-full border border-white/15 px-4 py-2 text-sm text-[#cfe3f2] transition hover:border-white/30"
                          copiedLabel={
                            <span className="inline-flex items-center gap-2 text-[#2ee6c5]">
                              <Check className="size-3.5" /> {t('common.copied')}
                            </span>
                          }
                        >
                          <span className="inline-flex items-center gap-2">
                            <Copy className="size-3.5" /> {t('common.copyBibtex')}
                          </span>
                        </CopyButton>
                      )}
                    </div>
                  )}
                  {published && <BorderBeam size={300} duration={12} colorFrom="#2ee6c5" colorTo="#4cc9f0" />}
                </article>
              </Reveal>
            );
          })}
        </div>
      </div>
    </section>
  );
}
