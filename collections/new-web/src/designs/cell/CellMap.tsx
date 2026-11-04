'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useTranslations } from 'next-intl';
import { Lens } from '@/components/magicui/lens';
import { fmtNum } from '@/lib/format';
import type { SiteData } from '@/lib/types';
import { cn } from '@/lib/utils';
import { cellGeometry, fitBox, MAP_H, MAP_W, type OrgId } from './geometry';
import { CATS, Contact, Courses, Education, Focus, Identity, Languages, Projects, Publications, Roles, Skills } from './Lists';

export const ORGS: OrgId[] = ['nucleus', 'nucleolus', 'chromatin', 'mito', 'er', 'golgi', 'vesicles', 'ribosomes', 'channels', 'receptors'];
export const ORG_COLOR: Record<OrgId, [string, string]> = {
  nucleus: ['#c9b8ec', '#8a72c8'],
  nucleolus: ['#9d86d8', '#6d55b0'],
  chromatin: ['#9d86d8', '#6d55b0'],
  mito: ['#f59a8b', '#d96a5e'],
  er: ['#9fd8cf', '#4f9e93'],
  golgi: ['#f7d06b', '#c99a26'],
  vesicles: ['#a8dbb5', '#5ea877'],
  ribosomes: ['#4f9e93', '#2f6e66'],
  channels: ['#f6b38e', '#b8623c'],
  receptors: ['#f4a3c4', '#c0577f'],
};

export function orgCount(data: SiteData, id: OrgId): number {
  const links = (['github', 'linkedin', 'orcid', 'scholar'] as const).filter((k) => data.links[k]).length + 1;
  return {
    nucleus: 1,
    nucleolus: data.current.length,
    chromatin: data.education.length,
    mito: data.experiences.length,
    er: data.projects.length + data.archive.length,
    golgi: data.publications.length,
    vesicles: data.certifications.length,
    ribosomes: data.skills.reduce((n, c) => n + c.groups.reduce((m, g) => m + g.items.length, 0), 0),
    channels: data.languages.length,
    receptors: links,
  }[id];
}

/** Small organelle glyph for the index and the chapters. */
export function OrgIcon({ id, size = 22 }: { id: OrgId; size?: number }) {
  const [f, s] = ORG_COLOR[id];
  const g = {
    nucleus: <circle cx={12} cy={12} r={9} fill={f} stroke={s} strokeWidth={1.5} />,
    nucleolus: (
      <>
        <circle cx={12} cy={12} r={9} fill="#e7defa" stroke="#8a72c8" strokeWidth={1.2} />
        <circle cx={13} cy={10} r={4} fill={f} stroke={s} strokeWidth={1.2} />
      </>
    ),
    chromatin: (
      <>
        <circle cx={12} cy={12} r={9} fill="#e7defa" stroke="#8a72c8" strokeWidth={1.2} />
        <path d="M6 13c2-4 4 2 6-2s4 3 6-1" fill="none" stroke={s} strokeWidth={1.6} />
      </>
    ),
    mito: (
      <>
        <rect x={2} y={7} width={20} height={10} rx={5} fill={f} stroke={s} strokeWidth={1.4} />
        <path d="M6 15l2-6 2 6 2-6 2 6 2-6" fill="none" stroke={s} strokeWidth={1} />
      </>
    ),
    er: (
      <>
        <path d="M4 18c2-8 8-12 16-12" fill="none" stroke={s} strokeWidth={4} strokeLinecap="round" />
        <path d="M4 18c2-8 8-12 16-12" fill="none" stroke={f} strokeWidth={2} strokeLinecap="round" />
        <circle cx={9} cy={9} r={1.6} fill="#2f6e66" />
        <circle cx={14} cy={6.5} r={1.6} fill="#2f6e66" />
      </>
    ),
    golgi: (
      <>
        <path d="M4 9q8-5 16 0M5 13q7-5 14 0M7 17q5-4 10 0" fill="none" stroke={s} strokeWidth={3} strokeLinecap="round" />
      </>
    ),
    vesicles: (
      <>
        <circle cx={8} cy={9} r={4} fill={f} stroke={s} strokeWidth={1.2} />
        <circle cx={16} cy={14} r={5} fill={f} stroke={s} strokeWidth={1.2} />
      </>
    ),
    ribosomes: (
      <>
        {[
          [6, 8],
          [12, 5],
          [17, 10],
          [9, 15],
          [16, 17],
        ].map(([x, y], i) => (
          <circle key={i} cx={x} cy={y} r={2.2} fill={f} />
        ))}
      </>
    ),
    channels: (
      <>
        <rect x={2} y={10} width={20} height={4} fill="#fde6d2" stroke="#d9825b" strokeWidth={1} />
        <rect x={7} y={5} width={4} height={14} rx={2} fill={f} stroke={s} strokeWidth={1.2} />
        <rect x={13} y={5} width={4} height={14} rx={2} fill={f} stroke={s} strokeWidth={1.2} />
      </>
    ),
    receptors: (
      <>
        <rect x={2} y={14} width={20} height={4} fill="#fde6d2" stroke="#d9825b" strokeWidth={1} />
        <path d="M12 16V9M12 9l-4-5M12 9l4-5" fill="none" stroke={s} strokeWidth={2.2} strokeLinecap="round" />
      </>
    ),
  }[id];
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden className="shrink-0">
      {g}
    </svg>
  );
}

function Panel({ id, data }: { id: OrgId; data: SiteData }) {
  switch (id) {
    case 'nucleus':
      return <Identity data={data} compact />;
    case 'nucleolus':
      return <Focus data={data} />;
    case 'chromatin':
      return <Education data={data} compact />;
    case 'mito':
      return <Roles data={data} compact />;
    case 'er':
      return <Projects data={data} compact />;
    case 'golgi':
      return <Publications data={data} compact />;
    case 'vesicles':
      return <Courses data={data} compact />;
    case 'ribosomes':
      return <Skills data={data} compact />;
    case 'channels':
      return <Languages data={data} />;
    case 'receptors':
      return <Contact data={data} />;
  }
}

/**
 * The cell map: a cross-section whose organelles are the CV sections. The organelle index is the
 * keyboard path; selecting zooms the drawing (CSS transform, instant under reduced motion) and fills the panel.
 */
export function CellMap({ data, focus, setFocus, reduce }: { data: SiteData; focus: OrgId | null; setFocus: (f: OrgId | null) => void; reduce: boolean }) {
  const t = useTranslations();
  const loc = data.locale;
  const all = [...data.projects, ...data.archive];
  const geo = useMemo(
    () =>
      cellGeometry({
        roles: data.experiences.length,
        courses: data.certifications.length,
        skills: orgCount(data, 'ribosomes'),
        languages: data.languages.length,
        receptors: orgCount(data, 'receptors'),
        publications: data.publications.length,
        degrees: data.education.length,
        sheets: CATS.map((c) => all.filter((x) => x.category === c).length),
      }),
    [data], // eslint-disable-line react-hooks/exhaustive-deps
  );
  const [lens, setLens] = useState(false);
  const [fine, setFine] = useState(false);
  const field = useRef<HTMLDivElement>(null);
  useEffect(() => setFine(window.matchMedia('(pointer: fine)').matches), []);

  // zoom = a composited CSS transform on the drawing (no re-raster per frame); the viewBox never changes
  const box = focus ? fitBox(geo.boxes[focus]) : { x: 0, y: 0, w: MAP_W, h: MAP_H };
  const zoom = `scale(${(MAP_W / box.w).toFixed(4)}) translate(${((-box.x / MAP_W) * 100).toFixed(3)}%, ${((-box.y / MAP_H) * 100).toFixed(3)}%)`;

  // the cytoplasm drift pauses off-screen
  useEffect(() => {
    const el = field.current;
    if (!el) return;
    const io = new IntersectionObserver(([e]) => (el.dataset.paused = e.isIntersecting ? '' : '1'));
    io.observe(el);
    return () => io.disconnect();
  }, []);

  const dim = (id: OrgId) => (focus && focus !== id && !(focus === 'chromatin' && id === 'nucleus') && !(focus === 'nucleolus' && id === 'nucleus') ? 'cm-dim' : '');
  const hit = (id: OrgId) => ({ onClick: () => setFocus(focus === id ? null : id), 'data-org': id, className: cn('cm-org', dim(id)) });
  const viewBox = `0 0 ${MAP_W} ${MAP_H}`;

  const drawing = (
    <div className="relative overflow-hidden rounded-[16px]">
      <div className={cn('cm-zoom relative', reduce && 'cm-zoom-still')} style={{ transform: zoom }}>
        <svg viewBox={viewBox} direction="ltr" className="block h-auto w-full" role="img" aria-label={t('cell.mapLabel')}>
          <defs>
            <radialGradient id="cm-cyto" cx="50%" cy="45%" r="60%">
              <stop offset="0%" stopColor="#fff1e4" />
              <stop offset="100%" stopColor="#fde0c8" />
            </radialGradient>
          </defs>
          {/* membrane + cytoplasm */}
          <path d={geo.membrane} fill="#f6b38e" />
          <path d={geo.membraneIn} fill="url(#cm-cyto)" stroke="#d9825b" strokeWidth={2} />
          {/* ion channels (languages) */}
          <g {...hit('channels')}>
            <title>{t('cell.org.channels')}</title>
            {geo.channels.map((c, i) => (
              <g key={i} transform={`translate(${c.x} ${c.y}) rotate(${c.rot})`}>
                <rect x={-16} y={-13} width={12} height={26} rx={5} fill="#f6b38e" stroke="#b8623c" strokeWidth={1.6} />
                <rect x={4} y={-13} width={12} height={26} rx={5} fill="#f6b38e" stroke="#b8623c" strokeWidth={1.6} />
                <circle cx={0} cy={0} r={3} fill="#b8623c" />
              </g>
            ))}
          </g>
          {/* receptors (contact) */}
          <g {...hit('receptors')}>
            <title>{t('cell.org.receptors')}</title>
            {geo.receptors.map((c, i) => (
              <g key={i} transform={`translate(${c.x} ${c.y}) rotate(${c.rot + 90})`}>
                <path d="M0 10 V-8 M0 -8 L-9 -22 M0 -8 L9 -22" fill="none" stroke="#c0577f" strokeWidth={5} strokeLinecap="round" />
                <path d="M0 10 V-8 M0 -8 L-9 -22 M0 -8 L9 -22" fill="none" stroke="#f4a3c4" strokeWidth={2.4} strokeLinecap="round" />
              </g>
            ))}
          </g>
          {/* rough ER with bound ribosomes (projects) */}
          <g {...hit('er')}>
            <title>{t('cell.org.er')}</title>
            {geo.er.map((s, k) => (
              <g key={k}>
                <path d={s.d} fill="none" stroke="#4f9e93" strokeWidth={13} strokeLinecap="round" />
                <path d={s.d} fill="none" stroke="#9fd8cf" strokeWidth={8.5} strokeLinecap="round" />
                {s.ribos.map((r, i) => (
                  <circle key={i} cx={r.x} cy={r.y} r={3.6} fill="#2f6e66" />
                ))}
              </g>
            ))}
          </g>
          {/* nucleus (identity) with chromatin (education) and nucleolus (current focus) */}
          <g {...hit('nucleus')}>
            <title>{t('cell.org.nucleus')}</title>
            <path d={geo.nucleus} fill="#b9a5e6" />
            <path d={geo.nucleusIn} fill="#e3d9f8" stroke="#8a72c8" strokeWidth={1.6} />
            {geo.pores.map((p, i) => (
              <circle key={i} cx={p.x} cy={p.y} r={3} fill="#fde6d2" />
            ))}
          </g>
          <g {...hit('chromatin')}>
            <title>{t('cell.org.chromatin')}</title>
            {geo.chromatin.map((d, i) => (
              <path key={i} d={d} fill="none" stroke={['#7e65c2', '#9d86d8', '#6d55b0'][i % 3]} strokeWidth={5} strokeLinecap="round" strokeLinejoin="round" opacity={0.85} />
            ))}
          </g>
          <g {...hit('nucleolus')}>
            <title>{t('cell.org.nucleolus')}</title>
            <path d={geo.nucleolus.d} fill="#9d86d8" stroke="#6d55b0" strokeWidth={1.6} />
          </g>
          {/* Golgi (publications) */}
          <g {...hit('golgi')}>
            <title>{t('cell.org.golgi')}</title>
            {geo.golgi.map((c, i) => (
              <g key={i}>
                <path d={c.d} fill="none" stroke="#c99a26" strokeWidth={12} strokeLinecap="round" />
                <path d={c.d} fill="none" stroke="#f7d06b" strokeWidth={7.5} strokeLinecap="round" />
              </g>
            ))}
          </g>
          {/* mitochondria (roles) */}
          <g {...hit('mito')}>
            <title>{t('cell.org.mito')}</title>
            {geo.mito.map((m, i) => (
              <g key={i} transform={`translate(${m.x} ${m.y}) rotate(${m.rot})`}>
                <path d={m.d} fill="#f59a8b" stroke="#d96a5e" strokeWidth={2.2} />
                <path d={m.cristae} fill="none" stroke="#d96a5e" strokeWidth={1.8} strokeLinecap="round" />
              </g>
            ))}
          </g>
          {/* vesicles (courses) */}
          <g {...hit('vesicles')}>
            <title>{t('cell.org.vesicles')}</title>
            {geo.vesicles.map((v, i) => (
              <circle key={i} cx={v.x} cy={v.y} r={v.r} fill="#a8dbb5" stroke="#5ea877" strokeWidth={1.6} />
            ))}
          </g>
        </svg>
        {/* free ribosomes (skills) on their own layer: the gentle drift moves the layer, not the dots */}
        <svg viewBox={viewBox} direction="ltr" aria-hidden className={cn('cm-drift pointer-events-none absolute inset-0 h-full w-full', dim('ribosomes'))}>
          {geo.ribosomes.map((r, i) => (
            <circle key={i} cx={r.x} cy={r.y} r={2.6} fill="#4f9e93" />
          ))}
        </svg>
      </div>
    </div>
  );

  return (
    <div className="grid gap-8 lg:grid-cols-[minmax(0,1.55fr)_minmax(0,1fr)] lg:items-start">
      <div>
        <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
          <p className="text-[13px] text-[#67596b]">{t('cell.mapHint')}</p>
          <div className="flex gap-2">
            {focus && (
              <button type="button" onClick={() => setFocus(null)} className="cl-btn">
                {t('cell.reset')}
              </button>
            )}
            {fine && (
              <button type="button" aria-pressed={lens} onClick={() => setLens((v) => !v)} className={cn('cl-btn', lens && 'cl-btn-solid')}>
                {t('cell.lens')}
              </button>
            )}
          </div>
        </div>
        <div ref={field} className="cm-field">
          {lens ? (
            <Lens zoomFactor={2} lensSize={200} lensColor="black" ariaLabel={t('cell.lens')}>
              {drawing}
            </Lens>
          ) : (
            drawing
          )}
        </div>
        <p className="mt-2 text-[12.5px] italic text-[#67596b]">{t('cell.honesty')}</p>
      </div>

      <div className="space-y-5 lg:sticky lg:top-24">
        <nav aria-label={t('cell.index')}>
          <h3 className="cl-h4">{t('cell.index')}</h3>
          <ul className="mt-2 grid grid-cols-1 gap-1 sm:grid-cols-2">
            {ORGS.map((id) => (
              <li key={id}>
                <button type="button" aria-pressed={focus === id} aria-controls="cm-panel" onClick={() => setFocus(focus === id ? null : id)} className={cn('cm-idx', focus === id && 'cm-idx-on')}>
                  <OrgIcon id={id} />
                  <span className="min-w-0 flex-1 text-start">
                    <span className="block text-[13.5px] font-semibold leading-tight">{t(`cell.org.${id}`)}</span>
                    <span className="block text-[12px] leading-tight text-[#67596b]">
                      {t(`cell.map.${id}`)}
                      {loc === 'fa' ? '، ' : ' · '}
                      {fmtNum(loc, orgCount(data, id))}
                    </span>
                  </span>
                </button>
              </li>
            ))}
          </ul>
        </nav>
        <div id="cm-panel" className="cl-card max-h-[60vh] overflow-y-auto" aria-live="polite" tabIndex={-1}>
          {focus ? (
            <>
              <p className="flex items-center gap-2">
                <OrgIcon id={focus} size={26} />
                <span>
                  <span className="cl-display block text-[19px] leading-tight">{t(`cell.org.${focus}`)}</span>
                  <span className="block text-[12.5px] text-[#67596b]">{t(`cell.map.${focus}`)}</span>
                </span>
              </p>
              <div className="mt-4">
                <Panel id={focus} data={data} />
              </div>
            </>
          ) : (
            <p className="text-[14px] text-[#67596b]">{t('cell.panelPrompt')}</p>
          )}
        </div>
      </div>
    </div>
  );
}
