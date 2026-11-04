'use client';

import { useMemo, useState } from 'react';
import { useTranslations } from 'next-intl';
import { spanOf } from '@/lib/derive';
import { fmtNum, fmtYear } from '@/lib/format';
import type { SiteData } from '@/lib/types';

const PENS = [
  { id: 'education', color: '#1c252c', dash: '' },
  { id: 'research', color: '#1f5fbf', dash: '' },
  { id: 'teaching', color: '#6b3fa0', dash: '6 4' },
  { id: 'industry', color: '#8a5a00', dash: '2 4' },
  { id: 'business', color: '#b42318', dash: '10 4 2 4' },
] as const;

/**
 * Trend display: active entries per kind per quarter (computed from the CV dates), course counts per
 * year as bars, and the three study phases as shaded bands (labelled as a metaphor). A keyboard
 * slider moves the crosshair; the readout lists the values at the cursor.
 */
export function Trends({ data }: { data: SiteData }) {
  const t = useTranslations();
  const loc = data.locale;
  const Y0 = 2015;
  const Y1 = 2026;
  const quarters = useMemo(() => {
    const out: Array<{ y: number; q: number; at: number; counts: Record<string, number> }> = [];
    const edu = data.education.map((e) => spanOf(e, data));
    const roles = data.experiences.map((e) => ({ e, s: spanOf(e, data) }));
    for (let y = Y0; y <= Y1; y++)
      for (let q = 0; q < 4; q++) {
        const at = y + q / 4 + 0.125;
        const live = (s: { start: number; end: number; open: boolean } | null) => !!s && s.start <= at && (s.open || s.end > at);
        const counts: Record<string, number> = { education: edu.filter(live).length };
        for (const k of ['research', 'teaching', 'industry', 'business']) counts[k] = roles.filter(({ e, s }) => e.kind === k && live(s)).length;
        out.push({ y, q, at, counts });
      }
    return out;
  }, [data]);
  const courses = useMemo(() => {
    const m = new Map<number, number>();
    for (const c of data.certifications) if (c.year) m.set(c.year, (m.get(c.year) ?? 0) + 1);
    return m;
  }, [data]);
  const [idx, setIdx] = useState(quarters.length - 1);

  const W = 1000;
  const H = 322;
  const L = 44;
  const R = 16;
  const T = 52;
  const B = 250;
  const maxC = Math.max(1, ...quarters.flatMap((q) => Object.values(q.counts)));
  const maxCourses = Math.max(1, ...courses.values());
  const x = (at: number) => L + ((at - Y0) / (Y1 + 1 - Y0)) * (W - L - R);
  const y = (v: number) => B - (v / maxC) * (B - T - 10);
  const phases = data.education
    .map((e) => ({ e, s: spanOf(e, data) }))
    .filter((p) => p.s)
    .sort((a, b) => a.s!.start - b.s!.start)
    .map((p, i) => ({ ...p, label: t(`reactor.phase.${['batch', 'fedbatch', 'induction'][i] ?? 'batch'}`) }));
  const cur = quarters[idx];

  return (
    <div>
      <div className="rx-panel relative overflow-x-auto rounded-[6px] p-3" tabIndex={-1}>
        <svg
          direction="ltr"
          viewBox={`0 0 ${W} ${H}`}
          className="block h-auto w-full min-w-[720px]"
          role="img"
          aria-label={t('reactor.trendLabel')}
          onPointerMove={(e) => {
            const r = (e.currentTarget as SVGSVGElement).getBoundingClientRect();
            const px = ((e.clientX - r.left) / r.width) * W;
            const at = Y0 + ((px - L) / (W - L - R)) * (Y1 + 1 - Y0);
            const i = Math.round((at - Y0 - 0.125) * 4);
            setIdx(Math.min(quarters.length - 1, Math.max(0, i)));
          }}
        >
          {/* phase bands */}
          {phases.map((p, i) => {
            const x0 = x(p.s!.start);
            const x1 = x(Math.min(p.s!.end, Y1 + 1));
            const last = i === phases.length - 1;
            return (
              <g key={p.e.id}>
                <rect x={x0} y={T} width={Math.max(2, x1 - x0)} height={B - T} fill={i % 2 ? '#dfe4e8' : '#e6eaed'} />
                <line x1={x0} x2={x0} y1={i % 2 ? 26 : 12} y2={T} stroke="#9aa3ab" strokeWidth={1} />
                <text x={last ? x1 - 4 : x0 + 5} y={i % 2 ? 34 : 20} textAnchor={last ? 'end' : 'start'} className="rx-tag-sm">
                  {p.label}
                </text>
              </g>
            );
          })}
          {/* course bars */}
          {Array.from({ length: Y1 - Y0 + 1 }, (_, i) => Y0 + i).map((yr) => {
            const n = courses.get(yr) ?? 0;
            const h = (n / maxCourses) * (B - T - 40);
            return n ? <rect key={yr} x={x(yr) + 14} y={B - h} width={x(yr + 1) - x(yr) - 28} height={h} fill="#c9d0d6" /> : null;
          })}
          {/* grid */}
          {Array.from({ length: Y1 - Y0 + 2 }, (_, i) => Y0 + i).map((yr) => (
            <g key={yr}>
              <line x1={x(yr)} x2={x(yr)} y1={T} y2={B} stroke="#c3cad0" strokeWidth={0.8} />
              {yr <= Y1 && (
                <text x={x(yr) + (x(yr + 1) - x(yr)) / 2} y={B + 18} textAnchor="middle" className="rx-tag-sm">
                  {fmtYear(loc, yr)}
                </text>
              )}
            </g>
          ))}
          {Array.from({ length: maxC + 1 }, (_, v) => (
            <g key={v}>
              <line x1={L} x2={W - R} y1={y(v)} y2={y(v)} stroke="#c3cad0" strokeWidth={v ? 0.5 : 1.2} />
              <text x={L - 8} y={y(v) + 4} textAnchor="end" className="rx-tag-sm">
                {fmtNum(loc, v)}
              </text>
            </g>
          ))}
          {/* pens: step lines */}
          {PENS.map((p) => {
            const d = quarters
              .map((q, i) => {
                const x0 = x(q.y + q.q / 4);
                const x1 = x(q.y + (q.q + 1) / 4);
                const yy = y(q.counts[p.id]);
                return `${i ? 'L' : 'M'} ${x0.toFixed(1)} ${yy.toFixed(1)} L ${x1.toFixed(1)} ${yy.toFixed(1)}`;
              })
              .join(' ');
            return <path key={p.id} d={d} fill="none" stroke={p.color} strokeWidth={2.2} strokeDasharray={p.dash} strokeLinejoin="round" />;
          })}
          {/* crosshair */}
          <line x1={x(cur.at)} x2={x(cur.at)} y1={T} y2={B} stroke="#1c252c" strokeWidth={1.5} strokeDasharray="3 3" />
          <text x={Math.min(W - R - 30, Math.max(L + 30, x(cur.at)))} y={T + 14} textAnchor="middle" className="rx-tag-sm" fontWeight={700}>
            {fmtYear(loc, cur.y)} Q{fmtNum(loc, cur.q + 1)}
          </text>
        </svg>
      </div>
      <div className="mt-4 grid gap-4 md:grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)]">
        <label className="block">
          <span className="rx-mono text-[12px] uppercase text-[#4a5560] rtl:normal-case">{t('reactor.cursor')}</span>
          <input
            type="range"
            min={0}
            max={quarters.length - 1}
            value={idx}
            onChange={(e) => setIdx(Number(e.target.value))}
            aria-valuetext={`${fmtYear(loc, cur.y)} Q${cur.q + 1}`}
            className="rx-range mt-2 block w-full"
            dir="ltr"
          />
        </label>
        <dl className="rx-panel grid grid-cols-3 gap-x-4 gap-y-1 rounded-[6px] p-3 text-[13px] sm:grid-cols-6">
          <div className="col-span-3 sm:col-span-6">
            <dt className="sr-only">{t('reactor.cursor')}</dt>
            <dd className="rx-mono font-bold">
              {fmtYear(loc, cur.y)} Q{fmtNum(loc, cur.q + 1)}
            </dd>
          </div>
          {PENS.map((p) => (
            <div key={p.id}>
              <dt className="flex items-center gap-1.5 text-[#4a5560]">
                <svg width="18" height="6" aria-hidden>
                  <line x1="0" x2="18" y1="3" y2="3" stroke={p.color} strokeWidth="2.5" strokeDasharray={p.dash} />
                </svg>
                {p.id === 'education' ? t('sections.education.title') : t(`kinds.${p.id}`)}
              </dt>
              <dd className="rx-mono text-[16px] font-bold">{fmtNum(loc, cur.counts[p.id])}</dd>
            </div>
          ))}
          <div>
            <dt className="flex items-center gap-1.5 text-[#4a5560]">
              <span className="inline-block size-3 bg-[#c9d0d6]" aria-hidden />
              {t('reactor.coursesYear')}
            </dt>
            <dd className="rx-mono text-[16px] font-bold">{fmtNum(loc, courses.get(cur.y) ?? 0)}</dd>
          </div>
        </dl>
      </div>
      <p className="mt-3 text-[12.5px] text-[#4a5560]">
        <span className="rx-mono me-2 rounded bg-[#1c252c] px-1.5 py-0.5 text-[10.5px] uppercase text-white rtl:normal-case">{t('common.metaphor')}</span>
        {t('reactor.trendNote')}
      </p>
    </div>
  );
}
