'use client';

import dynamic from 'next/dynamic';
import { useEffect, useMemo, useRef, useState } from 'react';
import { motion } from 'motion/react';
import { ArrowUpRight, Mail, Search } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { NumberTicker } from '@/components/magicui/number-ticker';
import { TextAnimate } from '@/components/magicui/text-animate';
import { Expandable } from '@/components/kit/Expandable';
import { BrandIcon } from '@/components/shared/BrandIcon';
import { LocaleSwitcher } from '@/components/shared/LocaleSwitcher';
import { ProfilePhoto } from '@/components/shared/ProfilePhoto';
import { Reveal } from '@/components/shared/Reveal';
import { courseHoursByYear } from '@/lib/derive';
import { dot, fmtNum, fmtYear, numberLocale, seqNo, publicationLabel } from '@/lib/format';
import type { ExperienceKind, SiteData } from '@/lib/types';
import { cn } from '@/lib/utils';
import { domainColor, TYPE_COLOR } from './AtlasCanvas';
import './atlas.css';

const AtlasCanvas = dynamic(() => import('./AtlasCanvas'), { ssr: false });

const KIND_COLOR: Record<ExperienceKind, string> = { research: '#3b5bfd', teaching: '#10b39b', industry: '#f2683c', business: '#8c93ad' };

const FAMILIES: Array<{ id: string; color: string; match: RegExp }> = [
  { id: 'R / Bioconductor', color: '#3b5bfd', match: /^(R|Bioconductor|Seurat|ArchR)$/ },
  { id: 'Python', color: '#0f1222', match: /^(Python|PyTorch|PyMOL)$/ },
  { id: 'Single-cell', color: '#10b39b', match: /^(scRNA-seq|Seurat|ArchR|Spatial|scATAC-seq|GBM)$/ },
  { id: 'Omics', color: '#0e7c86', match: /^(RNA-seq|Metagenomics|Multi-omics|GO|MSA|HMM|Hi-C|Assembly|Annotation)$/ },
  { id: 'Structure', color: '#7a4cf0', match: /^(AlphaFold|RoseTTAFold|MODELLER|PyMOL|PDB)$/ },
  { id: 'ML', color: '#c03ea6', match: /^(PyTorch|Transformers|ML|LSTM|PCA|OCR|Chemistry)$/ },
  { id: 'Web / API', color: '#f2683c', match: /^(Flask|React|Django|Express|MySQL|SQLite)$/ },
  { id: 'Automation', color: '#d99a00', match: /^(Selenium|BeautifulSoup|Automation|Jinja2|XeLaTeX|OCR|TUI|pytest)$/ },
  { id: 'Wet lab', color: '#4a8f2a', match: /^(Pichia pastoris|Bioreactor|Synthetic biology|iGEM)$/ },
];

function SectionTitle({ kicker, title, sub }: { kicker: string; title: string; sub?: string }) {
  return (
    <Reveal className="mb-10 max-w-3xl">
      <p className="mb-3 font-mono text-[11px] uppercase tracking-[0.22em] text-[#3b5bfd]">{kicker}</p>
      <h2 className="text-4xl font-bold tracking-[-0.03em] text-[#0f1222] sm:text-5xl">{title}</h2>
      {sub && <p className="mt-4 text-lg leading-relaxed text-[#5a6077]">{sub}</p>}
    </Reveal>
  );
}

export default function AtlasDesign({ data }: { data: SiteData }) {
  const t = useTranslations();
  const ta = useTranslations('atlas');
  const loc = data.locale;
  const fa = loc === 'fa';
  const [step, setStep] = useState(0);
  const stepRefs = useRef<Array<HTMLElement | null>>([]);
  const steps = ta.raw('steps') as Array<{ title: string; body: string }>;
  const skillsCount = data.domains.reduce((s, d) => s + d.count, 0);

  useEffect(() => {
    const io = new IntersectionObserver(
      (es) => es.forEach((e) => e.isIntersecting && setStep(Number((e.target as HTMLElement).dataset.step))),
      { rootMargin: '-45% 0px -45% 0px' },
    );
    stepRefs.current.forEach((el) => el && io.observe(el));
    return () => io.disconnect();
  }, []);

  const fill = (s: string) =>
    s
      .replace('{skills}', fmtNum(loc, skillsCount))
      .replace('{projects}', fmtNum(loc, data.projects.length))
      .replace('{courses}', fmtNum(loc, data.certStats.count))
      .replace('{positions}', fmtNum(loc, data.experiences.length));

  return (
    <div className="atlas min-h-dvh">
      {/* nav */}
      <header className="fixed inset-x-0 top-0 z-50 border-b border-[#e7e9f2] bg-[#fbfbfd]/85 backdrop-blur">
        <div className="mx-auto flex h-14 max-w-[1400px] items-center justify-between px-5">
          <a href="#top" className="flex items-center gap-2 text-sm font-semibold tracking-tight text-[#0f1222]">
            <span className="grid size-7 place-items-center rounded-full bg-[#0f1222] font-mono text-[10px] text-white" lang="en">
              RY
            </span>
            {data.person.displayName}
            <span className="hidden font-normal text-[#8c93ad] sm:inline">· Atlas</span>
          </a>
          <nav className="hidden items-center gap-6 text-sm text-[#5a6077] md:flex">
            {(['about', 'experience', 'projects', 'skills', 'publications', 'contact'] as const).map((id) => (
              <a key={id} href={`#${id}`} className="transition hover:text-[#0f1222]">
                {t(`nav.${id}`)}
              </a>
            ))}
          </nav>
          <LocaleSwitcher
            className="rounded-full bg-[#eef0f7] p-0.5 text-xs"
            itemClassName="rounded-full px-2.5 py-1 text-[#5a6077] transition"
            activeClassName="bg-white text-[#0f1222] shadow-sm"
          />
        </div>
      </header>

      {/* scrollytelling */}
      <section id="top" className="relative mx-auto max-w-[1400px] px-5 lg:grid lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] lg:gap-10">
        <div className="sticky top-14 z-0 h-[52vh] lg:order-2 lg:h-[calc(100dvh-3.5rem)]">
          <div className="absolute inset-0 rounded-[2rem] border border-[#e7e9f2] bg-white/70 shadow-[0_30px_80px_-40px_rgba(15,18,34,0.25)] lg:inset-y-6">
            <AtlasCanvas data={data} step={step} />
          </div>
        </div>
        <div className="relative z-10 lg:order-1">
          <div data-step={0} ref={(el) => { stepRefs.current[0] = el; }} className="flex min-h-[85vh] flex-col justify-center pb-16 pt-10 lg:min-h-[100dvh] lg:pt-14">
            <p className="mb-5 font-mono text-[11px] uppercase tracking-[0.25em] text-[#3b5bfd]">{ta('kicker')}</p>
            <h1 className="text-[clamp(2.8rem,6vw,5.2rem)] font-bold leading-[0.95] tracking-[-0.045em] text-[#0f1222]">
              {fa ? data.person.displayName : <TextAnimate animation="blurInUp" by="word" once as="span">{data.person.fullName}</TextAnimate>}
            </h1>
            <p className="mt-6 text-xl leading-relaxed text-[#2c3150]">{data.person.headline}</p>
            <p className="mt-4 max-w-md text-[17px] leading-relaxed text-[#5a6077]">{ta('lede')}</p>
            <div className="mt-8 rounded-2xl border border-[#e7e9f2] bg-white p-5 shadow-sm">
              <h3 className="font-semibold text-[#0f1222]">{steps[0].title}</h3>
              <p className="mt-2 text-[15px] leading-relaxed text-[#5a6077]">{fill(steps[0].body)}</p>
              <div className="mt-4 flex flex-wrap gap-x-4 gap-y-2 text-xs text-[#5a6077]">
                {(['skill', 'project', 'course', 'position', 'education', 'publication'] as const).map((k) => (
                  <span key={k} className="inline-flex items-center gap-1.5">
                    <span className={cn('size-2.5 rounded-full', k === 'project' && 'border-2 bg-transparent')} style={k === 'project' ? { borderColor: TYPE_COLOR.project } : { background: k === 'skill' ? 'conic-gradient(#3b5bfd,#10b39b,#f2683c,#c03ea6,#3b5bfd)' : TYPE_COLOR[k] }} />
                    {ta(`types.${k}`)}
                  </span>
                ))}
              </div>
            </div>
            <p className="mt-10 font-mono text-xs text-[#8c93ad]">↓ {ta('scroll')}</p>
          </div>
          {steps.slice(1).map((s, i) => (
            <div key={i} data-step={i + 1} ref={(el) => { stepRefs.current[i + 1] = el; }} className="flex min-h-[90vh] items-center py-10">
              <motion.div
                initial={{ opacity: 0.3, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ amount: 0.6 }}
                className={cn('w-full rounded-2xl border bg-white/95 p-6 shadow-sm backdrop-blur transition-colors', step === i + 1 ? 'border-[#3b5bfd]/40' : 'border-[#e7e9f2]')}
              >
                <p className="font-mono text-[11px] text-[#3b5bfd]" dir="ltr">
                  {seqNo(loc, i + 2)} / {seqNo(loc, steps.length)}
                </p>
                <h3 className="mt-2 text-2xl font-bold tracking-tight text-[#0f1222]">{s.title}</h3>
                <p className="mt-3 text-[16px] leading-relaxed text-[#5a6077]">{fill(s.body)}</p>
              </motion.div>
            </div>
          ))}
          <div className="h-[30vh]" />
        </div>
      </section>

      {/* stats */}
      <section className="border-y border-[#e7e9f2] bg-white">
        <div className="mx-auto grid max-w-[1400px] grid-cols-2 gap-px bg-[#e7e9f2] sm:grid-cols-4">
          {data.stats
            .filter((s) => ['repos', 'mpi', 'courses', 'hours'].includes(s.id))
            .map((s) => (
              <div key={s.id} className="bg-white px-6 py-10">
                <p className="whitespace-nowrap text-[clamp(2.4rem,9vw,3rem)] font-bold tracking-[-0.04em] text-[#0f1222]">
                  <NumberTicker value={s.value} locale={numberLocale(loc)} className="text-[#0f1222]" />
                  <span className="text-[#3b5bfd]">{s.suffix}</span>
                </p>
                <p className="mt-2 text-sm text-[#5a6077]">{s.label}</p>
              </div>
            ))}
        </div>
      </section>

      <main className="mx-auto max-w-[1400px] space-y-32 px-5 py-28">
        <About data={data} />
        <Positions data={data} />
        <Matrix data={data} />
        <SkillExplorer data={data} />
        <PubsAndLanguages data={data} />
        <Contact data={data} />
      </main>
    </div>
  );
}

/* ------------------------------------------------------------- sections */

function About({ data }: { data: SiteData }) {
  const t = useTranslations();
  return (
    <section id="about" className="scroll-mt-20">
      <SectionTitle kicker={t('sections.about.kicker')} title={t('sections.about.title')} />
      <div className="grid gap-12 lg:grid-cols-[minmax(0,4fr)_minmax(0,8fr)]">
        <Reveal>
          <div className="overflow-hidden rounded-[2rem] border border-[#e7e9f2] bg-white p-3">
            <ProfilePhoto src={data.person.photo} alt={t('common.photoAlt')} size={640} className="aspect-square rounded-[1.5rem]" monogramClassName="text-[#0f1222]/70 from-[#3b5bfd]/20 via-[#10b39b]/15 to-[#f2683c]/20" />
            <div className="px-3 pb-2 pt-4">
              <p className="font-semibold text-[#0f1222]">{data.person.displayName}</p>
              <p className="text-sm text-[#5a6077]">{data.person.status}</p>
              <p className="mt-1 text-sm text-[#8c93ad]">{data.person.location}</p>
            </div>
          </div>
        </Reveal>
        <div className="space-y-6 text-[17px] leading-[1.8] text-[#2c3150]">
          {data.person.about.map((p, i) => (
            <Reveal key={i} delay={i * 0.06}>
              <p>{p}</p>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

function Positions({ data }: { data: SiteData }) {
  const t = useTranslations();
  const ta = useTranslations('atlas');
  const loc = data.locale;
  const rtl = data.dir === 'rtl';
  const dated = data.experiences.filter((e) => e.start);
  const [sel, setSel] = useState(dated[0]?.id);
  const W = 1000;
  const H = 300;
  const y0 = 2015;
  const y1 = 2027;
  const lanes: ExperienceKind[] = ['research', 'teaching', 'industry', 'business'];
  const sx = (y: number) => {
    const x = 60 + ((y - y0) / (y1 - y0)) * (W - 100);
    return rtl ? W - x : x;
  };
  const selected = data.experiences.find((e) => e.id === sel);
  return (
    <section id="experience" className="scroll-mt-20">
      <SectionTitle kicker={t('sections.experience.kicker')} title={ta('timelineTitle')} sub={`${t('sections.experience.subtitle')} ${ta('timelineSub')}`} />
      <Reveal className="overflow-x-auto rounded-[2rem] border border-[#e7e9f2] bg-white p-4">
        <svg viewBox={`0 0 ${W} ${H}`} className="min-w-[720px]">
          {Array.from({ length: (y1 - y0) / 2 + 1 }, (_, i) => y0 + i * 2).map((y) => (
            <g key={y}>
              <line x1={sx(y)} x2={sx(y)} y1={20} y2={H - 30} stroke="#eef0f7" />
              <text x={sx(y)} y={H - 10} textAnchor="middle" fontSize={11} fill="#8c93ad" className="font-mono">
                {fmtYear(loc, y)}
              </text>
            </g>
          ))}
          {lanes.map((k, li) => (
            <text key={k} x={rtl ? W - 8 : 8} y={50 + li * 60} textAnchor={rtl ? 'end' : 'start'} fontSize={11} fill={KIND_COLOR[k]} fontWeight={600}>
              {t(`kinds.${k}`)}
            </text>
          ))}
          {dated.map((e, i) => {
            const y = +e.start!.slice(0, 4) + (+(e.start!.slice(5, 7) || 6) - 1) / 12;
            const r = 5 + Math.sqrt(e.months ?? 6) * 2.2;
            const cy = 50 + lanes.indexOf(e.kind) * 60 + ((i % 3) - 1) * 6;
            return (
              <motion.g
                key={e.id}
                initial={{ opacity: 0, scale: 0 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.05, type: 'spring', stiffness: 200, damping: 18 }}
                style={{ transformOrigin: `${sx(y)}px ${cy}px` }}
                onMouseEnter={() => setSel(e.id)}
                onClick={() => setSel(e.id)}
                className="cursor-pointer"
              >
                <circle cx={sx(y)} cy={cy} r={r} fill={KIND_COLOR[e.kind]} fillOpacity={sel === e.id ? 0.9 : 0.35} stroke={KIND_COLOR[e.kind]} strokeWidth={sel === e.id ? 2.5 : 1} />
                {e.current && <circle cx={sx(y)} cy={cy} r={r + 5} fill="none" stroke={KIND_COLOR[e.kind]} strokeDasharray="2 3" />}
              </motion.g>
            );
          })}
        </svg>
      </Reveal>
      {selected && (
        <motion.div key={selected.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="mt-6 grid gap-4 rounded-2xl border border-[#e7e9f2] bg-white p-6 md:grid-cols-[1fr_2fr]">
          <div>
            <p className="font-mono text-xs" style={{ color: KIND_COLOR[selected.kind] }}>
              {t(`kinds.${selected.kind}`)} · {selected.period}
            </p>
            <h3 className="mt-2 text-xl font-bold tracking-tight text-[#0f1222]">{selected.role}</h3>
            <p className="mt-1 text-sm text-[#5a6077]">
              {selected.org}
              {selected.location && ` · ${selected.location}`}
            </p>
            {selected.months && <p className="mt-2 font-mono text-xs text-[#8c93ad]">{ta('months', { count: selected.months })}</p>}
          </div>
          <p className="text-[16px] leading-relaxed text-[#2c3150]">{selected.description}</p>
        </motion.div>
      )}
      <ul className="mt-6 flex flex-wrap gap-2">
        {data.experiences.map((e) => (
          <li key={e.id}>
            <button
              type="button"
              onClick={() => setSel(e.id)}
              className={cn('rounded-full border px-3 py-1.5 text-xs transition', sel === e.id ? 'border-[#0f1222] bg-[#0f1222] text-white' : 'border-[#e7e9f2] bg-white text-[#5a6077] hover:border-[#0f1222]/30')}
            >
              <span className="me-1.5 inline-block size-2 rounded-full" style={{ background: KIND_COLOR[e.kind] }} />
              {e.role.split(/\s[—–-]\s/)[0]}
            </button>
          </li>
        ))}
      </ul>
      {/* the same positions as a plain list — includes the undated ones that have no dot on the timeline */}
      <details className="atlas-details mt-6 rounded-2xl border border-[#e7e9f2] bg-white">
        <summary className="cursor-pointer list-none px-5 py-4 text-sm font-semibold text-[#0f1222] [&::-webkit-details-marker]:hidden">
          {ta('allPositions', { count: data.experiences.length })}
        </summary>
        <ol className="divide-y divide-[#f1f2f7] border-t border-[#f1f2f7]">
          {data.experiences.map((e) => (
            <li key={e.id} className="grid gap-2 px-5 py-4 md:grid-cols-[11rem_minmax(0,1fr)] md:gap-6">
              <p className="font-mono text-xs" style={{ color: KIND_COLOR[e.kind] }}>
                {t(`kinds.${e.kind}`)}
                <br />
                <span className="text-[#5a6077]">{e.period}</span>
              </p>
              <div>
                <p className="font-semibold text-[#0f1222]">{e.role}</p>
                <p className="text-sm text-[#5a6077]">
                  {e.org}
                  {e.location && ` · ${e.location}`}
                </p>
                <p className="mt-2 text-[15px] leading-relaxed text-[#2c3150]">{e.description}</p>
              </div>
            </li>
          ))}
        </ol>
      </details>
    </section>
  );
}

function Matrix({ data }: { data: SiteData }) {
  const t = useTranslations();
  const ta = useTranslations('atlas');
  const [hover, setHover] = useState<string | null>(null);
  const rows = [...data.projects, ...data.archive];
  return (
    <section id="projects" className="scroll-mt-20">
      <SectionTitle kicker={t('sections.projects.kicker')} title={ta('matrixTitle')} sub={ta('matrixSub')} />
      <Reveal className="overflow-x-auto rounded-[2rem] border border-[#e7e9f2] bg-white p-4 sm:p-6">
        <table className="w-full min-w-[820px] border-separate border-spacing-0 text-sm">
          <thead>
            <tr>
              <th className="sticky start-0 bg-white" />
              {FAMILIES.map((f) => (
                <th key={f.id} className="h-28 w-12 align-bottom font-normal">
                  <span className="inline-block origin-bottom-left -rotate-45 whitespace-nowrap pb-2 text-[11px] text-[#5a6077] rtl:origin-bottom-right rtl:rotate-45" lang="en">
                    {f.id}
                  </span>
                </th>
              ))}
              <th />
            </tr>
          </thead>
          <tbody>
            {rows.map((p, ri) => {
              const on = (f: (typeof FAMILIES)[number]) => p.tags.some((tag) => f.match.test(tag)) || (f.id === 'Wet lab' && p.category === 'biotech') || (f.id === 'Structure' && p.category === 'structural');
              return (
                <tr key={p.id} onMouseEnter={() => setHover(p.id)} onMouseLeave={() => setHover(null)} className="group">
                  <td className={cn('sticky start-0 min-w-[16rem] max-w-[22rem] border-b border-[#f1f2f7] bg-white py-2 pe-4 leading-snug transition', hover === p.id ? 'text-[#0f1222]' : 'text-[#2c3150]')}>
                    <span className="me-2 font-mono text-[10px] text-[#8c93ad]">{seqNo(data.locale, ri + 1)}</span>
                    {p.title}
                  </td>
                  {FAMILIES.map((f, ci) => (
                    <td key={f.id} className="border-b border-[#f1f2f7] p-1">
                      <motion.div
                        initial={{ scale: 0 }}
                        whileInView={{ scale: 1 }}
                        viewport={{ once: true }}
                        transition={{ delay: (ri + ci) * 0.012 }}
                        className="mx-auto size-8 rounded-md"
                        style={{ background: on(f) ? f.color : '#f4f5fa', opacity: on(f) ? (hover && hover !== p.id ? 0.35 : 1) : 1 }}
                      />
                    </td>
                  ))}
                  <td className="border-b border-[#f1f2f7] ps-3">
                    {p.url && (
                      <a href={p.url} target="_blank" rel="noreferrer" aria-label={p.title} className="grid size-8 place-items-center rounded-full text-[#8c93ad] transition hover:bg-[#0f1222] hover:text-white">
                        <ArrowUpRight className="flip-rtl size-4" />
                      </a>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </Reveal>
      <details className="atlas-details mt-6 rounded-2xl border border-[#e7e9f2] bg-white">
        <summary className="cursor-pointer list-none px-5 py-4 text-sm font-semibold text-[#0f1222] [&::-webkit-details-marker]:hidden">
          {ta('allProjects', { count: rows.length })}
        </summary>
        <ol className="grid gap-px border-t border-[#f1f2f7] bg-[#f1f2f7] sm:grid-cols-2">
          {rows.map((p, i) => (
            <li key={p.id} className="flex flex-col bg-white px-5 py-4">
              <p className="font-mono text-[11px] text-[#8c93ad]">
                {seqNo(data.locale, i + 1)}
                {dot(data.locale)}
                {t(`categories.${p.category}`)}
              </p>
              <p className="mt-1 font-semibold leading-snug text-[#0f1222]">{p.title}</p>
              <Expandable text={p.description} lines={3} minChars={170} className="mt-1.5 text-sm leading-relaxed text-[#2c3150]" buttonClassName="text-xs text-[#3b5bfd]" />
              {p.url && (
                <a href={p.url} target="_blank" rel="noreferrer" className="mt-2 inline-flex items-center gap-1 text-sm font-medium text-[#3b5bfd] hover:underline">
                  <BrandIcon name="github" className="size-3.5" /> <span dir="ltr">{p.repo?.split('/').pop()}</span> <ArrowUpRight className="flip-rtl size-3.5" />
                </a>
              )}
            </li>
          ))}
        </ol>
      </details>
    </section>
  );
}

function SkillExplorer({ data }: { data: SiteData }) {
  const t = useTranslations();
  const ta = useTranslations('atlas');
  const [q, setQ] = useState('');
  const [dom, setDom] = useState<string | null>(null);
  const all = useMemo(() => data.domains.flatMap((d) => d.items.map((i) => ({ ...i, d }))), [data.domains]);
  const res = all.filter((i) => (!dom || i.d.id === dom) && (!q || `${i.name} ${i.long}`.toLowerCase().includes(q.toLowerCase())));
  return (
    <section id="skills" className="scroll-mt-20">
      <SectionTitle kicker={t('sections.skills.kicker')} title={ta('explorerTitle')} sub={ta('explorerSub', { count: all.length })} />
      <div className="mb-6 flex flex-wrap items-center gap-3">
        <label className="flex min-w-[260px] flex-1 items-center gap-2 rounded-full border border-[#e7e9f2] bg-white px-4 py-3 focus-within:border-[#3b5bfd]">
          <Search className="size-4 text-[#8c93ad]" />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder={ta('search')} className="w-full bg-transparent text-[15px] outline-none placeholder:text-[#8c93ad]" />
        </label>
        <span className="font-mono text-xs text-[#8c93ad]">{ta('results', { count: res.length })}</span>
      </div>
      <div className="mb-6 flex flex-wrap gap-2">
        {data.domains.map((d) => (
          <button
            key={d.id}
            type="button"
            onClick={() => setDom(dom === d.id ? null : d.id)}
            aria-pressed={dom === d.id}
            className={cn('inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs transition', dom === d.id ? 'text-white' : 'border-[#e7e9f2] bg-white text-[#2c3150]')}
            style={dom === d.id ? { background: domainColor(d.hue), borderColor: domainColor(d.hue) } : undefined}
          >
            <span className="size-2 rounded-full" style={{ background: dom === d.id ? '#fff' : domainColor(d.hue) }} />
            {t(`domains.${d.id}`)}
            <span className="font-mono opacity-60">{fmtNum(data.locale, d.count)}</span>
          </button>
        ))}
      </div>
      <motion.ul layout className="flex flex-wrap gap-2">
        {res.map((i) => (
          <motion.li layout key={i.d.id + i.key} initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="rounded-xl border border-[#e7e9f2] bg-white px-3 py-2 text-sm text-[#0f1222]" title={i.long}>
            <span className="me-2 inline-block size-2 rounded-full" style={{ background: domainColor(i.d.hue) }} />
            <bdi>{i.name}</bdi>
          </motion.li>
        ))}
      </motion.ul>
      <p className="mb-3 mt-10 font-mono text-[11px] uppercase tracking-[0.2em] text-[#8c93ad] rtl:tracking-normal">{t('common.softSkills')}</p>
      <ul className="flex flex-wrap gap-2">
        {data.softSkills.map((s) => (
          <li key={s.key} className="rounded-xl border border-dashed border-[#d5d9e8] px-3 py-2 text-sm text-[#2c3150]">
            {s.name}
          </li>
        ))}
      </ul>
      <Courses data={data} />
    </section>
  );
}

/** Courses and training: hours per year (real CV data) and the complete list. */
function Courses({ data }: { data: SiteData }) {
  const t = useTranslations();
  const ta = useTranslations('atlas');
  const loc = data.locale;
  const rtl = data.dir === 'rtl';
  const years = courseHoursByYear(data);
  const max = Math.max(...years.map((y) => y.hours), 1);
  return (
    <div className="mt-16">
      <h3 className="text-2xl font-bold tracking-tight text-[#0f1222]">{ta('coursesTitle')}</h3>
      <p className="mt-2 text-[#5a6077]">{ta('coursesSub', { count: data.certStats.count, hours: data.certStats.hours })}</p>
      <div className="mt-6 rounded-[2rem] border border-[#e7e9f2] bg-white p-6">
        <ul className="space-y-2" aria-label={ta('coursesTitle')}>
          {years.map((y) => (
            <li key={y.year} className="grid grid-cols-[3.5rem_minmax(0,1fr)_7rem] items-center gap-3 text-sm">
              <span className="font-mono text-xs text-[#5a6077]">{fmtYear(loc, y.year)}</span>
              <span className="h-3 overflow-hidden rounded-full bg-[#f4f5fa]">
                <motion.span
                  className={cn('block h-full rounded-full bg-[#3b5bfd]', rtl && 'ms-auto')}
                  initial={{ width: 0 }}
                  whileInView={{ width: `${(y.hours / max) * 100}%` }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.9 }}
                />
              </span>
              <span className="text-end font-mono text-xs text-[#5a6077]">
                {t('common.count.courses', { count: y.count })}
                {dot(loc)}
                {t('common.hours', { count: fmtNum(loc, y.hours) })}
              </span>
            </li>
          ))}
        </ul>
        <details className="atlas-details mt-6 border-t border-[#f1f2f7] pt-4">
          <summary className="cursor-pointer list-none text-sm font-semibold text-[#0f1222] [&::-webkit-details-marker]:hidden">{ta('allCourses', { count: data.certifications.length })}</summary>
          <ol className="mt-3 grid gap-x-8 gap-y-2 text-sm md:grid-cols-2">
            {data.certifications.map((c) => (
              <li key={c.name + c.issuer} className="border-b border-[#f4f5fa] pb-2">
                <span lang="en" dir="ltr" className="font-medium text-[#0f1222]">
                  {c.url ? (
                    <a href={c.url} target="_blank" rel="noreferrer" className="hover:underline">
                      {c.name}
                    </a>
                  ) : (
                    c.name
                  )}
                </span>
                <span className="block text-xs text-[#5a6077]">
                  <bdi>{c.issuer}</bdi>
                  {c.year ? dot(loc) + fmtYear(loc, c.year) : null}
                  {c.hours ? dot(loc) + t('common.hours', { count: fmtNum(loc, c.hours) }) : null}
                </span>
              </li>
            ))}
          </ol>
        </details>
      </div>
    </div>
  );
}

function PubsAndLanguages({ data }: { data: SiteData }) {
  const t = useTranslations();
  const ta = useTranslations('atlas');
  const en = data.languages.find((l) => l.cert);
  const axes = en?.cert ? (['reading', 'listening', 'speaking', 'writing'] as const) : [];
  const R = 110;
  const pt = (i: number, v: number) => {
    const a = -Math.PI / 2 + (i / axes.length) * Math.PI * 2;
    return [150 + Math.cos(a) * (v / 9) * R, 150 + Math.sin(a) * (v / 9) * R] as const;
  };
  return (
    <section id="publications" className="scroll-mt-20 grid gap-14 lg:grid-cols-[minmax(0,7fr)_minmax(0,5fr)]">
      <div>
        <SectionTitle kicker={t('sections.publications.kicker')} title={t('sections.publications.title')} />
        <ol className="space-y-4">
          {data.publications.map((p, i) => (
            <Reveal key={p.id} delay={i * 0.04}>
              <li className="rounded-2xl border border-[#e7e9f2] bg-white p-5">
                <p className="mb-2 flex flex-wrap items-center gap-2 text-xs">
                  <span className="rounded-full px-2 py-0.5 text-white" style={{ background: p.status === 'Published' ? '#10b39b' : p.status === 'Submitted' ? '#3b5bfd' : '#8c93ad' }}>
                    {publicationLabel(t, 'pubStatus', p.status)}
                  </span>
                  <span className="text-[#5a6077]">{publicationLabel(t, 'pubType', p.type)}</span>
                  {p.year && <span className="font-mono text-[#8c93ad]">{fmtYear(data.locale, p.year)}</span>}
                  {p.firstAuthor && <span className="text-[#f2683c]">· {t('common.firstAuthor')}</span>}
                </p>
                <p lang="en" dir="ltr" className="font-semibold leading-snug text-[#0f1222]">
                  {p.title}
                </p>
                {p.venue && (
                  <p lang="en" dir="ltr" className="mt-1 text-sm italic text-[#5a6077]">
                    {p.venue}
                  </p>
                )}
                {p.url && (
                  <a href={p.url} target="_blank" rel="noreferrer" className="mt-3 inline-flex items-center gap-1 text-sm font-medium text-[#3b5bfd] hover:underline">
                    DOI {p.doi} <ArrowUpRight className="size-3.5" />
                  </a>
                )}
              </li>
            </Reveal>
          ))}
        </ol>
      </div>
      <div>
        <SectionTitle kicker={t('sections.languages.title')} title={ta('radarTitle')} />
        {en?.cert && (
          <Reveal className="rounded-[2rem] border border-[#e7e9f2] bg-white p-6">
            <svg viewBox="-40 -10 380 320" className="mx-auto w-full max-w-[360px]">
              {[3, 6, 9].map((v) => (
                <polygon key={v} points={axes.map((_, i) => pt(i, v).join(',')).join(' ')} fill="none" stroke="#e7e9f2" />
              ))}
              {axes.map((k, i) => {
                const [x, y] = pt(i, 12.2);
                return (
                  <text key={k} x={x} y={y} textAnchor="middle" dominantBaseline="middle" fontSize={11} fill="#5a6077">
                    {t(`ielts.${k}`)} {fmtNum(data.locale, en.cert!.bands[k], { minimumFractionDigits: 1 })}
                  </text>
                );
              })}
              <motion.polygon
                points={axes.map((k, i) => pt(i, en.cert!.bands[k]).join(',')).join(' ')}
                fill="#3b5bfd"
                fillOpacity={0.18}
                stroke="#3b5bfd"
                strokeWidth={2}
                initial={{ scale: 0 }}
                whileInView={{ scale: 1 }}
                viewport={{ once: true }}
                transition={{ type: 'spring', stiffness: 120, damping: 14 }}
                style={{ transformOrigin: '150px 150px' }}
              />
              <text x={150} y={156} textAnchor="middle" fontSize={26} fontWeight={700} fill="#0f1222">
                {fmtNum(data.locale, en.cert.overall, { minimumFractionDigits: 1 })}
              </text>
            </svg>
            <ul className="mt-4 space-y-2 text-sm">
              {data.languages.map((l) => (
                <li key={l.id} className="flex justify-between border-t border-[#f1f2f7] pt-2">
                  <span className="font-medium text-[#0f1222]">{l.name}</span>
                  <span className="text-[#5a6077]">{l.level}</span>
                </li>
              ))}
            </ul>
          </Reveal>
        )}
        <div className="mt-10 space-y-3">
          {data.education.map((e) => (
            <Reveal key={e.id} className="rounded-2xl border border-[#e7e9f2] bg-white p-5">
              <p className="font-mono text-xs text-[#3b5bfd]">{e.period}</p>
              <p className="mt-1 font-semibold text-[#0f1222]">{e.degree}</p>
              <p className="text-sm text-[#5a6077]">
                {e.institution}
                {e.gpa && (
                  <>
                    {' '}
                    · {t('common.gpa')} <span dir="ltr">{e.gpa}</span>
                  </>
                )}
              </p>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

function Contact({ data }: { data: SiteData }) {
  const t = useTranslations();
  return (
    <section id="contact" className="scroll-mt-20 overflow-hidden rounded-[2.5rem] bg-[#0f1222] px-6 py-20 text-center text-white sm:px-12">
      <Reveal>
        <p className="font-mono text-[11px] uppercase tracking-[0.25em] text-[#8ea2ff]">{t('sections.contact.kicker')}</p>
        <h2 className="mx-auto mt-4 max-w-3xl text-4xl font-bold tracking-[-0.03em] sm:text-6xl">{t('sections.contact.title')}</h2>
        <p className="mx-auto mt-5 max-w-2xl text-lg text-white/70">{data.person.availability}</p>
        <a href={data.links.email} className="mt-10 inline-flex items-center gap-3 rounded-full bg-white px-7 py-4 text-base font-semibold text-[#0f1222] transition hover:scale-[1.02]">
          <Mail className="size-5" /> <span dir="ltr">{data.person.email}</span>
        </a>
        <div className="mt-8 flex justify-center gap-3">
          {(['github', 'linkedin', 'orcid', 'scholar'] as const).map((k) =>
            data.links[k] ? (
              <a key={k} href={data.links[k]!} target="_blank" rel="noreferrer" className="grid size-11 place-items-center rounded-full border border-white/15 text-white/80 transition hover:bg-white hover:text-[#0f1222]" aria-label={k}>
                <BrandIcon name={k} className="size-5" />
              </a>
            ) : null,
          )}
        </div>
        <p className="mt-14 text-xs text-white/40">
          {t('common.rights', { year: fmtYear(data.locale, new Date(data.generatedAt).getFullYear()) })} · {t('common.builtWith')}
        </p>
      </Reveal>
    </section>
  );
}
