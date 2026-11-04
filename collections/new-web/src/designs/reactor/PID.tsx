'use client';

import { useTranslations } from 'next-intl';
import { fmtNum } from '@/lib/format';
import type { Education, ProjectCategory, SiteData } from '@/lib/types';
import { cn } from '@/lib/utils';
import { wrap } from '@/lib/wrap';

export { wrap };

export type Unit =
  | { kind: 'tank'; tag: string; edu: Education }
  | { kind: 'reactor'; tag: string }
  | { kind: 'column'; tag: string }
  | { kind: 'fraction'; tag: string; cat: ProjectCategory }
  | { kind: 'product'; tag: string };

export const CATS: ProjectCategory[] = ['omics', 'structural', 'ml', 'software', 'biotech'];

export interface Readout {
  tag: string;
  label: string;
  value: string;
}

/**
 * The P&ID: feed tanks (degrees) → header → R-201 (career) with readouts → C-301 column →
 * fraction collector (project categories); R-201 → P-401 (publications). Engineering drawings
 * stay left-to-right in every language. Equipment are buttons that open a faceplate.
 */
export function PID({
  data,
  tanks,
  readouts,
  catCounts,
  onOpen,
}: {
  data: SiteData;
  tanks: Education[];
  readouts: Readout[];
  catCounts: Record<ProjectCategory, number>;
  onOpen: (u: Unit) => void;
}) {
  const t = useTranslations();
  const loc = data.locale;
  const maxCat = Math.max(...Object.values(catCounts), 1);
  const eq = (u: Unit, label: string, children: React.ReactNode, className?: string) => (
    <g
      key={u.tag}
      role="button"
      tabIndex={0}
      aria-label={label}
      onClick={() => onOpen(u)}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onOpen(u);
        }
      }}
      className={cn('rx-eq', className)}
    >
      {children}
    </g>
  );
  const status = (running: boolean) => (running ? t('reactor.status.running') : t('reactor.status.complete'));

  return (
    <svg direction="ltr" viewBox="0 0 1200 560" className="block h-auto w-full" role="group" aria-label={t('reactor.pidLabel')}>
      <defs>
        <pattern id="rx-pack" width="8" height="8" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
          <line x1="0" y1="0" x2="0" y2="8" stroke="#b7c0c7" strokeWidth="2" />
        </pattern>
      </defs>

      {/* pipes (drawn first) */}
      <g aria-hidden>
        {tanks.map((_, i) => {
          const x = 105 + i * 120;
          return <path key={i} className="rx-pipe" d={`M ${x} 232 V 286 M ${x} 314 V 410 H 480`} />;
        })}
        <path className="rx-pipe" d="M 700 412 H 860 V 104 H 880" />
        <path className="rx-pipe" d="M 905 402 V 352 M 905 352 H 1134" />
        {CATS.map((_, i) => (
          <path key={i} className="rx-pipe" d={`M ${974 + i * 40} 352 V 382`} />
        ))}
        <path className="rx-pipe" d="M 668 84 V 36 H 1070 V 70" />
        {/* flow overlays */}
        {tanks.map((e, i) => {
          const x = 105 + i * 120;
          return <path key={`f${i}`} className={cn('rx-flow', e.current && 'rx-flow-on')} d={`M ${x} 314 V 410 H 480`} />;
        })}
        <path className="rx-flow rx-flow-on" d="M 700 412 H 860 V 104 H 880" />
        <path className="rx-flow rx-flow-on" d="M 905 402 V 352 H 1134" />
        <path className="rx-flow rx-flow-on" d="M 668 84 V 36 H 1070 V 70" />
      </g>

      {/* feed tanks */}
      {tanks.map((e, i) => {
        const x = 60 + i * 120;
        const tag = `T-10${i + 1}`;
        const running = e.current;
        const lines = wrap(e.degree.split(' (')[0], 15);
        return eq(
          { kind: 'tank', tag, edu: e },
          `${tag}: ${e.degree} — ${status(running)}`,
          <>
            <text x={x + 45} y={42} textAnchor="middle" className="rx-tag">
              {tag}
            </text>
            <path d={`M ${x} 82 Q ${x} 60 ${x + 45} 60 Q ${x + 90} 60 ${x + 90} 82 V 222 Q ${x + 90} 232 ${x + 80} 232 H ${x + 10} Q ${x} 232 ${x} 222 Z`} className="rx-vessel" />
            <rect x={x + 6} y={running ? 150 : 84} width={78} height={running ? 76 : 142} rx={4} className={running ? 'rx-level-run' : 'rx-level'} />
            <text x={x + 45} y={250} textAnchor="middle" className="rx-name">
              {lines.map((l, k) => (
                <tspan key={k} x={x + 45} dy={k ? 15 : 0}>
                  {l}
                </tspan>
              ))}
            </text>
            <rect x={x + 8} y={102} width={74} height={18} rx={3} className={running ? 'rx-badge-run' : 'rx-badge'} />
            <text x={x + 45} y={115} textAnchor="middle" className={running ? 'rx-badge-text-run' : 'rx-badge-text'}>
              {status(running)}
            </text>
            {/* pump */}
            <circle cx={x + 45} cy={300} r={14} className="rx-pump" />
            <path d={`M ${x + 39} 292 L ${x + 53} 300 L ${x + 39} 308 Z`} className="rx-pump-tri" />
            <text x={x + 64} y={304} className="rx-tag-sm">
              P-10{i + 1}
            </text>
          </>,
        );
      })}

      {/* reactor */}
      {eq(
        { kind: 'reactor', tag: 'R-201' },
        `R-201: ${t('reactor.unit.reactor')} — ${t('reactor.status.running')}`,
        <>
          <text x={590} y={22} textAnchor="middle" className="rx-tag">
            R-201 · {t('reactor.unit.reactor')}
          </text>
          <rect x={572} y={44} width={36} height={26} rx={3} className="rx-motor" />
          <path d="M 480 120 Q 480 72 590 72 Q 700 72 700 120 V 392 Q 700 442 590 442 Q 480 442 480 392 Z" className="rx-vessel" />
          <rect x={488} y={200} width={204} height={226} rx={30} className="rx-level-run" opacity={0.55} />
          <line x1={590} y1={70} x2={590} y2={350} className="rx-shaft" />
          <g className="rx-agitator">
            <rect x={548} y={344} width={84} height={10} rx={3} className="rx-blade" />
            <rect x={585} y={330} width={10} height={38} rx={3} className="rx-blade" />
          </g>
          <rect x={516} y={112} width={148} height={22} rx={4} className="rx-badge-run" />
          <text x={590} y={127} textAnchor="middle" className="rx-badge-text-run">
            {t('reactor.status.running')}
          </text>
          <text x={590} y={168} textAnchor="middle" className="rx-name">
            {wrap(t('reactor.unit.reactorSub'), 22).map((l, k) => (
              <tspan key={k} x={590} dy={k ? 15 : 0}>
                {l}
              </tspan>
            ))}
          </text>
        </>,
      )}

      {/* readouts */}
      <g aria-hidden>
        {readouts.map((r, i) => (
          <g key={r.tag} transform={`translate(716 ${92 + i * 48})`}>
            <rect width={128} height={42} rx={4} className="rx-readout" />
            <text x={8} y={15} className="rx-tag-sm">
              {r.tag}
            </text>
            <text x={120} y={33} textAnchor="end" className="rx-value">
              {r.value}
            </text>
            <text x={8} y={33} className="rx-ro-label">
              {r.label.length > 11 ? `${r.label.slice(0, 10)}…` : r.label}
            </text>
          </g>
        ))}
      </g>

      {/* column */}
      {eq(
        { kind: 'column', tag: 'C-301' },
        `C-301: ${t('reactor.unit.column')} — ${t('reactor.status.running')}`,
        <>
          <text x={905} y={74} textAnchor="middle" className="rx-tag">
            C-301
          </text>
          <rect x={880} y={84} width={50} height={318} rx={18} className="rx-vessel" />
          <rect x={886} y={120} width={38} height={250} fill="url(#rx-pack)" />
          {[150, 205, 260, 315].map((y, k) => (
            <rect key={k} x={886} y={y} width={38} height={14} className="rx-band" opacity={0.35 + k * 0.15} />
          ))}
        </>,
      )}

      {/* fraction collector */}
      <text x={1054} y={340} textAnchor="middle" className="rx-tag" aria-hidden>
        F-30x · {t('reactor.unit.fractions')}
      </text>
      {CATS.map((c, i) => {
        const x = 960 + i * 40;
        const n = catCounts[c];
        const h = Math.round((n / maxCat) * 82);
        return eq(
          { kind: 'fraction', tag: `F-30${i + 1}`, cat: c },
          `F-30${i + 1}: ${t(`categories.${c}`)} — ${t('common.count.projects', { count: n })}`,
          <>
            <path d={`M ${x} 382 V 478 Q ${x} 492 ${x + 14} 492 Q ${x + 28} 492 ${x + 28} 478 V 382`} className="rx-vessel" />
            <rect x={x + 3} y={489 - h} width={22} height={h} rx={3} className="rx-level" />
            <text x={x + 14} y={510} textAnchor="middle" className="rx-value-sm">
              {fmtNum(loc, n)}
            </text>
            <text x={x + 14} y={526} textAnchor="middle" className="rx-tag-sm">
              F-30{i + 1}
            </text>
          </>,
        );
      })}

      {/* product tank: publications */}
      {eq(
        { kind: 'product', tag: 'P-401' },
        `P-401: ${t('reactor.unit.product')} — ${t('reactor.pubs', { count: data.publications.length })}`,
        <>
          <path d="M 990 92 Q 990 70 1070 70 Q 1150 70 1150 92 V 222 Q 1150 232 1140 232 H 1000 Q 990 232 990 222 Z" className="rx-vessel" />
          <rect x={996} y={150} width={148} height={76} rx={4} className="rx-level" />
          <text x={1070} y={112} textAnchor="middle" className="rx-tag">
            P-401
          </text>
          <text x={1070} y={132} textAnchor="middle" className="rx-name">
            {t('reactor.unit.product')}
          </text>
          <text x={1070} y={196} textAnchor="middle" className="rx-value">
            {fmtNum(loc, data.publications.length)}
          </text>
        </>,
      )}

      {/* legend */}
      <text x={60} y={548} className="rx-tag-sm" aria-hidden>
        {t('reactor.pidLegend')}
      </text>
    </svg>
  );
}
