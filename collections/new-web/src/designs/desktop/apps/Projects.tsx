'use client';

import { useEffect, useMemo, useRef, useState, type KeyboardEvent } from 'react';
import { useTranslations } from 'next-intl';
import { ArrowUpRight, ChevronLeft, LayoutGrid, List, Search, Sparkles } from 'lucide-react';
import { BrandIcon } from '@/components/shared/BrandIcon';
import { allProjects } from '@/lib/derive';
import { fmtNum } from '@/lib/format';
import type { Project, ProjectCategory, SiteData } from '@/lib/types';
import { cn } from '@/lib/utils';
import type { Intent } from '../apps';
import { Badge, CAT, CatIcon, fold, sepOf, useNarrow } from './ui';

type Place = 'all' | 'highlights' | 'archive' | ProjectCategory;
const CATS: ProjectCategory[] = ['omics', 'structural', 'ml', 'software', 'biotech'];

/**
 * Projects as a file browser: places sidebar, list / icon view, preview pane — all 46 projects.
 * Filtering only hides rows (they stay in the DOM and come back in the document view).
 * Narrow windows (and phones) switch to list → detail navigation.
 */
export function Projects({ data, intent }: { data: SiteData; intent: Intent | null }) {
  const t = useTranslations();
  const loc = data.locale;
  const sep = sepOf(loc);
  const all = useMemo(() => allProjects(data), [data]);
  const archived = useMemo(() => new Set(data.archive.map((p) => p.id)), [data]);
  const [place, setPlace] = useState<Place>('all');
  const [q, setQ] = useState('');
  const [view, setView] = useState<'list' | 'icons'>('list');
  const [sel, setSel] = useState<string>(() => (data.projects.find((p) => p.highlight) ?? all[0]).id);
  const [detail, setDetail] = useState(false);
  const box = useRef<HTMLDivElement>(null);
  const narrow = useNarrow(box, 640);

  const inPlace = (p: Project, pl: Place) => pl === 'all' || (pl === 'highlights' ? p.highlight : pl === 'archive' ? archived.has(p.id) : p.category === pl);
  const key = fold(q.trim());
  const matches = (p: Project) => !key || fold(`${p.title} ${p.tags.join(' ')} ${p.description}`).includes(key);
  const shown = all.filter((p) => inPlace(p, place) && matches(p));
  const shownIds = new Set(shown.map((p) => p.id));
  const current = all.find((p) => p.id === sel) ?? all[0];
  const tabStop = shownIds.has(sel) ? sel : shown[0]?.id;

  const places: Array<{ id: Place; label: string; n: number }> = [
    { id: 'all', label: t('desktop.projects.all'), n: all.length },
    { id: 'highlights', label: t('desktop.projects.highlights'), n: all.filter((p) => p.highlight).length },
    { id: 'archive', label: t('common.archive'), n: data.archive.length },
    ...CATS.map((c) => ({ id: c as Place, label: t(`categories.${c}`), n: all.filter((p) => p.category === c).length })),
  ];

  const focusRow = (id: string) => requestAnimationFrame(() => document.getElementById(`prj-${id}`)?.focus());
  const open = (id: string) => {
    setSel(id);
    if (narrow) {
      setDetail(true);
      requestAnimationFrame(() => document.getElementById('prj-preview-title')?.focus());
    }
  };

  useEffect(() => {
    if (intent?.app !== 'projects' || !intent.id) return;
    setPlace('all');
    setQ('');
    setSel(intent.id);
    if (narrow) setDetail(true);
    const id = window.setTimeout(() => {
      const row = document.getElementById(`prj-${intent.id}`);
      row?.scrollIntoView({ block: 'nearest' });
      if (!narrow) row?.focus();
    }, 60);
    return () => window.clearTimeout(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [intent]);

  const onKey = (e: KeyboardEvent<HTMLUListElement>) => {
    const i = shown.findIndex((p) => p.id === sel);
    const cols = view === 'icons' ? Math.max(1, Math.round((e.currentTarget.clientWidth || 1) / 132)) : 1;
    const rtl = loc === 'fa';
    const step: Record<string, number> = {
      ArrowDown: cols,
      ArrowUp: -cols,
      ...(view === 'icons' ? { ArrowRight: rtl ? -1 : 1, ArrowLeft: rtl ? 1 : -1 } : {}),
      Home: -Infinity,
      End: Infinity,
    };
    if (!(e.key in step) || !shown.length) return;
    e.preventDefault();
    const d = step[e.key];
    const k = d === -Infinity ? 0 : d === Infinity ? shown.length - 1 : Math.max(0, Math.min(shown.length - 1, (i < 0 ? 0 : i) + d));
    setSel(shown[k].id);
    focusRow(shown[k].id);
  };

  const link = (p: Project) =>
    p.url ? (
      <a href={p.url} target="_blank" rel="noreferrer" className="dt-btn">
        {p.repo ? <BrandIcon name="github" className="size-4" /> : <ArrowUpRight className="size-4" aria-hidden />}
        {p.repo ? t('common.code') : t('common.visit')}
      </a>
    ) : (
      <span className="dt-muted text-[12.5px]">{t('common.noLink')}</span>
    );

  return (
    <div ref={box} className="dt-files" data-view={view} data-detail={detail && narrow ? '' : undefined}>
      <nav className="dt-side" aria-label={t('desktop.projects.places')}>
        <ul>
          {places.map((pl, i) => (
            <li key={pl.id} className={cn(i === 3 && 'dt-side-gap')}>
              <button type="button" className="dt-side-item" aria-current={place === pl.id ? 'true' : undefined} onClick={() => setPlace(pl.id)}>
                {pl.id === 'all' || pl.id === 'highlights' || pl.id === 'archive' ? (
                  <Sparkles className={cn('size-4 shrink-0', pl.id !== 'highlights' && 'opacity-0')} aria-hidden />
                ) : (
                  <span className="dt-dotc" style={{ background: CAT[pl.id as ProjectCategory].color }} aria-hidden />
                )}
                <span className="min-w-0 flex-1 truncate">{pl.label}</span>
                <span className="dt-count">{fmtNum(loc, pl.n)}</span>
              </button>
            </li>
          ))}
        </ul>
      </nav>

      <div className="dt-files-main">
        <div className="dt-toolbar">
          <label className="dt-select-wrap">
            <span className="sr-only">{t('desktop.projects.places')}</span>
            <select className="dt-select" value={place} onChange={(e) => setPlace(e.target.value as Place)}>
              {places.map((pl) => (
                <option key={pl.id} value={pl.id}>
                  {pl.label} ({fmtNum(loc, pl.n)})
                </option>
              ))}
            </select>
          </label>
          <label className="dt-search">
            <Search className="size-4 shrink-0 opacity-60" aria-hidden />
            <span className="sr-only">{t('desktop.projects.search')}</span>
            <input type="search" value={q} onChange={(e) => setQ(e.target.value)} placeholder={t('desktop.projects.search')} />
          </label>
          <div className="dt-seg" role="group" aria-label={t('desktop.projects.view')}>
            <button type="button" aria-pressed={view === 'list'} aria-label={t('desktop.projects.list')} title={t('desktop.projects.list')} onClick={() => setView('list')}>
              <List className="size-4" aria-hidden />
            </button>
            <button type="button" aria-pressed={view === 'icons'} aria-label={t('desktop.projects.icons')} title={t('desktop.projects.icons')} onClick={() => setView('icons')}>
              <LayoutGrid className="size-4" aria-hidden />
            </button>
          </div>
        </div>

        <ul className="dt-filelist" aria-label={t('desktop.projects.items', { count: shown.length })} onKeyDown={onKey}>
          {all.map((p) => {
            const vis = shownIds.has(p.id);
            return (
              <li key={p.id} className={cn('dt-file', !vis && 'dt-filtered')}>
                <button
                  type="button"
                  id={`prj-${p.id}`}
                  className="dt-file-btn"
                  aria-current={p.id === sel ? 'true' : undefined}
                  tabIndex={p.id === tabStop ? 0 : -1}
                  onClick={() => open(p.id)}
                  onFocus={() => !narrow && setSel(p.id)}
                >
                  <CatIcon cat={p.category} className="dt-file-ico" />
                  <span className="dt-file-main">
                    <span className="dt-file-title" dir="auto">
                      {p.title}
                    </span>
                    <span className="dt-file-desc" dir="auto">
                      {p.description}
                    </span>
                  </span>
                  <span className="dt-file-kind">
                    {t(`categories.${p.category}`)}
                    {archived.has(p.id) ? sep + t('common.archive') : ''}
                  </span>
                </button>
                {/* document view only: tags and link next to the full description */}
                <div className="dt-file-extra">
                  <span className="dt-tags">
                    {p.tags.map((tag) => (
                      <bdi key={tag} className="dt-tag">
                        {tag}
                      </bdi>
                    ))}
                  </span>
                  {p.url && (
                    <a href={p.url} target="_blank" rel="noreferrer" className="dt-link" dir="ltr">
                      {p.url.replace(/^https?:\/\/(www\.)?/, '')}
                    </a>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
        {!shown.length && <p className="dt-empty">{t('common.noResults')}</p>}
        <p className="dt-statusbar">
          {t('desktop.projects.status', { shown: shown.length, total: all.length })}
          <span className="truncate" dir="auto">
            {current.title}
          </span>
        </p>
      </div>

      <aside className="dt-preview" aria-labelledby="prj-preview-title">
        <button
          type="button"
          className="dt-back-inline"
          onClick={() => {
            setDetail(false);
            focusRow(current.id);
          }}
        >
          <ChevronLeft className="flip-rtl size-4" aria-hidden />
          {t('desktop.apps.projects')}
        </button>
        <CatIcon cat={current.category} className="dt-preview-ico" />
        <h3 id="prj-preview-title" tabIndex={-1} className="dt-h3 mt-3" dir="auto">
          {current.title}
        </h3>
        <p className="mt-1 flex flex-wrap gap-1.5">
          <Badge>{t(`categories.${current.category}`)}</Badge>
          {current.highlight && <Badge tone="accent">{t('desktop.projects.highlight')}</Badge>}
          {archived.has(current.id) && <Badge>{t('common.archive')}</Badge>}
        </p>
        {current.metric && <p className="dt-callout mt-3 text-[13.5px]">{current.metric}</p>}
        <p className="dt-desc mt-3" dir="auto">
          {current.description}
        </p>
        <p className="dt-meta mt-4">{t('common.tags')}</p>
        <p className="dt-tags mt-1">
          {current.tags.map((tag) => (
            <bdi key={tag} className="dt-tag">
              {tag}
            </bdi>
          ))}
        </p>
        <p className="mt-4">{link(current)}</p>
      </aside>
    </div>
  );
}
