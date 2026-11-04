'use client';

import { useId, useState, type CSSProperties, type ElementType } from 'react';
import { useTranslations } from 'next-intl';
import { cn } from '@/lib/utils';

/**
 * Long text that starts clamped to `lines` lines and opens with a "Show more" button.
 * The full text is always in the DOM (search engines, screen readers, the QA content check).
 * Short texts (≤ minChars) render without a button.
 */
export function Expandable({
  text,
  lines = 3,
  minChars = 170,
  as: Tag = 'p',
  className,
  buttonClassName,
  lang,
}: {
  text: string;
  lines?: number;
  minChars?: number;
  as?: ElementType;
  className?: string;
  buttonClassName?: string;
  lang?: string;
}) {
  const t = useTranslations('common');
  const [open, setOpen] = useState(false);
  const id = useId();
  const long = text.length > minChars;
  const clamp: CSSProperties | undefined =
    long && !open ? { display: '-webkit-box', WebkitLineClamp: lines, WebkitBoxOrient: 'vertical', overflow: 'hidden' } : undefined;
  return (
    <>
      {/* dir=auto: untranslated (English) texts keep their own direction inside Persian pages */}
      <Tag id={id} className={className} style={clamp} lang={lang} dir="auto">
        {text}
      </Tag>
      {long && (
        <button
          type="button"
          data-kit-more=""
          aria-expanded={open}
          aria-controls={id}
          onClick={() => setOpen((v) => !v)}
          className={cn('mt-1 text-start underline decoration-1 underline-offset-4', buttonClassName)}
        >
          {open ? t('less') : t('more')}
        </button>
      )}
    </>
  );
}
