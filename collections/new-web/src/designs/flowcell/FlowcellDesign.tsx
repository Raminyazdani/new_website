'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { ArrowDown, ArrowUpRight, ChevronLeft, ChevronRight, CircuitBoard, Search } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { LocaleSwitcher } from '@/components/shared/LocaleSwitcher';
import { ProfilePhoto } from '@/components/shared/ProfilePhoto';
import { barlow, barlowCondensed } from '@/fonts/barlow';
import { plexMono } from '@/fonts/plex';
import { fmtNum, seqNo } from '@/lib/format';
import type { SiteData } from '@/lib/types';
import { collectionLabels, makeSpecimens, matchesSpecimen, type Collection, type Specimen } from '../microcosm/specimen';
import { FlowChamber } from './FlowChamber';
import './flowcell.css';

const LANG = {
  en: {
    console: 'Console', dossier: 'Record index', strap: 'Portfolio routing instrument',
    cartridge: 'OPTICAL FLOW CELL', channel: 'Lane', patch: 'Select lane',
    bank: 'Record bank', page: 'Bank page', stages: ['Source', 'Methods', 'Artifact'],
    stageTitles: ['Text on file', 'Tags on file', 'Links on file'],
    blank: ['No text supplied.', 'No method tags supplied.', 'No artifact linked.'],
    previous: 'Previous bank page', next: 'Next bank page', inspect: 'Open full record',
    show: 'Show more', showLess: 'Show fewer', help: 'Choose a bank and lane, then inspect the record at each stage.',
    note: 'Illustrated instrument for browsing records. The flow is a navigation aid.',
    filing: 'Record directory', find: 'Search records', empty: 'No matching records.',
    record: 'Record', tags: 'Tags', links: 'Links', manual: 'FILE INDEX / FC-06',
  },
  de: {
    console: 'Konsole', dossier: 'Register', strap: 'Navigationsinstrument fürs Portfolio',
    cartridge: 'OPTISCHE DURCHFLUSSZELLE', channel: 'Kanal', patch: 'Kanal wählen',
    bank: 'Eintragsbank', page: 'Bankseite', stages: ['Quelle', 'Methoden', 'Artefakt'],
    stageTitles: ['Hinterlegter Text', 'Hinterlegte Stichwörter', 'Hinterlegte Links'],
    blank: ['Kein Text vorhanden.', 'Keine Methoden-Tags vorhanden.', 'Kein Artefakt verlinkt.'],
    previous: 'Vorherige Bankseite', next: 'Nächste Bankseite', inspect: 'Vollständigen Eintrag öffnen',
    show: 'Mehr anzeigen', showLess: 'Weniger anzeigen', help: 'Bank und Kanal wählen und den Eintrag an jeder Stufe ansehen.',
    note: 'Illustration zur Navigation durch die Portfolioeinträge.',
    filing: 'Eintragsregister', find: 'Einträge durchsuchen', empty: 'Keine passenden Einträge.',
    record: 'Eintrag', tags: 'Stichwörter', links: 'Links', manual: 'REGISTER / FC-06',
  },
  fa: {
    console: 'کنسول', dossier: 'نمایهٔ سوابق', strap: 'دستگاه مرور پورتفولیو',
    cartridge: 'محفظهٔ نوری جریان', channel: 'کانال', patch: 'انتخاب کانال',
    bank: 'گروه سوابق', page: 'صفحهٔ گروه', stages: ['منبع', 'روش‌ها', 'پیوندها'],
    stageTitles: ['متن ثبت‌شده', 'برچسب‌های ثبت‌شده', 'پیوندهای ثبت‌شده'],
    blank: ['متنی ثبت نشده است.', 'برچسب روشی ثبت نشده است.', 'پیوندی ثبت نشده است.'],
    previous: 'صفحهٔ قبلی گروه', next: 'صفحهٔ بعدی گروه', inspect: 'مشاهدهٔ رکورد کامل',
    show: 'نمایش بیشتر', showLess: 'نمایش کمتر', help: 'گروه و کانال را انتخاب کنید و اطلاعات هر مرحله را ببینید.',
    note: 'تصویرسازی دستگاه برای مرور سوابق؛ مسیر جریان فقط راهنمای پیمایش است.',
    filing: 'فهرست سوابق', find: 'جست‌وجوی سوابق', empty: 'رکوردی پیدا نشد.',
    record: 'رکورد', tags: 'برچسب‌ها', links: 'پیوندها', manual: 'نمایهٔ سوابق / FC-06',
  },
};
const BANKS = ['projects', 'roles', 'papers'] as const;
const INDEX: Collection[] = ['projects', 'roles', 'papers', 'methods', 'education', 'courses', 'languages', 'journey', 'profile', 'contact'];
const LANES = 6;
const FILES = 14;

function RecordLinks({ item, className }: { item: Specimen; className: string }) {
  return <div className={className}>{item.links?.map(([text, href], index) => (
    <a key={index} href={href} target={href.startsWith('mailto:') ? undefined : '_blank'} rel="noreferrer"><bdi>{text}</bdi><ArrowUpRight size={14} aria-hidden /></a>
  ))}</div>;
}

function Label({ children }: { children: React.ReactNode }) { return <span className="fc-label">{children}</span>; }

export function FlowcellDesign({ data }: { data: SiteData }) {
  const t = useTranslations();
  const l = LANG[data.locale];
  const person = data.person;
  const records = useMemo(() => makeSpecimens(data, t), [data, t]);
  const [bank, setBank] = useState<(typeof BANKS)[number]>('projects');
  const [page, setPage] = useState(0);
  const [lane, setLane] = useState(0);
  const [stage, setStage] = useState(0);
  const [group, setGroup] = useState<Collection>('projects');
  const [recordId, setRecordId] = useState<string | null>(null);
  const [query, setQuery] = useState('');
  const [limit, setLimit] = useState(FILES);
  const viewport = useRef<HTMLDivElement>(null);
  const detailRef = useRef<HTMLElement>(null);
  const pages = Math.max(1, Math.ceil(records[bank].length / LANES));
  const pageRecords = records[bank].slice(page * LANES, (page + 1) * LANES);
  const entry = pageRecords[lane];
  const found = records[group].filter((item) => matchesSpecimen(item, query, data.locale));
  const entryOnFile = found.find((item) => item.id === recordId) ?? found[0];
  const visibleFiles = found.slice(0, limit);
  const num = (n: number) => fmtNum(data.locale, n);
  const seq = (n: number) => seqNo(data.locale, n);
  const label = (c: Collection) => t(collectionLabels[c]);

  useEffect(() => {
    const element = viewport.current;
    if (!element) return;
    let visible = false;
    const sync = () => { element.dataset.flowing = String(visible && !document.hidden); };
    const observer = new IntersectionObserver(([change]) => { visible = change.isIntersecting; sync(); }, { threshold: .08 });
    observer.observe(element);
    document.addEventListener('visibilitychange', sync);
    return () => { observer.disconnect(); document.removeEventListener('visibilitychange', sync); };
  }, []);

  function setRecordGroup(collection: Collection, id?: string) {
    setGroup(collection);
    setRecordId(id ?? null);
    setQuery('');
    const position = id ? records[collection].findIndex((record) => record.id === id) : -1;
    setLimit(Math.max(FILES, position + 1));
  }

  function readOnFile() {
    if (!entry) return;
    setRecordGroup(bank, entry.id);
    detailRef.current?.focus({ preventScroll: true });
  }

  return <div id="fc-top" className={`fc-root ${barlow.variable} ${barlowCondensed.variable} ${plexMono.variable}`} dir={data.dir}>
    <a className="fc-skip" href="#fc-main">{t('nav.skip')}</a>
    <header className="fc-header">
      <div className="fc-wrap">
        <a href="#fc-top" className="fc-mark"><CircuitBoard size={21} strokeWidth={1.55} aria-hidden /><span>FLOWCELL</span><small dir="ltr">FC·06</small></a>
        <nav aria-label={t('nav.menu')}><a href="#fc-console">{l.console}</a><a href="#fc-dossier">{l.dossier}</a><a href="#fc-contact">{t('nav.contact')}</a></nav>
        <LocaleSwitcher className="fc-locales" itemClassName="fc-locale" activeClassName="fc-locale-active" />
      </div>
    </header>
    <main id="fc-main">
      <div className="fc-lab">
        <div className="fc-wrap">
          <section className="fc-intro" aria-labelledby="fc-name">
            <div className="fc-intro-type">
              <Label>{l.strap}</Label>
              <h1 id="fc-name">{person.displayName}</h1>
              <p dir="auto">{person.headline}</p>
            </div>
            <div className="fc-pass">
              <ProfilePhoto src={person.photo} alt={t('common.photoAlt')} priority size={240} className="fc-portrait" imgClassName="fc-photo-img" monogramClassName="fc-photo-empty" />
              <div><span dir="ltr">FIELD ID / FC-06</span><strong dir="auto">{person.displayName}</strong><p dir="auto">{person.location}</p></div>
            </div>
          </section>

          <section id="fc-console" className="fc-console" aria-label={l.console}>
            <div className="fc-metal">
              <span className="fc-fastener fc-fastener-a" aria-hidden /><span className="fc-fastener fc-fastener-b" aria-hidden />
              <span className="fc-fastener fc-fastener-c" aria-hidden /><span className="fc-fastener fc-fastener-d" aria-hidden />
              <div className="fc-faceplate">
                <div className="fc-face-title"><span className="fc-face-led" aria-hidden /><strong>{l.cartridge}</strong></div>
                <span className="fc-face-model" dir="ltr">FC–06 &nbsp; / &nbsp; 6 CH</span>
                <span className="fc-vents" aria-hidden />
              </div>
              <div className="fc-instrument">
                <div className="fc-flow-module">
                  <div className="fc-glass-well" ref={viewport}>
                    <FlowChamber active={lane} gate={stage} enabled={pageRecords.length} />
                  </div>
                  <div className="fc-keys" role="group" aria-label={l.patch} dir="ltr">
                    {Array.from({ length: LANES }, (_, index) => <button key={index} type="button" className="fc-lane-key"
                      aria-pressed={lane === index && !!pageRecords[index]} disabled={!pageRecords[index]}
                      aria-label={`${l.channel} ${num(index + 1)}${pageRecords[index] ? `: ${pageRecords[index].title}` : ''}`}
                      onClick={() => setLane(index)}>
                      <span aria-hidden className="fc-key-led" /><span>{seq(index + 1)}</span>
                    </button>)}
                  </div>
                </div>
                <div className="fc-readout" aria-live="polite" aria-atomic="true">
                  <div className="fc-readout-bar"><span>{l.channel} <bdi>{seq(lane + 1)}</bdi></span><span>{l.stageTitles[stage]}</span></div>
                  {entry ? <>
                    <h2 dir="auto">{entry.title}</h2>
                    {entry.subtitle && <p className="fc-entry-caption" dir="auto">{entry.subtitle}</p>}
                    <div className="fc-readout-payload">
                      {stage === 0 && (entry.body.length ? <p dir="auto" className="fc-snippet">{entry.body[0]}</p> : <p>{l.blank[0]}</p>)}
                      {stage === 1 && (entry.methods?.length ? <ul className="fc-console-tags">{entry.methods.map((tag, index) => <li key={index} dir="auto">{tag}</li>)}</ul> : <p>{l.blank[1]}</p>)}
                      {stage === 2 && (entry.links?.length ? <RecordLinks item={entry} className="fc-console-links" /> : <p>{l.blank[2]}</p>)}
                    </div>
                    <a className="fc-readout-link" href="#fc-detail" onClick={readOnFile}>{l.inspect}<ArrowDown size={15} aria-hidden /></a>
                  </> : <p className="fc-readout-empty">{l.empty}</p>}
                </div>
              </div>
              <div className="fc-controls">
                <div className="fc-control-block fc-bank-block">
                  <Label>{l.bank}</Label>
                  <div className="fc-press-group" role="group" aria-label={l.bank}>
                    {BANKS.map((value) => <button type="button" key={value} aria-pressed={value === bank} onClick={() => { setBank(value); setPage(0); setLane(0); setStage(0); }}>{label(value)}</button>)}
                  </div>
                </div>
                <div className="fc-control-block fc-stage-block">
                  <Label>{l.cartridge}</Label>
                  <div className="fc-press-group fc-gates" role="group" aria-label={l.cartridge}>
                    {l.stages.map((value, index) => <button type="button" key={value} aria-pressed={stage === index} onClick={() => setStage(index)}><bdi>{seq(index + 1)}</bdi>{value}</button>)}
                  </div>
                </div>
                <div className="fc-control-block fc-page-block">
                  <Label>{l.page}</Label>
                  <div className="fc-page-keys">
                    <button type="button" aria-label={l.previous} disabled={page === 0} onClick={() => { setPage(page - 1); setLane(0); }}><ChevronLeft size={18} aria-hidden /></button>
                    <output aria-live="polite" dir="ltr">{seq(page + 1)} / {seq(pages)}</output>
                    <button type="button" aria-label={l.next} disabled={page + 1 >= pages} onClick={() => { setPage(page + 1); setLane(0); }}><ChevronRight size={18} aria-hidden /></button>
                  </div>
                </div>
              </div>
            </div>
            <div className="fc-instructions"><p>{l.help}</p><p>{l.note}</p></div>
          </section>
        </div>
      </div>

      <section id="fc-dossier" className="fc-dossier" aria-labelledby="fc-dossier-title">
        <div className="fc-wrap">
          <header className="fc-dossier-header">
            <div><Label>{l.manual}</Label><h2 id="fc-dossier-title">{l.filing}</h2></div>
            <p dir="auto">{person.tagline || person.headline}</p>
          </header>
          <div className="fc-record-layout">
            <aside className="fc-index" aria-label={l.dossier}>
              <div className="fc-index-head">
                <label htmlFor="fc-collection">{l.bank}</label>
                <select id="fc-collection" value={group} onChange={(e) => setRecordGroup(e.target.value as Collection)}>
                  {INDEX.map((collection) => <option value={collection} key={collection}>{label(collection)} · {num(records[collection].length)}</option>)}
                </select>
                <label htmlFor="fc-search">{l.find}</label>
                <div className="fc-search-field"><Search size={16} aria-hidden /><input id="fc-search" type="search" value={query} onChange={(e) => { setQuery(e.target.value); setLimit(FILES); }} /></div>
              </div>
              <div className="fc-index-tally"><span>{label(group)}</span><span aria-live="polite">{num(found.length)}</span></div>
              {!found.length && <p className="fc-no-files">{l.empty}</p>}
              <ol>
                {visibleFiles.map((item, index) => <li key={item.id}><button type="button" aria-pressed={entryOnFile?.id === item.id} onClick={() => {
                  setRecordId(item.id);
                  if (window.matchMedia('(max-width: 690px)').matches) {
                    detailRef.current?.focus({ preventScroll: true });
                    detailRef.current?.scrollIntoView({ block: 'start' });
                  }
                }}>
                  <span>{seq(index + 1)}</span><span dir="auto">{item.title}</span><ChevronRight size={15} aria-hidden />
                </button></li>)}
              </ol>
              {found.length > FILES && <button type="button" className="fc-more" onClick={() => {
                if (limit >= found.length) { setLimit(FILES); setRecordId(null); }
                else setLimit(limit + FILES);
              }}>{limit >= found.length ? l.showLess : l.show} <span aria-hidden>{limit >= found.length ? '−' : '+'}</span></button>}
            </aside>
            <article id="fc-detail" ref={detailRef} className="fc-detail" tabIndex={-1} aria-labelledby="fc-detail-heading">
              <div className="fc-detail-strip"><Label>{l.record} / {label(group)}</Label>{entryOnFile && <Label>{seq(found.indexOf(entryOnFile) + 1)} / {seq(found.length)}</Label>}</div>
              {entryOnFile ? <>
                <h3 id="fc-detail-heading" dir="auto">{entryOnFile.title}</h3>
                {entryOnFile.subtitle && <p className="fc-file-subtitle" dir="auto">{entryOnFile.subtitle}</p>}
                <div className="fc-file-body">{entryOnFile.body.map((text, index) => <p key={index} dir="auto">{text}</p>)}</div>
                {!!entryOnFile.facts?.length && <dl className="fc-file-facts">{entryOnFile.facts.map(([key, value], index) => <div key={index}><dt>{key}</dt><dd dir="auto">{value}</dd></div>)}</dl>}
                {!!entryOnFile.methods?.length && <div className="fc-file-tags"><Label>{l.tags}</Label><ul>{entryOnFile.methods.map((tag, index) => <li key={index} dir="auto">{tag}</li>)}</ul></div>}
                {!!entryOnFile.links?.length && <div className="fc-file-links"><Label>{l.links}</Label><RecordLinks item={entryOnFile} className="fc-file-exits" /></div>}
                {entryOnFile.citation && <details className="fc-citation"><summary>{t('common.bibtex')}</summary><pre dir="ltr">{entryOnFile.citation}</pre></details>}
              </> : <h3 id="fc-detail-heading">{l.empty}</h3>}
            </article>
          </div>
        </div>
      </section>
    </main>
    <footer id="fc-contact" className="fc-footer"><div className="fc-wrap">
      <a href="#fc-top" className="fc-mark"><CircuitBoard size={21} strokeWidth={1.55} aria-hidden />FLOWCELL</a>
      <p dir="auto">{person.availability || person.location}</p>
      <RecordLinks item={records.contact[0]} className="fc-footer-links" />
    </div></footer>
  </div>;
}
