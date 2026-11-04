import type { Wall } from './wm';

/* Static wallpaper: a CSS gradient mesh (desktop.css) with soft DNA waves drawn once as SVG.
   Points are rounded to 0.1 so the server and the browser produce the same markup. */
const r1 = (n: number) => Math.round(n * 10) / 10;

function helix(cx0: number, cy: number, amp: number, len: number, width: number, phase: number) {
  const a: string[] = [];
  const b: string[] = [];
  const rungs: string[] = [];
  for (let x = 0; x <= width; x += 16) {
    const t = (x / len) * Math.PI * 2 + phase;
    const ya = r1(cy + amp * Math.sin(t));
    const yb = r1(cy - amp * Math.sin(t));
    a.push(`${a.length ? 'L' : 'M'}${r1(cx0 + x)} ${ya}`);
    b.push(`${b.length ? 'L' : 'M'}${r1(cx0 + x)} ${yb}`);
    if (x % 48 === 0 && Math.abs(Math.sin(t)) > 0.25) rungs.push(`M${r1(cx0 + x)} ${ya}V${yb}`);
  }
  return { a: a.join(''), b: b.join(''), rungs: rungs.join('') };
}

const WAVES = [
  { ...helix(-40, 330, 70, 520, 1700, 0.4), o: 0.22 },
  { ...helix(-40, 700, 46, 380, 1700, 2.1), o: 0.14 },
];

export function Wallpaper({ wall }: { wall: Wall }) {
  return (
    <div className="dt-wall" data-wall={wall} aria-hidden>
      {wall !== 'night' && (
        <svg className="dt-waves" viewBox="0 0 1600 1000" preserveAspectRatio="xMidYMid slice" direction="ltr">
          {WAVES.map((w, i) => (
            <g key={i} opacity={wall === 'helix' ? Math.min(1, w.o * 2.4) : w.o} fill="none" strokeLinecap="round">
              <path d={w.rungs} stroke="#cbd5e1" strokeWidth={1.2} opacity={0.5} />
              <path d={w.a} stroke="#5eead4" strokeWidth={2.4} />
              <path d={w.b} stroke="#a78bfa" strokeWidth={2.4} />
            </g>
          ))}
        </svg>
      )}
    </div>
  );
}
