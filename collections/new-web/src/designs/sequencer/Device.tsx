'use client';

import { useCallback, useEffect, useMemo, useRef, useState, type KeyboardEvent, type ReactNode } from 'react';
import { useTranslations } from 'next-intl';
import { ArrowUpRight, Pause, Play, RotateCcw, SkipBack, SkipForward, Volume2, VolumeX } from 'lucide-react';
import { activeByYear, allProjects, domainEvidence, skillProjects } from '@/lib/derive';
import { fmtNum, fmtYear, publicationLabel } from '@/lib/format';
import type { SiteData } from '@/lib/types';
import { cn } from '@/lib/utils';
import { kmerCounts, kmerWindows, nwMatrix, nwOrder, nwTraceback, seedHit, seedHits } from './algos';
import { Knob } from './Knob';

export type Mode = 'about' | 'time' | 'patterns' | 'kit' | 'algo' | 'lab' | 'papers' | 'study' | 'lang' | 'mail';
export const MODES: Mode[] = ['about', 'time', 'patterns', 'kit', 'algo', 'lab', 'papers', 'study', 'lang', 'mail'];
type Algo = 'kmer' | 'seed' | 'nw';

const KIND_COLOR: Record<string, string> = { education: '#2b2b2b', research: '#1f6feb', teaching: '#8a4bd1', industry: '#b06a1d', business: '#d1242f' };
const CAT_COLOR: Record<string, string> = { omics: '#1a9a6c', structural: '#8a4bd1', ml: '#d1242f', software: '#1f6feb', biotech: '#b06a1d' };

/* synthetic, illustrative inputs for ALGO mode */
export const SEQ_K = 'ATGCGATACGCTTGAGCATGCATGC';
export const SEED_Q = 'ACGTTGCA';
export const SEED_T = 'GGACCTTCCATAGACGTTGCAGT';
export const NW_A = 'GATTACA';
export const NW_B = 'GCATGCT';

interface PadDef {
  key: string;
  label: string;
  sub?: string;
  color?: string;
  lit?: boolean;
  dots?: string[];
  disabled?: boolean;
  href?: string;
  aria: string;
}

function useClick(on: boolean) {
  const ctx = useRef<AudioContext | null>(null);
  return useCallback(
    (freq = 880) => {
      if (!on) return;
      try {
        ctx.current ??= new AudioContext();
        const c = ctx.current;
        const o = c.createOscillator();
        const g = c.createGain();
        o.frequency.value = freq;
        o.type = 'square';
        g.gain.setValueAtTime(0.0001, c.currentTime);
        g.gain.exponentialRampToValueAtTime(0.06, c.currentTime + 0.005);
        g.gain.exponentialRampToValueAtTime(0.0001, c.currentTime + 0.05);
        o.connect(g).connect(c.destination);
        o.start();
        o.stop(c.currentTime + 0.06);
      } catch {
        /* audio not available */
      }
    },
    [on],
  );
}

export function Device({ data, reduce }: { data: SiteData; reduce: boolean }) {
  const t = useTranslations();
  const loc = data.locale;
  const rtl = data.dir === 'rtl';
  const years = useMemo(() => activeByYear(data), [data]);
  const projects = useMemo(() => allProjects(data), [data]);
  const evidence = useMemo(() => domainEvidence(data), [data]);
  const lab = data.skills.find((c) => c.id === 'laboratory-techniques');
  const courseYears = useMemo(() => {
    const m = new Map<number, typeof data.certifications>();
    for (const c of data.certifications) if (c.year) m.set(c.year, [...(m.get(c.year) ?? []), c]);
    return [...m.entries()].sort((a, b) => a[0] - b[0]);
  }, [data]);

  const [mode, setMode] = useState<Mode>('about');
  const [sel, setSel] = useState<Partial<Record<Mode, number>>>({});
  const [bank, setBank] = useState(0);
  const [kitDomain, setKitDomain] = useState(0);
  const [kitPage, setKitPage] = useState(0);
  const [algo, setAlgo] = useState<Algo>('kmer');
  const [k, setK] = useState(3);
  const [kPos, setKPos] = useState(0);
  const [mask, setMask] = useState('11011011');
  const [offset, setOffset] = useState(2);
  const [score, setScore] = useState({ match: 1, mismatch: -1, gap: -1 });
  const [filled, setFilled] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [head, setHead] = useState(0);
  const [tempo, setTempo] = useState(96);
  const [sound, setSound] = useState(false);
  const [focus, setFocus] = useState(0);
  const [live, setLive] = useState('');
  const click = useClick(sound);
  const padRefs = useRef<Array<HTMLElement | null>>([]);

  const selected = sel[mode] ?? (mode === 'time' ? years.length - 1 : 0);
  const choose = (i: number, msg?: string) => {
    setSel((s) => ({ ...s, [mode]: i }));
    if (msg) setLive(msg);
    click(660 + i * 30);
  };

  // stop playback when leaving a mode or when motion is reduced
  useEffect(() => setPlaying(false), [mode, algo]);
  useEffect(() => {
    if (reduce) setPlaying(false);
  }, [reduce]);

  /* ── ALGO models ── */
  const windows = useMemo(() => kmerWindows(SEQ_K, k), [k]);
  const kIdx = Math.min(kPos, windows.length - 1);
  const counts = useMemo(() => kmerCounts(SEQ_K, k, kIdx + 1), [k, kIdx]);
  const seed = seedHit(SEED_Q, SEED_T, mask, offset);
  const hits = useMemo(() => seedHits(SEED_Q, SEED_T, mask), [mask]);
  const maxOffset = SEED_T.length - mask.length;
  const nw = useMemo(() => nwMatrix(NW_A, NW_B, score), [score]);
  const order = useMemo(() => nwOrder(NW_A.length, NW_B.length), []);
  const total = order.length;
  const done = filled >= total;
  const trace = useMemo(() => (done ? nwTraceback(NW_A, NW_B, nw.H, nw.P) : null), [done, nw]);

  /* ── transport ── */
  const canPlay = !reduce && (mode === 'time' || (mode === 'algo' && algo !== 'seed'));
  const step = useCallback(
    (dir: 1 | -1) => {
      if (mode === 'time') {
        setHead((h) => (h + dir + years.length) % years.length);
        setSel((s) => ({ ...s, time: ((s.time ?? head) + dir + years.length) % years.length }));
      } else if (mode === 'algo') {
        if (algo === 'kmer') setKPos((p) => Math.min(windows.length - 1, Math.max(0, p + dir)));
        if (algo === 'seed') setOffset((o) => Math.min(maxOffset, Math.max(0, o + dir)));
        if (algo === 'nw') setFilled((f) => Math.min(total, Math.max(0, f + dir)));
      }
      click(dir > 0 ? 990 : 550);
    },
    [mode, algo, years.length, head, windows.length, maxOffset, total, click],
  );
  const reset = () => {
    if (mode === 'time') setHead(0);
    if (mode === 'algo') {
      setKPos(0);
      setFilled(0);
      setOffset(0);
    }
    setPlaying(false);
  };
  useEffect(() => {
    if (!playing) return;
    const ms = mode === 'time' ? 60000 / tempo : algo === 'nw' ? 220 : 520;
    const id = window.setInterval(() => {
      if (mode === 'time') {
        setHead((h) => {
          const n = (h + 1) % years.length;
          setSel((s) => ({ ...s, time: n }));
          return n;
        });
        click(740);
      } else if (algo === 'kmer') {
        setKPos((p) => {
          if (p >= windows.length - 1) {
            setPlaying(false);
            return p;
          }
          return p + 1;
        });
      } else if (algo === 'nw') {
        setFilled((f) => {
          if (f >= total) {
            setPlaying(false);
            return f;
          }
          return f + 1;
        });
      }
    }, ms);
    return () => window.clearInterval(id);
  }, [playing, mode, algo, tempo, years.length, windows.length, total, click]);

  /* ── pads per mode ── */
  const kitDom = evidence[kitDomain];
  const kitSkills = kitDom?.skills ?? [];
  const kitPages = Math.max(1, Math.ceil(kitSkills.length / 16));
  const bankProjects = projects.slice(bank * 16, bank * 16 + 16);

  const pads: PadDef[] = useMemo(() => {
    const blank = (i: number): PadDef => ({ key: `blank-${i}`, label: '', disabled: true, aria: '' });
    const fill = (list: PadDef[]) => [...list, ...Array.from({ length: Math.max(0, 16 - list.length) }, (_, i) => blank(list.length + i))].slice(0, 16);
    switch (mode) {
      case 'about':
        return fill([
          ...data.stats.map((s) => ({ key: s.id, label: `${fmtNum(loc, s.value)}${s.suffix}`, sub: s.label, lit: true, color: '#ff6a13', aria: `${fmtNum(loc, s.value)}${s.suffix} ${s.label}` })),
          ...p_labels(data).map((l, i) => ({ key: `lab${i}`, label: l, lit: false, aria: l })),
          ...(['github', 'linkedin', 'orcid', 'scholar'] as const)
            .filter((x) => data.links[x])
            .map((x) => ({ key: x, label: x === 'scholar' ? 'Scholar' : x === 'orcid' ? 'ORCID' : x === 'github' ? 'GitHub' : 'LinkedIn', href: data.links[x]!, aria: x, color: '#2b2b2b' })),
        ]);
      case 'time':
        return fill(
          years.map((y) => {
            const kinds = [...new Set([...(y.education.length ? ['education'] : []), ...y.roles.map((r) => r.kind)])];
            return {
              key: `y${y.year}`,
              label: fmtYear(loc, y.year),
              sub: t('sequencer.entries', { count: y.roles.length + y.education.length }),
              lit: kinds.length > 0,
              dots: kinds.map((k2) => KIND_COLOR[k2]),
              aria: `${fmtYear(loc, y.year)}: ${t('sequencer.entries', { count: y.roles.length + y.education.length })}`,
            };
          }),
        );
      case 'patterns':
        return fill(
          bankProjects.map((p, i) => ({
            key: p.id,
            label: fmtNum(loc, bank * 16 + i + 1, { minimumIntegerDigits: 2 }),
            sub: t(`sequencer.cat.${p.category}`),
            lit: true,
            color: CAT_COLOR[p.category],
            aria: p.title,
          })),
        );
      case 'kit':
        return fill(kitSkills.slice(kitPage * 16, kitPage * 16 + 16).map((s) => ({ key: s.uid, label: s.name, lit: true, color: `oklch(0.6 0.15 ${kitDom.hue})`, aria: s.long })));
      case 'algo':
        return fill([
          { key: 'kmer', label: 'K-MER', lit: algo === 'kmer', color: '#ff6a13', aria: t('sequencer.algo.kmer') },
          { key: 'seed', label: 'SEED', lit: algo === 'seed', color: '#ff6a13', aria: t('sequencer.algo.seed') },
          { key: 'nw', label: 'ALIGN', lit: algo === 'nw', color: '#ff6a13', aria: t('sequencer.algo.nw') },
          blank(3),
          ...(algo === 'seed'
            ? mask.split('').map((c, i) => ({ key: `m${i}`, label: c, sub: `#${i + 1}`, lit: c === '1', color: '#1a9a6c', aria: `${t('sequencer.maskPos', { n: i + 1 })}: ${c === '1' ? t('sequencer.compared') : t('sequencer.ignored')}` }))
            : []),
        ]);
      case 'lab':
        return fill((lab?.groups ?? []).map((g) => ({ key: g.id, label: g.label, sub: t('sequencer.techniques', { count: g.items.length }), lit: true, color: '#b06a1d', aria: g.label })));
      case 'papers':
        return fill(data.publications.map((p, i) => ({ key: p.id, label: `P${fmtNum(loc, i + 1)}`, sub: p.year ? fmtYear(loc, p.year) : publicationLabel(t, 'pubStatus', p.status), lit: true, color: '#1f6feb', aria: p.title })));
      case 'study':
        return fill([
          ...data.education.map((e) => ({ key: e.id, label: e.degree.split(' ')[0], sub: e.institution.split(',')[0], lit: true, color: '#2b2b2b', aria: e.degree })),
          blank(3),
          ...courseYears.map(([y, list]) => ({ key: `c${y}`, label: fmtYear(loc, y), sub: t('common.count.courses', { count: list.length }), lit: true, color: '#8a4bd1', aria: `${fmtYear(loc, y)}: ${t('common.count.courses', { count: list.length })}` })),
        ]);
      case 'lang':
        return fill(data.languages.map((l) => ({ key: l.id, label: l.name, sub: l.cefr ?? l.level, lit: true, color: '#1a9a6c', aria: `${l.name}: ${l.level}` })));
      case 'mail':
        return fill([
          { key: 'email', label: '@', sub: t('common.email'), href: data.links.email, color: '#ff6a13', lit: true, aria: data.person.email },
          ...(['github', 'linkedin', 'orcid', 'scholar', 'website'] as const)
            .filter((x) => data.links[x])
            .map((x) => ({ key: x, label: x === 'website' ? 'WEB' : x.toUpperCase().slice(0, 7), href: data.links[x]!, color: '#2b2b2b', lit: true, aria: x })),
        ]);
    }
  }, [mode, data, loc, t, years, bankProjects, bank, kitSkills, kitPage, kitDom, algo, mask, lab, courseYears]);

  const pressPad = (i: number) => {
    const p = pads[i];
    if (!p || p.disabled) return;
    if (mode === 'algo') {
      if (i < 3) {
        setAlgo((['kmer', 'seed', 'nw'] as const)[i]);
        setLive(p.aria);
      } else if (algo === 'seed' && i >= 4) {
        const j = i - 4;
        const next = mask.slice(0, j) + (mask[j] === '1' ? '0' : '1') + mask.slice(j + 1);
        if (next.includes('1')) setMask(next);
        setLive(`${t('sequencer.maskPos', { n: j + 1 })}: ${next[j] === '1' ? t('sequencer.compared') : t('sequencer.ignored')}`);
      }
      click();
      return;
    }
    if (mode === 'time') setHead(i);
    choose(i, p.aria);
  };

  const onPadKey = (e: KeyboardEvent, i: number) => {
    const dx = e.key === 'ArrowRight' ? 1 : e.key === 'ArrowLeft' ? -1 : 0;
    const dy = e.key === 'ArrowDown' ? 1 : e.key === 'ArrowUp' ? -1 : 0;
    if (!dx && !dy && e.key !== 'Home' && e.key !== 'End') return;
    e.preventDefault();
    let n = i;
    if (e.key === 'Home') n = 0;
    else if (e.key === 'End') n = 15;
    else {
      const r = Math.floor(i / 4);
      const c = i % 4;
      const nc = Math.min(3, Math.max(0, c + dx * (rtl ? -1 : 1)));
      const nr = Math.min(3, Math.max(0, r + dy));
      n = nr * 4 + nc;
    }
    setFocus(n);
    padRefs.current[n]?.focus();
  };

  /* ── display ── */
  const display: { title: ReactNode; body: ReactNode } = (() => {
    switch (mode) {
      case 'about': {
        const s = data.stats[selected];
        return {
          title: data.person.displayName,
          body: (
            <>
              <p>{data.person.headline}</p>
              <p className="seq-dim mt-2">{data.person.status}</p>
              {s && (
                <p className="mt-3">
                  <span className="seq-big">
                    {fmtNum(loc, s.value)}
                    {s.suffix}
                  </span>{' '}
                  {s.label}
                </p>
              )}
              <div className="seq-marquee mt-3" aria-hidden={!reduce}>
                <span>{data.person.availability}</span>
              </div>
            </>
          ),
        };
      }
      case 'time': {
        const y = years[Math.min(selected, years.length - 1)];
        const entries = [...y.education.map((e) => ({ id: e.id, k: 'education', text: `${e.degree} — ${e.institution}` })), ...y.roles.map((r) => ({ id: r.id, k: r.kind as string, text: `${r.role} — ${r.org}` }))];
        return {
          title: (
            <span>
              {fmtYear(loc, y.year)} <span className="seq-dim text-[0.5em]">{t('sequencer.entries', { count: entries.length })}</span>
            </span>
          ),
          body: (
            <>
              <ul className="space-y-1">
                {entries.map((e) => (
                  <li key={e.id} className="flex gap-2">
                    <span className="mt-[0.45em] size-2 shrink-0 rounded-full" style={{ background: e.k === 'education' ? '#e8e6e1' : KIND_COLOR[e.k] }} aria-hidden />
                    <span>{e.text}</span>
                  </li>
                ))}
                {!entries.length && <li className="seq-dim">{t('sequencer.quiet')}</li>}
              </ul>
              {(y.courses.length > 0 || y.publications.length > 0) && (
                <p className="seq-dim mt-2">
                  {[y.courses.length ? t('common.count.courses', { count: y.courses.length }) : null, y.publications.length ? t('sequencer.pubs', { count: y.publications.length }) : null].filter(Boolean).join(' · ')}
                </p>
              )}
            </>
          ),
        };
      }
      case 'patterns': {
        const p = bankProjects[Math.min(selected, bankProjects.length - 1)];
        if (!p) return { title: '—', body: null };
        return {
          title: <span dir="auto">{p.title}</span>,
          body: (
            <>
              <p>
                {t(`categories.${p.category}`)}
                {p.metric ? (
                  <>
                    {' · '}
                    <bdi dir="ltr">{p.metric}</bdi>
                  </>
                ) : null}
              </p>
              {p.tags.length > 0 && (
                <p className="seq-dim mt-1" dir="ltr">
                  {p.tags.join(' · ')}
                </p>
              )}
              <p className="mt-2 line-clamp-3" dir="auto">
                {p.description}
              </p>
              {(p.repo || p.url) && (
                <a href={(p.repo || p.url)!} target="_blank" rel="noreferrer" className="seq-open mt-3 inline-flex items-center gap-1.5">
                  {t('sequencer.open')} <ArrowUpRight className="size-4" aria-hidden />
                </a>
              )}
            </>
          ),
        };
      }
      case 'kit': {
        const s = kitSkills[kitPage * 16 + Math.min(selected, 15)];
        const n = s ? skillProjects(s, projects).length : 0;
        return {
          title: t(`domains.${kitDom.id}`),
          body: (
            <>
              <p className="seq-dim">
                {t('common.count.skills', { count: kitSkills.length })} · {t('sequencer.page', { n: kitPage + 1, m: kitPages })}
              </p>
              {s && (
                <>
                  <p className="seq-big mt-3">
                    <bdi>{s.name}</bdi>
                  </p>
                  {s.long !== s.name && (
                    <p>
                      <bdi>{s.long}</bdi>
                    </p>
                  )}
                  <p className="seq-dim mt-1">
                    {s.groupLabel}
                    {n ? ` · ${t('sequencer.usedIn', { count: n })}` : ''}
                  </p>
                </>
              )}
            </>
          ),
        };
      }
      case 'algo':
        return { title: t(`sequencer.algo.${algo}`), body: algoView() };
      case 'lab': {
        const g = lab?.groups[Math.min(selected, (lab?.groups.length ?? 1) - 1)];
        return {
          title: g?.label ?? '—',
          body: (
            <p className="leading-relaxed">
              {g?.items.map((it, i) => (
                <span key={it.key}>
                  {i > 0 && <span className="seq-dim"> · </span>}
                  <bdi>{it.name}</bdi>
                </span>
              ))}
            </p>
          ),
        };
      }
      case 'papers': {
        const p = data.publications[Math.min(selected, data.publications.length - 1)];
        return {
          title: `${publicationLabel(t, 'pubType', p.type)} · ${publicationLabel(t, 'pubStatus', p.status)}`,
          body: (
            <>
              <p lang="en" dir="ltr" className="text-start">
                {p.title}
              </p>
              {p.venue && (
                <p className="seq-dim mt-1" lang="en" dir="ltr">
                  {p.venue}
                  {p.publisher ? `, ${p.publisher}` : ''}
                </p>
              )}
              {p.url && (
                <a href={p.url} target="_blank" rel="noreferrer" className="seq-open mt-3 inline-flex items-center gap-1.5" dir="ltr">
                  {p.doi ? `doi:${p.doi}` : t('common.visit')} <ArrowUpRight className="size-4" aria-hidden />
                </a>
              )}
            </>
          ),
        };
      }
      case 'study': {
        if (selected < data.education.length) {
          const e = data.education[selected];
          return {
            title: e.degree,
            body: (
              <>
                <p>{e.institution}</p>
                <p className="seq-dim mt-1">
                  {e.period} · {e.location}
                  {e.gpa ? (
                    <>
                      {' · '}
                      {t('common.gpa')} <bdi dir="ltr">{e.gpa}</bdi>
                    </>
                  ) : null}
                </p>
              </>
            ),
          };
        }
        const cy = courseYears[selected - 4];
        if (!cy) return { title: '—', body: null };
        const hours = cy[1].reduce((n, c) => n + (c.hours ?? 0), 0);
        return {
          title: `${fmtYear(loc, cy[0])} · ${t('common.hours', { count: fmtNum(loc, hours) })}`,
          body: (
            <ul className="space-y-0.5">
              {cy[1].map((c) => (
                <li key={c.name + c.issuer}>
                  <bdi lang="en">{c.name}</bdi> <span className="seq-dim">— {c.issuer}</span>
                </li>
              ))}
            </ul>
          ),
        };
      }
      case 'lang': {
        const l = data.languages[Math.min(selected, data.languages.length - 1)];
        return {
          title: l.name,
          body: (
            <>
              <p>{l.level}</p>
              {l.cert && (
                <p className="seq-dim mt-2">
                  {l.cert.test} {fmtNum(loc, l.cert.overall, { minimumFractionDigits: 1 })} — {(['listening', 'reading', 'writing', 'speaking'] as const).map((k2) => `${t(`ielts.${k2}`)} ${fmtNum(loc, l.cert!.bands[k2], { minimumFractionDigits: 1 })}`).join(' · ')}
                </p>
              )}
            </>
          ),
        };
      }
      case 'mail':
        return {
          title: t('sequencer.mailTitle'),
          body: (
            <>
              <p className="seq-big break-all" dir="ltr">
                {data.person.email}
              </p>
              <p className="mt-2">{data.person.availability}</p>
            </>
          ),
        };
    }
  })();

  function algoView() {
    if (algo === 'kmer') {
      const w = windows[kIdx];
      return (
        <div dir="ltr" className="text-start">
          <p className="seq-seq flex flex-wrap" aria-label={t('sequencer.sequence')}>
            {SEQ_K.split('').map((c, i) => (
              <span key={i} className={cn('seq-base', i >= kIdx && i < kIdx + k && 'seq-base-on')}>
                {c}
              </span>
            ))}
          </p>
          <p className="mt-2">
            k = {k} · {t('sequencer.window', { n: kIdx + 1, m: windows.length })} · <b className="seq-hi">{w}</b>
          </p>
          <table className="seq-table mt-2">
            <caption className="sr-only">{t('sequencer.kmerTable')}</caption>
            <tbody>
              {counts.slice(0, 8).map(([km, n]) => (
                <tr key={km} className={km === w ? 'seq-hi' : undefined}>
                  <th scope="row">{km}</th>
                  <td>{'▮'.repeat(n)}</td>
                  <td>{n}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <p className="seq-dim mt-1">{t('sequencer.distinct', { n: counts.length })}</p>
        </div>
      );
    }
    if (algo === 'seed') {
      return (
        <div dir="ltr" className="text-start">
          <div className="seq-seedgrid" style={{ gridTemplateColumns: `4.5rem repeat(${mask.length}, 1.6rem)` }}>
            <span className="seq-dim">mask</span>
            {seed.cells.map((c) => (
              <span key={`m${c.i}`} className={c.compared ? 'seq-hi' : 'seq-dim'}>
                {c.compared ? '1' : '0'}
              </span>
            ))}
            <span className="seq-dim">query</span>
            {seed.cells.map((c) => (
              <span key={`q${c.i}`}>{c.q}</span>
            ))}
            <span className="seq-dim">target</span>
            {seed.cells.map((c) => (
              <span key={`t${c.i}`} className={c.compared ? (c.match ? 'seq-ok' : 'seq-bad') : 'seq-dim'}>
                {c.t || '·'}
              </span>
            ))}
            <span />
            {seed.cells.map((c) => (
              <span key={`r${c.i}`} className="text-[0.8em]" aria-hidden>
                {c.compared ? (c.match ? '✓' : '✗') : '·'}
              </span>
            ))}
          </div>
          <p className="mt-2">
            offset {offset} · <b className={seed.hit ? 'seq-ok' : 'seq-bad'}>{seed.hit ? t('sequencer.hit') : t('sequencer.miss')}</b> · {t('sequencer.weight', { n: seed.weight })}
          </p>
          <p className="seq-dim mt-1">
            {t('sequencer.hitsAt')}: {hits.length ? hits.join(', ') : '—'}
          </p>
          <p className="seq-dim mt-1 break-all">target: {SEED_T}</p>
        </div>
      );
    }
    const cellsShown = new Set(order.slice(0, filled).map(([i, j]) => `${i},${j}`));
    const cur = filled > 0 && filled <= total ? order[filled - 1] : null;
    const onPath = new Set(trace?.path.map(([i, j]) => `${i},${j}`) ?? []);
    return (
      <div dir="ltr" className="text-start">
        <table className="seq-matrix">
          <caption className="sr-only">{t('sequencer.matrix')}</caption>
          <thead>
            <tr>
              <th />
              <th scope="col">-</th>
              {NW_B.split('').map((c, j) => (
                <th key={j} scope="col">
                  {c}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {nw.H.map((row, i) => (
              <tr key={i}>
                <th scope="row">{i === 0 ? '-' : NW_A[i - 1]}</th>
                {row.map((v, j) => {
                  const key = `${i},${j}`;
                  const shownCell = cellsShown.has(key);
                  return (
                    <td key={j} className={cn(onPath.has(key) && 'seq-path', cur && cur[0] === i && cur[1] === j && 'seq-cur')}>
                      {shownCell ? v : ''}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
        <p className="mt-2">
          {t('sequencer.cells', { n: Math.min(filled, total), m: total })}
          {trace && (
            <>
              {' · '}
              {t('sequencer.score')} <b className="seq-hi">{trace.score}</b>
            </>
          )}
        </p>
        {trace && (
          <pre className="seq-align mt-1">
            {trace.alignA}
            {'\n'}
            {trace.alignA
              .split('')
              .map((c, x) => (c === trace.alignB[x] ? '|' : c === '-' || trace.alignB[x] === '-' ? ' ' : '·'))
              .join('')}
            {'\n'}
            {trace.alignB}
          </pre>
        )}
      </div>
    );
  }

  /* ── knobs per mode ── */
  const knobs: Array<{ label: string; value: number; min: number; max: number; onChange?: (v: number) => void; valueText?: string; disabled?: boolean }> =
    mode === 'time'
      ? [{ label: t('sequencer.knob.tempo'), value: tempo, min: 60, max: 180, onChange: setTempo, valueText: `${tempo} bpm` }]
      : mode === 'kit'
        ? [
            {
              label: t('sequencer.knob.domain'),
              value: kitDomain,
              min: 0,
              max: evidence.length - 1,
              onChange: (v) => {
                setKitDomain(v);
                setKitPage(0);
                setSel((s) => ({ ...s, kit: 0 }));
                setLive(t(`domains.${evidence[v].id}`));
              },
              valueText: t(`domains.${evidence[kitDomain].id}`),
            },
          ]
        : mode === 'algo' && algo === 'kmer'
          ? [{ label: 'k', value: k, min: 2, max: 6, onChange: (v) => (setK(v), setKPos(0)), valueText: `k = ${k}` }]
          : mode === 'algo' && algo === 'seed'
            ? [{ label: t('sequencer.knob.offset'), value: offset, min: 0, max: maxOffset, onChange: setOffset, valueText: String(offset) }]
            : mode === 'algo' && algo === 'nw'
              ? [
                  { label: t('sequencer.knob.match'), value: score.match, min: 1, max: 3, onChange: (v) => setScore((s) => ({ ...s, match: v })), valueText: `+${score.match}` },
                  { label: t('sequencer.knob.mismatch'), value: score.mismatch, min: -3, max: 0, onChange: (v) => setScore((s) => ({ ...s, mismatch: v })), valueText: String(score.mismatch) },
                  { label: t('sequencer.knob.gap'), value: score.gap, min: -3, max: -1, onChange: (v) => setScore((s) => ({ ...s, gap: v })), valueText: String(score.gap) },
                ]
              : [];
  while (knobs.length < 3) knobs.push({ label: '—', value: 0, min: 0, max: 1, disabled: true });

  const banksFor = mode === 'patterns' ? Math.ceil(projects.length / 16) : mode === 'kit' ? kitPages : 0;
  const bankValue = mode === 'patterns' ? bank : kitPage;
  const hasTransport = mode === 'time' || mode === 'algo';

  return (
    <div className="seq-device relative mx-auto max-w-[1180px] rounded-[30px] p-4 sm:p-7">
      {/* top strip */}
      <div className="mb-5 flex flex-wrap items-center gap-3">
        <p className="seq-label text-[11px] font-semibold uppercase tracking-[0.2em] text-[#2b2b2b] rtl:normal-case rtl:tracking-normal">
          RY-16 <span className="text-[#6b6b66]">· {t('sequencer.deviceName')}</span>
        </p>
        <span className={cn('size-2.5 rounded-full', playing ? 'seq-led-on' : 'bg-[#bdb8ae]')} aria-hidden />
        <button
          type="button"
          aria-pressed={sound}
          onClick={() => setSound((s) => !s)}
          className="seq-key-light ms-auto inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[11px] font-semibold uppercase rtl:normal-case"
        >
          {sound ? <Volume2 className="size-3.5" aria-hidden /> : <VolumeX className="size-3.5" aria-hidden />}
          {t('sequencer.sound')}
        </button>
      </div>

      <div id="seq-panel" role="tabpanel" aria-labelledby={`seq-tab-${mode}`} className="grid gap-6 lg:grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)]">
        <div className="min-w-0">
          <div className="seq-screen relative min-h-[300px] overflow-hidden rounded-[16px] p-5 sm:min-h-[340px]">
            <p className="seq-label mb-2 flex justify-between text-[10.5px] uppercase tracking-[0.18em] text-[#9cff57]/70 rtl:normal-case rtl:tracking-normal">
              <span>{t(`sequencer.modes.${mode}`)}</span>
              {mode === 'patterns' && <span lang="en">BANK {'ABC'[bank]}</span>}
              {mode === 'time' && playing && <span>▶ {tempo} bpm</span>}
            </p>
            <div className="seq-lcd">
              <p className="seq-title">{display.title}</p>
              <div className="seq-body mt-2">{display.body}</div>
            </div>
          </div>
          <div className="mt-5 flex items-start justify-around gap-2 sm:justify-start sm:gap-8 sm:ps-4">
            {knobs.map((kn, i) => (
              <Knob key={i} label={kn.label} value={kn.value} min={kn.min} max={kn.max} onChange={kn.onChange} valueText={kn.valueText} disabled={kn.disabled} />
            ))}
          </div>
        </div>

        <div className="min-w-0">
          <div className="seq-pads grid grid-cols-4 gap-2.5 sm:gap-3" aria-label={t('sequencer.padsLabel')}>
            {pads.map((p, i) => {
              const isSel = !p.disabled && !p.href && (mode === 'algo' ? (i < 3 ? p.lit : false) : i === selected);
              const isHead = mode === 'time' && playing && i === head;
              const common = cn('seq-pad relative flex aspect-square flex-col justify-between rounded-[12px] p-2 text-start', p.disabled && 'seq-pad-off', p.lit && 'seq-pad-lit', isSel && 'seq-pad-sel', isHead && 'seq-pad-head');
              const inner = (
                <>
                  <span className={cn('seq-label pe-4 text-[11.5px] font-semibold leading-tight [overflow-wrap:anywhere]', p.sub ? 'line-clamp-2' : 'line-clamp-4')}>
                    {p.label}
                  </span>
                  {p.sub && <span className="seq-label line-clamp-2 text-[9.5px] leading-tight text-[#5a5a55]">{p.sub}</span>}
                  {(p.dots?.length || (p.lit && p.color)) && (
                    <span className="absolute end-2 top-2 flex gap-0.5" aria-hidden>
                      {(p.dots ?? [p.color!]).map((c, d) => (
                        <span key={d} className="size-2 rounded-full" style={{ background: c, boxShadow: `0 0 6px ${c}` }} />
                      ))}
                    </span>
                  )}
                </>
              );
              const style = p.color ? ({ '--pad': p.color } as React.CSSProperties) : undefined;
              const ref = (el: HTMLElement | null) => {
                padRefs.current[i] = el;
              };
              return p.href ? (
                <a key={p.key} ref={ref} href={p.href} target={p.href.startsWith('mailto:') ? undefined : '_blank'} rel="noreferrer" aria-label={p.aria} tabIndex={focus === i ? 0 : -1} onKeyDown={(e) => onPadKey(e, i)} onFocus={() => setFocus(i)} className={common} style={style}>
                  {inner}
                </a>
              ) : (
                <button
                  key={p.key}
                  ref={ref}
                  type="button"
                  aria-label={p.disabled ? t('sequencer.emptyPad') : p.aria}
                  aria-pressed={p.disabled ? undefined : isSel}
                  aria-disabled={p.disabled || undefined}
                  tabIndex={focus === i ? 0 : -1}
                  onClick={() => pressPad(i)}
                  onKeyDown={(e) => onPadKey(e, i)}
                  onFocus={() => setFocus(i)}
                  className={common}
                  style={style}
                >
                  {inner}
                </button>
              );
            })}
          </div>

          {(hasTransport || banksFor > 1) && (
            <div className="mt-4 flex flex-wrap items-center gap-2">
              {hasTransport && (
                <>
                  <button type="button" onClick={() => step(-1)} aria-label={t('common.back')} className="seq-key grid size-11 place-items-center rounded-[10px]">
                    <SkipBack className="flip-rtl size-4" aria-hidden />
                  </button>
                  {canPlay && (
                    <button type="button" onClick={() => setPlaying((p) => !p)} aria-pressed={playing} aria-label={playing ? t('common.pause') : t('common.play')} className="seq-key-accent grid size-11 place-items-center rounded-[10px]">
                      {playing ? <Pause className="size-4" aria-hidden /> : <Play className="flip-rtl size-4" aria-hidden />}
                    </button>
                  )}
                  <button type="button" onClick={() => step(1)} aria-label={t('common.step')} className="seq-key grid size-11 place-items-center rounded-[10px]">
                    <SkipForward className="flip-rtl size-4" aria-hidden />
                  </button>
                  <button type="button" onClick={reset} aria-label={t('common.reset')} className="seq-key grid size-11 place-items-center rounded-[10px]">
                    <RotateCcw className="size-4" aria-hidden />
                  </button>
                </>
              )}
              {banksFor > 1 && (
                <div role="group" aria-label={mode === 'patterns' ? t('sequencer.banks') : t('sequencer.pages')} className="ms-auto flex gap-2">
                  {Array.from({ length: banksFor }, (_, b) => (
                    <button
                      key={b}
                      type="button"
                      aria-pressed={bankValue === b}
                      onClick={() => {
                        if (mode === 'patterns') setBank(b);
                        else setKitPage(b);
                        setSel((s) => ({ ...s, [mode]: 0 }));
                        click(520 + b * 80);
                      }}
                      className={cn('seq-label grid h-11 min-w-11 place-items-center rounded-[10px] px-3 text-[13px] font-bold', bankValue === b ? 'seq-key-accent' : 'seq-key')}
                    >
                      <span lang="en">{mode === 'patterns' ? 'ABC'[b] : fmtNum(loc, b + 1)}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* mode keys */}
      <div role="tablist" aria-label={t('sequencer.modesLabel')} className="mt-6 grid grid-cols-5 gap-2 sm:grid-cols-10">
        {MODES.map((m, i) => (
          <button
            key={m}
            id={`seq-tab-${m}`}
            role="tab"
            type="button"
            aria-selected={mode === m}
            aria-controls="seq-panel"
            tabIndex={mode === m ? 0 : -1}
            onClick={() => {
              setMode(m);
              setFocus(0);
              setLive(t(`sequencer.modes.${m}`));
              click(440 + i * 40);
            }}
            onKeyDown={(e) => {
              const d = e.key === 'ArrowRight' ? 1 : e.key === 'ArrowLeft' ? -1 : 0;
              if (!d && e.key !== 'Home' && e.key !== 'End') return;
              e.preventDefault();
              const n = e.key === 'Home' ? 0 : e.key === 'End' ? MODES.length - 1 : (i + d * (rtl ? -1 : 1) + MODES.length) % MODES.length;
              setMode(MODES[n]);
              setFocus(0);
              setLive(t(`sequencer.modes.${MODES[n]}`));
              document.getElementById(`seq-tab-${MODES[n]}`)?.focus();
            }}
            className={cn('seq-label h-11 truncate rounded-[10px] px-1 text-[10.5px] font-bold uppercase tracking-[0.06em] rtl:normal-case rtl:tracking-normal', mode === m ? 'seq-key-accent' : 'seq-key')}
          >
            {t(`sequencer.modes.${m}`)}
          </button>
        ))}
      </div>
      <p className="sr-only" aria-live="polite">
        {live}
      </p>
    </div>
  );
}

function p_labels(data: SiteData) {
  return data.person.labels.slice(0, 4);
}
