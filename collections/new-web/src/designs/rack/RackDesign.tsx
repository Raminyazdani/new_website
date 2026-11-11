'use client';

import { useMemo, useRef, useState } from 'react';
import { ArrowDown, ArrowUpRight, Cable, ChevronDown, CircuitBoard, HardDrive, Search, Server } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { LocaleSwitcher } from '@/components/shared/LocaleSwitcher';
import { archivo } from '@/fonts/archivo';
import { jetbrains } from '@/fonts/jetbrains';
import { fmtNum } from '@/lib/format';
import type { SiteData } from '@/lib/types';
import { collectionLabels, makeSpecimens, matchesSpecimen, type Collection, type Specimen } from '../microcosm/specimen';
import './rack.css';

const copy = {
  en: {
    title: 'Rack', subtitle: 'Research / software / infrastructure', front: 'Front', wiring: 'Wiring', view: 'Cabinet view',
    badge: 'Owner', cabinet: 'Source cabinet', module: 'Open module', files: 'records', directory: 'Module directory',
    inspect: 'Record reader', search: 'Search this module', empty: 'No records found.', more: 'Load more records',
    connection: 'Choose a module to open its source records.', ports: 'Source records', complete: 'Read full profile',
    note: 'Module readouts show the supplied record counts.', document: 'Open record', noText: 'No additional text supplied.',
    face: 'FRONT ACCESS', back: 'PATCH ACCESS', select: 'Select a record', source: 'Source', clear: 'Clear search',
  },
  de: {
    title: 'Rack', subtitle: 'Forschung / Software / Infrastruktur', front: 'Vorne', wiring: 'Verkabelung', view: 'Schrankansicht',
    badge: 'Profil', cabinet: 'Quellenschrank', module: 'Modul öffnen', files: 'Einträge', directory: 'Modulverzeichnis',
    inspect: 'Eintrag lesen', search: 'Dieses Modul durchsuchen', empty: 'Keine Einträge gefunden.', more: 'Weitere Einträge laden',
    connection: 'Wähle ein Modul, um seine Quelleinträge zu lesen.', ports: 'Quelleinträge', complete: 'Vollständiges Profil',
    note: 'Die Anzeigen zeigen die Anzahl der vorhandenen Einträge.', document: 'Eintrag öffnen', noText: 'Kein weiterer Text vorhanden.',
    face: 'VORDERSEITE', back: 'PATCHFELD', select: 'Eintrag wählen', source: 'Quelle', clear: 'Suche löschen',
  },
  fa: {
    title: 'رک', subtitle: 'پژوهش / نرم‌افزار / زیرساخت', front: 'جلو', wiring: 'سیم‌کشی', view: 'نمای کابینت',
    badge: 'پروفایل', cabinet: 'کابینت سوابق', module: 'بازکردن ماژول', files: 'رکورد', directory: 'فهرست ماژول‌ها',
    inspect: 'خواندن رکورد', search: 'جست‌وجو در این ماژول', empty: 'رکوردی پیدا نشد.', more: 'نمایش سوابق بیشتر',
    connection: 'یک ماژول را برای خواندن سوابق منبع انتخاب کنید.', ports: 'سوابق منبع', complete: 'خواندن پروفایل کامل',
    note: 'نمایشگر هر ماژول تعداد سوابق ثبت‌شده را نشان می‌دهد.', document: 'بازکردن رکورد', noText: 'متن دیگری ثبت نشده است.',
    face: 'دسترسی جلو', back: 'پنل اتصال', select: 'انتخاب رکورد', source: 'منبع', clear: 'پاک‌کردن جست‌وجو',
  },
};

const modules: Collection[] = ['projects', 'methods', 'roles', 'papers', 'education', 'courses', 'languages', 'journey', 'profile', 'contact'];
const colors = ['#a8a6ed', '#efb45f', '#86b3ad', '#b5b4db', '#d6b78a', '#879dd3', '#c3b88e', '#a4bba7', '#d5b0a1', '#c2c5d8'];

function RecordBody({ record }: { record: Specimen }) {
  return <div className="rck-record-body">
    {record.body.map((text, i) => <p key={i} dir="auto">{text}</p>)}
    {!!record.methods?.length && <ul className="rck-tags">{record.methods.map((text, i) => <li key={i} dir="auto">{text}</li>)}</ul>}
    {!!record.facts?.length && <dl>{record.facts.map(([label, value], i) => <div key={i}><dt>{label}</dt><dd dir="auto">{value}</dd></div>)}</dl>}
    {!!record.links?.length && <div className="rck-links">{record.links.map(([label, href], i) => <a key={i} href={href} target={href.startsWith('mailto:') ? undefined : '_blank'} rel="noreferrer"><bdi>{label}</bdi><ArrowUpRight size={15} aria-hidden /></a>)}</div>}
    {record.citation && <details className="rck-citation"><summary>BibTeX</summary><pre dir="ltr">{record.citation}</pre></details>}
  </div>;
}

export function RackDesign({ data }: { data: SiteData }) {
  const t = useTranslations();
  const c = copy[data.locale];
  const records = useMemo(() => makeSpecimens(data, t), [data, t]);
  const [rear, setRear] = useState(false);
  const [group, setGroup] = useState<Collection>('projects');
  const [query, setQuery] = useState('');
  const [selected, setSelected] = useState('');
  const [limit, setLimit] = useState(14);
  const consoleRef = useRef<HTMLElement>(null);
  const filtered = records[group].filter(record => matchesSpecimen(record, query, data.locale));
  const record = filtered.find(item => item.id === selected) ?? filtered[0];
  const num = (n: number) => fmtNum(data.locale, n);
  const label = (collection: Collection) => t(collectionLabels[collection]);
  const accent = colors[modules.indexOf(group)];

  function open(collection: Collection, scroll = false) {
    setGroup(collection);
    setSelected('');
    setQuery('');
    setLimit(14);
    if (scroll && window.matchMedia('(max-width: 1000px)').matches) consoleRef.current?.scrollIntoView({ behavior: 'instant', block: 'start' });
  }

  return <main className={`rck-root ${archivo.variable} ${jetbrains.variable}`} dir={data.dir}>
    <a className="rck-skip" href="#rck-console">{t('nav.skip')}</a>
    <header className="rck-header">
      <a href="#rck-top" className="rck-brand"><Server size={22} aria-hidden /><strong>Rack</strong><span>{c.subtitle}</span></a>
      <LocaleSwitcher className="rck-locales" itemClassName="rck-locale" activeClassName="rck-locale-active" />
    </header>
    <div id="rck-top" className="rck-workspace">
      <aside className="rck-dossier">
        <div className="rck-owner">
          <div className="rck-photo">{data.person.photo ? <img src={data.person.photo} alt={data.person.displayName} width="96" height="112" /> : <CircuitBoard size={40} aria-hidden />}</div>
          <span className="rck-owner-label">{c.badge}<span dir="auto">{data.person.location}</span></span>
        </div>
        <h1 dir="auto">{data.person.displayName}</h1>
        <p className="rck-headline" dir="auto">{data.person.headline}</p>
        <button type="button" className="rck-profile-link" onClick={() => open('profile', true)}>{c.complete}<ArrowUpRight size={16} aria-hidden /></button>
        <nav className="rck-directory" aria-label={c.directory}>
          <h2>{c.directory}</h2>
          {modules.map((collection, i) => <button type="button" key={collection} onClick={() => open(collection, true)} aria-pressed={group === collection}>
            <span className="rck-port" style={{ color: colors[i] }} aria-hidden /><span>{label(collection)}</span><small>{num(records[collection].length)}</small>
          </button>)}
        </nav>
      </aside>

      <section className="rck-machine" aria-label={c.cabinet}>
        <div className="rck-machine-controls"><h2><HardDrive size={16} aria-hidden />{c.cabinet}</h2><div role="group" aria-label={c.view}>
          <button type="button" aria-pressed={!rear} onClick={() => setRear(false)}>{c.front}</button>
          <button type="button" aria-pressed={rear} onClick={() => setRear(true)}><Cable size={13} aria-hidden />{c.wiring}</button>
        </div></div>
        <div className="rck-cabinet" data-view={rear ? 'wiring' : 'front'}>
          <div className="rck-crown"><i aria-hidden /><span>{rear ? c.back : c.face}</span><i aria-hidden /></div>
          <div className="rck-rails" aria-hidden>{Array.from({ length: 24 }, (_, i) => <span key={i} />)}</div>
          <div className="rck-blades">
            {modules.map((collection, i) => {
              const count = records[collection].length;
              return <button className="rck-blade" type="button" key={collection} aria-label={`${c.module} · ${label(collection)} · ${num(count)} ${c.files}`} aria-pressed={group === collection} onClick={() => open(collection, true)} style={{ '--rck-signal': colors[i] } as React.CSSProperties}>
                <span className="rck-handle" aria-hidden />
                <span className="rck-blade-label"><strong>{label(collection)}</strong><span>{num(count)} {c.files}</span></span>
                <span className="rck-vents" aria-hidden />
                <span className="rck-leds" aria-hidden>{Array.from({ length: 5 }, (_, j) => <i key={j} data-lit={j < count || undefined} />)}</span>
                <span className="rck-connectors" aria-hidden><i /><i /><i /></span>
                <span className="rck-wire" aria-hidden />
                <span className="rck-handle" aria-hidden />
              </button>;
            })}
          </div>
          <div className="rck-plinth"><i aria-hidden /><span><span className="rck-power" aria-hidden />{c.ports}</span><i aria-hidden /></div>
        </div>
        <p className="rck-machine-note">{c.note}</p>
      </section>

      <section className="rck-console" id="rck-console" ref={consoleRef} aria-labelledby="rck-console-title" style={{ '--rck-signal': accent } as React.CSSProperties}>
        <header className="rck-console-heading"><div><span className="rck-console-status" aria-hidden />{c.inspect}</div><h2 id="rck-console-title">{label(group)}<span>{num(records[group].length)}</span></h2></header>
        <label className="rck-search"><Search size={15} aria-hidden /><input type="search" aria-label={c.search} placeholder={c.search} value={query} onChange={event => { setQuery(event.target.value); setLimit(14); }} /></label>
        <div className="rck-files" aria-label={c.select}>
          {filtered.slice(0, limit).map(item => <button type="button" key={item.id} aria-pressed={record?.id === item.id} onClick={() => setSelected(item.id)}><span className="rck-file-port" aria-hidden /><span dir="auto">{item.title}</span><ChevronDown size={14} aria-hidden /></button>)}
          {!filtered.length && <p role="status">{c.empty}</p>}
          {filtered.length > limit && <button type="button" className="rck-more" onClick={() => setLimit(limit + 20)}>{c.more}<ArrowDown size={15} aria-hidden /></button>}
        </div>
        {record && <article className="rck-reader" key={record.id}>
          <div className="rck-reader-kicker">{c.source}<span aria-hidden>↳</span></div><h3 dir="auto">{record.title}</h3>{record.subtitle && <p className="rck-record-meta" dir="auto">{record.subtitle}</p>}
          <RecordBody record={record} />
        </article>}
      </section>
    </div>
  </main>;
}

export default RackDesign;
