'use client';

import dynamic from 'next/dynamic';
import { useEffect, useMemo, useRef, useState } from 'react';
import { ArrowDown, ArrowUpRight, Cpu, Pause, Play, RotateCcw, Search, StepForward } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { LocaleSwitcher } from '@/components/shared/LocaleSwitcher';
import { barlow, barlowCondensed } from '@/fonts/barlow';
import { plexMono } from '@/fonts/plex';
import { fmtNum } from '@/lib/format';
import type { SiteData } from '@/lib/types';
import { collectionLabels, makeSpecimens, matchesSpecimen, type Collection, type Specimen } from '../microcosm/specimen';
import { execute, initial, instructionText, phase, programs, type Machine } from './machine';
import './kernel.css';

const Scene = dynamic(() => import('./KernelScene'), { ssr: false });
const words = {
  en: {
    chapters: ['Load', 'Transform', 'Emit'], text: [
      'Numbers enter the registers. A small program brings the circuit into focus.',
      'Arithmetic becomes state. The sixteen raised gates display the two registers as eight-bit values.',
      'The result leaves the chip. Follow the program, then open the actual portfolio records.',
    ],
    demo: 'Teaching program', program: 'Choose program', step: 'Step instruction', run: 'Run', pause: 'Pause', reset: 'Reset machine',
    registers: 'Registers', output: 'Output', history: 'Replay execution', position: 'Layer position', follow: 'Follow scroll', manual: 'Manual view',
    stopped: 'Halted', ready: 'Ready', running: 'Running', source: 'From the portfolio', search: 'Search records', more: 'Load more records',
    profile: 'Read full profile', note: 'A miniature virtual machine. Demonstration values are calculated independently of the portfolio.',
    noOutput: 'Awaiting EMIT', empty: 'No matching records.', sourceLink: 'Open portfolio', counter: 'Program counter',
  },
  de: {
    chapters: ['Laden', 'Verarbeiten', 'Ausgeben'], text: [
      'Zahlen gelangen in die Register. Ein kleines Programm macht die Schaltung sichtbar.',
      'Arithmetik wird Zustand. Die sechzehn erhöhten Gatter zeigen die beiden Register als Acht-Bit-Werte.',
      'Das Ergebnis verlässt den Chip. Folge dem Programm und öffne danach die tatsächlichen Portfolioeinträge.',
    ],
    demo: 'Lernprogramm', program: 'Programm wählen', step: 'Befehl ausführen', run: 'Start', pause: 'Pause', reset: 'Maschine zurücksetzen',
    registers: 'Register', output: 'Ausgabe', history: 'Ausführung wiederholen', position: 'Schichtposition', follow: 'Scrollen folgen', manual: 'Manuelle Ansicht',
    stopped: 'Angehalten', ready: 'Bereit', running: 'Aktiv', source: 'Aus dem Portfolio', search: 'Einträge durchsuchen', more: 'Weitere Einträge laden',
    profile: 'Vollständiges Profil', note: 'Eine kleine virtuelle Maschine. Die Beispielwerte werden unabhängig vom Portfolio berechnet.',
    noOutput: 'Wartet auf EMIT', empty: 'Keine passenden Einträge.', sourceLink: 'Portfolio öffnen', counter: 'Befehlszähler',
  },
  fa: {
    chapters: ['بارگذاری', 'پردازش', 'خروجی'], text: [
      'عددها وارد رجیسترها می‌شوند. یک برنامهٔ کوچک مدار را فعال می‌کند.',
      'محاسبه به حالت تبدیل می‌شود. شانزده گیت برجسته، دو رجیستر را به‌شکل عددهای هشت‌بیتی نشان می‌دهند.',
      'نتیجه از تراشه خارج می‌شود. اجرای برنامه را دنبال کنید و سپس سوابق واقعی پورتفولیو را بخوانید.',
    ],
    demo: 'برنامهٔ آموزشی', program: 'انتخاب برنامه', step: 'اجرای یک دستور', run: 'اجرا', pause: 'مکث', reset: 'بازنشانی ماشین',
    registers: 'رجیسترها', output: 'خروجی', history: 'بازپخش اجرا', position: 'جای لایه‌ها', follow: 'دنبال‌کردن پیمایش', manual: 'نمای دستی',
    stopped: 'متوقف', ready: 'آماده', running: 'در حال اجرا', source: 'از پورتفولیو', search: 'جست‌وجوی سوابق', more: 'نمایش سوابق بیشتر',
    profile: 'پروفایل کامل', note: 'ماشین مجازی کوچک آموزشی؛ مقدارهای نمونه مستقل از پورتفولیو محاسبه می‌شوند.',
    noOutput: 'در انتظار EMIT', empty: 'رکوردی پیدا نشد.', sourceLink: 'بازکردن پورتفولیو', counter: 'شمارندهٔ دستور',
  },
};
const groups: Collection[] = ['projects', 'methods', 'roles', 'papers', 'education', 'courses', 'languages', 'journey', 'profile', 'contact'];
type Trace = { states: Machine[]; cursor: number };

function Source({ item }: { item: Specimen }) {
  return <details className="kn-source-record"><summary><span><strong dir="auto">{item.title}</strong>{item.subtitle && <small dir="auto">{item.subtitle}</small>}</span><ArrowUpRight size={18} aria-hidden /></summary>
    <div className="kn-record-content">{item.body.map((text, i) => <p key={i} dir="auto">{text}</p>)}
      {!!item.methods?.length && <ul>{item.methods.map((text, i) => <li key={i} dir="auto">{text}</li>)}</ul>}
      {!!item.facts?.length && <dl>{item.facts.map(([label, value], i) => <div key={i}><dt>{label}</dt><dd dir="auto">{value}</dd></div>)}</dl>}
      {item.links?.map(([label, href], i) => <a key={i} href={href} target={href.startsWith('mailto:') ? undefined : '_blank'} rel="noreferrer"><bdi>{label}</bdi><ArrowUpRight size={14} aria-hidden /></a>)}
      {item.citation && <pre dir="ltr">{item.citation}</pre>}
    </div>
  </details>;
}

export function KernelDesign({ data }: { data: SiteData }) {
  const t = useTranslations(), c = words[data.locale];
  const records = useMemo(() => makeSpecimens(data, t), [data, t]);
  const [programIndex, setProgramIndex] = useState(0);
  const [trace, setTrace] = useState<Trace>(() => ({ states: [initial()], cursor: 0 }));
  const [running, setRunning] = useState(false);
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
  const viewport = useRef<HTMLDivElement>(null);
  const machine = trace.states[trace.cursor];
  const program = programs[programIndex];
  const chapter = Math.min(2, Math.round(story * 2));
  const previousLine = trace.cursor ? trace.states[trace.cursor - 1].pc : 0;
  const active = phase(program[previousLine]);
  const found = records[group].filter(item => matchesSpecimen(item, query, data.locale));
  const n = (value: number) => fmtNum(data.locale, value);
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
    if (viewport.current) observer.observe(viewport.current);
    return () => { media.removeEventListener('change', change); observer.disconnect(); };
  }, []);
  useEffect(() => {
    if (manual || limitedMotion) return;
    let frame = 0;
    function read() {
      frame = 0; const box = section.current?.getBoundingClientRect();
      if (box) setStory(Math.max(0, Math.min(1, -box.top / Math.max(1, box.height - innerHeight + 40))));
    }
    const schedule = () => { if (!frame) frame = requestAnimationFrame(read); };
    window.addEventListener('scroll', schedule, { passive: true });
    return () => { window.removeEventListener('scroll', schedule); if (frame) cancelAnimationFrame(frame); };
  }, [manual, limitedMotion]);
  useEffect(() => {
    if (!running || !visible || machine.halted) return;
    const timer = window.setInterval(() => { if (!document.hidden) setTrace(value => {
      const state = value.states[value.cursor];
      if (state.halted) return value;
      return { states: [...value.states.slice(0, value.cursor + 1), execute(state, program)], cursor: value.cursor + 1 };
    }); }, limitedMotion ? 1200 : 800);
    return () => window.clearInterval(timer);
  }, [running, visible, machine.halted, program, limitedMotion]);

  function reset(value = programIndex) { setProgramIndex(value); setRunning(false); setTrace({ states: [initial()], cursor: 0 }); }
  function step() {
    setRunning(false);
    if (!machine.halted) setTrace({ states: [...trace.states.slice(0, trace.cursor + 1), execute(machine, program)], cursor: trace.cursor + 1 });
  }
  function changeStory(value: number) { setManual(true); setStory(value); }
  function selectGroup(value: Collection) { setGroup(value); setQuery(''); setLimit(12); }

  return <main className={`kn-root ${barlow.variable} ${barlowCondensed.variable} ${plexMono.variable}`} dir={data.dir} data-motion={motionMode}>
    <a href="#kn-source" className="kn-skip">{t('nav.skip')}</a>
    <header className="kn-header"><a href="#kn-top" className="kn-brand"><Cpu size={24} aria-hidden /><strong>Kernel</strong></a><LocaleSwitcher className="kn-locales" itemClassName="kn-locale" activeClassName="kn-locale-active" /></header>
    <section className="kn-story" id="kn-top" ref={section}>
      <div className="kn-pinned" ref={viewport}>
        <div className="kn-identity">{data.person.photo ? <img src={data.person.photo} alt={t('common.photoAlt')} width="64" height="72" /> : <Cpu size={40} aria-hidden />}<div><h1 dir="auto">{data.person.displayName}</h1><p dir="auto">{data.person.headline}</p></div><button type="button" aria-label={c.profile} onClick={() => { selectGroup('profile'); document.getElementById('kn-source')?.scrollIntoView({ behavior: 'instant' }); }}><ArrowUpRight size={20} aria-hidden /></button></div>
        <div className="kn-stage" data-renderer={ready && !unavailable ? 'webgl' : 'layers'}>
          <div className="kn-fallback" hidden={ready && !unavailable} style={{ '--kn-open': Math.sin(story * Math.PI) } as React.CSSProperties}><div /><div /><div /><span dir="ltr">{machine.registers[0]} · {machine.registers[1]}</span></div>
          {!unavailable && <Scene story={story} machine={machine} active={active} onReady={() => setReady(true)} onUnavailable={() => setUnavailable(true)} />}
        </div>
        <div className="kn-chapter">
          <nav aria-label={c.position}>{c.chapters.map((text, i) => <button key={text} type="button" aria-pressed={chapter === i} onClick={() => changeStory(i / 2)}>{text}</button>)}</nav>
          <h2>{c.chapters[chapter]}</h2><p>{c.text[chapter]}</p>
          <label>{c.position}<input type="range" min="0" max="1" step="0.005" value={story} onChange={event => changeStory(+event.target.value)} /></label>
          <button className="kn-follow" type="button" disabled={limitedMotion} aria-pressed={!manual} onClick={() => setManual(!manual)}>{c.follow}</button>
          <a href="#kn-source" className="kn-source-link">{c.sourceLink}<ArrowDown size={17} aria-hidden /></a>
        </div>
        <section className="kn-machine" aria-labelledby="kn-demo-title">
          <header><h2 id="kn-demo-title">{c.demo}</h2><span className="kn-machine-state" role="status">{machine.halted ? c.stopped : running ? c.running : c.ready}</span></header>
          <div className="kn-program-choice" role="group" aria-label={c.program}>{['(3 + 7) × 2', '4 × 3'].map((text, i) => <button key={i} type="button" aria-pressed={programIndex === i} onClick={() => reset(i)} dir="ltr">{text}</button>)}</div>
          <ol className="kn-code" dir="ltr">{program.map((instruction, i) => <li key={i} data-active={previousLine === i || undefined}><span>{String(i).padStart(2, '0')}</span><code>{instructionText(instruction)}</code></li>)}</ol>
          <div className="kn-registers" aria-label={c.registers} aria-live={running ? 'off' : 'polite'}>{machine.registers.map((value, i) => <div key={i}><span dir="ltr">R{i}</span><strong>{n(value)}</strong><code dir="ltr">{value.toString(2).padStart(8, '0')}</code></div>)}</div>
          <div className="kn-output"><span>{c.output}</span><strong>{machine.output.length ? machine.output.map(n).join(' · ') : '—'}</strong></div>
          <div className="kn-transport"><button type="button" className="kn-step" disabled={machine.halted} onClick={step}><StepForward size={16} aria-hidden />{c.step}</button><button type="button" disabled={machine.halted} aria-pressed={running && !machine.halted} aria-label={running ? c.pause : c.run} onClick={() => setRunning(!running)}>{running && !machine.halted ? <Pause size={16} aria-hidden /> : <Play size={16} aria-hidden />}</button><button type="button" aria-label={c.reset} title={c.reset} onClick={() => reset()}><RotateCcw size={16} aria-hidden /></button></div>
          <label className="kn-history">{c.history}<input type="range" min="0" max={Math.max(1, trace.states.length - 1)} value={trace.cursor} disabled={trace.states.length < 2} onChange={event => { setRunning(false); setTrace({ ...trace, cursor: +event.target.value }); }} /></label>
          <p className="kn-demo-note">{c.note}</p>
        </section>
      </div>
    </section>
    <section id="kn-source" className="kn-source" aria-labelledby="kn-source-title">
      <header><div><span>{data.person.location}</span><h2 id="kn-source-title">{c.source}</h2></div><label><Search size={17} aria-hidden /><input type="search" value={query} placeholder={c.search} aria-label={c.search} onChange={event => { setQuery(event.target.value); setLimit(12); }} /></label></header>
      <nav aria-label={c.source}>{groups.map(value => <button key={value} type="button" aria-pressed={group === value} onClick={() => selectGroup(value)}>{label(value)}<small>{n(records[value].length)}</small></button>)}</nav>
      <div className="kn-source-grid">{found.slice(0, limit).map(item => <Source item={item} key={item.id} />)}</div>
      {!found.length && <p role="status">{c.empty}</p>}
      {found.length > limit && <button className="kn-more" type="button" onClick={() => setLimit(limit + 24)}>{c.more}<ArrowDown size={16} aria-hidden /></button>}
    </section>
  </main>;
}

export default KernelDesign;
