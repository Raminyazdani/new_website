'use client';

import { useEffect, useLayoutEffect, useMemo, useRef, useState, type PointerEvent as RPointerEvent } from 'react';
import { forceCollide, forceLink, forceManyBody, forceSimulation, forceX, forceY, type SimulationLinkDatum, type SimulationNodeDatum } from 'd3';
import { AnimatePresence, motion } from 'motion/react';
import { useTranslations } from 'next-intl';
import { ArrowLeft } from 'lucide-react';
import { fmtNum } from '@/lib/format';
import type { SiteData } from '@/lib/types';
import { cn } from '@/lib/utils';

interface MNode extends SimulationNodeDatum {
  id: string;
  type: 'domain' | 'item';
  domain: string;
  label: string;
  r: number;
  hue: number;
}
interface MLink extends SimulationLinkDatum<MNode> {
  kind: 'backbone' | 'bond';
}

const W = 860;
const H = 600;
const PER_DOMAIN = 7;
const clamp = (v: number, a: number, b: number) => Math.min(b, Math.max(a, v));
const atom = (hue: number, l: number, c: number) => `oklch(${l} ${c} ${hue})`;

/** Skills as a molecule: domains are atoms on a ring backbone, tools are bonded to them (d3-force). */
export default function Molecule({ data }: { data: SiteData }) {
  const t = useTranslations();
  const loc = data.locale;
  const [mounted, setMounted] = useState(false);
  const [focus, setFocus] = useState<string | null>(null);
  const [hover, setHover] = useState<string | null>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const nodeEls = useRef(new Map<string, SVGGElement>());
  const linkEls = useRef<(SVGLineElement | null)[]>([]);
  const labelEls = useRef(new Map<string, SVGTextElement>());
  const drag = useRef<{ id: string; moved: boolean; x: number; y: number } | null>(null);
  const simRef = useRef<ReturnType<typeof forceSimulation<MNode, MLink>> | null>(null);

  const { nodes, links } = useMemo(() => {
    const nodes: MNode[] = [];
    const links: MLink[] = [];
    const doms = data.domains;
    doms.forEach((d, i) => {
      const a = (i / doms.length) * Math.PI * 2 - Math.PI / 2;
      nodes.push({ id: d.id, type: 'domain', domain: d.id, label: d.id, r: 17 + Math.sqrt(d.count) * 3, hue: d.hue, x: W / 2 + Math.cos(a) * 250, y: H / 2 + Math.sin(a) * 190 });
      d.items.slice(0, PER_DOMAIN).forEach((it, j) => {
        const b = a + (j - (PER_DOMAIN - 1) / 2) * 0.3;
        const id = `${d.id}:${it.key}`;
        nodes.push({ id, type: 'item', domain: d.id, label: it.name, r: 5.5, hue: d.hue, x: W / 2 + Math.cos(b) * 320, y: H / 2 + Math.sin(b) * 250 });
        links.push({ source: d.id, target: id, kind: 'bond' });
      });
    });
    doms.forEach((d, i) => links.push({ source: d.id, target: doms[(i + 1) % doms.length].id, kind: 'backbone' }));
    return { nodes, links };
  }, [data.domains]);

  // the graph is purely client-side (layout depends on a live simulation)
  useEffect(() => setMounted(true), []);

  // layout effect: settle and draw before the first paint of the SVG
  useLayoutEffect(() => {
    if (!mounted) return;
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const sim = forceSimulation<MNode, MLink>(nodes)
      .force(
        'link',
        forceLink<MNode, MLink>(links)
          .id((d) => d.id)
          .distance((l) => (l.kind === 'backbone' ? 150 : (l.source as MNode).r + 30))
          .strength((l) => (l.kind === 'backbone' ? 0.3 : 0.85)),
      )
      .force('charge', forceManyBody<MNode>().strength((d) => (d.type === 'domain' ? -560 : -42)))
      .force('collide', forceCollide<MNode>((d) => d.r + (d.type === 'domain' ? 12 : 3)))
      .force('x', forceX<MNode>(W / 2).strength(0.045))
      .force('y', forceY<MNode>(H / 2).strength(0.075))
      .stop();
    for (let i = 0; i < 280; i++) sim.tick();

    const draw = () => {
      for (const n of nodes) {
        n.x = clamp(n.x ?? 0, n.r + 6, W - n.r - 6);
        n.y = clamp(n.y ?? 0, n.r + 6, H - n.r - 22);
        const tr = `translate(${n.x.toFixed(1)} ${n.y.toFixed(1)})`;
        nodeEls.current.get(n.id)?.setAttribute('transform', tr);
        labelEls.current.get(n.id)?.setAttribute('transform', tr);
      }
      links.forEach((l, i) => {
        const el = linkEls.current[i];
        const s = l.source as MNode;
        const g = l.target as MNode;
        if (!el) return;
        el.setAttribute('x1', (s.x ?? 0).toFixed(1));
        el.setAttribute('y1', (s.y ?? 0).toFixed(1));
        el.setAttribute('x2', (g.x ?? 0).toFixed(1));
        el.setAttribute('y2', (g.y ?? 0).toFixed(1));
      });
    };
    draw();

    // gentle thermal motion while the molecule is on screen
    if (!reduce) {
      sim.force('thermal', () => {
        for (const n of nodes) {
          if (n.fx != null) continue;
          n.vx = (n.vx ?? 0) + (Math.random() - 0.5) * (n.type === 'domain' ? 0.25 : 0.5);
          n.vy = (n.vy ?? 0) + (Math.random() - 0.5) * (n.type === 'domain' ? 0.25 : 0.5);
        }
      });
    }
    sim.alpha(0.05).alphaTarget(reduce ? 0 : 0.015).on('tick', draw);
    simRef.current = sim;

    const io = new IntersectionObserver(([e]) => (e.isIntersecting && !reduce ? sim.restart() : sim.stop()), { threshold: 0.05 });
    if (svgRef.current) io.observe(svgRef.current);
    return () => {
      io.disconnect();
      sim.stop();
      simRef.current = null;
    };
  }, [mounted, nodes, links]);

  const toSvg = (e: RPointerEvent) => {
    const svg = svgRef.current;
    const m = svg?.getScreenCTM();
    if (!svg || !m) return { x: 0, y: 0 };
    const p = new DOMPoint(e.clientX, e.clientY).matrixTransform(m.inverse());
    return { x: p.x, y: p.y };
  };

  const onDown = (e: RPointerEvent, n: MNode) => {
    const p = toSvg(e);
    drag.current = { id: n.id, moved: false, x: p.x, y: p.y };
    n.fx = n.x;
    n.fy = n.y;
    svgRef.current?.setPointerCapture(e.pointerId);
    simRef.current?.alphaTarget(0.25).restart();
  };
  const onMove = (e: RPointerEvent) => {
    const d = drag.current;
    if (!d) return;
    const p = toSvg(e);
    if (Math.hypot(p.x - d.x, p.y - d.y) > 4) d.moved = true;
    const n = nodes.find((x) => x.id === d.id);
    if (n) {
      n.fx = clamp(p.x, n.r, W - n.r);
      n.fy = clamp(p.y, n.r, H - n.r);
    }
  };
  const onUp = () => {
    const d = drag.current;
    drag.current = null;
    if (!d) return;
    const n = nodes.find((x) => x.id === d.id);
    if (n) {
      n.fx = null;
      n.fy = null;
      if (!d.moved) setFocus((f) => (f === n.domain ? null : n.domain));
    }
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    simRef.current?.alphaTarget(reduce ? 0 : 0.015);
  };

  const lit = focus ?? hover;
  const focused = data.domains.find((d) => d.id === focus);

  return (
    <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1.65fr)_minmax(0,1fr)]">
      <div className="glass relative overflow-hidden rounded-[32px]">
        <p className="absolute start-5 top-4 z-10 text-xs text-[var(--o-muted)]">{t('organic.moleculeHint')}</p>
        {mounted ? (
          <svg
            ref={svgRef}
            viewBox={`0 0 ${W} ${H}`}
            className="h-auto w-full touch-none select-none"
            role="img"
            aria-label={t('organic.moleculeTitle')}
            onPointerMove={onMove}
            onPointerUp={onUp}
            onPointerCancel={onUp}
          >
            <defs>
              {data.domains.map((d) => (
                <radialGradient key={d.id} id={`atom-${d.id}`} cx="35%" cy="30%" r="75%">
                  <stop offset="0%" stopColor={atom(d.hue, 0.97, 0.03)} />
                  <stop offset="55%" stopColor={atom(d.hue, 0.84, 0.09)} />
                  <stop offset="100%" stopColor={atom(d.hue, 0.68, 0.12)} />
                </radialGradient>
              ))}
            </defs>
            <g>
              {links.map((l, i) => {
                const s = l.source as MNode | string;
                const sid = typeof s === 'string' ? s : s.id;
                const tg = l.target as MNode | string;
                const tid = typeof tg === 'string' ? tg : tg.id;
                const dom = sid.split(':')[0];
                const hue = data.domains.find((d) => d.id === dom)?.hue ?? 180;
                const dim = lit && !(sid === lit || tid.startsWith(`${lit}:`) || tid === lit);
                return (
                  <line
                    key={`${sid}-${tid}`}
                    ref={(el) => {
                      linkEls.current[i] = el;
                    }}
                    stroke={l.kind === 'backbone' ? 'rgb(16 32 27 / 0.16)' : atom(hue, 0.72, 0.08)}
                    strokeWidth={l.kind === 'backbone' ? 4 : 1.6}
                    strokeLinecap="round"
                    className="transition-opacity duration-300"
                    opacity={dim ? 0.18 : 1}
                  />
                );
              })}
            </g>
            <g>
              {nodes.map((n) => {
                const dim = lit && n.domain !== lit;
                return (
                  <g
                    key={n.id}
                    ref={(el) => {
                      if (el) nodeEls.current.set(n.id, el);
                      else nodeEls.current.delete(n.id);
                    }}
                    className={cn('cursor-grab transition-opacity duration-300 active:cursor-grabbing', dim && 'opacity-25')}
                    onPointerDown={(e) => onDown(e, n)}
                    onPointerEnter={() => n.type === 'domain' && setHover(n.domain)}
                    onPointerLeave={() => setHover(null)}
                  >
                    {n.type === 'domain' ? (
                      <>
                        <circle r={n.r + 7} fill={atom(n.hue, 0.85, 0.08)} opacity={focus === n.id ? 0.55 : 0.22} />
                        <circle r={n.r} fill={`url(#atom-${n.domain})`} stroke={atom(n.hue, 0.55, 0.12)} strokeWidth={1.5} />
                        <circle r={n.r * 0.28} cx={-n.r * 0.32} cy={-n.r * 0.36} fill="#fff" opacity={0.55} />
                      </>
                    ) : (
                      <>
                        <circle r={n.r} fill={atom(n.hue, 0.9, 0.06)} stroke={atom(n.hue, 0.6, 0.11)} strokeWidth={1.4} />
                      </>
                    )}
                  </g>
                );
              })}
            </g>
            {/* labels on top of every atom and bond */}
            <g className="pointer-events-none">
              {nodes
                .filter((n) => n.type === 'domain' || n.domain === lit)
                .map((n) => (
                  <text
                    key={n.id}
                    ref={(el) => {
                      if (!el) return void labelEls.current.delete(n.id);
                      labelEls.current.set(n.id, el);
                      el.setAttribute('transform', `translate(${(n.x ?? 0).toFixed(1)} ${(n.y ?? 0).toFixed(1)})`);
                    }}
                    x={n.type === 'domain' ? 0 : n.r + 5}
                    y={n.type === 'domain' ? n.r + 18 : 4}
                    textAnchor={n.type === 'domain' ? 'middle' : 'start'}
                    className={cn('fill-[var(--o-ink)] transition-opacity duration-300', n.type === 'domain' ? 'text-[13px] font-semibold' : 'text-[11.5px]', lit && n.domain !== lit && 'opacity-30')}
                    style={{ paintOrder: 'stroke', stroke: 'rgb(251 250 246 / 0.92)', strokeWidth: 4, strokeLinejoin: 'round' }}
                  >
                    {n.type === 'domain' ? t(`domains.${n.domain}`) : n.label}
                  </text>
                ))}
            </g>
          </svg>
        ) : (
          <div style={{ aspectRatio: `${W} / ${H}` }} />
        )}
      </div>

      <div className="glass-strong rounded-[32px] p-6 sm:p-7">
        <AnimatePresence mode="wait" initial={false}>
          {focused ? (
            <motion.div key={focused.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.25 }}>
              <button type="button" onClick={() => setFocus(null)} className="mb-5 inline-flex items-center gap-1.5 text-sm text-[var(--o-muted)] hover:text-[var(--o-ink)]">
                <ArrowLeft className="flip-rtl size-4" /> {t('organic.moleculeAll')}
              </button>
              <p className="flex items-center gap-3">
                <span className="size-4 rounded-full" style={{ background: atom(focused.hue, 0.78, 0.11) }} />
                <span className="text-sm text-[var(--o-muted)]">{t('organic.skillsCount', { count: focused.count })}</span>
              </p>
              <h3 className="font-display mt-2 text-4xl leading-tight">{t(`domains.${focused.id}`)}</h3>
              <p className="mt-3 text-sm text-[var(--o-muted)]">{focused.groupLabels.join(' · ')}</p>
              <div className="mt-5 flex flex-wrap gap-1.5">
                {focused.items.map((it) => (
                  <span key={it.key} className="rounded-full border border-white/80 px-3 py-1 text-[13px]" style={{ background: atom(focused.hue, 0.95, 0.035) }} title={it.long}>
                    <bdi>{it.name}</bdi>
                  </span>
                ))}
              </div>
            </motion.div>
          ) : (
            <motion.ul key="all" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.25 }} className="space-y-1">
              {data.domains.map((d) => (
                <li key={d.id}>
                  <button
                    type="button"
                    onClick={() => setFocus(d.id)}
                    onPointerEnter={() => setHover(d.id)}
                    onPointerLeave={() => setHover(null)}
                    className="flex w-full items-center gap-3 rounded-2xl px-3 py-2 text-start text-sm transition hover:bg-white/70"
                  >
                    <span className="size-3.5 shrink-0 rounded-full ring-1 ring-black/5" style={{ background: atom(d.hue, 0.78, 0.11) }} />
                    <span className="flex-1">{t(`domains.${d.id}`)}</span>
                    <span className="tabular-nums text-[var(--o-muted)]">{fmtNum(loc, d.count)}</span>
                  </button>
                </li>
              ))}
            </motion.ul>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
