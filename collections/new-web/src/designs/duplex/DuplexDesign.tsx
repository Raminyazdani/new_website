'use client';

import { useCallback, useMemo, useState } from 'react';
import { ArrowDown, ArrowLeftRight, ArrowUpRight, ChevronLeft, ChevronRight, Expand, Library, Search, X } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { Dialog } from '@/components/kit/Dialog';
import { CopyButton } from '@/components/shared/CopyButton';
import { LocaleSwitcher } from '@/components/shared/LocaleSwitcher';
import { ProfilePhoto } from '@/components/shared/ProfilePhoto';
import { allProjects } from '@/lib/derive';
import { fmtNum, seqNo } from '@/lib/format';
import type { SiteData } from '@/lib/types';
import { collectionLabels, makeSpecimens, matchesSpecimen, type Collection, type Specimen } from '@/designs/microcosm/specimen';
import './duplex.css';

const copy = {
  en: { sub: 'Biology ↔ Code', lede: 'Two readings. One body of work.', top: 'Work strand', bottom: 'Method strand', overview: 'Overview', start: 'First visible project', zoom: 'Visible projects', previous: 'Previous range', next: 'Next range', detail: 'Read annotation', align: 'Paired', annotations: 'Annotated', legend: 'Upper strand: supplied projects. Lower strand: their supplied tags. Alignment expresses a record–tag link, not a biological sequence.', noTags: 'No supplied tags', library: 'Complete library', browse: 'Browse all records', search: 'Search every record…', all: 'All', noMatch: 'No matching records.', source: 'Source annotation', related: 'Projects using this tag', range: 'Project range', select: 'Select a project or a tag', count: 'records', profile: 'Profile', tag: 'Supplied tag', clear: 'Clear tag focus', open: 'Open record', back: 'Back to library' },
  de: { sub: 'Biologie ↔ Code', lede: 'Zwei Lesarten. Ein gemeinsames Werk.', top: 'Arbeitsstrang', bottom: 'Methodenstrang', overview: 'Übersicht', start: 'Erstes sichtbares Projekt', zoom: 'Sichtbare Projekte', previous: 'Vorheriger Bereich', next: 'Nächster Bereich', detail: 'Annotation lesen', align: 'Gepaart', annotations: 'Annotiert', legend: 'Oben: vorhandene Projekte. Unten: ihre angegebenen Tags. Die Ausrichtung zeigt Eintragsbezüge, keine biologische Sequenz.', noTags: 'Keine angegebenen Tags', library: 'Vollständige Bibliothek', browse: 'Alle Einträge ansehen', search: 'Alle Einträge durchsuchen…', all: 'Alle', noMatch: 'Keine passenden Einträge.', source: 'Quellannotation', related: 'Projekte mit diesem Tag', range: 'Projektbereich', select: 'Ein Projekt oder einen Tag auswählen', count: 'Einträge', profile: 'Profil', tag: 'Vorhandener Tag', clear: 'Tag-Fokus aufheben', open: 'Eintrag öffnen', back: 'Zur Bibliothek' },
  fa: { sub: 'زیست‌شناسی ↔ کد', lede: 'دو خوانش از یک مجموعهٔ کار.', top: 'رشتهٔ کار', bottom: 'رشتهٔ روش', overview: 'نمای کلی', start: 'نخستین پروژهٔ نمایان', zoom: 'پروژه‌های نمایان', previous: 'بازهٔ قبلی', next: 'بازهٔ بعدی', detail: 'خواندن یادداشت', align: 'هم‌تراز', annotations: 'مشروح', legend: 'رشتهٔ بالا: پروژه‌های ثبت‌شده. پایین: برچسب‌های همان پروژه. هم‌ترازی رابطهٔ رکورد و برچسب است؛ توالی زیستی نیست.', noTags: 'بدون برچسب ثبت‌شده', library: 'کتابخانهٔ کامل', browse: 'دیدن تمام رکوردها', search: 'جست‌وجو در تمام رکوردها…', all: 'همه', noMatch: 'رکوردی پیدا نشد.', source: 'یادداشت منبع', related: 'پروژه‌های دارای این برچسب', range: 'بازهٔ پروژه‌ها', select: 'یک پروژه یا برچسب انتخاب کنید', count: 'رکورد', profile: 'پروفایل', tag: 'برچسب ثبت‌شده', clear: 'پاک کردن برچسب انتخابی', open: 'باز کردن رکورد', back: 'بازگشت به کتابخانه' },
};
const categories = ['omics', 'structural', 'ml', 'software', 'biotech'];
const allCollections = Object.keys(collectionLabels) as Collection[];
type Row = { id: string; collection: Collection; item: Specimen };
const lc = (s: string) => s.normalize('NFKC').toLocaleLowerCase('en');

export function DuplexDesign({ data }: { data: SiteData }) {
  const t = useTranslations(); const s = copy[data.locale];
  const projects = useMemo(() => allProjects(data), [data]);
  const bank = useMemo(() => makeSpecimens(data, t), [data, t]);
  const rows = useMemo<Row[]>(() => allCollections.flatMap((collection) => bank[collection].map((item, i) => ({ id: `${collection}:${i}:${item.id}`, collection, item }))), [bank]);
  const [start, setStart] = useState(0); const [width, setWidth] = useState(4); const [active, setActive] = useState(0);
  const [view, setView] = useState<'paired' | 'annotated'>('paired'); const [tag, setTag] = useState<string | null>(null);
  const [library, setLibrary] = useState(false); const [folder, setFolder] = useState<Collection | 'all'>('all'); const [query, setQuery] = useState(''); const [record, setRecord] = useState<string | null>(null);
  const closeLibrary = useCallback(() => setLibrary(false), []);
  const visible = projects.slice(start, start + width); const project = projects[active];
  const current = rows.find((r) => r.id === record);
  const filtered = rows.filter((r) => (folder === 'all' || r.collection === folder) && matchesSpecimen(r.item, query, data.locale));
  const tagged = tag ? projects.filter((p) => p.tags.some((v) => lc(v) === lc(tag))) : [];
  const method = tag ? rows.find((r) => r.collection === 'methods' && lc(r.item.title) === lc(tag)) : undefined;
  const n = (value: number) => fmtNum(data.locale, value); const num = (value: number) => seqNo(data.locale, value);
  const move = (value: number) => { const next = Math.max(0, Math.min(Math.max(0, projects.length - width), value)); setStart(next); setActive(next); setTag(null); };
  const open = (row?: Row) => { setRecord(row?.id ?? null); setLibrary(true); };
  const openProject = (id: string) => open(rows.find((r) => r.collection === 'projects' && r.item.id === id));
  const openLibrary = () => { setFolder('all'); setQuery(''); open(); };
  const profile = rows.find((r) => r.collection === 'profile');

  return <main className="duplex" dir={data.dir}>
    <header className="dpx-top"><a href="#dpx-top" className="dpx-brand"><span aria-hidden>║</span> DUPLEX</a><span className="dpx-top-label">{s.sub}</span><LocaleSwitcher className="dpx-langs" itemClassName="dpx-lang" activeClassName="dpx-lang-on" /><button type="button" className="dpx-profile" aria-label={s.profile} onClick={() => open(profile)}><ProfilePhoto src={data.person.photo} alt={data.person.displayName} className="dpx-face" size={100} priority /><span>{data.person.displayName}</span></button></header>
    <section id="dpx-top" className="dpx-title-row" aria-labelledby="dpx-title"><div className="dpx-title"><h1 id="dpx-title">DU<span>P</span>LEX</h1><p>{s.lede}</p></div><div className="dpx-title-figure" aria-hidden="true"><span>01—</span><div><i /><i /><i /><i /><i /></div><span>—02</span></div><button type="button" className="dpx-library-button" onClick={openLibrary}><Library size={17} aria-hidden />{s.library}<ArrowUpRight size={17} aria-hidden /></button></section>

    <section className="dpx-browser" aria-label={s.range}>
      <div className="dpx-overview-heading"><h2>{s.overview}<span>{n(projects.length)} {t('nav.projects')}</span></h2><span>{num(start + 1)}—{num(Math.min(start + width, projects.length))} / {num(projects.length)}</span></div>
      <div className="dpx-overview"><div className="dpx-overview-columns" aria-hidden="true">{projects.map((p, i) => <span key={p.id} data-category={p.category} style={{ opacity: i >= start && i < start + width ? 1 : .35 }}><i style={{ height: `${20 + Math.min(p.tags.length, 6) * 7}%` }} /></span>)}</div><div className="dpx-overview-window" aria-hidden="true" style={{ width: `${width / Math.max(1, projects.length) * 100}%`, insetInlineStart: `${start / Math.max(1, projects.length) * 100}%` }} /><input type="range" aria-label={s.start} min="0" max={Math.max(0, projects.length - width)} value={start} step="1" onChange={(e) => move(Number(e.target.value))} /></div>
      <div className="dpx-toolbar"><div className="dpx-pair-views" role="group" aria-label={s.range}><button type="button" aria-pressed={view === 'paired'} onClick={() => setView('paired')}><ArrowLeftRight size={16} aria-hidden />{s.align}</button><button type="button" aria-pressed={view === 'annotated'} onClick={() => setView('annotated')}>{s.annotations}</button></div><div className="dpx-zoom"><label htmlFor="dpx-width">{s.zoom}</label><select id="dpx-width" value={width} onChange={(e) => { const value = Number(e.target.value); setWidth(value); setStart(Math.min(start, Math.max(0, projects.length - value))); }}>{[1, 2, 4, 6].map((w) => <option key={w} value={w}>{n(w)}</option>)}</select></div><div className="dpx-range-buttons"><button type="button" aria-label={s.previous} disabled={!start} onClick={() => move(start - width)}><ChevronLeft size={20} aria-hidden /></button><button type="button" aria-label={s.next} disabled={start + width >= projects.length} onClick={() => move(start + width)}><ChevronRight size={20} aria-hidden /></button></div></div>
      <div className="dpx-alignment" data-view={view} style={{ '--dpx-cols': visible.length || 1 } as React.CSSProperties}>
        <div className="dpx-strand-label dpx-work-label"><span>01</span>{s.top}<ArrowDown size={14} aria-hidden /></div>
        <div className="dpx-work-rail">{visible.map((p, i) => <button key={p.id} type="button" aria-pressed={active === start + i} data-category={p.category} onClick={() => { setActive(start + i); setTag(null); }}><span className="dpx-coordinate">{num(start + i + 1)}<i>{t(`categories.${p.category}`)}</i></span><h3 dir="auto">{p.title}</h3>{view === 'annotated' && <p>{p.description}</p>}<span className="dpx-read">{s.detail}<ArrowUpRight size={15} aria-hidden /></span></button>)}</div>
        <div className="dpx-link-rail" aria-hidden="true">{visible.map((p, i) => <div key={p.id} data-active={active === start + i || undefined}><span /><b>{num(start + i + 1)}</b><span /></div>)}</div>
        <div className="dpx-method-rail">{visible.map((p, i) => <div key={p.id} data-active={active === start + i || undefined}><span className="dpx-method-num">{num(start + i + 1)} ↕</span>{p.tags.length ? <ul>{p.tags.map((v, j) => <li key={`${v}:${j}`}><button type="button" aria-pressed={tag === v && active === start + i} onClick={() => { setActive(start + i); setTag(v); }}>{v}</button></li>)}</ul> : <p>{s.noTags}</p>}</div>)}</div>
        <div className="dpx-strand-label dpx-method-label"><span>02</span>{s.bottom}<ArrowUpRight size={14} aria-hidden /></div>
      </div>
      <p className="dpx-legend">{s.legend}</p>
    </section>

    <section className="dpx-annotation" aria-label={s.source}>
      <div className="dpx-annotation-index"><span>{s.source}</span><b>{num(active + 1)}</b><span>{tag ? s.tag : t('nav.projects')}</span></div>
      <div className="dpx-annotation-body"><div className="dpx-annotation-heading"><h2 dir="auto">{tag ?? project?.title ?? s.select}</h2>{tag && <button type="button" aria-label={s.clear} onClick={() => setTag(null)}><X size={19} aria-hidden /></button>}</div>{tag ? <><p>{method?.item.body.join('\n\n') || method?.item.subtitle || s.related}</p><div className="dpx-tagged">{tagged.map((p) => <button type="button" key={p.id} onClick={() => openProject(p.id)}>{p.title}<ArrowUpRight size={14} aria-hidden /></button>)}</div>{method && <button type="button" className="dpx-text-link" onClick={() => open(method)}>{s.open}<Expand size={15} aria-hidden /></button>}</> : project && <><p>{project.description}</p>{project.metric && <p>{project.metric}</p>}<button type="button" className="dpx-text-link" onClick={() => openProject(project.id)}>{s.open}<ArrowUpRight size={15} aria-hidden /></button></>}</div>
    </section>
    <footer className="dpx-footer"><span>{data.person.displayName}</span><button type="button" onClick={openLibrary}>{s.browse}<b>{n(rows.length)}</b><ArrowUpRight size={16} aria-hidden /></button></footer>

    <Dialog open={library} onClose={closeLibrary} title={s.library} className="dpx-dialog" overlayClassName="dpx-overlay" closeClassName="dpx-dialog-close">
      {current ? <article className="dpx-record"><button type="button" className="dpx-text-link" onClick={() => { setRecord(null); requestAnimationFrame(() => document.getElementById('dpx-library-search')?.focus()); }}>{s.back}</button><span className="dpx-record-type">{t(collectionLabels[current.collection])}</span><h3 tabIndex={-1} id="dpx-record-title" dir="auto">{current.item.title}</h3><p className="dpx-record-sub">{current.item.subtitle}</p>{current.collection === 'profile' && <ProfilePhoto src={data.person.photo} alt={data.person.displayName} className="dpx-record-face" size={200} />}{current.item.body.map((p, i) => <p key={i}>{p}</p>)}{current.item.methods?.length ? <ul>{current.item.methods.map((m, i) => <li key={i}>{m}</li>)}</ul> : null}{current.item.facts?.length ? <dl>{current.item.facts.map(([k, v], i) => <div key={i}><dt>{k}</dt><dd>{v}</dd></div>)}</dl> : null}<div className="dpx-record-links">{current.item.links?.map(([k, v], i) => <a key={i} href={v} target={v.startsWith('mailto:') ? undefined : '_blank'} rel="noreferrer">{k}<ArrowUpRight size={14} aria-hidden /></a>)}{current.item.citation && <CopyButton value={current.item.citation}>{t('common.copyBibtex')}</CopyButton>}</div></article> : <><label className="dpx-library-search"><Search size={18} aria-hidden /><input id="dpx-library-search" type="search" aria-label={s.search} placeholder={s.search} value={query} onChange={(e) => setQuery(e.target.value)} /></label><div className="dpx-library-filters" role="group" aria-label={s.library}><button type="button" aria-pressed={folder === 'all'} onClick={() => setFolder('all')}>{s.all}</button>{allCollections.map((c) => <button key={c} type="button" aria-pressed={folder === c} onClick={() => setFolder(c)}>{t(collectionLabels[c])}</button>)}</div><ul className="dpx-library-list">{filtered.map((r) => <li key={r.id}><button type="button" onClick={() => { setRecord(r.id); requestAnimationFrame(() => document.getElementById('dpx-record-title')?.focus()); }}><span dir="auto"><strong>{r.item.title}</strong><small>{r.item.subtitle}</small></span><ArrowUpRight size={18} aria-hidden /></button></li>)}</ul>{!filtered.length && <p>{s.noMatch}</p>}</>}
    </Dialog>
  </main>;
}
export default DuplexDesign;
