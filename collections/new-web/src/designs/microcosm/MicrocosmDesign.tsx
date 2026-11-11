'use client';

import { useEffect, useMemo, useRef, useState, type CSSProperties, type ReactNode } from 'react';
import { ArrowDown, ArrowRight, ArrowUpRight, Crosshair, Focus, ScanLine, X } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { LocaleSwitcher } from '@/components/shared/LocaleSwitcher';
import { ProfilePhoto } from '@/components/shared/ProfilePhoto';
import { frauncesSoft } from '@/fonts/frauncesSoft';
import { plexMono, plexSans } from '@/fonts/plex';
import { fmtNum, seqNo } from '@/lib/format';
import type { SiteData } from '@/lib/types';
import { OPTICS, TissueField } from './TissueField';
import { collectionLabels, makeSpecimens, matchesSpecimen, type Collection, type Specimen } from './specimen';
import './microcosm.css';

const messages = {
  en: {
    bench: 'Microscopy bench', guide: 'Field guide', plate: 'PLATE 01 / CELL ATLAS',
    label: 'The portfolio specimen', title: 'Microcosm', field: 'Field of view',
    hint: 'Select a marker to bring its portfolio section into view.',
    scale: 'Magnification', focus: 'Fine focus', reset: 'Reset view', open: 'Inspect records',
    note: 'Illustrated cell. Markers lead to portfolio records.',
    organs: ['Nucleus', 'Mitochondrion', 'Endoplasmic reticulum', 'Golgi apparatus', 'Ribosomes'],
    outside: 'Outside the field', path: 'Stations along the way', slides: 'Publication slides',
    registry: 'Reference collection', records: 'records', all: 'Browse all', search: 'Search this collection',
    empty: 'There are no matching records.', top: 'Back to the microscope',
  },
  de: {
    bench: 'Mikroskopie', guide: 'Feldführer', plate: 'TAFEL 01 / ZELLATLAS',
    label: 'Die Portfolio-Probe', title: 'Microcosm', field: 'Sichtfeld',
    hint: 'Wählen Sie eine Markierung, um einen Portfoliobereich zu fokussieren.',
    scale: 'Vergrößerung', focus: 'Feinfokus', reset: 'Ansicht zurücksetzen', open: 'Einträge ansehen',
    note: 'Illustration einer Zelle. Die Markierungen führen zu Portfolioeinträgen.',
    organs: ['Zellkern', 'Mitochondrium', 'Endoplasmatisches Retikulum', 'Golgi-Apparat', 'Ribosomen'],
    outside: 'Außerhalb des Sichtfelds', path: 'Stationen auf dem Weg', slides: 'Publikationen',
    registry: 'Referenzsammlung', records: 'Einträge', all: 'Alle ansehen', search: 'Sammlung durchsuchen',
    empty: 'Keine passenden Einträge.', top: 'Zurück zum Mikroskop',
  },
  fa: {
    bench: 'میز میکروسکوپ', guide: 'راهنمای مشاهده', plate: 'لوح ۰۱ / اطلس سلولی',
    label: 'نمونهٔ پورتفولیو', title: 'ریزجهان', field: 'میدان دید',
    hint: 'یک نشانگر را انتخاب کنید تا بخش مربوط در میدان دید قرار بگیرد.',
    scale: 'بزرگ‌نمایی', focus: 'تنظیم وضوح', reset: 'بازنشانی نما', open: 'مشاهدهٔ سوابق',
    note: 'تصویرسازی سلول؛ نشانگرها به سوابق پورتفولیو پیوند دارند.',
    organs: ['هسته', 'میتوکندری', 'شبکهٔ آندوپلاسمی', 'دستگاه گلژی', 'ریبوزوم‌ها'],
    outside: 'بیرون از میدان دید', path: 'ایستگاه‌های مسیر', slides: 'اسلایدهای آثار منتشرشده',
    registry: 'مجموعهٔ مرجع', records: 'رکورد', all: 'مشاهدهٔ همه', search: 'جست‌وجو در این مجموعه',
    empty: 'رکوردی پیدا نشد.', top: 'بازگشت به میکروسکوپ',
  },
};

const OBJECTIVES = [1, 1.38, 1.84];
const SHELVES = ['projects', 'methods', 'education', 'courses', 'languages', 'journey', 'contact'] as const;

function SpecimenBody({ item }: { item: Specimen }) {
  return <div className="mc-record-body">
    {item.body.map((p, i) => <p dir="auto" key={i}>{p}</p>)}
    {!!item.methods?.length && <ul className="mc-labels">{item.methods.map((method, i) => <li dir="auto" key={i}>{method}</li>)}</ul>}
    {!!item.facts?.length && <dl className="mc-facts">{item.facts.map(([label, value], i) => <div key={i}><dt>{label}</dt><dd dir="auto">{value}</dd></div>)}</dl>}
    {!!item.links?.length && <div className="mc-record-links">{item.links.map(([label, href], i) => (
      <a key={i} href={href} target={href.startsWith('mailto:') ? undefined : '_blank'} rel="noreferrer"><bdi>{label}</bdi><ArrowUpRight size={15} aria-hidden /></a>
    ))}</div>}
    {item.citation && <details className="mc-bib"><summary>BibTeX</summary><pre dir="ltr">{item.citation}</pre></details>}
  </div>;
}

export function MicrocosmDesign({ data }: { data: SiteData }) {
  const t = useTranslations();
  const l = messages[data.locale];
  const person = data.person;
  const nameParts = person.displayName.trim().split(/\s+/);
  const nameStart = nameParts.shift();
  const nameEnd = nameParts.join(' ');
  const specimens = useMemo(() => makeSpecimens(data, t), [data, t]);
  const [selected, setSelected] = useState<number | null>(null);
  const [objective, setObjective] = useState(0);
  const [focus, setFocus] = useState(70);
  const [playing, setPlaying] = useState(false);
  const [drawer, setDrawer] = useState<{ collection: Collection; only?: string }>({ collection: 'profile' });
  const [query, setQuery] = useState('');
  const fieldRef = useRef<HTMLDivElement>(null);
  const dialogRef = useRef<HTMLDialogElement>(null);
  const magnification = OBJECTIVES[objective];
  const chosen = selected === null ? null : OPTICS[selected];
  const chosenRows = chosen ? specimens[chosen.collection] : [];
  const drawerRows = drawer.only ? specimens[drawer.collection].filter((item) => item.id === drawer.only) :
    specimens[drawer.collection].filter((item) => matchesSpecimen(item, query, data.locale));
  const tx = chosen ? (280 - chosen.x) * (magnification - .25) : 0;
  const ty = chosen ? (280 - chosen.y) * (magnification - .25) : 0;

  useEffect(() => {
    const field = fieldRef.current;
    if (!field) return;
    let visible = false;
    const sync = () => setPlaying(visible && !document.hidden);
    const observer = new IntersectionObserver(([entry]) => { visible = entry.isIntersecting; sync(); }, { threshold: .08 });
    observer.observe(field);
    document.addEventListener('visibilitychange', sync);
    return () => { observer.disconnect(); document.removeEventListener('visibilitychange', sync); };
  }, []);

  function selectOptic(index: number) {
    setSelected(index);
    setObjective((value) => Math.max(value, 1));
  }

  function inspect(collection: Collection, only?: string) {
    setDrawer({ collection, only });
    setQuery('');
    dialogRef.current?.showModal();
  }

  function reset() {
    setSelected(null);
    setObjective(0);
    setFocus(70);
  }

  const numer = (n: number) => fmtNum(data.locale, n);
  const serial = (n: number) => seqNo(data.locale, n);
  const label = (group: Collection) => t(collectionLabels[group]);
  const title = chosen && selected !== null ? l.organs[selected] : l.field;
  const openLink = (collection: Collection, only?: string, children?: ReactNode) => (
    <button type="button" className="mc-text-action" onClick={() => inspect(collection, only)}>
      {children ?? l.open} <ArrowUpRight size={15} aria-hidden />
    </button>
  );

  return (
    <div id="mc-top" className={`mc-root ${frauncesSoft.variable} ${plexSans.variable} ${plexMono.variable}`} dir={data.dir}>
      <a href="#mc-main" className="mc-skip">{t('nav.skip')}</a>
      <header className="mc-header mc-frame">
        <a href="#mc-top" className="mc-wordmark"><ScanLine size={22} strokeWidth={1.4} aria-hidden /> <span>{l.title}</span></a>
        <nav aria-label={t('nav.menu')}><a href="#mc-bench">{l.bench}</a><a href="#mc-guide">{l.guide}</a></nav>
        <LocaleSwitcher className="mc-locales" itemClassName="mc-locale" activeClassName="mc-locale-active" />
      </header>

      <main id="mc-main">
        <section id="mc-bench" className="mc-bench mc-frame" aria-label={l.bench}>
          <div className="mc-benchline"><span>{l.plate}</span><span aria-hidden>✳</span><span>{l.bench}</span></div>
          <div className="mc-identity">
            <p className="mc-ink-note">{l.label}</p>
            <h1>{nameStart}{nameEnd && <span>{nameEnd}</span>}</h1>
            <p className="mc-headline" dir="auto">{person.headline}</p>
            <div className="mc-id-slide">
              <ProfilePhoto src={person.photo} alt={t('common.photoAlt')} priority size={240} className="mc-photo" imgClassName="mc-photo-image" monogramClassName="mc-photo-fallback" />
              <div><p className="mc-id-code" dir="ltr">MC / 01</p><p dir="auto">{person.location}</p></div>
            </div>
            <a className="mc-guide-link" href="#mc-guide">{l.guide}<ArrowDown size={16} aria-hidden /></a>
          </div>

          <figure className="mc-optics" aria-label={l.field}>
            <div ref={fieldRef} className={`mc-lens ${playing ? 'mc-playing' : ''}`}>
              <div className="mc-lens-engraving" aria-hidden />
              <div className="mc-lens-inset" dir="ltr">
                <div className="mc-field-zoom" style={{ transform: `translate(${tx / 5.6}%, ${ty / 5.6}%) scale(${magnification})` }}>
                  <div className="mc-field-focus" style={{ filter: `blur(${Math.abs(70 - focus) / 14}px)` }}>
                    <div className="mc-field-drift"><TissueField /></div>
                  </div>
                </div>
                <span className="mc-reticle" aria-hidden><Crosshair size={35} strokeWidth={.6} /></span>
                <span className="mc-glass" aria-hidden />
                {OPTICS.map(({ x, y, collection, stain }, index) => {
                  const xpos = 280 + (x - 280) * magnification + tx;
                  const ypos = 280 + (y - 280) * magnification + ty;
                  const outside = Math.hypot(xpos - 280, ypos - 280) > 236;
                  if (outside) return null;
                  return <button key={collection} type="button" className="mc-pin" aria-pressed={selected === index}
                    style={{ '--pin-x': `${xpos / 5.6}%`, '--pin-y': `${ypos / 5.6}%`, '--stain': stain } as CSSProperties}
                    aria-label={`${l.organs[index]} · ${label(collection)}`} onClick={() => selectOptic(index)}>
                    <span>{serial(index + 1)}</span>
                  </button>;
                })}
              </div>
            </div>
            <figcaption><span aria-hidden className="mc-scale-mark" /> {l.note}</figcaption>
          </figure>

          <aside className="mc-selector" aria-label={l.field}>
            <div className="mc-selector-cap"><span><Focus size={17} strokeWidth={1.4} aria-hidden /> {l.field}</span><button type="button" className="mc-reset" onClick={reset}>{l.reset}</button></div>
            <div className="mc-objectives" role="group" aria-label={l.scale}>
              {OBJECTIVES.map((value, i) => <button key={value} type="button" aria-pressed={objective === i} onClick={() => {
                setObjective(i);
                if (i === 0) setSelected(null);
              }}>{fmtNum(data.locale, value, { maximumFractionDigits: 2 })}×</button>)}
            </div>
            <label className="mc-focus-label" htmlFor="mc-focus">{l.focus}<output>{numer(focus)}%</output></label>
            <input id="mc-focus" className="mc-focus" type="range" min="0" max="100" value={focus} onChange={(e) => setFocus(+e.target.value)} />
            <ol className="mc-organelles">
              {OPTICS.map(({ collection, stain }, index) => <li key={collection}>
                <button type="button" aria-pressed={selected === index} style={{ '--stain': stain } as CSSProperties} onClick={() => selectOptic(index)}>
                  <span className="mc-org-no">{serial(index + 1)}</span>
                  <span className="mc-org-name">{l.organs[index]}<small>{label(collection)}</small></span>
                  <span className="mc-org-count">{numer(specimens[collection].length)}</span>
                </button>
              </li>)}
            </ol>
            <div className="mc-inspect" aria-live="polite">
              {chosen ? <>
                <p dir="auto" className="mc-inspect-title">{chosenRows[0]?.title || title}</p>
                {openLink(chosen.collection, undefined, `${l.open} · ${numer(chosenRows.length)}`)}
              </> : <p>{l.hint}</p>}
            </div>
          </aside>
        </section>

        <section id="mc-guide" aria-labelledby="mc-guide-title" className="mc-guide">
          <div className="mc-frame">
            <div className="mc-guide-head">
              <p className="mc-ink-note">{l.outside}</p>
              <h2 id="mc-guide-title">{l.guide}</h2>
              <p dir="auto">{person.tagline || person.headline}</p>
            </div>
            <div className="mc-book">
              <article className="mc-notes">
                <span className="mc-folio">{serial(1)} / {label('profile')}</span>
                <h3>{person.displayName}</h3>
                {(person.statement ? [person.statement] : person.about.slice(0, 1)).map((p, i) => <p key={i} dir="auto">{p}</p>)}
                {openLink('profile')}
                {!!data.stats.length && <dl className="mc-stats">{data.stats.map((stat) => <div key={stat.id}><dd>{numer(stat.value)}{stat.suffix}</dd><dt>{stat.label}</dt></div>)}</dl>}
              </article>
              <article className="mc-trail">
                <span className="mc-folio">{serial(2)} / {label('roles')}</span>
                <h3>{l.path}</h3>
                <ol>
                  {specimens.roles.slice(0, 4).map((item) => <li key={item.id}>
                    <button type="button" onClick={() => inspect('roles', item.id)}><strong dir="auto">{item.title}</strong><span dir="auto">{item.subtitle}</span></button>
                  </li>)}
                </ol>
                {openLink('roles', undefined, l.all)}
              </article>
            </div>
            <div className="mc-slide-tray">
              <header><span className="mc-folio">{serial(3)} / {label('papers')}</span><h3>{l.slides}</h3>{openLink('papers', undefined, l.all)}</header>
              <div>{specimens.papers.slice(0, 3).map((item, index) => <button type="button" className="mc-paper-slide" key={item.id} onClick={() => inspect('papers', item.id)}>
                <span className="mc-slide-sample" aria-hidden /><span><small>{serial(index + 1)} / {label('papers')}</small><strong dir="auto">{item.title}</strong></span><ArrowUpRight size={18} aria-hidden />
              </button>)}</div>
            </div>
            <div className="mc-catalog">
              <header><span className="mc-folio">{serial(4)} / {l.registry}</span><h3>{l.registry}</h3></header>
              <ol>{SHELVES.map((collection, i) => <li key={collection}>
                <button type="button" onClick={() => inspect(collection)}>
                  <span className="mc-catalog-no">{serial(i + 1)}</span>
                  <strong>{label(collection)}</strong><small>{numer(specimens[collection].length)} {l.records}</small><ArrowRight size={17} aria-hidden />
                </button>
              </li>)}</ol>
            </div>
          </div>
        </section>
      </main>

      <footer className="mc-footer mc-frame">
        <a href="#mc-top" className="mc-wordmark"><ScanLine size={19} strokeWidth={1.4} aria-hidden /> {l.title}</a>
        {(person.availability || person.location) && <p dir="auto">{person.availability || person.location}</p>}
        {data.links.email && <a dir="auto" href={data.links.email}>{t('common.email')} <ArrowUpRight size={15} aria-hidden /></a>}
      </footer>

      <dialog ref={dialogRef} className="mc-dialog" aria-labelledby="mc-dialog-title" onClick={(e) => {
        if (e.currentTarget === e.target) e.currentTarget.close();
      }}>
        <div className="mc-dialog-sheet">
          <header><div><span className="mc-folio">{l.registry}</span><h2 id="mc-dialog-title">{label(drawer.collection)}</h2></div>
            <button type="button" className="mc-close" aria-label={t('nav.close')} onClick={() => dialogRef.current?.close()}><X size={22} aria-hidden /></button>
          </header>
          {!drawer.only && specimens[drawer.collection].length > 5 && (
            <label className="mc-search">{l.search}<input type="search" value={query} onChange={(e) => setQuery(e.target.value)} /></label>
          )}
          <div className="mc-dialog-records" key={drawer.collection + (drawer.only ?? '')}>
            {!drawerRows.length && <p role="status">{l.empty}</p>}
            {drawerRows.map((item, index) => (
              <details key={item.id} open={!!drawer.only || (drawerRows.length === 1)}>
                <summary>
                  <span className="mc-catalog-no">{serial(index + 1)}</span>
                  <span><strong dir="auto">{item.title}</strong>{item.subtitle && <small dir="auto">{item.subtitle}</small>}</span>
                  <span className="mc-disclosure" aria-hidden />
                </summary>
                <SpecimenBody item={item} />
              </details>
            ))}
          </div>
        </div>
      </dialog>
    </div>
  );
}
