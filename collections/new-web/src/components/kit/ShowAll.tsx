'use client';

import { useState, type ElementType, type ReactNode } from 'react';
import { useTranslations } from 'next-intl';
import { cn } from '@/lib/utils';

/**
 * A list that shows the first `initial` items and reveals the rest with "Show all N".
 * Hidden items stay in the DOM with the `hidden` attribute, so nothing is ever dropped.
 */
export function ShowAll<T>({
  items,
  initial,
  render,
  getKey,
  as: Tag = 'ul',
  className,
  buttonClassName,
  buttonWrapClassName,
  labels,
}: {
  items: T[];
  initial: number;
  render: (item: T, index: number) => ReactNode;
  getKey: (item: T, index: number) => string;
  as?: ElementType;
  className?: string;
  buttonClassName?: string;
  buttonWrapClassName?: string;
  labels?: { more?: string; less?: string };
}) {
  const t = useTranslations('common');
  const [open, setOpen] = useState(false);
  const Item = Tag === 'ul' || Tag === 'ol' ? 'li' : 'div';
  return (
    <>
      <Tag className={className}>
        {items.map((it, i) => (
          <Item key={getKey(it, i)} hidden={!open && i >= initial ? true : undefined}>
            {render(it, i)}
          </Item>
        ))}
      </Tag>
      {items.length > initial && (
        <div className={buttonWrapClassName}>
          <button type="button" data-kit-more="" aria-expanded={open} onClick={() => setOpen((v) => !v)} className={cn(buttonClassName)}>
            {open ? (labels?.less ?? t('showFewer')) : (labels?.more ?? t('showAll', { count: items.length }))}
          </button>
        </div>
      )}
    </>
  );
}
