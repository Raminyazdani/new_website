'use client';

import { useMemo, useState } from 'react';
import { ArrowDown, ArrowUpRight, ChevronDown, CircleDot, Clock3, File, Folder, GitBranch, Layers, Search, X } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { ProfilePhoto } from '@/components/shared/ProfilePhoto';
import { LocaleSwitcher } from '@/components/shared/LocaleSwitcher';
import { CopyButton } from '@/components/shared/CopyButton';
import { allProjects } from '@/lib/derive';
import { fmtNum, fmtYear } from '@/lib/format';
import type { SiteData } from '@/lib/types';
import { collectionLabels, makeSpecimens, matchesSpecimen, type Collection, type Specimen } from '@/designs/microcosm/specimen';
import './worktree.css';

const copy = {
  en: { world: 'A living body of work', tree: 'Working tree', branch: 'Branches', time: 'Chronology', inspect: 'Record inspector', search: 'Search the entire tree…', all: 'All records', note: 'Branches follow supplied project categories. Nodes are real projects; no commit history is implied.', timeNote: 'Dated roles, education, courses and publications, positioned by their supplied start or publication year.', undated: 'Undated', read: 'Explore records', files: 'records', parent: 'Same category', empty: 'No matching records.', mode: 'Graph view', profile: 'Profile', date: 'Start / publication year', selected: 'Selected', root: 'portfolio', methods: 'Supplied tags' },
  de: { world: 'Ein wachsendes Werk', tree: 'Arbeitsbaum', branch: 'Zweige', time: 'Chronologie', inspect: 'Eintragsdetails', search: 'Den gesamten Baum durchsuchen…', all: 'Alle Einträge', note: 'Zweige folgen den vorhandenen Projektkategorien. Knoten sind reale Projekte, keine Git-Commits.', timeNote: 'Positionen, Ausbildung, Kurse und Publikationen nach ihrem angegebenen Start- oder Publikationsjahr.', undated: 'Undatiert', read: 'Einträge erkunden', files: 'Einträge', parent: 'Gleiche Kategorie', empty: 'Keine passenden Einträge.', mode: 'Graphansicht', profile: 'Profil', date: 'Start- / Publikationsjahr', selected: 'Auswahl', root: 'portfolio', methods: 'Vorhandene Tags' },
  fa: { world: 'مجموعه‌ای زنده از کارها', tree: 'درخت کار', branch: 'شاخه‌ها', time: 'گاه‌شمار', inspect: 'بازرس رکورد', search: 'جست‌وجو در تمام درخت…', all: 'همهٔ رکوردها', note: 'شاخه‌ها بر اساس دسته‌بندی پروژه‌ها هستند. گره‌ها پروژه‌های واقعی‌اند و تاریخچهٔ کامیت نیستند.', timeNote: 'سوابق، تحصیلات، دوره‌ها و انتشارات بر اساس سال شروع یا انتشار ثبت‌شده.', undated: 'بدون تاریخ', read: 'کاوش رکوردها', files: 'رکورد', parent: 'دستهٔ مشترک', empty: 'رکوردی پیدا نشد.', mode: 'نمای گراف', profile: 'پروفایل', date: 'سال شروع یا انتشار', selected: 'انتخاب‌شده', root: 'پورتفولیو', methods: 'برچسب‌های ثبت‌شده' },
};
const colors = ['#bee684', '#71bea5', '#d7aa6a', '#9aaff5', '#e397ac'];
const categories = ['omics', 'structural', 'ml', 'software', 'biotech'] as const;
type Entry = { key: string; collection: Collection; item: Specimen; year: number | null };
const allCollections = Object.keys(collectionLabels) as Collection[];

export function WorktreeDesign({ data }: { data: SiteData }) {
  const t = useTranslations(); const s = copy[data.locale];
  const bank = useMemo(() => makeSpecimens(data, t), [data, t]);
  const projects = useMemo(() => allProjects(data), [data]);
  const rows = useMemo<Entry[]>(() => allCollections.flatMap((collection) => bank[collection].map((item, i) => ({ key: `${collection}:${item.id}:${i}`, collection, item,
    year: (collection === 'roles' ? data.experiences[i]?.startYear : collection === 'education' ? data.education[i]?.startYear : collection === 'courses' ? data.certifications[i]?.year : collection === 'papers' ? data.publications[i]?.year : collection === 'journey' ? data.journey[i]?.from : null) ?? null,
  }))), [bank, data]);
  const [selected, setSelected] = useState(rows.find((r) => r.collection === 'projects')?.key ?? rows[0]?.key);
  const [folder, setFolder] = useState<Collection | 'all'>('projects');
  const [query, setQuery] = useState(''); const [mode, setMode] = useState<'branches' | 'time'>('branches');
  const [category, setCategory] = useState<string | null>(null);
  const chosen = rows.find((r) => r.key === selected) ?? rows[0];
  const queryMatches = rows.filter((r) => matchesSpecimen(r.item, query, data.locale));
  const filtered = queryMatches.filter((r) => (folder === 'all' || r.collection === folder) && (!category || (r.collection === 'projects' && projects.find((p) => p.id === r.item.id)?.category === category)));
  const matchingIds = new Set(queryMatches.map((r) => r.item.id));
  const dates = rows.filter((r) => r.year != null && ['roles', 'education', 'courses', 'papers'].includes(r.collection));
  const years = [...new Set(dates.map((r) => r.year!))].sort((a, b) => a - b);
  const range = [years[0] ?? 2000, years.at(-1) ?? 2001];
  const n = (value: number) => fmtNum(data.locale, value);
  const choose = (row: Entry, scroll = false) => { setSelected(row.key); if (scroll) { setFolder(row.collection); setCategory(null); document.getElementById('wt-records')?.scrollIntoView({ block: 'start', behavior: 'auto' }); } };
  const chooseProject = (id: string) => { const row = rows.find((r) => r.collection === 'projects' && r.item.id === id); if (row) choose(row, true); };
  const profile = rows.find((r) => r.collection === 'profile');
  return <main className="worktree" dir={data.dir}>
    <header className="wt-top"><a href="#wt-top" className="wt-logo"><GitBranch size={22} aria-hidden /> worktree<span>/</span></a><div className="wt-owner">{data.person.displayName}<span>{s.root}</span></div><LocaleSwitcher className="wt-langs" itemClassName="wt-lang" activeClassName="wt-lang-on" /><button type="button" className="wt-face-button" aria-label={s.profile} onClick={() => profile && choose(profile, true)}><ProfilePhoto src={data.person.photo} alt={data.person.displayName} className="wt-face" size={112} priority /></button></header>
    <section id="wt-top" className="wt-graph-stage" aria-labelledby="wt-title">
      <div className="wt-title-row"><div><p className="wt-kicker"><span />{s.world}</p><h1 id="wt-title">WORK<span>TREE</span><i>↗</i></h1></div><div className="wt-summary"><b>{n(projects.length)}</b><span>{t('nav.projects')}<br />{n(rows.length)} {s.files}</span></div></div>
      <div className="wt-graph-toolbar"><div className="wt-graph-tabs" role="group" aria-label={s.mode}><button type="button" aria-pressed={mode === 'branches'} onClick={() => setMode('branches')}><GitBranch size={15} aria-hidden />{s.branch}</button><button type="button" aria-pressed={mode === 'time'} onClick={() => setMode('time')}><Clock3 size={15} aria-hidden />{s.time}</button></div><span className="wt-graph-source">{mode === 'branches' ? s.methods : s.date}</span><a href="#wt-records">{s.read}<ArrowDown size={14} aria-hidden /></a></div>
      <div className="wt-graph-controls">{mode === 'branches' && <label>{t('common.category')}<select value={category ?? 'all'} onChange={(e) => { setCategory(e.target.value === 'all' ? null : e.target.value); setFolder('projects'); }}><option value="all">{t('common.all')}</option>{categories.map((c) => <option key={c} value={c}>{t(`categories.${c}`)}</option>)}</select></label>}<label>{s.inspect}<select value={(mode === 'branches' && chosen?.collection === 'projects') || (mode === 'time' && chosen?.year != null) ? chosen?.key : ''} onChange={(e) => { const row = rows.find((r) => r.key === e.target.value); if (row) choose(row, true); }}><option value="" disabled>{s.read}</option>{(mode === 'branches' ? rows.filter((r) => r.collection === 'projects' && (!category || projects.find((p) => p.id === r.item.id)?.category === category)) : dates).map((r) => <option key={r.key} value={r.key}>{r.year != null ? `${fmtYear(data.locale, r.year)} · ` : ''}{r.item.title}</option>)}</select></label></div>
      <div className="wt-graph-wrap"><svg viewBox="0 0 1280 325" className="wt-graph" aria-hidden="true">
        <defs><pattern id="wt-grid" width="25" height="25" patternUnits="userSpaceOnUse"><circle cx="1" cy="1" r=".7" fill="#507263" /></pattern></defs><rect width="1280" height="325" fill="url(#wt-grid)" opacity=".38" />
        {mode === 'branches' ? <>
          <path d="M56 23V302" stroke="#52785f" strokeWidth="3" /><circle cx="56" cy="23" r="7" fill="#c2ee79" stroke="#111b18" strokeWidth="3" />
          {categories.map((cat, ci) => { const pp = projects.filter((p) => p.category === cat); const y = 48 + ci * 55; return <g key={cat} opacity={category && category !== cat ? .24 : 1}>
            <path d={`M56 ${y - 22} Q56 ${y} 84 ${y} H1240`} fill="none" stroke={colors[ci]} strokeWidth="1.6" opacity=".7" />
            <g className="wt-graph-category" onClick={() => { setCategory(category === cat ? null : cat); setFolder('projects'); }}><rect x="91" y={y - 17} width="179" height="33" rx="4" fill="#15291f" stroke={colors[ci]} strokeOpacity=".6" /><text x="104" y={y + 4} fill={colors[ci]}>{t(`categories.${cat}`)} / {n(pp.length)}</text></g>
            {pp.map((p, i) => { const x = 309 + (i + .5) / Math.max(pp.length, 1) * 899; const on = chosen?.collection === 'projects' && chosen.item.id === p.id; return <g key={p.id} className="wt-graph-node" onClick={() => chooseProject(p.id)} opacity={matchingIds.has(p.id) ? 1 : .13}><title>{p.title}</title>{on && <circle cx={x} cy={y} r="13" fill={colors[ci]} fillOpacity=".14" stroke={colors[ci]} strokeWidth="1" />}<circle cx={x} cy={y} r={on ? 5.8 : 4.2} fill={on ? colors[ci] : '#13201a'} stroke={colors[ci]} strokeWidth="1.8" />{i === 0 && <text x={x + 4} y={y - 13} className="wt-graph-title" fill="#cdd7ce">{p.title.length > 39 ? p.title.slice(0, 38) + '…' : p.title}</text>}</g>; })}
          </g>; })}
        </> : <>
          {['roles', 'education', 'courses', 'papers'].map((c, lane) => <g key={c}><text x="22" y={64 + lane * 61} fill={colors[lane]} className="wt-graph-title">{t(collectionLabels[c as Collection])}</text><line x1="190" x2="1230" y1={60 + lane * 61} y2={60 + lane * 61} stroke={colors[lane]} strokeOpacity=".4" /></g>)}
          {years.map((y) => { const x = 212 + (y - range[0]) / Math.max(1, range[1] - range[0]) * 996; return <g key={y}><line x1={x} x2={x} y1="27" y2="270" stroke="#40604d" strokeDasharray="3 6" /><text x={x} y="303" textAnchor="middle" fill="#a3b7a6" className="wt-graph-title">{fmtYear(data.locale, y)}</text></g>; })}
          {dates.map((r, i) => { const lane = ['roles', 'education', 'courses', 'papers'].indexOf(r.collection); const x = 212 + (r.year! - range[0]) / Math.max(1, range[1] - range[0]) * 996; const yy = 60 + lane * 61 + ((i % 3) - 1) * 10; const on = chosen?.key === r.key; return <g key={r.key} className="wt-graph-node" onClick={() => choose(r, true)} opacity={matchingIds.has(r.item.id) ? 1 : .16}><title>{r.item.title} · {r.year}</title><path d={`M${x} ${60 + lane * 61}v${yy - (60 + lane * 61)}`} stroke={colors[lane]} /><circle cx={x} cy={yy} r={on ? 7 : 4.5} fill={on ? '#e8ffc7' : colors[lane]} stroke="#14261b" strokeWidth="2" /></g>; })}
        </>}
      </svg></div>
      <div className="wt-graph-foot"><span><CircleDot size={12} aria-hidden /> {mode === 'branches' ? s.note : s.timeNote}</span><span>{n(mode === 'branches' ? projects.length : dates.length)} {s.files}</span></div>
    </section>
    <section id="wt-records" className="wt-records" aria-label={s.tree}>
      <div className="wt-records-top"><h2><Folder size={17} aria-hidden />{s.tree}<ChevronDown size={13} aria-hidden /></h2><label className="wt-search"><Search size={16} aria-hidden /><input type="search" value={query} placeholder={s.search} aria-label={s.search} onChange={(e) => { setQuery(e.target.value); if (e.target.value) { setFolder('all'); setCategory(null); } }} />{query && <button type="button" aria-label={t('common.reset')} onClick={() => setQuery('')}><X size={16} aria-hidden /></button>}</label></div>
      <div className="wt-record-layout"><nav className="wt-folders" aria-label={s.tree}><button type="button" aria-pressed={folder === 'all'} onClick={() => { setFolder('all'); setCategory(null); }}><Layers size={15} aria-hidden /><span>{s.all}</span><b>{n(rows.length)}</b></button>{allCollections.map((c) => <button key={c} type="button" aria-pressed={folder === c} onClick={() => { setFolder(c); setCategory(null); }}><Folder size={15} aria-hidden /><span>{t(collectionLabels[c])}</span><b>{n(bank[c].length)}</b></button>)}</nav>
        <div className="wt-files" aria-label={s.files}><div className="wt-path">{s.root} / {folder === 'all' ? '*' : t(collectionLabels[folder])}{category && <> / {t(`categories.${category}`)}</>}<span>{n(filtered.length)}</span></div><ul>{filtered.map((r) => <li key={r.key}><button type="button" aria-pressed={selected === r.key} onClick={() => choose(r)}><File size={14} aria-hidden /><span dir="auto"><strong>{r.item.title}</strong><small>{r.item.subtitle}</small></span><span>{r.year != null ? fmtYear(data.locale, r.year) : '↗'}</span></button></li>)}</ul>{!filtered.length && <p className="wt-empty">{s.empty}</p>}</div>
        <aside className="wt-inspect" aria-label={s.inspect}>{chosen && <><div className="wt-inspect-bar"><File size={14} aria-hidden />{t(collectionLabels[chosen.collection])}<span>{s.selected}</span></div><article key={chosen.key}>{chosen.collection === 'profile' && <ProfilePhoto src={data.person.photo} alt={data.person.displayName} className="wt-inspect-photo" size={192} />}<div className="wt-inspect-kicker">{s.inspect}</div><h3 dir="auto" aria-live="polite">{chosen.item.title}</h3>{chosen.item.subtitle && <p className="wt-inspect-sub" dir="auto">{chosen.item.subtitle}</p>}{chosen.item.body.map((p, i) => <p key={i}>{p}</p>)}{chosen.item.methods?.length ? <ul className="wt-tags">{chosen.item.methods.map((m, i) => <li key={`${m}:${i}`}>{m}</li>)}</ul> : null}{chosen.item.facts?.length ? <dl>{chosen.item.facts.map(([k, v], i) => <div key={`${k}:${i}`}><dt>{k}</dt><dd>{v}</dd></div>)}</dl> : null}<div className="wt-links">{chosen.item.links?.map(([label, url], i) => <a key={i} href={url} target={url.startsWith('mailto:') ? undefined : '_blank'} rel="noreferrer">{label}<ArrowUpRight size={14} aria-hidden /></a>)}{chosen.item.citation && <CopyButton value={chosen.item.citation}>{t('common.copyBibtex')}</CopyButton>}</div></article></>}</aside>
      </div>
    </section><footer className="wt-footer"><GitBranch size={15} aria-hidden /><span>{data.person.displayName}</span><span>{n(rows.length)} {s.files}</span><a href="#wt-top">↑ {t('nav.top')}</a></footer>
  </main>;
}
export default WorktreeDesign;
