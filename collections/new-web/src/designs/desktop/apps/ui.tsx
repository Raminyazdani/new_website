import { useEffect, useState, type CSSProperties, type ReactNode, type RefObject } from 'react';
import { FileCode2, FlaskConical, Atom, BrainCircuit, Dna, type LucideIcon } from 'lucide-react';
import type { ProjectCategory } from '@/lib/types';
import { cn } from '@/lib/utils';

/** scroll an element inside a window into view (instant under reduced motion) */
export function scrollToId(id: string) {
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  document.getElementById(id)?.scrollIntoView({ block: 'start', behavior: reduce ? 'auto' : 'smooth' });
}

/** separator between facts; Persian uses a comma next to digits (a middle dot reads like ۰) */
export const sepOf = (loc: string) => (loc === 'fa' ? '، ' : ' · ');

export const CAT: Record<ProjectCategory, { color: string; icon: LucideIcon }> = {
  omics: { color: '#0d9488', icon: Dna },
  structural: { color: '#7c3aed', icon: Atom },
  ml: { color: '#c2410c', icon: BrainCircuit },
  software: { color: '#2563eb', icon: FileCode2 },
  biotech: { color: '#15803d', icon: FlaskConical },
};

export function Badge({ children, tone = 'plain', className }: { children: ReactNode; tone?: 'plain' | 'accent' | 'live'; className?: string }) {
  return <span className={cn('dt-badge', tone !== 'plain' && `dt-badge-${tone}`, className)}>{children}</span>;
}

/** a coloured category glyph (file icon in Projects) */
export function CatIcon({ cat, className }: { cat: ProjectCategory; className?: string }) {
  const { color, icon: Icon } = CAT[cat];
  return (
    <span className={cn('dt-caticon', className)} style={{ '--c': color } as CSSProperties} aria-hidden>
      <Icon className="size-[55%]" />
    </span>
  );
}

/** in-app section heading */
export function H3({ children, id, className }: { children: ReactNode; id?: string; className?: string }) {
  return (
    <h3 id={id} className={cn('dt-h3', className)}>
      {children}
    </h3>
  );
}

/** true while the element is narrower than `px` (behaviour only — the look comes from container queries) */
export function useNarrow(ref: RefObject<HTMLElement | null>, px: number) {
  const [narrow, setNarrow] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const ro = new ResizeObserver(([e]) => {
      if (e.contentRect.width > 0) setNarrow(e.contentRect.width < px);
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, [ref, px]);
  return narrow;
}

/** case- and accent-insensitive search key */
export const fold = (s: string) =>
  s
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '');
