'use client';

import { useTranslations } from 'next-intl';

/* Tag classes → drawing symbols (flow-chart conventions). Purely presentational; tags come from the CV. */
const FRONT = new Set(['React', 'HTML', 'CSS', 'JS', 'TS', 'Vite', 'Tailwind', 'Bootstrap']);
const BACK = new Set(['Django', 'Flask', 'FastAPI', 'Express', 'Node.js']);
const STORE = new Set(['SQLite', 'MySQL', 'PostgreSQL', 'MongoDB', 'Redis', 'PDB']);
const DATA = new Set(['scRNA-seq', 'scATAC-seq', 'RNA-seq', 'Hi-C', 'Spatial', 'Multi-omics', 'Metagenomics']);
const LANG = new Set(['Python', 'R', 'C++', 'Bash']);

type Kind = 'store' | 'data' | 'lang' | 'block';
const kindOf = (tag: string): Kind => (STORE.has(tag) ? 'store' : DATA.has(tag) ? 'data' : LANG.has(tag) ? 'lang' : 'block');

const CH = 7.1; // approx. advance of the 12 px mono label
const BH = 30;
const boxW = (tag: string) => Math.max(58, Math.round(tag.length * CH + 26));

function Block({ tag, x, y }: { tag: string; x: number; y: number }) {
  const w = boxW(tag);
  const k = kindOf(tag);
  const cx = x + w / 2;
  return (
    <g>
      {k === 'store' ? (
        <>
          <path d={`M ${x} ${y + 5} L ${x} ${y + BH - 5} A ${w / 2} 5 0 0 0 ${x + w} ${y + BH - 5} L ${x + w} ${y + 5}`} className="bp-blk" />
          <ellipse cx={cx} cy={y + 5} rx={w / 2} ry={5} className="bp-blk" />
        </>
      ) : k === 'data' ? (
        <polygon points={`${x + 8},${y} ${x + w},${y} ${x + w - 8},${y + BH} ${x},${y + BH}`} className="bp-blk" />
      ) : k === 'lang' ? (
        <>
          <rect x={x} y={y} width={w} height={BH} className="bp-blk" />
          <line x1={x + 6} y1={y} x2={x + 6} y2={y + BH} className="bp-blk-l" />
          <line x1={x + w - 6} y1={y} x2={x + w - 6} y2={y + BH} className="bp-blk-l" />
        </>
      ) : (
        <rect x={x} y={y} width={w} height={BH} rx={2} className="bp-blk" />
      )}
      <text x={cx} y={y + BH / 2 + 4} textAnchor="middle" className="bp-blk-t">
        {tag}
      </text>
    </g>
  );
}

/** Lay blocks out in rows inside a width; returns positions and the used height. */
function flow(tags: string[], width: number, x0: number, y0: number) {
  const out: Array<{ tag: string; x: number; y: number }> = [];
  let x = x0;
  let y = y0;
  for (const tag of tags) {
    const w = boxW(tag);
    if (x > x0 && x + w > x0 + width) {
      x = x0;
      y += BH + 14;
    }
    out.push({ tag, x, y });
    x += w + 14;
  }
  return { out, h: y - y0 + BH };
}

/**
 * Deterministic component diagram of a project from its tags: an assembly boundary with one
 * block per tag (data sets as parallelograms, languages with double bars, stores as cylinders).
 * When the tags contain both a front-end and a back-end technology, the assembly splits into two
 * sub-assemblies joined by an interface line.
 */
export function BlockDiagram({ tags, code }: { tags: string[]; code: string }) {
  const t = useTranslations('blueprint');
  const fe = tags.filter((x) => FRONT.has(x));
  const be = tags.filter((x) => BACK.has(x) || STORE.has(x));
  const split = fe.length > 0 && tags.some((x) => BACK.has(x));
  const W = 440;

  if (split) {
    const rest = tags.filter((x) => !fe.includes(x) && !be.includes(x));
    const colW = 170;
    const L = flow(fe, colW - 24, 22, 44);
    const R = flow([...be, ...rest], colW - 24, W - colW + 4, 44);
    const H = Math.max(L.h, R.h) + 70;
    return (
      <svg viewBox={`0 0 ${W} ${H}`} direction="ltr" className="block h-auto w-full" role="img" aria-label={`${code}: ${t('frontEnd')} ${fe.join(', ')} · ${t('backEnd')} ${[...be, ...rest].join(', ')}`}>
        <text x={8} y={14} className="bp-blk-code">
          {code}
        </text>
        <rect x={10} y={22} width={colW} height={H - 34} className="bp-bound" />
        <rect x={W - colW - 10} y={22} width={colW} height={H - 34} className="bp-bound" />
        <text x={18} y={36} className="bp-blk-cap">
          {t('frontEnd')}
        </text>
        <text x={W - colW - 2} y={36} className="bp-blk-cap">
          {t('backEnd')}
        </text>
        {L.out.map((b) => (
          <Block key={b.tag} {...b} />
        ))}
        {R.out.map((b) => (
          <Block key={b.tag} {...b} />
        ))}
        {/* interface between the two sub-assemblies */}
        <line x1={10 + colW} y1={H / 2 + 6} x2={W - colW - 10} y2={H / 2 + 6} className="bp-iface" />
        <circle cx={10 + colW} cy={H / 2 + 6} r={3} className="bp-dot" />
        <circle cx={W - colW - 10} cy={H / 2 + 6} r={3} className="bp-dot" />
        <text x={W / 2} y={H / 2} textAnchor="middle" className="bp-blk-cap">
          {t('iface')}
        </text>
      </svg>
    );
  }

  const F = flow(tags, W - 48, 24, 44);
  const H = F.h + 66;
  return (
    <svg viewBox={`0 0 ${W} ${H}`} direction="ltr" className="block h-auto w-full" role="img" aria-label={`${code}: ${tags.join(', ')}`}>
      <text x={8} y={14} className="bp-blk-code">
        {code}
      </text>
      <rect x={10} y={22} width={W - 20} height={H - 34} className="bp-bound" />
      {F.out.map((b) => (
        <Block key={b.tag} {...b} />
      ))}
    </svg>
  );
}
