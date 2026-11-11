import { useMemo } from 'react';

export type FoldMode = 'structure' | 'sequence' | 'surface';
type V = [number, number, number];
const length = ([x, y, z]: V) => Math.hypot(x, y, z);
const unit = (v: V): V => v.map((n) => n / (length(v) || 1)) as V;
const dot = (a: V, b: V) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
const diff = (a: V, b: V): V => a.map((x, i) => x - b[i]) as V;
const cross = ([x, y, z]: V, [a, b, c]: V): V => [y * c - z * b, z * a - x * c, x * b - y * a];
const axis = (t: number): V => {
  const r = 2.25 + .79 * Math.cos(3 * t);
  return [r * Math.cos(2 * t) + .33 * Math.sin(t), r * Math.sin(2 * t) * .84 + .28 * Math.cos(t), 1.12 * Math.sin(3 * t) + .27 * Math.cos(2 * t)];
};

/** A deterministic perspective projection, with filled faces and lighting when WebGL is unavailable. */
export function FoldFallback({ mode, angle, active, count }: { mode: FoldMode; angle: number; active: number; count: number }) {
  const model = useMemo(() => {
    const rot = .36 + angle * Math.PI / 180;
    const spin = (v: V): V => {
      const [x, y, z] = v;
      const rx = x * Math.cos(rot) + z * Math.sin(rot);
      const rz = z * Math.cos(rot) - x * Math.sin(rot);
      const ry = y * .965 - rz * .262;
      return [rx * .95 - ry * .312, ry * .95 + rx * .312, y * .262 + rz * .965];
    };
    const project = (v: V): [number, number] => {
      const p = 78 * 11 / (11 - v[2]);
      return [400 + v[0] * p, 320 - v[1] * p];
    };
    const steps = 152, sides = 10;
    const frames = Array.from({ length: steps + 1 }, (_, i) => {
      const t = .44 + i / steps * 5.82;
      const p = axis(t);
      const tangent = unit(diff(axis(t + .001), axis(t - .001)));
      const u = unit(cross(tangent, [0, 0, 1]));
      const v = unit(cross(tangent, u));
      const twist = t * 2.65 + .55 * Math.sin(t * 4);
      const a = u.map((x, k) => x * Math.cos(twist) + v[k] * Math.sin(twist)) as V;
      const b = cross(tangent, a);
      const taper = Math.min(1, .2 + i / 12, .24 + (steps - i) / 13);
      const spread = taper * (mode === 'surface' ? .64 : mode === 'sequence' ? .095 : .38 + .14 * Math.sin(5 * t) ** 2);
      const depth = taper * (mode === 'surface' ? .53 : mode === 'sequence' ? .092 : .067);
      const section = Array.from({ length: sides }, (_, j) => {
        const jAngle = j * Math.PI * 2 / sides;
        return spin(p.map((x, k) => x + Math.cos(jAngle) * a[k] * spread + Math.sin(jAngle) * b[k] * depth) as V);
      });
      return { center: spin(p), section };
    });
    const light = unit([-.54, .62, .85]);
    const tris: { points: string; fill: string; z: number }[] = [];
    for (let i = 0; i < steps; i++) for (let j = 0; j < sides; j++) {
      const n = (j + 1) % sides;
      const a = frames[i].section[j], b = frames[i].section[n], c = frames[i + 1].section[n], d = frames[i + 1].section[j];
      const normal = unit(cross(diff(d, a), diff(b, a)));
      if (normal[2] < -.08) continue;
      const selected = Math.floor(i / steps * Math.max(count, 1)) === active;
      const diffuse = Math.max(0, dot(normal, light));
      const highlight = 0.18 * Math.pow(Math.max(0, dot(normal, unit([-.32, .28, 1]))), 10);
      const lum = .31 + .60 * diffuse + highlight;
      const pal = selected ? [259, 180, 136] : mode === 'surface' ? [235, 134, 121] : [226, 118, 84];
      const z = (a[2] + b[2] + c[2] + d[2]) / 4;
      const rgb = pal.map((x, k) => Math.round(Math.min(255, x * lum + (k === 2 ? 23 : 13) * (1 - diffuse))));
      tris.push({ z, points: [a, b, c, d].map((v) => project(v).map((x) => x.toFixed(1)).join(',')).join(' '), fill: `rgb(${rgb.join(' ')})` });
    }
    tris.sort((a, b) => a.z - b.z);
    const markers = frames.filter((_, i) => i % (mode === 'sequence' ? 4 : 32) === 8 % (mode === 'sequence' ? 4 : 32)).map((v, i) => ({ p: project(v.center), z: v.center[2], i })).sort((a, b) => a.z - b.z);
    return { tris, markers };
  }, [active, angle, count, mode]);
  return <svg className="fld-fallback" viewBox="0 0 800 640" aria-hidden="true">
    {model.tris.map(({ points, fill }, i) => <polygon key={i} points={points} fill={fill} stroke={fill} strokeWidth=".5" />)}
    {mode === 'sequence' && model.markers.map(({ p, z, i }) => <circle key={i} cx={p[0]} cy={p[1]} r={3.2 + z * .3} fill={i % 3 ? '#f0a187' : '#ffe0b1'} stroke="#461f2b" strokeWidth=".8" />)}
  </svg>;
}
