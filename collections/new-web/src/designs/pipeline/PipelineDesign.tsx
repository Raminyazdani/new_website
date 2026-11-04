'use client';

import { useEffect, useRef, useState, type ReactNode } from 'react';
import { motion } from 'motion/react';
import { BrainCircuit, Code2, Dna, FileCode2, FileText, FlaskConical, Folder, GitBranch, Lightbulb, Microscope, Terminal as TerminalIcon } from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';
import { AnimatedBeam } from '@/components/magicui/animated-beam';
import { HyperText } from '@/components/magicui/hyper-text';
import { AnimatedSpan, Terminal, TypingAnimation } from '@/components/magicui/terminal';
import LetterGlitch from '@/components/reactbits/LetterGlitch';
import { BrandIcon } from '@/components/shared/BrandIcon';
import { InView } from '@/components/shared/InView';
import { useLocaleSwitch } from '@/components/shared/useLocaleSwitch';
import { fmtYear } from '@/lib/format';
import type { SiteData } from '@/lib/types';
import { cn } from '@/lib/utils';
import { Bib, Education, GitLog, Repos, SkillsYaml } from './PipelineSections';
import { Shell } from './Shell';
import './pipeline.css';

export const FILES = [
  { id: 'readme', file: 'README.md', icon: FileText },
  { id: 'workflow', file: 'workflow.nf', icon: GitBranch },
  { id: 'experience', file: 'experience.log', icon: FileCode2 },
  { id: 'projects', file: 'projects/', icon: Folder },
  { id: 'skills', file: 'skills.yml', icon: FileCode2 },
  { id: 'publications', file: 'publications.bib', icon: FileText },
  { id: 'education', file: 'education/', icon: Folder },
  { id: 'contact', file: 'contact.sh', icon: TerminalIcon },
] as const;

/** An editor pane with a tab-like header and (optional) line-number gutter. */
export function Pane({ id, file, children, className, actions }: { id: string; file: string; children: ReactNode; className?: string; actions?: ReactNode }) {
  return (
    <section id={id} className={cn('pl-pane scroll-mt-24', className)}>
      <header className="flex items-center justify-between border-b border-[#222a35] bg-[#0f141b] px-4 py-2">
        <span className="flex items-center gap-2 font-mono text-[12px] text-[#c9d6e3]" dir="ltr">
          <span className="size-2 rounded-full bg-[#7ee787]" />
          {file}
        </span>
        {actions}
      </header>
      <div className="p-4 sm:p-6">{children}</div>
    </section>
  );
}

function Readme({ data }: { data: SiteData }) {
  const t = useTranslations();
  const b = (k: string, v: string, color: string) => (
    <span className="inline-flex overflow-hidden rounded text-[11px] font-medium">
      <span className="bg-[#30363d] px-2 py-0.5 text-[#c9d6e3]">{k}</span>
      <span className="px-2 py-0.5 text-[#0b0f14]" style={{ background: color }}>
        {v}
      </span>
    </span>
  );
  return (
    <Pane id="readme" file="README.md">
      <div className="space-y-5">
        <div className="flex flex-wrap gap-2 font-mono">
          {b(t('pipeline.readmeBadges.status'), t('pipeline.readmeBadges.open'), '#7ee787')}
          {b(t('pipeline.readmeBadges.location'), data.person.location, '#79c0ff')}
          {b(t('pipeline.readmeBadges.degree'), data.education.find((e) => e.current)?.institution ?? '', '#d2a8ff')}
          {b(t('pipeline.readmeBadges.langs'), 'EN · DE · FA', '#ffa657')}
        </div>
        <h2 className="text-2xl font-bold text-white">
          <span className="text-[#5c6773]">#</span> {data.person.displayName}
        </h2>
        <blockquote className="border-s-4 border-[#30363d] ps-4 text-[#8b98a8]">{data.person.tagline}</blockquote>
        {data.person.about.map((p, i) => (
          <p key={i} className="pl-prose">
            {p}
          </p>
        ))}
        <h3 className="pt-2 text-lg font-bold text-white">
          <span className="text-[#5c6773]">##</span> {t('sections.now.title')}
        </h3>
        <ul className="space-y-1.5">
          {data.current.map((e) => (
            <li key={e.id} className="pl-prose flex gap-2">
              <span className="text-[#7ee787]">- [x]</span>
              <span>
                <span className="text-white">{e.role}</span> <span className="text-[#5c6773]">@</span> {e.org}
              </span>
            </li>
          ))}
        </ul>
      </div>
    </Pane>
  );
}

const DAG_NODES = [
  { id: 'input', icon: Lightbulb, color: '#e3b341' },
  { id: 'wetlab', icon: FlaskConical, color: '#7ee787' },
  { id: 'omics', icon: Dna, color: '#56d4dd' },
  { id: 'models', icon: BrainCircuit, color: '#d2a8ff' },
  { id: 'software', icon: Code2, color: '#79c0ff' },
  { id: 'output', icon: Microscope, color: '#ffa657' },
] as const;

function Dag() {
  const t = useTranslations('pipeline');
  const container = useRef<HTMLDivElement>(null);
  const refs = useRef<Array<HTMLDivElement | null>>([]);
  const [ready, setReady] = useState(false);
  useEffect(() => setReady(true), []);
  const node = (i: number) => {
    const n = DAG_NODES[i];
    const Icon = n.icon;
    return (
      <div
        ref={(el) => {
          refs.current[i] = el;
        }}
        className="relative z-10 flex w-36 flex-col items-center gap-2 rounded-xl border border-[#222a35] bg-[#0f141b] p-3 text-center shadow-[0_0_0_4px_#0b0f14]"
      >
        <span className="grid size-10 place-items-center rounded-lg" style={{ background: `${n.color}1a`, color: n.color }}>
          <Icon className="size-5" />
        </span>
        <span className="text-[12px] leading-tight text-[#c9d6e3]">{t(`dag.${n.id}`)}</span>
        <span className="font-mono text-[10px] text-[#5c6773]" dir="ltr">
          {n.id.toUpperCase()}
        </span>
      </div>
    );
  };
  const edges: Array<[number, number, number]> = [
    [0, 1, 0],
    [0, 2, 0.4],
    [1, 2, 0.8],
    [2, 3, 1.2],
    [1, 3, 1.6],
    [3, 4, 2],
    [2, 4, 2.4],
    [4, 5, 2.8],
    [3, 5, 3.2],
  ];
  return (
    <Pane id="workflow" file="workflow.nf">
      <p className="mb-6 font-mono text-[12px] text-[#5c6773]">{`// ${t('dagTitle')}`}</p>
      <div ref={container} className="relative grid grid-cols-2 place-items-center gap-y-10 py-4 sm:grid-cols-3 lg:flex lg:justify-between" dir="ltr">
        <div className="lg:mt-0">{node(0)}</div>
        <div className="flex flex-col gap-10 lg:gap-16">
          {node(1)}
          {node(2)}
        </div>
        <div className="flex flex-col gap-10 lg:gap-16">
          {node(3)}
          {node(4)}
        </div>
        <div>{node(5)}</div>
        {ready &&
          edges.map(([a, b, d], i) => (
            <AnimatedBeam
              key={i}
              containerRef={container}
              fromRef={{ current: refs.current[a] }}
              toRef={{ current: refs.current[b] }}
              curvature={a === b ? 0 : (i % 2 ? -1 : 1) * 24}
              pathColor="#30363d"
              pathWidth={1.5}
              pathOpacity={0.9}
              gradientStartColor={DAG_NODES[a].color}
              gradientStopColor={DAG_NODES[b].color}
              delay={d}
              duration={4}
            />
          ))}
      </div>
    </Pane>
  );
}

function Hero({ data }: { data: SiteData }) {
  const t = useTranslations('pipeline');
  const fa = data.locale === 'fa';
  const stamp = new Date(data.generatedAt);
  const dd = `${String(stamp.getDate()).padStart(2, '0')}-${stamp.toLocaleString('en', { month: 'short' })}-${stamp.getFullYear()}`;
  const proc = [
    ['a1/3f9c2e', 'FASTQC', 'wet_lab'],
    ['b7/00e1d4', 'ALIGN', 'biotechnology'],
    ['c3/9a8b71', 'QUANT', 'single_cell'],
    ['d4/77f2aa', 'MODEL', 'machine_learning'],
    ['e5/1c0d3b', 'BUILD', 'software'],
    ['f6/5b2e90', 'REPORT', 'portfolio'],
  ];
  return (
    <section id="top" className="relative isolate overflow-hidden border-b border-[#222a35]">
      <InView className="absolute inset-0 -z-10 opacity-[0.38]" keepMounted>
        <LetterGlitch
          characters="ACGTACGTUN0123456789"
          glitchColors={['#1f6f45', '#2f5d8c', '#6e40c9']}
          baseColor="#101820"
          backgroundColor="#0b0f14"
          fontSize={14}
          density={0.9}
          glitchAmount={0.04}
          speed={0.4}
          centerFade={0.6}
          edgeFade={0.2}
          interactive={false}
        />
      </InView>
      <div className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_60%_60%_at_30%_40%,rgba(11,15,20,0.2),#0b0f14_80%)]" />
      <div className="mx-auto grid max-w-[1400px] grid-cols-[minmax(0,1fr)] items-center gap-12 px-5 pb-20 pt-28 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,1fr)] lg:px-10">
        <div>
          <p className="mb-6 font-mono text-[13px] text-[#7ee787]" dir="ltr">
            portfolio@workspace <span className="text-[#79c0ff]">~/portfolio</span> <span className="text-[#5c6773]">(main)</span>
          </p>
          <h1 className="text-[clamp(2.8rem,7.5vw,6rem)] font-extrabold leading-[0.95] tracking-tight text-white">
            {fa ? (
              <motion.span initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8 }} className="inline-flex items-end">
                {data.person.displayName}
                <span className="ms-3 mb-[0.12em] inline-block h-[0.75em] w-[0.4em] animate-blink bg-[#7ee787]" aria-hidden />
              </motion.span>
            ) : (
              data.person.fullName.split(' ').map((w, i, arr) => (
                <span key={w} className="flex items-end">
                  <HyperText as="span" className="block py-0 text-[1em] font-extrabold leading-[0.95] text-white" duration={900} delay={i * 250} startOnView>
                    {w}
                  </HyperText>
                  {i === arr.length - 1 && <span className="mb-[0.1em] ms-3 inline-block h-[0.72em] w-[0.42em] animate-blink bg-[#7ee787]" aria-hidden />}
                </span>
              ))
            )}
          </h1>
          <p className="mt-6 font-mono text-[13px] text-[#8b98a8]">
            {data.person.labels.map((l, i) => (
              <span key={l}>
                <span className="text-[#d2a8ff]">{l}</span>
                {i < data.person.labels.length - 1 && <span className="mx-2 text-[#5c6773]">|</span>}
              </span>
            ))}
          </p>
          <p className="pl-prose mt-6 max-w-xl text-[15px] text-[#aab7c4]">{data.person.intro}</p>
          <div className="mt-8 flex flex-wrap gap-3 font-mono text-[13px]">
            <a href="#projects" className="rounded-md bg-[#238636] px-4 py-2.5 font-semibold text-white transition hover:bg-[#2ea043]">
              <span dir="ltr">$ ls projects/</span>
            </a>
            <a href="#contact" className="rounded-md border border-[#30363d] bg-[#161b22] px-4 py-2.5 text-[#c9d6e3] transition hover:border-[#8b98a8]">
              <span dir="ltr">$ ./contact.sh</span>
            </a>
            {data.links.github && (
              <a href={data.links.github} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 rounded-md border border-[#30363d] px-4 py-2.5 text-[#c9d6e3] transition hover:border-[#8b98a8]">
                <BrandIcon name="github" className="size-4" /> GitHub
              </a>
            )}
          </div>
        </div>

        <div dir="ltr" lang="en">
          <Terminal className="max-h-none max-w-none border-[#30363d] bg-[#0d1117]/95 shadow-[0_30px_80px_-30px_rgba(0,0,0,0.8)] backdrop-blur">
            <TypingAnimation className="text-[#c9d6e3]" duration={28}>{`$ nextflow run portfolio -profile docker --lang ${data.locale}`}</TypingAnimation>
            <AnimatedSpan className="text-[#5c6773]">{t('bootComment')}</AnimatedSpan>
            <AnimatedSpan className="text-[#79c0ff]">N E X T F L O W ~ reproducible run</AnimatedSpan>
            <AnimatedSpan className="text-[#8b98a8]">executor &gt; local (6)</AnimatedSpan>
            {proc.map(([h, p, tag]) => (
              <AnimatedSpan key={h} className="text-[12.5px] text-[#c9d6e3]">
                <span>
                  <span className="text-[#5c6773]">[{h}]</span> process &gt; <span className="text-[#d2a8ff]">{p}</span> <span className="text-[#ffa657]">({tag})</span>
                  <span className="text-[#5c6773]"> [100%] 1 of 1 </span>
                  <span className="text-[#7ee787]">✔</span>
                </span>
              </AnimatedSpan>
            ))}
            <AnimatedSpan className="text-[#7ee787]">
              Completed at: {dd} · Succeeded: 6 · since {fmtYear('en', 2017)}
            </AnimatedSpan>
            <TypingAnimation className="text-[#e3b341]" duration={22}>
              {`→ ${data.stats.find((s) => s.id === 'repos')?.value ?? 0} repos · ${data.stats.find((s) => s.id === 'courses')?.value ?? 0} courses · ${data.publications.length} publications`}
            </TypingAnimation>
          </Terminal>
        </div>
      </div>
    </section>
  );
}

function StatusBar({ data }: { data: SiteData }) {
  const t = useTranslations('pipeline');
  const locale = useLocale();
  const [time, setTime] = useState('');
  useEffect(() => {
    const fmt = new Intl.DateTimeFormat(locale === 'fa' ? 'fa-IR' : locale, { hour: '2-digit', minute: '2-digit', timeZone: 'Europe/Berlin' });
    const tick = () => setTime(fmt.format(new Date()));
    tick();
    const id = window.setInterval(tick, 15000);
    return () => window.clearInterval(id);
  }, [locale]);
  return (
    <footer className="sticky bottom-0 z-40 flex h-7 items-center justify-between gap-4 border-t border-[#1f6feb]/40 bg-[#0d1117] px-3 font-mono text-[11px] text-[#8b98a8]">
      <span className="flex items-center gap-3">
        <span className="flex items-center gap-1 text-[#79c0ff]">
          <GitBranch className="size-3.5" /> main
        </span>
        <span className="text-[#7ee787]">✔ {t('statusErrors')}</span>
      </span>
      <span className="hidden items-center gap-4 sm:flex" dir="ltr">
        <span>UTF-8</span>
        <span>LF</span>
        <span>{data.locale}</span>
        <span>
          {t('statusTime')} {time}
        </span>
      </span>
    </footer>
  );
}

function Sidebar({ active }: { active: string }) {
  const t = useTranslations('pipeline');
  return (
    <aside className="sticky top-12 hidden h-[calc(100dvh-3rem)] w-60 shrink-0 overflow-y-auto border-e border-[#222a35] bg-[#0d1117] py-4 xl:block">
      <p className="mb-2 px-4 text-[11px] font-semibold uppercase tracking-[0.15em] text-[#5c6773]">{t('explorer')}</p>
      <p className="mb-1 flex items-center gap-1.5 px-4 font-mono text-[12px] text-[#c9d6e3]">
        <Folder className="size-3.5 text-[#79c0ff]" /> portfolio/
      </p>
      <ul className="font-mono text-[12.5px]">
        {FILES.map(({ id, file, icon: Icon }) => (
          <li key={id}>
            <a
              href={`#${id}`}
              className={cn(
                'flex items-center gap-2 py-1 pe-3 ps-8 transition',
                active === id ? 'bg-[#1f6feb]/15 text-white shadow-[inset_2px_0_0_#1f6feb] rtl:shadow-[inset_-2px_0_0_#1f6feb]' : 'text-[#8b98a8] hover:bg-white/[0.03] hover:text-[#c9d6e3]',
              )}
              dir="ltr"
            >
              <Icon className="size-3.5 shrink-0" />
              {file}
            </a>
          </li>
        ))}
      </ul>
    </aside>
  );
}

function TopBar({ data, active }: { data: SiteData; active: string }) {
  const { locale, locales, switchTo } = useLocaleSwitch();
  return (
    <div className="sticky top-0 z-50 border-b border-[#222a35] bg-[#0b0f14]/90 backdrop-blur">
      <div className="flex h-12 items-center gap-3 px-3">
        <span className="hidden gap-1.5 sm:flex" aria-hidden>
          <span className="size-3 rounded-full bg-[#ff5f57]" />
          <span className="size-3 rounded-full bg-[#febc2e]" />
          <span className="size-3 rounded-full bg-[#28c840]" />
        </span>
        <nav className="no-scrollbar flex flex-1 items-center overflow-x-auto" dir="ltr">
          {FILES.map(({ id, file, icon: Icon }) => (
            <a
              key={id}
              href={`#${id}`}
              className={cn(
                'flex h-12 shrink-0 items-center gap-1.5 border-b-2 px-3 font-mono text-[12px] transition',
                active === id ? 'border-[#f78166] text-white' : 'border-transparent text-[#8b98a8] hover:text-[#c9d6e3]',
              )}
            >
              <Icon className="size-3.5" />
              {file}
            </a>
          ))}
        </nav>
        <div className="flex shrink-0 items-center gap-1 rounded-md border border-[#30363d] bg-[#161b22] p-0.5 font-mono text-[11px]" role="group" aria-label="Language">
          <GitBranch className="mx-1 size-3.5 text-[#8b98a8]" />
          {locales.map((l) => (
            <button
              key={l.code}
              type="button"
              lang={l.code}
              aria-pressed={l.code === locale}
              onClick={() => switchTo(l.code)}
              className={cn('rounded px-2 py-1 transition', l.code === locale ? 'bg-[#1f6feb] text-white' : 'text-[#8b98a8] hover:text-white')}
            >
              {l.code}
            </button>
          ))}
        </div>
      </div>
      <span className="sr-only">{data.person.fullName}</span>
    </div>
  );
}

/** Design 3 — Pipeline: an IDE/terminal portfolio where the CV runs like a bioinformatics workflow. */
export default function PipelineDesign({ data }: { data: SiteData }) {
  const [active, setActive] = useState('readme');
  useEffect(() => {
    const io = new IntersectionObserver((es) => es.forEach((e) => e.isIntersecting && setActive(e.target.id)), { rootMargin: '-30% 0px -60% 0px' });
    FILES.forEach(({ id }) => {
      const el = document.getElementById(id);
      if (el) io.observe(el);
    });
    return () => io.disconnect();
  }, []);

  return (
    <div className="pipeline min-h-dvh">
      <TopBar data={data} active={active} />
      <Hero data={data} />
      <div className="flex">
        <Sidebar active={active} />
        <main className="min-w-0 flex-1 space-y-8 px-3 py-10 sm:px-6 lg:px-10">
          <div className="mx-auto max-w-[1100px] space-y-8">
            <Readme data={data} />
            <Dag />
            <GitLog data={data} />
            <Repos data={data} />
            <SkillsYaml data={data} />
            <Bib data={data} />
            <Education data={data} />
            <Shell data={data} />
          </div>
          <div className="h-16" aria-hidden />
        </main>
      </div>
      <StatusBar data={data} />
    </div>
  );
}
