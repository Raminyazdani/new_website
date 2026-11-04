'use client';

import { useEffect, useRef, useState, type ReactNode } from 'react';
import { useTranslations } from 'next-intl';
import { BrandIcon } from '@/components/shared/BrandIcon';
import { useLocaleSwitch } from '@/components/shared/useLocaleSwitch';
import { useRouter } from '@/i18n/navigation';
import { routing, type Locale } from '@/i18n/routing';
import { designIds } from '@/lib/designs';
import type { SiteData } from '@/lib/types';
import { Pane } from './PipelineDesign';

type Line = { kind: 'in' | 'out' | 'err'; node: ReactNode };
const COMMANDS = ['help', 'whoami', 'now', 'email', 'github', 'linkedin', 'orcid', 'scholar', 'lang', 'design', 'clear'] as const;

export function Shell({ data }: { data: SiteData }) {
  const t = useTranslations('pipeline');
  const router = useRouter();
  const { switchTo } = useLocaleSwitch();
  const [lines, setLines] = useState<Line[]>([{ kind: 'out', node: t('shellWelcome') }]);
  const [value, setValue] = useState('');
  const [history, setHistory] = useState<string[]>([]);
  const [hIdx, setHIdx] = useState(-1);
  const boxRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    boxRef.current?.scrollTo({ top: boxRef.current.scrollHeight, behavior: 'smooth' });
  }, [lines]);

  const open = (label: string, href: string | null) => {
    if (!href) return [{ kind: 'err', node: 'n/a' } as Line];
    window.open(href, '_blank', 'noopener');
    return [{ kind: 'out', node: t('opening', { target: label }) } as Line];
  };

  const run = (raw: string) => {
    const cmd = raw.trim();
    if (!cmd) return;
    const [name, arg] = cmd.split(/\s+/);
    const out: Line[] = [];
    switch (name.toLowerCase()) {
      case 'help':
        out.push({
          kind: 'out',
          node: (
            <div>
              <p className="text-[#8b98a8]">{t('helpTitle')}:</p>
              {COMMANDS.map((c) => (
                <p key={c}>
                  <span className="inline-block w-24 text-[#7ee787]">{c}</span>
                  <span className="text-[#8b98a8]">{t(`cmd.${c}`)}</span>
                </p>
              ))}
            </div>
          ),
        });
        break;
      case 'whoami':
        out.push({ kind: 'out', node: <span dir={data.dir}>{data.person.statement}</span> });
        break;
      case 'now':
        data.current.forEach((e) => out.push({ kind: 'out', node: <bdi>{`• ${e.role} — ${e.org}`}</bdi> }));
        break;
      case 'email':
        out.push({
          kind: 'out',
          node: (
            <a href={data.links.email} className="text-[#58a6ff] underline">
              {data.person.email}
            </a>
          ),
        });
        break;
      case 'github':
        out.push(...open('GitHub', data.links.github));
        break;
      case 'linkedin':
        out.push(...open('LinkedIn', data.links.linkedin));
        break;
      case 'orcid':
        out.push(...open('ORCID', data.links.orcid));
        break;
      case 'scholar':
        out.push(...open('Google Scholar', data.links.scholar));
        break;
      case 'lang':
        if (arg && (routing.locales as readonly string[]).includes(arg)) {
          out.push({ kind: 'out', node: `→ ${arg}` });
          window.setTimeout(() => switchTo(arg as Locale), 250);
        } else out.push({ kind: 'err', node: `usage: lang ${routing.locales.join('|')}` });
        break;
      case 'design':
        if (arg && (designIds as readonly string[]).includes(arg)) {
          out.push({ kind: 'out', node: `→ /${arg}` });
          window.setTimeout(() => router.push(`/${arg}`), 250);
        } else out.push({ kind: 'err', node: `usage: design ${designIds.join('|')}` });
        break;
      case 'clear':
        setLines([]);
        return;
      case 'sudo':
        out.push({ kind: 'err', node: 'permission denied: nice try.' });
        break;
      default:
        out.push({ kind: 'err', node: t('notFound', { cmd: name }) });
    }
    setLines((prev) => [...prev, { kind: 'in', node: cmd }, ...out]);
    setHistory((h) => [cmd, ...h].slice(0, 30));
    setHIdx(-1);
  };

  return (
    <Pane id="contact" file="contact.sh">
      <p className="mb-4 text-[15px] text-[#c9d6e3]">{data.person.availability}</p>
      <div className="mb-4 flex flex-wrap gap-2">
        {COMMANDS.filter((c) => !['lang', 'design', 'clear'].includes(c)).map((c) => (
          <button
            key={c}
            type="button"
            onClick={() => {
              run(c);
              inputRef.current?.focus({ preventScroll: true });
            }}
            className="rounded-md border border-[#30363d] bg-[#161b22] px-2.5 py-1 font-mono text-[12px] text-[#c9d6e3] transition hover:border-[#7ee787] hover:text-white"
          >
            {c}
          </button>
        ))}
      </div>
      <div
        ref={boxRef}
        dir="ltr"
        onClick={() => inputRef.current?.focus({ preventScroll: true })}
        className="h-80 overflow-y-auto rounded-lg border border-[#30363d] bg-[#010409] p-4 font-mono text-[13px] leading-6"
      >
        <p className="text-[#5c6773]">{t('shellHint')}</p>
        {lines.map((l, i) => (
          <div key={i} className={l.kind === 'err' ? 'text-[#ff7b72]' : l.kind === 'in' ? 'text-white' : 'text-[#c9d6e3]'}>
            {l.kind === 'in' && <span className="text-[#7ee787]">❯ </span>}
            {l.node}
          </div>
        ))}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            run(value);
            setValue('');
          }}
          className="flex items-center"
        >
          <span className="text-[#7ee787]">❯&nbsp;</span>
          <input
            ref={inputRef}
            value={value}
            onChange={(e) => setValue(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'ArrowUp' && history.length) {
                e.preventDefault();
                const n = Math.min(hIdx + 1, history.length - 1);
                setHIdx(n);
                setValue(history[n]);
              } else if (e.key === 'ArrowDown') {
                e.preventDefault();
                const n = Math.max(hIdx - 1, -1);
                setHIdx(n);
                setValue(n === -1 ? '' : history[n]);
              } else if (e.key === 'Tab') {
                e.preventDefault();
                const hit = COMMANDS.find((c) => c.startsWith(value));
                if (hit) setValue(hit);
              }
            }}
            aria-label="shell input"
            autoComplete="off"
            spellCheck={false}
            className="flex-1 bg-transparent text-white caret-[#7ee787] outline-none"
          />
        </form>
      </div>
      <div className="mt-5 flex flex-wrap gap-3 text-[13px]">
        {(['github', 'linkedin', 'orcid', 'scholar'] as const).map((k) =>
          data.links[k] ? (
            <a key={k} href={data.links[k]!} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 rounded-md border border-[#30363d] px-3 py-2 text-[#c9d6e3] transition hover:border-[#8b98a8] hover:text-white">
              <BrandIcon name={k} className="size-4" />
              {k === 'scholar' ? 'Scholar' : k === 'orcid' ? 'ORCID' : k === 'github' ? 'GitHub' : 'LinkedIn'}
            </a>
          ) : null,
        )}
      </div>
    </Pane>
  );
}
