'use client';

import dynamic from 'next/dynamic';
import { useEffect, useMemo, useRef, useState } from 'react';
import { ArrowDown, ArrowRight, ArrowUpRight, Pause, Play, RotateCcw, Search, StepForward } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { LocaleSwitcher } from '@/components/shared/LocaleSwitcher';
import { spaceGrotesk } from '@/fonts/spacegrotesk';
import { plexMono } from '@/fonts/plex';
import { fmtNum } from '@/lib/format';
import type { SiteData } from '@/lib/types';
import { collectionLabels, makeSpecimens, matchesSpecimen, type Collection, type Specimen } from '../microcosm/specimen';
import { contours, derivative, descend, extent, levels, loss, start, type Position } from './landscape';
import './gradient.css';

const Terrain = dynamic(() => import('./Terrain'), { ssr: false });
const copy = {
  en: {
    heading: 'Finding the way down.', lab: 'An optimization sketch', source: 'Portfolio evidence', controls: 'Gradient descent',
    example: 'An analytic toy landscape. The path is calculated from the function below.', step: 'Take a step', run: 'Run', pause: 'Pause',
    reset: 'Reset', rate: 'Learning rate', steps: 'Steps', value: 'Objective', slope: 'Gradient norm', landscape: 'Landscape', contours: 'Contours',
    view: 'Surface view', rotate: 'Rotate surface', note: 'x and y are illustrative coordinates. This demonstration uses no portfolio or training data.',
    work: 'Explore the work', profile: 'Full profile', search: 'Search source records', more: 'Show more records', empty: 'No matching records.',
    reader: 'Source record', top: 'Top view', stopped: 'Converged', complete: 'Step limit reached', paths: 'Calculated trajectory',
    intro: 'Research, methods, and the work behind them.', clear: 'Clear filters',
  },
  de: {
    heading: 'Den Weg nach unten finden.', lab: 'Eine Optimierungsskizze', source: 'Belege im Portfolio', controls: 'Gradientenabstieg',
    example: 'Eine analytische Beispiellandschaft. Der Pfad wird aus der Formel unten berechnet.', step: 'Ein Schritt', run: 'Start', pause: 'Pause',
    reset: 'Zurücksetzen', rate: 'Lernrate', steps: 'Schritte', value: 'Zielfunktion', slope: 'Gradientennorm', landscape: 'Landschaft', contours: 'Höhenlinien',
    view: 'Oberflächenansicht', rotate: 'Oberfläche drehen', note: 'x und y sind illustrative Koordinaten. Die Demonstration verwendet keine Portfolio- oder Trainingsdaten.',
    work: 'Arbeiten erkunden', profile: 'Vollständiges Profil', search: 'Quelleinträge durchsuchen', more: 'Weitere Einträge', empty: 'Keine passenden Einträge.',
    reader: 'Quelleintrag', top: 'Draufsicht', stopped: 'Konvergiert', complete: 'Schrittlimit erreicht', paths: 'Berechneter Verlauf',
    intro: 'Forschung, Methoden und die Arbeit dahinter.', clear: 'Filter zurücksetzen',
  },
  fa: {
    heading: 'مسیر فرود را پیدا کنیم.', lab: 'طرحی از بهینه‌سازی', source: 'شواهد پورتفولیو', controls: 'گرادیان‌کاهشی',
    example: 'یک سطح تحلیلی و آموزشی؛ مسیر از تابع زیر محاسبه می‌شود.', step: 'یک گام', run: 'اجرا', pause: 'مکث',
    reset: 'بازنشانی', rate: 'نرخ یادگیری', steps: 'گام‌ها', value: 'تابع هدف', slope: 'اندازهٔ گرادیان', landscape: 'چشم‌انداز', contours: 'خطوط تراز',
    view: 'نمای سطح', rotate: 'چرخاندن سطح', note: 'x و y مختصات نمایشی هستند. این آزمایش از داده‌های پورتفولیو یا آموزش مدل استفاده نمی‌کند.',
    work: 'کاوش در کارها', profile: 'پروفایل کامل', search: 'جست‌وجوی سوابق منبع', more: 'نمایش سوابق بیشتر', empty: 'رکوردی پیدا نشد.',
    reader: 'رکورد منبع', top: 'نمای بالا', stopped: 'همگرا شد', complete: 'پایان تعداد گام‌ها', paths: 'مسیر محاسبه‌شده',
    intro: 'پژوهش، روش‌ها و کاری که پشت آن‌هاست.', clear: 'پاک‌کردن فیلترها',
  },
};
const collections: Collection[] = ['projects', 'methods', 'roles', 'papers', 'education', 'courses', 'languages', 'journey', 'profile', 'contact'];
const MAX_STEPS = 70;
const numberOptions = { maximumFractionDigits: 3 };
const small = (point: Position) => { const gradient = derivative(point); return Math.hypot(gradient.x, gradient.z) < 0.007; };

function Topography({ history, label }: { history: Position[]; label: string }) {
  const paths = useMemo(() => levels.map(level => contours(level).map(pair => `M${pair[0].x} ${pair[0].z}L${pair[1].x} ${pair[1].z}`).join('')), []);
  const at = history.at(-1)!;
  return <svg className="grd-topography" viewBox={`${-extent - .3} ${-extent - .3} ${extent * 2 + .6} ${extent * 2 + .6}`} role="img" aria-label={label}>
    <rect x={-extent} y={-extent} width={extent * 2} height={extent * 2} fill="#d9e2e4" />
    {paths.map((path, index) => <path key={index} d={path} fill="none" stroke="#65828b" strokeWidth=".012" />)}
    <path d={history.map((point, index) => `${index ? 'L' : 'M'}${point.x} ${point.z}`).join('')} fill="none" stroke="#355ca0" strokeWidth=".034" />
    <circle cx={at.x} cy={at.z} r=".09" fill="#da7146" stroke="#fff" strokeWidth=".026" />
  </svg>;
}

function Evidence({ record, label }: { record: Specimen; label: string }) {
  return <details className="grd-record">
    <summary><span><strong dir="auto">{record.title}</strong>{record.subtitle && <small dir="auto">{record.subtitle}</small>}</span><ArrowUpRight size={18} aria-hidden /></summary>
    <div className="grd-record-detail">
      {record.body.map((text, i) => <p key={i} dir="auto">{text}</p>)}
      {!!record.methods?.length && <ul className="grd-tags">{record.methods.map((text, i) => <li key={i} dir="auto">{text}</li>)}</ul>}
      {!!record.facts?.length && <dl>{record.facts.map(([key, value], i) => <div key={i}><dt>{key}</dt><dd dir="auto">{value}</dd></div>)}</dl>}
      {!!record.links?.length && <div className="grd-record-links" aria-label={label}>{record.links.map(([text, url], i) => <a href={url} key={i} target={url.startsWith('mailto:') ? undefined : '_blank'} rel="noreferrer"><bdi>{text}</bdi><ArrowUpRight size={15} aria-hidden /></a>)}</div>}
      {record.citation && <pre className="grd-bib" dir="ltr">{record.citation}</pre>}
    </div>
  </details>;
}

export function GradientDesign({ data }: { data: SiteData }) {
  const t = useTranslations();
  const c = copy[data.locale];
  const records = useMemo(() => makeSpecimens(data, t), [data, t]);
  const [history, setHistory] = useState<Position[]>([{ ...start }]);
  const [rate, setRate] = useState(0.18);
  const [running, setRunning] = useState(false);
  const [view, setView] = useState<'landscape' | 'contours'>('landscape');
  const [angle, setAngle] = useState(-12);
  const [rendered, setRendered] = useState(false);
  const [unavailable, setUnavailable] = useState(false);
  const [visible, setVisible] = useState(true);
  const [activeDocument, setActiveDocument] = useState(true);
  const [group, setGroup] = useState<Collection>('projects');
  const [query, setQuery] = useState('');
  const [limit, setLimit] = useState(12);
  const stage = useRef<HTMLElement>(null);
  const point = history.at(-1)!;
  const slope = derivative(point);
  const finished = history.length > MAX_STEPS || small(point);
  const n = (value: number) => fmtNum(data.locale, value, numberOptions);
  const found = records[group].filter(record => matchesSpecimen(record, query, data.locale));
  const label = (collection: Collection) => t(collectionLabels[collection]);

  useEffect(() => {
    const observer = new IntersectionObserver(([entry]) => setVisible(entry.isIntersecting));
    if (stage.current) observer.observe(stage.current);
    const update = () => setActiveDocument(!document.hidden);
    document.addEventListener('visibilitychange', update);
    update();
    return () => { observer.disconnect(); document.removeEventListener('visibilitychange', update); };
  }, []);

  useEffect(() => {
    if (!running || !visible || !activeDocument || finished) return;
    const timer = window.setInterval(() => setHistory(value => {
      const last = value.at(-1)!;
      if (value.length > MAX_STEPS || small(last)) return value;
      return [...value, descend(last, rate)];
    }), window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 950 : 380);
    return () => window.clearInterval(timer);
  }, [running, rate, visible, activeDocument, finished]);

  function step() {
    setRunning(false);
    if (!finished) setHistory([...history, descend(point, rate)]);
  }
  function reset() { setRunning(false); setHistory([{ ...start }]); }
  function selectGroup(value: Collection) { setGroup(value); setLimit(12); setQuery(''); }
  function profile() {
    selectGroup('profile');
    document.getElementById('grd-evidence')?.scrollIntoView({ behavior: 'instant' });
  }

  return <main className={`grd-root ${spaceGrotesk.variable} ${plexMono.variable}`} dir={data.dir}>
    <a className="grd-skip" href="#grd-evidence">{t('nav.skip')}</a>
    <header className="grd-header"><a href="#grd-top" className="grd-brand"><span aria-hidden>∇</span><strong>Gradient</strong></a><LocaleSwitcher className="grd-locales" itemClassName="grd-locale" activeClassName="grd-locale-active" /></header>
    <section className="grd-hero" id="grd-top" aria-labelledby="grd-person">
      <div className="grd-identity">
        <div className="grd-person-label">{data.person.headline}</div>
        <h1 id="grd-person" dir="auto">{data.person.displayName}</h1>
        <div className="grd-photo-line">{data.person.photo ? <img src={data.person.photo} alt={t('common.photoAlt')} width="70" height="70" /> : <span className="grd-photo-fallback" aria-hidden>∇</span>}<p dir="auto">{data.person.location}</p></div>
        <p className="grd-summary" dir="auto">{(data.person.intro || data.person.statement).slice(0, 255)}{(data.person.intro || data.person.statement).length > 255 ? '…' : ''}</p>
        <button type="button" className="grd-profile-button" onClick={profile}>{c.profile}<ArrowUpRight size={17} aria-hidden /></button>
        <a href="#grd-evidence" className="grd-work-link">{c.work}<ArrowDown size={17} aria-hidden /></a>
      </div>
      <div className="grd-experiment">
        <div className="grd-plot-heading"><span>{c.lab}</span><div role="group" aria-label={c.view}><button type="button" aria-pressed={view === 'landscape'} onClick={() => setView('landscape')}>{c.landscape}</button><button type="button" aria-pressed={view === 'contours'} onClick={() => setView('contours')}>{c.contours}</button></div></div>
        <figure className="grd-stage" ref={stage} data-renderer={rendered && !unavailable ? 'webgl' : 'topography'} aria-label={c.paths}>
          <div className="grd-fallback" hidden={rendered && !unavailable}><Topography history={history} label={c.top} /></div>
          {!unavailable && <Terrain history={history} angle={angle} view={view} onReady={() => setRendered(true)} onUnavailable={() => setUnavailable(true)} />}
          <div className="grd-plot-caption"><span className="grd-path-key" aria-hidden />{c.paths}<span dir="ltr">x = {n(point.x)} · y = {n(point.z)}</span></div>
        </figure>
        <div className="grd-controls" aria-label={c.controls}>
          <div className="grd-buttons"><button type="button" className="grd-step" onClick={step} disabled={finished}><StepForward size={16} aria-hidden />{c.step}</button><button type="button" onClick={() => setRunning(!running)} disabled={finished} aria-pressed={running && !finished}>{running && !finished ? <Pause size={15} aria-hidden /> : <Play size={15} aria-hidden />}{running && !finished ? c.pause : c.run}</button><button type="button" aria-label={c.reset} title={c.reset} onClick={reset}><RotateCcw size={16} aria-hidden /></button></div>
          <label className="grd-rate" htmlFor="grd-rate"><span>{c.rate}<output>{n(rate)}</output></span><input id="grd-rate" type="range" min="0.05" max="0.4" step="0.01" value={rate} onChange={event => setRate(+event.target.value)} /></label>
          <label className="grd-rotation" htmlFor="grd-angle"><span>{c.rotate}</span><input id="grd-angle" type="range" min="-55" max="55" value={angle} onChange={event => setAngle(+event.target.value)} /></label>
        </div>
        <dl className="grd-values" aria-live={running ? 'off' : 'polite'}><div><dt>{c.steps}</dt><dd>{n(history.length - 1)}</dd></div><div><dt>{c.value}</dt><dd>{n(loss(point))}</dd></div><div><dt>{c.slope}</dt><dd>{n(Math.hypot(slope.x, slope.z))}</dd></div>{finished && <div className="grd-finished"><dt>{small(point) ? c.stopped : c.complete}</dt></div>}</dl>
        <div className="grd-formula"><p>{c.example}</p><code dir="ltr">f(x,y) = 0.13(y − 0.4x²)² + 0.20(x + 0.8)²</code><p>{c.note}</p></div>
      </div>
    </section>

    <section id="grd-evidence" className="grd-evidence" aria-labelledby="grd-evidence-title">
      <header><div><span>{c.source}</span><h2 id="grd-evidence-title">{c.intro}</h2></div><label className="grd-search"><Search size={17} aria-hidden /><input type="search" value={query} aria-label={c.search} placeholder={c.search} onChange={event => { setQuery(event.target.value); setLimit(12); }} /></label></header>
      <div className="grd-archive">
        <nav className="grd-groups" aria-label={c.source}>{collections.map(collection => <button type="button" key={collection} aria-pressed={group === collection} onClick={() => selectGroup(collection)}><span>{label(collection)}</span><small>{n(records[collection].length)}</small></button>)}</nav>
        <div className="grd-documents">
          <div className="grd-document-heading"><h3>{label(group)}</h3><span>{n(found.length)}<ArrowRight size={14} aria-hidden /></span></div>
          <div className="grd-document-grid">{found.slice(0, limit).map(record => <Evidence key={record.id} record={record} label={c.reader} />)}</div>
          {!found.length && <p className="grd-empty" role="status">{c.empty}</p>}
          {found.length > limit && <button className="grd-more" type="button" onClick={() => setLimit(limit + 18)}>{c.more}<ArrowDown size={16} aria-hidden /></button>}
        </div>
      </div>
    </section>
  </main>;
}

export default GradientDesign;
