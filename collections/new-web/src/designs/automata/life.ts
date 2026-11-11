export const columns = 24;
export const rows = 16;
export type Board = number[];
export type Preset = 'glider' | 'pulses' | 'garden';

export function seed(preset: Preset): Board {
  const board = Array<number>(columns * rows).fill(0);
  const put = (x: number, y: number) => { board[y * columns + x] = 1; };
  if (preset === 'glider') {
    for (const [x, y] of [[9, 5], [10, 6], [8, 7], [9, 7], [10, 7]]) put(x, y);
  } else if (preset === 'pulses') {
    for (const x of [5, 11, 17]) for (const y of [4, 10]) for (let offset = -1; offset <= 1; offset++) put(x + offset, y);
  } else {
    for (let y = 2; y < rows - 2; y++) for (let x = 2; x < columns - 2; x++) {
      const random = Math.sin(x * 127.1 + y * 311.7) * 43758.5453123;
      if (random - Math.floor(random) > 0.64) put(x, y);
    }
  }
  return board;
}

export function neighbors(board: Board, index: number) {
  const x = index % columns;
  const y = Math.floor(index / columns);
  let total = 0;
  for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) {
    if (!dx && !dy) continue;
    const nx = x + dx;
    const ny = y + dy;
    if (nx >= 0 && nx < columns && ny >= 0 && ny < rows) total += board[ny * columns + nx];
  }
  return total;
}

/** Conway's B3/S23 rule on a finite board, with cells beyond the boundary dead. */
export function evolve(board: Board): Board {
  return board.map((alive, index) => {
    const count = neighbors(board, index);
    return count === 3 || (alive === 1 && count === 2) ? 1 : 0;
  });
}

export function agesAt(frames: Board[], cursor: number) {
  const ages = Array<number>(columns * rows).fill(0);
  for (let frame = 0; frame <= cursor; frame++) {
    for (let index = 0; index < ages.length; index++) ages[index] = frames[frame][index] ? ages[index] + 1 : 0;
  }
  return ages;
}
