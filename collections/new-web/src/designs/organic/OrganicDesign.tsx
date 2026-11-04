'use client';

import dynamic from 'next/dynamic';
import { useEffect, useMemo, useRef, useState, type ReactNode, type RefObject } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { useTranslations } from 'next-intl';
import { ArrowUpRight, BookOpen, Copy, GraduationCap, Languages, Mail, MapPin } from 'lucide-react';
import BlurText from '@/components/reactbits/BlurText';
import CircularText from '@/components/reactbits/CircularText';
import ClickSpark from '@/components/reactbits/ClickSpark';
import GooeyNav from '@/components/reactbits/GooeyNav';
import { Lens } from '@/components/magicui/lens';
import { NumberTicker } from '@/components/magicui/number-ticker';
import { Ripple } from '@/components/magicui/ripple';
import { Expandable } from '@/components/kit/Expandable';
import { ShowAll } from '@/components/kit/ShowAll';
import { BrandIcon } from '@/components/shared/BrandIcon';
import { CopyButton } from '@/components/shared/CopyButton';
import { ProfilePhoto } from '@/components/shared/ProfilePhoto';
import { useLocaleSwitch } from '@/components/shared/useLocaleSwitch';
import { dot, fmtNum, fmtYear, numberLocale, publicationLabel } from '@/lib/format';
import type { Project, ProjectCategory, SiteData } from '@/lib/types';
import { cn } from '@/lib/utils';
import Lineage from './Lineage';
import Molecule from './Molecule';
import WellPlate from './WellPlate';
import './organic.css';

const MetaBalls = dynamic(() => import('@/components/reactbits/MetaBalls'), { ssr: false });

const SECTIONS = ['about', 'lineage', 'specimens', 'molecule', 'bench', 'papers', 'contact'] as const;
const CAT: Record<ProjectCategory, { a: string; b: string }> = {
  omics: { a: '#14a594', b: '#a6ead2' },
  structural: { a: '#8b74f0', b: '#d6ccff' },
  ml: { a: '#3a8bd6', b: '#bddfff' },
  software: { a: '#ee8457', b: '#ffd5c0' },
  biotech: { a: '#b39a12', b: '#f1e59c' },
};
const r2 = (n: number) => Math.round(n * 100) / 100;

function useWidth(ref: RefObject<HTMLElement | null>) {
  const [w, setW] = useState(0);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const ro = new ResizeObserver(([e]) => setW(Math.round(e.contentRect.width)));
    ro.observe(el);
    return () => ro.disconnect();
  }, [ref]);
  return w;
}

/** deterministic PRNG (mulberry32) seeded from a string */
function rng(seed: string) {
  let h = 1779033703 ^ seed.length;
  for (let i = 0; i < seed.length; i++) h = Math.imul(h ^ seed.charCodeAt(i), 3432918353);
  let a = (h << 13) | (h >>> 19);
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/* ---------------------------------------------------------------- bits */

function Head({ kicker, title, sub, className }: { kicker: string; title: string; sub?: string; className?: string }) {
  return (
    <div className={cn('mb-12 max-w-3xl', className)}>
      <p className="o-kicker">{kicker}</p>
      <h2 className="font-display mt-4 text-[clamp(2.6rem,5.6vw,4.8rem)] leading-[1.02]">
        <BlurText as="span" text={title} delay={70} direction="bottom" />
      </h2>
      {sub && <p className="mt-5 max-w-2xl text-lg leading-relaxed text-[var(--o-muted)]">{sub}</p>}
    </div>
  );
}

function Section({ id, children, className }: { id: string; children: ReactNode; className?: string }) {
  return (
    <section id={id} className={cn('relative mx-auto max-w-7xl scroll-mt-24 px-5 py-16 sm:px-8 sm:py-24', className)}>
      {children}
    </section>
  );
}

/** a little petri dish with deterministic "colonies" — the specimen art */
function Colonies({ seed, cat, className }: { seed: string; cat: ProjectCategory; className?: string }) {
  const rand = rng(seed);
  const { a, b } = CAT[cat];
  const dots = Array.from({ length: 16 }, (_, i) => {
    const ang = rand() * Math.PI * 2;
    const rad = Math.sqrt(rand()) * 40;
    return { x: r2(60 + Math.cos(ang) * rad), y: r2(60 + Math.sin(ang) * rad), r: r2(2.2 + rand() * (i < 4 ? 9 : 4.5)), c: rand() > 0.45 ? a : b };
  });
  return (
    <svg viewBox="0 0 120 120" className={className} aria-hidden>
      <defs>
        <radialGradient id={`agar-${seed}`} cx="40%" cy="35%" r="70%">
          <stop offset="0" stopColor="#fffdf4" />
          <stop offset="0.7" stopColor="#f6edd2" />
          <stop offset="1" stopColor="#e9d9ad" />
        </radialGradient>
      </defs>
      <circle cx="60" cy="60" r="56" fill={`url(#agar-${seed})`} stroke="#fff" strokeWidth="4" />
      <circle cx="60" cy="60" r="56" fill="none" stroke="rgb(16 32 27 / 0.08)" strokeWidth="1" />
      <g className="origin-center transition-transform duration-700 ease-out [transform-box:fill-box] group-hover:scale-[1.12]">
        {dots.map((d, i) => (
          <g key={i}>
            <circle cx={d.x} cy={d.y} r={d.r} fill={d.c} opacity={0.88} />
            {d.r > 6 && <circle cx={d.x - d.r * 0.25} cy={d.y - d.r * 0.3} r={r2(d.r * 0.35)} fill="#fff" opacity={0.45} />}
          </g>
        ))}
      </g>
    </svg>
  );
}

/* ---------------------------------------------------------------- nav */

function TopBar({ data }: { data: SiteData }) {
  const t = useTranslations();
  const { locale, locales, switchTo } = useLocaleSwitch();
  const [idx, setIdx] = useState(0);
  const lockUntil = useRef(0);
  const labels = [t('nav.about'), t('organic.navLineage'), t('organic.navSpecimens'), t('organic.navMolecule'), t('organic.navBench'), t('organic.navPapers'), t('nav.contact')];
  const items = useMemo(() => labels.map((label) => ({ label })), [labels.join('|')]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    const io = new IntersectionObserver(
      (entries) => {
        if (Date.now() < lockUntil.current) return;
        for (const en of entries) {
          const i = SECTIONS.indexOf(en.target.id as (typeof SECTIONS)[number]);
          if (en.isIntersecting && i >= 0) setIdx(i);
        }
      },
      { rootMargin: '-40% 0px -55% 0px' },
    );
    SECTIONS.forEach((id) => {
      const el = document.getElementById(id);
      if (el) io.observe(el);
    });
    return () => io.disconnect();
  }, []);

  return (
    <header className="fixed inset-x-0 top-0 z-50 px-4 pt-4 sm:px-6">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-3">
        <a href="#top" className="glass flex items-center gap-2.5 rounded-full py-1.5 pe-4 ps-1.5" aria-label={data.person.displayName}>
          <span lang="en" className="grid size-9 place-items-center rounded-full bg-[radial-gradient(circle_at_35%_30%,#c9f5e4,#14a594)] text-xs font-bold text-white shadow-inner">
            RY
          </span>
          <span className="text-sm font-semibold">{data.person.displayName}</span>
        </a>
        <div className="hidden xl:block">
          <GooeyNav
            items={items}
            activeIndex={idx}
            onChange={(i) => {
              lockUntil.current = Date.now() + 1100;
              setIdx(i);
              document.getElementById(SECTIONS[i])?.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }}
            theme="light"
            color="#10201b"
            size="sm"
          />
        </div>
        <div className="glass flex rounded-full p-1" role="group" aria-label={t('common.language')}>
          {locales.map((l) => (
            <button
              key={l.code}
              type="button"
              lang={l.code}
              onClick={() => switchTo(l.code)}
              aria-pressed={l.code === locale}
              className={cn('rounded-full px-3 py-1.5 text-xs font-semibold transition', l.code === locale ? 'bg-[var(--o-ink)] text-white' : 'text-[var(--o-muted)] hover:text-[var(--o-ink)]')}
            >
              {l.short}
            </button>
          ))}
        </div>
      </div>
    </header>
  );
}

/* ---------------------------------------------------------------- hero */

function Dish({ data }: { data: SiteData }) {
  const t = useTranslations();
  const ref = useRef<HTMLDivElement>(null);
  const w = useWidth(ref);
  return (
    <div ref={ref} className="relative mx-auto aspect-square w-full max-w-[600px]">
      {w > 0 && (
        <div className="pointer-events-none absolute inset-0 text-[var(--o-ink)]/60" lang="en" aria-hidden>
          <CircularText text="BIOINFORMATICS ✦ BIOTECHNOLOGY ✦ RESEARCH SOFTWARE ✦ " size={w} fontSize={Math.max(10, r2(w * 0.024))} fontWeight={600} spinDuration={60} onHover="slowDown" />
        </div>
      )}
      <motion.div
        initial={{ scale: 0.86, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
        className="o-dish absolute inset-[8.5%] overflow-hidden rounded-full"
      >
        <MetaBalls
          className="absolute inset-0"
          color="#13a493"
          cursorBallColor="#9a83ff"
          enableTransparency
          ballCount={18}
          animationSize={26}
          speed={0.24}
          clumpFactor={0.62}
          cursorBallSize={2.6}
          motion="drift"
          gooeyness={0.6}
        />
        <div className="o-dish-gloss pointer-events-none absolute inset-0 rounded-full" />
      </motion.div>

      <motion.div
        initial={{ y: -16, opacity: 0, rotate: 14 }}
        animate={{ y: 0, opacity: 1, rotate: 7 }}
        transition={{ delay: 0.7, duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
        className="o-sticker absolute end-[3%] top-[9%] rounded-xl px-3.5 py-2.5 rtl:-rotate-6"
      >
        <p className="font-display text-xl leading-none">
          {t('organic.dishLabel')}{' '}
          <bdi lang="en" className="italic">
            RY‑26
          </bdi>
        </p>
        <p className="mt-1 text-[11px] text-[var(--o-muted)]">{t('organic.dishSub')}</p>
      </motion.div>

      <motion.div
        initial={{ scale: 0.6, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 0.5, type: 'spring', stiffness: 160, damping: 16 }}
        className="glass absolute bottom-[3%] start-[1%] size-[31%] rounded-full p-[3%]"
      >
        <div className="size-full overflow-hidden rounded-full">
          <Lens zoomFactor={1.8} lensSize={110} ariaLabel={t('common.photoAlt')}>
            <ProfilePhoto
              src={data.person.photo}
              alt={t('common.photoAlt')}
              size={420}
              priority
              className="aspect-square w-full"
              monogramClassName="text-[2.2em] text-[var(--o-ink)] from-[#a6ead2] via-[#d6ccff] to-[#ffd5c0]"
            />
          </Lens>
        </div>
      </motion.div>
    </div>
  );
}

function Hero({ data }: { data: SiteData }) {
  const t = useTranslations();
  const p = data.person;
  // localized display name (رامین یزدانی in Persian), first word on its own line
  const [first, ...rest] = p.displayName.split(' ');
  return (
    <section id="top" className="relative mx-auto grid min-h-[100svh] max-w-7xl items-center gap-12 px-5 pb-20 pt-32 sm:px-8 lg:grid-cols-[1.05fr_1fr]">
      <div>
        <motion.p
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7 }}
          className="glass inline-flex items-center gap-2.5 rounded-full px-4 py-2 text-sm"
        >
          <span className="relative flex size-2.5">
            <span className="absolute inline-flex size-full animate-ping rounded-full bg-[var(--o-teal)] opacity-60" />
            <span className="relative inline-flex size-2.5 rounded-full bg-[var(--o-teal)]" />
          </span>
          {t('common.available')}
        </motion.p>
        <h1 className="font-display mt-7 text-[clamp(3.6rem,9vw,8.4rem)] leading-[0.9]">
          <BlurText as="span" text={first} delay={120} direction="bottom" className="block" />
          <BlurText as="span" text={rest.join(' ')} delay={120} direction="bottom" className="block italic text-[var(--o-teal)]" />
        </h1>
        <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.6, duration: 1 }} className="font-display mt-6 text-[clamp(1.5rem,2.4vw,2.1rem)] italic leading-snug text-[var(--o-ink)]/75">
          {p.tagline}
        </motion.p>
        <motion.p initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.8, duration: 0.8 }} className="mt-6 max-w-xl text-[17px] leading-relaxed text-[var(--o-ink)]/80">
          {p.intro}
        </motion.p>
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 1, duration: 0.8 }} className="mt-9 flex flex-wrap items-center gap-3">
          <a href={data.links.email} className="inline-flex items-center gap-2 rounded-full bg-[var(--o-ink)] px-6 py-3 text-sm font-semibold text-white shadow-[0_12px_30px_-12px_rgb(16_32_27/0.6)] transition hover:-translate-y-0.5">
            <Mail className="size-4" /> {t('common.sendEmail')}
          </a>
          <a href="#specimens" className="glass inline-flex items-center gap-2 rounded-full px-6 py-3 text-sm font-semibold transition hover:-translate-y-0.5">
            {t('nav.projects')} <ArrowUpRight className="flip-rtl size-4" />
          </a>
          <span className="inline-flex items-center gap-1.5 px-2 text-sm text-[var(--o-muted)]">
            <MapPin className="size-4" /> {p.location}
          </span>
        </motion.div>
      </div>
      <Dish data={data} />
      <a href="#about" className="absolute bottom-6 start-1/2 hidden -translate-x-1/2 flex-col items-center gap-2 text-xs text-[var(--o-muted)] sm:flex rtl:translate-x-1/2">
        <span className="grid h-9 w-6 justify-center rounded-full border border-[var(--o-ink)]/25 pt-1.5">
          <motion.span className="size-1.5 rounded-full bg-[var(--o-teal)]" animate={{ y: [0, 12, 0] }} transition={{ duration: 1.8, repeat: Infinity, ease: 'easeInOut' }} />
        </span>
        {t('organic.scroll')}
      </a>
    </section>
  );
}

/* ---------------------------------------------------------------- about */

const CELL_COLORS = ['#a6ead2', '#d6ccff', '#ffd5c0', '#bddfff'];
const QUOTES: Record<SiteData['locale'], [string, string]> = { en: ['“', '”'], de: ['„', '“'], fa: ['«', '»'] };

function About({ data }: { data: SiteData }) {
  const t = useTranslations();
  const stats = ['repos', 'mpi', 'hours', 'years'].map((id) => data.stats.find((s) => s.id === id)).filter((s): s is NonNullable<typeof s> => !!s);
  return (
    <Section id="about">
      <Head kicker={t('organic.aboutKicker')} title={t('organic.aboutTitle')} />
      <div className="grid gap-10 lg:grid-cols-[1fr_1.1fr] lg:gap-14">
        <motion.blockquote
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.4 }}
          transition={{ duration: 0.8 }}
          className="font-display text-[clamp(1.7rem,2.8vw,2.5rem)] leading-[1.25]"
        >
          <span className="me-1 text-[var(--o-teal)]">{QUOTES[data.locale][0]}</span>
          {data.person.statement}
          <span className="ms-1 text-[var(--o-teal)]">{QUOTES[data.locale][1]}</span>
        </motion.blockquote>
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.2 }}
          transition={{ duration: 0.8, delay: 0.1 }}
          className="glass space-y-4 rounded-[32px] p-7 text-[15.5px] leading-relaxed text-[var(--o-ink)]/85 sm:p-8"
        >
          {data.person.about.map((para, i) => (
            <p key={i}>{para}</p>
          ))}
        </motion.div>
      </div>
      <div className="mt-16 grid grid-cols-2 gap-5 lg:grid-cols-4">
        {stats.map((s, i) => (
          <motion.div
            key={s.id}
            initial={{ opacity: 0, scale: 0.7 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.1, type: 'spring', stiffness: 140, damping: 15 }}
            className="mx-auto aspect-square w-full max-w-[240px]"
          >
            <motion.div
              animate={{ y: [0, -8, 0] }}
              transition={{ duration: 5 + i, repeat: Infinity, ease: 'easeInOut', delay: i * 0.6 }}
              className="relative grid size-full place-items-center rounded-full text-center"
              style={{
                background: `radial-gradient(circle at 35% 30%, #ffffff 0%, ${CELL_COLORS[i]} 55%, color-mix(in oklab, ${CELL_COLORS[i]} 70%, #10201b) 120%)`,
                boxShadow: `inset 0 0 0 10px rgb(255 255 255 / 0.35), 0 30px 60px -30px color-mix(in oklab, ${CELL_COLORS[i]} 60%, #10201b)`,
              }}
            >
              <span className="absolute inset-[22%] rounded-full border border-white/60" />
              <div className="relative px-5">
                <p className="font-display text-[clamp(2.6rem,5vw,3.8rem)] leading-none">
                  <NumberTicker value={s.value} locale={numberLocale(data.locale)} className="text-[var(--o-ink)]" />
                  {s.suffix}
                </p>
                <p className="mx-auto mt-2 max-w-[11rem] text-[13px] leading-snug text-[var(--o-ink)]/70">{s.label}</p>
              </div>
            </motion.div>
          </motion.div>
        ))}
      </div>
    </Section>
  );
}

/* ---------------------------------------------------------------- projects */

function Specimen({ p, n, loc, hidden }: { p: Project; n: number; loc: SiteData['locale']; hidden?: boolean }) {
  const t = useTranslations();
  return (
    <motion.article
      hidden={hidden || undefined}
      layout
      initial={{ opacity: 0, scale: 0.94 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.94 }}
      transition={{ duration: 0.35 }}
      className="glass group flex flex-col overflow-hidden rounded-[30px]"
    >
      <div className="relative flex items-center gap-5 border-b border-white/60 bg-white/30 p-5">
        <Colonies seed={p.id} cat={p.category} className={cn('shrink-0 drop-shadow-sm', p.highlight ? 'size-24' : 'size-16')} />
        <div className="min-w-0">
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--o-muted)] rtl:tracking-normal">
            {t('organic.specimen')} <bdi className="tabular-nums">Nº {fmtNum(loc, n, { minimumIntegerDigits: 2 })}</bdi>
          </p>
          <p className="mt-1.5 flex items-center gap-2 text-sm font-medium">
            <span className="size-2 rounded-full" style={{ background: CAT[p.category].a }} />
            {t(`categories.${p.category}`)}
          </p>
        </div>
        {p.metric && (
          <span dir="ltr" className="font-display ml-auto text-4xl rtl:ml-0 rtl:mr-auto" style={{ color: CAT[p.category].a }}>
            {p.metric}
          </span>
        )}
      </div>
      <div className="flex flex-1 flex-col p-6">
        <h3 className={cn('font-display leading-tight', p.highlight ? 'text-[1.8rem]' : 'text-2xl')}>{p.title}</h3>
        <Expandable
          text={p.description}
          lines={4}
          minChars={190}
          className="mt-3 text-[14.5px] leading-relaxed text-[var(--o-ink)]/75"
          buttonClassName="text-sm font-semibold text-[var(--o-teal)]"
        />
        <div className="mt-4 flex flex-wrap gap-1.5">
          {p.tags.map((tag) => (
            <span key={tag} className="rounded-full bg-white/70 px-2.5 py-1 text-xs text-[var(--o-ink)]/80">
              {tag}
            </span>
          ))}
        </div>
        <div className="mt-auto pt-6">
          {p.url ? (
            <a href={p.url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 text-sm font-semibold text-[var(--o-ink)] underline-offset-4 hover:underline">
              <BrandIcon name="github" className="size-4" />
              <span dir="ltr" className="truncate">{p.repo?.split('/').pop()}</span>
              <ArrowUpRight className="flip-rtl size-4" />
            </a>
          ) : (
            <span className="text-sm text-[var(--o-muted)]">{t('common.noLink')}</span>
          )}
        </div>
      </div>
    </motion.article>
  );
}

function Specimens({ data }: { data: SiteData }) {
  const t = useTranslations();
  const cats = ['all', ...Array.from(new Set(data.projects.map((p) => p.category)))] as ('all' | ProjectCategory)[];
  const [cat, setCat] = useState<'all' | ProjectCategory>('all');
  const [expanded, setExpanded] = useState(false);
  // highlighted specimens first (stable sort keeps the curated order inside each group)
  const ordered = useMemo(() => [...data.projects].sort((a, b) => Number(b.highlight) - Number(a.highlight)), [data.projects]);
  const filtered = ordered.filter((p) => cat === 'all' || p.category === cat);
  const INITIAL = 9;
  return (
    <Section id="specimens">
      <Head kicker={t('organic.specimensKicker')} title={t('organic.specimensTitle')} sub={t('sections.projects.subtitle')} />
      <div className="mb-10 flex flex-wrap gap-2" role="tablist">
        {cats.map((c) => (
          <button
            key={c}
            type="button"
            role="tab"
            aria-selected={cat === c}
            onClick={() => setCat(c)}
            className={cn('relative isolate rounded-full px-4 py-2 text-sm font-medium transition', cat === c ? 'text-white' : 'glass text-[var(--o-ink)]/80 hover:text-[var(--o-ink)]')}
          >
            {cat === c && <motion.span layoutId="o-cat" className="absolute inset-0 -z-10 rounded-full bg-[var(--o-ink)]" transition={{ type: 'spring', stiffness: 380, damping: 30 }} />}
            {t(`categories.${c}`)}
            <span className="ms-1.5 tabular-nums opacity-60">{fmtNum(data.locale, c === 'all' ? data.projects.length : data.projects.filter((p) => p.category === c).length)}</span>
          </button>
        ))}
      </div>
      <motion.div layout className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        <AnimatePresence mode="popLayout">
          {/* collapsed specimens stay in the DOM (hidden), so nothing is dropped */}
          {filtered.map((p, i) => (
            <Specimen key={p.id} p={p} n={data.projects.indexOf(p) + 1} loc={data.locale} hidden={cat === 'all' && !expanded && i >= INITIAL} />
          ))}
        </AnimatePresence>
      </motion.div>
      {cat === 'all' && filtered.length > INITIAL && (
        <div className="mt-10 flex justify-center">
          <button
            type="button"
            data-kit-more=""
            aria-expanded={expanded}
            onClick={() => setExpanded((v) => !v)}
            className="glass rounded-full px-6 py-3 text-sm font-semibold transition hover:bg-white/80"
          >
            {expanded ? t('common.less') : `${t('common.more')} (${fmtNum(data.locale, filtered.length - INITIAL)})`}
          </button>
        </div>
      )}
      {data.archive.length > 0 && (
        <div className="mt-14">
          <p className="o-kicker mb-4">
            {t('common.archive')} · {fmtNum(data.locale, data.archive.length)}
          </p>
          <ShowAll
            items={data.archive}
            initial={6}
            getKey={(a) => a.id}
            className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3"
            buttonWrapClassName="mt-6 flex justify-center"
            buttonClassName="glass rounded-full px-6 py-3 text-sm font-semibold transition hover:bg-white/80"
            render={(a) => (
              <article className="glass flex h-full flex-col rounded-[24px] p-5">
                <p className="flex items-center gap-2 text-xs font-medium text-[var(--o-muted)]">
                  <span className="size-2 rounded-full" style={{ background: CAT[a.category].a }} />
                  {t(`categories.${a.category}`)}
                </p>
                <h3 className="mt-2 font-semibold leading-snug">{a.title}</h3>
                <Expandable
                  text={a.description}
                  lines={3}
                  minChars={150}
                  className="mt-2 text-sm leading-relaxed text-[var(--o-ink)]/75"
                  buttonClassName="text-sm font-semibold text-[var(--o-teal)]"
                />
                {a.url && (
                  <a href={a.url} target="_blank" rel="noreferrer" className="mt-auto inline-flex items-center gap-2 pt-4 text-sm font-semibold underline-offset-4 hover:underline">
                    <BrandIcon name="github" className="size-4" />
                    <span dir="ltr" className="truncate">{a.repo?.split('/').pop() ?? a.title}</span>
                    <ArrowUpRight className="flip-rtl size-4" />
                  </a>
                )}
              </article>
            )}
          />
        </div>
      )}
    </Section>
  );
}

/* ------------------------------------------------------------- skill index */

/** Every skill of the CV by domain (the molecule shows a selection), plus soft skills. */
function SkillIndex({ data }: { data: SiteData }) {
  const t = useTranslations();
  return (
    <div className="mt-10">
      <p className="o-kicker mb-4">{t('organic.skillIndex')}</p>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {data.domains.map((d) => (
          <details key={d.id} className="glass rounded-[24px] px-5 py-4 open:bg-white/70">
            <summary className="flex cursor-pointer list-none items-center gap-3 text-sm font-semibold [&::-webkit-details-marker]:hidden">
              <span className="size-3 shrink-0 rounded-full" style={{ background: `oklch(0.78 0.11 ${d.hue})` }} />
              <span className="flex-1">{t(`domains.${d.id}`)}</span>
              <span className="tabular-nums text-[var(--o-muted)]">{fmtNum(data.locale, d.count)}</span>
            </summary>
            <ul className="mt-3 flex flex-wrap gap-1.5">
              {d.items.map((it) => (
                <li key={it.key} title={it.long !== it.name ? it.long : undefined} className="rounded-full bg-white/80 px-2.5 py-1 text-[13px]">
                  <bdi>{it.name}</bdi>
                </li>
              ))}
            </ul>
          </details>
        ))}
        <details className="glass rounded-[24px] px-5 py-4 open:bg-white/70">
          <summary className="flex cursor-pointer list-none items-center gap-3 text-sm font-semibold [&::-webkit-details-marker]:hidden">
            <span className="size-3 shrink-0 rounded-full bg-[var(--o-ink)]/30" />
            <span className="flex-1">{t('common.softSkills')}</span>
            <span className="tabular-nums text-[var(--o-muted)]">{fmtNum(data.locale, data.softSkills.length)}</span>
          </summary>
          <ul className="mt-3 flex flex-wrap gap-1.5">
            {data.softSkills.map((it) => (
              <li key={it.key} className="rounded-full bg-white/80 px-2.5 py-1 text-[13px]">
                {it.name}
              </li>
            ))}
          </ul>
        </details>
      </div>
    </div>
  );
}

/* ---------------------------------------------------------------- papers */

function Papers({ data }: { data: SiteData }) {
  const t = useTranslations();
  const loc = data.locale;
  const chapter = data.publications.find((p) => p.status === 'Published');
  const rest = data.publications.filter((p) => p !== chapter);
  const english = data.languages.find((l) => l.cert);
  return (
    <Section id="papers">
      <Head kicker={t('organic.papersKicker')} title={t('organic.papersTitle')} />
      <div className="grid gap-6 lg:grid-cols-12">
        <div className="space-y-6 lg:col-span-7">
          {chapter && (
            <article className="glass-strong relative overflow-hidden rounded-[32px] p-7 sm:p-9">
              <div className="absolute -end-16 -top-16 size-56 rounded-full bg-[radial-gradient(circle,#a6ead2,transparent_70%)] opacity-70" />
              <p className="relative flex flex-wrap items-center gap-2 text-xs font-semibold">
                <span className="rounded-full bg-[var(--o-teal)] px-3 py-1 text-white">{publicationLabel(t, 'pubStatus', chapter.status)}</span>
                <span className="rounded-full bg-white/80 px-3 py-1">{publicationLabel(t, 'pubType', chapter.type)}</span>
                {chapter.firstAuthor && <span className="rounded-full bg-white/80 px-3 py-1">{t('common.firstAuthor')}</span>}
              </p>
              <h3 lang="en" dir="ltr" className="font-display relative mt-6 text-[clamp(1.8rem,3vw,2.6rem)] leading-tight">
                {chapter.title}
              </h3>
              <p lang="en" dir="ltr" className="relative mt-3 text-[15px] text-[var(--o-muted)]">
                <em>{chapter.venue}</em> · {chapter.publisher} · {chapter.year}
              </p>
              <div className="relative mt-7 flex flex-wrap gap-3">
                {chapter.url && (
                  <a href={chapter.url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 rounded-full bg-[var(--o-ink)] px-5 py-2.5 text-sm font-semibold text-white">
                    <BookOpen className="size-4" /> {t('common.doi')} <ArrowUpRight className="size-4" />
                  </a>
                )}
                {chapter.bibtex && (
                  <CopyButton value={chapter.bibtex} className="glass inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-sm font-semibold">
                    <Copy className="size-4" /> {t('common.copyBibtex')}
                  </CopyButton>
                )}
              </div>
            </article>
          )}
          <ul className="glass divide-y divide-white/70 rounded-[32px] px-7 py-2">
            {rest.map((p) => (
              <li key={p.id} className="py-5">
                <p className="flex flex-wrap items-center gap-2 text-xs text-[var(--o-muted)]">
                  <span className="rounded-full bg-white/80 px-2.5 py-0.5 font-semibold text-[var(--o-ink)]">{publicationLabel(t, 'pubStatus', p.status)}</span>
                  {publicationLabel(t, 'pubType', p.type)}
                  {p.year ? <span>· {fmtYear(loc, p.year)}</span> : null}
                </p>
                <p lang="en" dir="ltr" className="mt-2 font-medium leading-snug">
                  {p.title}
                </p>
              </li>
            ))}
          </ul>
        </div>

        <div className="space-y-6 lg:col-span-5">
          <div className="glass rounded-[32px] p-7">
            <p className="o-kicker mb-5 flex items-center gap-2">
              <GraduationCap className="size-4" /> {t('sections.education.title')}
            </p>
            <ol className="relative space-y-6 border-s border-dashed border-[var(--o-ink)]/20 ps-6">
              {data.education.map((e) => (
                <li key={e.id} className="relative">
                  <span className={cn('absolute -start-[31px] top-1 size-3.5 rounded-full border-2 border-white', e.current ? 'bg-[var(--o-teal)]' : 'bg-[#c8d4cf]')} />
                  <p className="text-xs tabular-nums text-[var(--o-muted)]">{e.period}</p>
                  <p className="mt-1 font-semibold leading-snug">{e.degree}</p>
                  <p className="text-sm text-[var(--o-muted)]">
                    {e.institution}
                    {e.gpa && (
                      <>
                        {' · '}
                        {t('common.gpa')} <bdi dir="ltr">{e.gpa}</bdi>
                      </>
                    )}
                  </p>
                </li>
              ))}
            </ol>
          </div>
          <div className="glass rounded-[32px] p-7">
            <p className="o-kicker mb-5 flex items-center gap-2">
              <Languages className="size-4" /> {t('sections.languages.title')}
            </p>
            {english?.cert && (
              <div className="mb-5 flex items-center gap-5">
                <div className="grid size-24 shrink-0 place-items-center rounded-full bg-[conic-gradient(var(--o-teal)_var(--p),#fff_0)] p-2" style={{ ['--p' as string]: `${(english.cert.overall / english.cert.max) * 100}%` }}>
                  <div className="grid size-full place-items-center rounded-full bg-[#fbfaf6] text-center">
                    <div>
                      <p className="font-display text-3xl leading-none">{fmtNum(loc, english.cert.overall, { minimumFractionDigits: 1 })}</p>
                      <p className="text-[10px] text-[var(--o-muted)]">IELTS</p>
                    </div>
                  </div>
                </div>
                <ul className="grid flex-1 grid-cols-2 gap-x-4 gap-y-1.5 text-sm">
                  {(['reading', 'listening', 'speaking', 'writing'] as const).map((k) => (
                    <li key={k} className="flex justify-between gap-2">
                      <span className="text-[var(--o-muted)]">{t(`ielts.${k}`)}</span>
                      <span className="font-semibold tabular-nums">{fmtNum(loc, english.cert!.bands[k], { minimumFractionDigits: 1 })}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
            <ul className="space-y-2 text-sm">
              {data.languages.map((l) => (
                <li key={l.id} className="flex items-center justify-between gap-3 rounded-2xl bg-white/60 px-4 py-2.5">
                  <span className="font-semibold">{l.name}</span>
                  <span className="text-[var(--o-muted)]">{l.level}</span>
                </li>
              ))}
            </ul>
          </div>
          <div className="glass rounded-[32px] p-7">
            <p className="o-kicker mb-3">{t('sections.certifications.title')}</p>
            <p className="font-display text-5xl leading-none">
              {fmtNum(loc, data.certStats.count)}
              <span className="ms-2 text-xl text-[var(--o-muted)]">
                {loc === 'fa' ? '، ' : '· '}
                {t('common.hours', { count: fmtNum(loc, data.certStats.hours) })}
              </span>
            </p>
            <p className="mt-2 text-sm text-[var(--o-muted)]">
              {t('sections.certifications.subtitle', { count: fmtNum(loc, data.certStats.count), hours: fmtNum(loc, data.certStats.hours), issuers: fmtNum(loc, data.certStats.issuers.length) })}
            </p>
            <ShowAll
              items={data.certifications}
              initial={6}
              getKey={(c) => c.name + c.issuer}
              className="mt-5 divide-y divide-white/70 text-sm"
              buttonWrapClassName="mt-4"
              buttonClassName="text-sm font-semibold text-[var(--o-teal)] underline-offset-4 hover:underline"
              render={(c) => (
                <div className="py-2.5">
                  <p lang="en" dir="ltr" className="font-medium leading-snug">
                    {c.url ? (
                      <a href={c.url} target="_blank" rel="noreferrer" className="underline-offset-4 hover:underline">
                        {c.name}
                      </a>
                    ) : (
                      c.name
                    )}
                  </p>
                  <p className="text-xs text-[var(--o-muted)]">
                    <bdi>{c.issuer}</bdi>
                    {c.year ? dot(loc) + fmtYear(loc, c.year) : null}
                    {c.hours ? dot(loc) + t('common.hours', { count: fmtNum(loc, c.hours) }) : null}
                  </p>
                </div>
              )}
            />
          </div>
        </div>
      </div>
    </Section>
  );
}

/* ---------------------------------------------------------------- contact */

function Contact({ data }: { data: SiteData }) {
  const t = useTranslations();
  return (
    <Section id="contact" className="pb-40">
      <ClickSpark sparkColor={['#14a594', '#8b74f0', '#ee8457', '#3a8bd6']} sparkCount={11} sparkRadius={38} sparkSize={12} duration={600} shape="dot">
        <div className="glass-strong relative overflow-hidden rounded-[44px] px-6 py-20 text-center sm:py-28">
          <div className="text-[#14a594] [--ds-fg:#14a594]">
            <Ripple mainCircleSize={280} numCircles={7} mainCircleOpacity={0.22} />
          </div>
          <div className="relative">
            <p className="o-kicker">{t('organic.contactKicker')}</p>
            <h2 className="font-display mx-auto mt-6 max-w-4xl text-[clamp(2.8rem,7vw,6.2rem)] leading-[0.98]">{t('sections.contact.title')}</h2>
            <p className="mx-auto mt-7 max-w-2xl text-lg leading-relaxed text-[var(--o-ink)]/75">{data.person.availability}</p>
            <div className="mt-10 flex flex-wrap items-center justify-center gap-3">
              <a href={data.links.email} dir="ltr" className="inline-flex max-w-full items-center gap-2 break-all rounded-full bg-[var(--o-ink)] px-7 py-3.5 text-sm font-semibold text-white sm:text-base shadow-[0_16px_40px_-14px_rgb(16_32_27/0.7)] transition hover:-translate-y-0.5">
                <Mail className="size-4" /> {data.person.email}
              </a>
              <CopyButton value={data.person.email} className="glass inline-flex items-center gap-2 rounded-full px-5 py-3.5 text-sm font-semibold">
                <Copy className="size-4" /> {t('common.copyEmail')}
              </CopyButton>
            </div>
            <div className="mt-8 flex justify-center gap-3">
              {(['github', 'linkedin', 'orcid', 'scholar'] as const).map((k) =>
                data.links[k] ? (
                  <a key={k} href={data.links[k]!} target="_blank" rel="noreferrer" aria-label={k} className="glass grid size-12 place-items-center rounded-full transition hover:-translate-y-1">
                    <BrandIcon name={k} className="size-5" />
                  </a>
                ) : null,
              )}
            </div>
          </div>
        </div>
      </ClickSpark>
      <footer className="mt-12 text-center text-xs text-[var(--o-muted)]">
        {t('common.rights', { year: fmtYear(data.locale, new Date(data.generatedAt).getUTCFullYear()) })} · {t('common.builtWith')}
      </footer>
    </Section>
  );
}

/* ---------------------------------------------------------------- design */

export default function OrganicDesign({ data }: { data: SiteData }) {
  const t = useTranslations();
  return (
    <div className="organic">
      <div className="o-blobs" aria-hidden>
        <span />
        <span />
        <span />
        <span />
      </div>
      <div className="o-grain" aria-hidden />
      <TopBar data={data} />
      <main>
        <Hero data={data} />
        <About data={data} />
        <Section id="lineage">
          <Head kicker={t('organic.lineageKicker')} title={t('organic.lineageTitle')} sub={t('organic.lineageSubtitle', { count: data.experiences.length })} />
          <Lineage data={data} />
        </Section>
        <Specimens data={data} />
        <Section id="molecule">
          <Head kicker={t('organic.moleculeKicker')} title={t('organic.moleculeTitle')} sub={t('sections.skills.subtitle')} />
          <Molecule data={data} />
          <SkillIndex data={data} />
        </Section>
        <Section id="bench">
          <Head kicker={t('organic.benchKicker')} title={t('organic.benchTitle')} sub={t('organic.benchSubtitle')} />
          <WellPlate data={data} />
        </Section>
        <Papers data={data} />
        <Contact data={data} />
      </main>
    </div>
  );
}
