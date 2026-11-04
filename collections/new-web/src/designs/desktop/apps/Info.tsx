'use client';

import { useMemo, type CSSProperties } from 'react';
import { useTranslations } from 'next-intl';
import { ArrowUpRight, BadgeCheck, Copy, Globe, Mail as MailIcon, Send } from 'lucide-react';
import { createMap } from 'svg-dotted-map';
import { BrandIcon } from '@/components/shared/BrandIcon';
import { CopyButton } from '@/components/shared/CopyButton';
import { r2 } from '@/lib/derive';
import { fmtNum } from '@/lib/format';
import type { SiteData } from '@/lib/types';
import { Badge, sepOf } from './ui';

const BANDS = ['listening', 'reading', 'writing', 'speaking'] as const;

/** Languages app: level, CEFR and IELTS bands drawn on the real 0–9 scale. */
export function LanguagesApp({ data }: { data: SiteData }) {
  const t = useTranslations();
  const loc = data.locale;
  const sep = sepOf(loc);
  const one = (n: number) => fmtNum(loc, n, { minimumFractionDigits: 1, maximumFractionDigits: 1 });
  return (
    <div className="dt-app">
      <ul className="space-y-3">
        {data.languages.map((l) => (
          <li key={l.id} className="dt-card">
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <h3 className="dt-h3">{l.name}</h3>
              <p className="flex flex-wrap gap-1.5">
                {l.native && <Badge tone="accent">{t('desktop.languages.native')}</Badge>}
                {l.cefr && (
                  <Badge>
                    <span dir="ltr">CEFR {l.cefr}</span>
                  </Badge>
                )}
              </p>
            </div>
            <p className="dt-muted text-[13.5px]">{l.level}</p>
            {l.cert && (
              <div className="mt-3">
                <p className="text-[13px]">
                  <span dir="ltr">{l.cert.test}</span>
                  {sep}
                  {t('ielts.overall')} <b className="text-[15px]">{one(l.cert.overall)}</b>
                  <span className="dt-muted"> / {fmtNum(loc, l.cert.max)}</span>
                </p>
                <ul className="dt-bands mt-2" aria-label={t('desktop.languages.scale', { max: l.cert.max })}>
                  {[['overall', l.cert.overall] as const, ...BANDS.map((k) => [k, l.cert!.bands[k]] as const)].map(([k, v]) => (
                    <li key={k}>
                      <span className="dt-band-label">{t(`ielts.${k}`)}</span>
                      <span className="dt-band-track" aria-hidden>
                        <span className="dt-band-fill" style={{ '--v': `${(v / l.cert!.max) * 100}%` } as CSSProperties} />
                      </span>
                      <b className="dt-band-val">{one(v)}</b>
                    </li>
                  ))}
                </ul>
                {l.cert.url && (
                  <a href={l.cert.url} target="_blank" rel="noreferrer" className="dt-link mt-2 inline-flex items-center gap-1 text-[13px]">
                    <BadgeCheck className="size-4" aria-hidden />
                    {t('common.certificateLink')}
                  </a>
                )}
              </div>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}

/** Maps app: the journey on a dotted world map (svg-dotted-map), pins and a numbered legend. */
export function Maps({ data }: { data: SiteData }) {
  const t = useTranslations();
  const loc = data.locale;
  const sep = sepOf(loc);
  const map = useMemo(() => {
    const { points, addMarkers } = createMap({ width: 600, height: 300, mapSamples: 50000 });
    const pins = addMarkers(data.journey.map((j) => ({ lat: j.lat, lng: j.lng })));
    const xs = pins.map((p) => p.x);
    const ys = pins.map((p) => p.y);
    const box = { x0: Math.min(...xs) - 46, x1: Math.max(...xs) + 46, y0: Math.min(...ys) - 26, y1: Math.max(...ys) + 26 };
    const r = 0.55;
    // one path for all land dots (a circle per dot would be thousands of nodes)
    const d = points
      .filter((p) => p.x > box.x0 && p.x < box.x1 && p.y > box.y0 && p.y < box.y1)
      .map((p) => `M${r2(p.x - r)} ${r2(p.y)}a${r} ${r} 0 1 0 ${r * 2} 0a${r} ${r} 0 1 0 ${-r * 2} 0`)
      .join('');
    // number labels: above the pin, or moved aside when an earlier pin sits close by
    const spots: Array<[number, number]> = [
      [0, -4.2],
      [0, 6.6],
      [4.6, 1.4],
      [-4.6, 1.4],
    ];
    const labels = pins.map((p, i) => {
      const near = pins.slice(0, i).filter((q) => Math.hypot(q.x - p.x, q.y - p.y) < 9).length;
      const [dx, dy] = spots[Math.min(near, spots.length - 1)];
      return [r2(p.x + dx), r2(p.y + dy)] as const;
    });
    return { d, pins: pins.map((p) => [r2(p.x), r2(p.y)] as const), labels, box };
  }, [data.journey]);
  const { box } = map;
  return (
    <div className="dt-app">
      <figure className="dt-mapfig">
        <svg viewBox={`${r2(box.x0)} ${r2(box.y0)} ${r2(box.x1 - box.x0)} ${r2(box.y1 - box.y0)}`} className="block h-auto w-full" role="img" aria-label={t('desktop.maps.alt')} direction="ltr">
          <path d={map.d} className="dt-land" />
          <polyline points={map.pins.map((p) => p.join(',')).join(' ')} fill="none" className="dt-route" />
          {map.pins.map(([x, y], i) => (
            <g key={i}>
              <circle cx={x} cy={y} r={i === map.pins.length - 1 ? 2.6 : 2} className={i === map.pins.length - 1 ? 'dt-pin-now' : 'dt-pin'} />
              <text x={map.labels[i][0]} y={map.labels[i][1]} textAnchor="middle" dominantBaseline="middle" className="dt-pin-n">
                {fmtNum(loc, i + 1)}
              </text>
            </g>
          ))}
        </svg>
        <figcaption className="dt-muted mt-2 text-[12px]">{t('desktop.maps.caption')}</figcaption>
      </figure>
      <ol className="mt-4 space-y-2">
        {data.journey.map((j, i) => (
          <li key={j.id} className="dt-card flex items-start gap-3">
            <span className="dt-pinbadge" aria-hidden>
              {fmtNum(loc, i + 1)}
            </span>
            <div className="min-w-0">
              <h3 className="dt-h4">
                {j.city}
                <span className="dt-muted font-normal">{sep + (j.country === 'IR' ? t('desktop.maps.iran') : t('desktop.maps.germany'))}</span>
              </h3>
              <p className="dt-mono dt-muted text-[12.5px]">{j.period}</p>
              <p className="text-[13.5px]">{j.note}</p>
            </div>
          </li>
        ))}
      </ol>
    </div>
  );
}

/** Mail app: write an email (mailto), copy the address, other places to find Ramin. No phone number. */
export function MailApp({ data }: { data: SiteData }) {
  const t = useTranslations();
  const p = data.person;
  const links = (['github', 'linkedin', 'orcid', 'scholar'] as const).filter((k) => data.links[k]);
  return (
    <div className="dt-app">
      <div className="dt-compose">
        <p className="dt-compose-row">
          <span className="dt-muted w-16 shrink-0">{t('desktop.mail.to')}</span>
          <span dir="ltr" className="min-w-0 break-all font-medium">
            {p.email}
          </span>
        </p>
        <p className="dt-compose-row">
          <span className="dt-muted w-16 shrink-0">{t('desktop.mail.subject')}</span>
          <span className="dt-muted italic">{t('desktop.mail.subjectHint')}</span>
        </p>
        <p className="px-3 py-4 text-[14px]">{p.availability}</p>
        <div className="flex flex-wrap gap-2 border-t border-[var(--dt-line)] p-3">
          <a href={data.links.email} className="dt-btn dt-btn-accent">
            <Send className="flip-rtl size-4" aria-hidden />
            {t('desktop.mail.write')}
          </a>
          <CopyButton value={p.email} className="dt-btn">
            <Copy className="size-4" aria-hidden /> {t('common.copyEmail')}
          </CopyButton>
        </div>
      </div>
      <h3 className="dt-h3 mt-6">{t('desktop.mail.elsewhere')}</h3>
      <ul className="dt-rows mt-2">
        <li className="dt-rowitem dt-rowlink">
          <MailIcon className="size-4 shrink-0" aria-hidden />
          <a href={data.links.email} className="dt-link min-w-0 break-all" dir="ltr">
            {p.email}
          </a>
        </li>
        {links.map((k) => (
          <li key={k} className="dt-rowitem dt-rowlink">
            <BrandIcon name={k} className="size-4 shrink-0" />
            <a href={data.links[k]!} target="_blank" rel="noreferrer" className="dt-link min-w-0 break-all" dir="ltr">
              {data.links[k]!.replace(/^https?:\/\/(www\.)?/, '').replace(/\/$/, '')}
            </a>
            <ArrowUpRight className="ms-auto size-4 shrink-0 opacity-60" aria-hidden />
          </li>
        ))}
        {data.links.website && (
          <li className="dt-rowitem dt-rowlink">
            <Globe className="size-4 shrink-0" aria-hidden />
            <a href={data.links.website} target="_blank" rel="noreferrer" className="dt-link min-w-0 break-all" dir="ltr">
              {data.links.website.replace(/^https?:\/\//, '')}
            </a>
            <ArrowUpRight className="ms-auto size-4 shrink-0 opacity-60" aria-hidden />
          </li>
        )}
      </ul>
    </div>
  );
}
