/**
 * Periodic-table helpers: deterministic element symbols for skills and the classic
 * table silhouette (periods 1–3 with the gap, then full 18-column rows).
 */

const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1).toLowerCase();

/** Unique 1–3 letter symbols, computed from the English skill keys so they are the same in every language. */
export function makeSymbols(keys: string[]): string[] {
  const used = new Set<string>();
  return keys.map((key) => {
    const letters = key.replace(/[^A-Za-z]/g, '') || key.replace(/[^A-Za-z0-9]/g, '') || 'X';
    const words = key.split(/[^A-Za-z0-9]+/).filter(Boolean);
    const cands: string[] = [];
    if (letters.length === 1) cands.push(letters.toUpperCase());
    if (words.length > 1 && /[A-Za-z]/.test(words[0][0]) && /[A-Za-z]/.test(words[1][0])) cands.push(cap(words[0][0] + words[1][0]));
    for (let i = 1; i < letters.length; i++) cands.push(cap(letters[0] + letters[i]));
    for (let i = 1; i < letters.length; i++) for (let j = i + 1; j < letters.length; j++) cands.push(cap(letters[0] + letters[i] + letters[j]));
    cands.push(letters[0].toUpperCase());
    let sym = cands.find((c) => !used.has(c));
    for (let k = 2; !sym; k++) if (!used.has(cap(letters.slice(0, 1)) + k)) sym = cap(letters.slice(0, 1)) + k;
    used.add(sym);
    return sym;
  });
}

export interface Slot {
  r: number;
  c: number;
}

/** Grid slots for n tiles: period 1 → groups 1 and 18; periods 2–3 → groups 1–2 and 13–18; then full rows. */
export function tableSlots(n: number, cols = 18): Slot[] {
  const slots: Slot[] = [];
  const row = (r: number, cs: number[]) => cs.forEach((c) => slots.push({ r, c }));
  row(1, [1, cols]);
  row(2, [1, 2, ...Array.from({ length: 6 }, (_, i) => cols - 5 + i)]);
  row(3, [1, 2, ...Array.from({ length: 6 }, (_, i) => cols - 5 + i)]);
  for (let r = 4; slots.length < n; r++) for (let c = 1; c <= cols && slots.length < n; c++) slots.push({ r, c });
  return slots.slice(0, n);
}
