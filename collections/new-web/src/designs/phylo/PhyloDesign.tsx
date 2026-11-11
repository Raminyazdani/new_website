'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { hierarchy, tree } from 'd3';
import { ArrowDown, ArrowUpRight, GitBranch, RotateCcw, X } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { LocaleSwitcher } from '@/components/shared/LocaleSwitcher';
import { ProfilePhoto } from '@/components/shared/ProfilePhoto';
import { instrumentSerif } from '@/fonts/instrument';
import { manrope } from '@/fonts/manrope';
import { plexMono } from '@/fonts/plex';
import { fmtNum, seqNo } from '@/lib/format';
import type { SiteData } from '@/lib/types';
import { collectionLabels, makeSpecimens, matchesSpecimen, type Collection, type Specimen } from '../microcosm/specimen';
import './phylo.css';

const GROUPS: Collection[] = ['profile', 'roles', 'projects', 'papers', 'methods', 'education', 'courses', 'languages', 'journey', 'contact'];
const INK = ['#743d38', '#294d3e', '#4c6253', '#7a5847', '#646743', '#5b4c61', '#446361', '#87664b', '#596450', '#784747'];
const COPY = {
  en: { atlas: 'A tree of knowledge', note: 'A portfolio taxonomy, not an evolutionary tree.', radial: 'Radial', rect: 'Branching', index: 'Leaf index', reset: 'Reset tree', tip: 'Open a branch. Follow a leaf.', count: 'records', search: 'Find a record', field: 'Field notes', path: 'A path through the work', initial: 'Collections branch into their source records. Skills keep their original categories and groups.', inspect: 'Inspect collection', scroll: 'Pan the diagram to explore', no: 'No matching records.' },
  de: { atlas: 'Ein Baum des Wissens', note: 'Eine Portfolio-Taxonomie, kein evolutionärer Stammbaum.', radial: 'Radial', rect: 'Verzweigt', index: 'Blattregister', reset: 'Baum zurücksetzen', tip: 'Zweig öffnen. Blatt erkunden.', count: 'Einträge', search: 'Eintrag suchen', field: 'Feldnotizen', path: 'Ein Weg durch die Arbeit', initial: 'Sammlungen verzweigen in ihre Quelleinträge. Kenntnisse behalten ihre ursprünglichen Kategorien und Gruppen.', inspect: 'Sammlung ansehen', scroll: 'Diagramm verschieben und erkunden', no: 'Keine passenden Einträge.' },
  fa: { atlas: 'درخت دانش', note: 'دسته‌بندی پورتفولیو؛ نه یک درخت تکاملی.', radial: 'شعاعی', rect: 'شاخه‌ای', index: 'نمایهٔ برگ‌ها', reset: 'بازنشانی درخت', tip: 'شاخه‌ای باز کنید؛ برگی را دنبال کنید.', count: 'رکورد', search: 'جست‌وجوی رکورد', field: 'یادداشت‌های مسیر', path: 'مسیری در میان کارها', initial: 'شاخه‌های مجموعه به سوابق منبع می‌رسند. مهارت‌ها دسته‌ها و گروه‌های اصلی خود را حفظ می‌کنند.', inspect: 'مشاهدهٔ مجموعه', scroll: 'برای کاوش، نمودار را جابه‌جا کنید', no: 'رکوردی پیدا نشد.' },
};

interface Taxon { key: string; title: string; group: Collection; record?: string; children?: Taxon[]; count: number }

function LeafText({ record }: { record: Specimen }) {
  return <div className="py-leaf-text">
    {record.subtitle && <p className="py-source" dir="auto">{record.subtitle}</p>}
    {record.body.map((p, i) => <p key={i} dir="auto">{p}</p>)}
    {!!record.methods?.length && <ul className="py-tags">{record.methods.map((tag, i) => <li key={i} dir="auto">{tag}</li>)}</ul>}
    {!!record.facts?.length && <dl>{record.facts.map(([key, value], i) => <div key={i}><dt>{key}</dt><dd dir="auto">{value}</dd></div>)}</dl>}
    {!!record.links?.length && <div className="py-exits">{record.links.map(([title, href], i) => <a key={i} href={href} target={href.startsWith('mailto:') ? undefined : '_blank'} rel="noreferrer"><bdi>{title}</bdi><ArrowUpRight size={15} aria-hidden /></a>)}</div>}
    {record.citation && <details className="py-citation"><summary>BibTeX</summary><pre dir="ltr">{record.citation}</pre></details>}
  </div>;
}

export function PhyloDesign({ data }: { data: SiteData }) {
  const t = useTranslations();
  const l = COPY[data.locale];
  const records = useMemo(() => makeSpecimens(data, t), [data, t]);
  const label = (g: Collection) => t(collectionLabels[g]);
  const [expanded, setExpanded] = useState(new Set(['root', 'methods']));
  const [layout, setLayout] = useState<'radial' | 'rect'>('radial');
  const [focus, setFocus] = useState('methods');
  const [group, setGroup] = useState<Collection>('methods');
  const [only, setOnly] = useState<string | null>(null);
  const [query, setQuery] = useState('');
  const dialog = useRef<HTMLDialogElement>(null);
  const graphRegion = useRef<HTMLDivElement>(null);
  const allTaxa = useMemo((): Taxon => ({
    key: 'root', title: data.person.displayName, group: 'profile', count: GROUPS.reduce((n, g) => n + records[g].length, 0),
    children: GROUPS.map((g) => ({
      key: g, title: t(collectionLabels[g]), group: g, count: records[g].length,
      children: g === 'methods' ? data.skills.map((c) => ({
        key: `cat/${c.id}`, title: c.label, group: g, count: c.groups.reduce((n, x) => n + x.items.length, 0),
        children: c.groups.map((sg) => ({
          key: `sg/${c.id}/${sg.id}`, title: sg.label, group: g, count: sg.items.length,
          children: sg.items.map((item) => ({ key: `skill/${c.id}/${sg.id}/${item.key}`, title: item.name, group: g, record: `${c.id}/${sg.id}/${item.key}`, count: 1 })),
        })),
      })) : records[g].map((r) => ({ key: `${g}/${r.id}`, title: r.title, group: g, record: r.id, count: 1 })),
    })),
  }), [data, records, t]);

  const diagram = useMemo(() => {
    const root = hierarchy(allTaxa, (node) => expanded.has(node.key) ? node.children : undefined);
    const visible = root.descendants();
    const leaves = root.leaves().length;
    const height = layout === 'rect' ? Math.max(630, leaves * 32) : Math.max(690, Math.min(1160, leaves * 24));
    const width = layout === 'rect' ? 1040 : Math.max(1080, height * 1.34);
    tree<Taxon>().size(layout === 'radial' ? [Math.PI * 2, height * .36] : [height - 80, 730])(root);
    const positions = new Map(root.descendants().map((n) => {
      const x = n.x ?? 0;
      const y = n.y ?? 0;
      return [n.data.key, layout === 'radial' ? { x: width / 2 + Math.cos(x - Math.PI / 2) * y, y: height / 2 + Math.sin(x - Math.PI / 2) * y, angle: x } : { x: 35 + y, y: 40 + x, angle: 0 }];
    }));
    const active = root.descendants().find((n) => n.data.key === focus);
    const lineage = new Set(active?.ancestors().map((n) => n.data.key) ?? []);
    const bounds = root.descendants().map((node) => {
      const point = positions.get(node.data.key)!;
      const extent = node.depth === 0 ? 24 : Math.min(235, Math.max(65, Math.min(28, node.data.title.length) * 6.5 + (node.data.children?.length ? 48 : 18)));
      const left = point.angle > Math.PI;
      return {
        minX: point.x - (left ? extent : 22), maxX: point.x + (left ? 22 : extent),
        minY: point.y - 24, maxY: point.y + 24,
      };
    });
    const minX = Math.min(...bounds.map((b) => b.minX)) - 20;
    const maxX = Math.max(...bounds.map((b) => b.maxX)) + 20;
    const minY = Math.min(...bounds.map((b) => b.minY)) - 24;
    const maxY = Math.max(...bounds.map((b) => b.maxY)) + 24;
    const viewBox = layout === 'radial' ? `${minX} ${minY} ${maxX - minX} ${maxY - minY}` : `0 0 ${width} ${height}`;
    return { root, positions, width, height, visible, lineage, viewBox };
  }, [allTaxa, expanded, layout, focus]);

  function show(collection: Collection, recordId?: string) {
    setGroup(collection); setOnly(recordId ?? null); setQuery(''); dialog.current?.showModal();
  }
  function choose(node: Taxon) {
    setFocus(node.key); setGroup(node.group);
    if (node.record) show(node.group, node.record);
    else setExpanded((old) => { const next = new Set(old); if (next.has(node.key) && node.key !== 'root') next.delete(node.key); else next.add(node.key); return next; });
  }
  const found = records[group].filter((item) => (!only || item.id === only) && matchesSpecimen(item, query, data.locale));
  const activePath = diagram.root.descendants().find((n) => n.data.key === focus)?.ancestors().reverse() ?? [];
  const expandedCanvas = layout === 'rect' || diagram.visible.length > GROUPS.length + data.skills.length + 1;
  useEffect(() => {
    const region = graphRegion.current;
    if (!region) return;
    let frame = 0;
    const centerRoot = () => {
      const glyph = region.querySelector<SVGCircleElement>('.py-origin .py-node-core');
      if (!glyph) return;
      const bounds = region.getBoundingClientRect();
      const rootBounds = glyph.getBoundingClientRect();
      region.scrollBy({ left: rootBounds.left + rootBounds.width / 2 - bounds.left - bounds.width / 2, behavior: 'instant' });
    };
    const schedule = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(centerRoot);
    };
    const observer = new ResizeObserver(schedule);
    observer.observe(region);
    schedule();
    const settled = window.setTimeout(schedule, 700);
    return () => { observer.disconnect(); cancelAnimationFrame(frame); window.clearTimeout(settled); };
  }, [layout]);

  return <div className={`py-root ${instrumentSerif.variable} ${manrope.variable} ${plexMono.variable}`} dir={data.dir} id="py-top">
    <a href="#py-tree" className="py-skip">{t('nav.skip')}</a>
    <header className="py-header py-frame">
      <a href="#py-top" className="py-brand"><GitBranch size={20} strokeWidth={1.3} aria-hidden />phylo<span> / atlas</span></a>
      <nav aria-label={t('nav.menu')}><a href="#py-tree">{l.atlas}</a><a href="#py-notes">{l.field}</a></nav>
      <LocaleSwitcher className="py-locales" itemClassName="py-locale" activeClassName="py-locale-on" />
    </header>
    <main>
      <section className="py-title py-frame">
        <div><span className="py-micro">{l.atlas} / {seqNo(data.locale, 1)}</span><h1>{data.person.displayName}</h1></div>
        <p dir="auto">{data.person.headline}<span>{data.person.location}</span></p>
      </section>
      <section id="py-tree" className="py-map" aria-label={l.atlas}>
        <div className="py-map-top py-frame"><p>{l.tip}</p><div className="py-tools">
          <div role="group" aria-label={l.atlas}><button type="button" aria-pressed={layout === 'radial'} onClick={() => setLayout('radial')}>{l.radial}</button><button type="button" aria-pressed={layout === 'rect'} onClick={() => setLayout('rect')}>{l.rect}</button></div>
          <button type="button" onClick={() => { setExpanded(new Set(['root', 'methods'])); setFocus('methods'); }} aria-label={l.reset} title={l.reset}><RotateCcw size={17} aria-hidden /></button>
          <button type="button" className="py-index-button" onClick={() => show(group)}>{l.index}<ArrowUpRight size={16} aria-hidden /></button>
        </div></div>
        <div className="py-graph-scroll" ref={graphRegion} role="region" aria-label={l.scroll} tabIndex={0}>
          <svg viewBox={diagram.viewBox} preserveAspectRatio="xMidYMid meet" className="py-tree-svg" style={{ minWidth: expandedCanvas ? diagram.width : 810, width: expandedCanvas ? diagram.width : '100%', height: expandedCanvas ? diagram.height : '100%' }} aria-label={l.atlas}>
            {layout === 'radial' && <g className="py-growth-rings" aria-hidden>{[.12,.24,.36].map((r) => <circle key={r} cx={diagram.width / 2} cy={diagram.height / 2} r={diagram.height * r} />)}</g>}
            {diagram.root.links().map(({ source, target }) => {
              const a = diagram.positions.get(source.data.key)!;
              const b = diagram.positions.get(target.data.key)!;
              const mid = layout === 'rect' ? (a.x + b.x) / 2 : diagram.width / 2 + Math.cos(a.angle - Math.PI / 2) * ((source.y ?? 0) + (target.y ?? 0)) / 2;
              const cpY = layout === 'rect' ? a.y : diagram.height / 2 + Math.sin(a.angle - Math.PI / 2) * ((source.y ?? 0) + (target.y ?? 0)) / 2;
              const cpX2 = layout === 'rect' ? mid : diagram.width / 2 + Math.cos(b.angle - Math.PI / 2) * ((source.y ?? 0) + (target.y ?? 0)) / 2;
              const cpY2 = layout === 'rect' ? b.y : diagram.height / 2 + Math.sin(b.angle - Math.PI / 2) * ((source.y ?? 0) + (target.y ?? 0)) / 2;
              return <path key={target.data.key} d={`M${a.x} ${a.y}C${mid} ${cpY} ${cpX2} ${cpY2} ${b.x} ${b.y}`} fill="none" stroke={INK[GROUPS.indexOf(target.data.group)]} strokeWidth={diagram.lineage.has(target.data.key) ? 2.8 : source.depth === 0 ? 1.5 : 1} opacity={diagram.lineage.has(target.data.key) ? 1 : .58} className="py-tree-edge" />;
            })}
            {diagram.root.descendants().map((node) => {
              const position = diagram.positions.get(node.data.key)!;
              const isRoot = node.depth === 0;
              const left = layout === 'radial' && position.angle > Math.PI;
              const hasBranches = !!node.data.children?.length;
              const short = node.data.title.length > 28 ? node.data.title.slice(0,27) + '…' : node.data.title;
              return <g key={node.data.key} className={`py-tree-node ${isRoot ? 'py-origin' : ''} ${focus === node.data.key ? 'py-active' : ''}`} style={{ transform: `translate(${position.x}px,${position.y}px)`, '--py-branch': INK[GROUPS.indexOf(node.data.group)] } as React.CSSProperties}
                role="button" tabIndex={0} aria-label={`${node.data.title} · ${fmtNum(data.locale, node.data.count)}`} aria-expanded={hasBranches ? expanded.has(node.data.key) : undefined}
                onClick={() => choose(node.data)} onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); choose(node.data); } }}>
                <title>{node.data.title}</title><rect x={left ? -177 : -18} y="-22" width={isRoot ? 38 : 192} height="44" rx="3" fill="transparent" />
                <circle className="py-node-core" r={isRoot ? 13 : hasBranches ? 5 : 3.4} />
                {isRoot ? <text y="5" textAnchor="middle" className="py-root-glyph">✳</text> : <text x={left ? -12 : 12} y="4" textAnchor={left ? 'end' : 'start'} direction={data.dir}>{short}<tspan dx="7" className="py-count">{hasBranches ? `${expanded.has(node.data.key) ? '−' : '+'} ${fmtNum(data.locale,node.data.count)}` : ''}</tspan></text>}
              </g>;
            })}
          </svg>
        </div>
        <div className="py-map-bottom py-frame"><span>{l.note}</span><span className="py-micro">{fmtNum(data.locale, diagram.visible.length)} / {l.tip}</span></div>
        <div className="py-focus-path py-frame"><span className="py-micro">{l.path}</span><div>{activePath.map((node) => <button type="button" key={node.data.key} onClick={() => choose(node.data)}>{node.data.title}</button>)}</div><button type="button" onClick={() => show(group)}>{l.inspect}<ArrowUpRight size={16} aria-hidden /></button></div>
      </section>

      <section id="py-notes" className="py-notes py-frame">
        <div className="py-note-heading"><span className="py-micro">{seqNo(data.locale, 2)} / {l.field}</span><h2>{l.field}</h2><p>{l.initial}</p>
          <ProfilePhoto src={data.person.photo} alt={t('common.photoAlt')} size={240} className="py-photo" monogramClassName="py-photo-fallback" />
        </div>
        <article className="py-biography"><h3>{data.person.displayName}</h3><LeafText record={records.profile[0]} /></article>
        <div className="py-herbarium"><div className="py-index-heading"><span className="py-micro">{l.index}</span><h3>{l.path}</h3></div>
          <ol>{GROUPS.filter((g) => g !== 'profile').map((g, i) => <li key={g}><button type="button" onClick={() => show(g)}><span>{seqNo(data.locale,i + 1)}</span><strong>{label(g)}</strong><small>{fmtNum(data.locale, records[g].length)} {l.count}</small><ArrowUpRight size={17} aria-hidden /></button></li>)}</ol>
        </div>
      </section>
    </main>
    <footer className="py-footer py-frame"><a href="#py-top" className="py-brand"><GitBranch size={18} aria-hidden />phylo</a><p>{data.person.location}</p>{data.links.email && <a href={data.links.email}>{t('common.email')}<ArrowUpRight size={16} aria-hidden /></a>}</footer>
    <dialog className="py-dialog" ref={dialog} aria-labelledby="py-record-title" onClick={(e) => { if (e.currentTarget === e.target) e.currentTarget.close(); }}><div>
      <header><div><span className="py-micro">{l.index}</span><h2 id="py-record-title">{label(group)}</h2></div><button type="button" aria-label={t('nav.close')} onClick={() => dialog.current?.close()}><X size={22} aria-hidden /></button></header>
      {!only && <div className="py-dialog-controls"><select aria-label={l.index} value={group} onChange={(e) => { setGroup(e.target.value as Collection); setQuery(''); }}>{GROUPS.map((g) => <option value={g} key={g}>{label(g)} · {fmtNum(data.locale,records[g].length)}</option>)}</select><input aria-label={l.search} placeholder={l.search} type="search" value={query} onChange={(e) => setQuery(e.target.value)} /></div>}
      {!found.length && <p role="status">{l.no}</p>}
      {found.map((record, i) => <details className="py-record" open={!!only || found.length === 1} key={record.id}><summary><span>{seqNo(data.locale,i+1)}</span><strong dir="auto">{record.title}</strong><span aria-hidden>+</span></summary><LeafText record={record} /></details>)}
    </div></dialog>
  </div>;
}
