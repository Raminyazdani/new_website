'use client';

import { useTranslations } from 'next-intl';
import { FileText, MapPin } from 'lucide-react';
import { fmtNum } from '@/lib/format';
import type { SiteData } from '@/lib/types';
import { H3, scrollToId, sepOf } from './ui';

/** Notes app: the profile as three notes in one scrolling page. */
export function About({ data }: { data: SiteData }) {
  const t = useTranslations();
  const loc = data.locale;
  const p = data.person;
  const sep = sepOf(loc);
  const date = new Intl.DateTimeFormat(loc === 'fa' ? 'fa-IR' : loc === 'de' ? 'de-DE' : 'en-GB', { dateStyle: 'long', timeZone: 'UTC' }).format(new Date(data.generatedAt));
  const notes = [
    { id: 'about-me', file: 'about-me.md' },
    { id: 'about-numbers', file: 'in-numbers.md' },
    { id: 'about-now', file: 'right-now.md' },
  ];
  return (
    <div className="dt-split dt-notes">
      <nav className="dt-side" aria-label={t('desktop.about.notes')}>
        <ul>
          {notes.map((n) => (
            <li key={n.id}>
              <button type="button" className="dt-side-item" onClick={() => scrollToId(n.id)}>
                <FileText className="size-4 shrink-0 opacity-70" aria-hidden />
                <span dir="ltr">{n.file}</span>
              </button>
            </li>
          ))}
        </ul>
      </nav>
      <article className="dt-pane dt-note">
        <p id="about-me" className="dt-meta">{t('desktop.about.updated', { date })}</p>
        <p className="dt-note-name">{p.displayName}</p>
        <p className="dt-note-head">{p.headline}</p>
        <p className="dt-muted mt-1">{p.tagline}</p>
        <p className="mt-3 flex flex-wrap items-center gap-x-2 gap-y-1 text-[13.5px]">
          <span className="dt-live" aria-hidden />
          <span>{p.status}</span>
          <span className="dt-muted inline-flex items-center gap-1">
            <MapPin className="size-3.5" aria-hidden />
            {p.location}
          </span>
        </p>
        <p className="dt-callout mt-4">{p.availability}</p>
        <div className="dt-prose mt-5">
          <p className="dt-lead">{p.intro}</p>
          {p.about.map((para, i) => (
            <p key={i}>{para}</p>
          ))}
        </div>

        <H3 id="about-numbers" className="mt-8">
          {t('desktop.about.numbers')}
        </H3>
        <ul className="dt-facts">
          {data.stats.map((s) => (
            <li key={s.id}>
              <b>
                {fmtNum(loc, s.value)}
                {s.suffix}
              </b>
              <span>{s.label}</span>
            </li>
          ))}
        </ul>

        <H3 id="about-now" className="mt-8">
          {t('sections.now.title')}
        </H3>
        <ul className="mt-2 space-y-2">
          {data.current.map((e) => (
            <li key={e.id} className="dt-card">
              <b className="block">{e.role}</b>
              <span className="dt-muted text-[13px]">
                {e.org}
                {e.location ? sep + e.location : ''}
                {sep}
                {e.period}
              </span>
            </li>
          ))}
        </ul>
      </article>
    </div>
  );
}
