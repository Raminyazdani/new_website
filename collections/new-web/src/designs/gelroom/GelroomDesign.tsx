'use client';

import { useEffect, useMemo, useRef, useState, type CSSProperties } from 'react';
import { ArrowDown, ArrowUpRight, ChevronLeft, ChevronRight, ScanLine, SlidersHorizontal, X } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { LocaleSwitcher } from '@/components/shared/LocaleSwitcher';
import { ProfilePhoto } from '@/components/shared/ProfilePhoto';
import { jetbrains } from '@/fonts/jetbrains';
import { spaceGrotesk } from '@/fonts/spacegrotesk';
import { hash01 } from '@/lib/derive';
import { fmtNum, seqNo } from '@/lib/format';
import type { SiteData } from '@/lib/types';
import { collectionLabels, makeSpecimens, matchesSpecimen, type Collection, type Specimen } from '../microcosm/specimen';
import './gelroom.css';

const GROUPS: Collection[]=['projects','roles','papers','methods','education','courses','languages','journey','profile','contact'];
const LANES=8;
const TEXT={
  en:{caption:'Ultraviolet portfolio index',film:'Navigation film',strip:'Inspection strip',lanes:'Record lanes',scan:'Scan position',exposure:'Exposure',source:'Open record',prev:'Previous film',next:'Next film',bank:'Collection',note:'Illustrated navigation bands, not experimental measurements.',tag:'Band label',catalog:'Contact sheet',all:'Browse records',search:'Search collection',empty:'No matching records.',darkroom:'Darkroom notes',description:'Move the scan marker through a lane. Each band leads to the same complete portfolio record.',page:'Film',slide:'Swipe to explore the film',light:'Light level'},
  de:{caption:'Ultraviolettes Portfolioregister',film:'Navigationsfilm',strip:'Inspektionsstreifen',lanes:'Eintragskanäle',scan:'Scanposition',exposure:'Belichtung',source:'Eintrag öffnen',prev:'Vorheriger Film',next:'Nächster Film',bank:'Sammlung',note:'Illustrative Navigationsbänder, keine experimentellen Messwerte.',tag:'Bandbeschriftung',catalog:'Kontaktbogen',all:'Einträge ansehen',search:'Sammlung durchsuchen',empty:'Keine passenden Einträge.',darkroom:'Dunkelkammernotizen',description:'Scanmarkierung durch einen Kanal bewegen. Jedes Band führt zum vollständigen Portfolioeintrag.',page:'Film',slide:'Film zum Erkunden verschieben',light:'Lichtstärke'},
  fa:{caption:'نمایهٔ فرابنفش پورتفولیو',film:'فیلم پیمایش',strip:'نوار بررسی',lanes:'کانال‌های سوابق',scan:'موقعیت اسکن',exposure:'نوردهی',source:'مشاهدهٔ رکورد',prev:'فیلم قبلی',next:'فیلم بعدی',bank:'مجموعه',note:'نوارهای تصویرسازی‌شده برای پیمایش؛ نه داده‌های یک آزمایش.',tag:'برچسب نوار',catalog:'برگهٔ تماس',all:'مرور سوابق',search:'جست‌وجو در مجموعه',empty:'رکوردی پیدا نشد.',darkroom:'یادداشت‌های تاریکخانه',description:'نشانگر اسکن را در کانال جابه‌جا کنید. هر نوار به رکورد کامل همان سابقه می‌رسد.',page:'فیلم',slide:'برای کاوش، فیلم را جابه‌جا کنید',light:'شدت نور'},
};

function recordBands(record:Specimen){
  const tags=record.methods?.length?record.methods.slice(0,7):[record.subtitle||record.title];
  return tags.map((tag,i)=>({tag,y:15+hash01(record.id+'/'+tag,i)*69,width:62+hash01(record.id+'width',i)*28,strength:.55+hash01(record.id+'strength',i)*.4})).sort((a,b)=>a.y-b.y);
}
function FullRecord({record}:{record:Specimen}){
  return <div className="gr-record-data">{record.subtitle&&<p dir="auto" className="gr-record-subtitle">{record.subtitle}</p>}
    {record.body.map((p,i)=><p key={i} dir="auto">{p}</p>)}
    {!!record.methods?.length&&<ul>{record.methods.map((tag,i)=><li key={i} dir="auto">{tag}</li>)}</ul>}
    {!!record.facts?.length&&<dl>{record.facts.map(([label,value],i)=><div key={i}><dt>{label}</dt><dd dir="auto">{value}</dd></div>)}</dl>}
    {!!record.links?.length&&<div className="gr-record-links">{record.links.map(([title,href],i)=><a key={i} href={href} target={href.startsWith('mailto:')?undefined:'_blank'} rel="noreferrer"><bdi>{title}</bdi><ArrowUpRight size={15} aria-hidden /></a>)}</div>}
    {record.citation&&<details className="gr-citation"><summary>BibTeX</summary><pre dir="ltr">{record.citation}</pre></details>}
  </div>;
}

export function GelroomDesign({data}:{data:SiteData}){
  const t=useTranslations();const l=TEXT[data.locale];
  const records=useMemo(()=>makeSpecimens(data,t),[data,t]);
  const [collection,setCollection]=useState<Collection>('projects');const [page,setPage]=useState(0);const [lane,setLane]=useState(0);
  const [scan,setScan]=useState(49);const [exposure,setExposure]=useState(66);
  const [dialogGroup,setDialogGroup]=useState<Collection>('projects');const [only,setOnly]=useState<string|null>(null);const [query,setQuery]=useState('');
  const film=useRef<HTMLDivElement>(null);const dialog=useRef<HTMLDialogElement>(null);
  const pages=Math.max(1,Math.ceil(records[collection].length/LANES));
  const onFilm=records[collection].slice(page*LANES,(page+1)*LANES);
  const entry=onFilm[lane];
  const bands=entry?recordBands(entry):[];
  const nearest=bands.reduce<(typeof bands)[number]|null>((old,band)=>!old||Math.abs(band.y-scan)<Math.abs(old.y-scan)?band:old,null);
  const found=records[dialogGroup].filter((r)=>(!only||r.id===only)&&matchesSpecimen(r,query,data.locale));
  const label=(c:Collection)=>t(collectionLabels[c]);
  const num=(n:number)=>fmtNum(data.locale,n);const seq=(n:number)=>seqNo(data.locale,n);
  useEffect(()=>{const element=film.current;if(!element)return;let visible=false;
    const sync=()=>{element.dataset.awake=String(visible&&!document.hidden);};
    const io=new IntersectionObserver(([change])=>{visible=change.isIntersecting;sync();},{threshold:.08});io.observe(element);document.addEventListener('visibilitychange',sync);
    return()=>{io.disconnect();document.removeEventListener('visibilitychange',sync);};
  },[]);
  function open(group:Collection,id?:string){setDialogGroup(group);setOnly(id??null);setQuery('');dialog.current?.showModal();}
  function selectLane(index:number){setLane(index);const first=onFilm[index]&&recordBands(onFilm[index])[0];if(first)setScan(Math.round(first.y));}
  function chooseCollection(group:Collection){setCollection(group);setPage(0);setLane(0);}

  return <div className={`gr-root ${jetbrains.variable} ${spaceGrotesk.variable}`} dir={data.dir} id="gr-top">
    <a href="#gr-film" className="gr-skip">{t('nav.skip')}</a>
    <header className="gr-header gr-wrap"><a href="#gr-top" className="gr-wordmark"><ScanLine size={21} strokeWidth={1.4} aria-hidden /><span>GELROOM</span></a><nav aria-label={t('nav.menu')}><a href="#gr-film">{l.film}</a><a href="#gr-catalog">{l.catalog}</a></nav><LocaleSwitcher className="gr-locales" itemClassName="gr-locale" activeClassName="gr-locale-on" /></header>
    <main>
      <section className="gr-darkroom gr-wrap" aria-label={l.film}>
        <aside className="gr-spine"><span className="gr-label">{l.caption}</span><h1>GEL<br/><span>ROOM</span></h1><div className="gr-identity"><ProfilePhoto src={data.person.photo} alt={t('common.photoAlt')} priority size={200} className="gr-photo" monogramClassName="gr-photo-fallback" /><div><strong dir="auto">{data.person.displayName}</strong><p dir="auto">{data.person.location}</p></div></div><p dir="auto" className="gr-headline">{data.person.headline}</p><p className="gr-howto">{l.description}</p><a href="#gr-catalog">{l.catalog}<ArrowDown size={16} aria-hidden /></a></aside>
        <div className="gr-film-station" id="gr-film">
          <div className="gr-film-bar"><label htmlFor="gr-bank">{l.bank}</label><select id="gr-bank" value={collection} onChange={(e)=>chooseCollection(e.target.value as Collection)}>{GROUPS.map((group)=><option value={group} key={group}>{label(group)} / {num(records[group].length)}</option>)}</select><div className="gr-film-pages"><button type="button" aria-label={l.prev} disabled={page===0} onClick={()=>{setPage(page-1);setLane(0);}}><ChevronLeft size={18} aria-hidden /></button><output aria-live="polite" dir="ltr">{seq(page+1)} / {seq(pages)}</output><button type="button" aria-label={l.next} disabled={page+1>=pages} onClick={()=>{setPage(page+1);setLane(0);}}><ChevronRight size={18} aria-hidden /></button></div></div>
          <div className="gr-film-viewport" role="region" aria-label={l.slide} tabIndex={0}>
            <div className="gr-film" ref={film} style={{'--gr-exposure':exposure/66,'--gr-scan':scan+'%'} as CSSProperties} dir="ltr">
              <div className="gr-film-perforations gr-film-perforations-top" aria-hidden />
              <div className="gr-lane-ruler" aria-label={l.lanes}>{Array.from({length:LANES},(_,i)=><button type="button" key={i} disabled={!onFilm[i]} aria-pressed={lane===i&&!!onFilm[i]} aria-label={`${l.lanes} ${num(i+1)}${onFilm[i]?': '+onFilm[i].title:''}`} onClick={()=>selectLane(i)}>{seq(page*LANES+i+1)}</button>)}</div>
              <div className="gr-lane-field">
                <div className="gr-lumens">
                  {Array.from({length:LANES},(_,index)=><div className={`gr-lane ${index===lane?'gr-lane-selected':''}`} key={index}>
                    <div className="gr-well" aria-hidden />
                    {onFilm[index]&&recordBands(onFilm[index]).map((band,i)=><button type="button" className="gr-band" key={i} aria-label={onFilm[index].title+' / '+band.tag} aria-pressed={index===lane&&nearest?.tag===band.tag} title={band.tag} style={{'--gr-y':band.y+'%','--gr-band-width':band.width+'%','--gr-band-strength':band.strength} as CSSProperties} onClick={()=>{setLane(index);setScan(band.y);}}><span className="gr-band-core" /><span className="gr-band-dot" aria-hidden /></button>)}
                  </div>)}
                </div>
                <div className="gr-scan-line" aria-hidden><span/><b>◁</b></div>
                <div className="gr-side-marks" aria-hidden>{Array.from({length:17},(_,i)=><span key={i}/>)}</div>
              </div>
              <div className="gr-film-footer"><span>{l.film}</span><span>GELROOM / {seq(page+1)}</span></div>
              <div className="gr-film-perforations gr-film-perforations-bottom" aria-hidden />
            </div>
          </div>
          <div className="gr-deck">
            <div className="gr-exposure"><label htmlFor="gr-exposure"><SlidersHorizontal size={14} aria-hidden />{l.exposure}</label><input id="gr-exposure" type="range" min="20" max="100" value={exposure} onChange={(e)=>setExposure(+e.target.value)}/><output>{num(exposure)}%</output></div>
            <div className="gr-scan-control"><label htmlFor="gr-scan"><ScanLine size={14} aria-hidden />{l.scan}</label><input id="gr-scan" type="range" min="8" max="90" step=".1" value={scan} onChange={(e)=>setScan(+e.target.value)}/><output>{num(Math.round(scan))}%</output></div>
          </div>
          <div className="gr-inspection-strip" aria-live="polite"><span className="gr-strip-number">{seq(page*LANES+lane+1)}</span><div><span className="gr-label">{l.strip}</span><h2 dir="auto">{entry?.title||l.empty}</h2>{nearest&&<p dir="auto"><span>{l.tag} / </span>{nearest.tag}</p>}</div><button type="button" disabled={!entry} onClick={()=>entry&&open(collection,entry.id)}>{l.source}<ArrowUpRight size={17} aria-hidden /></button></div>
        </div>
        <p className="gr-illustration-note">{l.note}</p>
      </section>
      <section id="gr-catalog" className="gr-contact-sheet"><div className="gr-wrap">
        <header><div><span className="gr-label">{l.darkroom}</span><h2>{l.catalog}</h2></div><p dir="auto">{data.person.tagline||data.person.headline}</p></header>
        <div className="gr-sheet">{GROUPS.map((group,i)=><button type="button" key={group} onClick={()=>open(group)}><div className="gr-mini-film" aria-hidden>{Array.from({length:5},(_,j)=><i key={j} style={{'--gr-mini':(hash01(group,j)*60+15)+'%'} as CSSProperties}/>)}</div><span>{seq(i+1)}</span><strong>{label(group)}</strong><small>{num(records[group].length)}</small><ArrowUpRight size={15} aria-hidden /></button>)}</div>
        <div className="gr-source-note"><h3 dir="auto">{data.person.displayName}</h3><div>{records.profile[0].body.slice(0,1).map((p,i)=><p key={i} dir="auto">{p}</p>)}<button type="button" onClick={()=>open('profile')}>{label('profile')}<ArrowUpRight size={16} aria-hidden /></button></div></div>
      </div></section>
    </main>
    <footer className="gr-footer gr-wrap"><a href="#gr-top" className="gr-wordmark"><ScanLine size={18} aria-hidden />GELROOM</a><p dir="auto">{data.person.location}</p>{data.links.email&&<a href={data.links.email}>{t('common.email')}<ArrowUpRight size={15} aria-hidden /></a>}</footer>
    <dialog ref={dialog} className="gr-dialog" aria-labelledby="gr-dialog-title" onClick={(e)=>{if(e.target===e.currentTarget)e.currentTarget.close();}}><div>
      <header><div><span className="gr-label">{l.strip}</span><h2 id="gr-dialog-title">{label(dialogGroup)}</h2></div><button type="button" aria-label={t('nav.close')} onClick={()=>dialog.current?.close()}><X size={22} aria-hidden /></button></header>
      {!only&&<div className="gr-dialog-search"><select aria-label={l.bank} value={dialogGroup} onChange={(e)=>{setDialogGroup(e.target.value as Collection);setQuery('');}}>{GROUPS.map((group)=><option key={group} value={group}>{label(group)} / {num(records[group].length)}</option>)}</select><input type="search" aria-label={l.search} placeholder={l.search} value={query} onChange={(e)=>setQuery(e.target.value)}/></div>}
      {!found.length&&<p role="status">{l.empty}</p>}
      {found.map((record,i)=><details className="gr-record" key={record.id} open={!!only||found.length===1}><summary><span>{seq(i+1)}</span><strong dir="auto">{record.title}</strong><span className="gr-disclosure" aria-hidden /></summary><FullRecord record={record}/></details>)}
    </div></dialog>
  </div>;
}
