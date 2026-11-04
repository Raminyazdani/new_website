'use client';

import { useEffect, useMemo, useState } from 'react';
import { useTranslations } from 'next-intl';
import { Search } from 'lucide-react';
import { fmtNum } from '@/lib/format';
import type { SiteData } from '@/lib/types';
import { cn } from '@/lib/utils';
import type { Intent } from '../apps';
import { fold, sepOf } from './ui';

/** Skills as a settings app: categories → groups → items (all 202, soft skills included), with search.
    Inactive panes are hidden, not removed — the document view shows every pane. */
export function Skills({ data, intent }: { data: SiteData; intent: Intent | null }) {
  const t = useTranslations();
  const loc = data.locale;
  const sep = sepOf(loc);
  const cats = data.skills;
  const [cat, setCat] = useState(cats[0]?.id);
  const [q, setQ] = useState('');
  const [flash, setFlash] = useState<string | null>(null);
  const flat = useMemo(
    () => cats.flatMap((c) => c.groups.flatMap((g) => g.items.map((it) => ({ ...it, uid: `${g.id}/${it.key}`, cat: c.id, catLabel: c.label, group: g.label })))),
    [cats],
  );
  const domId = useMemo(() => new Map(flat.map((s, i) => [s.uid, `sk-${i}`])), [flat]);
  const key = fold(q.trim());
  const hits = key ? flat.filter((s) => fold(`${s.name} ${s.long} ${s.group}`).includes(key)) : [];
  const count = (id: string) => flat.filter((s) => s.cat === id).length;

  useEffect(() => {
    if (intent?.app !== 'skills') return;
    const s = flat.find((x) => x.uid === intent.id);
    if (!s) return;
    setQ('');
    setCat(s.cat);
    setFlash(s.uid);
    const a = window.setTimeout(() => document.getElementById(domId.get(s.uid)!)?.scrollIntoView({ block: 'center' }), 60);
    const b = window.setTimeout(() => setFlash(null), 1800);
    return () => {
      window.clearTimeout(a);
      window.clearTimeout(b);
    };
  }, [intent, flat, domId]);

  return (
    <div className="dt-split dt-settings">
      <nav className="dt-side" aria-label={t('desktop.skills.categories')}>
        <ul>
          {cats.map((c) => (
            <li key={c.id}>
              <button
                type="button"
                className="dt-side-item"
                aria-current={!key && cat === c.id ? 'true' : undefined}
                onClick={() => {
                  setCat(c.id);
                  setQ('');
                }}
              >
                <span className="min-w-0 flex-1">{c.label}</span>
                <span className="dt-count">{fmtNum(loc, count(c.id))}</span>
              </button>
            </li>
          ))}
        </ul>
      </nav>
      <div className="dt-pane">
        <div className="dt-toolbar dt-toolbar-sticky">
          <label className="dt-select-wrap">
            <span className="sr-only">{t('desktop.skills.categories')}</span>
            <select
              className="dt-select"
              value={cat}
              onChange={(e) => {
                setCat(e.target.value);
                setQ('');
              }}
            >
              {cats.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.label} ({fmtNum(loc, count(c.id))})
                </option>
              ))}
            </select>
          </label>
          <label className="dt-search">
            <Search className="size-4 shrink-0 opacity-60" aria-hidden />
            <span className="sr-only">{t('desktop.skills.search')}</span>
            <input type="search" value={q} onChange={(e) => setQ(e.target.value)} placeholder={t('desktop.skills.search')} />
          </label>
        </div>

        {key && (
          <section className="dt-results" aria-live="polite">
            <h3 className="dt-h3">{t('desktop.skills.results', { count: hits.length })}</h3>
            {hits.length ? (
              <ul className="dt-rows mt-3">
                {hits.map((s) => (
                  <li key={s.uid} className="dt-rowitem">
                    <bdi className="font-medium">{s.name}</bdi>
                    <span className="dt-muted text-[12.5px]">
                      {s.catLabel}
                      {sep}
                      {s.group}
                    </span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="dt-empty">{t('common.noResults')}</p>
            )}
          </section>
        )}

        {cats.map((c) => (
          <section key={c.id} className={cn('dt-skillpane', (key || cat !== c.id) && 'dt-inactive')} aria-labelledby={`skc-${c.id}`}>
            <h3 id={`skc-${c.id}`} className="dt-h3 dt-pane-title">
              {c.label}
            </h3>
            <p className="dt-muted text-[13px]">{t('desktop.skills.summary', { count: count(c.id), groups: c.groups.length })}</p>
            {c.groups.map((g) => (
              <div key={g.id} className="mt-4">
                <h4 className="dt-h4">{g.label}</h4>
                <ul className="dt-rows mt-1.5">
                  {g.items.map((it) => {
                    const uid = `${g.id}/${it.key}`;
                    return (
                      <li key={uid} id={domId.get(uid)} className={cn('dt-rowitem', flash === uid && 'dt-flash')}>
                        <bdi className="font-medium">{it.name}</bdi>
                        {it.long !== it.name && (
                          <bdi className="dt-muted text-[12.5px]" dir="auto">
                            {it.long}
                          </bdi>
                        )}
                      </li>
                    );
                  })}
                </ul>
              </div>
            ))}
          </section>
        ))}
      </div>
    </div>
  );
}
