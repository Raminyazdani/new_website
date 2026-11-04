'use client';

import { useTranslations } from 'next-intl';
import { dot, fmtNum, fmtYear, publicationLabel } from '@/lib/format';
import type { SiteData } from '@/lib/types';
import type { Ranked } from './roleViews';

/** A plain, complete CV page in the order of the chosen view — what "Print / save as PDF" prints. */
export function PrintSheet({ data, ranked, emphasis }: { data: SiteData; ranked: Ranked; emphasis: string }) {
  const t = useTranslations();
  const loc = data.locale;
  const p = data.person;
  const H = ({ children }: { children: React.ReactNode }) => (
    <h2 className="mb-2 mt-7 border-b border-[#1d1d1f] pb-1 text-[13px] font-bold uppercase tracking-[0.12em] rtl:normal-case rtl:tracking-normal">{children}</h2>
  );
  const links = (['github', 'linkedin', 'orcid', 'scholar', 'website'] as const).map((k) => data.links[k]).filter(Boolean) as string[];
  return (
    <article className="cfg-print mx-auto max-w-[860px] rounded-[18px] bg-white px-8 py-10 text-[13px] leading-[1.55] text-[#1d1d1f] shadow-[0_20px_60px_-30px_rgb(0_0_0/0.35)] sm:px-12">
      <header>
        <h1 className="text-[30px] font-semibold leading-tight tracking-[-0.02em] rtl:tracking-normal">{p.displayName}</h1>
        <p className="mt-1 text-[15px] font-medium">{emphasis}</p>
        <p className="mt-1 text-[#424245]">
          {p.status} · {p.location}
        </p>
        <p className="mt-1 break-all text-[#424245]" dir="ltr">
          {[p.email, ...links.map((l) => l.replace(/^https?:\/\//, ''))].join(' · ')}
        </p>
      </header>

      <H>{t('sections.experience.title')}</H>
      {ranked.roles.map(({ item: e }) => (
        <div key={e.id} className="cfg-avoid mb-3">
          <p className="flex flex-wrap justify-between gap-x-4">
            <b>{e.role}</b>
            <span className="text-[#424245]">{e.period || t('common.undated')}</span>
          </p>
          <p className="text-[#424245]">
            {e.org}
            {e.location ? ` · ${e.location}` : ''}
          </p>
          <p>{e.description}</p>
        </div>
      ))}

      <H>{t('sections.projects.title')}</H>
      {ranked.projects.map(({ item: pr }) => (
        <div key={pr.id} className="cfg-avoid mb-2.5">
          <p>
            <b dir="auto">{pr.title}</b>
            {pr.metric ? <bdi dir="ltr"> · {pr.metric}</bdi> : null}
            <span className="text-[#424245]"> · {t(`categories.${pr.category}`)}</span>
          </p>
          <p dir="auto">{pr.description}</p>
          {(pr.tags.length > 0 || pr.url || pr.repo) && (
            <p className="break-all text-[11.5px] text-[#424245]" dir="ltr">
              {[pr.tags.join(', '), pr.url, pr.repo && pr.repo !== pr.url ? pr.repo : null].filter(Boolean).join(' · ')}
            </p>
          )}
        </div>
      ))}

      <H>{t('sections.publications.title')}</H>
      {data.publications.map((pub) => (
        <p key={pub.id} className="cfg-avoid mb-2">
          <b lang="en">{pub.title}</b> — {pub.authors.join(', ')}
          {pub.hasMoreAuthors ? ` ${t('common.withCoAuthors')}` : ''}. {publicationLabel(t, 'pubType', pub.type)} · {publicationLabel(t, 'pubStatus', pub.status)}
          {pub.year ? ` · ${fmtYear(loc, pub.year)}` : ''}
          {pub.venue ? (
            <>
              {' · '}
              <i lang="en">{pub.venue}</i>
            </>
          ) : null}
          {pub.doi ? <bdi dir="ltr"> · doi:{pub.doi}</bdi> : null}
        </p>
      ))}

      <H>{t('sections.education.title')}</H>
      {data.education.map((e) => (
        <p key={e.id} className="cfg-avoid mb-2">
          <b>{e.degree}</b> — {e.institution}, {e.location} · {e.period}
          {e.gpa ? (
            <>
              {' · '}
              {t('common.gpa')} <bdi dir="ltr">{e.gpa}</bdi>
            </>
          ) : null}
        </p>
      ))}

      <H>{t('sections.skills.title')}</H>
      {data.skills.map((c) => (
        <p key={c.id} className="cfg-avoid mb-1.5">
          <b>{c.label}:</b>{' '}
          {c.groups.map((g, i) => (
            <span key={g.id}>
              {i > 0 && ' · '}
              {c.groups.length > 1 && <span className="text-[#424245]">{g.label}: </span>}
              {g.items.map((it) => it.name).join(', ')}
            </span>
          ))}
        </p>
      ))}

      <H>{t('sections.certifications.title')}</H>
      <ul className="columns-1 gap-8 sm:columns-2">
        {ranked.courses.map(({ item: c }) => (
          <li key={c.name + c.issuer} className="cfg-avoid mb-1 break-inside-avoid">
            <span lang="en">{c.name}</span> — <bdi>{c.issuer}</bdi>
            {c.year ? `, ${fmtYear(loc, c.year)}` : ''}
            {c.hours ? dot(loc) + t('common.hours', { count: fmtNum(loc, c.hours) }) : ''}
          </li>
        ))}
      </ul>

      <H>{t('sections.languages.title')}</H>
      <p>{data.languages.map((l) => `${l.name} — ${l.level}${l.cert ? ` (${l.cert.test} ${fmtNum(loc, l.cert.overall, { minimumFractionDigits: 1 })})` : ''}`).join(' · ')}</p>
    </article>
  );
}
