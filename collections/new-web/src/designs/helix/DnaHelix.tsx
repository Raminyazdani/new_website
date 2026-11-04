'use client';

import { useEffect, useMemo, useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Bloom, EffectComposer, Vignette } from '@react-three/postprocessing';
import * as THREE from 'three';

/** Watson–Crick pairs and their glow colours (A–T teal/pink, G–C cyan/amber). */
const BASES = { A: '#2ee6c5', T: '#ff5c8a', G: '#4cc9f0', C: '#ffb547' } as const;
const PAIRS: Array<[keyof typeof BASES, keyof typeof BASES]> = [
  ['A', 'T'],
  ['T', 'A'],
  ['G', 'C'],
  ['C', 'G'],
];

/** Deterministic pseudo-random sequence so server and client agree. */
function mulberry32(seed: number) {
  return () => {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

type Pointer = { current: { x: number; y: number } };

type HelixProps = {
  pointer: Pointer;
  count: number;
  radius?: number;
  rise?: number;
  twist?: number;
  reduced: boolean;
  offsetX: number;
};

function Helix({ pointer: pointerRef, count, radius = 1.55, rise = 0.27, twist = 0.42, reduced, offsetX }: HelixProps) {
  const group = useRef<THREE.Group>(null);
  const halfA = useRef<THREE.InstancedMesh>(null);
  const halfB = useRef<THREE.InstancedMesh>(null);
  const nodes = useRef<THREE.InstancedMesh>(null);
  const height = count * rise;

  const { pairs, curveA, curveB } = useMemo(() => {
    const rnd = mulberry32(7);
    const pairs = Array.from({ length: count }, (_, i) => {
      const theta = i * twist;
      const y = i * rise - height / 2;
      const p = PAIRS[Math.floor(rnd() * PAIRS.length)];
      return { theta, y, a: p[0], b: p[1] };
    });
    const pts = (phase: number) =>
      Array.from({ length: count * 3 }, (_, k) => {
        const i = k / 3;
        const theta = i * twist + phase;
        return new THREE.Vector3(radius * Math.cos(theta), i * rise - height / 2, radius * Math.sin(theta));
      });
    return {
      pairs,
      curveA: new THREE.CatmullRomCurve3(pts(0)),
      curveB: new THREE.CatmullRomCurve3(pts(Math.PI)),
    };
  }, [count, twist, rise, radius, height]);

  const tubeA = useMemo(() => new THREE.TubeGeometry(curveA, count * 6, 0.06, 10, false), [curveA, count]);
  const tubeB = useMemo(() => new THREE.TubeGeometry(curveB, count * 6, 0.06, 10, false), [curveB, count]);

  // One unit-length cylinder, re-used for every half rung (scaled per instance).
  const rungGeo = useMemo(() => {
    const g = new THREE.CylinderGeometry(0.035, 0.035, 1, 8, 1, true);
    g.rotateZ(Math.PI / 2); // along +X
    g.translate(0.5, 0, 0); // pivot at the strand end
    return g;
  }, []);

  const tmp = useMemo(() => new THREE.Object3D(), []);
  const color = useMemo(() => new THREE.Color(), []);

  // Static instance colours
  useEffect(() => {
    pairs.forEach((p, i) => {
      halfA.current?.setColorAt(i, color.set(BASES[p.a]).multiplyScalar(1.45));
      halfB.current?.setColorAt(i, color.set(BASES[p.b]).multiplyScalar(1.45));
      nodes.current?.setColorAt(i * 2, color.set(BASES[p.a]).multiplyScalar(2));
      nodes.current?.setColorAt(i * 2 + 1, color.set(BASES[p.b]).multiplyScalar(2));
    });
    [halfA, halfB, nodes].forEach((r) => r.current?.instanceColor && (r.current.instanceColor.needsUpdate = true));
  }, [pairs, color]);

  const progress = useRef(0);

  useFrame((state, dt) => {
    const g = group.current;
    if (!g) return;
    const pointer = pointerRef.current;
    const vh = typeof window !== 'undefined' ? window.innerHeight : 800;
    const target = typeof window !== 'undefined' ? Math.min(1, window.scrollY / vh) : 0;
    progress.current += (target - progress.current) * Math.min(1, dt * 4);
    const pr = progress.current;

    if (!reduced) g.rotation.y += dt * (0.18 + pr * 0.9);
    g.rotation.x = THREE.MathUtils.lerp(g.rotation.x, -pointer.y * 0.18, 0.05);
    g.rotation.z = THREE.MathUtils.lerp(g.rotation.z, 0.42 + pointer.x * 0.08, 0.05);
    g.position.x = THREE.MathUtils.lerp(g.position.x, offsetX + pointer.x * 0.25 - pr * 0.6, 0.05);
    g.position.y = THREE.MathUtils.lerp(g.position.y, pr * 1.6, 0.08);
    state.camera.position.z = THREE.MathUtils.lerp(state.camera.position.z, 13.5 - pr * 3, 0.06);

    // "Unzip": base pairs separate from the top down as the hero scrolls away.
    const t = state.clock.elapsedTime;
    pairs.forEach((p, i) => {
      const local = THREE.MathUtils.clamp(pr * 1.6 - (1 - i / count) * 0.9, 0, 1);
      const breathe = reduced ? 1 : 0.92 + Math.sin(t * 1.4 + i * 0.35) * 0.08;
      const len = (radius - 0.06) * (1 - local) * breathe;
      const ca = Math.cos(p.theta);
      const sa = Math.sin(p.theta);
      // half A: from strand A towards the axis
      tmp.position.set(radius * ca, p.y, radius * sa);
      tmp.rotation.set(0, -p.theta + Math.PI, 0);
      tmp.scale.set(Math.max(0.0001, len), 1, 1);
      tmp.updateMatrix();
      halfA.current?.setMatrixAt(i, tmp.matrix);
      // half B: from strand B towards the axis
      tmp.position.set(-radius * ca, p.y, -radius * sa);
      tmp.rotation.set(0, -p.theta, 0);
      tmp.updateMatrix();
      halfB.current?.setMatrixAt(i, tmp.matrix);
      // nucleotide nodes at the strand ends
      const s = 0.1 + (reduced ? 0 : Math.sin(t * 2 + i) * 0.012);
      tmp.rotation.set(0, 0, 0);
      tmp.scale.setScalar(s);
      tmp.position.set(radius * ca, p.y, radius * sa);
      tmp.updateMatrix();
      nodes.current?.setMatrixAt(i * 2, tmp.matrix);
      tmp.position.set(-radius * ca, p.y, -radius * sa);
      tmp.updateMatrix();
      nodes.current?.setMatrixAt(i * 2 + 1, tmp.matrix);
    });
    [halfA, halfB, nodes].forEach((r) => r.current && (r.current.instanceMatrix.needsUpdate = true));
  });

  return (
    <group ref={group} position={[offsetX, 0, 0]} rotation={[0, 0, 0.42]}>
      <mesh geometry={tubeA}>
        <meshStandardMaterial color="#0f3d4a" emissive="#1fb5a0" emissiveIntensity={0.9} roughness={0.25} metalness={0.6} />
      </mesh>
      <mesh geometry={tubeB}>
        <meshStandardMaterial color="#132a4d" emissive="#3a8fd8" emissiveIntensity={0.8} roughness={0.25} metalness={0.6} />
      </mesh>
      <instancedMesh ref={halfA} args={[rungGeo, undefined, count]}>
        <meshBasicMaterial toneMapped={false} transparent opacity={0.92} />
      </instancedMesh>
      <instancedMesh ref={halfB} args={[rungGeo, undefined, count]}>
        <meshBasicMaterial toneMapped={false} transparent opacity={0.92} />
      </instancedMesh>
      <instancedMesh ref={nodes} args={[undefined, undefined, count * 2]}>
        <sphereGeometry args={[1, 16, 16]} />
        <meshBasicMaterial toneMapped={false} />
      </instancedMesh>
    </group>
  );
}

function Dust({ count = 700, reduced }: { count?: number; reduced: boolean }) {
  const ref = useRef<THREE.Points>(null);
  const geo = useMemo(() => {
    const rnd = mulberry32(11);
    const pos = new Float32Array(count * 3);
    const col = new Float32Array(count * 3);
    const c = new THREE.Color();
    const palette = Object.values(BASES);
    for (let i = 0; i < count; i++) {
      const r = 2.5 + rnd() * 9;
      const a = rnd() * Math.PI * 2;
      pos.set([Math.cos(a) * r, (rnd() - 0.5) * 16, Math.sin(a) * r - 3], i * 3);
      c.set(palette[i % palette.length]).multiplyScalar(0.6 + rnd() * 0.9);
      col.set([c.r, c.g, c.b], i * 3);
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    g.setAttribute('color', new THREE.BufferAttribute(col, 3));
    return g;
  }, [count]);
  useFrame((_, dt) => {
    if (ref.current && !reduced) ref.current.rotation.y -= dt * 0.02;
  });
  return (
    <points ref={ref} geometry={geo}>
      <pointsMaterial size={0.035} vertexColors transparent opacity={0.85} depthWrite={false} blending={THREE.AdditiveBlending} toneMapped={false} />
    </points>
  );
}

export default function DnaHelix({
  active = true,
  reduced = false,
  compact = false,
  side = 'right',
}: {
  active?: boolean;
  reduced?: boolean;
  compact?: boolean;
  side?: 'left' | 'right';
}) {
  // Track the pointer on the window: the hero copy sits above the canvas and would swallow canvas events.
  const pointer = useRef({ x: 0, y: 0 });
  useEffect(() => {
    const onMove = (e: PointerEvent) => {
      pointer.current.x = (e.clientX / window.innerWidth) * 2 - 1;
      pointer.current.y = -(e.clientY / window.innerHeight) * 2 + 1;
    };
    window.addEventListener('pointermove', onMove, { passive: true });
    return () => window.removeEventListener('pointermove', onMove);
  }, []);
  return (
    <Canvas
      frameloop={active ? 'always' : 'never'}
      dpr={[1, 1.75]}
      camera={{ position: [0, 0, 13.5], fov: 40 }}
      gl={{ antialias: false, alpha: true, powerPreference: 'high-performance' }}
      aria-hidden
    >
      <ambientLight intensity={0.35} />
      <pointLight position={[4, 4, 6]} intensity={40} color="#2ee6c5" />
      <pointLight position={[-5, -3, 4]} intensity={30} color="#ffb547" />
      <Helix pointer={pointer} count={compact ? 40 : 58} reduced={reduced} offsetX={compact ? 0 : side === 'left' ? -3.3 : 3.3} />
      <Dust count={compact ? 350 : 700} reduced={reduced} />
      <EffectComposer multisampling={0}>
        <Bloom intensity={0.85} luminanceThreshold={0.22} luminanceSmoothing={0.4} mipmapBlur />
        <Vignette eskil={false} offset={0.25} darkness={0.6} />
      </EffectComposer>
    </Canvas>
  );
}
