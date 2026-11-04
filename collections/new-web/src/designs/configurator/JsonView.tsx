'use client';

import { useMemo, type ReactNode } from 'react';
import { useTranslations } from 'next-intl';
import { Check, Copy, Download } from 'lucide-react';
import { useState } from 'react';
import { downloadJson } from '@/lib/utils';

/** minimal JSON syntax highlighting: keys, strings, numbers, booleans/null */
function highlight(src: string): ReactNode[] {
  const out: ReactNode[] = [];
  const re = /("(?:\\.|[^"\\])*")(\s*:)?|\b(true|false|null)\b|(-?\d+(?:\.\d+)?(?:[eE][+-]?\d+)?)/g;
  let last = 0;
  let m: RegExpExecArray | null;
  let k = 0;
  while ((m = re.exec(src))) {
    if (m.index > last) out.push(src.slice(last, m.index));
    if (m[1] && m[2]) {
      out.push(
        <span key={k++} className="text-[#0a4fa8]">
          {m[1]}
        </span>,
        m[2],
      );
    } else if (m[1]) out.push(<span key={k++} className="text-[#1a7f37]">{m[1]}</span>);
    else if (m[3]) out.push(<span key={k++} className="text-[#a1146b]">{m[3]}</span>);
    else out.push(<span key={k++} className="text-[#b35900]">{m[4]}</span>);
    last = re.lastIndex;
  }
  if (last < src.length) out.push(src.slice(last));
  return out;
}

export function JsonView({ json, filename }: { json: string; filename: string }) {
  const t = useTranslations();
  const [copied, setCopied] = useState(false);
  const nodes = useMemo(() => highlight(json), [json]);
  return (
    <div className="overflow-hidden rounded-[22px] border border-[#d2d2d7] bg-white">
      <div className="flex flex-wrap items-center gap-2 border-b border-[#e5e5ea] bg-[#f5f5f7] px-5 py-3">
        <p className="cfg-mono mr-auto text-[13px] text-[#6e6e73] rtl:ml-auto rtl:mr-0" dir="ltr">
          {filename} · {new Intl.NumberFormat('en').format(json.length)} B
        </p>
        <button
          type="button"
          onClick={() => {
            navigator.clipboard?.writeText(json).then(() => {
              setCopied(true);
              setTimeout(() => setCopied(false), 1600);
            });
          }}
          className="inline-flex items-center gap-1.5 rounded-full border border-[#d2d2d7] bg-white px-3.5 py-1.5 text-[13px] font-medium hover:border-[#0a66d8]"
        >
          {copied ? <Check className="size-3.5 text-[#1a7f37]" aria-hidden /> : <Copy className="size-3.5" aria-hidden />}
          {copied ? t('common.copied') : t('configurator.copyJson')}
        </button>
        <button type="button" onClick={() => downloadJson(json, filename)} className="inline-flex items-center gap-1.5 rounded-full bg-[#0a66d8] px-3.5 py-1.5 text-[13px] font-medium text-white hover:bg-[#0858bd]">
          <Download className="size-3.5" aria-hidden /> {t('common.download')}
        </button>
      </div>
      <pre dir="ltr" lang="en" tabIndex={0} aria-label={filename} className="cfg-mono relative max-h-[78vh] overflow-auto p-5 text-[12.5px] leading-[1.6] text-[#1d1d1f]">
        <code>{nodes}</code>
      </pre>
    </div>
  );
}
