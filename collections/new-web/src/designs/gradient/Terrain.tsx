'use client';

import { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { contours, derivative, elevation, extent, levels, type Position } from './landscape';

type Props = {
  history: Position[];
  view: 'landscape' | 'contours';
  angle: number;
  onReady: () => void;
  onUnavailable: () => void;
};

function makeSurface() {
  const grid = 88;
  const positions: number[] = [];
  const colors: number[] = [];
  const indices: number[] = [];
  const low = new THREE.Color('#173b69');
  const middle = new THREE.Color('#789da9');
  const high = new THREE.Color('#dce3df');
  const color = new THREE.Color();
  for (let row = 0; row <= grid; row++) {
    for (let column = 0; column <= grid; column++) {
      const x = column / grid * extent * 2 - extent;
      const z = row / grid * extent * 2 - extent;
      const y = elevation({ x, z });
      positions.push(x, y, z);
      const value = Math.min(1, y / 3.1);
      color.copy(value < 0.48 ? low : middle).lerp(value < 0.48 ? middle : high, value < 0.48 ? value / 0.48 : (value - 0.48) / 0.52);
      color.toArray(colors, colors.length);
      if (row < grid && column < grid) {
        const at = row * (grid + 1) + column;
        indices.push(at, at + grid + 1, at + 1, at + 1, at + grid + 1, at + grid + 2);
      }
    }
  }
  const surface = new THREE.BufferGeometry();
  surface.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  surface.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
  surface.setIndex(indices);
  surface.computeVertexNormals();
  return surface;
}

function makeWalls() {
  const points: number[] = [];
  const indices: number[] = [];
  const ring = Array.from({ length: 161 }, (_, index) => {
    const edge = Math.min(3, Math.floor(index / 40));
    const t = (index - edge * 40) / 40;
    if (edge === 0) return { x: -extent + t * extent * 2, z: -extent };
    if (edge === 1) return { x: extent, z: -extent + t * extent * 2 };
    if (edge === 2) return { x: extent - t * extent * 2, z: extent };
    return { x: -extent, z: extent - t * extent * 2 };
  });
  for (let i = 0; i < ring.length; i++) {
    const p = ring[i];
    points.push(p.x, elevation(p), p.z, p.x, -0.18, p.z);
    if (i < ring.length - 1) indices.push(i * 2, i * 2 + 1, i * 2 + 2, i * 2 + 1, i * 2 + 3, i * 2 + 2);
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(points, 3));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();
  return geometry;
}

export function Terrain(props: Props) {
  const host = useRef<HTMLDivElement>(null);
  const state = useRef(props);
  const invalidate = useRef<(() => void) | null>(null);
  useEffect(() => { state.current = props; invalidate.current?.(); }, [props]);

  useEffect(() => {
    const element = host.current;
    if (!element) return;
    let renderer: THREE.WebGLRenderer;
    try { renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'low-power' }); }
    catch { state.current.onUnavailable(); return; }
    renderer.setClearColor('#e5eaed', 0);
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.16;
    const canvas = renderer.domElement;
    canvas.style.width = '100%';
    canvas.style.height = '100%';
    canvas.style.display = 'block';
    canvas.setAttribute('aria-hidden', 'true');
    element.append(canvas);
    const scene = new THREE.Scene();
    const camera = new THREE.OrthographicCamera(-5, 5, 4, -4, 0.1, 50);
    const sculpture = new THREE.Group();
    scene.add(sculpture);
    scene.add(new THREE.HemisphereLight('#f5fff6', '#354561', 2));
    const key = new THREE.DirectionalLight('#fff1dc', 3.8);
    key.position.set(-4, 9, 3);
    const fill = new THREE.DirectionalLight('#9db9e9', 2.1);
    fill.position.set(6, 3, -4);
    scene.add(key, fill);
    const surfaceGeometry = makeSurface();
    const wallsGeometry = makeWalls();
    const surfaceMaterial = new THREE.MeshStandardMaterial({ vertexColors: true, metalness: 0.12, roughness: 0.66, side: THREE.DoubleSide });
    const wallsMaterial = new THREE.MeshStandardMaterial({ color: '#7290a1', metalness: 0.12, roughness: 0.8, side: THREE.DoubleSide });
    sculpture.add(new THREE.Mesh(surfaceGeometry, surfaceMaterial), new THREE.Mesh(wallsGeometry, wallsMaterial));
    const contourPoints = levels.flatMap(level => contours(level).flatMap(pair => pair.flatMap(p => [p.x, elevation(p) + 0.013, p.z])));
    const contourGeometry = new THREE.BufferGeometry();
    contourGeometry.setAttribute('position', new THREE.Float32BufferAttribute(contourPoints, 3));
    const contourMaterial = new THREE.LineBasicMaterial({ color: '#e6f0c0', transparent: true, opacity: 0.39 });
    sculpture.add(new THREE.LineSegments(contourGeometry, contourMaterial));
    const lineMaterial = new THREE.MeshBasicMaterial({ color: '#e5f467' });
    let pathGeometry = new THREE.TubeGeometry(new THREE.LineCurve3(new THREE.Vector3(), new THREE.Vector3(0, 0.001, 0)), 1, 0.025, 7, false);
    const path = new THREE.Mesh(pathGeometry, lineMaterial);
    sculpture.add(path);
    const nodeGeometry = new THREE.SphereGeometry(0.105, 22, 15);
    const nodeMaterial = new THREE.MeshStandardMaterial({ color: '#fa8c48', roughness: 0.27, metalness: 0.18, emissive: '#9c3a0c', emissiveIntensity: 0.2 });
    const node = new THREE.Mesh(nodeGeometry, nodeMaterial);
    sculpture.add(node);
    const stemGeometry = new THREE.CylinderGeometry(0.012, 0.012, 1, 8);
    stemGeometry.translate(0, 0.5, 0);
    const contactGeometry = new THREE.TorusGeometry(0.10, 0.012, 7, 26);
    const stemMaterial = new THREE.MeshBasicMaterial({ color: '#f8bc70' });
    const stem = new THREE.Mesh(stemGeometry, stemMaterial);
    const contact = new THREE.Mesh(contactGeometry, stemMaterial);
    sculpture.add(stem, contact);
    const surfaceNormal = new THREE.Vector3();
    const ringNormal = new THREE.Vector3(0, 0, 1);
    const startGeometry = new THREE.SphereGeometry(0.055, 12, 8);
    const startMaterial = new THREE.MeshBasicMaterial({ color: '#fff5d2' });
    const origin = new THREE.Mesh(startGeometry, startMaterial);
    sculpture.add(origin);
    let renderedHistory: Position[] | null = null;
    let visible = true;
    let frame = 0;
    let lost = false;
    let ready = false;

    function request() {
      if (!frame && visible && !document.hidden && !lost) frame = requestAnimationFrame(draw);
    }
    function resize() {
      const { width, height } = element!.getBoundingClientRect();
      if (!width || !height) return;
      const aspect = width / height;
      const viewWidth = Math.max(9.1, 7.7 * aspect);
      camera.left = -viewWidth / 2;
      camera.right = viewWidth / 2;
      camera.top = viewWidth / aspect * 0.62;
      camera.bottom = -viewWidth / aspect * 0.38;
      camera.updateProjectionMatrix();
      renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.7));
      renderer.setSize(width, height, false);
      request();
    }
    function draw() {
      frame = 0;
      if (lost || !visible || document.hidden) return;
      const { history, angle, view } = state.current;
      if (view === 'contours') { camera.position.set(0, 14, 0.001); camera.lookAt(0, 0, 0); }
      else { camera.position.set(8, 12, 10); camera.lookAt(0, 0.9, 0); }
      sculpture.rotation.y = angle * Math.PI / 180;
      const point = history.at(-1)!;
      const height = elevation(point);
      node.position.set(point.x, height + 0.36, point.z);
      stem.position.set(point.x, height + 0.015, point.z);
      stem.scale.y = 0.345;
      contact.position.set(point.x, height + 0.024, point.z);
      const slope = derivative(point);
      surfaceNormal.set(-slope.x * 0.42, 1, -slope.z * 0.42).normalize();
      contact.quaternion.setFromUnitVectors(ringNormal, surfaceNormal);
      origin.position.set(history[0].x, elevation(history[0]) + 0.06, history[0].z);
      if (renderedHistory !== history) {
        pathGeometry.dispose();
        if (history.length > 1) {
          const points = history.map(point => new THREE.Vector3(point.x, elevation(point) + 0.065, point.z));
          pathGeometry = new THREE.TubeGeometry(new THREE.CatmullRomCurve3(points, false, 'centripetal'), Math.max(24, points.length * 4), 0.023, 7, false);
          path.geometry = pathGeometry;
          path.visible = true;
        } else path.visible = false;
        renderedHistory = history;
      }
      try { renderer.render(scene, camera); }
      catch { lost = true; state.current.onUnavailable(); return; }
      if (!ready) { ready = true; state.current.onReady(); }
    }
    function visibilityChanged() {
      if (document.hidden && frame) { cancelAnimationFrame(frame); frame = 0; }
      else request();
    }
    function contextLost(event: Event) {
      event.preventDefault();
      lost = true;
      state.current.onUnavailable();
    }
    const resizeObserver = new ResizeObserver(resize);
    const intersection = new IntersectionObserver(([entry]) => { visible = entry.isIntersecting; if (visible) request(); });
    resizeObserver.observe(element);
    intersection.observe(element);
    document.addEventListener('visibilitychange', visibilityChanged);
    canvas.addEventListener('webglcontextlost', contextLost);
    invalidate.current = request;
    resize();
    return () => {
      if (frame) cancelAnimationFrame(frame);
      invalidate.current = null;
      resizeObserver.disconnect();
      intersection.disconnect();
      document.removeEventListener('visibilitychange', visibilityChanged);
      canvas.removeEventListener('webglcontextlost', contextLost);
      for (const geometry of [surfaceGeometry, wallsGeometry, contourGeometry, pathGeometry, nodeGeometry, stemGeometry, contactGeometry, startGeometry]) geometry.dispose();
      for (const material of [surfaceMaterial, wallsMaterial, contourMaterial, lineMaterial, nodeMaterial, stemMaterial, startMaterial]) material.dispose();
      renderer.dispose();
      renderer.forceContextLoss();
      canvas.remove();
    };
  }, []);
  return <div className="grd-webgl" ref={host} aria-hidden="true" />;
}

export default Terrain;
