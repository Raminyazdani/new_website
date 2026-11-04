'use client';

import { useState } from 'react';
import { motion } from 'motion/react';
import { useTranslations } from 'next-intl';
import { Marquee } from '@/components/magicui/marquee';
import { OrbitingCircles } from '@/components/magicui/orbiting-circles';
import { BrandIcon, iconFor } from '@/components/shared/BrandIcon';
import { Reveal } from '@/components/shared/Reveal';
import type { SiteData } from '@/lib/types';
import { cn } from '@/lib/utils';
import { HelixMark } from './Nav';
import { SectionHeader } from './ui';
import { seqNo } from '@/lib/format';

const ORBITS: string[][] = [
  ['python', 'r', 'gnubash'],
  ['pytorch', 'scikitlearn', 'jupyter', 'docker', 'git'],
  ['react', 'django', 'postgresql', 'linux', 'latex', 'tensorflow', 'fastapi'],
];

function OrbitIcon({ name }: { name: string }) {
  return (
    <span className="grid size-full place-items-center rounded-full border border-white/10 bg-[#0a1324] shadow-[0_0_24px_-6px_rgba(46,230,197,0.6)]">
      <BrandIcon name={name} colored className="size-[55%]" />
    </span>
  );
}

export function Skills({ data }: { data: SiteData }) {
  const t = useTranslations();
  const [open, setOpen] = useState<string | null>('singlecell');
  const max = Math.max(...data.domains.map((d) => d.count));
  const toolRows = [
    data.skills.filter((c) => ['programming-scripting', 'software-web-development', 'databases-data-engineering'].includes(c.id)).flatMap((c) => c.groups.flatMap((g) => g.items)),
    data.skills.filter((c) => ['bioinformatics-domains', 'data-visualization-reporting', 'devops-infrastructure'].includes(c.id)).flatMap((c) => c.groups.flatMap((g) => g.items)),
  ].map((row) => [...new Map(row.map((i) => [i.key, i])).values()]);

  return (
    <section id="skills" className="relative overflow-hidden py-32">
      <div className="mx-auto max-w-7xl px-6 sm:px-10">
        <SectionHeader index={4} kicker={t('sections.skills.kicker')} title={t('sections.skills.title')} subtitle={t('sections.skills.subtitle')} />

        <div className="grid items-center gap-16 lg:grid-cols-2">
          <Reveal className="relative mx-auto flex aspect-square w-full max-w-[520px] items-center justify-center" dir="ltr">
            <div className="absolute inset-[18%] rounded-full bg-[radial-gradient(circle,rgba(46,230,197,0.18),transparent_70%)] blur-2xl" />
            <div className="relative z-10 grid size-24 place-items-center rounded-full border border-[#2ee6c5]/30 bg-[#06101c] shadow-[0_0_60px_-10px_#2ee6c5]">
              <HelixMark className="size-12" />
            </div>
            <OrbitingCircles iconSize={42} radius={92} duration={22} path>
              {ORBITS[0].map((n) => <OrbitIcon key={n} name={n} />)}
            </OrbitingCircles>
            <OrbitingCircles iconSize={44} radius={165} duration={34} reverse path>
              {ORBITS[1].map((n) => <OrbitIcon key={n} name={n} />)}
            </OrbitingCircles>
            <OrbitingCircles iconSize={40} radius={238} duration={48} path className="hidden sm:flex">
              {ORBITS[2].map((n) => <OrbitIcon key={n} name={n} />)}
            </OrbitingCircles>
            <p className="absolute bottom-0 font-mono text-[11px] uppercase tracking-[0.3em] text-[#6f879c]">{t('helix.orbit')}</p>
          </Reveal>

          <div>
            <p className="mb-5 font-mono text-xs uppercase tracking-[0.25em] text-[#6f879c]">{t('helix.domains')}</p>
            <ul className="divide-y divide-white/[0.06] border-y border-white/[0.06]">
              {data.domains.map((d, i) => {
                const color = `hsl(${d.hue} 85% 62%)`;
                const isOpen = open === d.id;
                return (
                  <li key={d.id}>
                    <button
                      type="button"
                      onClick={() => setOpen(isOpen ? null : d.id)}
                      aria-expanded={isOpen}
                      className="group flex w-full items-center gap-4 py-4 text-start"
                    >
                      <span className="w-6 font-mono text-[11px] text-[#5d7186]">{seqNo(data.locale, i + 1)}</span>
                      <span className="flex-1 text-[15px] text-[#d5e4ef] transition group-hover:text-white">{t(`domains.${d.id}`)}</span>
                      <span className="hidden h-1.5 w-28 overflow-hidden rounded-full bg-white/[0.06] sm:block">
                        <motion.span
                          className="block h-full rounded-full"
                          style={{ background: color, boxShadow: `0 0 10px ${color}` }}
                          initial={{ width: 0 }}
                          whileInView={{ width: `${(d.count / max) * 100}%` }}
                          viewport={{ once: true }}
                          transition={{ duration: 1.1, delay: i * 0.05, ease: [0.16, 1, 0.3, 1] }}
                        />
                      </span>
                      <span className="w-20 text-end font-mono text-xs text-[#8ea3b7]">{t('helix.tools', { count: d.count })}</span>
                    </button>
                    <motion.div initial={false} animate={{ height: isOpen ? 'auto' : 0, opacity: isOpen ? 1 : 0 }} className="overflow-hidden">
                      <div className="flex flex-wrap gap-1.5 pb-5 ps-10">
                        {d.items.map((it) => (
                          <span key={it.key} title={it.long} className="rounded-md border border-white/[0.08] bg-white/[0.03] px-2 py-1 text-xs text-[#b6c7d6]">
                            <bdi>{it.name}</bdi>
                          </span>
                        ))}
                      </div>
                    </motion.div>
                  </li>
                );
              })}
            </ul>
          </div>
        </div>
      </div>

      <div className="mt-24 space-y-3" dir="ltr">
        <p className="mx-auto mb-4 max-w-7xl px-6 font-mono text-xs uppercase tracking-[0.25em] text-[#6f879c] sm:px-10">{t('helix.allTools')}</p>
        {toolRows.map((row, r) => (
          <Marquee key={r} reverse={r === 1} pauseOnHover className="[--duration:70s] [--gap:0.75rem]">
            {row.map((it) => (
              <span
                key={it.key}
                className={cn(
                  'flex items-center gap-2 rounded-xl border border-white/[0.08] bg-[#070c17] px-3.5 py-2 text-sm text-[#c4d4e1]',
                  iconFor(it.key) && 'pe-4',
                )}
              >
                {iconFor(it.key) && <BrandIcon name={it.key} colored className="size-4" />}
                <bdi>{it.name}</bdi>
              </span>
            ))}
          </Marquee>
        ))}
      </div>
    </section>
  );
}
