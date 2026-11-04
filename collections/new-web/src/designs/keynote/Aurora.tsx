'use client';

import { useEffect, useRef } from 'react';

/*
 * Aurora — a soft noise-driven light band (own OGL shader, in the spirit of React Bits' Aurora).
 * Renders at half resolution and ~20 fps, pauses when off-screen, hidden or `paused`, draws a single
 * still frame under reduced motion, and leaves a CSS gradient underneath when WebGL is unavailable.
 */
const VERT = `attribute vec2 position; void main(){ gl_Position = vec4(position, 0.0, 1.0); }`;
const FRAG = `
precision highp float;
uniform float uTime;
uniform vec2 uRes;
uniform vec3 uC0;
uniform vec3 uC1;
uniform vec3 uC2;
vec3 permute(vec3 x){ return mod(((x*34.0)+1.0)*x, 289.0); }
float snoise(vec2 v){
  const vec4 C = vec4(0.211324865405187, 0.366025403784439, -0.577350269189626, 0.024390243902439);
  vec2 i = floor(v + dot(v, C.yy));
  vec2 x0 = v - i + dot(i, C.xx);
  vec2 i1 = (x0.x > x0.y) ? vec2(1.0, 0.0) : vec2(0.0, 1.0);
  vec4 x12 = x0.xyxy + C.xxzz;
  x12.xy -= i1;
  i = mod(i, 289.0);
  vec3 p = permute(permute(i.y + vec3(0.0, i1.y, 1.0)) + i.x + vec3(0.0, i1.x, 1.0));
  vec3 m = max(0.5 - vec3(dot(x0,x0), dot(x12.xy,x12.xy), dot(x12.zw,x12.zw)), 0.0);
  m = m*m; m = m*m;
  vec3 x = 2.0 * fract(p * C.www) - 1.0;
  vec3 h = abs(x) - 0.5;
  vec3 ox = floor(x + 0.5);
  vec3 a0 = x - ox;
  m *= 1.79284291400159 - 0.85373472095314 * (a0*a0 + h*h);
  vec3 g;
  g.x = a0.x * x0.x + h.x * x0.y;
  g.yz = a0.yz * x12.xz + h.yz * x12.yw;
  return 130.0 * dot(m, g);
}
void main(){
  vec2 uv = gl_FragCoord.xy / uRes;
  vec3 ramp = uv.x < 0.5 ? mix(uC0, uC1, uv.x * 2.0) : mix(uC1, uC2, (uv.x - 0.5) * 2.0);
  float h = snoise(vec2(uv.x * 1.6 + uTime * 0.06, uTime * 0.18)) * 0.55;
  h = exp(h);
  h = (uv.y * 2.0 - h + 0.25);
  float intensity = 0.62 * h;
  float a = smoothstep(0.0, 0.9, intensity) * (1.0 - smoothstep(0.75, 1.05, uv.y));
  gl_FragColor = vec4(intensity * ramp * a, a);
}`;

const hex = (h: string) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16) / 255) as [number, number, number];

const DEFAULT: [string, string, string] = ['#8b5cf6', '#22d3ee', '#8b5cf6'];

export function Aurora({ colors = DEFAULT, className, paused = false }: { colors?: [string, string, string]; className?: string; paused?: boolean }) {
  const box = useRef<HTMLDivElement>(null);
  const key = colors.join('|');
  const pausedRef = useRef(paused);
  const rerun = useRef<() => void>(() => {});
  useEffect(() => {
    const el = box.current;
    if (!el) return;
    let stop = () => {};
    let cancelled = false;
    (async () => {
      const { Renderer, Program, Mesh, Triangle } = await import('ogl');
      if (cancelled) return;
      let renderer: InstanceType<typeof Renderer>;
      try {
        renderer = new Renderer({ alpha: true, premultipliedAlpha: true, antialias: false, dpr: 0.5 });
      } catch {
        return; // no WebGL: the CSS gradient underneath stays
      }
      const gl = renderer.gl;
      gl.clearColor(0, 0, 0, 0);
      gl.canvas.style.cssText = 'position:absolute;inset:0;width:100%;height:100%;display:block';
      el.appendChild(gl.canvas);
      const program = new Program(gl, {
        vertex: VERT,
        fragment: FRAG,
        uniforms: { uTime: { value: 0 }, uRes: { value: [1, 1] }, uC0: { value: hex(colors[0]) }, uC1: { value: hex(colors[1]) }, uC2: { value: hex(colors[2]) } },
        transparent: true,
      });
      const mesh = new Mesh(gl, { geometry: new Triangle(gl), program });
      const resize = () => {
        renderer.setSize(el.clientWidth, el.clientHeight);
        program.uniforms.uRes.value = [gl.drawingBufferWidth, gl.drawingBufferHeight];
      };
      resize();
      const ro = new ResizeObserver(() => {
        resize();
        draw();
      });
      ro.observe(el);
      const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      let raf = 0;
      let last = 0;
      let visible = true;
      const t0 = performance.now();
      const draw = () => {
        program.uniforms.uTime.value = reduced ? 12 : (performance.now() - t0) / 1000;
        renderer.render({ scene: mesh });
      };
      const loop = (now: number) => {
        raf = requestAnimationFrame(loop);
        if (now - last < 50) return; // ~20 fps
        last = now;
        draw();
      };
      const run = () => {
        cancelAnimationFrame(raf);
        if (!reduced && !pausedRef.current && visible && document.visibilityState === 'visible') raf = requestAnimationFrame(loop);
      };
      rerun.current = run;
      const io = new IntersectionObserver(([e]) => {
        visible = e.isIntersecting;
        run();
      });
      io.observe(el);
      const onVis = () => run();
      document.addEventListener('visibilitychange', onVis);
      draw();
      run();
      stop = () => {
        rerun.current = () => {};
        cancelAnimationFrame(raf);
        io.disconnect();
        ro.disconnect();
        document.removeEventListener('visibilitychange', onVis);
        gl.getExtension('WEBGL_lose_context')?.loseContext();
        gl.canvas.remove();
      };
    })();
    return () => {
      cancelled = true;
      stop();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);
  useEffect(() => {
    pausedRef.current = paused;
    rerun.current();
  }, [paused]);
  return <div ref={box} aria-hidden className={className} />;
}
