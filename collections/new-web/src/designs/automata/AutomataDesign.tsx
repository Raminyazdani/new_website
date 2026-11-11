'use client';

import dynamic from 'next/dynamic';
import { useEffect, useMemo, useRef, useState } from 'react';
import { ArrowDown, ArrowUpRight, Pause, Play, RotateCcw, Search, StepForward } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { LocaleSwitcher } from '@/components/shared/LocaleSwitcher';
import { manrope } from '@/fonts/manrope';
import { plexMono } from '@/fonts/plex';
import { fmtNum } from '@/lib/format';
import type { SiteData } from '@/lib/types';
import { collectionLabels, makeSpecimens, matchesSpecimen, type Collection, type Specimen } from '../microcosm/specimen';
import { agesAt, columns, evolve, neighbors, rows, seed, type Board, type Preset } from './life';
import './automata.css';

const Scene = dynamic(() => import('./AutomataScene'), { ssr: false });
const words = {
  en: {
    chapters: ['Seed', 'Rules', 'Emergence', 'Portfolio'], text: [
      'Start with a small pattern. Edit a cell or choose a repeatable seed.',
      'Eight neighbors. Three for a birth. Two or three for survival. Outside the board, cells are dead.',
      'One local rule, applied everywhere. Step through generations and watch the structure change.',
      'The experiment ends here. Explore the actual work, methods, and research records below.',
    ],
    presets: ['Glider', 'Pulses', 'Garden'], play: 'Run', pause: 'Pause', step: 'Step', reset: 'Reset seed', edit: 'Edit cells',
    generation: 'Generation', live: 'Living cells', adjacent: 'Neighbors', history: 'Replay history', story: 'Story position',
    auto: 'Follow scroll', manual: 'Manual view', source: 'Portfolio records', search: 'Search this collection', more: 'Show more',
    example: 'Educational cellular automaton · 24 × 16 · B3/S23', empty: 'No matching records.', full: 'Full profile', rules: 'Finite board, repeatable rules.',
    profile: 'Read the profile', board: 'Cell field', editHelp: 'Select a cube to change the seed.', visit: 'Open records',
    row: 'Row', column: 'Column', toggle: 'Toggle cell',
  },
  de: {
    chapters: ['Startmuster', 'Regeln', 'Entstehung', 'Portfolio'], text: [
      'Beginne mit einem kleinen Muster. Ändere eine Zelle oder wähle einen reproduzierbaren Start.',
      'Acht Nachbarn. Drei für eine Geburt. Zwei oder drei zum Überleben. Außerhalb des Felds sind Zellen tot.',
      'Eine lokale Regel gilt überall. Gehe die Generationen durch und beobachte die Struktur.',
      'Hier endet das Experiment. Erkunde unten die tatsächlichen Arbeiten, Methoden und Forschungseinträge.',
    ],
    presets: ['Gleiter', 'Impulse', 'Garten'], play: 'Start', pause: 'Pause', step: 'Schritt', reset: 'Start zurücksetzen', edit: 'Zellen ändern',
    generation: 'Generation', live: 'Lebende Zellen', adjacent: 'Nachbarn', history: 'Verlauf abspielen', story: 'Kapitelposition',
    auto: 'Scrollen folgen', manual: 'Manuelle Ansicht', source: 'Portfolioeinträge', search: 'Sammlung durchsuchen', more: 'Mehr anzeigen',
    example: 'Zellulärer Ler­nautomat · 24 × 16 · B3/S23', empty: 'Keine passenden Einträge.', full: 'Vollständiges Profil', rules: 'Endliches Feld, reproduzierbare Regeln.',
    profile: 'Profil lesen', board: 'Zellfeld', editHelp: 'Wähle einen Würfel, um das Startmuster zu ändern.', visit: 'Einträge öffnen',
    row: 'Zeile', column: 'Spalte', toggle: 'Zelle umschalten',
  },
  fa: {
    chapters: ['الگو', 'قواعد', 'پدیدارشدن', 'پورتفولیو'], text: [
      'با یک الگوی کوچک شروع کنید. یک سلول را تغییر دهید یا الگوی تکرارپذیری انتخاب کنید.',
      'هشت همسایه؛ سه همسایه برای تولد و دو یا سه برای بقا. سلول‌های بیرون شبکه خاموش هستند.',
      'یک قانون محلی در همه‌جا اجرا می‌شود. نسل‌ها را جلو ببرید و تغییر ساختار را ببینید.',
      'آزمایش اینجا تمام می‌شود. کارها، روش‌ها و سوابق واقعی را در ادامه بخوانید.',
    ],
    presets: ['گلایدر', 'تپش‌ها', 'باغ'], play: 'اجرا', pause: 'مکث', step: 'یک گام', reset: 'بازنشانی الگو', edit: 'ویرایش سلول‌ها',
    generation: 'نسل', live: 'سلول‌های زنده', adjacent: 'همسایه‌ها', history: 'بازپخش تاریخچه', story: 'جای فصل',
    auto: 'دنبال‌کردن پیمایش', manual: 'نمای دستی', source: 'سوابق پورتفولیو', search: 'جست‌وجو در مجموعه', more: 'نمایش بیشتر',
    example: 'خودکار سلولی آموزشی · ۲۴ × ۱۶ · B3/S23', empty: 'رکوردی پیدا نشد.', full: 'پروفایل کامل', rules: 'شبکهٔ محدود، قواعد تکرارپذیر.',
    profile: 'خواندن پروفایل', board: 'میدان سلول‌ها', editHelp: 'یک مکعب را برای تغییر الگوی اولیه انتخاب کنید.', visit: 'بازکردن سوابق',
    row: 'ردیف', column: 'ستون', toggle: 'تغییر سلول',
  },
};
const groups: Collection[] = ['projects', 'methods', 'roles', 'papers', 'education', 'courses', 'languages', 'journey', 'profile', 'contact'];
const presets: Preset[] = ['glider', 'pulses', 'garden'];
type Timeline = { frames: Board[]; cursor: number };
const advance = (value: Timeline): Timeline => value.cursor >= 100 ? value : { frames: [...value.frames.slice(0, value.cursor + 1), evolve(value.frames[value.cursor])], cursor: value.cursor + 1 };

function SourceRecord({ item }: { item: Specimen }) {
  return <details className="at-source-record"><summary><strong dir="auto">{item.title}</strong><ArrowUpRight size={16} aria-hidden /></summary>
    <div>{item.subtitle && <p className="at-record-meta" dir="auto">{item.subtitle}</p>}{item.body.map((text, i) => <p key={i} dir="auto">{text}</p>)}
      {!!item.methods?.length && <ul>{item.methods.map((text, i) => <li key={i} dir="auto">{text}</li>)}</ul>}
      {!!item.facts?.length && <dl>{item.facts.map(([label, value], i) => <div key={i}><dt>{label}</dt><dd dir="auto">{value}</dd></div>)}</dl>}
      {item.links?.map(([label, href], i) => <a key={i} href={href} target={href.startsWith('mailto:') ? undefined : '_blank'} rel="noreferrer"><bdi>{label}</bdi><ArrowUpRight size={14} aria-hidden /></a>)}
      {item.citation && <pre dir="ltr">{item.citation}</pre>}
    </div>
  </details>;
}

export function AutomataDesign({ data }: { data: SiteData }) {
  const t = useTranslations();
  const c = words[data.locale];
  const records = useMemo(() => makeSpecimens(data, t), [data, t]);
  const [preset, setPreset] = useState<Preset>('garden');
  const [timeline, setTimeline] = useState<Timeline>(() => ({ frames: [seed('garden')], cursor: 0 }));
  const [running, setRunning] = useState(false);
  const [editing, setEditing] = useState(false);
  const [focus, setFocus] = useState(8 * columns + 12);
  const [story, setStory] = useState(0);
  const [manual, setManual] = useState(false);
  const [limitedMotion, setLimitedMotion] = useState(false);
  const [motionMode, setMotionMode] = useState<'auto' | 'full' | 'still'>('auto');
  const [visible, setVisible] = useState(true);
  const [ready, setReady] = useState(false);
  const [unavailable, setUnavailable] = useState(false);
  const [group, setGroup] = useState<Collection>('projects');
  const [query, setQuery] = useState('');
  const [limit, setLimit] = useState(12);
  const section = useRef<HTMLElement>(null);
  const stage = useRef<HTMLDivElement>(null);
  const board = timeline.frames[timeline.cursor];
  const ages = useMemo(() => agesAt(timeline.frames, timeline.cursor), [timeline]);
  const chapter = Math.min(3, Math.round(story * 3));
  const found = records[group].filter(item => matchesSpecimen(item, query, data.locale));
  const num = (n: number) => fmtNum(data.locale, n);
  const label = (value: Collection) => t(collectionLabels[value]);

  useEffect(() => {
    const media = window.matchMedia('(prefers-reduced-motion: reduce)');
    const change = () => {
      const mode = new URLSearchParams(location.search).get('motion');
      const limited = mode !== 'full' && (media.matches || mode === 'still' || mode === 'off');
      setMotionMode(mode === 'full' ? 'full' : mode === 'still' || mode === 'off' ? 'still' : 'auto');
      setLimitedMotion(limited); if (limited) setManual(true);
    };
    change(); media.addEventListener('change', change);
    const observer = new IntersectionObserver(([entry]) => setVisible(entry.isIntersecting));
    if (stage.current) observer.observe(stage.current);
    return () => { observer.disconnect(); media.removeEventListener('change', change); };
  }, []);
  useEffect(() => {
    if (manual || limitedMotion) return;
    let frame = 0;
    function read() {
      frame = 0;
      const box = section.current?.getBoundingClientRect();
      if (box) setStory(Math.max(0, Math.min(1, -box.top / Math.max(1, box.height - innerHeight + 40))));
    }
    const schedule = () => { if (!frame) frame = requestAnimationFrame(read); };
    window.addEventListener('scroll', schedule, { passive: true });
    return () => { window.removeEventListener('scroll', schedule); if (frame) cancelAnimationFrame(frame); };
  }, [manual, limitedMotion]);
  useEffect(() => {
    if (!running || !visible || timeline.cursor >= 100) return;
    const timer = window.setInterval(() => { if (!document.hidden) setTimeline(advance); }, limitedMotion ? 1000 : 360);
    return () => window.clearInterval(timer);
  }, [running, visible, timeline.cursor >= 100, limitedMotion]);

  function reset(value = preset) { setPreset(value); setRunning(false); setTimeline({ frames: [seed(value)], cursor: 0 }); }
  function pick(index: number) {
    setFocus(index);
    if (!editing) return;
    const next = board.slice(); next[index] = 1 - next[index];
    setRunning(false); setTimeline({ frames: [next], cursor: 0 });
  }
  function changeStory(value: number) { setManual(true); setStory(value); }
  function selectGroup(value: Collection) { setGroup(value); setQuery(''); setLimit(12); }

  return <main className={`at-root ${manrope.variable} ${plexMono.variable}`} dir={data.dir} data-motion={motionMode}>
    <a href="#at-archive" className="at-skip">{t('nav.skip')}</a>
    <header className="at-header"><a href="#at-top" className="at-brand"><span aria-hidden>▦</span>Automata</a><LocaleSwitcher className="at-locales" itemClassName="at-locale" activeClassName="at-locale-active" /></header>
    <section id="at-top" className="at-identity">
      <div className="at-id-badge">{data.person.photo ? <img src={data.person.photo} alt={t('common.photoAlt')} width="72" height="80" /> : <span aria-hidden>▦</span>}<div><h1 dir="auto">{data.person.displayName}</h1><p dir="auto">{data.person.headline}</p><span dir="auto">{data.person.location}</span></div></div>
      <button type="button" className="at-profile" onClick={() => { selectGroup('profile'); document.getElementById('at-archive')?.scrollIntoView({ behavior: 'instant' }); }}>{c.profile}<ArrowUpRight size={16} aria-hidden /></button>
    </section>
    <section className="at-story" ref={section}>
      <div className="at-sticky" ref={stage}>
        <div className="at-narrative">
          <nav aria-label={c.story}>{c.chapters.map((text, i) => <button type="button" key={text} aria-pressed={chapter === i} onClick={() => changeStory(i / 3)}><i aria-hidden />{text}</button>)}</nav>
          <h2>{c.chapters[chapter]}</h2><p>{c.text[chapter]}</p>
          <label className="at-story-slider">{c.story}<input type="range" min="0" max="1" step="0.005" value={story} onChange={event => changeStory(+event.target.value)} /></label>
          <button className="at-follow" type="button" disabled={limitedMotion} aria-pressed={!manual} onClick={() => setManual(!manual)}>{c.auto}</button>
          {chapter === 3 && <a className="at-visit" href="#at-archive">{c.visit}<ArrowDown size={16} aria-hidden /></a>}
        </div>
        <div className="at-laboratory">
          <div className="at-board-caption"><span>{c.example}</span><span>{c.rules}</span></div>
          <div className="at-stage" data-renderer={ready && !unavailable ? 'webgl' : 'grid'}>
            <div className="at-flat" hidden={ready && !unavailable} role="group" aria-label={c.board}>{board.map((alive, i) => <button type="button" key={i} aria-label={`${i % columns + 1}, ${Math.floor(i / columns) + 1}`} aria-pressed={!!alive} disabled={!editing} onClick={() => pick(i)} data-alive={!!alive || undefined} />)}</div>
            {!unavailable && <Scene board={board} ages={ages} story={story} focus={focus} editing={editing} onPick={pick} onReady={() => setReady(true)} onUnavailable={() => setUnavailable(true)} />}
          </div>
          <div className="at-readouts" aria-live={running ? 'off' : 'polite'}><div><span>{c.generation}</span><strong>{num(timeline.cursor)}</strong></div><div><span>{c.live}</span><strong>{num(board.reduce((sum, value) => sum + value, 0))}</strong></div><div><span>{c.adjacent}</span><strong>{num(neighbors(board, focus))}</strong></div></div>
          <div className="at-controls"><div className="at-transport"><button type="button" className="at-play" aria-pressed={running} disabled={timeline.cursor >= 100} onClick={() => { setEditing(false); setRunning(!running); }}>{running ? <Pause size={17} aria-hidden /> : <Play size={17} aria-hidden />}{running ? c.pause : c.play}</button><button type="button" disabled={timeline.cursor >= 100} onClick={() => { setRunning(false); setTimeline(advance); }}><StepForward size={17} aria-hidden />{c.step}</button><button type="button" title={c.reset} aria-label={c.reset} onClick={() => reset()}><RotateCcw size={17} aria-hidden /></button></div>
            <div role="group" aria-label={c.chapters[0]} className="at-presets">{presets.map((value, i) => <button type="button" key={value} aria-pressed={preset === value} onClick={() => reset(value)}>{c.presets[i]}</button>)}</div>
            <button className="at-edit" type="button" aria-pressed={editing} onClick={() => { setRunning(false); setEditing(!editing); }}>{c.edit}</button>
          </div>
          <label className="at-history">{c.history}<input type="range" min="0" max={Math.max(1, timeline.frames.length - 1)} value={timeline.cursor} disabled={timeline.frames.length < 2} onChange={event => { setRunning(false); setTimeline({ ...timeline, cursor: +event.target.value }); }} /><output>{num(timeline.cursor)} / {num(timeline.frames.length - 1)}</output></label>
          {editing && <div className="at-editor"><p className="at-edit-help">{c.editHelp}</p><label>{c.column}<select value={focus % columns} onChange={event => setFocus(Math.floor(focus / columns) * columns + +event.target.value)}>{Array.from({ length: columns }, (_, i) => <option key={i} value={i}>{num(i + 1)}</option>)}</select></label><label>{c.row}<select value={Math.floor(focus / columns)} onChange={event => setFocus(+event.target.value * columns + focus % columns)}>{Array.from({ length: rows }, (_, i) => <option key={i} value={i}>{num(i + 1)}</option>)}</select></label><button type="button" onClick={() => pick(focus)}>{c.toggle}</button></div>}
        </div>
      </div>
    </section>
    <section id="at-archive" className="at-archive" aria-labelledby="at-archive-title">
      <header><h2 id="at-archive-title">{c.source}</h2><label><Search size={17} aria-hidden /><input type="search" aria-label={c.search} placeholder={c.search} value={query} onChange={event => { setQuery(event.target.value); setLimit(12); }} /></label></header>
      <nav aria-label={c.source}>{groups.map(value => <button key={value} type="button" aria-pressed={group === value} onClick={() => selectGroup(value)}>{label(value)}<span>{num(records[value].length)}</span></button>)}</nav>
      <div className="at-source-grid">{found.slice(0, limit).map(item => <SourceRecord item={item} key={item.id} />)}</div>
      {!found.length && <p role="status">{c.empty}</p>}
      {found.length > limit && <button className="at-more" type="button" onClick={() => setLimit(limit + 24)}>{c.more}<ArrowDown size={16} aria-hidden /></button>}
    </section>
  </main>;
}

export default AutomataDesign;
