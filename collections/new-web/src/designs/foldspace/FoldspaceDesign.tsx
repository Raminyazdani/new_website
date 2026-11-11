'use client';

import dynamic from 'next/dynamic';
import { Component, useCallback, useMemo, useState, type ReactNode } from 'react';
import { ArrowDown, ArrowRight, ArrowUpRight, ChevronLeft, ChevronRight, CircleDot, Layers, RotateCcw, ScanLine } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { LocaleSwitcher } from '@/components/shared/LocaleSwitcher';
import { ProfilePhoto } from '@/components/shared/ProfilePhoto';
import { allProjects } from '@/lib/derive';
import { fmtNum, fmtYear, seqNo } from '@/lib/format';
import type { SiteData } from '@/lib/types';
import { archiveEntries, archiveKinds, FoldArchive, type ArchiveTarget } from './FoldArchive';
import { FoldFallback, type FoldMode } from './FoldFallback';
import { foldStrings } from './strings';
import './foldspace.css';

const FoldScene = dynamic(() => import('./FoldScene').then((m) => m.FoldScene), { ssr: false });
const modes = [{ id: 'structure', Icon: Layers }, { id: 'sequence', Icon: CircleDot }, { id: 'surface', Icon: ScanLine }] as const;

class SceneGuard extends Component<{ children: ReactNode; onFail: () => void }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() { return { failed: true }; }
  componentDidCatch() { this.props.onFail(); }
  render() { return this.state.failed ? null : this.props.children; }
}

function FoldMark() {
  return <svg width="32" height="26" viewBox="0 0 32 26" aria-hidden="true" fill="none"><path d="M1 21.5 10.7 4l5.2 9L21.6 4 31 21.5M6.4 21.5 12 11.3l4 7.1 4-7.1 5.5 10.2" stroke="currentColor" strokeWidth="1.25" strokeLinejoin="round"/><path d="M1 21.5h30" stroke="currentColor" opacity=".45"/></svg>;
}

/** Dark, sculptural, layered. The opening scene is an illustrative, selectable 3D model. */
export function FoldspaceDesign({ data }: { data: SiteData }) {
  const t = useTranslations();
  const s = foldStrings[data.locale];
  const number = (n: number) => seqNo(data.locale, n);
  const [mode, setMode] = useState<FoldMode>('structure');
  const [active, setActive] = useState(0);
  const [angle, setAngle] = useState(0);
  const [scene, setScene] = useState<'loading' | 'live' | 'fallback'>('loading');
  const [target, setTarget] = useState<ArchiveTarget | null>(null);
  const [step, setStep] = useState(0);
  const ready = useCallback(() => setScene('live'), []);
  const unavailable = useCallback(() => setScene('fallback'), []);
  const close = useCallback(() => setTarget(null), []);
  const projects = useMemo(() => allProjects(data).slice(0, 5), [data]);
  const project = projects[active];
  const rows = useMemo(() => archiveEntries(data), [data]);
  const chain = useMemo(() => [
    ...data.experiences.map((r) => ({ id: `role:${r.id}`, kind: 'role' as const, title: r.role, org: r.org, period: r.period, description: r.description, location: r.location, year: r.startYear, start: r.start, current: r.current })),
    ...data.education.map((r) => ({ id: `study:${r.id}`, kind: 'study' as const, title: r.degree, org: r.institution, period: r.period, description: '', location: r.location, year: r.startYear, start: r.start, current: r.current })),
  ].sort((a, b) => (b.start ?? '').localeCompare(a.start ?? '')), [data]);
  const point = chain[step];
  const projectTarget = () => { if (project) setTarget({ kind: 'project', id: `project:${project.id}` }); };
  const label = data.locale === 'en' ? 'Foldspace' : `${s.word1}${data.locale === 'fa' ? ' ' : ''}${s.word2}`;
  return <main className="foldspace" dir={data.dir}>
    <header className="fld-top">
      <a className="fld-brand" href="#fld-structure" aria-label={label}><FoldMark /><span>FOLDSPACE</span></a>
      <span className="fld-top-name">{data.person.displayName}</span>
      <LocaleSwitcher className="fld-langs" itemClassName="fld-lang" activeClassName="fld-lang-current" />
    </header>

    <section id="fld-structure" className="fld-hero" aria-labelledby="fld-title">
      <div className="fld-stage">
        <div className="fld-stage-grid" aria-hidden="true" />
        <div className="fld-stage-etch" aria-hidden="true"><span>+</span><span>+</span><span>+</span><span>+</span></div>
        {scene !== 'live' && <FoldFallback mode={mode} angle={angle} active={active} count={projects.length} />}
        {scene !== 'fallback' && <div className="fld-live" data-ready={scene === 'live'} aria-hidden="true">
          <SceneGuard onFail={unavailable}><FoldScene mode={mode} angle={angle} active={active} count={projects.length} onSelect={(i) => { if (projects[i]) setActive(i); }} onReady={ready} onUnavailable={unavailable} /></SceneGuard>
        </div>}
        <nav className="fld-chapters" aria-label={s.layers}>
          <a href="#fld-structure" className="fld-chapter-here"><span>{number(1)}</span>{s.structure}</a>
          <a href="#fld-sequence"><span>{number(2)}</span>{s.sequence}</a>
          <a href="#fld-archive"><span>{number(3)}</span>{s.archive}</a>
        </nav>
        <div className="fld-hero-copy">
          <div className="fld-eyebrow"><span className="fld-index">{number(1)}</span>{s.model}</div>
          <h1 id="fld-title" aria-label={label}><span>{s.word1}</span><span>{s.word2}<i>.</i></span></h1>
          <p className="fld-tagline">{s.tagline}</p>
          <button type="button" className="fld-portrait-button" onClick={() => setTarget({ kind: 'profile', id: 'profile' })}>
            <ProfilePhoto className="fld-portrait" src={data.person.photo} alt={data.person.displayName} size={144} priority />
            <span><strong>{data.person.displayName}</strong><small>{data.person.headline}</small></span><ArrowUpRight size={16} aria-hidden />
          </button>
        </div>
        <div className="fld-scene-caption"><i aria-hidden />{s.legend}</div>
        {project && <div className="fld-specimen">
          <div className="fld-eyebrow"><span className="fld-index">{number(active + 1)} / {number(projects.length)}</span>{s.specimen}</div>
          <h2 dir="auto" aria-live="polite">{project.title}</h2>
          <button type="button" onClick={projectTarget} className="fld-link">{s.view}<ArrowUpRight size={16} aria-hidden /></button>
          <div className="fld-projects" role="group" aria-label={s.work}>{projects.map((p, i) => <button key={p.id} type="button" title={p.title} aria-label={p.title} aria-pressed={active === i} onClick={() => setActive(i)}>{number(i + 1)}</button>)}</div>
        </div>}
      </div>
      <div className="fld-controls">
        <div className="fld-modes" role="group" aria-label={s.layers}>{modes.map(({ id, Icon }) => <button type="button" key={id} aria-pressed={mode === id} onClick={() => setMode(id)}><Icon size={16} aria-hidden />{s[id]}</button>)}</div>
        <div className="fld-rotate"><label htmlFor="fld-angle">{s.orientation}</label><input id="fld-angle" type="range" min="-180" max="180" step="1" dir="ltr" value={angle} onChange={(e) => setAngle(Number(e.target.value))} /><output htmlFor="fld-angle">{fmtNum(data.locale, angle)}°</output><button type="button" title={s.reset} aria-label={s.reset} onClick={() => setAngle(0)}><RotateCcw size={17} aria-hidden /></button></div>
        <a href="#fld-sequence" className="fld-jump" aria-label={s.sequence}><ArrowDown size={18} aria-hidden /></a>
      </div>
    </section>

    <section id="fld-sequence" className="fld-sequence" aria-labelledby="fld-seq-title">
      <div className="fld-chapter-heading"><div className="fld-eyebrow"><span className="fld-index">{number(2)}</span>{s.sequence}</div><h2 id="fld-seq-title">{s.timeTitle}</h2><p>{s.timeLabel}</p></div>
      {point && <div className="fld-chain">
        <div className="fld-chain-track" role="group" aria-label={s.timeLabel}>
          {chain.map((r, i) => <button key={r.id} type="button" aria-label={r.title + ', ' + (r.period || s.noDate)} title={r.title} aria-pressed={i === step} data-study={r.kind === 'study' || undefined} onClick={() => setStep(i)}><i aria-hidden /><span>{r.year != null ? fmtYear(data.locale, r.year) : '—'}</span></button>)}
        </div>
        <article className="fld-chain-readout">
          <div className="fld-chain-counter"><b>{number(step + 1)}</b><span>/ {number(chain.length)}</span></div>
          <div className="fld-chain-text" key={point.id}><span className="fld-eyebrow">{s[point.kind]}<span aria-hidden> / </span>{point.period || s.noDate}</span><h3 dir="auto">{point.title}</h3><p>{point.org}{point.location && <> · {point.location}</>}</p>{point.description && <p className="fld-chain-description">{point.description}</p>}<button type="button" className="fld-link" onClick={() => setTarget({ id: point.id, kind: point.kind })}>{s.details}<ArrowUpRight size={16} aria-hidden /></button></div>
          <div className="fld-chain-arrows"><button type="button" disabled={step === 0} aria-label={s.previous} onClick={() => setStep((i) => i - 1)}><ChevronLeft size={20} aria-hidden /></button><button type="button" disabled={step === chain.length - 1} aria-label={s.next} onClick={() => setStep((i) => i + 1)}><ChevronRight size={20} aria-hidden /></button></div>
        </article>
      </div>}
    </section>

    <section id="fld-archive" className="fld-records" aria-labelledby="fld-records-title">
      <div className="fld-chapter-heading"><div className="fld-eyebrow"><span className="fld-index">{number(3)}</span>{s.archive}</div><h2 id="fld-records-title">{s.recordTitle}</h2><p>{s.archiveIntro}</p><button type="button" className="fld-open-archive" onClick={() => setTarget({})}>{s.open}<ArrowUpRight size={18} aria-hidden /></button></div>
      <div className="fld-record-kinds">{archiveKinds.map((k) => <button key={k} type="button" onClick={() => setTarget({ kind: k, id: k === 'profile' ? 'profile' : undefined })}><span>{s[k]}</span><span>{fmtNum(data.locale, rows.filter((r) => r.kind === k).length)}</span><ArrowRight size={17} aria-hidden /></button>)}</div>
    </section>

    <footer className="fld-footer"><a href="#fld-structure"><FoldMark /> {data.person.displayName}</a><button type="button" onClick={() => setTarget({ kind: 'profile', id: 'profile' })}>{s.profile}</button>{data.links.email && <a href={data.links.email}>{s.contact}<ArrowUpRight size={14} aria-hidden /></a>}{data.links.github && <a href={data.links.github} target="_blank" rel="noreferrer">{t('common.github')}<ArrowUpRight size={14} aria-hidden /></a>}</footer>
    {target && <FoldArchive data={data} rows={rows} target={target} s={s} onClose={close} />}
  </main>;
}

export default FoldspaceDesign;
