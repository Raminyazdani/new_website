'use client';

import { useEffect, useMemo, useState } from 'react';
import { useTranslations } from 'next-intl';
import { ArrowDown, ArrowUp, BadgeCheck, Search } from 'lucide-react';
import { fmtNum, fmtYear, numberLocale } from '@/lib/format';
import type { Certification, SiteData } from '@/lib/types';
import { cn } from '@/lib/utils';
import type { Intent } from '../apps';
import { fold } from './ui';

type Col = 'name' | 'issuer' | 'date' | 'hours';

/** Courses as a sortable table (all 40) with totals; becomes cards in narrow windows. */
export function Courses({ data, intent }: { data: SiteData; intent: Intent | null }) {
  const t = useTranslations();
  const loc = data.locale;
  const [sort, setSort] = useState<{ col: Col; dir: 1 | -1 }>({ col: 'date', dir: -1 });
  const [q, setQ] = useState('');
  const [flash, setFlash] = useState<number | null>(null);
  const rows = useMemo(() => data.certifications.map((c, i) => ({ c, i })), [data.certifications]);
  const fmtMonth = useMemo(() => new Intl.DateTimeFormat(numberLocale(loc), { year: 'numeric', month: 'short', timeZone: 'UTC' }), [loc]);
  const when = (c: Certification) => (c.year && c.month ? fmtMonth.format(Date.UTC(c.year, c.month - 1, 1)) : c.year ? fmtYear(loc, c.year) : '—');
  const coll = useMemo(() => new Intl.Collator(numberLocale(loc)), [loc]);
  const sortKey = (c: Certification): number | string => (sort.col === 'date' ? (c.year ?? 0) * 12 + (c.month ?? 0) : sort.col === 'hours' ? (c.hours ?? -1) : c[sort.col]);
  const sorted = [...rows].sort((a, b) => {
    const x = sortKey(a.c);
    const y = sortKey(b.c);
    const d = typeof x === 'number' && typeof y === 'number' ? x - y : coll.compare(String(x), String(y));
    return d * sort.dir || a.i - b.i;
  });
  const key = fold(q.trim());
  const match = (c: Certification) => !key || fold(`${c.name} ${c.issuer}`).includes(key);
  const shown = sorted.filter((r) => match(r.c));
  const hours = shown.reduce((s, r) => s + (r.c.hours ?? 0), 0);

  useEffect(() => {
    if (intent?.app !== 'courses') return;
    const i = Number(intent.id);
    if (!Number.isInteger(i)) return;
    setQ('');
    setFlash(i);
    const a = window.setTimeout(() => document.getElementById(`crs-${i}`)?.scrollIntoView({ block: 'center' }), 60);
    const b = window.setTimeout(() => setFlash(null), 1800);
    return () => {
      window.clearTimeout(a);
      window.clearTimeout(b);
    };
  }, [intent]);

  const head = (col: Col, label: string, cls?: string) => {
    const on = sort.col === col;
    return (
      <th scope="col" className={cls} aria-sort={on ? (sort.dir === 1 ? 'ascending' : 'descending') : 'none'}>
        <button type="button" className="dt-th" onClick={() => setSort(on ? { col, dir: sort.dir === 1 ? -1 : 1 } : { col, dir: col === 'date' || col === 'hours' ? -1 : 1 })}>
          {label}
          {on ? sort.dir === 1 ? <ArrowUp className="size-3.5" aria-hidden /> : <ArrowDown className="size-3.5" aria-hidden /> : <span className="size-3.5" aria-hidden />}
        </button>
      </th>
    );
  };

  return (
    <div className="dt-app">
      <div className="dt-toolbar">
        <p className="dt-muted min-w-0 flex-1 text-[13px]">
          {t('desktop.courses.summary', { count: data.certStats.count, hours: data.certStats.hours, cert: data.certStats.withCertificate, issuers: data.certStats.issuers.length })}
        </p>
        <label className="dt-search">
          <Search className="size-4 shrink-0 opacity-60" aria-hidden />
          <span className="sr-only">{t('desktop.courses.search')}</span>
          <input type="search" value={q} onChange={(e) => setQ(e.target.value)} placeholder={t('desktop.courses.search')} />
        </label>
      </div>
      <div className="dt-tablewrap">
        <table className="dt-table">
          <caption className="sr-only">{t('desktop.apps.courses')}</caption>
          <thead>
            <tr>
              {head('name', t('desktop.courses.name'))}
              {head('issuer', t('common.issuer'))}
              {head('date', t('desktop.courses.date'), 'dt-num')}
              {head('hours', t('desktop.courses.hours'), 'dt-num')}
              <th scope="col">{t('common.certificate')}</th>
            </tr>
          </thead>
          <tbody>
            {sorted.map(({ c, i }) => (
              <tr key={i} id={`crs-${i}`} className={cn(!match(c) && 'dt-filtered', flash === i && 'dt-flash')}>
                <td data-label={t('desktop.courses.name')} className="dt-td-name">
                  <bdi dir="auto">{c.name}</bdi>
                </td>
                <td data-label={t('common.issuer')}>
                  <bdi dir="auto">{c.issuer}</bdi>
                </td>
                <td data-label={t('desktop.courses.date')} className="dt-num">
                  {when(c)}
                </td>
                <td data-label={t('desktop.courses.hours')} className="dt-num">
                  {c.hours ? fmtNum(loc, c.hours) : c.weeks ? t('common.weeks', { count: fmtNum(loc, c.weeks) }) : '—'}
                </td>
                <td data-label={t('common.certificate')}>
                  {c.url ? (
                    <a href={c.url} target="_blank" rel="noreferrer" className="dt-link inline-flex items-center gap-1">
                      <BadgeCheck className="size-4" aria-hidden />
                      {t('common.certificateLink')}
                    </a>
                  ) : c.certificate ? (
                    <span className="inline-flex items-center gap-1">
                      <BadgeCheck className="size-4" aria-hidden />
                      {t('common.certificate')}
                    </span>
                  ) : (
                    <span className="dt-muted">—</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr>
              <th scope="row" colSpan={3}>
                {t('common.total')}
                {key ? ` (${fmtNum(loc, shown.length)} / ${fmtNum(loc, rows.length)})` : ` (${fmtNum(loc, rows.length)})`}
              </th>
              <td className="dt-num">{fmtNum(loc, hours)}</td>
              <td />
            </tr>
          </tfoot>
        </table>
        {!shown.length && <p className="dt-empty">{t('common.noResults')}</p>}
      </div>
    </div>
  );
}
