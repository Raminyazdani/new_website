'use client';

import { useMemo, useState } from 'react';
import { useTranslations } from 'next-intl';
import { hierarchy, pack } from 'd3';
import { skillIndex } from '@/lib/derive';
import { fmtNum } from '@/lib/format';
import type { SiteData } from '@/lib/types';
import { cn } from '@/lib/utils';

const S = 760;
const r1 = (n: number) => Math.round(n * 10) / 10;
type Node = { id: string; name: string; long?: string; hue: number; children?: Node[] };

/**
 * Molecule view: every skill as one "molecule", crowded into its domain like a Goodsell cytoplasm
 * (d3 circle packing, equal sizes). Domain chips select a domain and list its skills.
 */
export function Molecule({ data }: { data: SiteData }) {
  const t = useTranslations();
  const loc = data.locale;
  const groups = useMemo(() => {
    const skills = skillIndex(data);
    const out = data.domains.map((d) => ({ id: d.id, hue: d.hue, items: skills.filter((s) => s.domain === d.id) }));
    out.push({ id: 'soft', hue: -1, items: data.softSkills.map((s, i) => ({ ...s, uid: `soft/${i}`, index: 0, categoryId: 'soft-skills', categoryLabel: '', groupId: 'soft', groupLabel: '', domain: 'soft' })) });
    return out.filter((g) => g.items.length);
  }, [data]);
  const [sel, setSel] = useState(groups[0]?.id ?? 'soft');
  const label = (id: string) => (id === 'soft' ? t('common.softSkills') : t(`domains.${id}`));

  const root = useMemo(() => {
    const tree: Node = { id: 'root', name: '', hue: 0, children: groups.map((g) => ({ id: g.id, name: g.id, hue: g.hue, children: g.items.map((s) => ({ id: s.uid, name: s.name, long: s.long, hue: g.hue })) })) };
    const h = hierarchy(tree).count();
    return pack<Node>().size([S, S]).padding((d) => (d.depth === 0 ? 14 : 3))(h);
  }, [groups]);
  const col = (hue: number, l: number, c = 0.11) => (hue < 0 ? `oklch(${l} 0 0)` : `oklch(${l} ${c} ${hue})`);
  const current = groups.find((g) => g.id === sel)!;

  return (
    <div className="grid gap-8 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)] lg:items-start">
      <svg viewBox={`-12 -12 ${S + 24} ${S + 24}`} className="mx-auto block h-auto w-full max-w-[640px]" role="img" aria-label={t('cell.molLabel', { count: root.leaves().length })}>
        {/* the membrane around the crowd */}
        <circle cx={S / 2} cy={S / 2} r={S / 2 + 2} fill="#f6b38e" />
        <circle cx={S / 2} cy={S / 2} r={S / 2 - 6} fill="#fde6d2" stroke="#d9825b" strokeWidth={1.5} />
        {root.children?.map((g) => {
          const on = g.data.id === sel;
          return (
            <g key={g.data.id} className="cursor-pointer" onClick={() => setSel(g.data.id)} opacity={on ? 1 : 0.55}>
              <circle cx={r1(g.x)} cy={r1(g.y)} r={r1(g.r)} fill={col(g.data.hue, 0.95, 0.03)} stroke={col(g.data.hue, 0.7)} strokeWidth={on ? 2.5 : 1.2} strokeDasharray={on ? undefined : '4 4'} />
              {g.children?.map((m) => (
                <g key={m.data.id}>
                  <circle cx={r1(m.x)} cy={r1(m.y)} r={r1(m.r)} fill={col(g.data.hue, 0.8)} />
                  <circle cx={r1(m.x - m.r * 0.3)} cy={r1(m.y - m.r * 0.3)} r={r1(m.r * 0.35)} fill={col(g.data.hue, 0.9, 0.06)} />
                  <title>{m.data.name}</title>
                </g>
              ))}
            </g>
          );
        })}
      </svg>
      <div>
        <div role="group" aria-label={t('cell.molDomains')} className="flex flex-wrap gap-1.5">
          {groups.map((g) => (
            <button key={g.id} type="button" aria-pressed={sel === g.id} onClick={() => setSel(g.id)} className={cn('cl-chip', sel === g.id && 'cl-chip-on')}>
              <span className="size-2.5 rounded-full" style={{ background: col(g.hue, 0.7) }} aria-hidden />
              {label(g.id)} <span className="opacity-70">{fmtNum(loc, g.items.length)}</span>
            </button>
          ))}
        </div>
        <div className="cl-card mt-4" aria-live="polite">
          <h4 className="cl-display text-[19px]">{label(current.id)}</h4>
          <p className="text-[12.5px] text-[#67596b]">{t('common.count.skills', { count: current.items.length })}</p>
          <p className="mt-3 text-[14px] leading-relaxed">
            {current.items.map((s, i) => (
              <span key={s.uid}>
                {i > 0 && ', '}
                <bdi title={s.long !== s.name ? s.long : undefined}>{s.name}</bdi>
              </span>
            ))}
          </p>
        </div>
      </div>
    </div>
  );
}
