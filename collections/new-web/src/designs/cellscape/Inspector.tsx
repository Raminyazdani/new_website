'use client';

import { ArrowUpRight, Crosshair, MoveUpRight } from 'lucide-react';
import { useTranslations } from 'next-intl';
import type { ReactNode } from 'react';
import { Authors } from '@/components/kit/Authors';
import { CopyButton } from '@/components/shared/CopyButton';
import { fmtNum, fmtYear, publicationLabel } from '@/lib/format';
import type { SiteData } from '@/lib/types';
import { kindColor, type RecordItem } from './model';
import type { CellStrings } from './strings';

const labels = { github: 'GitHub', linkedin: 'LinkedIn', orcid: 'ORCID', scholar: 'Google Scholar' };

function Out({ url, label }: { url: string | null | undefined; label: string }) {
  if (!url) return null;
  return <a className="csc-out" href={url} target={url.startsWith('mailto:') ? undefined : '_blank'} rel={url.startsWith('mailto:') ? undefined : 'noreferrer'}>{label}<ArrowUpRight size={14} aria-hidden /></a>;
}

function Body({ item, data, s }: { item: RecordItem; data: SiteData; s: CellStrings }) {
  const t = useTranslations();
  const num = (n: number) => fmtNum(data.locale, n);
  const field = (label: string, value: ReactNode) => value !== null && value !== undefined && value !== '' ? <div key={label}><dt>{label}</dt><dd>{value}</dd></div> : null;
  switch (item.kind) {
    case 'project': {
      const p = item.source;
      const repo = p.repo ? `https://github.com/${p.repo}` : null;
      return <><p>{p.description}</p>{p.metric && <p className="csc-source-note">{p.metric}</p>}{p.tags.length > 0 && <ul className="csc-tags">{p.tags.map((x, i) => <li key={`${x}:${i}`}>{x}</li>)}</ul>}
        <dl>{field(s.map, t(`categories.${p.category}`))}</dl><div className="csc-outs"><Out url={repo} label={t('common.code')} />{p.url?.replace(/\/$/, '') !== repo && <Out url={p.url} label={t('common.visit')} />}</div></>;
    }
    case 'position': {
      const p = item.source;
      return <><p>{p.description}</p><dl>{field(s.date, p.period)}{field(t('common.location'), p.location)}{field(s.status, p.current ? t('common.current') : null)}</dl></>;
    }
    case 'education': {
      const p = item.source;
      return <dl>{field(s.date, p.period)}{field(t('common.location'), p.location)}{field(t('common.gpa'), p.gpa)}{field(s.status, p.current ? t('common.current') : null)}</dl>;
    }
    case 'publication': {
      const p = item.source;
      return <>
        {p.authors.length > 0 && <p><Authors p={p} ownerName={data.person.fullName} etAl="et al." /></p>}
        <dl>{field(s.role, publicationLabel(t, 'pubType', p.type))}{field(s.status, publicationLabel(t, 'pubStatus', p.status))}{field(s.year, p.year != null ? fmtYear(data.locale, p.year) : null)}
          {p.venue && p.publisher && p.publisher !== p.venue && field(s.publisher, p.publisher)}
          {field(t('common.doi'), p.doi)}{field(t('common.isbn'), p.isbn)}{field(t('common.supervisors'), p.supervisors?.join(' · '))}</dl>
        <div className="csc-outs"><Out url={p.url} label={t('common.visit')} />{p.bibtex && <CopyButton className="csc-out" value={p.bibtex}>{t('common.copyBibtex')}</CopyButton>}</div>
      </>;
    }
    case 'skill': return item.source.long && item.source.long !== item.title ? <p>{item.source.long}</p> : null;
    case 'course': {
      const p = item.source;
      return <><dl>{field(s.date, p.date)}{field(s.hours, p.hours != null ? num(p.hours) : null)}{field(s.weeks, p.weeks != null ? num(p.weeks) : null)}{field(s.status, p.certificate ? t('common.certificate') : null)}</dl><Out url={p.url} label={t('common.certificateLink')} /></>;
    }
    case 'language': {
      const p = item.source;
      return <><dl>{field('CEFR', p.cefr)}{p.cert && field(p.cert.test, `${num(p.cert.overall)} / ${num(p.cert.max)}`)}{field(s.date, p.cert?.date)}
        {p.cert && Object.entries(p.cert.bands).map(([k, v]) => field(s[k as keyof typeof p.cert.bands], num(v)))}</dl><Out url={p.cert?.url} label={t('common.certificateLink')} /></>;
    }
    case 'profile': {
      const p = item.source;
      const labelsUnique = [...new Set(p.labels)].filter((x) => x !== p.headline);
      return <><p className="csc-source-note">{p.headline}</p>{p.tagline && p.tagline !== p.headline && <p>{p.tagline}</p>}{p.intro && <p>{p.intro}</p>}{p.statement && p.statement !== p.intro && <p>{p.statement}</p>}
        {p.about.filter((x) => x !== p.intro && x !== p.statement).map((x, i) => <p key={i}>{x}</p>)}
        {labelsUnique.length > 0 && <ul className="csc-tags">{labelsUnique.map((x) => <li key={x}>{x}</li>)}</ul>}
        <dl>{field(t('common.location'), p.location)}{field(s.status, p.status)}{field(t('common.email'), p.email)}</dl>
        {p.availability && p.availability !== p.status && <p>{p.availability}</p>}
        {data.journey.length > 0 && <div className="csc-journey"><h4>{t('sections.journey.title')}</h4><dl>{data.journey.map((stop) => field(stop.city, stop.period))}</dl></div>}
        <div className="csc-outs"><Out url={data.links.email} label={t('common.email')} />{p.email && <CopyButton className="csc-out" value={p.email} />}
          {(Object.keys(labels) as (keyof typeof labels)[]).map((k) => <Out key={k} url={data.links[k]} label={labels[k]} />)}<Out url={data.links.website} label={t('common.visit')} /></div>
      </>;
    }
  }
}

export function Inspector({ data, item, related, onSelect, s }: { data: SiteData; item?: RecordItem; related: RecordItem[]; onSelect: (item: RecordItem) => void; s: CellStrings }) {
  return <aside className="csc-inspector" aria-label={s.inspect}>
    <div className="csc-panel-heading"><Crosshair size={17} aria-hidden /><h2>{s.inspect}</h2><span>03</span></div>
    <div className="csc-inspector-scroll" key={item?.id}>
      {!item ? <p className="csc-placeholder">{s.select}</p> : <>
        <div className="csc-inspect-body">
          <div className="csc-inspect-meta"><span className="csc-mark" style={{ background: kindColor[item.kind] }} />{s[item.kind]}<span aria-hidden>/</span>{item.year != null ? fmtYear(data.locale, item.year) : s.noYear}</div>
          <h3 id="csc-selected-record-title" tabIndex={-1} aria-live="polite" dir="auto">{item.title}</h3>
          {item.sub && <div className="csc-inspect-sub" dir="auto">{item.sub}</div>}
          <Body item={item} data={data} s={s} />
        </div>
        {related.length > 0 && <div className="csc-related"><h4>{s.related}</h4><ul>{related.map((r) => <li key={r.id}>
          <button type="button" onClick={() => onSelect(r)}><span className="csc-mark" style={{ background: kindColor[r.kind] }} /><span dir="auto">{r.title}</span><MoveUpRight size={13} aria-hidden /></button>
        </li>)}</ul></div>}
      </>}
    </div>
  </aside>;
}
