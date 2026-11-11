'use client';

import { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { columns, rows, type Board } from './life';

type Props = { board: Board; ages: number[]; story: number; focus: number; editing: boolean; onPick: (index: number) => void; onReady: () => void; onUnavailable: () => void };

export default function AutomataScene(props: Props) {
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
    renderer.setClearColor('#e4edf0', 0);
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.1;
    const canvas = renderer.domElement;
    canvas.style.cssText = 'display:block;width:100%;height:100%;touch-action:pan-y';
    canvas.setAttribute('aria-hidden', 'true');
    element.append(canvas);
    const scene = new THREE.Scene();
    const camera = new THREE.OrthographicCamera(-6, 6, 4.5, -4.5, .1, 60);
    const field = new THREE.Group();
    scene.add(field, new THREE.HemisphereLight('#f9ffff', '#7292af', 2.4));
    const key = new THREE.DirectionalLight('#fff6e7', 3.8);
    key.position.set(-5, 10, 8);
    const fill = new THREE.DirectionalLight('#91b4ee', 1.7);
    fill.position.set(7, 4, -4);
    scene.add(key, fill);
    const cube = new THREE.BoxGeometry(1, 1, 1);
    const coating = new THREE.MeshStandardMaterial({ color: '#ffffff', metalness: .15, roughness: .34 });
    const cells = new THREE.InstancedMesh(cube, coating, columns * rows);
    cells.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
    cells.frustumCulled = false;
    field.add(cells);
    const plateGeometry = new THREE.BoxGeometry(9.05, .21, 6.3);
    const plateMaterial = new THREE.MeshStandardMaterial({ color: '#91a6b7', metalness: .45, roughness: .37 });
    const plate = new THREE.Mesh(plateGeometry, plateMaterial);
    plate.position.y = -.15;
    field.add(plate);
    const underGeometry = new THREE.BoxGeometry(8.8, .12, 6.1);
    const underMaterial = new THREE.MeshStandardMaterial({ color: '#244b72', roughness: .75 });
    const under = new THREE.Mesh(underGeometry, underMaterial);
    under.position.y = -.31;
    field.add(under);
    const focusGeometry = new THREE.BoxGeometry(.36, .018, .36);
    const focusMaterial = new THREE.MeshBasicMaterial({ color: '#df5738' });
    const selected = new THREE.Mesh(focusGeometry, focusMaterial);
    field.add(selected);
    const dummy = new THREE.Object3D();
    const color = new THREE.Color();
    const dead = new THREE.Color('#c2d2db');
    const young = new THREE.Color('#e36645');
    const mature = new THREE.Color('#275bcc');
    const highlight = new THREE.Color('#f3c664');
    const ray = new THREE.Raycaster();
    const pointer = new THREE.Vector2();
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
    const motion = new URLSearchParams(location.search).get('motion');
    const urlStill = motion === 'still' || motion === 'off';
    const fullMotion = motion === 'full';
    let progress = props.story;
    let visible = true;
    let frame = 0;
    let ready = false;
    let failed = false;
    let down = { x: 0, y: 0 };
    let worldHeight = 8;

    function request() { if (!frame && visible && !document.hidden && !failed) frame = requestAnimationFrame(draw); }
    function resize() {
      const { width, height } = element!.getBoundingClientRect();
      if (!width || !height) return;
      const aspect = width / height;
      const worldWidth = Math.max(11, 6.6 * aspect);
      worldHeight = worldWidth / aspect;
      camera.left = -worldWidth / 2; camera.right = worldWidth / 2;
      camera.top = worldHeight * .55; camera.bottom = -worldHeight * .45;
      camera.updateProjectionMatrix();
      renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.6));
      renderer.setSize(width, height, false);
      request();
    }
    function draw() {
      frame = 0;
      if (!visible || document.hidden || failed) return;
      const state = current.current;
      progress = (!fullMotion && (reduced.matches || urlStill)) || Math.abs(progress - state.story) < .001 ? state.story : THREE.MathUtils.lerp(progress, state.story, .13);
      const rules = Math.max(0, 1 - Math.abs(progress - 1 / 3) * 5);
      const emergence = Math.max(0, 1 - Math.abs(progress - 2 / 3) * 3);
      const distance = Math.sin(progress * Math.PI);
      field.rotation.y = -.12 + progress * .60;
      camera.position.set(7 - progress * 10, 10 + rules * 6 - emergence * 2, 11);
      camera.lookAt(0, .2, 0);
      for (let index = 0; index < state.board.length; index++) {
        const x = index % columns;
        const y = Math.floor(index / columns);
        const alive = state.board[index] === 1;
        const height = alive ? .48 + emergence * Math.min(state.ages[index], 12) * .065 : .035;
        const gap = Math.floor(y / 4) - 1.5;
        dummy.position.set((x - (columns - 1) / 2) * .35, height / 2 + rules * Math.abs(gap) * .20, (y - (rows - 1) / 2) * .35 + rules * gap * .18);
        dummy.scale.set(.285, height, .285); dummy.updateMatrix(); cells.setMatrixAt(index, dummy.matrix);
        const fx = state.focus % columns, fy = Math.floor(state.focus / columns);
        const neighbor = Math.abs(x - fx) <= 1 && Math.abs(y - fy) <= 1;
        if (!alive) color.copy(dead);
        else color.copy(young).lerp(mature, Math.min(state.ages[index] / 7, 1) * (.55 + emergence * .45));
        if (rules > .05 && neighbor) color.lerp(highlight, rules * .55);
        cells.setColorAt(index, color);
      }
      selected.position.set((state.focus % columns - (columns - 1) / 2) * .35, -.005, (Math.floor(state.focus / columns) - (rows - 1) / 2) * .35);
      selected.visible = state.editing || rules > .15;
      plate.scale.z = 1 + rules * .10;
      plate.position.y = -.15 - rules * .10;
      under.position.y = -.31 - distance * .15;
      cells.instanceMatrix.needsUpdate = true;
      if (cells.instanceColor) cells.instanceColor.needsUpdate = true;
      try { renderer.render(scene, camera); } catch { failed = true; current.current.onUnavailable(); return; }
      if (!ready) { ready = true; current.current.onReady(); }
      if (progress !== state.story) request();
    }
    function pointerDown(event: PointerEvent) { down = { x: event.clientX, y: event.clientY }; }
    function pointerUp(event: PointerEvent) {
      if (Math.hypot(event.clientX - down.x, event.clientY - down.y) > 7 || !current.current.editing) return;
      const rect = canvas.getBoundingClientRect();
      pointer.set((event.clientX - rect.left) / rect.width * 2 - 1, 1 - (event.clientY - rect.top) / rect.height * 2);
      ray.setFromCamera(pointer, camera);
      const hit = ray.intersectObject(cells)[0];
      if (hit?.instanceId != null) current.current.onPick(hit.instanceId);
    }
    function visibilityChanged() { if (document.hidden && frame) { cancelAnimationFrame(frame); frame = 0; } else request(); }
    function contextLost(event: Event) { event.preventDefault(); failed = true; current.current.onUnavailable(); }
    const resizeObserver = new ResizeObserver(resize);
    const observer = new IntersectionObserver(([entry]) => { visible = entry.isIntersecting; if (visible) request(); });
    resizeObserver.observe(element); observer.observe(element);
    canvas.addEventListener('pointerdown', pointerDown); canvas.addEventListener('pointerup', pointerUp);
    canvas.addEventListener('webglcontextlost', contextLost);
    document.addEventListener('visibilitychange', visibilityChanged);
    reduced.addEventListener('change', request);
    invalidate.current = request; resize();
    return () => {
      if (frame) cancelAnimationFrame(frame); invalidate.current = null;
      resizeObserver.disconnect(); observer.disconnect();
      canvas.removeEventListener('pointerdown', pointerDown); canvas.removeEventListener('pointerup', pointerUp); canvas.removeEventListener('webglcontextlost', contextLost);
      document.removeEventListener('visibilitychange', visibilityChanged); reduced.removeEventListener('change', request);
      for (const resource of [cube, coating, plateGeometry, plateMaterial, underGeometry, underMaterial, focusGeometry, focusMaterial]) resource.dispose();
      cells.dispose(); renderer.dispose(); renderer.forceContextLoss(); canvas.remove();
    };
  }, []);
  return <div ref={host} className="at-world-canvas" aria-hidden="true" />;
}
