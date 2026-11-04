/**
 * Three small, real bioinformatics algorithms for the Sequencer's ALGO mode.
 * Inputs on the page are short synthetic sequences (illustrative only).
 * Verified against hand-computed examples in scripts/qa/test-algos.mjs.
 */

/* ── k-mer counting with a sliding window ── */

/** all windows of length k (position order) */
export const kmerWindows = (seq: string, k: number): string[] => (k < 1 || k > seq.length ? [] : Array.from({ length: seq.length - k + 1 }, (_, i) => seq.slice(i, i + k)));

/** counts of each k-mer in the first `upto` windows (default: all), sorted by count desc, then alphabetically */
export function kmerCounts(seq: string, k: number, upto?: number): Array<[string, number]> {
  const w = kmerWindows(seq, k).slice(0, upto ?? Infinity);
  const m = new Map<string, number>();
  for (const x of w) m.set(x, (m.get(x) ?? 0) + 1);
  return [...m.entries()].sort((a, b) => b[1] - a[1] || (a[0] < b[0] ? -1 : a[0] > b[0] ? 1 : 0));
}

/* ── spaced seeds ── */

/**
 * Compare `query[0..L)` with `target[offset..offset+L)` under a spaced-seed mask ("1" = compared,
 * "0" = don't care). A seed hit needs every compared position to match.
 */
export function seedHit(query: string, target: string, mask: string, offset: number) {
  const L = mask.length;
  const cells = Array.from({ length: L }, (_, i) => {
    const q = query[i] ?? '';
    const t = target[offset + i] ?? '';
    const compared = mask[i] === '1';
    return { i, q, t, compared, match: q !== '' && q === t };
  });
  const hit = cells.every((c) => !c.compared || c.match) && cells.some((c) => c.compared) && offset + L <= target.length;
  return { cells, hit, weight: cells.filter((c) => c.compared).length };
}

/** every offset at which the seed hits */
export const seedHits = (query: string, target: string, mask: string) =>
  Array.from({ length: Math.max(0, target.length - mask.length + 1) }, (_, o) => o).filter((o) => seedHit(query, target, mask, o).hit);

/* ── Needleman–Wunsch global alignment ── */

export interface Scoring {
  match: number;
  mismatch: number;
  gap: number;
}
export const DIAG = 1;
export const UP = 2;
export const LEFT = 4;

/**
 * Full DP matrix H[(n+1) × (m+1)] for a (rows) vs b (columns), plus a pointer bitmask per cell
 * (DIAG | UP | LEFT for every move that reaches the cell's optimum).
 */
export function nwMatrix(a: string, b: string, s: Scoring): { H: number[][]; P: number[][] } {
  const n = a.length;
  const m = b.length;
  const H = Array.from({ length: n + 1 }, () => new Array<number>(m + 1).fill(0));
  const P = Array.from({ length: n + 1 }, () => new Array<number>(m + 1).fill(0));
  for (let i = 1; i <= n; i++) {
    H[i][0] = i * s.gap;
    P[i][0] = UP;
  }
  for (let j = 1; j <= m; j++) {
    H[0][j] = j * s.gap;
    P[0][j] = LEFT;
  }
  for (let i = 1; i <= n; i++)
    for (let j = 1; j <= m; j++) {
      const d = H[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? s.match : s.mismatch);
      const u = H[i - 1][j] + s.gap;
      const l = H[i][j - 1] + s.gap;
      const best = Math.max(d, u, l);
      H[i][j] = best;
      P[i][j] = (d === best ? DIAG : 0) | (u === best ? UP : 0) | (l === best ? LEFT : 0);
    }
  return { H, P };
}

/** one optimal traceback (preference: diagonal, then up, then left) */
export function nwTraceback(a: string, b: string, H: number[][], P: number[][]) {
  let i = a.length;
  let j = b.length;
  const path: Array<[number, number]> = [[i, j]];
  let A = '';
  let B = '';
  while (i > 0 || j > 0) {
    const p = P[i][j];
    if (i > 0 && j > 0 && p & DIAG) {
      A = a[i - 1] + A;
      B = b[j - 1] + B;
      i--;
      j--;
    } else if (i > 0 && (p & UP || j === 0)) {
      A = a[i - 1] + A;
      B = '-' + B;
      i--;
    } else {
      A = '-' + A;
      B = b[j - 1] + B;
      j--;
    }
    path.push([i, j]);
  }
  return { alignA: A, alignB: B, path: path.reverse(), score: H[a.length][b.length] };
}

/** cell fill order for the step-by-step animation: row 0, column 0, then row-major */
export function nwOrder(n: number, m: number): Array<[number, number]> {
  const out: Array<[number, number]> = [];
  for (let j = 0; j <= m; j++) out.push([0, j]);
  for (let i = 1; i <= n; i++) out.push([i, 0]);
  for (let i = 1; i <= n; i++) for (let j = 1; j <= m; j++) out.push([i, j]);
  return out;
}
