import * as THREE from 'three';

const TAU = Math.PI * 2;
const sides = 10;
const face = new THREE.Vector3(0, 0, 1);
const up = new THREE.Vector3(0, 1, 0);
type Point = [number, number, number];
type Section = {
  curve: THREE.CatmullRomCurve3;
  shape: 'loop' | 'helix' | 'sheet';
  color: string;
  axis?: [THREE.Vector3, THREE.Vector3];
};

const v = ([x, y, z]: Point) => new THREE.Vector3(x, y, z);

function helix(a: Point, b: Point, radius: number, turns: number, phase: number, color: string): Section {
  const start = v(a);
  const end = v(b);
  const axis = end.clone().sub(start).normalize();
  const radial = axis.clone().cross(face).normalize();
  const binormal = axis.clone().cross(radial);
  const points = Array.from({ length: 73 }, (_, i) => {
    const t = i / 72;
    const angle = phase + t * TAU * turns;
    return start.clone().lerp(end, t)
      .addScaledVector(radial, radius * Math.cos(angle))
      .addScaledVector(binormal, radius * Math.sin(angle));
  });
  return { curve: new THREE.CatmullRomCurve3(points), shape: 'helix', color, axis: [start, end] };
}

function section(shape: 'loop' | 'sheet', color: string, ...points: (Point | THREE.Vector3)[]): Section {
  return { curve: new THREE.CatmullRomCurve3(points.map(point => Array.isArray(point) ? v(point) : point.clone())), shape, color };
}

/** An invented scaffold with the broad coils and arrow-shaped sheets of ribbon illustrations. */
function makeScaffold(): Section[] {
  const left = helix([-3.23, 1.78, -0.15], [-1.94, -1.25, 0.28], 0.68, 2.48, 0.45, '#cf7558');
  const right = helix([3.22, 1.76, -0.48], [2.64, -1.38, 0.18], 0.77, 2.25, 2.2, '#dd8e67');
  const small = helix([1.45, -1.56, 0.40], [0.45, -1.08, 1.36], 0.35, 1.5, 0.2, '#c36c69');
  const begin = [-1.60, -1.27, 0.61] satisfies Point;
  const topA = [-0.47, 1.41, 0.22] satisfies Point;
  const topB = [0.31, 1.25, 0.48] satisfies Point;
  const endB = [-0.73, -1.37, 0.80] satisfies Point;
  const startC = [0.03, -1.16, 0.64] satisfies Point;
  const endC = [1.24, 1.39, 0.22] satisfies Point;
  return [
    section('loop', '#cc7265', [-3.94, 0.85, -0.54], [-4.15, 1.55, -0.05], [-3.83, 2.05, 0.16], left.curve.getPoint(0)),
    left,
    section('loop', '#c87a61', left.curve.getPoint(1), [-2.48, -2.10, 0.38], [-1.91, -2.04, 0.73], begin),
    section('sheet', '#f0ad80', begin, [-1.19, -0.20, 0.87], [-0.89, 0.73, 0.51], topA),
    section('loop', '#d98665', topA, [-0.55, 2.02, -0.15], [-0.09, 2.28, -0.43], [0.35, 1.88, 0.01], topB),
    section('sheet', '#dc7b62', topB, [-0.02, 0.52, 1.06], [-0.37, -0.48, 0.98], endB),
    section('loop', '#d17965', endB, [-0.83, -1.91, 0.51], [-0.43, -2.18, 0.38], [0.04, -1.79, 0.40], startC),
    section('sheet', '#ffc396', startC, [0.47, -0.32, 0.86], [0.92, 0.61, 0.64], endC),
    section('loop', '#be6555', endC, [1.74, 1.89, -0.40], [2.42, 2.14, -1.10], [2.94, 1.99, -1.25], right.curve.getPoint(0)),
    right,
    section('loop', '#ad5861', right.curve.getPoint(1), [3.15, -2.09, 0.45], [2.47, -2.37, 0.59], small.curve.getPoint(0)),
    small,
    section('loop', '#db806f', small.curve.getPoint(1), [0.35, -0.55, 1.64], [0.63, 0.08, 1.35], [1.23, 0.32, 1.25]),
  ];
}

function sheetWidth(t: number) {
  if (t < 0.71) return 0.23;
  if (t < 0.78) return THREE.MathUtils.lerp(0.23, 0.37, (t - 0.71) / 0.07);
  return THREE.MathUtils.lerp(0.37, 0.045, (t - 0.78) / 0.22);
}

const signedPow = (n: number, exponent: number) => Math.sign(n) * Math.pow(Math.abs(n), exponent);
const lineX = (t: number) => 7.8 * (t - 0.5);
const lineY = (t: number) => 0.21 * Math.sin(t * 2.6 * TAU - 0.6);
const lineZ = (t: number) => 0.14 * Math.sin(t * 4 * TAU);
const scatter = (seed: number) => {
  const x = Math.sin(seed * 12.9898 + 78.233) * 43758.5453;
  return x - Math.floor(x);
};

export type RibbonPart = {
  geometry: THREE.BufferGeometry;
  structure: Float32Array;
  sequence: Float32Array;
};

type SurfaceBead = { position: THREE.Vector3; radius: number; color: THREE.Color };
export type SiteMarker = { structure: THREE.Vector3; sequence: THREE.Vector3 };

function ribbon(section: Section, start: number, span: number): RibbonPart {
  const { curve, shape, axis } = section;
  const rings = Math.max(22, Math.ceil(curve.getLength() * 13));
  const count = (rings + 1) * sides + 2;
  const structure = new Float32Array(count * 3);
  const sequence = new Float32Array(count * 3);
  const colors = new Float32Array(count * 3);
  const indices: number[] = [];
  const tone = new THREE.Color(section.color);
  const color = new THREE.Color();
  const p = new THREE.Vector3();
  const tangent = new THREE.Vector3();
  const horizontal = new THREE.Vector3();
  const depth = new THREE.Vector3();
  const axisPoint = new THREE.Vector3();
  const widthAt = shape === 'sheet' ? sheetWidth : () => shape === 'helix' ? 0.255 : 0.092;
  const thickness = shape === 'loop' ? 0.090 : 0.069;

  for (let i = 0; i <= rings; i++) {
    const t = i / rings;
    const along = start + span * t;
    curve.getPoint(t, p);
    curve.getTangent(t, tangent).normalize();
    if (axis) {
      axisPoint.copy(axis[0]).lerp(axis[1], t);
      horizontal.copy(p).sub(axisPoint);
      horizontal.addScaledVector(tangent, -tangent.dot(horizontal)).normalize();
    } else {
      horizontal.crossVectors(face, tangent);
      if (horizontal.lengthSq() < 0.01) horizontal.crossVectors(up, tangent);
      horizontal.normalize();
    }
    depth.crossVectors(tangent, horizontal).normalize();

    for (let j = 0; j < sides; j++) {
      const a = j / sides * TAU;
      const offset = 3 * (i * sides + j);
      const exponent = shape === 'loop' ? 1 : 0.59;
      const w = signedPow(Math.cos(a), exponent);
      const h = signedPow(Math.sin(a), exponent);
      const width = widthAt(t);
      structure[offset] = p.x + horizontal.x * w * width + depth.x * h * thickness;
      structure[offset + 1] = p.y + horizontal.y * w * width + depth.y * h * thickness;
      structure[offset + 2] = p.z + horizontal.z * w * width + depth.z * h * thickness;
      sequence[offset] = lineX(along);
      sequence[offset + 1] = lineY(along) + w * (0.145 + width * 0.13);
      sequence[offset + 2] = lineZ(along) + h * 0.095;
      // Gentle banding reads like a hand-finished cast without a texture download.
      color.copy(tone).multiplyScalar(0.91 + 0.075 * Math.sin(t * 5.6 + 0.45) + 0.07 * Math.abs(w));
      color.toArray(colors, offset);
      if (i < rings) {
        const current = i * sides + j;
        const next = i * sides + (j + 1) % sides;
        indices.push(current, next, current + sides, next, next + sides, current + sides);
      }
    }
  }

  for (const i of [0, rings]) {
    const isStart = i === 0;
    const cap = count - (isStart ? 2 : 1);
    const t = isStart ? 0 : 1;
    const along = start + span * t;
    curve.getPoint(t, p).toArray(structure, cap * 3);
    sequence.set([lineX(along), lineY(along), lineZ(along)], cap * 3);
    tone.toArray(colors, cap * 3);
    for (let j = 0; j < sides; j++) {
      const current = i * sides + j;
      const next = i * sides + (j + 1) % sides;
      indices.push(cap, isStart ? next : current, isStart ? current : next);
    }
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setIndex(indices);
  geometry.setAttribute('position', new THREE.BufferAttribute(structure.slice(), 3).setUsage(THREE.DynamicDrawUsage));
  geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
  geometry.computeVertexNormals();
  return { geometry, structure, sequence };
}

export function poseRibbon(part: RibbonPart, linear: number) {
  const positions = part.geometry.attributes.position as THREE.BufferAttribute;
  const result = positions.array;
  for (let i = 0; i < result.length; i++) result[i] = THREE.MathUtils.lerp(part.structure[i], part.sequence[i], linear);
  positions.needsUpdate = true;
  part.geometry.computeVertexNormals();
}

export function createFoldGeometry() {
  const sections = makeScaffold();
  const sizes = sections.map(section => section.curve.getLength());
  const length = sizes.reduce((sum, size) => sum + size, 0);
  const beads: SurfaceBead[] = [];
  let position = 0;
  const parts = sections.map((section, index) => {
    const start = position / length;
    const span = sizes[index] / length;
    position += sizes[index];
    const count = Math.ceil(sizes[index] * (section.shape === 'loop' ? 4.0 : 8.5));
    for (let i = 0; i < count; i++) {
      const seed = index * 167 + i * 4;
      const t = i / count;
      const point = section.curve.getPointAt(t);
      const direction = section.curve.getTangentAt(t).normalize();
      const n = direction.clone().cross(face).normalize();
      const b = direction.clone().cross(n).normalize();
      const spin = scatter(seed + 1) * TAU;
      const spread = section.shape === 'loop' ? 0.10 : 0.33;
      point.addScaledVector(n, Math.cos(spin) * spread).addScaledVector(b, Math.sin(spin) * spread);
      const color = new THREE.Color(section.color).lerp(new THREE.Color('#ffe1b7'), scatter(seed + 2) * 0.36);
      beads.push({ position: point, radius: (section.shape === 'loop' ? 0.22 : 0.30) + scatter(seed + 3) * 0.13, color });
    }
    return ribbon(section, start, span);
  });

  function markers(count: number): SiteMarker[] {
    const landmarks: Point[] = [[-2.96, 1.40, 0.53], [-1.30, -1.20, 1.35], [0.03, 0.91, 1.37], [2.00, -1.49, 1.26], [3.57, 0.57, 0.85]];
    const labels = Math.max(1, count);
    return Array.from({ length: count }, (_, i) => {
      const at = count < 6 ? Math.round(i * (landmarks.length - 1) / Math.max(1, count - 1)) : i % landmarks.length;
      const t = (i + 0.50) / labels;
      return { structure: v(landmarks[at]), sequence: new THREE.Vector3(lineX(t), lineY(t) + (i % 2 ? -0.20 : 0.22), 0.35) };
    });
  }

  return { parts, beads, markers };
}
