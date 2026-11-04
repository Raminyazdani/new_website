import type { Publication } from '@/lib/types';
import { cn } from '@/lib/utils';

/** Author list with the portfolio owner's name emphasised. */
export function Authors({ p, ownerName, className, meClassName, etAl }: { p: Publication; ownerName: string; className?: string; meClassName?: string; etAl?: string }) {
  return (
    <span lang="en" dir="ltr" className={className}>
      {p.authors.map((a, k) => (
        <span key={a}>
          <span className={cn(Boolean(ownerName && a.includes(ownerName)) && (meClassName ?? 'font-semibold'))}>{a}</span>
          {k < p.authors.length - 1 ? ', ' : ''}
        </span>
      ))}
      {p.hasMoreAuthors && etAl ? <span className="italic"> · {etAl}</span> : null}
    </span>
  );
}
