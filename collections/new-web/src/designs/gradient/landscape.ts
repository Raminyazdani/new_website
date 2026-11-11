export type Position = { x: number; z: number };
export const extent = 3.1;
export const start: Position = { x: 2.65, z: -2.35 };

/** A small, analytic valley used only for the interactive illustration. */
export function loss({ x, z }: Position) {
  return 0.13 * (z - 0.4 * x * x) ** 2 + 0.20 * (x + 0.8) ** 2;
}

export function derivative({ x, z }: Position): Position {
  const valley = z - 0.4 * x * x;
  return { x: 0.4 * (x + 0.8) - 0.208 * x * valley, z: 0.26 * valley };
}

export function descend(position: Position, rate: number): Position {
  const slope = derivative(position);
  const bound = (value: number) => Math.max(-extent, Math.min(extent, value));
  return { x: bound(position.x - rate * slope.x), z: bound(position.z - rate * slope.z) };
}

export const elevation = (position: Position) => loss(position) * 0.42;
export const levels = [0.12, 0.25, 0.45, 0.7, 1, 1.4, 1.9, 2.5, 3.2, 4, 5, 6.2, 7.5];

/** Pairs of intersections of an analytic level with each sampled cell. */
export function contours(level: number, resolution = 65): Position[][] {
  const segments: Position[][] = [];
  const size = extent * 2 / resolution;
  for (let row = 0; row < resolution; row++) {
    for (let column = 0; column < resolution; column++) {
      const x = -extent + column * size;
      const z = -extent + row * size;
      const corners = [{ x, z }, { x: x + size, z }, { x: x + size, z: z + size }, { x, z: z + size }];
      const intersections: Position[] = [];
      for (let edge = 0; edge < 4; edge++) {
        const a = corners[edge];
        const b = corners[(edge + 1) % 4];
        const aValue = loss(a);
        const bValue = loss(b);
        if ((aValue < level) === (bValue < level)) continue;
        const t = (level - aValue) / (bValue - aValue);
        intersections.push({ x: a.x + (b.x - a.x) * t, z: a.z + (b.z - a.z) * t });
      }
      for (let i = 0; i + 1 < intersections.length; i += 2) segments.push([intersections[i], intersections[i + 1]]);
    }
  }
  return segments;
}
