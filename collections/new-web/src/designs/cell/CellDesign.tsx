'use client';

import { useEffect, useState } from 'react';
import { useReducedMotion } from 'motion/react';
import { useTranslations } from 'next-intl';
import { LocaleSwitcher } from '@/components/shared/LocaleSwitcher';
import { fmtNum, fmtYear } from '@/lib/format';
import type { SiteData } from '@/lib/types';
import { cn } from '@/lib/utils';
import { CellMap, OrgIcon, orgCount } from './CellMap';
import type { OrgId } from './geometry';
import { Contact, Courses, Education, Identity, Languages, Projects, Publications, Roles, Skills } from './Lists';
import { Molecule } from './Molecule';
import { Tissue } from './Tissue';
import './cell.css';

type Scale = 'tissue' | 'cell' | 'organelle' | 'molecule';
const SCALES: Scale[] = ['tissue', 'cell', 'organelle', 'molecule'];
/** illustrative scale-bar lengths (typical orders of magnitude, not measurements) */
const BAR: Record<Scale, [number, string]> = { tissue: [100, 'µm'], cell: [10, 'µm'], organelle: [1, 'µm'], molecule: [10, 'nm'] };

const CHAPTERS: Array<{ id: string; org: OrgId; key: string }> = [
  { id: 'ch-identity', org: 'nucleus', key: 'identity' },
  { id: 'ch-roles', org: 'mito', key: 'roles' },
  { id: 'ch-projects', org: 'er', key: 'projects' },
  { id: 'ch-publications', org: 'golgi', key: 'publications' },
  { id: 'ch-education', org: 'chromatin', key: 'education' },
  { id: 'ch-skills', org: 'ribosomes', key: 'skills' },
  { id: 'ch-courses', org: 'vesicles', key: 'courses' },
  { id: 'ch-languages', org: 'channels', key: 'languages' },
  { id: 'ch-contact', org: 'receptors', key: 'contact' },
];

export default function CellDesign({ data }: { data: SiteData }) {
  const t = useTranslations();
  const loc = data.locale;
  const p = data.person;
  const rm = useReducedMotion();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  const reduce = mounted ? !!rm : true;
  const [focus, setFocus] = useState<OrgId | null>(null);
  const [zoomed, setZoomed] = useState(false);
  const [scale, setScale] = useState<Scale>('tissue');

  // the scale follows the section in view (and the organelle selection)
  useEffect(() => {
    const ids = ['tissue', 'cellmap', 'molecule'];
    const io = new IntersectionObserver(
      (es) => {
        for (const e of es)
          if (e.isIntersecting) {
            const id = e.target.id;
            setScale((s) => (id === 'tissue' ? 'tissue' : id === 'molecule' ? 'molecule' : s === 'organelle' ? s : 'cell'));
          }
      },
      { rootMargin: '-45% 0px -45% 0px' },
    );
    ids.forEach((id) => {
      const el = document.getElementById(id);
      if (el) io.observe(el);
    });
    return () => io.disconnect();
  }, []);

  const go = (id: string) => document.getElementById(id)?.scrollIntoView({ behavior: reduce ? 'instant' : 'smooth', block: 'start' });
  const pick = (s: Scale) => {
    setScale(s);
    if (s === 'tissue') {
      setZoomed(false);
      go('tissue');
    } else if (s === 'cell') {
      setFocus(null);
      go('cellmap');
    } else if (s === 'organelle') {
      setFocus((f) => f ?? 'nucleus');
      go('cellmap');
    } else go('molecule');
  };
  const choose = (f: OrgId | null) => {
    setFocus(f);
    setScale(f ? 'organelle' : 'cell');
  };

  return (
    <div className="cell-root min-h-dvh">
      <a href="#cellmap" className="sr-only focus:not-sr-only focus:fixed focus:start-3 focus:top-3 focus:z-50 focus:rounded-full focus:bg-[#2a2230] focus:px-4 focus:py-2 focus:text-white">
        {t('nav.skip')}
      </a>
      <header className="sticky top-0 z-40 border-b border-[#f0d9c6] bg-[#fff6ec]/92 backdrop-blur-sm">
        <div className="mx-auto flex max-w-[1260px] flex-wrap items-center gap-x-4 gap-y-2 px-4 py-2.5 sm:px-6">
          <a href="#tissue" className="cl-display flex items-center gap-2 text-[19px]">
            <OrgIcon id="nucleus" size={22} />
            {t('cell.brand')}
          </a>
          <div className="order-3 flex w-full items-center gap-3 sm:order-none sm:ms-auto sm:w-auto">
            <div role="group" aria-label={t('cell.scale')} className="cl-seg relative flex overflow-x-auto">
              {SCALES.map((s) => (
                <button key={s} type="button" aria-pressed={scale === s} onClick={() => pick(s)} className={cn('cl-seg-b', scale === s && 'cl-seg-on')}>
                  {t(`cell.scales.${s}`)}
                </button>
              ))}
            </div>
            <span className="flex shrink-0 items-center gap-1.5 text-[11.5px] text-[#67596b]" title={t('cell.scaleNote')}>
              <svg width="44" height="8" aria-hidden>
                <path d="M1 1v6M1 4h42M43 1v6" stroke="#2a2230" strokeWidth="1.5" fill="none" />
              </svg>
              <span dir="ltr">
                {fmtNum(loc, BAR[scale][0])} {BAR[scale][1]}
              </span>
              <span className="hidden md:inline">· {t('cell.illustrative')}</span>
            </span>
          </div>
          <LocaleSwitcher className="ms-auto rounded-full border border-[#f0d9c6] bg-white p-0.5 sm:ms-0" itemClassName="h-7 min-w-8 rounded-full px-2 text-xs" activeClassName="bg-[#2a2230] text-white" />
        </div>
      </header>

      <main>
        {/* 1 — tissue */}
        <section id="tissue" aria-labelledby="cell-h1" className="mx-auto grid max-w-[1260px] scroll-mt-20 items-center gap-10 px-4 py-12 sm:px-6 md:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)] md:py-16">
          <div>
            <p className="text-[13px] font-semibold uppercase tracking-[0.14em] text-[#b4453a] rtl:normal-case rtl:tracking-normal">{t('cell.kicker')}</p>
            <h1 id="cell-h1" className="cl-display mt-3 text-[clamp(2.8rem,7vw,5.4rem)] leading-[0.98] rtl:leading-[1.3]">
              {p.displayName}
            </h1>
            <p className="mt-4 text-[19px] font-semibold text-[#4c3f50]">{p.headline}</p>
            <p className="mt-3 max-w-xl text-[16.5px] leading-relaxed text-[#4c3f50]">{p.intro}</p>
            <div className="mt-7 flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={() => {
                  setZoomed(true);
                  if (reduce) go('cellmap');
                }}
                className="cl-btn cl-btn-solid"
              >
                {t('cell.zoomIn')}
              </button>
              <a href="#chapters" className="cl-btn">
                {t('cell.toChapters')}
              </a>
            </div>
            <p className="mt-5 max-w-xl text-[13px] text-[#67596b]">
              <span className="me-2 rounded-full bg-[#2a2230] px-2 py-0.5 text-[10.5px] font-semibold uppercase text-white rtl:normal-case">{t('common.metaphor')}</span>
              {t('cell.honesty')}
            </p>
          </div>
          <div className="cl-scope mx-auto aspect-square w-full max-w-[520px]">
            <Tissue label={t('cell.tissueLabel')} zoomed={zoomed} reduce={reduce} onZoomEnd={() => go('cellmap')} />
          </div>
        </section>

        {/* 2 — the cell map */}
        <section id="cellmap" aria-labelledby="cellmap-h" className="scroll-mt-20 border-y border-[#f0d9c6] bg-[#fffaf4] py-14">
          <div className="mx-auto max-w-[1260px] px-4 sm:px-6">
            <h2 id="cellmap-h" className="cl-display text-[clamp(1.9rem,3.6vw,2.8rem)] leading-tight">
              {t('cell.mapTitle')}
            </h2>
            <p className="mt-2 max-w-3xl text-[15.5px] text-[#4c3f50]">{t('cell.mapSub', { mito: orgCount(data, 'mito'), vesicles: orgCount(data, 'vesicles'), ribosomes: orgCount(data, 'ribosomes') })}</p>
            <div className="mt-8">
              <CellMap data={data} focus={focus} setFocus={choose} reduce={reduce} />
            </div>
          </div>
        </section>

        {/* 3 — molecule view */}
        <section id="molecule" aria-labelledby="molecule-h" className="mx-auto max-w-[1260px] scroll-mt-20 px-4 py-14 sm:px-6">
          <h2 id="molecule-h" className="cl-display text-[clamp(1.9rem,3.6vw,2.8rem)] leading-tight">
            {t('cell.molTitle')}
          </h2>
          <p className="mt-2 max-w-3xl text-[15.5px] text-[#4c3f50]">{t('cell.molSub')}</p>
          <div className="mt-8">
            <Molecule data={data} />
          </div>
        </section>

        {/* 4 — textbook chapters */}
        <section id="chapters" aria-labelledby="chapters-h" className="scroll-mt-20 border-t border-[#f0d9c6] bg-[#fffaf4] py-14">
          <div className="mx-auto max-w-[1260px] px-4 sm:px-6">
            <h2 id="chapters-h" className="cl-display text-[clamp(1.9rem,3.6vw,2.8rem)] leading-tight">
              {t('cell.chaptersTitle')}
            </h2>
            <ol className="mt-4 flex flex-wrap gap-x-5 gap-y-1.5 text-[14px]">
              {CHAPTERS.map((c, i) => (
                <li key={c.id}>
                  <a href={`#${c.id}`} className="cl-link inline-flex items-center gap-1.5">
                    <OrgIcon id={c.org} size={16} />
                    {fmtNum(loc, i + 1)}. {t(`cell.ch.${c.key}`)}
                  </a>
                </li>
              ))}
            </ol>
            <div className="mt-10 space-y-14">
              {CHAPTERS.map((c, i) => (
                <section key={c.id} id={c.id} aria-labelledby={`${c.id}-h`} className="scroll-mt-24 border-t border-[#f0d9c6] pt-8 md:grid md:grid-cols-[13rem_minmax(0,1fr)] md:gap-10">
                  <div className="mb-5 md:mb-0">
                    <p className="text-[12.5px] font-semibold uppercase tracking-[0.12em] text-[#b4453a] rtl:normal-case rtl:tracking-normal">{t('cell.chapter', { n: i + 1 })}</p>
                    <h3 id={`${c.id}-h`} className="cl-display mt-1 text-[26px] leading-tight">
                      {t(`cell.ch.${c.key}`)}
                    </h3>
                    <p className="mt-2 flex items-center gap-2 text-[13px] text-[#67596b]">
                      <OrgIcon id={c.org} size={28} />
                      <span>
                        {t(`cell.org.${c.org}`)}
                        <span className="block">{t('cell.countOf', { count: orgCount(data, c.org) })}</span>
                      </span>
                    </p>
                  </div>
                  <div>
                    {c.key === 'identity' && <Identity data={data} />}
                    {c.key === 'roles' && <Roles data={data} />}
                    {c.key === 'projects' && <Projects data={data} />}
                    {c.key === 'publications' && <Publications data={data} />}
                    {c.key === 'education' && <Education data={data} />}
                    {c.key === 'skills' && <Skills data={data} />}
                    {c.key === 'courses' && <Courses data={data} />}
                    {c.key === 'languages' && <Languages data={data} />}
                    {c.key === 'contact' && <Contact data={data} />}
                  </div>
                </section>
              ))}
            </div>
          </div>
        </section>
      </main>
      <footer className="mx-auto flex max-w-[1260px] flex-wrap justify-between gap-3 px-4 pb-24 pt-6 text-[12.5px] text-[#67596b] sm:px-6">
        <span>{t('common.rights', { year: fmtYear(loc, new Date(data.generatedAt).getUTCFullYear()) })}</span>
        <span>{t('cell.footer')}</span>
      </footer>
    </div>
  );
}
