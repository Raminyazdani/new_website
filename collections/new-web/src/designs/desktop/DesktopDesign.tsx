'use client';

import { useCallback, useEffect, useMemo, useReducer, useRef, useState, type CSSProperties, type ReactNode } from 'react';
import { useTranslations } from 'next-intl';
import { ArrowLeft, Braces, FileText, Folder, Printer, Search, StickyNote } from 'lucide-react';
import { LocaleSwitcher } from '@/components/shared/LocaleSwitcher';
import { useLocaleSwitch } from '@/components/shared/useLocaleSwitch';
import type { SiteData } from '@/lib/types';
import { useMedia } from '@/lib/useMedia';
import { downloadJson } from '@/lib/utils';
import { APP, APPS, LAUNCH_ORDER, type AppId, type Intent } from './apps';
import { About } from './apps/About';
import { Courses } from './apps/Courses';
import { Education } from './apps/Education';
import { Experience } from './apps/Experience';
import { LanguagesApp, MailApp, Maps } from './apps/Info';
import { Papers } from './apps/Papers';
import { Projects } from './apps/Projects';
import { SettingsApp } from './apps/Settings';
import { Skills } from './apps/Skills';
import { Terminal, type TermApi } from './apps/Terminal';
import { MenuBar, type MenuActions } from './MenuBar';
import { Spotlight } from './Spotlight';
import { Wallpaper } from './Wallpaper';
import { Window } from './Window';
import { clearSaved, DOCK, focusedId, initialWM, loadSaved, MENUBAR, reducer, save, type Mode, type Theme, type Wall } from './wm';
import './desktop.css';

/**
 * RaminOS — the CV as a small desktop. Every app window is always rendered (closed windows are only
 * hidden), so the whole CV is in the page and "View as document" (#document) is the same markup
 * restyled as a plain page — with or without JavaScript. Phones get a home screen and full-screen sheets.
 */
export default function DesktopDesign({ data }: { data: SiteData }) {
  const t = useTranslations();
  const loc = data.locale;
  const rtl = loc === 'fa';
  const desk = useMedia('(min-width: 1024px)', true);
  const { switchTo } = useLocaleSwitch();
  const [wm, dispatch] = useReducer(reducer, undefined, initialWM);
  const [theme, setTheme] = useState<Theme>('light');
  const [wall, setWall] = useState<Wall>('mesh');
  const [sheet, setSheet] = useState<AppId | null>(null);
  const [intent, setIntent] = useState<Intent | null>(null);
  const [spot, setSpot] = useState(false);
  const [doc, setDoc] = useState(false);
  const [ready, setReady] = useState(false);
  const bodies = useRef<Partial<Record<AppId, HTMLDivElement | null>>>({});
  const spotFrom = useRef<HTMLElement | null>(null);
  const seq = useRef(0);
  const focused = focusedId(wm);

  const area = useCallback(() => ({ w: Math.max(320, window.innerWidth - DOCK), h: Math.max(240, window.innerHeight - MENUBAR) }), []);

  /* ---------- restore the saved layout after hydration, then keep saving it */
  useEffect(() => {
    const s = loadSaved();
    if (s.theme) setTheme(s.theme);
    if (s.wall) setWall(s.wall);
    if (s.wm) dispatch({ type: 'load', wm: s.wm });
    else dispatch({ type: 'fit', area: area() });
    dispatch({ type: 'clamp', area: area() });
    setReady(true);
    const onResize = () => dispatch({ type: 'clamp', area: area() });
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, [area]);
  useEffect(() => {
    if (!ready) return;
    const id = window.setTimeout(() => save({ wm, theme, wall }), 250);
    return () => window.clearTimeout(id);
  }, [wm, theme, wall, ready]);

  /* ---------- document view follows the URL hash (#document), like the CSS :target fallback */
  useEffect(() => {
    const isDoc = () => window.location.hash === '#document';
    setDoc(isDoc());
    const onHash = () => {
      const d = isDoc();
      setDoc(d);
      // a user switch: move focus to the document title (on load the page simply starts there)
      if (d) requestAnimationFrame(() => document.getElementById('dt-doc-title')?.focus({ preventScroll: true }));
    };
    window.addEventListener('hashchange', onHash);
    return () => window.removeEventListener('hashchange', onHash);
  }, []);

  /* ---------- focus helpers */
  const focusApp = useCallback((id: AppId) => {
    requestAnimationFrame(() => {
      const el = id === 'terminal' ? document.querySelector<HTMLElement>('#win-terminal input') : bodies.current[id];
      el?.focus({ preventScroll: true });
    });
  }, []);
  const focusLauncher = useCallback((id: AppId) => {
    requestAnimationFrame(() => document.getElementById(`${window.matchMedia('(min-width: 1024px)').matches ? 'dock' : 'home'}-${id}`)?.focus());
  }, []);

  /* ---------- app actions */
  const openApp = useCallback(
    (id: AppId, item?: string) => {
      if (window.location.hash === '#document') window.location.hash = 'desktop';
      if (item) setIntent({ app: id, id: item, n: ++seq.current });
      if (window.matchMedia('(min-width: 1024px)').matches) {
        dispatch({ type: 'open', id });
        dispatch({ type: 'clamp', area: area() });
      } else setSheet(id);
      if (!item || id === 'terminal') focusApp(id);
    },
    [area, focusApp],
  );
  const afterHide = useCallback(
    (id: AppId) => {
      // focus moves to the next window that stays on screen, else back to the app's launcher
      const next = LAUNCH_ORDER.filter((x) => x !== id && wm[x].open && !wm[x].min).sort((a, b) => wm[b].z - wm[a].z)[0];
      if (next) {
        dispatch({ type: 'focus', id: next });
        focusApp(next);
      } else focusLauncher(id);
    },
    [wm, focusApp, focusLauncher],
  );
  const closeApp = useCallback(
    (id: AppId) => {
      dispatch({ type: 'close', id });
      afterHide(id);
    },
    [afterHide],
  );
  const minApp = useCallback(
    (id: AppId) => {
      dispatch({ type: 'min', id });
      afterHide(id);
    },
    [afterHide],
  );
  const closeSheet = useCallback(() => {
    setSheet((s) => {
      if (s) focusLauncher(s);
      return null;
    });
  }, [focusLauncher]);
  const reset = useCallback(() => {
    clearSaved();
    dispatch({ type: 'reset', area: area() });
  }, [area]);

  const openSpot = useCallback(() => {
    spotFrom.current = document.activeElement as HTMLElement | null;
    setSpot(true);
  }, []);
  const closeSpot = useCallback(() => {
    setSpot(false);
    requestAnimationFrame(() => {
      const el = spotFrom.current;
      if (el && document.contains(el) && el !== document.body) el.focus({ preventScroll: true });
    });
  }, []);

  /* ---------- global keys: Ctrl/⌘ K Spotlight · Esc closes the window or sheet that has focus */
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        if (spot) closeSpot();
        else openSpot();
        return;
      }
      if (e.key !== 'Escape' || e.defaultPrevented || spot) return;
      const win = (document.activeElement as HTMLElement | null)?.closest<HTMLElement>('.dt-win');
      const id = win?.dataset.app as AppId | undefined;
      if (!id || doc) return;
      e.preventDefault();
      if (win?.hasAttribute('data-sheet')) closeSheet();
      else closeApp(id);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [spot, doc, openSpot, closeSpot, closeApp, closeSheet]);

  /* ---------- the apps (memoised so moving or focusing a window never re-renders them) */
  const termApi = useMemo<TermApi>(
    () => ({
      open: (app, id) => openApp(app, id),
      theme: setTheme,
      lang: (l) => switchTo(l),
      doc: () => (window.location.hash = 'document'),
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [openApp],
  );
  const about = useMemo(() => <About data={data} />, [data]);
  const experience = useMemo(() => <Experience data={data} intent={intent?.app === 'experience' ? intent : null} />, [data, intent]);
  const education = useMemo(() => <Education data={data} />, [data]);
  const projects = useMemo(() => <Projects data={data} intent={intent?.app === 'projects' ? intent : null} />, [data, intent]);
  const papers = useMemo(() => <Papers data={data} intent={intent?.app === 'papers' ? intent : null} />, [data, intent]);
  const skills = useMemo(() => <Skills data={data} intent={intent?.app === 'skills' ? intent : null} />, [data, intent]);
  const courses = useMemo(() => <Courses data={data} intent={intent?.app === 'courses' ? intent : null} />, [data, intent]);
  const languages = useMemo(() => <LanguagesApp data={data} />, [data]);
  const maps = useMemo(() => <Maps data={data} />, [data]);
  const mail = useMemo(() => <MailApp data={data} />, [data]);
  const terminal = useMemo(() => <Terminal data={data} api={termApi} />, [data, termApi]);
  const settings = useMemo(() => <SettingsApp data={data} theme={theme} wall={wall} onTheme={setTheme} onWall={setWall} onReset={reset} />, [data, theme, wall, reset]);
  const content: Record<AppId, ReactNode> = { about, experience, education, projects, papers, skills, courses, languages, maps, mail, terminal, settings };

  const menu: MenuActions = {
    open: (id) => openApp(id),
    win: (a) => {
      if (!focused) return;
      if (a === 'min') minApp(focused);
      else if (a === 'close') closeApp(focused);
      else dispatch({ type: 'mode', id: focused, mode: a as Mode });
    },
    reset,
    spotlight: openSpot,
    theme: setTheme,
    wall: setWall,
  };

  const appName = (id: AppId) => t(`desktop.apps.${id}`);
  const tile = (id: AppId) => ({ '--a': APP[id].from, '--b': APP[id].to }) as CSSProperties;

  return (
    <div id="desktop" className="dt-root" data-theme={theme} data-view={doc ? 'doc' : undefined} data-ready={ready ? '' : undefined}>
      <span id="document" className="dt-anchor" aria-hidden />
      <Wallpaper wall={wall} />

      {/* document view bar (only shown in the document view) */}
      <div className="dt-docbar">
        <a href="#desktop" className="dt-btn">
          <ArrowLeft className="flip-rtl size-4" aria-hidden />
          {t('desktop.doc.back')}
        </a>
        <span className="flex-1" />
        <button type="button" className="dt-btn" onClick={() => window.print()}>
          <Printer className="size-4" aria-hidden />
          {t('common.print')}
        </button>
        <LocaleSwitcher className="dt-seg" itemClassName="dt-seg-item" activeClassName="dt-seg-on" />
      </div>

      <h1 id="dt-doc-title" tabIndex={-1} className="dt-h1">
        {data.person.displayName}
        <span className="dt-h1-sub">{t('desktop.doc.subtitle')}</span>
      </h1>

      <MenuBar locale={loc} wm={wm} focused={focused} theme={theme} wall={wall} act={menu} />

      {/* dock (desktop) */}
      <nav className="dt-dock" aria-label={t('desktop.dock')}>
        <ul>
          {LAUNCH_ORDER.map((id) => {
            const Icon = APP[id].icon;
            const w = wm[id];
            return (
              <li key={id}>
                <button type="button" id={`dock-${id}`} className="dt-dock-btn" data-open={w.open ? '' : undefined} onClick={() => openApp(id)}>
                  <span className="dt-tile" style={tile(id)} aria-hidden>
                    <Icon className="size-[22px]" />
                  </span>
                  <span className="dt-dock-label">
                    {appName(id)}
                    {w.open && <span className="sr-only"> — {w.min ? t('desktop.menu.minimized') : t('desktop.dockOpen')}</span>}
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* phone home screen */}
      <nav className="dt-home" aria-label={t('desktop.home')}>
        <button type="button" className="dt-home-search" onClick={openSpot}>
          <Search className="size-4 shrink-0" aria-hidden />
          <span>{t('desktop.spotlight.placeholder')}</span>
        </button>
        <ul className="dt-home-grid">
          {LAUNCH_ORDER.map((id) => {
            const Icon = APP[id].icon;
            return (
              <li key={id}>
                <button type="button" id={`home-${id}`} className="dt-home-btn" onClick={() => openApp(id)}>
                  <span className="dt-tile dt-tile-lg" style={tile(id)} aria-hidden>
                    <Icon className="size-7" />
                  </span>
                  <span className="dt-home-label">{appName(id)}</span>
                </button>
              </li>
            );
          })}
        </ul>
        <a href="#document" className="dt-home-doc">
          <FileText className="size-4" aria-hidden />
          {t('desktop.menu.document')}
        </a>
      </nav>

      <main className="dt-desk" aria-label={t('desktop.deskLabel')}>
        {/* desktop icons */}
        <ul className="dt-icons" aria-label={t('desktop.icons.label')}>
          <li>
            <button type="button" className="dt-icon" onClick={() => openApp('about')}>
              <span className="dt-icon-img dt-icon-file" aria-hidden>
                <StickyNote className="size-7" />
              </span>
              <span className="dt-icon-label" dir="ltr">
                README.md
              </span>
            </button>
          </li>
          <li>
            <button type="button" className="dt-icon" onClick={() => openApp('projects')}>
              <span className="dt-icon-img dt-icon-folder" aria-hidden>
                <Folder className="size-8" />
              </span>
              <span className="dt-icon-label">{appName('projects')}</span>
            </button>
          </li>
          <li>
            <button type="button" className="dt-icon" onClick={() => downloadJson(JSON.stringify(data, null, 2), 'portfolio.json')}>
              <span className="dt-icon-img dt-icon-file" aria-hidden>
                <Braces className="size-7" />
              </span>
              <span className="dt-icon-label" dir="ltr">
                cv.json
              </span>
            </button>
          </li>
          <li>
            <a href="#document" className="dt-icon">
              <span className="dt-icon-img dt-icon-file" aria-hidden>
                <FileText className="size-7" />
              </span>
              <span className="dt-icon-label">{t('desktop.icons.document')}</span>
            </a>
          </li>
        </ul>

        {APPS.map((a) => (
          <Window
            key={a.id}
            id={a.id}
            title={appName(a.id)}
            win={wm[a.id]}
            focused={desk && focused === a.id}
            rtl={rtl}
            desk={desk}
            sheet={!desk && sheet === a.id}
            area={area}
            bodyRef={(el) => {
              bodies.current[a.id] = el;
            }}
            onFocus={() => desk && dispatch({ type: 'focus', id: a.id })}
            onClose={() => (desk ? closeApp(a.id) : closeSheet())}
            onBack={closeSheet}
            onMin={() => minApp(a.id)}
            onMode={(mode) => dispatch({ type: 'mode', id: a.id, mode })}
            onGeom={(g) => dispatch({ type: 'geom', id: a.id, ...g, area: area() })}
          >
            {content[a.id]}
          </Window>
        ))}
      </main>

      {spot && <Spotlight data={data} onClose={closeSpot} onOpen={openApp} onTheme={setTheme} onReset={reset} />}
    </div>
  );
}
