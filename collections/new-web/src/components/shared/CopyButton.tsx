'use client';

import { useState, type ReactNode } from 'react';
import { useTranslations } from 'next-intl';
import { cn } from '@/lib/utils';

export function CopyButton({
  value,
  className,
  children,
  copiedLabel,
}: {
  value: string;
  className?: string;
  children?: ReactNode;
  copiedLabel?: ReactNode;
}) {
  const t = useTranslations('common');
  const [copied, setCopied] = useState(false);
  return (
    <button
      type="button"
      className={cn(className)}
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(value);
        } catch {
          const ta = document.createElement('textarea');
          ta.value = value;
          document.body.appendChild(ta);
          ta.select();
          document.execCommand('copy');
          ta.remove();
        }
        setCopied(true);
        window.setTimeout(() => setCopied(false), 1800);
      }}
      aria-live="polite"
    >
      {copied ? (copiedLabel ?? t('copied')) : (children ?? t('copyEmail'))}
    </button>
  );
}
