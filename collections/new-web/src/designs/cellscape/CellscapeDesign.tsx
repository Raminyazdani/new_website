'use client';

import { ArrowUpRight, CalendarDays, CircleDot, Crosshair, Grid2X2, List, Search, X } from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { LocaleSwitcher } from '@/components/shared/LocaleSwitcher';
import { ProfilePhoto } from '@/components/shared/ProfilePhoto';
import { fmtNum, fmtYear } from '@/lib/format';
import type { SiteData } from '@/lib/types';
import { Inspector } from './Inspector';
import { TopicPlot } from './TopicPlot';
import { chronologyPoints, clusterPoints, dateTicks, indexPortfolio, kindColor, kinds, type Kind, type RecordItem } from './model';
import { cellStrings } from './strings';
import './cellscape.css';

type Mode = 'map' | 'chronology' | 'table';
const views = [{ id: 'map', Icon: CircleDot }, { id: 'chronology', Icon: CalendarDays }, { id: 'table', Icon: List }] as const;
const mobile = () => window.matchMedia('(max-width: 960px)').matches;

function CellMark() {
  return <svg viewBox="0 0 32 32" width="27" height="27" aria-hidden="true"><path d="M16 3.5c6 0 12.5 6 12.5 12.5S22 28.5 16 28.5 3.5 22.5 3.5 16 10 3.5 16 3.5Z" fill="none" stroke="currentColor" strokeWidth="1.3"/><circle cx="12" cy="13" r="3.3" fill="currentColor"/><circle cx="21" cy="12" r="2.3" fill="currentColor"/><circle cx="19" cy="21" r="3.7" fill="currentColor"/><circle cx="9" cy="21" r="1.4" fill="currentColor"/></svg>;
}

/** Cool, dense and flat. The portfolio is the dataset; its conceptual topic plot is the workspace. */
export function CellscapeDesign({ data }: { data: SiteData }) {
  const s = cellStrings[data.locale];
  const records = useMemo(() => indexPortfolio(data, s.profile), [data, s.profile]);
  const points = useMemo(() => clusterPoints(records), [records]);
  const years = useMemo(() => dateTicks(records), [records]);
  const timeline = useMemo(() => chronologyPoints(records, years), [records, years]);
  const counts = useMemo(() => Object.fromEntries(kinds.map((k) => [k, records.filter((r) => r.kind === k).length])) as Record<Kind, number>, [records]);
  const [mode, setMode] = useState<Mode>('map');
  const [filter, setFilter] = useState<Kind | 'all'>('all');
  const [query, setQuery] = useState('');
  const [year, setYear] = useState<number | 'all'>('all');
  const [selection, setSelection] = useState(records.find((r) => r.kind === 'project' && r.source.featured)?.id ?? records[0]?.id);
  const [pane, setPane] = useState<'workspace' | 'inspect'>('workspace');
  const [category, setCategory] = useState(false);
  const search = useRef<HTMLInputElement>(null);
  const list = useRef<HTMLDivElement>(null);
  const num = (value: number) => fmtNum(data.locale, value);
  const tokens = query.normalize('NFKC').toLocaleLowerCase(data.locale).trim().split(/\s+/).filter(Boolean);
  const filtered = records.filter((r) => (filter === 'all' || r.kind === filter) && (year === 'all' || year === r.year) && tokens.every((token) => r.search.includes(token)));
  const visible = new Set(filtered.map((r) => r.id));
  const item = filtered.find((r) => r.id === selection) ?? filtered[0];
  const related = item && item.kind !== 'profile' ? filtered.filter((r) => r.population === item.population && r.id !== item.id).sort((a, b) => Number(b.kind === item.kind) - Number(a.kind === item.kind)).slice(0, 3) : [];

  useEffect(() => {
    function handleShortcut(e: KeyboardEvent) {
      if (e.key !== '/' || e.altKey || e.ctrlKey || e.metaKey || (e.target instanceof HTMLElement && (e.target.matches('input,textarea,select') || e.target.isContentEditable))) return;
      e.preventDefault(); search.current?.focus();
    }
    window.addEventListener('keydown', handleShortcut);
    return () => window.removeEventListener('keydown', handleShortcut);
  }, []);

  const select = (next: RecordItem) => {
    if (!visible.has(next.id)) { setFilter('all'); setYear('all'); setQuery(''); }
    setSelection(next.id);
    if (mobile()) {
      setPane('inspect');
      requestAnimationFrame(() => document.getElementById('csc-selected-record-title')?.focus({ preventScroll: true }));
    }
  };
  const changeMode = (next: Mode) => { setMode(next); setPane('workspace'); };
  const changeType = (next: Kind | 'all') => { setFilter(next); setYear('all'); setCategory(false); setPane('workspace'); };
  const reset = () => { setQuery(''); setFilter('all'); setYear('all'); };

  return <main className="cellscape" dir={data.dir}>
    <header className="csc-top">
      <div className="csc-brand"><span className="csc-logo"><CellMark /></span><span>Cellscape</span><span className="csc-top-slash" aria-hidden>/</span><span className="csc-top-label">{s.title}</span></div>
      <div className="csc-search" role="search">
        <Search size={17} aria-hidden /><input ref={search} type="search" value={query} aria-label={s.search} placeholder={s.search} onChange={(event) => { setQuery(event.target.value); setPane('workspace'); list.current?.scrollTo(0, 0); }} />
        {query ? <button type="button" aria-label={s.clear} onClick={() => { setQuery(''); search.current?.focus(); }}><X size={17} aria-hidden /></button> : <kbd aria-hidden>/</kbd>}
      </div>
      <div className="csc-top-end">
        <LocaleSwitcher className="csc-langs" itemClassName="csc-lang" activeClassName="csc-lang-current" />
        <button type="button" className="csc-identity" aria-label={s.profile + ': ' + data.person.displayName} onClick={() => { const p = records.find((r) => r.kind === 'profile'); if (p) select(p); }}>
          <span className="csc-identity-name">{data.person.displayName}<small>{s.profile}</small></span><ProfilePhoto src={data.person.photo} alt={data.person.displayName} size={112} className="csc-avatar" priority />
        </button>
      </div>
    </header>

    <div className="csc-mobile-bar" role="group" aria-label={s.view}>
      {views.map(({ id, Icon }) => <button type="button" key={id} aria-pressed={pane === 'workspace' && mode === id} onClick={() => changeMode(id)}><Icon size={16} aria-hidden />{s[id]}</button>)}
      <button type="button" aria-pressed={pane === 'inspect'} onClick={() => setPane('inspect')}><Crosshair size={16} aria-hidden />{s.inspect}</button>
    </div>

    <div className="csc-workbench" data-pane={pane} data-categories={category || undefined}>
      <nav className="csc-rail" aria-label={s.filter}>
        <div className="csc-panel-heading"><Grid2X2 size={16} aria-hidden /><h2>{s.filter}</h2><span>01</span></div>
        <div className="csc-rail-filters">
          <button type="button" className="csc-filter-all" aria-pressed={filter === 'all'} onClick={() => changeType('all')}><Grid2X2 size={15} aria-hidden /><span>{s.all}</span><b>{num(records.length)}</b></button>
          {kinds.map((k) => <button type="button" key={k} aria-pressed={filter === k} onClick={() => changeType(k)}><span className="csc-mark" data-kind={k} style={{ '--csc-mark': kindColor[k] } as React.CSSProperties} /><span>{s[k]}</span><b>{num(counts[k])}</b></button>)}
        </div>
        <div className="csc-rail-distribution"><div className="csc-panel-heading"><span>{s.legend}</span></div><div className="csc-distribution" aria-hidden="true">{kinds.filter((k) => counts[k]).map((k) => <span key={k} style={{ flexGrow: counts[k], backgroundColor: kindColor[k] }} />)}</div><div className="csc-distribution-caption"><span>{num(records.length)}</span><span>{s.all}</span></div></div>
      </nav>

      <section className="csc-workspace" aria-labelledby="csc-workspace-title">
        <div className="csc-workspace-head">
          <div><div className="csc-workspace-kicker"><span>02</span>{s.subtitle}</div><h1 id="csc-workspace-title">{s[mode]}</h1></div>
          <div className="csc-views" role="group" aria-label={s.view}>{views.map(({ id, Icon }) => <button type="button" key={id} aria-pressed={mode === id} onClick={() => changeMode(id)}><Icon size={15} aria-hidden />{s[id]}</button>)}</div>
        </div>
        <div className="csc-plot-head">
          <span className="csc-matches" role="status"><i aria-hidden />{num(filtered.length)}<span aria-hidden>/</span>{num(records.length)} <small>{s.counts}</small></span>
          <button type="button" className="csc-filter-mobile" aria-expanded={category} onClick={() => setCategory((v) => !v)}><Grid2X2 size={16} aria-hidden />{filter === 'all' ? s.filter : s[filter]}</button>
        </div>
        {mode === 'table' ? <div className="csc-records" ref={list}>
          <table><thead><tr><th scope="col">{s.titleField}</th><th scope="col">{s.filter}</th><th scope="col">{s.year}</th></tr></thead><tbody>{filtered.map((r) => <tr key={r.id} data-selected={item?.id === r.id || undefined}>
            <td><button type="button" onClick={() => select(r)} aria-pressed={item?.id === r.id}><span className="csc-mark" style={{ backgroundColor: kindColor[r.kind] }} /><span dir="auto"><strong>{r.title}</strong>{r.sub && <small>{r.sub}</small>}</span><ArrowUpRight size={15} aria-hidden /></button></td><td>{s[r.kind]}</td><td>{r.year != null ? fmtYear(data.locale, r.year) : '—'}</td>
          </tr>)}</tbody></table>
          {!filtered.length && <div className="csc-empty"><p>{s.noMatches}</p><button type="button" onClick={reset}>{s.reset}</button></div>}
        </div> : <div className="csc-plot-frame">
          <TopicPlot key={mode} points={mode === 'map' ? points : timeline} records={records} visible={visible} selected={item} onSelect={select} mode={mode} years={years} data={data} s={s} />
          {!filtered.length && <div className="csc-empty csc-empty-map"><p>{s.noMatches}</p><button type="button" onClick={reset}>{s.reset}</button></div>}
        </div>}
        <div className="csc-plot-note">{mode === 'map' ? s.note : mode === 'chronology' ? s.timeNote : s.select}</div>
        <div className="csc-ribbon" role="group" aria-label={s.year}>
          <CalendarDays size={16} aria-hidden /><button type="button" aria-pressed={year === 'all'} onClick={() => setYear('all')}>{s.allYears}</button>
          {years.map((y) => <button type="button" key={y} aria-pressed={year === y} onClick={() => { setYear(year === y ? 'all' : y); setFilter('all'); if (mode === 'map') setMode('chronology'); }}>{fmtYear(data.locale, y)}</button>)}
        </div>
      </section>

      <Inspector data={data} item={item} related={related} onSelect={select} s={s} />
    </div>
  </main>;
}

export default CellscapeDesign;
