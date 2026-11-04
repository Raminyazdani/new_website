'use client';

import dynamic from 'next/dynamic';
import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react';
import { flushSync } from 'react-dom';
import { AnimatePresence, motion } from 'motion/react';
import { Command } from 'cmdk';
import {
  ArrowUpRight,
  Atom,
  BookOpen,
  BrainCircuit,
  Clock,
  Code2,
  Command as CmdIcon,
  Dna,
  FlaskConical,
  GraduationCap,
  Languages,
  LayoutGrid,
  Mail,
  MapPin,
  Moon,
  Sun,
  X,
} from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';
import { Marquee } from '@/components/magicui/marquee';
import { MagicCard } from '@/components/magicui/magic-card';
import { NumberTicker } from '@/components/magicui/number-ticker';
import { Dock, DockIcon } from '@/components/magicui/dock';
import { Expandable } from '@/components/kit/Expandable';
import { ShowAll } from '@/components/kit/ShowAll';
import { BrandIcon, iconFor } from '@/components/shared/BrandIcon';
import { ProfilePhoto } from '@/components/shared/ProfilePhoto';
import { useLocaleSwitch } from '@/components/shared/useLocaleSwitch';
import { useRouter } from '@/i18n/navigation';
import { designIds } from '@/lib/designs';
import { fmtNum, fmtYear, numberLocale, publicationLabel } from '@/lib/format';
import type { Project, ProjectCategory, SiteData } from '@/lib/types';
import { cn } from '@/lib/utils';
import './bento.css';

const BentoGlobe = dynamic(() => import('./BentoGlobe'), { ssr: false });
const CAT_ICON: Record<ProjectCategory, typeof Dna> = { omics: Dna, structural: Atom, ml: BrainCircuit, software: Code2, biotech: FlaskConical };

/* ------------------------------------------------------------------ tile */

function Tile({ children, className, id, dark }: { children: ReactNode; className?: string; id?: string; dark: boolean }) {
  return (
    <motion.div
      id={id}
      initial={{ opacity: 0, y: 24, scale: 0.98 }}
      whileInView={{ opacity: 1, y: 0, scale: 1 }}
      viewport={{ once: true, amount: 0.2 }}
      transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
      className={cn('scroll-mt-24 rounded-3xl', className)}
    >
      <MagicCard
        className="h-full rounded-3xl"
        gradientSize={260}
        gradientColor={dark ? '#1f1f23' : '#eef2e2'}
        gradientFrom={dark ? '#c6f432' : '#4d7c0f'}
        gradientTo={dark ? '#38bdf8' : '#0284c7'}
        gradientOpacity={0.6}
      >
        <div className="relative h-full p-5 sm:p-6">{children}</div>
      </MagicCard>
    </motion.div>
  );
}

const Label = ({ icon: Icon, children, className }: { icon?: typeof Dna; children: ReactNode; className?: string }) => (
  <p className={cn('mb-4 flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.18em] text-[var(--b-muted)]', className)}>
    {Icon && <Icon className="size-3.5" />}
    {children}
  </p>
);

/* ------------------------------------------------------------- palette */

function Palette({ open, setOpen, data, toggleTheme }: { open: boolean; setOpen: (v: boolean) => void; data: SiteData; toggleTheme: () => void }) {
  const t = useTranslations();
  const router = useRouter();
  const { locales, switchTo } = useLocaleSwitch();
  const go = (fn: () => void) => {
    setOpen(false);
    window.setTimeout(fn, 60);
  };
  return (
    <AnimatePresence>
      {open && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[90] grid place-items-start bg-black/50 p-4 pt-[12vh] backdrop-blur-sm" onClick={() => setOpen(false)}>
          <motion.div initial={{ scale: 0.96, y: 10 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.97, y: 6 }} onClick={(e) => e.stopPropagation()} className="mx-auto w-full max-w-xl">
            <Command className="b-cmdk overflow-hidden rounded-2xl border border-[var(--b-border)] bg-[var(--b-card)] text-[var(--b-fg)] shadow-2xl" label="Command menu">
              <Command.Input autoFocus placeholder={t('bento.cmdkPlaceholder')} className="w-full border-b border-[var(--b-border)] bg-transparent px-5 py-4 text-[15px] outline-none placeholder:text-[var(--b-muted)]" />
              <Command.List className="max-h-[50vh] overflow-y-auto p-2">
                <Command.Empty className="p-6 text-center text-sm text-[var(--b-muted)]">{t('bento.cmdkEmpty')}</Command.Empty>
                <Command.Group heading={t('bento.groups.navigate')}>
                  {(['about', 'experience', 'projects', 'skills', 'publications', 'contact'] as const).map((id) => (
                    <Command.Item key={id} onSelect={() => go(() => document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' }))}>
                      {t(`nav.${id}`)}
                    </Command.Item>
                  ))}
                </Command.Group>
                <Command.Group heading={t('bento.groups.projects')}>
                  {data.projects
                    .filter((p) => p.url)
                    .map((p) => (
                      <Command.Item key={p.id} value={`${p.title} ${p.tags.join(' ')}`} onSelect={() => go(() => window.open(p.url!, '_blank', 'noopener'))}>
                        <span className="truncate">{p.title}</span>
                        <span className="ms-auto font-mono text-[11px] text-[var(--b-muted)]">{p.tags[0]}</span>
                      </Command.Item>
                    ))}
                </Command.Group>
                <Command.Group heading={t('bento.groups.links')}>
                  <Command.Item onSelect={() => go(() => (window.location.href = data.links.email))}>{t('common.email')}</Command.Item>
                  {(['github', 'linkedin', 'orcid', 'scholar'] as const).map((k) =>
                    data.links[k] ? (
                      <Command.Item key={k} onSelect={() => go(() => window.open(data.links[k]!, '_blank', 'noopener'))}>
                        <BrandIcon name={k} className="size-4" /> {k === 'scholar' ? 'Google Scholar' : k[0].toUpperCase() + k.slice(1)}
                      </Command.Item>
                    ) : null,
                  )}
                </Command.Group>
                <Command.Group heading={t('bento.groups.theme')}>
                  <Command.Item onSelect={() => go(toggleTheme)}>{t('bento.toggleTheme')}</Command.Item>
                </Command.Group>
                <Command.Group heading={t('bento.groups.language')}>
                  {locales.map((l) => (
                    <Command.Item key={l.code} value={`language ${l.native} ${l.code}`} onSelect={() => go(() => switchTo(l.code))}>
                      {l.native}
                    </Command.Item>
                  ))}
                </Command.Group>
                <Command.Group heading={t('bento.groups.designs')}>
                  {designIds.map((d) => (
                    <Command.Item key={d} value={`design ${d}`} onSelect={() => go(() => router.push(`/${d}`))}>
                      {t(`designs.${d}.name`)} <span className="ms-auto text-[11px] text-[var(--b-muted)]">{t(`designs.${d}.style`)}</span>
                    </Command.Item>
                  ))}
                </Command.Group>
              </Command.List>
            </Command>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

/* --------------------------------------------------------------- pieces */

function berlinParts(d: Date) {
  const parts = new Intl.DateTimeFormat('en-GB', { hour: 'numeric', minute: 'numeric', second: 'numeric', hourCycle: 'h23', timeZone: 'Europe/Berlin' }).formatToParts(d);
  const get = (type: string) => Number(parts.find((p) => p.type === type)?.value ?? 0);
  return { h: get('hour'), m: get('minute'), s: get('second') };
}

function LocalClock() {
  const locale = useLocale();
  const [now, setNow] = useState<Date | null>(null);
  useEffect(() => {
    setNow(new Date());
    const id = window.setInterval(() => setNow(new Date()), 1000);
    return () => window.clearInterval(id);
  }, []);
  const tz = 'Europe/Berlin';
  const time = now ? new Intl.DateTimeFormat(numberLocale(locale), { hour: '2-digit', minute: '2-digit', second: '2-digit', hourCycle: 'h23', timeZone: tz }).format(now) : '--:--:--';
  const date = now ? new Intl.DateTimeFormat(numberLocale(locale), { weekday: 'long', day: 'numeric', month: 'long', timeZone: tz }).format(now) : '';
  const zone = now ? (new Intl.DateTimeFormat('en-GB', { timeZone: tz, timeZoneName: 'short' }).formatToParts(now).find((p) => p.type === 'timeZoneName')?.value ?? '') : '';
  const { h, m, s } = now ? berlinParts(now) : { h: 10, m: 8, s: 30 };
  const hand = (deg: number, len: number, w: number, cls: string) => (
    <line x1="50" y1="50" x2="50" y2={50 - len} strokeWidth={w} strokeLinecap="round" className={cls} transform={`rotate(${deg} 50 50)`} />
  );
  return (
    <>
      <div>
        <p className="font-mono text-4xl font-semibold tabular-nums tracking-tight text-[var(--b-fg)]" suppressHydrationWarning>
          {time}
        </p>
        <p className="mt-2 text-sm text-[var(--b-muted)]" suppressHydrationWarning>
          {date}
        </p>
      </div>
      <div className="mt-auto flex items-end justify-between gap-4 pt-4">
        <p className="font-mono text-[11px] text-[var(--b-muted)]" dir="ltr" lang="en" suppressHydrationWarning>
          {zone} · 49.24°N 7.00°E
        </p>
        <svg viewBox="0 0 100 100" className="size-24 shrink-0" aria-hidden suppressHydrationWarning>
          <circle cx="50" cy="50" r="47" fill="none" stroke="var(--b-border)" strokeWidth="2" />
          {Array.from({ length: 12 }, (_, i) => (
            <line key={i} x1="50" y1="7" x2="50" y2={i % 3 === 0 ? 15 : 11} stroke="var(--b-muted)" strokeWidth={i % 3 === 0 ? 2.4 : 1.4} strokeLinecap="round" transform={`rotate(${i * 30} 50 50)`} />
          ))}
          {hand((h % 12) * 30 + m * 0.5, 24, 4, 'stroke-[var(--b-fg)]')}
          {hand(m * 6 + s * 0.1, 34, 3, 'stroke-[var(--b-fg)]')}
          {hand(s * 6, 38, 1.4, 'stroke-[var(--b-accent)]')}
          <circle cx="50" cy="50" r="3.5" fill="var(--b-accent)" />
        </svg>
      </div>
    </>
  );
}

function Ring({ value, max, label }: { value: number; max: number; label: string }) {
  const r = 52;
  const c = 2 * Math.PI * r;
  return (
    <div className="relative grid size-36 place-items-center">
      <svg viewBox="0 0 120 120" className="absolute inset-0 -rotate-90">
        <circle cx="60" cy="60" r={r} fill="none" stroke="var(--b-border)" strokeWidth="8" />
        <motion.circle
          cx="60"
          cy="60"
          r={r}
          fill="none"
          stroke="var(--b-accent)"
          strokeWidth="8"
          strokeLinecap="round"
          strokeDasharray={c}
          initial={{ strokeDashoffset: c }}
          whileInView={{ strokeDashoffset: c * (1 - value / max) }}
          viewport={{ once: true }}
          transition={{ duration: 1.4, ease: [0.16, 1, 0.3, 1] }}
        />
      </svg>
      <div className="text-center">
        <p className="text-3xl font-semibold text-[var(--b-fg)]">{label}</p>
        <p className="font-mono text-[10px] text-[var(--b-muted)]">IELTS</p>
      </div>
    </div>
  );
}

function ProjectModal({ p, onClose }: { p: Project; onClose: () => void }) {
  const t = useTranslations();
  const Icon = CAT_ICON[p.category];
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[80] grid place-items-center bg-black/60 p-4 backdrop-blur-sm" onClick={onClose}>
      <motion.div layoutId={`proj-${p.id}`} onClick={(e) => e.stopPropagation()} className="relative w-full max-w-2xl rounded-3xl border border-[var(--b-border)] bg-[var(--b-card)] p-7 text-[var(--b-fg)] shadow-2xl">
        <button type="button" onClick={onClose} className="absolute end-4 top-4 grid size-9 place-items-center rounded-full border border-[var(--b-border)] text-[var(--b-muted)] hover:text-[var(--b-fg)]" aria-label={t('nav.close')}>
          <X className="size-4" />
        </button>
        <motion.span layoutId={`proj-icon-${p.id}`} className="mb-5 grid size-12 place-items-center rounded-2xl bg-[var(--b-accent)]/15 text-[var(--b-accent)]">
          <Icon className="size-6" />
        </motion.span>
        <p className="font-mono text-[11px] uppercase tracking-widest text-[var(--b-muted)]">{t(`categories.${p.category}`)}</p>
        <motion.h3 layoutId={`proj-title-${p.id}`} className="mt-2 text-2xl font-semibold tracking-tight">
          {p.title}
        </motion.h3>
        <p className="mt-4 text-[16px] leading-relaxed text-[var(--b-muted)]">{p.description}</p>
        <div className="mt-5 flex flex-wrap gap-2">
          {p.tags.map((tag) => (
            <span key={tag} className="rounded-full border border-[var(--b-border)] px-3 py-1 font-mono text-xs">
              {tag}
            </span>
          ))}
        </div>
        {p.url ? (
          <a href={p.url} target="_blank" rel="noreferrer" className="mt-7 inline-flex items-center gap-2 rounded-full bg-[var(--b-fg)] px-5 py-2.5 text-sm font-medium text-[var(--b-bg)]">
            <BrandIcon name="github" className="size-4" /> {p.repo}
            <ArrowUpRight className="flip-rtl size-4" />
          </a>
        ) : (
          <p className="mt-7 text-sm text-[var(--b-muted)]">{t('common.noLink')}</p>
        )}
      </motion.div>
    </motion.div>
  );
}

/* --------------------------------------------------------------- design */

export default function BentoDesign({ data }: { data: SiteData }) {
  const t = useTranslations();
  const loc = data.locale;
  const { locale, locales, switchTo } = useLocaleSwitch();
  const [dark, setDark] = useState(true);
  const [palette, setPalette] = useState(false);
  const [openProject, setOpenProject] = useState<Project | null>(null);
  const [allPositions, setAllPositions] = useState(false);
  const [allCourses, setAllCourses] = useState(false);

  useEffect(() => {
    try {
      const saved = window.localStorage.getItem('ry-bento-theme');
      if (saved) setDark(saved === 'dark');
    } catch {
      /* ignore */
    }
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setPalette((v) => !v);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  const toggleTheme = useCallback(
    (e?: { clientX: number; clientY: number }) => {
      const next = !dark;
      const persist = () => {
        try {
          window.localStorage.setItem('ry-bento-theme', next ? 'dark' : 'light');
        } catch {
          /* ignore */
        }
      };
      const doc = document as Document & { startViewTransition?: (cb: () => void) => { ready: Promise<void> } };
      if (!doc.startViewTransition || window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
        setDark(next);
        persist();
        return;
      }
      const x = e?.clientX ?? window.innerWidth / 2;
      const y = e?.clientY ?? 0;
      const r = Math.hypot(Math.max(x, window.innerWidth - x), Math.max(y, window.innerHeight - y));
      const vt = doc.startViewTransition(() => {
        flushSync(() => setDark(next));
      });
      persist();
      vt.ready.then(() =>
        document.documentElement.animate(
          { clipPath: [`circle(0px at ${x}px ${y}px)`, `circle(${r}px at ${x}px ${y}px)`] },
          { duration: 700, easing: 'cubic-bezier(.16,1,.3,1)', pseudoElement: '::view-transition-new(root)' },
        ),
      );
    },
    [dark],
  );

  const stats = data.stats.filter((s) => ['repos', 'mpi', 'courses', 'years'].includes(s.id));
  const english = data.languages.find((l) => l.cert);
  const featured = data.projects.filter((p) => p.highlight);
  const tools = useMemo(
    () => [...new Map(data.skills.flatMap((c) => c.groups.flatMap((g) => g.items)).filter((i) => iconFor(i.key)).map((i) => [i.key, i])).values()],
    [data.skills],
  );
  const more = [...data.projects.filter((p) => !p.highlight), ...data.archive];
  const chapter = data.publications.find((p) => p.status === 'Published');
  const study = data.education.find((e) => e.current);

  return (
    <div className={cn('bento min-h-dvh', dark && 'dark')}>
      {/* header */}
      <header className="sticky top-0 z-50 border-b border-[var(--b-border)] bg-[var(--b-bg)]/75 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-[1280px] items-center justify-between gap-3 px-4 sm:px-6">
          <a href="#top" className="flex items-center gap-2.5 font-semibold tracking-tight">
            <span className="grid size-8 place-items-center rounded-xl bg-[var(--b-accent)] font-mono text-xs font-bold text-[var(--b-on-accent)]" lang="en">
              RY
            </span>
            <span className="hidden sm:inline">{data.person.displayName}</span>
          </a>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setPalette(true)}
              className="flex items-center gap-2 rounded-xl border border-[var(--b-border)] bg-[var(--b-card)] px-3 py-2 text-sm text-[var(--b-muted)] transition hover:text-[var(--b-fg)]"
            >
              <CmdIcon className="size-4" />
              <span className="hidden sm:inline">{t('bento.cmdkButton')}</span>
              <kbd className="hidden rounded-md border border-[var(--b-border)] px-1.5 font-mono text-[10px] sm:inline" dir="ltr">
                ⌘K
              </kbd>
            </button>
            <div className="flex rounded-xl border border-[var(--b-border)] bg-[var(--b-card)] p-1" role="group" aria-label="Language">
              {locales.map((l) => (
                <button
                  key={l.code}
                  type="button"
                  lang={l.code}
                  onClick={() => switchTo(l.code)}
                  aria-pressed={l.code === locale}
                  className={cn('rounded-lg px-2.5 py-1 text-xs transition', l.code === locale ? 'bg-[var(--b-fg)] text-[var(--b-bg)]' : 'text-[var(--b-muted)] hover:text-[var(--b-fg)]')}
                >
                  {l.short}
                </button>
              ))}
            </div>
            <button type="button" onClick={(e) => toggleTheme(e)} aria-label={t('bento.toggleTheme')} className="grid size-10 place-items-center rounded-xl border border-[var(--b-border)] bg-[var(--b-card)] text-[var(--b-fg)]">
              {dark ? <Sun className="size-4" /> : <Moon className="size-4" />}
            </button>
          </div>
        </div>
      </header>

      <main id="top" className="mx-auto grid max-w-[1280px] grid-cols-1 gap-4 px-4 py-6 sm:px-6 md:grid-cols-6 lg:grid-cols-12">
        {/* profile */}
        <Tile dark={dark} id="about" className="md:col-span-6 lg:col-span-5 lg:row-span-2">
          <div className="flex h-full flex-col">
            <div className="flex items-start justify-between gap-4">
              <ProfilePhoto
                src={data.person.photo}
                alt={t('common.photoAlt')}
                size={320}
                priority
                className="size-24 rounded-2xl ring-1 ring-[var(--b-border)]"
                monogramClassName="text-3xl text-[var(--b-fg)] from-[var(--b-accent)]/40 via-sky-400/20 to-violet-500/20"
              />
              <span className="inline-flex items-center gap-2 rounded-full border border-[var(--b-accent)]/40 bg-[var(--b-accent)]/10 px-3 py-1.5 text-xs text-[var(--b-fg)]">
                <span className="relative flex size-2">
                  <span className="absolute inline-flex size-full animate-ping rounded-full bg-[var(--b-accent)] opacity-70" />
                  <span className="relative inline-flex size-2 rounded-full bg-[var(--b-accent)]" />
                </span>
                {t('bento.status')}
              </span>
            </div>
            <h1 className="mt-8 text-5xl font-semibold leading-[0.95] tracking-[-0.04em] sm:text-6xl">{data.person.displayName}</h1>
            <p className="mt-4 text-lg text-[var(--b-muted)]">{data.person.headline}</p>
            <p className="mt-6 text-[15px] leading-relaxed text-[var(--b-fg)]/85">{data.person.statement}</p>
            <div className="mt-auto flex flex-wrap items-center gap-3 pt-8">
              <a href={data.links.email} className="inline-flex items-center gap-2 rounded-full bg-[var(--b-accent)] px-5 py-2.5 text-sm font-semibold text-[var(--b-on-accent)] transition hover:brightness-110">
                <Mail className="size-4" /> {t('common.sendEmail')}
              </a>
              <span className="inline-flex items-center gap-1.5 text-sm text-[var(--b-muted)]">
                <MapPin className="size-4" /> {data.person.location}
              </span>
            </div>
          </div>
        </Tile>

        {/* globe */}
        <Tile dark={dark} className="md:col-span-6 lg:col-span-4 lg:row-span-2">
          <Label icon={MapPin}>{t('bento.journey')}</Label>
          <p className="text-xl font-semibold tracking-tight">{t('bento.route')}</p>
          <div className="relative mx-auto -mb-16 mt-2 max-w-[360px]">
            <BentoGlobe stops={data.journey} dark={dark} />
          </div>
          <ul className="relative z-10 mt-0 space-y-1.5 text-sm">
            {data.journey.map((j) => (
              <li key={j.id} className="flex items-center gap-2 rounded-lg bg-[var(--b-bg)]/70 px-3 py-1.5 backdrop-blur">
                <span className="size-1.5 shrink-0 rounded-full bg-[var(--b-accent)]" />
                <span className="shrink-0 font-medium">{j.city}</span>
                <span className="hidden min-w-0 flex-1 truncate text-[var(--b-muted)] xl:block" title={j.note}>
                  · {j.note}
                </span>
                <span className="ms-auto shrink-0 whitespace-nowrap ps-2 font-mono text-xs text-[var(--b-muted)]">{j.period}</span>
              </li>
            ))}
          </ul>
          <p className="mt-2 text-end font-mono text-[10px] text-[var(--b-muted)]">{t('bento.drag')}</p>
        </Tile>

        {/* now */}
        <Tile dark={dark} className="md:col-span-3 lg:col-span-3">
          <div className="flex h-full flex-col">
            <Label icon={LayoutGrid}>{t('bento.now')}</Label>
            <ul className="space-y-3">
              {data.current.map((e) => (
                <li key={e.id} className="text-sm">
                  <p className="font-medium leading-snug">{e.role.split(/\s[—–-]\s/)[0]}</p>
                  <p className="text-[var(--b-muted)]">{e.org}</p>
                </li>
              ))}
            </ul>
            {study && (
              <div className="mt-auto flex items-start gap-3 border-t border-[var(--b-border)] pt-4 text-sm">
                <GraduationCap className="mt-0.5 size-4 shrink-0 text-[var(--b-accent)]" />
                <div>
                  <p className="font-medium leading-snug">{study.degree}</p>
                  <p className="text-[var(--b-muted)]">{study.institution}</p>
                </div>
              </div>
            )}
          </div>
        </Tile>

        {/* clock */}
        <Tile dark={dark} className="md:col-span-3 lg:col-span-3">
          <div className="flex h-full flex-col">
            <Label icon={Clock}>{t('common.localTime')}</Label>
            <LocalClock />
          </div>
        </Tile>

        {/* stats */}
        {stats.map((s) => (
          <Tile dark={dark} key={s.id} className="md:col-span-3 lg:col-span-3">
            <p className="text-5xl font-semibold tracking-[-0.04em]">
              <NumberTicker value={s.value} locale={numberLocale(loc)} className="text-[var(--b-fg)]" />
              <span className="text-[var(--b-accent)]">{s.suffix}</span>
            </p>
            <p className="mt-3 text-sm text-[var(--b-muted)]">{s.label}</p>
          </Tile>
        ))}

        {/* about text */}
        <Tile dark={dark} className="md:col-span-6 lg:col-span-7">
          <Label>{t('sections.about.title')}</Label>
          <div className="space-y-4 text-[15px] leading-relaxed text-[var(--b-fg)]/85">
            {data.person.about.map((p, i) => (
              <p key={i}>{p}</p>
            ))}
          </div>
        </Tile>

        {/* languages */}
        <Tile dark={dark} className="md:col-span-6 lg:col-span-5">
          <Label icon={Languages}>{t('sections.languages.title')}</Label>
          {english?.cert && (
            <div className="flex flex-wrap items-center gap-6">
              <Ring value={english.cert.overall} max={english.cert.max} label={fmtNum(loc, english.cert.overall, { minimumFractionDigits: 1 })} />
              <ul className="min-w-[10rem] flex-1 space-y-2 text-sm">
                {(['reading', 'listening', 'speaking', 'writing'] as const).map((k) => (
                  <li key={k} className="flex items-center justify-between gap-3">
                    <span className="text-[var(--b-muted)]">{t(`ielts.${k}`)}</span>
                    <span className="font-mono">{fmtNum(loc, english.cert!.bands[k], { minimumFractionDigits: 1 })}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
          <div className="mt-5 grid grid-cols-3 gap-2 text-sm">
            {data.languages.map((l) => (
              <div key={l.id} className="rounded-xl border border-[var(--b-border)] p-3">
                <p className="font-medium">{l.name}</p>
                <p className="mt-1 text-xs text-[var(--b-muted)]">{l.level}</p>
              </div>
            ))}
          </div>
        </Tile>

        {/* experience */}
        <Tile dark={dark} id="experience" className="md:col-span-6 lg:col-span-12">
          <div className="mb-4 flex items-center justify-between">
            <Label>{t('sections.experience.title')}</Label>
            <button
              type="button"
              data-kit-more=""
              aria-expanded={allPositions}
              onClick={() => setAllPositions((v) => !v)}
              className="text-sm text-[var(--b-muted)] underline-offset-4 hover:text-[var(--b-fg)] hover:underline"
            >
              {allPositions ? t('common.less') : `${t('bento.allPositions')} (${fmtNum(loc, data.experiences.length)})`}
            </button>
          </div>
          <motion.ul layout className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {data.experiences.map((e, i) => (
              <motion.li
                layout
                key={e.id}
                hidden={!allPositions && i >= 6 ? true : undefined}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex flex-col rounded-2xl border border-[var(--b-border)] bg-[var(--b-bg)]/40 p-4"
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="font-mono text-[11px] text-[var(--b-muted)]">{e.period}</span>
                  {e.current && <span className="rounded-full bg-[var(--b-accent)] px-2 py-0.5 text-[10px] font-semibold text-[var(--b-on-accent)]">{t('common.current')}</span>}
                </div>
                <p className="mt-2 font-medium leading-snug">{e.role}</p>
                <p className="mt-1 text-sm text-[var(--b-muted)]">
                  {e.org}
                  {e.location ? ` · ${e.location}` : ''}
                </p>
                <Expandable
                  text={e.description}
                  lines={3}
                  minChars={150}
                  className="mt-3 text-sm leading-relaxed text-[var(--b-fg)]/80"
                  buttonClassName="text-xs text-[var(--b-muted)] hover:text-[var(--b-fg)]"
                />
              </motion.li>
            ))}
          </motion.ul>
        </Tile>

        {/* projects */}
        <div id="projects" className="scroll-mt-24 md:col-span-6 lg:col-span-12">
          <h2 className="px-1 pb-1 pt-6 text-3xl font-semibold tracking-tight">{t('sections.projects.title')}</h2>
          <p className="px-1 pb-3 text-[var(--b-muted)]">{t('sections.projects.subtitle')}</p>
        </div>
        {featured.map((p, i) => {
          const Icon = CAT_ICON[p.category];
          return (
            <Tile dark={dark} key={p.id} className={cn('md:col-span-3 lg:col-span-4', i === 0 && 'lg:col-span-8', i === 1 && 'lg:col-span-4')}>
              <motion.button layoutId={`proj-${p.id}`} type="button" onClick={() => setOpenProject(p)} className="flex h-full w-full flex-col text-start">
                <div className="flex items-center justify-between">
                  <motion.span layoutId={`proj-icon-${p.id}`} className="grid size-10 place-items-center rounded-xl bg-[var(--b-accent)]/15 text-[var(--b-accent)]">
                    <Icon className="size-5" />
                  </motion.span>
                  {p.metric ? <span className="text-3xl font-semibold text-[var(--b-accent)]" dir="ltr">{p.metric}</span> : <ArrowUpRight className="flip-rtl size-5 text-[var(--b-muted)]" />}
                </div>
                <motion.h3 layoutId={`proj-title-${p.id}`} className={cn('mt-6 font-semibold tracking-tight', i === 0 ? 'text-2xl' : 'text-lg')}>
                  {p.title}
                </motion.h3>
                <p className="mt-2 text-sm leading-relaxed text-[var(--b-muted)]">{p.description}</p>
                <p className="mt-auto pt-4 font-mono text-[11px] text-[var(--b-muted)]">{p.tags.join(' · ')}</p>
              </motion.button>
            </Tile>
          );
        })}

        {/* every other project: remaining featured + archive repositories */}
        <Tile dark={dark} className="md:col-span-6 lg:col-span-12">
          <div className="mb-4 flex flex-wrap items-baseline justify-between gap-2">
            <Label>{t('bento.moreProjects')}</Label>
            <span className="font-mono text-xs text-[var(--b-muted)]">{t('common.count.projects', { count: more.length })}</span>
          </div>
          <ShowAll
            items={more}
            initial={9}
            getKey={(p) => p.id}
            className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3"
            buttonWrapClassName="mt-4 flex justify-center"
            buttonClassName="rounded-full border border-[var(--b-border)] px-4 py-2 text-sm text-[var(--b-muted)] transition hover:text-[var(--b-fg)]"
            render={(p) => {
              const Icon = CAT_ICON[p.category];
              return (
                <article className="flex h-full flex-col rounded-2xl border border-[var(--b-border)] bg-[var(--b-bg)]/40 p-4">
                  <div className="flex items-center gap-2 text-xs text-[var(--b-muted)]">
                    <Icon className="size-4 text-[var(--b-accent)]" /> {t(`categories.${p.category}`)}
                  </div>
                  <h3 className="mt-2 font-medium leading-snug">{p.title}</h3>
                  <Expandable
                    text={p.description}
                    lines={3}
                    minChars={140}
                    className="mt-2 text-sm leading-relaxed text-[var(--b-muted)]"
                    buttonClassName="text-xs text-[var(--b-muted)] hover:text-[var(--b-fg)]"
                  />
                  <div className="mt-auto flex items-center justify-between gap-3 pt-3">
                    <span className="truncate font-mono text-[11px] text-[var(--b-muted)]">{p.tags.join(' · ')}</span>
                    {p.url ? (
                      <a href={p.url} target="_blank" rel="noreferrer" className="inline-flex shrink-0 items-center gap-1 text-sm text-[var(--b-fg)] hover:underline" aria-label={`${t('common.code')}: ${p.title}`}>
                        <BrandIcon name="github" className="size-3.5" /> <ArrowUpRight className="flip-rtl size-3.5" />
                      </a>
                    ) : null}
                  </div>
                </article>
              );
            }}
          />
        </Tile>

        {/* skills */}
        <Tile dark={dark} id="skills" className="md:col-span-6 lg:col-span-8">
          <div className="flex h-full flex-col">
            <Label>{t('bento.stack')}</Label>
            <div className="-mx-5 space-y-3 sm:-mx-6" dir="ltr">
              {[0, 1].map((r) => (
                <Marquee key={r} reverse={r === 1} pauseOnHover className="[--duration:45s] [--gap:0.6rem]">
                  {tools.filter((_, i) => i % 2 === r).map((it) => (
                    <span key={it.key} className="flex items-center gap-2 rounded-xl border border-[var(--b-border)] bg-[var(--b-bg)]/50 px-3 py-2 text-sm">
                      <BrandIcon name={it.key} colored={!dark} className="size-4" />
                      {it.name}
                    </span>
                  ))}
                </Marquee>
              ))}
            </div>
            <Label className="mt-7">{t('bento.domains')}</Label>
            <ul className="grid gap-x-6 gap-y-2.5 sm:grid-cols-2">
              {data.domains.map((d, i) => (
                <li key={d.id} className="text-sm">
                  <div className="mb-1 flex items-baseline justify-between gap-3">
                    <span>{t(`domains.${d.id}`)}</span>
                    <span className="font-mono text-xs text-[var(--b-muted)]">{fmtNum(loc, d.count)}</span>
                  </div>
                  <div className="h-1.5 overflow-hidden rounded-full bg-[var(--b-border)]">
                    <motion.div
                      className="h-full rounded-full bg-[var(--b-accent)]"
                      initial={{ width: 0 }}
                      whileInView={{ width: `${(d.count / 36) * 100}%` }}
                      viewport={{ once: true }}
                      transition={{ duration: 1, delay: i * 0.05 }}
                    />
                  </div>
                </li>
              ))}
            </ul>
            {data.softSkills.length > 0 && (
              <div className="mt-auto pt-7">
                <Label>{t('helix.softSkills')}</Label>
                <div className="flex flex-wrap gap-2">
                  {data.softSkills.map((sk) => (
                    <span key={sk.key} className="rounded-full border border-[var(--b-border)] px-3 py-1 text-xs text-[var(--b-muted)]">
                      {sk.name}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </Tile>

        {/* publication */}
        <Tile dark={dark} id="publications" className="md:col-span-6 lg:col-span-4">
          <Label icon={BookOpen}>{t('sections.publications.title')}</Label>
          {chapter && (
            <div>
              <p className="flex flex-wrap gap-2 text-xs">
                <span className="rounded-full bg-[var(--b-accent)] px-2 py-0.5 font-semibold text-[var(--b-on-accent)]">{publicationLabel(t, 'pubStatus', chapter.status)}</span>
                <span className="rounded-full border border-[var(--b-border)] px-2 py-0.5">{t('bento.first')}</span>
              </p>
              <p lang="en" dir="ltr" className="mt-3 font-semibold leading-snug">
                {chapter.title}
              </p>
              <p lang="en" dir="ltr" className="mt-1 text-sm text-[var(--b-muted)]">
                {chapter.venue} · {chapter.publisher} · {chapter.year}
              </p>
              {chapter.url && (
                <a href={chapter.url} target="_blank" rel="noreferrer" className="mt-3 inline-flex items-center gap-1 text-sm text-[var(--b-accent)] hover:underline">
                  DOI <ArrowUpRight className="size-3.5" />
                </a>
              )}
            </div>
          )}
          <ul className="mt-5 space-y-2 border-t border-[var(--b-border)] pt-4 text-sm">
            {data.publications
              .filter((p) => p !== chapter)
              .map((p) => (
                <li key={p.id} className="flex gap-2">
                  <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-[var(--b-muted)]" />
                  <span>
                    <span lang="en" dir="ltr" className="block">
                      {p.title}
                    </span>
                    <span className="text-xs text-[var(--b-muted)]">{publicationLabel(t, 'pubStatus', p.status)}</span>
                  </span>
                </li>
              ))}
          </ul>
        </Tile>

        {/* education */}
        <Tile dark={dark} id="education" className="md:col-span-6 lg:col-span-6">
          <Label icon={GraduationCap}>{t('sections.education.title')}</Label>
          <ul className="space-y-4">
            {data.education.map((e) => (
              <li key={e.id} className="flex gap-4">
                <span className="mt-1 w-24 shrink-0 font-mono text-xs text-[var(--b-muted)]">
                  {e.startYear && fmtYear(loc, e.startYear)}–{e.endYear ? fmtYear(loc, e.endYear) : ''}
                </span>
                <div>
                  <p className="font-medium">{e.degree}</p>
                  <p className="text-sm text-[var(--b-muted)]">
                    {e.institution}
                    {e.gpa && (
                      <>
                        {' '}
                        · <span dir="ltr">{e.gpa}</span>
                      </>
                    )}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        </Tile>

        {/* courses */}
        <Tile dark={dark} className="md:col-span-6 lg:col-span-6">
          <Label>{t('sections.certifications.title')}</Label>
          <p className="text-4xl font-semibold tracking-tight">
            {fmtNum(loc, data.certStats.count)}{' '}
            <span className="text-lg font-normal text-[var(--b-muted)]">
              {loc === 'fa' ? '، ' : '· '}
              {t('common.hours', { count: fmtNum(loc, data.certStats.hours) })}
            </span>
          </p>
          <ul className="mt-4 flex flex-wrap gap-1.5" dir="ltr">
            {data.certifications.map((c, i) => (
              <li
                key={c.name + c.issuer}
                hidden={!allCourses && i >= 14 ? true : undefined}
                title={`${c.issuer}${c.year ? ` · ${c.year}` : ''}`}
                className="rounded-lg border border-[var(--b-border)] px-2 py-1 text-xs text-[var(--b-muted)]"
              >
                {c.url ? (
                  <a href={c.url} target="_blank" rel="noreferrer" className="hover:text-[var(--b-fg)] hover:underline">
                    {c.name}
                  </a>
                ) : (
                  c.name
                )}
                {c.hours ? <span className="ms-1 opacity-70">{t('common.hours', { count: fmtNum(loc, c.hours) })}</span> : null}
              </li>
            ))}
          </ul>
          <button
            type="button"
            data-kit-more=""
            aria-expanded={allCourses}
            onClick={() => setAllCourses((v) => !v)}
            className="mt-3 text-sm text-[var(--b-muted)] underline-offset-4 hover:text-[var(--b-fg)] hover:underline"
          >
            {allCourses ? t('common.showFewer') : t('common.showAll', { count: data.certifications.length })}
          </button>
        </Tile>

        {/* every skill of the CV, grouped */}
        <Tile dark={dark} className="md:col-span-6 lg:col-span-12">
          <div className="mb-4 flex flex-wrap items-baseline justify-between gap-2">
            <Label>{t('bento.allSkills')}</Label>
            <span className="font-mono text-xs text-[var(--b-muted)]">
              {t('common.count.skills', { count: data.skills.filter((c) => c.id !== 'soft-skills').reduce((a, c) => a + c.groups.reduce((b, g) => b + g.items.length, 0), 0) })}
            </span>
          </div>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {data.skills
              .filter((c) => c.id !== 'soft-skills')
              .map((c) => (
                <details key={c.id} className="group rounded-2xl border border-[var(--b-border)] bg-[var(--b-bg)]/40 p-4 open:bg-[var(--b-bg)]/60">
                  <summary className="flex cursor-pointer list-none items-center justify-between gap-2 font-medium [&::-webkit-details-marker]:hidden">
                    <span>{c.label}</span>
                    <span className="font-mono text-xs text-[var(--b-muted)]">{fmtNum(loc, c.groups.reduce((a, g) => a + g.items.length, 0))}</span>
                  </summary>
                  <div className="mt-3 space-y-3">
                    {c.groups.map((g) => (
                      <div key={g.id}>
                        <p className="text-xs text-[var(--b-muted)]">{g.label}</p>
                        <ul className="mt-1.5 flex flex-wrap gap-1.5">
                          {g.items.map((it) => (
                            <li key={it.key} title={it.long !== it.name ? it.long : undefined} className="rounded-md border border-[var(--b-border)] px-1.5 py-0.5 text-xs">
                              <bdi>{it.name}</bdi>
                            </li>
                          ))}
                        </ul>
                      </div>
                    ))}
                  </div>
                </details>
              ))}
          </div>
        </Tile>

        {/* contact */}
        <Tile dark={dark} id="contact" className="md:col-span-6 lg:col-span-12">
          <div className="flex flex-col items-center gap-6 py-10 text-center">
            <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-[var(--b-muted)]">{t('bento.say')}</p>
            <h2 className="max-w-3xl text-4xl font-semibold tracking-[-0.03em] sm:text-6xl">{t('sections.contact.title')}</h2>
            <p className="max-w-xl text-[var(--b-muted)]">{data.person.availability}</p>
            <a href={data.links.email} className="rounded-full bg-[var(--b-fg)] px-6 py-3 font-medium text-[var(--b-bg)]" dir="ltr">
              {data.person.email}
            </a>
            <Dock iconMagnification={64} iconDistance={120} className="border-[var(--b-border)] bg-[var(--b-bg)]/60" direction="middle">
              {(['github', 'linkedin', 'orcid', 'scholar'] as const).map((k) =>
                data.links[k] ? (
                  <DockIcon key={k}>
                    <a href={data.links[k]!} target="_blank" rel="noreferrer" aria-label={k} className="grid size-full place-items-center">
                      <BrandIcon name={k} className="size-5" />
                    </a>
                  </DockIcon>
                ) : null,
              )}
              <DockIcon>
                <a href={data.links.email} aria-label="email" className="grid size-full place-items-center">
                  <Mail className="size-5" />
                </a>
              </DockIcon>
            </Dock>
            <p className="pt-6 text-xs text-[var(--b-muted)]">
              {t('common.rights', { year: fmtYear(loc, new Date(data.generatedAt).getFullYear()) })} · {t('common.builtWith')}
            </p>
          </div>
        </Tile>
      </main>
      <div className="h-20" />

      <Palette open={palette} setOpen={setPalette} data={data} toggleTheme={() => toggleTheme()} />
      <AnimatePresence>{openProject && <ProjectModal p={openProject} onClose={() => setOpenProject(null)} />}</AnimatePresence>
    </div>
  );
}
