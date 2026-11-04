import {
  Award,
  BookOpen,
  Briefcase,
  Folder,
  GraduationCap,
  Languages,
  Mail,
  Map as MapIcon,
  Settings,
  SlidersHorizontal,
  SquareTerminal,
  StickyNote,
  type LucideIcon,
} from 'lucide-react';

/* The apps of RaminOS. Each app shows one part of the CV; the order here is the document order
   ("View as document") and the DOM order of the windows. */
export type AppId = 'about' | 'experience' | 'education' | 'projects' | 'papers' | 'skills' | 'courses' | 'languages' | 'maps' | 'mail' | 'terminal' | 'settings';

export interface AppDef {
  id: AppId;
  icon: LucideIcon;
  /** icon tile gradient */
  from: string;
  to: string;
  /** preferred window size (px) */
  w: number;
  h: number;
  /** part of the document view (interactive-only apps are not) */
  doc: boolean;
}

export const APPS: AppDef[] = [
  { id: 'about', icon: StickyNote, from: '#fbbf24', to: '#d97706', w: 540, h: 620, doc: true },
  { id: 'experience', icon: Briefcase, from: '#a78bfa', to: '#6d28d9', w: 780, h: 660, doc: true },
  { id: 'education', icon: GraduationCap, from: '#fb923c', to: '#dc2626', w: 640, h: 560, doc: true },
  { id: 'projects', icon: Folder, from: '#2dd4bf', to: '#0369a1', w: 960, h: 640, doc: true },
  { id: 'papers', icon: BookOpen, from: '#fb7185', to: '#be123c', w: 900, h: 620, doc: true },
  { id: 'skills', icon: SlidersHorizontal, from: '#94a3b8', to: '#334155', w: 900, h: 640, doc: true },
  { id: 'courses', icon: Award, from: '#4ade80', to: '#15803d', w: 940, h: 620, doc: true },
  { id: 'languages', icon: Languages, from: '#22d3ee', to: '#0e7490', w: 620, h: 560, doc: true },
  { id: 'maps', icon: MapIcon, from: '#34d399', to: '#0f766e', w: 820, h: 600, doc: true },
  { id: 'mail', icon: Mail, from: '#60a5fa', to: '#1d4ed8', w: 560, h: 540, doc: true },
  { id: 'terminal', icon: SquareTerminal, from: '#334155', to: '#020617', w: 720, h: 460, doc: false },
  { id: 'settings', icon: Settings, from: '#cbd5e1', to: '#64748b', w: 680, h: 560, doc: false },
];

export const APP: Record<AppId, AppDef> = Object.fromEntries(APPS.map((a) => [a.id, a])) as Record<AppId, AppDef>;

/** dock / home-screen order */
export const LAUNCH_ORDER: AppId[] = ['about', 'projects', 'experience', 'education', 'papers', 'skills', 'courses', 'languages', 'maps', 'mail', 'terminal', 'settings'];

export const isAppId = (s: string): s is AppId => s in APP;

/** something an app should show when it opens (from Spotlight, the terminal or a desktop icon) */
export interface Intent {
  app: AppId;
  id: string;
  /** increments so the same target can be requested twice */
  n: number;
}
