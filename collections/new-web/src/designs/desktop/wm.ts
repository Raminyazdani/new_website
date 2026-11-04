import { APPS, type AppId } from './apps';

/* The window manager: a reducer over every app's window. Geometry is in logical px relative to the
   desktop area (start edge after the dock, top edge under the menu bar), so RTL mirrors for free. */
export type Mode = 'normal' | 'max' | 'start' | 'end';
export interface Win {
  open: boolean;
  min: boolean;
  mode: Mode;
  x: number;
  y: number;
  w: number;
  h: number;
  z: number;
}
export type WM = Record<AppId, Win>;

export const MENUBAR = 32;
export const DOCK = 80;
const MIN_W = 340;
const MIN_H = 240;

export function initialWM(): WM {
  const out = {} as WM;
  APPS.forEach((a, i) => {
    const k = i % 7;
    out[a.id] = { open: false, min: false, mode: 'normal', x: 40 + k * 34, y: 24 + k * 30, w: a.w, h: a.h, z: 0 };
  });
  out.about = { ...out.about, open: true, x: 24, y: 24, z: 1 };
  out.projects = { ...out.projects, open: true, x: 300, y: 72, w: 920, z: 2 };
  return out;
}

export interface Area {
  w: number;
  h: number;
}

/** keep a window inside the desktop area: never under the menu bar, title bar always reachable */
export function clampWin(win: Win, area: Area): Win {
  const w = Math.round(Math.max(MIN_W, Math.min(win.w, area.w - 16)));
  const h = Math.round(Math.max(MIN_H, Math.min(win.h, area.h - 16)));
  const x = Math.round(Math.max(0, Math.min(win.x, area.w - Math.min(w, 160))));
  const y = Math.round(Math.max(0, Math.min(win.y, area.h - 48)));
  return { ...win, w, h, x, y };
}

const top = (s: WM) => Math.max(...Object.values(s).map((w) => w.z));

export type Action =
  | { type: 'open'; id: AppId }
  | { type: 'close'; id: AppId }
  | { type: 'min'; id: AppId }
  | { type: 'focus'; id: AppId }
  | { type: 'mode'; id: AppId; mode: Mode }
  | { type: 'geom'; id: AppId; x: number; y: number; w: number; h: number; area: Area }
  | { type: 'clamp'; area: Area }
  | { type: 'reset'; area?: Area }
  | { type: 'fit'; area: Area }
  | { type: 'load'; wm: WM };

export function reducer(s: WM, a: Action): WM {
  switch (a.type) {
    case 'open': {
      const w = s[a.id];
      return { ...s, [a.id]: { ...w, open: true, min: false, z: w.open && !w.min && w.z === top(s) ? w.z : top(s) + 1 } };
    }
    case 'close':
      return { ...s, [a.id]: { ...s[a.id], open: false, min: false, mode: 'normal' } };
    case 'min':
      return { ...s, [a.id]: { ...s[a.id], min: true } };
    case 'focus': {
      const w = s[a.id];
      if (!w.open || w.z === top(s)) return s;
      return { ...s, [a.id]: { ...w, z: top(s) + 1 } };
    }
    case 'mode': {
      const w = s[a.id];
      return { ...s, [a.id]: { ...w, open: true, min: false, mode: w.mode === a.mode ? 'normal' : a.mode, z: w.z === top(s) ? w.z : top(s) + 1 } };
    }
    case 'geom':
      return { ...s, [a.id]: clampWin({ ...s[a.id], mode: 'normal', x: a.x, y: a.y, w: a.w, h: a.h }, a.area) };
    case 'clamp': {
      const out = { ...s };
      for (const id of Object.keys(out) as AppId[]) out[id] = clampWin(out[id], a.area);
      return out;
    }
    case 'reset': {
      const fresh = initialWM();
      if (!a.area) return fresh;
      return reducer(reducer(fresh, { type: 'fit', area: a.area }), { type: 'clamp', area: a.area });
    }
    case 'fit': {
      // first visit: size the two open windows to the screen and keep the desktop icons visible
      const { w: W, h: H } = a.area;
      const px = Math.round(Math.min(330, Math.max(200, W * 0.22)));
      const pw = Math.round(Math.max(600, Math.min(960, W - px - 140)));
      return {
        ...s,
        about: { ...s.about, h: Math.min(s.about.h, H - 48) },
        projects: { ...s.projects, x: px, w: pw, h: Math.min(s.projects.h, H - s.projects.y - 24) },
      };
    }
    case 'load':
      return a.wm;
  }
}

/** the window that has focus: open, not minimised, highest z */
export function focusedId(s: WM): AppId | null {
  let best: AppId | null = null;
  for (const id of Object.keys(s) as AppId[]) {
    const w = s[id];
    if (w.open && !w.min && (best === null || w.z > s[best].z)) best = id;
  }
  return best;
}

/* ---------------------------------------------------------------- persistence */

const KEY = 'raminos-v1';
export type Theme = 'light' | 'dark';
export type Wall = 'mesh' | 'helix' | 'night';
export interface Saved {
  wm?: WM;
  theme?: Theme;
  wall?: Wall;
}

const isNum = (n: unknown) => typeof n === 'number' && Number.isFinite(n);

export function loadSaved(): Saved {
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return {};
    const v = JSON.parse(raw) as Saved;
    const out: Saved = {};
    if (v.theme === 'light' || v.theme === 'dark') out.theme = v.theme;
    if (v.wall === 'mesh' || v.wall === 'helix' || v.wall === 'night') out.wall = v.wall;
    if (v.wm && typeof v.wm === 'object') {
      const base = initialWM();
      for (const a of APPS) {
        const w = (v.wm as Partial<WM>)[a.id];
        if (w && isNum(w.x) && isNum(w.y) && isNum(w.w) && isNum(w.h) && isNum(w.z) && ['normal', 'max', 'start', 'end'].includes(w.mode)) {
          base[a.id] = { open: !!w.open, min: !!w.min, mode: w.mode, x: w.x, y: w.y, w: w.w, h: w.h, z: w.z };
        }
      }
      out.wm = base;
    }
    return out;
  } catch {
    return {};
  }
}

export function save(v: Saved) {
  try {
    window.localStorage.setItem(KEY, JSON.stringify(v));
  } catch {
    /* storage unavailable: the layout simply is not remembered */
  }
}

export function clearSaved() {
  try {
    window.localStorage.removeItem(KEY);
  } catch {
    /* ignore */
  }
}
