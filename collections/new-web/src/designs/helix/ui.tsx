'use client';

import type { ReactNode } from 'react';
import { useLocale } from 'next-intl';
import { Atom, BrainCircuit, Code2, Dna, FlaskConical } from 'lucide-react';
import type { ProjectCategory } from '@/lib/types';
import { Reveal } from '@/components/shared/Reveal';
import { seqNo } from '@/lib/format';
import { cn } from '@/lib/utils';

export const BASE_COLORS = { A: '#2ee6c5', T: '#ff5c8a', G: '#4cc9f0', C: '#ffb547' } as const;

export const categoryIcon: Record<ProjectCategory, typeof Dna> = {
  omics: Dna,
  structural: Atom,
  ml: BrainCircuit,
  software: Code2,
  biotech: FlaskConical,
};

export function SectionHeader({
  index,
  kicker,
  title,
  subtitle,
  className,
}: {
  index: number;
  kicker: string;
  title: ReactNode;
  subtitle?: ReactNode;
  className?: string;
}) {
  const loc = useLocale();
  return (
    <Reveal className={cn('mb-14 max-w-3xl', className)}>
      <p className="mb-5 flex items-center gap-3 font-mono text-xs uppercase tracking-[0.28em] text-[#2ee6c5]">
        <span dir="ltr">{seqNo(loc, index)}</span>
        <span className="h-px w-10 bg-gradient-to-r from-[#2ee6c5] to-transparent rtl:bg-gradient-to-l" />
        {kicker}
      </p>
      <h2 className="font-display text-4xl font-semibold leading-[1.05] tracking-tight text-white sm:text-5xl md:text-6xl">{title}</h2>
      {subtitle && <p className="mt-5 max-w-2xl text-lg leading-relaxed text-[#93a8bc]">{subtitle}</p>}
    </Reveal>
  );
}

export function Chip({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <span className={cn('inline-flex items-center rounded-full border border-white/10 bg-white/[0.04] px-2.5 py-1 font-mono text-[11px] text-[#b6c7d6]', className)}>
      {children}
    </span>
  );
}

/** Deterministic DNA sequence used for decorative strips. */
export function sequence(n: number, seed = 3) {
  const bases = 'ATGC';
  let x = seed;
  return Array.from({ length: n }, () => {
    x = (x * 1103515245 + 12345) & 0x7fffffff;
    return bases[x % 4] as keyof typeof BASE_COLORS;
  });
}
