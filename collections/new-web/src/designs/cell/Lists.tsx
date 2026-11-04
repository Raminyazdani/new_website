'use client';

import { useTranslations } from 'next-intl';
import { ArrowUpRight, Copy, Mail } from 'lucide-react';
import { Authors } from '@/components/kit/Authors';
import { ShowAll } from '@/components/kit/ShowAll';
import { BrandIcon } from '@/components/shared/BrandIcon';
import { CopyButton } from '@/components/shared/CopyButton';
import { dot, fmtNum, fmtYear, publicationLabel } from '@/lib/format';
import type { ProjectCategory, SiteData } from '@/lib/types';
import { cn } from '@/lib/utils';

/* Complete lists shared by the organelle panel and the textbook chapters. `compact` = panel. */
type P = { data: SiteData; compact?: boolean };
export const CATS: ProjectCategory[] = ['biotech', 'structural', 'ml', 'omics', 'software'];
const more = 'cl-btn mt-3';

export function Identity({ data, compact }: P) {
  const t = useTranslations();
  const p = data.person;
  return (
    <div className={cn('space-y-3 leading-relaxed', compact ? 'text-[14px]' : 'text-[16px]')}>
      <p className="font-semibold">{p.statement}</p>
      {p.about.map((x, i) => (
        <p key={i}>{x}</p>
      ))}
      <p className="flex flex-wrap gap-1.5 pt-1">
        {p.labels.map((l) => (
          <span key={l} className="cl-tag">
            {l}
          </span>
        ))}
      </p>
      <p className="text-[13px] text-[#67596b]">
        {p.location} · {p.status}
      </p>
      {compact && <p className="sr-only">{t('cell.panel.identity')}</p>}
    </div>
  );
}

export function Focus({ data }: P) {
  const t = useTranslations();
  return (
    <div className="space-y-3 text-[14px] leading-relaxed">
      <p className="font-semibold text-[#2a2230]">{data.person.availability}</p>
      <ul className="space-y-2">
        {data.current.map((e) => (
          <li key={e.id}>
            <b>{e.role}</b>
            <span className="block text-[13px] text-[#67596b]">
              {e.org} · {e.period}
            </span>
          </li>
        ))}
      </ul>
      <p className="text-[13px] text-[#67596b]">{t('cell.focusNote', { count: data.current.length })}</p>
    </div>
  );
}

export function Education({ data, compact }: P) {
  const t = useTranslations();
  const thesis = data.publications.find((x) => x.type === 'Master Thesis');
  return (
    <ol className={cn('space-y-4', compact ? 'text-[14px]' : 'text-[15px]')}>
      {data.education.map((e) => (
        <li key={e.id}>
          <b className="block leading-snug">{e.degree}</b>
          <span className="block text-[#4c3f50]">{e.institution}</span>
          <span className="block text-[13px] text-[#67596b]">
            {e.location} · {e.period}
            {e.gpa ? (
              <>
                {' · '}
                {t('common.gpa')} <bdi dir="ltr">{e.gpa}</bdi>
              </>
            ) : null}
          </span>
          {e.id === 'tehran' && thesis && (
            <span className="mt-1 block text-[13.5px]">
              {t('common.thesis')}: <bdi lang="en">{thesis.title}</bdi>
            </span>
          )}
        </li>
      ))}
    </ol>
  );
}

export function Roles({ data, compact }: P) {
  const t = useTranslations();
  return (
    <ol className={cn('space-y-4', compact ? 'text-[14px]' : 'text-[15px]')}>
      {data.experiences.map((e) => (
        <li key={e.id} className={cn(!compact && 'grid gap-x-6 md:grid-cols-[minmax(0,13rem)_minmax(0,1fr)]')}>
          <p className="text-[13px] text-[#67596b]">
            {e.period || t('common.undated')}
            {e.months ? dot(data.locale) + t('common.months', { count: e.months }) : ''}
            <span className="block">{t(`kinds.${e.kind}`)}</span>
          </p>
          <div>
            <b className="block leading-snug">{e.role}</b>
            <span className="block text-[13.5px] text-[#4c3f50]">
              {e.org}
              {e.location ? ` · ${e.location}` : ''}
            </span>
            <p className="mt-1 leading-relaxed">{e.description}</p>
          </div>
        </li>
      ))}
    </ol>
  );
}

export function Projects({ data, compact }: P) {
  const t = useTranslations();
  const all = [...data.projects, ...data.archive];
  return (
    <div className="space-y-6">
      {CATS.map((c) => {
        const list = all.filter((x) => x.category === c);
        return (
          <div key={c}>
            <h4 className={cn('cl-h4', compact && 'text-[15px]')}>
              {t(`categories.${c}`)} <span className="font-normal text-[#67596b]">({fmtNum(data.locale, list.length)})</span>
            </h4>
            <ShowAll
              as="ul"
              className={cn('mt-2 grid gap-3', !compact && 'md:grid-cols-2')}
              items={list}
              initial={compact ? 99 : 6}
              getKey={(x) => x.id}
              buttonClassName={more}
              render={(x) => (
                <div className={cn('cl-card h-full', compact && 'p-3')}>
                  <p className="font-semibold leading-snug" dir="auto">
                    {x.url ? (
                      <a href={x.url} target="_blank" rel="noreferrer" className="cl-link">
                        {x.title}
                      </a>
                    ) : (
                      x.title
                    )}
                    {x.metric && (
                      <bdi dir="ltr" className="ml-2 text-[13px] text-[#b4453a] rtl:ml-0 rtl:mr-2">
                        {x.metric}
                      </bdi>
                    )}
                  </p>
                  <p className="mt-1 text-[13.5px] leading-relaxed text-[#4c3f50]" dir="auto">
                    {x.description}
                  </p>
                  {x.tags.length > 0 && (
                    <p className="mt-1.5 text-[12px] text-[#67596b]" dir="ltr">
                      {x.tags.join(' · ')}
                    </p>
                  )}
                </div>
              )}
            />
          </div>
        );
      })}
    </div>
  );
}

export function Publications({ data, compact }: P) {
  const t = useTranslations();
  return (
    <ol className={cn('space-y-4 leading-relaxed', compact ? 'text-[14px]' : 'text-[15px]')}>
      {data.publications.map((pub) => (
        <li key={pub.id}>
          <b className="block leading-snug">
            <bdi lang="en">{pub.title}</bdi>
          </b>
          <span className="block text-[13.5px] text-[#4c3f50]">
            <Authors ownerName={data.person.fullName} p={pub} meClassName="font-bold" etAl={t('common.withCoAuthors')} />
          </span>
          <span className="block text-[13px] text-[#67596b]">
            {pub.venue && (
              <bdi lang="en">
                <i>{pub.venue}</i>
                {pub.publisher ? `, ${pub.publisher}` : ''}
                {' · '}
              </bdi>
            )}
            {pub.year ? `${fmtYear(data.locale, pub.year)} · ` : ''}
            {publicationLabel(t, 'pubType', pub.type)} · {publicationLabel(t, 'pubStatus', pub.status)}
          </span>
          <span className="mt-1 flex flex-wrap gap-3 text-[13px]">
            {pub.url && (
              <a href={pub.url} target="_blank" rel="noreferrer" dir="ltr" className="cl-link">
                {pub.doi ? `doi:${pub.doi}` : t('common.visit')}
              </a>
            )}
            {pub.bibtex && (
              <CopyButton value={pub.bibtex} className="cl-link inline-flex items-center gap-1">
                <Copy className="size-3.5" aria-hidden /> {t('common.copyBibtex')}
              </CopyButton>
            )}
          </span>
        </li>
      ))}
    </ol>
  );
}

export function Courses({ data, compact }: P) {
  const t = useTranslations();
  const loc = data.locale;
  return (
    <ShowAll
      as="ol"
      className={cn('divide-y divide-[#f0d9c6]', compact ? 'text-[13.5px]' : 'text-[14.5px]')}
      items={data.certifications}
      initial={compact ? 99 : 12}
      getKey={(c) => c.name + c.issuer}
      buttonClassName={more}
      render={(c) => (
        <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-0.5 py-1.5">
          <span>
            <bdi lang="en" className="font-medium">
              {c.name}
            </bdi>
            <span className="text-[#67596b]"> — {c.issuer}</span>
          </span>
          <span className="flex items-baseline gap-3 text-[12.5px] text-[#67596b]">
            {c.year ? fmtYear(loc, c.year) : '—'}
            <span>{c.hours ? t('common.hours', { count: fmtNum(loc, c.hours) }) : c.weeks ? t('common.weeks', { count: fmtNum(loc, c.weeks) }) : '—'}</span>
            {c.url && (
              <a href={c.url} target="_blank" rel="noreferrer" className="cl-link inline-flex items-center gap-0.5" aria-label={`${t('common.certificate')}: ${c.name}`}>
                {t('common.certificate')}
                <ArrowUpRight className="flip-rtl size-3" aria-hidden />
              </a>
            )}
          </span>
        </div>
      )}
    />
  );
}

export function Skills({ data, compact }: P) {
  return (
    <div className={cn(compact ? 'space-y-3 text-[13.5px]' : 'columns-1 gap-8 text-[14.5px] md:columns-2')}>
      {data.skills.map((c) => (
        <div key={c.id} className={cn(!compact && 'mb-5 break-inside-avoid')}>
          <h4 className={cn('cl-h4', compact && 'text-[15px]')}>{c.label}</h4>
          {c.groups.map((g) => (
            <p key={g.id} className="mt-1 leading-relaxed">
              {c.groups.length > 1 && <span className="text-[#67596b]">{g.label}: </span>}
              {g.items.map((it, i) => (
                <span key={it.key}>
                  {i > 0 && ', '}
                  <bdi title={it.long !== it.name ? it.long : undefined}>{it.name}</bdi>
                </span>
              ))}
            </p>
          ))}
        </div>
      ))}
    </div>
  );
}

export function Languages({ data }: P) {
  const t = useTranslations();
  const loc = data.locale;
  return (
    <ul className="space-y-2 text-[14.5px]">
      {data.languages.map((l) => (
        <li key={l.id}>
          <b>{l.name}</b> — {l.level}
          {l.cert && (
            <span className="block text-[13px] text-[#67596b]">
              {l.cert.test} {fmtNum(loc, l.cert.overall, { minimumFractionDigits: 1 })} ({(['listening', 'reading', 'writing', 'speaking'] as const).map((k) => `${t(`ielts.${k}`)} ${fmtNum(loc, l.cert!.bands[k], { minimumFractionDigits: 1 })}`).join(', ')})
            </span>
          )}
        </li>
      ))}
    </ul>
  );
}

export function Contact({ data }: P) {
  const t = useTranslations();
  return (
    <div className="space-y-4 text-[15px] leading-relaxed">
      <p>
        {data.person.availability} {t('sections.contact.subtitle')}
      </p>
      <a href={data.links.email} dir="ltr" className="cl-btn cl-btn-solid inline-flex items-center gap-2 break-all">
        <Mail className="size-4 shrink-0" aria-hidden /> {data.person.email}
      </a>
      <div className="flex flex-wrap gap-2">
        {(['github', 'linkedin', 'orcid', 'scholar'] as const).map((k) =>
          data.links[k] ? (
            <a key={k} href={data.links[k]!} target="_blank" rel="noreferrer" aria-label={k} className="cl-icon">
              <BrandIcon name={k} className="size-4" />
            </a>
          ) : null,
        )}
      </div>
    </div>
  );
}
