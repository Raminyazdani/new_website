import { memo, useId } from 'react';
import { hash01, r2 } from '@/lib/derive';

const STRATA = Array.from({ length: 7 }, (_, layer) => {
  const z = (layer - 3) / 3.4;
  const sectionRadius = Math.sqrt(1 - z * z);
  const cells = [];
  for (let iy = -4; iy <= 4; iy++) for (let ix = -4; ix <= 4; ix++) {
    const seed = `${layer}/${ix}/${iy}`;
    const x = ix * 47 + (iy % 2 ? 23 : 0) + (hash01(seed, 3) - .5) * 13;
    const y = iy * 41 + (hash01(seed, 5) - .5) * 13;
    if ((x / (sectionRadius * 185)) ** 2 + (y / (sectionRadius * 210)) ** 2 > 1.08) continue;
    const radius = r2(24 + hash01(seed, 7) * 10);
    cells.push({ x: r2(315 + x + z * 35 + Math.sin(iy * .8) * 10), y: r2(290 + y - z * 36), radius, aspect: r2(.83 + hash01(seed, 9) * .30), rotation: r2(hash01(seed, 11) * 70 - 35), seed });
  }
  return { layer, cells };
});

export const OrganoidVolume = memo(function OrganoidVolume({ cut, spread, selected }: { cut: number; spread: number; selected: number }) {
  const uid = useId();
  const url = (name: string) => `url(#${uid}-${name})`;
  return <svg viewBox="0 0 630 630" className="og-volume" aria-hidden="true" focusable="false">
    <defs>
      {Array.from({ length: 7 }, (_, i) => {
        const moss = i < 3;
        return <radialGradient key={i} id={`${uid}-cell-${i}`} cx="31%" cy="24%" r="76%">
          <stop stopColor={moss ? '#eef1c9' : '#fff0df'} stopOpacity=".95" />
          <stop offset=".2" stopColor={moss ? '#d2d9a7' : '#f2d4bc'} stopOpacity=".9" />
          <stop offset=".52" stopColor={moss ? '#a1af83' : '#d9a78c'} stopOpacity=".88" />
          <stop offset=".84" stopColor={moss ? '#657e61' : '#ae7469'} stopOpacity=".82" />
          <stop offset="1" stopColor={moss ? '#3b594e' : '#785b5b'} stopOpacity=".9" />
        </radialGradient>;
      })}
      <radialGradient id={`${uid}-core`} cx="30%" cy="22%" r="80%"><stop stopColor="#e6d4b2" stopOpacity=".75" /><stop offset=".6" stopColor="#b1a889" stopOpacity=".28" /><stop offset="1" stopColor="#576d59" stopOpacity=".55" /></radialGradient>
      <radialGradient id={`${uid}-highlight`}><stop stopColor="#fffae6" stopOpacity=".6" /><stop offset=".7" stopColor="#fffae6" stopOpacity=".1" /><stop offset="1" stopColor="#fffae6" stopOpacity="0" /></radialGradient>
      <filter id={`${uid}-shadow`} x="-50%" y="-100%" width="200%" height="300%"><feGaussianBlur stdDeviation="13" /></filter>
      <filter id={`${uid}-surface`}><feTurbulence type="fractalNoise" baseFrequency=".12" numOctaves="2" seed="7" /><feColorMatrix type="saturate" values="0" /></filter>
    </defs>
    <ellipse cx="328" cy="554" rx={149 + spread * .2} ry="24" fill="#40533e" opacity=".19" filter={url('shadow')} />
    <g className="og-sculpture">
      {STRATA.map(({ layer, cells }) => {
        const beyond = layer > cut;
        return <g key={layer} className={`og-stratum ${layer === selected ? 'og-stratum-active' : ''}`}
          style={{ transform: `translate(${(layer - 3) * spread * .34}px, ${(layer - 3) * spread * .44}px)`, opacity: beyond ? .035 : 1 }}>
          {cells.map(({ x, y, radius, aspect, rotation, seed }) => <g key={seed} transform={`translate(${x} ${y}) rotate(${rotation})`}>
            <ellipse cx="3" cy="5" rx={radius * 1.02} ry={radius * aspect} fill={layer < 3 ? '#304e3d' : '#875a50'} opacity=".25" />
            <ellipse rx={radius} ry={radius * aspect} fill={url('cell-' + layer)} stroke={layer < 3 ? '#bdc9a0' : '#edceba'} strokeWidth=".85" strokeOpacity=".75" />
            <ellipse cx={radius * -.1} cy={radius * .17} rx={radius * .43} ry={radius * .34 * aspect} fill={url('core')} stroke="#e1d4ab" strokeOpacity=".36" strokeWidth=".8" />
            <ellipse cx={radius * -.24} cy={radius * -.3} rx={radius * .42} ry={radius * .24} fill={url('highlight')} transform="rotate(-20)" />
            <path d={`M${-radius * .69} ${-radius * .16}Q${-radius * .35} ${-radius * .89} ${radius * .22} ${-radius * .72}`} fill="none" stroke="#fff9e5" strokeWidth="1.1" opacity=".46" strokeLinecap="round" />
            <ellipse cx={radius * .18} cy={radius * .15} rx="2.8" ry="2.1" fill="#6b7458" opacity=".32" />
          </g>)}
        </g>;
      })}
    </g>
  </svg>;
});
