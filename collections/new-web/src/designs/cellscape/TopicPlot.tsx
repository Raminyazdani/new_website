'use client';

import { Crosshair, Maximize, Minus, Plus } from 'lucide-react';
import { useId, useState } from 'react';
import { fmtNum, fmtYear, seqNo } from '@/lib/format';
import type { SiteData } from '@/lib/types';
import { cluster, kindColor, kinds, mapHeight, mapWidth, populations, type MapPoint, type RecordItem } from './model';
import type { CellStrings } from './strings';

function contour(c: typeof cluster.biology, s: number, phase: number) {
  return Array.from({ length: 111 }, (_, i) => {
    const a = (i % 110) * Math.PI * 2 / 110;
    const wave = s * (1 + 0.12 * Math.sin(a * 3 + 2) + 0.10 * Math.cos(a * 2) + 0.02 * Math.sin(a * 7 + phase));
    return `${i ? 'L' : 'M'}${(c.x + Math.cos(a) * c.rx * wave).toFixed(2)} ${(c.y + Math.sin(a) * c.ry * wave).toFixed(2)}`;
  }).join(' ') + ' Z';
}

function pointMark({ item, r }: MapPoint) {
  if (item.kind === 'project' || item.kind === 'publication') return <rect x={-r} y={-r} width={r * 2} height={r * 2} rx={item.kind === 'project' ? 1.3 : 0} transform={item.kind === 'publication' ? 'rotate(45)' : undefined} fill="currentColor" />;
  if (item.kind === 'education' || item.kind === 'profile') return <circle r={r} fill="#fcfdff" stroke="currentColor" strokeWidth="2.4" />;
  return <circle r={r} fill="currentColor" />;
}

export function TopicPlot({ points, records, visible, selected, onSelect, mode, years, data, s }: {
  points: MapPoint[]; records: RecordItem[]; visible: Set<string>; selected?: RecordItem; onSelect: (item: RecordItem) => void;
  mode: 'map' | 'chronology'; years: number[]; data: SiteData; s: CellStrings;
}) {
  const grid = useId();
  const [zoom, setZoom] = useState(1);
  const [center, setCenter] = useState({ x: mapWidth / 2, y: mapHeight / 2 });
  const point = selected ? points.find((p) => p.item.id === selected.id && visible.has(selected.id)) : undefined;
  const focus = () => { if (point) { setCenter({ x: point.x, y: point.y }); setZoom(1.7); } };
  const fit = () => { setZoom(1); setCenter({ x: mapWidth / 2, y: mapHeight / 2 }); };
  const map = mode === 'map';
  const xTick = (i: number) => 143 + i * (645 / Math.max(1, years.length));
  const filtered = visible.size !== records.length;
  const layers = [0.53, 0.65, 0.77, 0.89, 1.01];
  return (
    <div className="csc-plot">
      <div className="csc-grid-tint" aria-hidden="true" />
      <svg className="csc-svg" viewBox={`0 0 ${mapWidth} ${mapHeight}`} aria-hidden="true">
        <defs><pattern id={grid} width="24" height="24" patternUnits="userSpaceOnUse"><circle cx="1" cy="1" r="0.85" fill="#bdc8dd" /></pattern></defs>
        <rect x="31" y="24" width="875" height="497" fill={`url(#${grid})`} />
        <path d="M31 45V24H52M885 24h21v21M906 500v21h-21M52 521H31v-21" fill="none" stroke="#96a5c4" strokeWidth="1" />
        <g transform={`translate(${mapWidth / 2 - center.x * zoom} ${mapHeight / 2 - center.y * zoom}) scale(${zoom})`}>
          {map ? populations.map((id, i) => {
            const c = cluster[id];
            const total = records.filter((r) => r.population === id).length;
            const n = filtered ? records.filter((r) => r.population === id && visible.has(r.id)).length : total;
            return total > 0 && <g key={id} opacity={n ? 1 : 0.27}>
              <path d={contour(c, 1.02, i)} fill={c.hue} fillOpacity={0.047} stroke={c.hue} strokeOpacity={0.26} strokeDasharray="3.5 4" />
              {layers.slice(0, -1).map((p, j) => <path key={p} d={contour(c, p, i + j)} fill="none" stroke={c.hue} strokeOpacity={0.12 + j * 0.015} />)}
              <g transform={`translate(${c.label[0]} ${c.label[1]})`} className="csc-map-label">
                <circle cx="0" cy="-4" r="3.5" fill={c.hue} />
                <text x="10" y="0" direction={data.dir} textAnchor={data.dir === 'rtl' ? 'end' : 'start'}>{s[id]}</text>
                <text x="0" y="17" className="csc-map-count">{seqNo(data.locale, i + 1)} / {fmtNum(data.locale, n)}</text>
              </g>
            </g>;
          }) : <g className="csc-time-axis">
            {kinds.map((k, i) => <g key={k}>
              <line x1="120" x2="866" y1={88 + i * 51} y2={88 + i * 51} />
              <text x="108" y={92 + i * 51} textAnchor="end">{s[k]}</text>
            </g>)}
            {years.map((y, i) => <g key={y}>
              <line x1={xTick(i)} x2={xTick(i)} y1="53" y2="467" strokeDasharray="3 4" />
              <text x={xTick(i)} y="492" textAnchor="middle">{fmtYear(data.locale, y)}</text>
            </g>)}
            <line x1={xTick(years.length)} x2={xTick(years.length)} y1="53" y2="467" strokeDasharray="3 4" />
            <text x={xTick(years.length)} y="492" textAnchor="middle">{s.noYear}</text>
          </g>}
          {points.filter((p) => visible.has(p.item.id) && p.item.id !== selected?.id).map((p) => (
            <g key={p.item.id} className="csc-point" transform={`translate(${p.x} ${p.y})`} color={kindColor[p.item.kind]} onClick={() => onSelect(p.item)}>
              <title>{p.item.title}</title>
              <circle r={Math.max(5.7, p.r + 1)} fill="transparent" />
              {pointMark(p)}
            </g>
          ))}
          {point && <g className="csc-point-selected" color={kindColor[point.item.kind]} transform={`translate(${point.x} ${point.y})`} onClick={() => onSelect(point.item)}>
            <title>{point.item.title}</title>
            <circle r={19} fill="currentColor" fillOpacity=".14" />
            <circle r={13} fill="#fbfcff" stroke="currentColor" strokeWidth="1.5" />
            <path d="M-22 0h6M16 0h6M0-22v6M0 16v6" stroke="currentColor" />
            {pointMark({ ...point, r: 5.6 })}
          </g>}
        </g>
      </svg>
      <div className="csc-plot-scale" aria-hidden="true"><span>01</span><span>02</span><span>03</span></div>
      <div className="csc-zoom" role="group" aria-label={s.view}>
        <button type="button" title={s.plus} aria-label={s.plus} disabled={zoom >= 2.5} onClick={() => setZoom((v) => Math.min(2.5, v + .25))}><Plus size={16} /></button>
        <button type="button" title={s.minus} aria-label={s.minus} disabled={zoom <= 1} onClick={() => zoom <= 1.25 ? fit() : setZoom((v) => v - .25)}><Minus size={16} /></button>
        <button type="button" title={s.center} aria-label={s.center} disabled={!point} onClick={focus}><Crosshair size={16} /></button>
        <button type="button" title={s.fit} aria-label={s.fit} disabled={zoom === 1} onClick={fit}><Maximize size={15} /></button>
      </div>
    </div>
  );
}
