'use client';

import { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { createFoldGeometry, poseRibbon, type SiteMarker } from './foldGeometry';

export type FoldSceneProps = {
  mode: 'structure' | 'sequence' | 'surface';
  angle: number;
  active: number;
  count: number;
  onSelect: (index: number) => void;
  onReady: () => void;
  onUnavailable: () => void;
};

function lightRig(scene: THREE.Scene) {
  scene.add(new THREE.HemisphereLight('#f7c4ad', '#482032', 1.75));
  const lights = [
    new THREE.DirectionalLight('#fff3d5', 3.6),
    new THREE.DirectionalLight('#eea48d', 1.70),
    new THREE.DirectionalLight('#d17b98', 2.45),
    new THREE.DirectionalLight('#fedbc3', 0.9),
  ];
  lights[0].position.set(-4, 5, 7);
  lights[1].position.set(5, 0.2, 2);
  lights[2].position.set(1, 3, -4);
  lights[3].position.set(-3, -3, 1);
  scene.add(...lights);
}

export function FoldScene(props: FoldSceneProps) {
  const host = useRef<HTMLDivElement>(null);
  const current = useRef(props);
  const invalidate = useRef<(() => void) | null>(null);

  useEffect(() => {
    current.current = props;
    invalidate.current?.();
  }, [props]);

  useEffect(() => {
    const element = host.current;
    if (!element) return;

    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true, powerPreference: 'low-power' });
    } catch {
      current.current.onUnavailable();
      return;
    }

    renderer.setClearColor(0x000000, 0);
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.14;
    const canvas = renderer.domElement;
    canvas.setAttribute('aria-hidden', 'true');
    canvas.style.display = 'block';
    canvas.style.width = '100%';
    canvas.style.height = '100%';
    canvas.style.touchAction = 'pan-y';
    element.append(canvas);

    const scene = new THREE.Scene();
    const camera = new THREE.OrthographicCamera(-5, 5, 3, -3, 0.1, 45);
    const sculpture = new THREE.Group();
    scene.add(sculpture);
    lightRig(scene);

    const { parts, beads, markers } = createFoldGeometry();
    const alloy = new THREE.MeshPhysicalMaterial({
      vertexColors: true, color: '#fff0e4', roughness: 0.33, metalness: 0.18, clearcoat: 0.40,
      clearcoatRoughness: 0.37, specularIntensity: 1.12,
    });
    const ribbon = new THREE.Group();
    for (const part of parts) {
      const mesh = new THREE.Mesh(part.geometry, alloy);
      mesh.frustumCulled = false;
      ribbon.add(mesh);
    }
    sculpture.add(ribbon);

    const atomGeometry = new THREE.SphereGeometry(1, 12, 10);
    const atomMaterial = new THREE.MeshPhysicalMaterial({ color: '#fff1db', roughness: 0.33, metalness: 0.12, clearcoat: 0.36 });
    const atoms = new THREE.InstancedMesh(atomGeometry, atomMaterial, beads.length);
    atoms.frustumCulled = false;
    atoms.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
    beads.forEach((bead, i) => atoms.setColorAt(i, bead.color));
    sculpture.add(atoms);

    const pinGeometry = new THREE.SphereGeometry(0.135, 14, 10);
    const ringGeometry = new THREE.TorusGeometry(0.215, 0.012, 7, 34);
    const pins = new THREE.Group();
    sculpture.add(pins);
    const pinMaterial = new THREE.MeshBasicMaterial({ color: '#ffd3b2', depthTest: false, depthWrite: false });
    const activeMaterial = new THREE.MeshBasicMaterial({ color: '#fff3d3', depthTest: false, depthWrite: false });
    const ringMaterial = new THREE.MeshBasicMaterial({ color: '#f5b18e', transparent: true, opacity: 0.77, depthTest: false, depthWrite: false });
    const activeRing = new THREE.MeshBasicMaterial({ color: '#ffe4bb', transparent: true, opacity: 0.95, depthTest: false, depthWrite: false });
    type Pin = { group: THREE.Group; ball: THREE.Mesh; ring: THREE.Mesh; at: SiteMarker };
    let pinList: Pin[] = [];

    function updatePins(count: number) {
      pins.clear();
      pinList = markers(count).map(at => {
        const group = new THREE.Group();
        const ball = new THREE.Mesh(pinGeometry, pinMaterial);
        const ring = new THREE.Mesh(ringGeometry, ringMaterial);
        ball.renderOrder = 9;
        ring.renderOrder = 10;
        group.add(ball, ring);
        pins.add(group);
        return { group, ball, ring, at };
      });
    }

    const media = window.matchMedia('(prefers-reduced-motion: reduce)');
    const finePointer = window.matchMedia('(hover: hover) and (pointer: fine)');
    const mouse = new THREE.Vector2();
    const ray = new THREE.Raycaster();
    const point = new THREE.Vector2();
    const matrix = new THREE.Matrix4();
    const inverse = new THREE.Quaternion();
    let width = 0;
    let height = 0;
    let seen = true;
    let lost = false;
    let ready = false;
    let frame = 0;
    let clock = 0;
    let linear = current.current.mode === 'sequence' ? 1 : 0;
    let volume = current.current.mode === 'surface' ? 1 : 0;
    let angle = THREE.MathUtils.degToRad(current.current.angle);
    let dragX = 0;
    let dragY = 0;
    let appliedLinear = -1;
    let appliedVolume = -1;

    const settle = (from: number, to: number, mix: number) => Math.abs(from - to) < 0.001 ? to : THREE.MathUtils.lerp(from, to, mix);

    function request() {
      if (!frame && !lost && seen && !document.hidden && width > 0 && height > 0) frame = requestAnimationFrame(draw);
    }

    function updateCamera() {
      const box = element!.getBoundingClientRect();
      width = box.width;
      height = box.height;
      if (!width || !height) return;
      const wide = width >= 900;
      const availableWidth = width * (wide ? 0.68 : 0.96);
      const scale = Math.min(availableWidth / 9.1, height * 0.86 / 5.5);
      const shift = wide ? width * 0.145 / scale : 0;
      const rtl = getComputedStyle(element!).direction === 'rtl';
      camera.position.set(rtl ? shift : -shift, 0.13, 17);
      camera.left = -width / scale / 2;
      camera.right = width / scale / 2;
      camera.top = height / scale / 2;
      camera.bottom = -height / scale / 2;
      camera.updateProjectionMatrix();
      renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.7));
      renderer.setSize(width, height, false);
      request();
    }

    function stop() {
      if (frame) cancelAnimationFrame(frame);
      frame = 0;
      clock = 0;
    }

    function reportUnavailable() {
      if (lost) return;
      lost = true;
      stop();
      current.current.onUnavailable();
    }

    function draw(now: number) {
      frame = 0;
      if (lost || !seen || document.hidden) return;
      const state = current.current;
      const dt = clock ? Math.min((now - clock) / 1000, 0.043) : 1 / 60;
      clock = now;
      const snap = media.matches;
      const mix = snap ? 1 : 1 - Math.exp(-dt * 9.4);
      const linearTarget = state.mode === 'sequence' ? 1 : 0;
      const volumeTarget = state.mode === 'surface' ? 1 : 0;
      const angleTarget = THREE.MathUtils.degToRad(state.angle);
      const xTarget = snap ? 0 : mouse.x;
      const yTarget = snap ? 0 : mouse.y;
      linear = settle(linear, linearTarget, mix);
      volume = settle(volume, volumeTarget, mix);
      angle = settle(angle, angleTarget, mix);
      dragX = settle(dragX, xTarget, mix);
      dragY = settle(dragY, yTarget, mix);

      sculpture.rotation.set(-0.09 + dragY * 0.10, angle + 0.12 * (1 - linear) + dragX * 0.15, -0.12 * (1 - linear));
      if (appliedLinear !== linear) {
        for (const part of parts) poseRibbon(part, linear);
        appliedLinear = linear;
      }
      ribbon.visible = volume < 0.998;
      atoms.visible = volume > 0.003;
      if (appliedVolume !== volume && atoms.visible) {
        for (let i = 0; i < beads.length; i++) {
          const bead = beads[i];
          matrix.makeScale(bead.radius * volume, bead.radius * volume, bead.radius * volume);
          matrix.setPosition(bead.position);
          atoms.setMatrixAt(i, matrix);
        }
        atoms.instanceMatrix.needsUpdate = true;
        appliedVolume = volume;
      }

      if (pinList.length !== state.count) updatePins(state.count);
      inverse.copy(sculpture.quaternion).invert();
      for (let i = 0; i < pinList.length; i++) {
        const { group, ball, ring, at } = pinList[i];
        group.position.copy(at.structure).lerp(at.sequence, linear);
        group.quaternion.copy(inverse);
        group.scale.setScalar(i === state.active ? 1.27 : 0.90);
        ball.material = i === state.active ? activeMaterial : pinMaterial;
        ring.material = i === state.active ? activeRing : ringMaterial;
      }

      try {
        renderer.render(scene, camera);
      } catch {
        reportUnavailable();
        return;
      }
      if (!ready) {
        ready = true;
        current.current.onReady();
      }
      const moving = linear !== linearTarget || volume !== volumeTarget || angle !== angleTarget || dragX !== xTarget || dragY !== yTarget;
      if (moving) request();
      else clock = 0;
    }

    function pick(event: PointerEvent) {
      const bounds = canvas.getBoundingClientRect();
      point.set((event.clientX - bounds.left) / bounds.width * 2 - 1, 1 - (event.clientY - bounds.top) / bounds.height * 2);
      ray.setFromCamera(point, camera);
      const hits = ray.intersectObjects(pinList.map(pin => pin.ball), false);
      return hits.length ? pinList.findIndex(pin => pin.ball === hits[0].object) : -1;
    }

    function hover(event: PointerEvent) {
      if (!finePointer.matches) return;
      if (ready) canvas.style.cursor = pick(event) >= 0 ? 'pointer' : '';
      const bounds = canvas.getBoundingClientRect();
      mouse.set((event.clientX - bounds.left) / bounds.width * 2 - 1, (event.clientY - bounds.top) / bounds.height * 2 - 1);
      request();
    }

    function leave() {
      mouse.set(0, 0);
      canvas.style.cursor = '';
      request();
    }

    function select(event: PointerEvent) {
      if (!ready || lost || event.button !== 0) return;
      const index = pick(event);
      if (index >= 0) current.current.onSelect(index);
    }

    function contextLost(event: Event) {
      event.preventDefault();
      reportUnavailable();
    }

    function contextRestored() {
      lost = false;
      ready = false;
      request();
    }

    const resize = new ResizeObserver(updateCamera);
    const visibility = new IntersectionObserver(([entry]) => {
      seen = entry.isIntersecting;
      if (seen) request();
      else stop();
    });
    function visibilityChanged() {
      if (document.hidden) stop();
      else request();
    }

    resize.observe(element);
    visibility.observe(element);
    media.addEventListener('change', request);
    document.addEventListener('visibilitychange', visibilityChanged);
    canvas.addEventListener('pointermove', hover);
    canvas.addEventListener('pointerleave', leave);
    canvas.addEventListener('pointerup', select);
    canvas.addEventListener('webglcontextlost', contextLost);
    canvas.addEventListener('webglcontextrestored', contextRestored);
    invalidate.current = request;
    updateCamera();

    return () => {
      stop();
      invalidate.current = null;
      resize.disconnect();
      visibility.disconnect();
      media.removeEventListener('change', request);
      document.removeEventListener('visibilitychange', visibilityChanged);
      canvas.removeEventListener('pointermove', hover);
      canvas.removeEventListener('pointerleave', leave);
      canvas.removeEventListener('pointerup', select);
      canvas.removeEventListener('webglcontextlost', contextLost);
      canvas.removeEventListener('webglcontextrestored', contextRestored);
      for (const part of parts) part.geometry.dispose();
      for (const resource of [alloy, atomGeometry, atomMaterial, pinGeometry, ringGeometry, pinMaterial, activeMaterial, ringMaterial, activeRing]) resource.dispose();
      atoms.dispose();
      renderer.dispose();
      renderer.forceContextLoss();
      canvas.remove();
    };
  }, []);

  return <div ref={host} aria-hidden="true" style={{ position: 'absolute', inset: 0 }} />;
}

export default FoldScene;
