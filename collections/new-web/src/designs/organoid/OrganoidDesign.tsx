'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { ArrowDown, ArrowUpRight, Layers, MoveVertical, Slice } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { LocaleSwitcher } from '@/components/shared/LocaleSwitcher';
import { ProfilePhoto } from '@/components/shared/ProfilePhoto';
import { cormorant } from '@/fonts/cormorant';
import { manrope } from '@/fonts/manrope';
import { plexMono } from '@/fonts/plex';
import { fmtNum, seqNo } from '@/lib/format';
import type { SiteData } from '@/lib/types';
import { collectionLabels, makeSpecimens, matchesSpecimen, type Collection, type Specimen } from '../microcosm/specimen';
import { OrganoidVolume } from './OrganoidVolume';
import './organoid.css';

const LAYERS: Collection[] = ['profile', 'education', 'methods', 'roles', 'projects', 'papers', 'courses'];
const GROUPS: Collection[] = [...LAYERS, 'languages', 'journey', 'contact'];
const WORDS = {
  en: { studio: 'A study in becoming', form: 'A body of work.', layers: 'Portfolio layers', cut: 'Section depth', spread: 'Layer separation', reset: 'Restore the volume', note: 'Conceptual cellular sculpture. Its layers organise portfolio records.', book: 'The section book', chapter: 'Chapter', search: 'Find in this chapter', more: 'Show more records', less: 'Show fewer', records: 'records', read: 'Read the chapter', no: 'No matching records.', collected: 'A growing collection of work, study and practice.' },
  de: { studio: 'Eine Studie des Werdens', form: 'Ein Körper aus Arbeit.', layers: 'Portfolio-Schichten', cut: 'Schnitttiefe', spread: 'Schichtabstand', reset: 'Volumen wiederherstellen', note: 'Konzeptuelle Zellskulptur. Ihre Schichten ordnen Portfolioeinträge.', book: 'Das Schnittbuch', chapter: 'Kapitel', search: 'Kapitel durchsuchen', more: 'Mehr Einträge', less: 'Weniger anzeigen', records: 'Einträge', read: 'Kapitel lesen', no: 'Keine passenden Einträge.', collected: 'Eine wachsende Sammlung aus Arbeit, Studium und Praxis.' },
  fa: { studio: 'پژوهشی در شدن', form: 'پیکری از کارها.', layers: 'لایه‌های پورتفولیو', cut: 'عمق برش', spread: 'فاصلهٔ لایه‌ها', reset: 'بازسازی حجم', note: 'پیکرهٔ مفهومی سلولی؛ لایه‌ها سوابق پورتفولیو را سامان می‌دهند.', book: 'دفتر برش‌ها', chapter: 'فصل', search: 'جست‌وجو در این فصل', more: 'نمایش سوابق بیشتر', less: 'نمایش کمتر', records: 'رکورد', read: 'خواندن فصل', no: 'رکوردی پیدا نشد.', collected: 'مجموعه‌ای در حال رشد از کار، تحصیل و تجربه.' },
};

function SectionRecord({ item }: { item: Specimen }) {
  return <div className="og-record-content">
    {item.subtitle && <p dir="auto" className="og-source">{item.subtitle}</p>}
    {item.body.map((p,i) => <p key={i} dir="auto">{p}</p>)}
    {!!item.methods?.length && <ul>{item.methods.map((tag,i) => <li key={i} dir="auto">{tag}</li>)}</ul>}
    {!!item.facts?.length && <dl>{item.facts.map(([key,value],i) => <div key={i}><dt>{key}</dt><dd dir="auto">{value}</dd></div>)}</dl>}
    {!!item.links?.length && <div className="og-record-links">{item.links.map(([title,href],i) => <a key={i} href={href} target={href.startsWith('mailto:') ? undefined : '_blank'} rel="noreferrer"><bdi>{title}</bdi><ArrowUpRight size={15} aria-hidden /></a>)}</div>}
    {item.citation && <details className="og-citation"><summary>BibTeX</summary><pre dir="ltr">{item.citation}</pre></details>}
  </div>;
}

export function OrganoidDesign({data}:{data:SiteData}) {
  const t=useTranslations(); const l=WORDS[data.locale];
  const records=useMemo(()=>makeSpecimens(data,t),[data,t]);
  const [cut,setCut]=useState(6);const [spread,setSpread]=useState(8);const [selected,setSelected]=useState(4);
  const [group,setGroup]=useState<Collection>('projects');const [query,setQuery]=useState('');const [limit,setLimit]=useState(12);
  const sculpture=useRef<HTMLDivElement>(null);
  const label=(c:Collection)=>t(collectionLabels[c]);
  const found=records[group].filter((r)=>matchesSpecimen(r,query,data.locale));
  const number=(n:number)=>fmtNum(data.locale,n);
  const serial=(n:number)=>seqNo(data.locale,n);
  useEffect(()=>{
    const el=sculpture.current;if(!el)return;let inView=false;
    const sync=()=>{el.dataset.alive=String(inView&&!document.hidden);};
    const io=new IntersectionObserver(([entry])=>{inView=entry.isIntersecting;sync();},{threshold:.08});
    io.observe(el);document.addEventListener('visibilitychange',sync);
    return()=>{io.disconnect();document.removeEventListener('visibilitychange',sync);};
  },[]);
  function chooseChapter(c:Collection){setGroup(c);setQuery('');setLimit(12);const i=LAYERS.indexOf(c);if(i>=0){setSelected(i);setCut(i);}}
  return <div className={`og-root ${cormorant.variable} ${manrope.variable} ${plexMono.variable}`} dir={data.dir} id="og-top">
    <a href="#og-stage" className="og-skip">{t('nav.skip')}</a>
    <header className="og-header og-wrap"><a href="#og-top" className="og-logo"><span aria-hidden>◌</span>organoid</a><nav aria-label={t('nav.menu')}><a href="#og-stage">{l.layers}</a><a href="#og-book">{l.book}</a></nav><LocaleSwitcher className="og-locales" itemClassName="og-locale" activeClassName="og-locale-on" /></header>
    <main>
      <section id="og-stage" className="og-stage og-wrap" aria-label={l.layers}>
        <div className="og-studio-caption"><span className="og-fine">{l.studio}</span><span className="og-fine" dir="ltr">VOLUME / 01</span></div>
        <div className="og-stage-scene">
          <div className="og-title"><p className="og-fine">{data.person.displayName}</p><h1>{l.form}</h1><p dir="auto">{data.person.headline}</p>
            <a href="#og-book" className="og-read">{l.read}<ArrowDown size={15} aria-hidden /></a>
          </div>
          <div className="og-sculpture-field" ref={sculpture}><OrganoidVolume cut={cut} spread={spread} selected={selected} /></div>
          <div className="og-identity-tag"><ProfilePhoto src={data.person.photo} alt={t('common.photoAlt')} priority size={200} className="og-photo" monogramClassName="og-photo-fallback" /><div><strong dir="auto">{data.person.displayName}</strong><span dir="auto">{data.person.location}</span></div></div>
          <ol className="og-stratum-index" aria-label={l.layers}>{LAYERS.map((c,i)=><li key={c}><button type="button" aria-pressed={selected===i} onClick={()=>chooseChapter(c)}><span aria-hidden className="og-layer-dot" /><small>{serial(i+1)}</small><span>{label(c)}</span></button></li>)}</ol>
          <div className="og-volume-note"><span className="og-fine">{serial(selected+1)} / {label(LAYERS[selected])}</span><p>{number(records[LAYERS[selected]].length)} {l.records}</p></div>
        </div>
        <div className="og-section-controls">
          <label htmlFor="og-depth"><span><Slice size={15} aria-hidden />{l.cut}</span><input id="og-depth" type="range" min="0" max="6" step="1" value={cut} onChange={(e)=>{const n=+e.target.value;setCut(n);setSelected(n);setGroup(LAYERS[n]);setQuery('');setLimit(12);}} /><output>{serial(cut+1)} / {serial(7)}</output></label>
          <label htmlFor="og-spread"><span><MoveVertical size={15} aria-hidden />{l.spread}</span><input id="og-spread" type="range" min="0" max="75" value={spread} onChange={(e)=>setSpread(+e.target.value)} /><output>{number(spread)}%</output></label>
          <button type="button" onClick={()=>{setCut(6);setSpread(8);setSelected(4);setGroup('projects');setQuery('');setLimit(12);}}><Layers size={17} aria-hidden />{l.reset}</button>
        </div>
        <p className="og-illustration-note">{l.note}</p>
      </section>
      <section id="og-book" className="og-book" aria-labelledby="og-book-title"><div className="og-wrap">
        <div className="og-book-cover"><span className="og-fine">{l.collected}</span><h2 id="og-book-title">{l.book}</h2><p dir="auto">{data.person.tagline||data.person.headline}</p></div>
        <div className="og-book-spread">
          <aside className="og-contents"><p className="og-fine">{l.chapter}</p><ol>{GROUPS.map((c,i)=><li key={c}><button type="button" aria-pressed={group===c} onClick={()=>chooseChapter(c)}><span>{serial(i+1)}</span><strong>{label(c)}</strong><small>{number(records[c].length)}</small></button></li>)}</ol>
            <div className="og-colophon"><p dir="auto">{data.person.displayName}</p><span dir="auto">{data.person.location}</span></div>
          </aside>
          <div className="og-chapter"><header><span className="og-fine">{l.chapter} {serial(GROUPS.indexOf(group)+1)}</span><h3>{label(group)}</h3><label>{l.search}<input type="search" value={query} onChange={(e)=>{setQuery(e.target.value);setLimit(12);}} /></label></header>
            {!found.length&&<p role="status">{l.no}</p>}
            {found.slice(0,limit).map((item,i)=><details className="og-record" key={group+'/'+item.id} open={found.length===1}><summary><span>{serial(i+1)}</span><div><strong dir="auto">{item.title}</strong>{item.subtitle&&<small dir="auto">{item.subtitle}</small>}</div><span aria-hidden className="og-toggle" /></summary><SectionRecord item={item} /></details>)}
            {found.length>12&&<button type="button" className="og-more" onClick={()=>setLimit(limit>=found.length?12:limit+12)}>{limit>=found.length?l.less:l.more}<span>{number(Math.min(limit,found.length))} / {number(found.length)}</span></button>}
          </div>
        </div>
      </div></section>
    </main>
    <footer className="og-footer og-wrap"><a href="#og-top" className="og-logo">organoid</a><p dir="auto">{data.person.availability||data.person.location}</p>{data.links.email&&<a href={data.links.email}>{t('common.email')}<ArrowUpRight size={16} aria-hidden /></a>}</footer>
  </div>;
}
