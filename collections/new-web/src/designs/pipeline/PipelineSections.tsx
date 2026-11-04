'use client';

import { useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { ArrowUpRight, Award, Check, Copy, Search } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { CopyButton } from '@/components/shared/CopyButton';
import { fmtNum, fmtYear, publicationLabel } from '@/lib/format';
import type { ExperienceKind, ProjectCategory, SiteData } from '@/lib/types';
import { cn } from '@/lib/utils';
import { Pane } from './PipelineDesign';

const LANES: ExperienceKind[] = ['research', 'teaching', 'industry', 'business'];
const LANE_COLOR: Record<ExperienceKind, string> = { research: '#7ee787', teaching: '#79c0ff', industry: '#ffa657', business: '#d2a8ff' };
const LANG_COLOR: Record<string, string> = { R: '#198ce7', Python: '#3572A5', PyMOL: '#3572A5', PyTorch: '#ee4c2c', React: '#61dafb', Flask: '#c9d6e3', Django: '#0c4b33' };
const CAT_COLOR: Record<ProjectCategory, string> = { omics: '#56d4dd', structural: '#d2a8ff', ml: '#ff7b72', software: '#79c0ff', biotech: '#7ee787' };

/** Short deterministic "commit hash" from an id. */
const hash7 = (s: string) => {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 16777619);
  return (h >>> 0).toString(16).padStart(8, '0').slice(0, 7);
};

/* ------------------------------------------------------------- git log */

export function GitLog({ data }: { data: SiteData }) {
  const t = useTranslations();
  const items = data.experiences;
  const first = (k: ExperienceKind) => items.findIndex((e) => e.kind === k);
  const last = (k: ExperienceKind) => items.length - 1 - [...items].reverse().findIndex((e) => e.kind === k);
  const lane = (k: ExperienceKind) => LANES.indexOf(k);
  const LW = 18;

  return (
    <Pane
      id="experience"
      file="experience.log"
      actions={
        <span className="hidden gap-3 font-mono text-[11px] sm:flex">
          {LANES.map((k) => (
            <span key={k} className="flex items-center gap-1" style={{ color: LANE_COLOR[k] }}>
              <span className="size-2 rounded-full" style={{ background: LANE_COLOR[k] }} /> {t(`kinds.${k}`)}
            </span>
          ))}
        </span>
      }
    >
      <p className="mb-5 font-mono text-[12px] text-[#5c6773]" dir="ltr">
        $ git log --graph --decorate --all <span className="text-[#3d4652]"># {t('pipeline.gitHint')}</span>
      </p>
      <ol dir="ltr" className="font-mono text-[13px]">
        {items.map((e, i) => (
          <motion.li
            key={e.id}
            initial={{ opacity: 0, x: -12 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, amount: 0.4 }}
            transition={{ duration: 0.45, delay: Math.min(i * 0.03, 0.3) }}
            className="relative flex"
          >
            {/* graph lanes */}
            <svg width={LW * LANES.length} className="shrink-0 overflow-visible" aria-hidden style={{ height: '100%', position: 'absolute', insetBlock: 0, left: 0 }}>
              {LANES.map((k, li) =>
                i >= first(k) && i <= last(k) ? (
                  <line key={k} x1={li * LW + 7} x2={li * LW + 7} y1={i === first(k) ? 12 : 0} y2={i === last(k) ? 12 : '100%'} stroke={LANE_COLOR[k]} strokeOpacity={0.55} strokeWidth={2} />
                ) : null,
              )}
              <circle cx={lane(e.kind) * LW + 7} cy={12} r={5} fill="#0b0f14" stroke={LANE_COLOR[e.kind]} strokeWidth={2.5} />
              {e.current && <circle cx={lane(e.kind) * LW + 7} cy={12} r={2} fill={LANE_COLOR[e.kind]} />}
            </svg>
            <div className="min-w-0 flex-1 pb-6" style={{ paddingLeft: LW * LANES.length + 8 }}>
              <p className="leading-6">
                <span className="text-[#e3b341]">{hash7(e.id)}</span>{' '}
                {i === 0 && (
                  <span className="text-[#56d4dd]">
                    (<span className="font-bold">HEAD -&gt; main</span>){' '}
                  </span>
                )}
                {e.current && <span className="text-[#ffa657]">(tag: current) </span>}
                <bdi className="font-semibold text-white">{e.role}</bdi>
              </p>
              <p className="text-[12px] text-[#8b98a8]">
                <span className="text-[#5c6773]">Author:</span> <bdi>{e.org}</bdi>
                {e.location && (
                  <>
                    {' '}
                    · <bdi>{e.location}</bdi>
                  </>
                )}
              </p>
              <p className="text-[12px] text-[#8b98a8]">
                <span className="text-[#5c6773]">Date:</span> <bdi>{e.period}</bdi>
              </p>
              <p dir={data.dir} className="pl-prose mt-2 max-w-3xl font-sans text-[14px] text-[#aab7c4]" lang={data.locale}>
                {e.description}
              </p>
            </div>
          </motion.li>
        ))}
      </ol>
    </Pane>
  );
}

/* --------------------------------------------------------------- repos */

export function Repos({ data }: { data: SiteData }) {
  const t = useTranslations();
  const [q, setQ] = useState('');
  const [cat, setCat] = useState<ProjectCategory | 'all'>('all');
  const list = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return data.projects.filter(
      (p) =>
        (cat === 'all' || p.category === cat) &&
        (!needle || [p.title, p.description, p.repo ?? '', ...p.tags].join(' ').toLowerCase().includes(needle)),
    );
  }, [data.projects, q, cat]);

  return (
    <Pane id="projects" file="projects/">
      <div className="mb-5 flex flex-wrap items-center gap-3">
        <label className="flex min-w-[240px] flex-1 items-center gap-2 rounded-md border border-[#30363d] bg-[#0d1117] px-3 py-2 focus-within:border-[#1f6feb]">
          <Search className="size-4 text-[#5c6773]" />
          <span className="font-mono text-[12px] text-[#7ee787]" dir="ltr">
            grep -i
          </span>
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder={t('pipeline.grep')}
            className="w-full bg-transparent font-mono text-[13px] text-white outline-none placeholder:text-[#5c6773]"
          />
        </label>
        <div className="flex flex-wrap gap-1.5 font-mono text-[12px]" dir="ltr">
          {(['all', 'omics', 'structural', 'ml', 'software', 'biotech'] as const).map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => setCat(c)}
              aria-pressed={cat === c}
              className={cn('rounded-md border px-2.5 py-1.5 transition', cat === c ? 'border-[#1f6feb] bg-[#1f6feb]/15 text-white' : 'border-[#30363d] text-[#8b98a8] hover:text-white')}
            >
              --{c}
            </button>
          ))}
        </div>
        <span className="font-mono text-[12px] text-[#5c6773]">{t('pipeline.matches', { count: list.length })}</span>
      </div>

      {list.length === 0 && <p className="py-10 text-center font-mono text-sm text-[#8b98a8]">{t('pipeline.noResults')}</p>}
      <motion.ul layout className="grid gap-3 md:grid-cols-2">
        <AnimatePresence mode="popLayout">
          {list.map((p) => {
            const lang = p.tags.find((x) => LANG_COLOR[x]) ?? p.tags[0];
            return (
              <motion.li
                key={p.id}
                layout
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.96 }}
                transition={{ duration: 0.25 }}
                className="group flex flex-col rounded-lg border border-[#30363d] bg-[#0d1117] p-4 transition hover:border-[#8b98a8]"
              >
                <div className="flex items-start justify-between gap-3">
                  <p className="font-mono text-[13px]" dir="ltr">
                    {p.repo ? (
                      <a href={p.url!} target="_blank" rel="noreferrer" className="font-semibold text-[#58a6ff] hover:underline">
                        {p.repo.split('/')[1]}
                      </a>
                    ) : (
                      <span className="font-semibold text-[#c9d6e3]">{p.id}</span>
                    )}
                  </p>
                  <span className="shrink-0 rounded-full border border-[#30363d] px-2 py-0.5 font-mono text-[10px] text-[#8b98a8]">
                    {p.repo ? 'Public' : 'Private'}
                  </span>
                </div>
                <p className="mt-1 text-[14px] font-semibold text-white">{p.title}</p>
                <p className="pl-prose mt-1.5 flex-1 text-[13.5px] text-[#8b98a8]">{p.description}</p>
                <div className="mt-3 flex flex-wrap items-center gap-3 font-mono text-[11.5px] text-[#8b98a8]">
                  <span className="flex items-center gap-1.5">
                    <span className="size-2.5 rounded-full" style={{ background: LANG_COLOR[lang] ?? CAT_COLOR[p.category] }} />
                    {lang}
                  </span>
                  {p.tags
                    .filter((x) => x !== lang)
                    .map((x) => (
                      <span key={x} className="rounded-full bg-[#1f6feb]/10 px-2 py-0.5 text-[#58a6ff]">
                        {x}
                      </span>
                    ))}
                  {p.metric && <span className="ml-auto font-bold text-[#7ee787] rtl:ml-0 rtl:mr-auto" dir="ltr">{p.metric}</span>}
                </div>
              </motion.li>
            );
          })}
        </AnimatePresence>
      </motion.ul>

      <details className="mt-6 rounded-lg border border-[#222a35] bg-[#0d1117]">
        <summary className="cursor-pointer px-4 py-3 font-mono text-[12px] text-[#8b98a8]" dir="ltr">
          $ ls archive/ <span className="text-[#5c6773]"># {t('common.archive')} ({data.archive.length})</span>
        </summary>
        <ul className="grid gap-3 px-4 pb-4 md:grid-cols-2">
          {data.archive.map((p) => (
            <li key={p.id} className="rounded-md border border-[#222a35] p-3">
              <a href={p.url!} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 font-mono text-[12.5px] font-semibold text-[#58a6ff] hover:underline" dir="ltr">
                {p.repo?.split('/')[1]}
                <ArrowUpRight className="size-3" />
              </a>
              <p dir="auto" className="mt-1 text-[13.5px] font-semibold text-white">
                {p.title}
              </p>
              <p dir="auto" className="pl-prose mt-1 text-[13px] text-[#8b98a8]">
                {p.description}
              </p>
            </li>
          ))}
        </ul>
      </details>
    </Pane>
  );
}

/* --------------------------------------------------------------- skills */

const yamlKey = (s: string) => s.toLowerCase().replace(/&/g, 'and').replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '');

export function SkillsYaml({ data }: { data: SiteData }) {
  const t = useTranslations();
  const max = Math.max(...data.domains.map((d) => d.count));
  const lines: Array<{ indent: number; content: React.ReactNode }> = [];
  lines.push({ indent: 0, content: <span className="text-[#5c6773]"># {t('sections.skills.subtitle')}</span> });
  lines.push({ indent: 0, content: <><span className="text-[#7ee787]">name</span>: <span className="text-[#a5d6ff]">{data.person.fullName}</span></> });
  data.skills.forEach((c) => {
    if (c.key === 'Soft Skills') return;
    lines.push({ indent: 0, content: <><span className="text-[#7ee787]">{yamlKey(c.key)}</span>:<span className="ms-3 text-[#5c6773]"># {c.label}</span></> });
    c.groups.forEach((g) => {
      lines.push({
        indent: 1,
        content: (
          <>
            <span className="text-[#79c0ff]">{yamlKey(g.key)}</span>: <span className="text-[#c9d6e3]">[</span>
            {g.items.map((it, k) => (
              <span key={it.key}>
                {/* values in the page language (keys stay English); non-ASCII values are quoted and bidi-isolated */}
                <span className="text-[#a5d6ff]">{/^[\x20-\x7e]+$/.test(it.name) ? it.name : <bdi>&quot;{it.name}&quot;</bdi>}</span>
                {k < g.items.length - 1 && <span className="text-[#c9d6e3]">, </span>}
              </span>
            ))}
            <span className="text-[#c9d6e3]">]</span>
          </>
        ),
      });
    });
  });

  return (
    <Pane id="skills" file="skills.yml">
      <div className="grid gap-8 xl:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)]">
        <pre dir="ltr" className="max-h-[560px] overflow-auto rounded-lg border border-[#222a35] bg-[#0d1117] py-3 font-mono text-[12.5px] leading-6">
          {lines.map((l, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              transition={{ delay: Math.min(i * 0.025, 1.2) }}
              className="flex whitespace-pre-wrap hover:bg-white/[0.03]"
            >
              <span className="w-10 shrink-0 select-none pe-3 text-end text-[#3d4652]">{i + 1}</span>
              <span style={{ paddingLeft: l.indent * 16 }} className="min-w-0">
                {l.content}
              </span>
            </motion.div>
          ))}
        </pre>
        <div>
          <p className="mb-3 font-mono text-[12px] text-[#5c6773]" dir="ltr">
            $ wc -l skills/* <span className="text-[#3d4652]"># {t('pipeline.barsTitle')}</span>
          </p>
          <ul className="space-y-2 font-mono text-[12px]">
            {data.domains
              .slice()
              .sort((a, b) => b.count - a.count)
              .map((d, i) => (
                <li key={d.id} className="grid grid-cols-[minmax(0,9rem)_1fr_2rem] items-center gap-2">
                  <span className="truncate text-[#c9d6e3]">{t(`domains.${d.id}`)}</span>
                  <span className="relative h-4 overflow-hidden" dir="ltr">
                    <motion.span
                      className="absolute inset-y-0 left-0 block overflow-hidden whitespace-nowrap leading-4"
                      style={{ color: `hsl(${d.hue} 70% 65%)` }}
                      initial={{ width: 0 }}
                      whileInView={{ width: `${(d.count / max) * 100}%` }}
                      viewport={{ once: true }}
                      transition={{ duration: 1, delay: i * 0.06, ease: 'easeOut' }}
                    >
                      {'█'.repeat(60)}
                    </motion.span>
                  </span>
                  <span className="text-end text-[#8b98a8]">{fmtNum(data.locale, d.count)}</span>
                </li>
              ))}
          </ul>
          <div className="mt-6 rounded-lg border border-[#222a35] bg-[#0d1117] p-4">
            <p className="mb-2 font-mono text-[12px] text-[#5c6773]"># {t('helix.softSkills')}</p>
            <div className="flex flex-wrap gap-1.5">
              {data.softSkills.map((s) => (
                <span key={s.key} className="rounded border border-[#30363d] px-2 py-1 text-[12px] text-[#c9d6e3]">
                  {s.name}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>
    </Pane>
  );
}

/* ------------------------------------------------------------- bibtex */

export function Bib({ data }: { data: SiteData }) {
  const t = useTranslations();
  const entries = data.publications.map((p) => {
    const key = p.bibtex?.match(/@\w+\{([^,]+),/)?.[1] ?? `portfolio_${p.id.replace(/-/g, '_')}`;
    const body =
      p.bibtex ??
      `@unpublished{${key},\n  author    = {${p.authors.join(' and ')}},\n  title     = {${p.title}},\n  note      = {${p.status}}\n}`;
    return { p, body };
  });
  const color = (line: string) => {
    const m = line.match(/^(\s*)(\w+)(\s*=\s*)\{(.*)\}(,?)$/);
    if (line.startsWith('@')) {
      const [, type, rest] = line.match(/^@(\w+)\{(.*)$/) ?? [];
      return (
        <>
          <span className="text-[#ff7b72]">@{type}</span>
          {'{'}
          <span className="text-[#d2a8ff]">{rest}</span>
        </>
      );
    }
    if (m)
      return (
        <>
          {m[1]}
          <span className="text-[#79c0ff]">{m[2]}</span>
          {m[3]}
          {'{'}
          <span className="text-[#a5d6ff]">{m[4]}</span>
          {'}'}
          {m[5]}
        </>
      );
    return line;
  };
  return (
    <Pane id="publications" file="publications.bib">
      <div className="space-y-5">
        {entries.map(({ p, body }) => (
          <motion.div key={p.id} initial={{ opacity: 0, y: 10 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="overflow-hidden rounded-lg border border-[#222a35] bg-[#0d1117]">
            <div className="flex flex-wrap items-center gap-2 border-b border-[#222a35] px-4 py-2 text-[12px]">
              <span className={cn('rounded-full px-2 py-0.5', p.status === 'Published' ? 'bg-[#238636]/20 text-[#7ee787]' : p.status === 'Submitted' ? 'bg-[#1f6feb]/20 text-[#79c0ff]' : 'bg-white/5 text-[#8b98a8]')}>
                {publicationLabel(t, 'pubStatus', p.status)}
              </span>
              <span className="text-[#8b98a8]">{publicationLabel(t, 'pubType', p.type)}</span>
              {p.firstAuthor && <span className="text-[#ffa657]">· {t('common.firstAuthor')}</span>}
              <span className="ms-auto flex items-center gap-3">
                {p.url && (
                  <a href={p.url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-[#58a6ff] hover:underline">
                    DOI <ArrowUpRight className="size-3" />
                  </a>
                )}
                <CopyButton
                  value={body}
                  className="inline-flex items-center gap-1 text-[#8b98a8] hover:text-white"
                  copiedLabel={
                    <span className="inline-flex items-center gap-1 text-[#7ee787]">
                      <Check className="size-3" /> {t('common.copied')}
                    </span>
                  }
                >
                  <span className="inline-flex items-center gap-1">
                    <Copy className="size-3" /> {t('common.bibtex')}
                  </span>
                </CopyButton>
              </span>
            </div>
            <pre dir="ltr" className="overflow-x-auto px-4 py-3 font-mono text-[12.5px] leading-6 text-[#c9d6e3]">
              {body.split('\n').map((l, i) => (
                <div key={i}>{color(l)}</div>
              ))}
            </pre>
          </motion.div>
        ))}
      </div>
    </Pane>
  );
}

/* ---------------------------------------------------------- education */

export function Education({ data }: { data: SiteData }) {
  const t = useTranslations();
  const thesis = data.publications.find((p) => p.type === 'Master Thesis');
  const [all, setAll] = useState(false);
  const locales: Record<string, string> = { english: 'en_GB.UTF-8', german: 'de_DE.UTF-8', farsi: 'fa_IR.UTF-8' };
  return (
    <Pane id="education" file="education/">
      <div className="grid gap-6 xl:grid-cols-2">
        <div>
          <p className="mb-3 font-mono text-[12px] text-[#5c6773]" dir="ltr">
            $ tree ~/education
          </p>
          <ul className="space-y-3 font-mono text-[13px]">
            {data.education.map((e, i) => (
              <motion.li key={e.id} initial={{ opacity: 0, x: -8 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.1 }} className="flex gap-2">
                <span className="text-[#3d4652]" dir="ltr">
                  {i === data.education.length - 1 ? '└──' : '├──'}
                </span>
                <div>
                  <p>
                    <span className="text-[#e3b341]">{e.period}</span> <span className="font-semibold text-white">{e.degree}</span>
                  </p>
                  <p className="text-[12px] text-[#8b98a8]">
                    {e.institution} · {e.location}
                    {e.gpa && (
                      <span className="text-[#7ee787]">
                        {' '}
                        [{t('common.gpa')} <span dir="ltr">{e.gpa}</span>]
                      </span>
                    )}
                  </p>
                  {e.id === 'tehran' && thesis && (
                    <p className="mt-1 text-[12px] text-[#8b98a8]">
                      <span className="text-[#3d4652]" dir="ltr">
                        └──{' '}
                      </span>
                      {t('common.thesis')}: <span lang="en" className="text-[#c9d6e3]">{thesis.title}</span>
                    </p>
                  )}
                </div>
              </motion.li>
            ))}
          </ul>

          <p className="mb-3 mt-8 font-mono text-[12px] text-[#5c6773]" dir="ltr">
            $ locale -a
          </p>
          <ul className="space-y-1.5 font-mono text-[13px]">
            {data.languages.map((l) => (
              <li key={l.id} className="flex flex-wrap gap-x-3">
                <span className="w-28 text-[#79c0ff]" dir="ltr">
                  {locales[l.id] ?? l.id}
                </span>
                <span className="text-white">{l.name}</span>
                <span className="text-[#8b98a8]">
                  {l.level}
                  {l.cert && (
                    <>
                      {' '}
                      · {l.cert.test} {fmtNum(data.locale, l.cert.overall, { minimumFractionDigits: 1 })}
                    </>
                  )}
                </span>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <p className="mb-3 font-mono text-[12px] text-[#5c6773]" dir="ltr">
            $ ls -l certificates/ | wc -l <span className="text-[#7ee787]">→ {data.certStats.count}</span>
          </p>
          <ul className="divide-y divide-[#222a35] rounded-lg border border-[#222a35] bg-[#0d1117] font-mono text-[12px]">
            {data.certifications.map((c, i) => (
              <li key={c.name + c.issuer} hidden={!all && i >= 10 ? true : undefined} className="flex items-center gap-3 px-3 py-2" dir="ltr">
                <span className="w-10 shrink-0 text-[#5c6773]">{c.year ? fmtYear('en', c.year) : '----'}</span>
                <span className="min-w-0 flex-1 text-[#c9d6e3]">
                  {c.url ? (
                    <a href={c.url} target="_blank" rel="noreferrer" className="hover:text-[#58a6ff]">
                      {c.name}
                    </a>
                  ) : (
                    c.name
                  )}
                </span>
                <span className="hidden w-32 shrink-0 truncate text-[#8b98a8] sm:block" title={c.issuer}>
                  {c.issuer}
                </span>
                <span className="w-12 shrink-0 text-end text-[#ffa657]">{c.hours ? `${c.hours}h` : c.weeks ? `${c.weeks}w` : ''}</span>
                {c.certificate ? <Award className="size-3.5 shrink-0 text-[#e3b341]" /> : <span className="w-3.5" />}
              </li>
            ))}
          </ul>
          <button
            type="button"
            data-kit-more=""
            aria-expanded={all}
            onClick={() => setAll((v) => !v)}
            className="mt-3 font-mono text-[12px] text-[#58a6ff] hover:underline"
            dir="ltr"
          >
            {all ? '$ head -n 10' : `$ cat certificates/* (${data.certStats.count})`}
          </button>
        </div>
      </div>
    </Pane>
  );
}
