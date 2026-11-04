import { hash01, r2 } from '@/lib/derive';

/**
 * Deterministic Swiss-style poster (OWN-016): an abstract composition generated from a seed
 * (the project id) and a small count (its number of tags). Same input → same SVG on server and
 * client. Purely decorative — the caption next to it says so.
 * Colours come from the design's CSS variables: --sw-ink, --sw-red, --sw-paper.
 */
export function Poster({
  seed,
  count = 3,
  variant,
  label,
  rtl = false,
  className,
}: {
  seed: string;
  count?: number;
  /** force a composition grammar (0–3); default: chosen by the seed */
  variant?: number;
  label?: string;
  rtl?: boolean;
  className?: string;
}) {
  const h = (i: number) => hash01(seed, i);
  const grammar = variant !== undefined ? variant % 4 : Math.floor(h(0) * 4);
  const n = Math.max(3, Math.min(9, count + 2));
  const shapes: React.ReactNode[] = [];
  const ink = 'var(--sw-ink)';
  const red = 'var(--sw-red)';

  if (grammar === 0) {
    // concentric rings, offset, with one solid red disc
    const cx = 30 + h(1) * 40;
    const cy = 30 + h(2) * 40;
    for (let i = n; i > 0; i--) shapes.push(<circle key={`r${i}`} cx={r2(cx)} cy={r2(cy)} r={r2(i * (46 / n))} fill="none" stroke={ink} strokeWidth={0.6} />);
    shapes.push(<circle key="dot" cx={r2(cx + (h(3) - 0.5) * 30)} cy={r2(cy + (h(4) - 0.5) * 30)} r={r2(7 + h(5) * 8)} fill={red} />);
  } else if (grammar === 1) {
    // diagonal bars, one red
    const red_i = Math.floor(h(1) * n);
    for (let i = 0; i < n; i++) {
      const w = 3 + h(10 + i) * 7;
      const x = -20 + i * (140 / n);
      shapes.push(<rect key={`b${i}`} x={r2(x)} y={-20} width={r2(w)} height={140} fill={i === red_i ? red : ink} transform="rotate(-32 50 50)" />);
    }
  } else if (grammar === 2) {
    // dot grid with a red quarter circle
    const step = 100 / 9;
    for (let x = 1; x < 9; x++)
      for (let y = 1; y < 9; y++) {
        const rr = 0.6 + h(x * 13 + y) * (x + y > 9 ? 2.6 : 1.2);
        shapes.push(<circle key={`d${x}-${y}`} cx={r2(x * step)} cy={r2(y * step)} r={r2(rr)} fill={ink} />);
      }
    const corner = Math.floor(h(2) * 4);
    const qx = corner % 2 ? 100 : 0;
    const qy = corner > 1 ? 100 : 0;
    shapes.push(<circle key="q" cx={qx} cy={qy} r={r2(38 + h(3) * 18)} fill={red} fillOpacity={0.92} />);
  } else {
    // large black arc, red rule, small satellites
    const rot = Math.floor(h(1) * 4) * 90;
    shapes.push(<path key="arc" d="M 0 100 A 100 100 0 0 1 100 0 L 100 100 Z" fill={ink} transform={`rotate(${rot} 50 50)`} />);
    shapes.push(<rect key="rule" x={0} y={r2(20 + h(2) * 60)} width={100} height={2.4} fill={red} />);
    for (let i = 0; i < n; i++) shapes.push(<circle key={`s${i}`} cx={r2(8 + h(20 + i) * 84)} cy={r2(8 + h(40 + i) * 84)} r={r2(1.2 + h(60 + i) * 3)} fill={i % 3 === 0 ? red : 'var(--sw-paper)'} stroke={ink} strokeWidth={0.5} />);
  }

  return (
    <svg viewBox="0 0 100 100" className={className} role="img" aria-label={label} focusable="false">
      <defs>
        <clipPath id={`sw-clip-${seed}`}>
          <rect width={100} height={100} />
        </clipPath>
      </defs>
      <rect width={100} height={100} fill="var(--sw-paper)" />
      <g clipPath={`url(#sw-clip-${seed})`}>
        <g transform={rtl ? 'translate(100 0) scale(-1 1)' : undefined}>{shapes}</g>
      </g>
    </svg>
  );
}
