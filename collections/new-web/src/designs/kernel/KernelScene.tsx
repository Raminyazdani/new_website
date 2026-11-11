'use client';

import { useEffect, useRef } from 'react';
import * as THREE from 'three';
import type { Machine } from './machine';

type Props = { story: number; machine: Machine; active: number; onReady: () => void; onUnavailable: () => void };
type Resource = THREE.BufferGeometry | THREE.Material;

export default function KernelScene(props: Props) {
  const host = useRef<HTMLDivElement>(null);
  const current = useRef(props);
  const invalidate = useRef<(() => void) | null>(null);
  useEffect(() => { current.current = props; invalidate.current?.(); }, [props]);
  useEffect(() => {
    const element = host.current;
    if (!element) return;
    let renderer: THREE.WebGLRenderer;
    try { renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true, powerPreference: 'low-power' }); }
    catch { current.current.onUnavailable(); return; }
    renderer.setClearColor('#171b1e', 0);
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.05;
    const canvas = renderer.domElement;
    canvas.style.cssText = 'display:block;width:100%;height:100%';
    canvas.setAttribute('aria-hidden', 'true');
    element.append(canvas);
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(37, 1, .1, 60);
    const chip = new THREE.Group();
    scene.add(chip, new THREE.HemisphereLight('#eee0cb', '#172c39', 2.1));
    const key = new THREE.DirectionalLight('#ffe4b6', 4.5); key.position.set(-5, 9, 8);
    const rim = new THREE.DirectionalLight('#b18b6f', 3); rim.position.set(5, 4, -5);
    scene.add(key, rim);
    const resources: Resource[] = [];
    const material = (color: string, metalness = .3, roughness = .45) => {
      const value = new THREE.MeshStandardMaterial({ color, metalness, roughness });
      resources.push(value); return value;
    };
    const box = (x: number, y: number, z: number, coating: THREE.Material) => {
      const geometry = new THREE.BoxGeometry(x, y, z); resources.push(geometry);
      return new THREE.Mesh(geometry, coating);
    };
    const boardMaterial = material('#26343b', .3, .58);
    const copper = material('#b8784f', .72, .30);
    const ceramic = material('#d9cbb3', .25, .47);
    const silicon = material('#263744', .45, .26);
    const board = box(8.7, .2, 6.8, boardMaterial); board.position.y = -.25; chip.add(board);
    const underside = box(8.45, .11, 6.55, material('#0a1117', .2, .75)); underside.position.y = -.43; chip.add(underside);
    const substrate = box(4.65, .22, 4.65, silicon); substrate.position.y = .03; chip.add(substrate);
    const heat = box(4.1, .16, 4.1, copper); chip.add(heat);
    const die = box(3.5, .16, 3.5, silicon); chip.add(die);
    const lid = box(3.9, .13, 3.9, ceramic); chip.add(lid);
    const topContact = box(1.65, .018, 1.65, copper); chip.add(topContact);
    const socket = new THREE.Group(); chip.add(socket);
    for (let side = 0; side < 4; side++) for (let i = 0; i < 17; i++) {
      const pin = box(.075, .13, .42, copper);
      const at = (i - 8) * .23;
      if (side < 2) pin.position.set(at, .07, side === 0 ? -2.54 : 2.54);
      else { pin.rotation.y = Math.PI / 2; pin.position.set(side === 2 ? -2.54 : 2.54, .07, at); }
      socket.add(pin);
    }
    const gates: THREE.Mesh[] = [];
    const gateMaterials: THREE.MeshStandardMaterial[] = [];
    for (let i = 0; i < 16; i++) {
      const coating = material('#785a46', .65, .30);
      const gate = box(.51, .13, .51, coating);
      gate.position.set((i % 4 - 1.5) * .70, .36, (Math.floor(i / 4) - 1.5) * .70);
      chip.add(gate); gates.push(gate); gateMaterials.push(coating);
    }
    const traces: { mesh: THREE.Mesh; coating: THREE.MeshStandardMaterial; phase: number }[] = [];
    for (let side = 0; side < 3; side++) for (let i = 0; i < 7; i++) {
      const coating = material('#87634c', .68, .34);
      const track = box(side === 2 ? .035 : 1.25, .028, side === 2 ? 1.05 : .035, coating);
      if (side === 0) track.position.set(-3.3, -.13, (i - 3) * .34);
      if (side === 1) track.position.set(3.3, -.13, (i - 3) * .34);
      if (side === 2) track.position.set((i - 3) * .34, -.13, 2.95);
      chip.add(track); traces.push({ mesh: track, coating, phase: side === 0 ? 0 : side === 1 ? 2 : 1 });
    }
    const memory = [box(.68, .10, 2.7, silicon), box(.68, .10, 2.7, silicon)];
    memory[0].position.set(-3.65, -.08, -.25); memory[1].position.set(3.65, -.08, -.25); chip.add(...memory);
    const outputMaterial = material('#ecb97a', .4, .25);
    const output = box(.66, .2, .66, outputMaterial); output.position.set(0, .05, 2.99); chip.add(output);
    const cursorGeometry = new THREE.TorusGeometry(.48, .014, 8, 36); resources.push(cursorGeometry);
    const cursorMaterial = new THREE.MeshBasicMaterial({ color: '#f3bb79' }); resources.push(cursorMaterial);
    const cursor = new THREE.Mesh(cursorGeometry, cursorMaterial); cursor.rotation.x = -Math.PI / 2; chip.add(cursor);
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
    const motion = new URLSearchParams(location.search).get('motion');
    const urlStill = motion === 'still' || motion === 'off';
    const fullMotion = motion === 'full';
    let progress = props.story;
    let visible = true, ready = false, failed = false, frame = 0;
    function request() { if (!frame && visible && !document.hidden && !failed) frame = requestAnimationFrame(draw); }
    function resize() {
      const { width, height } = element!.getBoundingClientRect(); if (!width || !height) return;
      camera.aspect = width / height; camera.updateProjectionMatrix();
      renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.6)); renderer.setSize(width, height, false); request();
    }
    function draw() {
      frame = 0; if (!visible || document.hidden || failed) return;
      const state = current.current;
      progress = (!fullMotion && (reduced.matches || urlStill)) || Math.abs(progress - state.story) < .001 ? state.story : THREE.MathUtils.lerp(progress, state.story, .12);
      const opening = Math.max(Math.sin(progress * Math.PI), state.active === 1 ? .72 : 0);
      heat.position.y = .23 + opening * .62;
      die.position.y = .45 + opening * 1.05;
      lid.position.set(opening * 1.15, .74 + opening * 2.25, -opening * .3);
      lid.rotation.z = opening * -.10;
      topContact.position.copy(lid.position); topContact.position.y += .08; topContact.rotation.copy(lid.rotation);
      for (let i = 0; i < gates.length; i++) {
        const register = i < 8 ? state.machine.registers[0] : state.machine.registers[1];
        const bit = (register >> (i % 8)) & 1;
        gates[i].position.y = .63 + opening * 1.05 + bit * .10;
        gateMaterials[i].color.set(bit ? '#e4b57e' : '#695345');
        gateMaterials[i].emissive.set(bit && state.active === 1 ? '#9a3e13' : '#000000');
        gateMaterials[i].emissiveIntensity = .25;
      }
      for (const trace of traces) {
        trace.coating.color.set(trace.phase === state.active ? '#e9af69' : '#87634c');
        trace.coating.emissive.set(trace.phase === state.active ? '#783514' : '#000000');
        trace.coating.emissiveIntensity = .45;
      }
      memory[0].position.y = -.08 + (1 - progress) * .13;
      output.scale.y = 1 + Math.min(state.machine.output[0] ?? 0, 24) * .055;
      output.position.y = -.05 + .1 * output.scale.y;
      cursor.visible = state.active === 2 && state.machine.output.length > 0;
      cursor.position.set(0, .20 + output.scale.y * .13, 2.99);
      chip.rotation.y = -.42 + progress * .75;
      const compact = camera.aspect < 1.1;
      camera.position.set(9 - progress * 3.3, 9 + opening * 2.0, 11.8 + (compact ? 5 : 0));
      camera.lookAt(0, .65 + opening * .45, 0);
      try { renderer.render(scene, camera); } catch { failed = true; current.current.onUnavailable(); return; }
      if (!ready) { ready = true; current.current.onReady(); }
      if (progress !== state.story) request();
    }
    function visibilityChanged() { if (document.hidden && frame) { cancelAnimationFrame(frame); frame = 0; } else request(); }
    function contextLost(event: Event) { event.preventDefault(); failed = true; current.current.onUnavailable(); }
    const resizeObserver = new ResizeObserver(resize), observer = new IntersectionObserver(([entry]) => { visible = entry.isIntersecting; if (visible) request(); });
    resizeObserver.observe(element); observer.observe(element); reduced.addEventListener('change', request);
    document.addEventListener('visibilitychange', visibilityChanged); canvas.addEventListener('webglcontextlost', contextLost);
    invalidate.current = request; resize();
    return () => {
      if (frame) cancelAnimationFrame(frame); invalidate.current = null;
      resizeObserver.disconnect(); observer.disconnect(); reduced.removeEventListener('change', request); document.removeEventListener('visibilitychange', visibilityChanged); canvas.removeEventListener('webglcontextlost', contextLost);
      resources.forEach(resource => resource.dispose()); renderer.dispose(); renderer.forceContextLoss(); canvas.remove();
    };
  }, []);
  return <div ref={host} className="kn-canvas" aria-hidden="true" />;
}
