'use client';

import { useMemo, useState } from 'react';
import { useTranslations } from 'next-intl';
import { arc as d3arc, ribbon as d3ribbon } from 'd3';
import { sankey as d3sankey, sankeyLinkHorizontal } from 'd3-sankey';
import { activeByYear, nowFrac, r2, spanOf } from '@/lib/derive';
import { fmtNum, fmtYear } from '@/lib/format';
import type { ProjectCategory, SiteData } from '@/lib/types';
import { useMedia } from '@/lib/useMedia';
import { cn } from '@/lib/utils';
import { wrap } from '@/lib/wrap';
import { circosModel, plasmidFeatures, type Chord, type Feature } from './model';

const TAU = Math.PI * 2;
/** List separator next to numbers: in Persian a middle dot reads like the digit zero (۰). */
const dirOf = (loc: string) => (loc === 'fa' ? 'rtl' : 'ltr');
export const numSep = (loc: string) => (loc === 'fa' ? '، ' : ' · ');
export const domColor = (hue: number, l = 0.6) => `oklch(${l} 0.15 ${hue})`;
const SOFT_HUE = -1;
const colorOf = (hue: number, l = 0.6) => (hue === SOFT_HUE ? `oklch(${l} 0 0)` : domColor(hue, l));
export const KIND_COLOR: Record<string, string> = { education: '#15161b', research: '#1f5fbf', teaching: '#7a3fb0', industry: '#9a5a12', business: '#c0282d' };
const CAT_COLOR: Record<ProjectCategory, string> = { omics: '#1a8f6a', structural: '#7a3fb0', ml: '#c0282d', software: '#1f5fbf', biotech: '#9a5a12' };

type Model = ReturnType<typeof circosModel>;
const arcGen = d3arc<{ innerRadius: number; outerRadius: number; startAngle: number; endAngle: number }>();
const ribbonGen = d3ribbon() as unknown as { radius: (r: number) => (d: unknown) => string };
const ribbonAt = ribbonGen.radius(226);
/** Round every number in an SVG path: trig results differ in the last digit between Node and the browser (hydration). */
const rd = (d: string | null | undefined) => (d ?? '').replace(/-?\d+\.\d+(?:e-?\d+)?/g, (m) => String(Math.round(+m * 100) / 100));
const arcD = (a: { innerRadius: number; outerRadius: number; startAngle: number; endAngle: number }) => rd(arcGen(a));

/* ───────────────────────── Figure 1: circos of skills and projects ───────────────────────── */

/** Segment angles (arc ∝ skills, small gaps) and chord end sub-arcs (per domain, ordered by partner, ∝ weight). */
function circosGeometry(model: Model, softN: number) {
  const list = [...model.doms.map((d) => ({ id: d.id, hue: d.hue, n: d.skills.length, projects: d.projects.length })), { id: 'soft', hue: SOFT_HUE, n: softN, projects: 0 }];
  const gap = (1.6 * Math.PI) / 180;
  const total = list.reduce((n, x) => n + x.n, 0);
  const per = (TAU - gap * list.length) / total;
  let at = gap / 2;
  const segs = list.map((x) => {
    const seg = { ...x, start: at, end: at + x.n * per, per };
    at = seg.end + gap;
    return seg;
  });
  const ends = new Map<string, { a: [number, number]; b: [number, number] }>();
  const idx = new Map(segs.map((g, i) => [g.id, i]));
  for (const g of segs) {
    const mine = model.chords.filter((c) => c.a === g.id || c.b === g.id);
    const sum = mine.reduce((n, c) => n + c.projects.length, 0);
    if (!sum) continue;
    const i0 = idx.get(g.id)!;
    const rel = (c: Chord) => (idx.get(c.a === g.id ? c.b : c.a)! - i0 + segs.length) % segs.length;
    mine.sort((x, y) => rel(y) - rel(x));
    const span = (g.end - g.start) * 0.9;
    let a = g.start + (g.end - g.start) * 0.05;
    for (const c of mine) {
      const w = (c.projects.length / sum) * span;
      const k = `${c.a}|${c.b}`;
      const cur = ends.get(k) ?? { a: [0, 0], b: [0, 0] };
      if (c.a === g.id) cur.a = [a, a + w];
      else cur.b = [a, a + w];
      ends.set(k, cur);
      a += w;
    }
  }
  return { segs, ends };
}

/** Decorative miniature of figure 1 for the page header ("graphical abstract"). */
export function GraphicalAbstract({ data, model }: { data: SiteData; model: Model }) {
  const { segs, ends } = useMemo(() => circosGeometry(model, data.softSkills.length), [model, data.softSkills.length]);
  return (
    <svg viewBox="-312 -312 624 624" className="block h-auto w-full" aria-hidden focusable="false">
      {model.chords.map((c) => {
        const e = ends.get(`${c.a}|${c.b}`);
        if (!e) return null;
        const hue = model.doms.find((x) => x.id === c.a)!.hue;
        return <path key={`${c.a}|${c.b}`} d={rd(ribbonAt({ source: { startAngle: e.a[0], endAngle: e.a[1] }, target: { startAngle: e.b[0], endAngle: e.b[1] } }))} fill={domColor(hue)} fillOpacity={0.42} style={{ mixBlendMode: 'multiply' }} />;
      })}
      {segs.map((g) => (
        <g key={g.id}>
          <path d={arcD({ innerRadius: 268, outerRadius: 296, startAngle: g.start, endAngle: g.end })} fill={colorOf(g.hue)} />
          {Array.from({ length: g.n }, (_, k) => {
            const a = g.start + (k + 0.5) * g.per;
            return <line key={k} x1={r2(Math.sin(a) * 299)} y1={r2(-Math.cos(a) * 299)} x2={r2(Math.sin(a) * 308)} y2={r2(-Math.cos(a) * 308)} stroke={colorOf(g.hue, 0.45)} strokeWidth={1.4} />;
          })}
        </g>
      ))}
    </svg>
  );
}


export function CircosFigure({ data, model, labels, onChord }: { data: SiteData; model: Model; labels: Record<string, string>; onChord: (c: Chord) => void }) {
  const t = useTranslations();
  const loc = data.locale;
  const [focus, setFocus] = useState<string | null>(null);
  // phones: the outer labels would render at ~6 px — number the segments and number the legend instead
  const compact = useMedia('(max-width: 639px)');
  const { segs, ends } = useMemo(() => circosGeometry(model, data.softSkills.length), [model, data.softSkills.length]);
  const maxP = Math.max(...segs.map((s) => s.projects), 1);

  return (
    <div>
      <svg direction="ltr" viewBox={compact ? '-348 -348 696 696' : '-450 -392 900 784'} className="cx-fig1 mx-auto block h-auto w-full max-w-[820px]" role="img" aria-labelledby="fig1-cap">
        <g>
          {/* chords */}
          <g className="cx-chords">
            {model.chords.map((c) => {
              const e = ends.get(`${c.a}|${c.b}`);
              if (!e) return null;
              const on = focus === null || focus === c.a || focus === c.b;
              const d = rd(ribbonAt({ source: { startAngle: e.a[0], endAngle: e.a[1] }, target: { startAngle: e.b[0], endAngle: e.b[1] } }));
              const hue = model.doms.find((x) => x.id === c.a)!.hue;
              return (
                <path
                  key={`${c.a}|${c.b}`}
                  d={d}
                  fill={domColor(hue)}
                  className={cn('cx-chord', !on && 'cx-chord-dim', focus && on && 'cx-chord-on')}
                  onClick={() => onChord(c)}
                >
                  <title>{`${labels[c.a]} — ${labels[c.b]}: ${t('common.count.projects', { count: c.projects.length })}`}</title>
                </path>
              );
            })}
          </g>
          {/* project track */}
          {segs.map((s) =>
            s.projects ? (
              <path key={`tr-${s.id}`} d={arcD({ innerRadius: 236, outerRadius: 236 + Math.max(3, (s.projects / maxP) * 40), startAngle: s.start, endAngle: s.end })} fill={colorOf(s.hue, 0.82)} opacity={focus && focus !== s.id ? 0.35 : 1} />
            ) : null,
          )}
          {/* ideogram */}
          {segs.map((s) => (
            <g key={s.id} opacity={focus && focus !== s.id ? 0.4 : 1}>
              <path d={arcD({ innerRadius: 284, outerRadius: 300, startAngle: s.start, endAngle: s.end })} fill={colorOf(s.hue)} />
              {Array.from({ length: s.n }, (_, k) => {
                const a = s.start + (k + 0.5) * s.per;
                return <line key={k} x1={r2(Math.sin(a) * 302)} y1={r2(-Math.cos(a) * 302)} x2={r2(Math.sin(a) * 310)} y2={r2(-Math.cos(a) * 310)} stroke={colorOf(s.hue, 0.45)} strokeWidth={1} />;
              })}
            </g>
          ))}
          {/* labels: each block sits outside the ring, pushed out by its own height at top and bottom */}
          {compact &&
            segs.map((s, i) => {
              const a = (s.start + s.end) / 2;
              return (
                <text key={`n-${s.id}`} x={r2(Math.sin(a) * 328)} y={r2(-Math.cos(a) * 328 + 7)} textAnchor="middle" className="cx-segnum">
                  {fmtNum(loc, i + 1)}
                </text>
              );
            })}
          {!compact && segs.map((s) => {
            const a = (s.start + s.end) / 2;
            const sin = Math.sin(a);
            const cos = Math.cos(a);
            const lines = wrap(s.id === 'soft' ? t('common.softSkills') : labels[s.id], 15);
            const LH = 16;
            const hgt = (lines.length + 1) * LH;
            const x = r2(sin * 322);
            const top = -cos * 322 - hgt / 2 - (cos * hgt) / 2;
            return (
              <text key={`l-${s.id}`} x={x} y={r2(top + 13)} textAnchor={Math.abs(sin) < 0.25 ? 'middle' : sin > 0 ? 'start' : 'end'} className="cx-label">
                {lines.map((l, k) => (
                  <tspan key={k} x={x} dy={k ? LH : 0}>
                    {l}
                  </tspan>
                ))}
                <tspan x={x} dy={LH} className="cx-label-sub">
                  {fmtNum(loc, s.n)}
                  {numSep(loc)}
                  {fmtNum(loc, s.projects)}
                </tspan>
              </text>
            );
          })}
        </g>
      </svg>
      <div role="group" aria-label={t('circos.legendDomains')} className="mt-4 flex flex-wrap justify-center gap-1.5">
        {segs.map((s) => (
          <button
            key={s.id}
            type="button"
            aria-pressed={focus === s.id}
            disabled={s.id === 'soft'}
            onClick={() => setFocus((f) => (f === s.id ? null : s.id))}
            className={cn('cx-chip', focus === s.id && 'cx-chip-on')}
          >
            {compact ? (
              <span className="grid size-[18px] place-items-center rounded-full text-[10.5px] font-bold text-white" style={{ background: colorOf(s.hue, 0.5) }} aria-hidden>
                {fmtNum(loc, segs.indexOf(s) + 1)}
              </span>
            ) : (
              <span className="size-2.5 rounded-full" style={{ background: colorOf(s.hue) }} aria-hidden />
            )}
            {s.id === 'soft' ? t('common.softSkills') : labels[s.id]}
            {compact && (
              <span className="text-[11px] font-medium opacity-70">
                {fmtNum(loc, s.n)}
                {numSep(loc)}
                {fmtNum(loc, s.projects)}
              </span>
            )}
          </button>
        ))}
      </div>
    </div>
  );
}

/* ───────────────────────── Figure 2: plasmid map pRY2026 ───────────────────────── */

export function PlasmidFigure({ data, onFeature, selected }: { data: SiteData; onFeature: (f: Feature) => void; selected: string | null }) {
  const t = useTranslations();
  const loc = data.locale;
  const { features, lo, hi } = useMemo(() => plasmidFeatures(data), [data]);
  const now = nowFrac(data);
  const R = 176;
  const ang = (v: number) => ((v - lo) / (hi - lo)) * TAU;
  const laneR = (l: number) => R + 26 + l * 19;
  const saar = data.journey.find((j) => j.id === 'saarbruecken');
  const saarEdu = saar ? data.education.find((e) => e.location.includes(saar.city)) : undefined;
  const mcs0 = (saarEdu && spanOf(saarEdu, data)?.start) || (saar ? saar.from : hi);
  const sel = features.find((f) => f.id === selected);
  const selN = sel ? features.indexOf(sel) + 1 : 0;
  const polar = (a: number, r: number) => [r2(Math.sin(a) * r), r2(-Math.cos(a) * r)] as const;
  const compact = useMedia('(max-width: 639px)');
  const BR = compact ? 11 : 8.5;

  return (
    <svg direction="ltr" viewBox="-320 -320 640 640" className="cx-fig2 mx-auto block h-auto w-full max-w-[640px]" role="img" aria-labelledby="fig2-cap">
      <circle r={R} fill="none" stroke="#15161b" strokeWidth={3} />
      <circle r={R - 6} fill="none" stroke="#15161b" strokeWidth={1} />
      {/* MCS = Saarbrücken period */}
      {saar && <path d={arcD({ innerRadius: R - 8, outerRadius: R + 3, startAngle: ang(mcs0), endAngle: ang(Math.min(now, hi)) })} fill="#e8b93a" />}
      {/* year ticks */}
      {Array.from({ length: hi - lo }, (_, i) => lo + i).map((y) => {
        const a = ang(y);
        const [x1, y1] = polar(a, R - 6);
        const [x2, y2] = polar(a, R - 15);
        const [tx, ty] = polar(a, R - 28);
        return (
          <g key={y}>
            <line x1={x1} y1={y1} x2={x2} y2={y2} stroke="#15161b" />
            <text x={tx} y={r2(ty + 4)} textAnchor="middle" className="cx-tick">
              {fmtYear(loc, y)}
            </text>
          </g>
        );
      })}
      {/* ori */}
      <circle cx={0} cy={-R} r={6} fill="#15161b" />
      <text x={9} y={-R + 18} className="cx-label-sub" fontWeight={700}>
        ori
      </text>
      {saar && (
        <text x={polar(ang(mcs0 + 1), R - 64)[0]} y={polar(ang(mcs0 + 1), R - 64)[1]} textAnchor="middle" className="cx-label-sub">
          <tspan fontWeight={700}>MCS</tspan>
          <tspan x={polar(ang(mcs0 + 1), R - 64)[0]} dy="1.2em">
            {saar.city}
          </tspan>
        </text>
      )}
      {/* features: arrows on lanes, a numbered badge in the middle of each */}
      {features.map((f, i) => {
        const r = laneR(f.lane);
        const a0 = ang(f.start);
        const a1 = ang(Math.min(f.end, hi));
        const head = Math.min(0.045, (a1 - a0) * 0.45);
        const on = selected === f.id;
        const [tx, ty] = polar(a1, r);
        const [b1x, b1y] = polar(a1 - head, r - 8);
        const [b2x, b2y] = polar(a1 - head, r + 8);
        const [cx, cy] = polar((a0 + a1 - head) / 2, r);
        return (
          <g key={f.id} className="cx-feature" onClick={() => onFeature(f)} opacity={selected && !on ? 0.4 : 1}>
            <title>{`${fmtNum(loc, i + 1)}. ${f.kind === 'education' ? f.item.degree : f.item.role}${loc === 'fa' ? '، ' : ' · '}${f.item.period}`}</title>
            {on && <path d={arcD({ innerRadius: r - 10, outerRadius: r + 10, startAngle: a0 - 0.01, endAngle: a1 + 0.01 })} fill="#f3d98a" />}
            <path d={arcD({ innerRadius: r - 5.5, outerRadius: r + 5.5, startAngle: a0, endAngle: Math.max(a0 + 0.004, a1 - head) })} fill={KIND_COLOR[f.kind]} />
            <path d={`M ${b1x} ${b1y} L ${tx} ${ty} L ${b2x} ${b2y} Z`} fill={KIND_COLOR[f.kind]} />
            <circle cx={cx} cy={cy} r={BR} fill="#fff" stroke={KIND_COLOR[f.kind]} strokeWidth={2} />
            <text x={cx} y={r2(cy + BR * 0.42)} textAnchor="middle" className="cx-badge">
              {fmtNum(loc, i + 1)}
            </text>
          </g>
        );
      })}
      {/* centre: name of the plasmid, or the selected feature */}
      {sel ? (
        <g>
          {(() => {
            const lines = wrap(sel.label, 20, 3);
            const y0 = -18 - (lines.length - 1) * 8;
            return (
              <>
                <text textAnchor="middle" y={y0 - 22} direction={dirOf(loc)} className="cx-label-sub">
                  {fmtNum(loc, selN)}
                  {numSep(loc)}
                  {sel.kind === 'education' ? t('sections.education.title') : t(`kinds.${sel.kind}`)}
                </text>
                <text textAnchor="middle" y={y0} direction={dirOf(loc)} className="cx-label">
                  {lines.map((l, k) => (
                    <tspan key={k} x={0} dy={k ? 16 : 0}>
                      {l}
                    </tspan>
                  ))}
                </text>
                <text textAnchor="middle" y={y0 + (lines.length - 1) * 16 + 22} direction={dirOf(loc)} className="cx-label-sub">
                  {sel.item.period}
                </text>
              </>
            );
          })()}
        </g>
      ) : (
        <g>
          <text textAnchor="middle" y={-6} className="cx-title">
            pRY2026
          </text>
          <text textAnchor="middle" y={16} direction={dirOf(loc)} className="cx-label-sub">
            {fmtYear(loc, lo)}–{fmtYear(loc, hi - 1)}
            {numSep(loc)}
            {t('circos.features', { count: features.length })}
          </text>
        </g>
      )}
    </svg>
  );
}

/* ───────────────────────── Figure 3: growth rings ───────────────────────── */

export function RingsFigure({ data, year, onYear }: { data: SiteData; year: number | null; onYear: (y: number) => void }) {
  const t = useTranslations();
  const loc = data.locale;
  const { lo, hi, act } = useMemo(() => ringYears(data), [data]);
  const years = Array.from({ length: hi - lo + 1 }, (_, i) => lo + i);
  const byYear = (y: number) => data.certifications.filter((c) => c.year === y);
  const hoursOf = (y: number) => byYear(y).reduce((n, c) => n + (c.hours ?? 0), 0);
  const maxH = Math.max(1, ...years.map(hoursOf));
  const r0 = 60;
  const w = 17;
  const polar = (a: number, r: number) => [r2(Math.sin(a) * r), r2(-Math.cos(a) * r)] as const;
  return (
    <svg direction="ltr" viewBox="0 0 600 600" className="cx-fig3 mx-auto block h-auto w-full max-w-[560px]" role="img" aria-labelledby="fig3-cap">
      <g transform="translate(300 300)">
        <circle r={r0} fill="#f1ede4" />
        {years.map((y, i) => {
          const ri = r0 + i * w;
          const ro = ri + w;
          const rm = ri + w / 2;
          const h = hoursOf(y);
          const cs = byYear(y);
          const pubs = data.publications.filter((p) => p.year === y);
          const a = act.get(y);
          const dots = [...(a?.education ?? []).map(() => 'education'), ...(a?.roles ?? []).map((e) => e.kind)];
          const on = year === y;
          return (
            <g key={y} className="cx-feature" onClick={() => onYear(y)}>
              <path d={arcD({ innerRadius: ri + 1, outerRadius: ro, startAngle: 0, endAngle: TAU })} fill={h ? `oklch(${0.93 - 0.35 * (h / maxH)} 0.08 75)` : '#f6f3ec'} stroke={on ? '#15161b' : '#d9d3c6'} strokeWidth={on ? 2 : 0.8} />
              {/* right half: one tick per course */}
              {cs.map((_, k) => {
                const ang = 0.26 + ((k + 0.5) / cs.length) * (Math.PI - 0.6);
                const [x1, y1] = polar(ang, ri + 3);
                const [x2, y2] = polar(ang, ro - 3);
                return <line key={k} x1={x1} y1={y1} x2={x2} y2={y2} stroke={h / maxH > 0.45 ? '#fff' : '#5a3b0a'} strokeWidth={1.5} />;
              })}
              {/* bottom: publications */}
              {pubs.map((_, k) => {
                const [cx, cy] = polar(Math.PI - 0.08 - (k * 13) / rm, rm);
                return <circle key={`p${k}`} cx={cx} cy={cy} r={5} fill="#c0282d" stroke="#fff" strokeWidth={1.5} />;
              })}
              {/* left half: one dot per role or degree active that year */}
              {dots.map((kind, k) => {
                const step = Math.min(10.5 / rm, (Math.PI - 0.7) / Math.max(1, dots.length - 1));
                const [cx, cy] = polar((3 * Math.PI) / 2 + (k - (dots.length - 1) / 2) * step, rm);
                return <circle key={`r${k}`} cx={cx} cy={cy} r={3.6} fill={KIND_COLOR[kind]} stroke="#fff" strokeWidth={1} />;
              })}
              <text x={rm} y={4} textAnchor="middle" className="cx-tick" transform="rotate(-90)">
                {fmtYear(loc, y).slice(-2)}
              </text>
            </g>
          );
        })}
      </g>
      <text x={300} y={592} textAnchor="middle" className="cx-label-sub">
        {t('circos.ringsKey', { lo: fmtYear(loc, lo), hi: fmtYear(loc, hi) })}
      </text>
    </svg>
  );
}

/** Years drawn as rings (first dated entry → generation year) and what was active in each. */
export function ringYears(data: SiteData) {
  const all = activeByYear(data);
  const lo = Math.max(2015, all[0]?.year ?? 2015);
  const hi = Math.min(2026, all[all.length - 1]?.year ?? 2026);
  return { lo, hi, act: new Map(all.map((y) => [y.year, y])) };
}

/* ───────────────────────── Figure 4: sankey ───────────────────────── */

export function SankeyFigure({ data, model, labels }: { data: SiteData; model: Model; labels: Record<string, string> }) {
  const t = useTranslations();
  const loc = data.locale;
  const [hover, setHover] = useState<string | null>(null);
  const graph = useMemo(() => {
    const cats: ProjectCategory[] = ['omics', 'structural', 'ml', 'software', 'biotech'];
    const doms = model.doms.filter((d) => d.projects.length > 0);
    const nodes = [...cats.map((c) => ({ id: `c:${c}`, name: t(`categories.${c}`), color: CAT_COLOR[c] })), ...doms.map((d) => ({ id: `d:${d.id}`, name: labels[d.id], color: domColor(d.hue) }))];
    const links: Array<{ source: string; target: string; value: number }> = [];
    for (const c of cats)
      for (const d of doms) {
        const n = model.projects.filter((p) => p.category === c && model.pd.get(p.id)!.includes(d.id)).length;
        if (n) links.push({ source: `c:${c}`, target: `d:${d.id}`, value: n });
      }
    const layout = d3sankey<{ id: string; name: string; color: string }, { value: number }>()
      .nodeId((n) => n.id)
      .nodeWidth(14)
      .nodePadding(15)
      .extent([
        [210, 10],
        [700, 510],
      ]);
    return layout({ nodes: nodes.map((n) => ({ ...n })), links: links.map((l) => ({ ...l })) });
  }, [model, labels, t]);
  const catN = useMemo(() => new Map(model.projects.map((p) => [p.category, model.projects.filter((q) => q.category === p.category).length])), [model]);
  const path = sankeyLinkHorizontal();
  return (
    <svg direction="ltr" viewBox="0 0 980 520" className="block h-auto w-full min-w-[680px]" role="img" aria-labelledby="fig4-cap">
      {graph.links.map((l, i) => {
        const s = l.source as unknown as { id: string; color: string };
        const tg = l.target as unknown as { id: string };
        const on = !hover || hover === s.id || hover === tg.id;
        return <path key={i} d={rd(path(l as never))} fill="none" stroke={s.color} strokeOpacity={on ? 0.42 : 0.07} strokeWidth={Math.max(1, l.width ?? 1)} />;
      })}
      {graph.nodes.map((n) => {
        const left = n.id.startsWith('c:');
        return (
          <g key={n.id} onMouseEnter={() => setHover(n.id)} onMouseLeave={() => setHover(null)}>
            <rect x={n.x0} y={n.y0} width={(n.x1 ?? 0) - (n.x0 ?? 0)} height={Math.max(1, (n.y1 ?? 0) - (n.y0 ?? 0))} fill={n.color} />
            <text x={left ? (n.x0 ?? 0) - 8 : (n.x1 ?? 0) + 8} y={((n.y0 ?? 0) + (n.y1 ?? 0)) / 2 + 4} textAnchor={left ? 'end' : 'start'} className="cx-label">
              {n.name} <tspan className="cx-label-sub">{fmtNum(loc, left ? (catN.get(n.id.slice(2) as ProjectCategory) ?? 0) : (n.value ?? 0))}</tspan>
            </text>
          </g>
        );
      })}
    </svg>
  );
}
