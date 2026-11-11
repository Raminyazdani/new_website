'use client';

import { useEffect, useRef, useState, type RefObject } from 'react';
import * as THREE from 'three';

export interface StagePose { progress: number; view: number; angle: number; selected: number; count?: number }
export interface MeshWorld {
  scene: THREE.Scene;
  camera: THREE.Camera;
  resize: (width: number, height: number) => void;
  update: (pose: StagePose) => void;
  pick?: (ray: THREE.Raycaster) => number | null;
}

/** Only the canvas lifecycle is shared; geometry, lighting, camera, narrative and UI belong to each world. */
export function useMeshStage(
  host: RefObject<HTMLDivElement | null>,
  build: () => MeshWorld,
  pose: StagePose,
  onSelect?: (index: number) => void,
) {
  const [status, setStatus] = useState<'loading' | 'ready' | 'unavailable'>('loading');
  const latest = useRef({ pose, onSelect });
  const invalidate = useRef<(() => void) | null>(null);
  useEffect(() => { latest.current = { pose, onSelect }; invalidate.current?.(); }, [pose, onSelect]);
  useEffect(() => {
    const element = host.current;
    if (!element) return;
    let renderer: THREE.WebGLRenderer;
    let world: MeshWorld;
    try {
      renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true, powerPreference: 'low-power' });
      renderer.setClearColor(0, 0);
      renderer.outputColorSpace = THREE.SRGBColorSpace;
      renderer.toneMapping = THREE.ACESFilmicToneMapping;
      renderer.toneMappingExposure = 1.14;
      world = build();
    } catch {
      setStatus('unavailable');
      return;
    }
    const canvas = renderer.domElement;
    canvas.setAttribute('aria-hidden', 'true');
    canvas.style.cssText = 'display:block;width:100%;height:100%;touch-action:pan-y';
    element.append(canvas);
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)');
    const motion = new URLSearchParams(window.location.search).get('motion');
    const still = motion === 'still' || motion === 'off';
    const full = motion === 'full';
    const values = { ...latest.current.pose };
    const ray = new THREE.Raycaster();
    const pointer = new THREE.Vector2();
    let frame = 0;
    let prior = 0;
    let visible = true;
    let lost = false;
    let initialized = false;
    let drag = 0;
    let dragTarget = 0;
    let down: { x: number; y: number; angle: number; type: string } | null = null;
    let width = 0;
    let height = 0;
    const request = () => {
      if (!frame && !lost && visible && !document.hidden && width && height) frame = requestAnimationFrame(draw);
    };
    const stop = () => { cancelAnimationFrame(frame); frame = 0; prior = 0; };
    const fail = () => { lost = true; stop(); setStatus('unavailable'); };
    function draw(time: number) {
      frame = 0;
      if (lost || !visible || document.hidden) return;
      const dt = prior ? Math.min((time - prior) / 1000, .05) : 1 / 60;
      prior = time;
      const target = latest.current.pose;
      const mix = still || (reduce.matches && !full) ? 1 : 1 - Math.exp(-dt * 8.8);
      let moving = false;
      for (const key of ['progress', 'view', 'angle'] as const) {
        const distance = target[key] - values[key];
        values[key] = Math.abs(distance) < .0005 ? target[key] : values[key] + distance * mix;
        moving ||= Math.abs(distance) >= .0005;
      }
      const delta = dragTarget - drag;
      drag = Math.abs(delta) < .0005 ? dragTarget : drag + delta * mix;
      moving ||= Math.abs(delta) >= .0005;
      world.update({ ...values, angle: values.angle + drag, selected: target.selected, count: target.count });
      try { renderer.render(world.scene, world.camera); } catch { fail(); return; }
      if (!initialized) { initialized = true; setStatus('ready'); }
      if (moving) request();
    }
    function resize() {
      const box = element!.getBoundingClientRect();
      width = box.width; height = box.height;
      if (!width || !height) return;
      renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.65));
      renderer.setSize(width, height, false);
      world.resize(width, height);
      request();
    }
    function syncVisibility() { if (document.hidden) stop(); else request(); }
    function downEvent(event: PointerEvent) {
      down = { x: event.clientX, y: event.clientY, angle: dragTarget, type: event.pointerType };
      if (event.pointerType === 'mouse') canvas.setPointerCapture(event.pointerId);
    }
    function moveEvent(event: PointerEvent) {
      if (!down || down.type !== 'mouse') return;
      dragTarget = down.angle + (event.clientX - down.x) * .006;
      request();
    }
    function upEvent(event: PointerEvent) {
      if (!down) return;
      const clicked = Math.hypot(event.clientX - down.x, event.clientY - down.y) < 6;
      down = null;
      if (!clicked || !world.pick) return;
      const box = canvas.getBoundingClientRect();
      pointer.set((event.clientX - box.left) / box.width * 2 - 1, 1 - (event.clientY - box.top) / box.height * 2);
      ray.setFromCamera(pointer, world.camera);
      const chosen = world.pick(ray);
      if (chosen !== null) latest.current.onSelect?.(chosen);
    }
    function cancelPointer() { down = null; }
    const resizeObserver = new ResizeObserver(resize);
    const intersection = new IntersectionObserver(([entry]) => { visible = entry.isIntersecting; if (visible) request(); else stop(); }, { threshold: .04 });
    resizeObserver.observe(element); intersection.observe(element);
    document.addEventListener('visibilitychange', syncVisibility);
    reduce.addEventListener('change', request);
    canvas.addEventListener('webglcontextlost', fail);
    canvas.addEventListener('pointerdown', downEvent);
    canvas.addEventListener('pointermove', moveEvent);
    canvas.addEventListener('pointerup', upEvent);
    canvas.addEventListener('pointercancel', cancelPointer);
    invalidate.current = request;
    resize();
    return () => {
      invalidate.current = null;
      lost = true; stop(); resizeObserver.disconnect(); intersection.disconnect();
      document.removeEventListener('visibilitychange', syncVisibility);
      reduce.removeEventListener('change', request);
      canvas.removeEventListener('webglcontextlost', fail);
      canvas.removeEventListener('pointerdown', downEvent);
      canvas.removeEventListener('pointermove', moveEvent);
      canvas.removeEventListener('pointerup', upEvent);
      canvas.removeEventListener('pointercancel', cancelPointer);
      const geometries = new Set<THREE.BufferGeometry>();
      const materials = new Set<THREE.Material>();
      world.scene.traverse((object) => {
        const mesh = object as THREE.Mesh;
        if (mesh.geometry) geometries.add(mesh.geometry);
        if (mesh.material) (Array.isArray(mesh.material) ? mesh.material : [mesh.material]).forEach((m) => materials.add(m));
      });
      geometries.forEach((g) => g.dispose()); materials.forEach((m) => m.dispose());
      renderer.dispose(); renderer.forceContextLoss(); canvas.remove();
    };
  }, [host, build]);
  return status;
}
