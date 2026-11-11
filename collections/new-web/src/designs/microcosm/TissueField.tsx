import { memo, useId } from 'react';
import { curveBasisClosed, line } from 'd3';
import { hash01, r2 } from '@/lib/derive';
import type { Collection } from './specimen';

export const OPTICS = [
  { collection: 'profile', x: 290, y: 271, stain: '#c7a6d8' },
  { collection: 'roles', x: 405, y: 167, stain: '#fca38b' },
  { collection: 'projects', x: 170, y: 220, stain: '#b8c4a1' },
  { collection: 'papers', x: 371, y: 386, stain: '#ffd189' },
  { collection: 'methods', x: 199, y: 366, stain: '#efc2b1' },
] as const satisfies Array<{ collection: Collection; x: number; y: number; stain: string }>;

const R = hash01;
const closed = line<[number, number]>().curve(curveBasisClosed).digits(2);
function membrane(x: number, y: number, rx: number, ry: number, id: string, irregularity = .09) {
  return closed(Array.from({ length: 38 }, (_, i): [number, number] => {
    const a = i * Math.PI / 19;
    const wobble = 1 + irregularity * Math.sin(a * 3 + 6 * R(id)) + irregularity * .5 * Math.cos(a * 6 + 4 * R(id, 3));
    return [x + Math.cos(a) * rx * wobble, y + Math.sin(a) * ry * wobble];
  })) ?? '';
}

const outer = membrane(274, 278, 229, 207, 'outer');
const inner = membrane(274, 278, 221, 197, 'outer');
const nucleus = membrane(290, 271, 88, 78, 'nuc');
const nucleusInset = membrane(290, 271, 81, 72, 'nuc');
const satellites = [
  [-23, 101, 101, 94, -10], [100, 16, 86, 53, 18], [440, 28, 109, 59, 18], [569, 179, 83, 112, -12],
  [566, 398, 108, 101, 14], [421, 551, 115, 93, 23], [183, 563, 118, 104, 24], [-16, 453, 113, 109, -20], [-38, 262, 90, 107, 14],
];
const granules = Array.from({ length: 1100 }, (_, i) => {
  const key = String(i);
  const x = r2(R(key, 4) * 560);
  const y = r2(R(key, 18) * 560);
  const s = R(key, 36);
  return { x, y, r: r2(.22 + s * s * 2.9), op: r2(.13 + R(key, 47) * .50), fill: ['#ffd6ba', '#e6957d', '#643c66', '#ffe0c4', '#372d46', '#edb796'][i % 6] };
});
const bubbles = Array.from({ length: 70 }, (_, i) => {
  const key = 'vesicle' + i;
  const x = r2(57 + R(key, 4) * 442);
  const y = r2(68 + R(key, 18) * 421);
  const r = r2(1.7 + R(key, 36) ** 3 * 9.6);
  return { x, y, r };
}).filter(({ x, y }) => Math.hypot((x - 290) * .84, y - 271) > 80);
const fibers = Array.from({ length: 32 }, (_, i) => {
  const k = 'fiber' + i;
  const a = R(k, 28) * Math.PI * 2;
  const x = 273 + Math.cos(a) * (98 + R(k) * 121);
  const y = 276 + Math.sin(a) * (91 + R(k, 12) * 106);
  const dx = Math.sin(a) * (12 + R(k, 10) * 53);
  const dy = Math.cos(a) * (12 + R(k, 18) * 53);
  return `M${r2(x)} ${r2(y)}q${r2(dx * .65)} ${r2(-dy * .23)} ${r2(dx)} ${r2(-dy)}`;
});

const er = [
  'M157 136 C111 146 127 179 154 184 C187 193 185 214 158 225 C114 240 108 262 152 281',
  'M174 139 C135 149 142 170 169 178 C213 193 208 221 172 235 C142 247 139 261 167 271',
  'M186 147 C163 155 158 165 183 173 C224 189 232 214 202 236 C179 249 173 258 183 267',
  'M198 154 C179 159 183 167 207 176 C244 190 246 223 221 237',
  'M124 180 C102 203 131 205 129 218 C126 229 103 242 110 255',
];
const golgi = [
  'M319 366 C332 375 352 373 368 356 C382 341 398 342 411 349',
  'M320 377 C338 386 356 384 375 365 C388 351 402 354 414 361',
  'M326 390 C347 397 366 393 382 376 C396 363 408 366 420 373',
  'M334 402 C356 410 372 401 387 387 C401 373 411 378 420 383',
  'M343 414 C361 418 378 411 392 398 C404 387 412 387 420 392',
];

export const TissueField = memo(function TissueField() {
  const prefix = useId();
  const ref = (n: string) => `url(#${prefix}-${n})`;
  const id = (n: string) => `${prefix}-${n}`;
  return (
    <svg viewBox="0 0 560 560" aria-hidden="true" focusable="false" className="mc-tissue-svg">
      <defs>
        <radialGradient id={id('ground')} cx="38%" cy="43%" r="78%">
          <stop stopColor="#a26b83" /><stop offset=".6" stopColor="#4e3a59" /><stop offset="1" stopColor="#211b2e" />
        </radialGradient>
        <radialGradient id={id('cyto')} cx="40%" cy="32%" r="76%">
          <stop stopColor="#f9d3aa" /><stop offset=".35" stopColor="#e9a18d" /><stop offset=".76" stopColor="#a66b86" /><stop offset="1" stopColor="#693e5d" />
        </radialGradient>
        <linearGradient id={id('edge')} x1="0" x2=".9" y1=".1" y2="1" gradientUnits="objectBoundingBox">
          <stop stopColor="#fff1ca" /><stop offset=".30" stopColor="#f5b9a2" /><stop offset=".62" stopColor="#ac6578" /><stop offset="1" stopColor="#4c284d" />
        </linearGradient>
        <radialGradient id={id('nuc')} cx="40%" cy="34%" r="69%">
          <stop stopColor="#f1c3d4" /><stop offset=".42" stopColor="#ae83b6" /><stop offset=".8" stopColor="#795084" /><stop offset="1" stopColor="#522e64" />
        </radialGradient>
        <radialGradient id={id('ves')} cx="30%" cy="24%" r="74%">
          <stop stopColor="#fff0d1" /><stop offset=".38" stopColor="#f9bdad" stopOpacity=".45" /><stop offset=".8" stopColor="#8c697e" stopOpacity=".35" /><stop offset="1" stopColor="#573b63" stopOpacity=".9" />
        </radialGradient>
        <linearGradient id={id('mito')} x1="0" x2=".2" y1="0" y2="1" gradientUnits="objectBoundingBox">
          <stop stopColor="#ffd4ad" /><stop offset=".31" stopColor="#e99a7e" /><stop offset=".7" stopColor="#bb665e" /><stop offset="1" stopColor="#733c58" />
        </linearGradient>
        <radialGradient id={id('vignette')}>
          <stop offset=".60" stopColor="#21182a" stopOpacity="0" /><stop offset="1" stopColor="#251829" stopOpacity=".58" />
        </radialGradient>
        <clipPath id={id('cellClip')}><path d={inner} /></clipPath>
        <clipPath id={id('nucleusClip')}><path d={nucleusInset} /></clipPath>
        <filter id={id('diffuse')} x="-20%" y="-20%" width="140%" height="140%"><feGaussianBlur stdDeviation="3.7" /></filter>
        <filter id={id('texture')} x="0" y="0" width="100%" height="100%">
          <feTurbulence type="fractalNoise" baseFrequency=".48" numOctaves="3" seed="5" stitchTiles="stitch" />
          <feColorMatrix type="saturate" values="0" />
        </filter>
      </defs>
      <rect width="560" height="560" fill={ref('ground')} />
      <g opacity=".72" filter={ref('diffuse')}>
        {satellites.map(([x, y, rx, ry, angle], i) => (
          <g key={i} transform={`rotate(${angle} ${x} ${y})`}>
            <path d={membrane(x, y, rx, ry, 'sat' + i)} fill={ref('cyto')} stroke="#f3ad9b" strokeWidth="4" />
            <path d={membrane(x, y, rx * .89, ry * .9, 'sat' + i)} fill="none" stroke="#7a4b76" strokeWidth="2" />
            <path d={membrane(x + 10, y + 7, rx * .37, ry * .36, 'n' + i)} fill={ref('nuc')} stroke="#d7a1be" strokeWidth="2" />
          </g>
        ))}
      </g>
      <path d={outer} fill="#49273e" stroke="#3d294a" strokeWidth="25" filter={ref('diffuse')} />
      <path d={outer} fill={ref('edge')} stroke="#582e54" strokeWidth="2.2" />
      <path d={inner} fill={ref('cyto')} stroke="#734b6b" strokeWidth="3" />
      <g clipPath={ref('cellClip')}>
        <path d={membrane(275, 280, 216, 194, 'outer')} fill="none" stroke="#fff0bd" strokeWidth="4.2" opacity=".4" />
        <g filter={ref('diffuse')} opacity=".35">
          <path d="M51 291Q144 112 255 156T504 303" fill="none" stroke="#fee0b4" strokeWidth="27" />
          <path d="M83 395Q258 490 429 352" fill="none" stroke="#784b75" strokeWidth="29" />
          <ellipse cx="328" cy="130" rx="126" ry="25" fill="#ffe4c6" />
        </g>
        <g>
          {fibers.map((d, i) => <path key={i} d={d} fill="none" stroke={i % 2 ? '#f9c7ad' : '#815778'} strokeWidth={i % 3 + .5} opacity=".43" />)}
          {granules.map(({ x, y, r, op, fill }, i) => <circle key={i} cx={x} cy={y} r={r} fill={fill} opacity={op} />)}
          {bubbles.map(({ x, y, r }, i) => (
            <g key={i}>
              <circle cx={x} cy={y} r={r} fill={ref('ves')} stroke="#8b5c79" strokeWidth=".7" />
              {r > 3 && <circle cx={x - r * .28} cy={y - r * .27} r={r * .21} fill="#ffdfbb" opacity=".8" />}
            </g>
          ))}
        </g>
        {er.map((d, i) => <g key={d} opacity={i === 4 ? .7 : 1}>
          <path d={d} transform="translate(2 2)" fill="none" stroke="#6b405a" strokeWidth="9.5" opacity=".38" />
          <path d={d} fill="none" stroke="#665e59" strokeWidth="8.2" strokeLinecap="round" />
          <path d={d} fill="none" stroke="#bec9a1" strokeWidth="5.3" strokeLinecap="round" />
          <path d={d} transform="translate(-1 1)" fill="none" stroke="#fff0cb" strokeWidth="1.2" opacity=".75" />
          <path d={d} transform="translate(4 2)" fill="none" stroke="#654161" strokeWidth="1.5" strokeDasharray="1 5" strokeLinecap="round" />
        </g>)}
        <g>
          <path d={nucleus} fill="#744c79" stroke="#573d65" strokeWidth="12" opacity=".7" filter={ref('diffuse')} />
          <path d={nucleus} fill={ref('nuc')} stroke="#603d6a" strokeWidth="5" />
          <path d={nucleusInset} fill="none" stroke="#f7cada" strokeWidth="2.6" opacity=".81" />
          <g clipPath={ref('nucleusClip')}>
            {Array.from({ length: 165 }, (_, i) => {
              const k = 'chromatin' + i;
              const x = r2(207 + R(k, 5) * 170);
              const y = r2(192 + R(k, 13) * 160);
              return <ellipse key={k} cx={x} cy={y} rx={r2(1 + R(k, 19) * 4)} ry={r2(.6 + R(k, 23) * 1.7)} transform={`rotate(${r2(R(k) * 180)} ${x} ${y})`} fill={i % 3 === 0 ? '#f7bad0' : '#673d78'} opacity={i % 3 === 0 ? .65 : .32} />;
            })}
            <path d={membrane(292, 264, 25, 21, 'nol')} fill={ref('nuc')} stroke="#74507c" strokeWidth="3.5" />
            <path d={membrane(320, 288, 10, 9, 'nol2')} fill={ref('nuc')} stroke="#74507c" strokeWidth="2" />
          </g>
        </g>
        {[[411, 167, -25, 1], [132, 325, 37, .88], [448, 279, 75, .74], [239, 423, -20, .78], [270, 130, 18, .57]].map(([x, y, rot, scale], i) => (
          <g key={i} transform={`translate(${x} ${y}) rotate(${rot}) scale(${scale})`}>
            <path d="M-45 -1C-48 -28 -10 -23 9 -19C34 -14 51 -17 50 3C50 20 27 22 7 19C-17 15 -41 22 -45 -1Z" fill={ref('mito')} stroke="#753c5b" strokeWidth="4.2" />
            <path d="M-39 -3C-42 -23 -11 -17 7 -14C32 -10 44 -12 44 3C44 17 25 17 9 14C-17 10 -34 17 -39 -3Z" fill="none" stroke="#ffd1ad" strokeWidth="2.7" />
            <path d="M-29 -13Q-17 -9 -25 0T-21 11M-14 -15Q-5 -8 -12 1T-9 11M0 -14Q10 -8 3 0T4 14M16 -12Q24 -6 18 0T20 14M31 -8Q38 -3 30 3T34 12" fill="none" stroke="#93475e" strokeWidth="3" />
          </g>
        ))}
        {golgi.map((d, i) => <g key={d}>
          <path d={d} transform="translate(2 3)" fill="none" stroke="#623c61" strokeWidth="8.2" opacity=".37" />
          <path d={d} fill="none" stroke="#a96c5e" strokeWidth="8.1" strokeLinecap="round" />
          <path d={d} fill="none" stroke={['#fcc795', '#ffc789', '#ebb582', '#ebaa7b', '#eaa780'][i]} strokeWidth="5.3" strokeLinecap="round" />
          <path d={d} transform="translate(0 -1.2)" fill="none" stroke="#ffdfb7" strokeWidth="1.15" strokeLinecap="round" />
        </g>)}
      </g>
      <rect width="560" height="560" opacity=".17" filter={ref('texture')} style={{ mixBlendMode: 'soft-light' }} />
      <rect width="560" height="560" fill={ref('vignette')} />
    </svg>
  );
});
