'use client';

import { useCallback, useMemo, useRef, useState } from 'react';
import { useTranslations } from 'next-intl';
import { ArrowLeft, ArrowRight, ArrowUpRight, Copy, Crosshair, Dna, FileText, Mail, Minus, Plus, Search } from 'lucide-react';
import { Authors } from '@/components/kit/Authors';
import DecryptedText from '@/components/reactbits/DecryptedText';
import { BrandIcon } from '@/components/shared/BrandIcon';
import { CopyButton } from '@/components/shared/CopyButton';
import { LocaleSwitcher } from '@/components/shared/LocaleSwitcher';
import { ProfilePhoto } from '@/components/shared/ProfilePhoto';
import { fmtNum, fmtYear, publicationLabel } from '@/lib/format';
import type { SiteData } from '@/lib/types';
import { cn } from '@/lib/utils';
import { Browser, Ideogram, periodOf, ProjectChromosome, type ViewFocus } from './Browser';
import { buildModel, CATEGORY_COLOR, signature, toGff, TRACK_COLOR, TRACKS, type Feature, type Gene, type Selectable, type TrackId } from './model';
import './genome.css';

const ym = (f: number) => {
  const y = Math.floor(f);
  const m = Math.min(12, Math.floor((f - y) * 12) + 1);
  return `${y}-${String(m).padStart(2, '0')}`;
};

function Panel({ title, note, children, className, id, actions }: { title: string; note?: string; children: React.ReactNode; className?: string; id?: string; actions?: React.ReactNode }) {
  return (
    <section id={id} className={cn('scroll-mt-20 overflow-hidden rounded-lg border border-[var(--g-line)] bg-white', className)}>
      <header className="flex flex-wrap items-center gap-x-4 gap-y-2 border-b border-[var(--g-line)] bg-[var(--g-strip)] px-4 py-2.5">
        <h2 className="text-[13px] font-semibold uppercase tracking-[0.06em] text-[var(--g-ink)] rtl:tracking-normal">{title}</h2>
        {note && <p className="text-[12.5px] text-[var(--g-muted)]">{note}</p>}
        {actions && <div className="ms-auto flex flex-wrap items-center gap-2">{actions}</div>}
      </header>
      {children}
    </section>
  );
}

function Btn({ children, onClick, label, pressed, className }: { children: React.ReactNode; onClick: () => void; label?: string; pressed?: boolean; className?: string }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      aria-pressed={pressed}
      title={label}
      className={cn(
        'inline-flex h-8 items-center gap-1.5 rounded border px-2.5 text-[12.5px] font-medium transition',
        pressed ? 'border-[var(--g-accent)] bg-[var(--g-accent)] text-white' : 'border-[var(--g-line-strong)] bg-white text-[var(--g-ink)] hover:bg-[var(--g-strip)]',
        className,
      )}
    >
      {children}
    </button>
  );
}

/* ───────────────────────────────── details panel ───────────────────────────────── */

function Details({ s, data }: { s: Selectable | null; data: SiteData }) {
  const t = useTranslations();
  const loc = data.locale;
  if (!s) return <p className="p-4 text-sm text-[var(--g-muted)]">{t('genome.noSelection')}</p>;
  const row = (k: string, v: React.ReactNode) =>
    v ? (
      <div className="grid grid-cols-[6.5rem_minmax(0,1fr)] gap-2 border-b border-[var(--g-line)] px-4 py-2 text-[13.5px] last:border-0">
        <dt className="text-[var(--g-muted)]">{k}</dt>
        <dd className="min-w-0 text-[var(--g-ink)]">{v}</dd>
      </div>
    ) : null;
  const typeLabel = { role: t('genome.type.role'), education: t('genome.type.education'), course: t('genome.type.course'), publication: t('genome.type.publication'), project: t('genome.type.project') }[s.kind];
  const color = s.kind === 'project' ? CATEGORY_COLOR[s.item.category] : TRACK_COLOR[(s as Feature).track];
  return (
    <div>
      <div className="flex items-start gap-3 border-b border-[var(--g-line)] p-4">
        <span className="mt-1 size-3 shrink-0 rounded-sm" style={{ background: color }} />
        <div className="min-w-0">
          <p className="gb-mono text-[11px] uppercase tracking-wide text-[var(--g-muted)] rtl:tracking-normal">{typeLabel}</p>
          <h3 dir="auto" className="mt-1 text-[16px] font-semibold leading-snug text-[var(--g-ink)]" lang={s.kind === 'publication' || s.kind === 'course' ? 'en' : undefined}>
            {s.kind === 'project' ? s.item.title : s.label}
          </h3>
        </div>
      </div>
      <dl>
        {s.kind === 'role' && (
          <>
            {row(t('genome.col.track'), t(`kinds.${s.item.kind}`))}
            {row(t('common.organisation'), s.item.org)}
            {row(t('common.location'), s.item.location)}
            {row(t('common.period'), s.item.period)}
            {row(t('genome.col.length'), s.item.months ? t('common.months', { count: s.item.months }) : null)}
          </>
        )}
        {s.kind === 'education' && (
          <>
            {row(t('genome.col.institution'), s.item.institution)}
            {row(t('common.location'), s.item.location)}
            {row(t('common.period'), s.item.period)}
            {row(t('common.gpa'), s.item.gpa ? <bdi dir="ltr">{s.item.gpa}</bdi> : null)}
          </>
        )}
        {s.kind === 'course' && (
          <>
            {row(t('common.issuer'), <bdi>{s.item.issuer}</bdi>)}
            {row(t('genome.col.date'), periodOf(s, loc))}
            {row(t('genome.col.length'), s.item.hours ? t('common.hours', { count: fmtNum(loc, s.item.hours) }) : null)}
            {row(
              t('common.certificate'),
              s.item.url ? (
                <a href={s.item.url} target="_blank" rel="noreferrer" className="g-link">
                  {t('common.certificateLink')}
                </a>
              ) : null,
            )}
          </>
        )}
        {s.kind === 'publication' && (
          <>
            {row(t('common.type'), publicationLabel(t, 'pubType', s.item.type))}
            {row(t('common.status'), publicationLabel(t, 'pubStatus', s.item.status))}
            {row(t('common.year'), s.item.year ? fmtYear(loc, s.item.year) : null)}
            {row(t('genome.col.venue'), s.item.venue ? <bdi lang="en">{s.item.venue}</bdi> : null)}
            {row(
              t('common.doi'),
              s.item.url ? (
                <a href={s.item.url} target="_blank" rel="noreferrer" className="g-link" dir="ltr">
                  {s.item.doi ?? s.item.url}
                </a>
              ) : null,
            )}
          </>
        )}
        {s.kind === 'project' && (
          <>
            {row(t('genome.col.position'), <span className="gb-mono">chrP:{fmtNum(loc, s.index)}</span>)}
            {row(t('common.category'), t(`categories.${s.item.category}`))}
            {row(t('common.tags'), s.item.tags.length ? <span dir="ltr" className="gb-mono text-[12.5px]">{s.item.tags.join(', ')}</span> : null)}
            {row(
              t('common.repository'),
              s.item.url ? (
                <a href={s.item.url} target="_blank" rel="noreferrer" className="g-link break-all" dir="ltr">
                  {s.item.repo ?? s.item.url}
                </a>
              ) : (
                t('common.noLink')
              ),
            )}
          </>
        )}
      </dl>
      {(s.kind === 'role' || s.kind === 'project') && (
        <p dir="auto" className="border-t border-[var(--g-line)] p-4 text-[14px] leading-relaxed text-[var(--g-ink)]">
          {s.item.description}
        </p>
      )}
    </div>
  );
}

/* ───────────────────────────────── design ───────────────────────────────── */

export default function GenomeDesign({ data }: { data: SiteData }) {
  const t = useTranslations();
  const loc = data.locale;
  const rtl = data.dir === 'rtl';
  const model = useMemo(() => buildModel(data), [data]);
  const gff = useMemo(() => toGff(model, data), [model, data]);
  const sig = useMemo(() => signature(data.person.fullName), [data.person.fullName]);

  const initial = model.features.find((f) => f.kind === 'role' && data.current[0] && f.item.id === data.current[0].id) ?? model.features[0] ?? null;
  const [selected, setSelected] = useState<Selectable | null>(initial);
  const [visible, setVisible] = useState<Set<TrackId>>(new Set(TRACKS));
  const [focus, setFocus] = useState<ViewFocus | null>(null);
  const [command, setCommand] = useState<{ op: 'in' | 'out' | 'back' | 'fwd'; nonce: number } | null>(null);
  const [view, setView] = useState<[number, number]>(model.domain);
  const [textView, setTextView] = useState(false);
  const [q, setQ] = useState('');
  const browserRef = useRef<HTMLDivElement>(null);
  const chrPRef = useRef<HTMLDivElement>(null);

  const onView = useCallback((r: [number, number]) => setView(r), []);
  const go = (range: [number, number]) => setFocus({ range, nonce: Date.now() });
  const cmd = (op: 'in' | 'out' | 'back' | 'fwd') => setCommand({ op, nonce: Date.now() });

  const showFeature = (f: Feature, scroll = true) => {
    setSelected(f);
    setTextView(false);
    const pad = Math.max(0.4, (f.end - f.start) * 0.25);
    go([f.start - pad, f.end + pad]);
    if (scroll) browserRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };
  const showGene = (g: Gene) => {
    setSelected(g);
    chrPRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const cen = model.centromere ?? model.domain[0] + (model.domain[1] - model.domain[0]) / 2;
  const thesis = model.features.find((f) => f.kind === 'role' && f.item.id === 'ut-thesis');
  const presets: Array<{ k: string; r: [number, number] }> = [
    { k: 'all', r: model.domain },
    { k: 'iran', r: [model.domain[0], cen] },
    { k: 'germany', r: [cen - 0.2, model.domain[1]] },
    { k: 'y2026', r: [2026, 2027] },
    ...(thesis ? [{ k: 'thesis', r: [thesis.start - 0.3, thesis.end + 0.3] as [number, number] }] : []),
  ];

  // search across features and genes
  const searchable = useMemo(
    () => [...model.features.map((f) => ({ label: f.label, s: f as Selectable })), ...model.genes.map((g) => ({ label: g.item.title, s: g as Selectable }))],
    [model],
  );
  const runSearch = (value: string) => {
    const v = value.trim().toLowerCase();
    if (!v) return;
    const hit = searchable.find((x) => x.label.toLowerCase() === v) ?? searchable.find((x) => x.label.toLowerCase().includes(v));
    if (!hit) return;
    if (hit.s.kind === 'project') showGene(hit.s);
    else showFeature(hit.s);
  };

  const locus = `chrRY:${ym(Math.min(...view))}–${ym(Math.max(...view))}`;
  const labelsCat = Object.fromEntries((['omics', 'structural', 'ml', 'software', 'biotech'] as const).map((c) => [c, t(`categories.${c}`)]));
  const roleFeature = (id: string) => model.features.find((f) => f.kind === 'role' && f.item.id === id);
  const p = data.person;

  return (
    <div className="genome-root min-h-dvh">
      {/* app bar */}
      <header className="sticky top-0 z-40 border-b border-[var(--g-line)] bg-white/95 backdrop-blur">
        <div className="mx-auto flex h-12 max-w-[1400px] items-center gap-3 px-4 sm:px-6">
          <span className="grid size-7 place-items-center rounded bg-[var(--g-accent)] text-white">
            <Dna className="size-4" />
          </span>
          <span className="text-[14px] font-semibold text-[var(--g-ink)]">{t('genome.appName')}</span>
          <span className="hidden text-[13px] text-[var(--g-muted)] md:inline">— {p.displayName}</span>
          <nav aria-label={t('nav.menu')} className="ms-auto hidden items-center gap-1 text-[13px] lg:flex">
            {(['browser', 'projects', 'tables', 'contact'] as const).map((k) => (
              <a key={k} href={`#${k}`} className="rounded px-2.5 py-1.5 text-[var(--g-ink)] hover:bg-[var(--g-strip)]">
                {t(`genome.nav.${k}`)}
              </a>
            ))}
          </nav>
          <LocaleSwitcher
            className="ms-auto rounded border border-[var(--g-line-strong)] lg:ms-2"
            itemClassName="h-8 min-w-8 px-2 text-xs font-semibold text-[var(--g-ink)] hover:bg-[var(--g-strip)]"
            activeClassName="bg-[var(--g-ink)] text-white hover:bg-[var(--g-ink)]"
          />
        </div>
      </header>

      <main className="mx-auto max-w-[1400px] space-y-5 px-4 py-6 sm:px-6">
        {/* identity */}
        <section className="grid gap-5 rounded-lg border border-[var(--g-line)] bg-white p-5 md:grid-cols-[auto_minmax(0,1fr)] md:p-6">
          <ProfilePhoto src={p.photo} alt={t('common.photoAlt')} size={256} priority className="size-24 rounded-lg ring-1 ring-[var(--g-line)] md:size-28" monogramClassName="text-2xl text-[var(--g-ink)] from-sky-100 via-emerald-50 to-indigo-100" />
          <div className="min-w-0">
            <p className="gb-mono text-[12px] text-[var(--g-muted)]">{t('genome.organism')}</p>
            <h1 className="mt-1 text-[clamp(1.9rem,4vw,3rem)] font-semibold leading-tight text-[var(--g-ink)]">{p.displayName}</h1>
            <p className="mt-1 text-[17px] text-[var(--g-ink)]">{p.headline}</p>
            <p className="mt-3 max-w-3xl text-[15px] leading-relaxed text-[var(--g-muted)]">{p.statement}</p>
            <div className="mt-4 flex flex-wrap items-center gap-2 text-[13px]">
              <span className="rounded border border-[var(--g-line-strong)] px-2 py-1">{p.location}</span>
              <span className="rounded border border-[var(--g-line-strong)] px-2 py-1">{p.status}</span>
              <a href={data.links.email} className="inline-flex items-center gap-1.5 rounded bg-[var(--g-accent)] px-3 py-1.5 font-semibold text-white hover:brightness-110">
                <Mail className="size-4" /> {t('common.sendEmail')}
              </a>
            </div>
          </div>
        </section>

        {/* signature sequence */}
        <Panel title={t('genome.signature')} note={t('genome.signatureNote')}>
          <div className="relative overflow-x-auto px-4 py-3" dir="ltr">
            <div className="gb-mono flex min-w-max gap-3 text-[13px]">
              {sig.map((c, i) => (
                <div key={i} className="text-center">
                  <div className="text-[11px] font-semibold text-[var(--g-muted)]">{c.letter}</div>
                  <div className={cn('rounded border px-1.5 py-0.5', c.codon === 'NNN' ? 'border-dashed border-[#c0392b] text-[#b42318]' : 'border-[var(--g-line)] text-[var(--g-ink)]')}>
                    {loc === 'fa' ? c.codon : <DecryptedText text={c.codon} animateOn="view" speed={60} maxIterations={10} characters="ACGT" sequential />}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </Panel>

        <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_340px]">
          <div className="min-w-0 space-y-5">
            {/* chrRY browser */}
            <div ref={browserRef} id="browser" className="scroll-mt-16">
              <Panel title={t('genome.browserTitle')} note={t('genome.browserNote')}>
                {/* toolbar */}
                <div className="flex flex-wrap items-center gap-2 border-b border-[var(--g-line)] px-3 py-2.5">
                  <output className="gb-mono rounded border border-[var(--g-line-strong)] bg-[var(--g-strip)] px-2.5 py-1.5 text-[12px] text-[var(--g-ink)]" dir="ltr" aria-live="polite">
                    {locus}
                  </output>
                  <div role="group" aria-label={t('genome.presets.label')} className="flex flex-wrap gap-1">
                    {presets.map((pr) => (
                      <Btn key={pr.k} onClick={() => go(pr.r)}>
                        {t(`genome.presets.${pr.k}`)}
                      </Btn>
                    ))}
                  </div>
                  <div className="flex gap-1">
                    <Btn onClick={() => cmd('back')} label={t('genome.panBack')}>
                      {rtl ? <ArrowRight className="size-4" /> : <ArrowLeft className="size-4" />}
                    </Btn>
                    <Btn onClick={() => cmd('fwd')} label={t('genome.panForward')}>
                      {rtl ? <ArrowLeft className="size-4" /> : <ArrowRight className="size-4" />}
                    </Btn>
                    <Btn onClick={() => cmd('out')} label={t('genome.zoomOut')}>
                      <Minus className="size-4" />
                    </Btn>
                    <Btn onClick={() => cmd('in')} label={t('genome.zoomIn')}>
                      <Plus className="size-4" />
                    </Btn>
                  </div>
                  <form
                    role="search"
                    className="flex min-w-[200px] flex-1 items-center gap-1.5 rounded border border-[var(--g-line-strong)] px-2"
                    onSubmit={(e) => {
                      e.preventDefault();
                      runSearch(q);
                    }}
                  >
                    <Search className="size-4 shrink-0 text-[var(--g-muted)]" />
                    <label htmlFor="g-search" className="sr-only">
                      {t('genome.search')}
                    </label>
                    <input
                      id="g-search"
                      list="g-search-list"
                      value={q}
                      onChange={(e) => {
                        setQ(e.target.value);
                        if (searchable.some((x) => x.label === e.target.value)) runSearch(e.target.value);
                      }}
                      placeholder={t('genome.searchHint')}
                      className="h-8 w-full bg-transparent text-[13px] outline-none placeholder:text-[var(--g-muted)]"
                    />
                    <datalist id="g-search-list">
                      {searchable.map((x) => (
                        <option key={(x.s as { id: string }).id} value={x.label} />
                      ))}
                    </datalist>
                  </form>
                  <Btn onClick={() => setTextView((v) => !v)} pressed={textView}>
                    <FileText className="size-4" /> {t('genome.textView')}
                  </Btn>
                </div>
                {/* track toggles */}
                <fieldset className="flex flex-wrap items-center gap-x-4 gap-y-1.5 border-b border-[var(--g-line)] px-3 py-2 text-[12.5px]">
                  <legend className="sr-only">{t('genome.tracksLabel')}</legend>
                  {TRACKS.map((tr) => (
                    <label key={tr} className="inline-flex cursor-pointer items-center gap-1.5">
                      <input
                        type="checkbox"
                        checked={visible.has(tr)}
                        onChange={() =>
                          setVisible((v) => {
                            const n = new Set(v);
                            if (n.has(tr)) n.delete(tr);
                            else n.add(tr);
                            return n;
                          })
                        }
                        className="accent-[var(--g-accent)]"
                      />
                      <span className="size-2.5 rounded-sm" style={{ background: TRACK_COLOR[tr] }} />
                      {t(`genome.tracks.${tr}`)}
                    </label>
                  ))}
                </fieldset>

                {textView ? (
                  <div className="relative">
                    <CopyButton value={gff} className="absolute end-3 top-3 inline-flex items-center gap-1.5 rounded border border-[var(--g-line-strong)] bg-white px-2.5 py-1 text-[12px] font-medium">
                      <Copy className="size-3.5" /> {t('genome.copyGff')}
                    </CopyButton>
                    <pre dir="ltr" className="gb-mono max-h-[460px] overflow-auto bg-[#0f1726] p-4 text-[11.5px] leading-5 text-[#d7e2f2]">
                      {gff}
                    </pre>
                    <p className="px-4 py-2 text-[12px] text-[var(--g-muted)]">{t('genome.gffNote')}</p>
                  </div>
                ) : (
                  <div className="px-2 pb-2 pt-3">
                    <Ideogram model={model} view={view} rtl={rtl} locale={loc} onJump={(c) => {
                      const half = Math.abs(view[1] - view[0]) / 2;
                      go([c - half, c + half]);
                    }} />
                    <Browser
                      model={model}
                      locale={loc}
                      rtl={rtl}
                      visible={visible}
                      selectedId={selected && selected.kind !== 'project' ? selected.id : null}
                      onSelect={(f) => setSelected(f)}
                      focus={focus}
                      command={command}
                      onView={onView}
                    />
                  </div>
                )}
                <div className="flex flex-wrap gap-x-6 gap-y-1 border-t border-[var(--g-line)] px-4 py-2.5 text-[12px] text-[var(--g-muted)]">
                  <span>{t('genome.bandNote')}</span>
                  <span>{t('genome.undatedNote', { count: model.undatedRoles.length + model.undatedPubs.length })}</span>
                  <span className="hidden md:inline">{t('genome.keyboardHint')}</span>
                </div>
              </Panel>
            </div>

            {/* chrP projects */}
            <div ref={chrPRef} id="projects" className="scroll-mt-16">
              <Panel title={t('genome.chrPTitle')} note={t('genome.chrPNote', { count: model.genes.length })}>
                <div className="px-2 py-3">
                  <ProjectChromosome model={model} rtl={rtl} selectedId={selected?.kind === 'project' ? selected.id : null} onSelect={(g) => setSelected(g)} labels={labelsCat} />
                </div>
                <div className="flex flex-wrap gap-x-4 gap-y-1 border-t border-[var(--g-line)] px-4 py-2.5 text-[12px] text-[var(--g-muted)]">
                  {(['omics', 'structural', 'ml', 'software', 'biotech'] as const).map((c) => (
                    <span key={c} className="inline-flex items-center gap-1.5">
                      <span className="size-2.5 rounded-sm" style={{ background: CATEGORY_COLOR[c] }} />
                      {labelsCat[c]}
                    </span>
                  ))}
                </div>
              </Panel>
            </div>
          </div>

          {/* details (sticky) */}
          <aside className="lg:sticky lg:top-16 lg:self-start">
            <Panel title={t('genome.details')}>
              <div aria-live="polite">
                <Details s={selected} data={data} />
              </div>
            </Panel>
          </aside>
        </div>

        {/* about + assembly statistics */}
        <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_380px]">
          <Panel title={t('sections.about.title')}>
            <div className="space-y-3 p-5 text-[15px] leading-relaxed text-[var(--g-ink)]">
              {p.about.map((a, i) => (
                <p key={i}>{a}</p>
              ))}
              <p className="text-[var(--g-muted)]">{p.availability}</p>
            </div>
          </Panel>
          <Panel title={t('genome.assembly')}>
            <table className="w-full text-[13.5px]">
              <tbody>
                {data.stats.map((s) => (
                  <tr key={s.id} className="border-b border-[var(--g-line)] last:border-0">
                    <th scope="row" className="px-4 py-2 text-start font-normal text-[var(--g-muted)]">
                      {s.label}
                    </th>
                    <td className="gb-mono px-4 py-2 text-end font-medium text-[var(--g-ink)]">
                      {fmtNum(loc, s.value)}
                      {s.suffix}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Panel>
        </div>

        {/* tables */}
        <div id="tables" className="scroll-mt-16 space-y-5">
          <Panel title={t('genome.featureTable')} note={t('common.count.roles', { count: data.experiences.length })}>
            <ul>
              {data.experiences.map((e) => {
                const f = roleFeature(e.id);
                return (
                  <li key={e.id} className="grid gap-x-5 gap-y-1.5 border-t border-[var(--g-line)] px-4 py-3 text-[13.5px] first:border-0 md:grid-cols-[8.5rem_minmax(0,1fr)_10rem_auto]">
                    <span className="inline-flex items-center gap-1.5 text-[var(--g-muted)] md:text-[var(--g-ink)]">
                      <span className="size-2.5 rounded-sm" style={{ background: TRACK_COLOR[e.kind] }} />
                      {t(`genome.tracks.${e.kind}`)}
                    </span>
                    <div className="min-w-0">
                      <p className="font-semibold text-[var(--g-ink)]">{e.role}</p>
                      <p className="text-[var(--g-muted)]">
                        {e.org}
                        {e.location ? ` · ${e.location}` : ''}
                      </p>
                      <p className="mt-1.5 leading-relaxed text-[var(--g-ink)]">{e.description}</p>
                    </div>
                    <span className="text-[var(--g-muted)]">{e.period || t('common.undated')}</span>
                    <span className="md:text-end">
                      {f ? (
                        <button type="button" onClick={() => showFeature(f)} className="inline-flex items-center gap-1 rounded border border-[var(--g-line-strong)] px-2 py-1 text-[12px] hover:bg-[var(--g-strip)]">
                          <Crosshair className="size-3.5" /> {t('genome.showInBrowser')}
                        </button>
                      ) : (
                        <span className="text-[12px] text-[var(--g-muted)]">{t('common.undated')}</span>
                      )}
                    </span>
                  </li>
                );
              })}
            </ul>
          </Panel>

          <Panel title={t('sections.education.title')}>
            <ul>
              {data.education.map((e) => {
                const f = model.features.find((x) => x.kind === 'education' && x.item.id === e.id);
                return (
                  <li key={e.id} className="flex flex-col items-start gap-x-6 gap-y-1.5 border-t border-[var(--g-line)] px-4 py-3 text-[13.5px] first:border-0 md:flex-row">
                    <span className="shrink-0 text-[var(--g-muted)] md:w-40">{e.period}</span>
                    <span className="min-w-0 flex-1">
                      <span className="block font-semibold text-[var(--g-ink)]">{e.degree}</span>
                      <span className="text-[var(--g-muted)]">
                        {e.institution} · {e.location}
                        {e.gpa && (
                          <>
                            {' '}
                            · {t('common.gpa')} <bdi dir="ltr">{e.gpa}</bdi>
                          </>
                        )}
                      </span>
                    </span>
                    {f && (
                      <button type="button" onClick={() => showFeature(f)} className="inline-flex items-center gap-1 rounded border border-[var(--g-line-strong)] px-2 py-1 text-[12px] hover:bg-[var(--g-strip)]">
                        <Crosshair className="size-3.5" /> {t('genome.showInBrowser')}
                      </button>
                    )}
                  </li>
                );
              })}
            </ul>
          </Panel>

          <Panel title={t('genome.geneCatalogue')} note={t('common.count.projects', { count: model.genes.length })}>
            <ul>
              {model.genes.map((g) => (
                <li key={g.id} className="grid gap-x-5 gap-y-1.5 border-t border-[var(--g-line)] px-4 py-3 text-[13.5px] first:border-0 md:grid-cols-[6rem_minmax(0,1fr)_11rem_auto]">
                  <span className="gb-mono text-[var(--g-muted)]">chrP:{fmtNum(loc, g.index)}</span>
                  <div className="min-w-0">
                    <p dir="auto" className="font-semibold text-[var(--g-ink)]">
                      {g.item.url ? (
                        <a href={g.item.url} target="_blank" rel="noreferrer" className="g-link inline-flex items-center gap-1">
                          {g.item.title} <ArrowUpRight className="flip-rtl size-3.5" />
                        </a>
                      ) : (
                        g.item.title
                      )}
                      {g.item.metric && (
                        <span className="gb-mono ml-2 text-[#b42318] rtl:ml-0 rtl:mr-2" dir="ltr">
                          {g.item.metric}
                        </span>
                      )}
                    </p>
                    <p dir="auto" className="mt-1 leading-relaxed text-[var(--g-ink)]">
                      {g.item.description}
                    </p>
                    {g.item.tags.length > 0 && (
                      <p className="gb-mono mt-1 text-[12px] text-[var(--g-muted)]" dir="ltr">
                        {g.item.tags.join(' · ')}
                      </p>
                    )}
                  </div>
                  <span className="inline-flex items-start gap-1.5">
                    <span className="mt-1 size-2.5 shrink-0 rounded-sm" style={{ background: CATEGORY_COLOR[g.item.category] }} />
                    {labelsCat[g.item.category]}
                  </span>
                  <span className="md:text-end">
                    <button type="button" onClick={() => showGene(g)} className="inline-flex items-center gap-1 rounded border border-[var(--g-line-strong)] px-2 py-1 text-[12px] hover:bg-[var(--g-strip)]">
                      <Crosshair className="size-3.5" /> chrP
                    </button>
                  </span>
                </li>
              ))}
            </ul>
          </Panel>

          <Panel title={t('sections.publications.title')}>
            <ol>
              {data.publications.map((pub, i) => (
                <li key={pub.id} className="border-t border-[var(--g-line)] px-4 py-3 text-[13.5px] first:border-0">
                  <p className="text-[12px] text-[var(--g-muted)]">
                    [{fmtNum(loc, i + 1)}] {publicationLabel(t, 'pubType', pub.type)} · {publicationLabel(t, 'pubStatus', pub.status)}
                    {pub.year ? ` · ${fmtYear(loc, pub.year)}` : ''}
                  </p>
                  <p lang="en" dir="ltr" className="mt-1 font-semibold text-[var(--g-ink)]">
                    {pub.title}
                  </p>
                  <p className="mt-0.5 text-[var(--g-muted)]">
                    <Authors ownerName={data.person.fullName} p={pub} meClassName="font-semibold text-[var(--g-ink)]" etAl={t('common.withCoAuthors')} />
                    {pub.venue && (
                      <>
                        {' — '}
                        <bdi lang="en">
                          <i>{pub.venue}</i>
                          {pub.publisher ? `, ${pub.publisher}` : ''}
                        </bdi>
                      </>
                    )}
                  </p>
                  <div className="mt-1.5 flex flex-wrap gap-3 text-[12.5px]">
                    {pub.url && (
                      <a href={pub.url} target="_blank" rel="noreferrer" className="g-link" dir="ltr">
                        {pub.doi ? `doi:${pub.doi}` : pub.url}
                      </a>
                    )}
                    {pub.bibtex && (
                      <CopyButton value={pub.bibtex} className="g-link">
                        {t('common.copyBibtex')}
                      </CopyButton>
                    )}
                  </div>
                </li>
              ))}
            </ol>
          </Panel>

          <Panel title={t('genome.annotations')} note={t('genome.annotationsNote')}>
            <div className="grid gap-px bg-[var(--g-line)] sm:grid-cols-2 xl:grid-cols-3">
              {data.skills.map((c) => (
                <div key={c.id} className="bg-white p-4">
                  <h3 className="text-[13.5px] font-semibold text-[var(--g-ink)]">
                    {c.label} <span className="gb-mono text-[12px] font-normal text-[var(--g-muted)]">({fmtNum(loc, c.groups.reduce((a, g) => a + g.items.length, 0))})</span>
                  </h3>
                  <dl className="mt-2 space-y-2 text-[13px]">
                    {c.groups.map((g) => (
                      <div key={g.id}>
                        <dt className="text-[12px] text-[var(--g-muted)]">{g.label}</dt>
                        <dd className="mt-0.5 flex flex-wrap gap-1">
                          {g.items.map((it) => (
                            <span key={it.key} title={it.long !== it.name ? it.long : undefined} className="rounded border border-[var(--g-line)] bg-[var(--g-strip)] px-1.5 py-0.5">
                              <bdi>{it.name}</bdi>
                            </span>
                          ))}
                        </dd>
                      </div>
                    ))}
                  </dl>
                </div>
              ))}
            </div>
          </Panel>

          <Panel title={t('sections.certifications.title')} note={t('sections.certifications.subtitle', { count: fmtNum(data.locale, data.certStats.count), hours: fmtNum(data.locale, data.certStats.hours), issuers: fmtNum(data.locale, data.certStats.issuers.length) })}>
            <ul>
              {data.certifications.map((c, i) => {
                const f = model.features.find((x) => x.kind === 'course' && x.index === i);
                return (
                  <li key={c.name + c.issuer} className="grid gap-x-5 gap-y-0.5 border-t border-[var(--g-line)] px-4 py-2 text-[13px] first:border-0 md:grid-cols-[minmax(0,1fr)_13rem_7rem_6rem]">
                    <span>
                      <bdi lang="en">
                        {f ? (
                          <button type="button" onClick={() => showFeature(f)} className="g-link text-start">
                            {c.name}
                          </button>
                        ) : (
                          c.name
                        )}
                      </bdi>
                      {c.url && (
                        <a href={c.url} target="_blank" rel="noreferrer" className="g-link ms-2 text-[12px]">
                          {t('common.certificate')}
                        </a>
                      )}
                    </span>
                    <span className="text-[var(--g-muted)]">
                      <bdi>{c.issuer}</bdi>
                    </span>
                    <span className="text-[var(--g-muted)]">{f ? periodOf(f, loc) : ''}</span>
                    <span className="gb-mono md:text-end">{c.hours ? t('common.hours', { count: fmtNum(loc, c.hours) }) : ''}</span>
                  </li>
                );
              })}
            </ul>
          </Panel>

          <div className="grid gap-5 lg:grid-cols-2">
            <Panel title={t('sections.languages.title')}>
              <ul>
                {data.languages.map((l) => (
                  <li key={l.id} className="border-t border-[var(--g-line)] px-4 py-3 text-[13.5px] first:border-0">
                    <p className="font-semibold text-[var(--g-ink)]">
                      {l.name} <span className="font-normal text-[var(--g-muted)]">— {l.level}</span>
                    </p>
                    {l.cert && (
                      <div className="mt-2 grid grid-cols-2 gap-x-6 gap-y-1 sm:grid-cols-5">
                        <span className="col-span-2 sm:col-span-1">
                          {l.cert.test}: <b className="gb-mono">{fmtNum(loc, l.cert.overall, { minimumFractionDigits: 1 })}</b>
                        </span>
                        {(['listening', 'reading', 'writing', 'speaking'] as const).map((k) => (
                          <span key={k} className="text-[var(--g-muted)]">
                            {t(`ielts.${k}`)} <b className="gb-mono text-[var(--g-ink)]">{fmtNum(loc, l.cert!.bands[k], { minimumFractionDigits: 1 })}</b>
                          </span>
                        ))}
                      </div>
                    )}
                  </li>
                ))}
              </ul>
            </Panel>
            <Panel title={t('common.softSkills')}>
              <ul className="flex flex-wrap gap-1.5 p-4 text-[13px]">
                {data.softSkills.map((s) => (
                  <li key={s.key} className="rounded border border-[var(--g-line)] bg-[var(--g-strip)] px-2 py-1">
                    {s.name}
                  </li>
                ))}
              </ul>
            </Panel>
          </div>

          <div id="contact" className="scroll-mt-16">
            <Panel title={t('sections.contact.kicker')}>
              <div className="grid gap-6 p-5 md:grid-cols-[minmax(0,1fr)_auto] md:items-center">
                <div>
                  <h2 className="text-[clamp(1.5rem,3vw,2.2rem)] font-semibold leading-tight text-[var(--g-ink)]">{t('sections.contact.title')}</h2>
                  <p className="mt-2 max-w-2xl text-[15px] leading-relaxed text-[var(--g-muted)]">{t('sections.contact.subtitle')}</p>
                  <a href={data.links.email} dir="ltr" className="gb-mono mt-4 inline-block break-all text-[17px] font-medium text-[var(--g-accent)] hover:underline">
                    {p.email}
                  </a>
                </div>
                <ul className="flex flex-wrap gap-2">
                  {(['github', 'linkedin', 'orcid', 'scholar'] as const).map((k) =>
                    data.links[k] ? (
                      <li key={k}>
                        <a href={data.links[k]!} target="_blank" rel="noreferrer" aria-label={k} className="grid size-10 place-items-center rounded border border-[var(--g-line-strong)] text-[var(--g-ink)] hover:bg-[var(--g-strip)]">
                          <BrandIcon name={k} className="size-4" />
                        </a>
                      </li>
                    ) : null,
                  )}
                </ul>
              </div>
            </Panel>
          </div>
        </div>

        <footer className="flex flex-wrap justify-between gap-3 pb-24 pt-2 text-[12px] text-[var(--g-muted)]">
          <span>{t('common.rights', { year: fmtYear(loc, new Date(data.generatedAt).getUTCFullYear()) })}</span>
          <span>{t('genome.footer')}</span>
        </footer>
      </main>
    </div>
  );
}
