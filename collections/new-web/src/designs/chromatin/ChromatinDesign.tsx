'use client';
import dynamic from 'next/dynamic';
import {useMemo,useRef,useState} from 'react';
import {ArrowDown,ArrowUpRight,ChevronRight,X} from 'lucide-react';
import {useTranslations} from 'next-intl';
import {LocaleSwitcher} from '@/components/shared/LocaleSwitcher';
import {ProfilePhoto} from '@/components/shared/ProfilePhoto';
import {bricolage} from '@/fonts/bricolage';
import {plexMono} from '@/fonts/plex';
import {fmtNum,seqNo} from '@/lib/format';
import type {SiteData} from '@/lib/types';
import {collectionLabels,makeSpecimens,matchesSpecimen,type Collection,type Specimen} from '../microcosm/specimen';
import './chromatin.css';
const Scene=dynamic(()=>import('./ChromatinScene').then(m=>m.ChromatinScene),{ssr:false});
const GROUPS:Collection[]=['profile','roles','projects','papers','methods','education','courses','languages','journey','contact'];
const CHAPTERS:Collection[]=['profile','methods','papers','projects'];
const COPY={
en:{chapters:['fold','access','read','work'],captions:['a compact beginning.','make room for a method.','follow a thread of evidence.','open the work itself.'],scrub:'unfold the strand',index:'record index',open:'open this record',hint:'drag the model to turn it',note:'Conceptual chromatin sculpture; not a molecular reconstruction.',find:'find in collection',empty:'No matching records.',body:'the open strand',sub:'Every record remains connected to its source description.',next:'next chapter'},
de:{chapters:['falten','öffnen','lesen','arbeiten'],captions:['ein kompakter Anfang.','Raum für eine Methode.','einer Spur von Belegen folgen.','die Arbeit selbst öffnen.'],scrub:'Strang entfalten',index:'Eintragsregister',open:'Eintrag öffnen',hint:'Modell zum Drehen ziehen',note:'Konzeptuelle Chromatinskulptur, keine molekulare Rekonstruktion.',find:'Sammlung durchsuchen',empty:'Keine passenden Einträge.',body:'der offene Strang',sub:'Jeder Eintrag bleibt mit seiner Originalbeschreibung verbunden.',next:'nächstes Kapitel'},
fa:{chapters:['تاخوردگی','دسترسی','خواندن','کارها'],captions:['آغازی فشرده.','فضایی برای یک روش.','رد شواهد را دنبال کنید.','خود کار را باز کنید.'],scrub:'بازکردن رشته',index:'نمایهٔ سوابق',open:'مشاهدهٔ رکورد',hint:'برای چرخاندن، مدل را بکشید',note:'پیکرهٔ مفهومی کروماتین؛ نه بازسازی مولکولی.',find:'جست‌وجو در مجموعه',empty:'رکوردی پیدا نشد.',body:'رشتهٔ گشوده',sub:'هر رکورد به شرح منبع خود متصل می‌ماند.',next:'فصل بعد'},
};
function RecordText({item}:{item:Specimen}){return <div className="ch-record-text">{item.subtitle&&<p className="ch-subtitle" dir="auto">{item.subtitle}</p>}{item.body.map((p,i)=><p key={i} dir="auto">{p}</p>)}{!!item.methods?.length&&<ul>{item.methods.map((tag,i)=><li key={i} dir="auto">{tag}</li>)}</ul>}{!!item.facts?.length&&<dl>{item.facts.map(([key,value],i)=><div key={i}><dt>{key}</dt><dd dir="auto">{value}</dd></div>)}</dl>}{!!item.links?.length&&<div className="ch-links">{item.links.map(([name,href],i)=><a key={i} href={href} target={href.startsWith('mailto:')?undefined:'_blank'} rel="noreferrer"><bdi>{name}</bdi><ArrowUpRight size={15}/></a>)}</div>}{item.citation&&<details><summary>BibTeX</summary><pre dir="ltr">{item.citation}</pre></details>}</div>;}
export function ChromatinDesign({data}:{data:SiteData}){
const t=useTranslations();const l=COPY[data.locale];const records=useMemo(()=>makeSpecimens(data,t),[data,t]);const [progress,setProgress]=useState(0);const [selected,setSelected]=useState(0);const [group,setGroup]=useState<Collection>('profile');const [only,setOnly]=useState<string|null>(null);const [query,setQuery]=useState('');const dialog=useRef<HTMLDialogElement>(null);
const chapter=Math.min(3,Math.floor(progress*3+.35));const sourceGroup=CHAPTERS[chapter];const onStage=records[sourceGroup];const active=onStage[selected%Math.max(1,onStage.length)];const label=(c:Collection)=>t(collectionLabels[c]);const n=(v:number)=>fmtNum(data.locale,v);const num=(v:number)=>seqNo(data.locale,v);
const found=records[group].filter(r=>(!only||r.id===only)&&matchesSpecimen(r,query,data.locale));
function open(c:Collection,id?:string){setGroup(c);setOnly(id??null);setQuery('');dialog.current?.showModal();}
function pose(value:number){setProgress(value);setSelected(0);}
return <div id="ch-top" className={`ch-root ${bricolage.variable} ${plexMono.variable}`} dir={data.dir}>
<a href="#ch-stage" className="ch-skip">{t('nav.skip')}</a>
<header className="ch-header ch-wrap"><a href="#ch-top" className="ch-logo"><span aria-hidden>∿</span>chromatin</a><a className="ch-header-index" href="#ch-index">{l.index}<ArrowDown size={15}/></a><LocaleSwitcher className="ch-locales" itemClassName="ch-locale" activeClassName="ch-locale-on"/></header>
<main><section className="ch-narrative" aria-label="chromatin">
<div className="ch-identity ch-wrap"><h1 dir="auto">{data.person.displayName}</h1><p dir="auto">{data.person.headline}</p><ProfilePhoto src={data.person.photo} alt={t('common.photoAlt')} priority size={160} className="ch-photo" monogramClassName="ch-photo-fallback"/></div>
<div id="ch-stage" className="ch-stage"><Scene progress={progress} selected={selected} count={onStage.length} onSelect={(i)=>{if(onStage[i]){setSelected(i);open(sourceGroup,onStage[i].id);}}}/>
<nav className="ch-chapter-rail" aria-label={l.scrub}>{l.chapters.map((title,i)=><button type="button" key={title} aria-pressed={chapter===i} onClick={()=>pose(i/3)}><small>{num(i+1)}</small><span>{title}</span></button>)}</nav>
<div className="ch-scene-caption"><span>{num(chapter+1)} / {l.chapters[chapter]}</span><h2>{l.captions[chapter]}</h2></div><span className="ch-orbit-hint">{l.hint}</span></div>
<div className="ch-bottom ch-wrap"><label className="ch-scrub" htmlFor="ch-progress"><span>{l.scrub}</span><input id="ch-progress" type="range" min="0" max="100" value={Math.round(progress*100)} onChange={e=>pose(+e.target.value/100)}/><output>{n(Math.round(progress*100))}%</output></label>
<div className="ch-open-strip"><span className="ch-strip-label">{label(sourceGroup)} / {n(onStage.length)}</span>{active&&<button type="button" className="ch-active-record" onClick={()=>open(sourceGroup,active.id)}><strong dir="auto">{active.title}</strong><span>{l.open}<ArrowUpRight size={16}/></span></button>}<button type="button" className="ch-next" aria-label={l.next} onClick={()=>pose(chapter===3?0:(chapter+1)/3)}><ChevronRight size={20}/></button></div>
<p className="ch-illustration">{l.note}</p></div></section>
<section id="ch-index" className="ch-index"><div className="ch-wrap"><header><span className="ch-micro">{l.index}</span><h2>{l.body}</h2><p>{l.sub}</p></header><div className="ch-catalog">{GROUPS.map((c,i)=><button type="button" key={c} onClick={()=>open(c)}><span>{num(i+1)}</span><strong>{label(c)}</strong><small>{n(records[c].length)}</small><ArrowUpRight size={18}/></button>)}</div><div className="ch-biography"><h3>{data.person.displayName}</h3><RecordText item={records.profile[0]}/></div></div></section></main>
<footer className="ch-footer ch-wrap"><a href="#ch-top" className="ch-logo">chromatin</a><span>{data.person.location}</span>{data.links.email&&<a href={data.links.email}>{t('common.email')}<ArrowUpRight size={15}/></a>}</footer>
<dialog ref={dialog} className="ch-dialog" aria-labelledby="ch-dialog-title" onClick={e=>{if(e.target===e.currentTarget)e.currentTarget.close();}}><div><header><div><span className="ch-micro">{l.index}</span><h2 id="ch-dialog-title">{label(group)}</h2></div><button type="button" aria-label={t('nav.close')} onClick={()=>dialog.current?.close()}><X size={22}/></button></header>{!only&&<div className="ch-search"><select aria-label={l.index} value={group} onChange={e=>{setGroup(e.target.value as Collection);setQuery('');}}>{GROUPS.map(c=><option key={c} value={c}>{label(c)} / {n(records[c].length)}</option>)}</select><input type="search" placeholder={l.find} aria-label={l.find} value={query} onChange={e=>setQuery(e.target.value)}/></div>}{!found.length&&<p role="status">{l.empty}</p>}{found.map((item,i)=><details key={item.id} className="ch-record" open={!!only||found.length===1}><summary><span>{num(i+1)}</span><strong dir="auto">{item.title}</strong><span aria-hidden>+</span></summary><RecordText item={item}/></details>)}</div></dialog>
</div>;
}
