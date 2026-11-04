'use client';

import { useLocale, useTranslations } from 'next-intl';
import { fmtNum } from '@/lib/format';
import { cn } from '@/lib/utils';

export const SHEETS = ['s1', 's2', 's3', 's4', 's5', 's6', 's7', 's8', 's9'] as const;
export type SheetId = (typeof SHEETS)[number];

const ZONES_X = ['1', '2', '3', '4', '5', '6', '7', '8'];
const ZONES_Y = ['A', 'B', 'C', 'D', 'E', 'F'];

export interface TitleInfo {
  project: string;
  date: string;
  rev: string;
  drawn: string;
}

/**
 * One drawing sheet: double frame with zone markers, a heading, the content and a title block.
 * The title block sits below the content on wide screens and becomes a header row on phones,
 * so it never covers anything. The inner frame line "draws" when the sheet enters (CSS).
 */
export function Sheet({ id, title, info, children, className, headingAs: H = 'h2' }: { id: SheetId; title: string; info: TitleInfo; children: React.ReactNode; className?: string; headingAs?: 'h2' | 'p' }) {
  const t = useTranslations();
  const no = SHEETS.indexOf(id) + 1;
  const locale = useLocale();
  const loc = (n: number) => fmtNum(locale, n);
  const sheetNo = `S${no}`;
  return (
    <section id={id} aria-labelledby={`${id}-h`} className={cn('bp-sheet relative scroll-mt-28', className)}>
      <div className="bp-frame relative">
        {/* zone markers (decorative) */}
        <div aria-hidden data-qa-ignore className="bp-zones-x top-0">
          {ZONES_X.map((z) => (
            <span key={z}>{z}</span>
          ))}
        </div>
        <div aria-hidden data-qa-ignore className="bp-zones-x bottom-0">
          {ZONES_X.map((z) => (
            <span key={z}>{z}</span>
          ))}
        </div>
        <div aria-hidden data-qa-ignore className="bp-zones-y start-0">
          {ZONES_Y.map((z) => (
            <span key={z}>{z}</span>
          ))}
        </div>
        <div aria-hidden data-qa-ignore className="bp-zones-y end-0">
          {ZONES_Y.map((z) => (
            <span key={z}>{z}</span>
          ))}
        </div>
        <div className="relative px-5 pb-6 pt-6 sm:px-9 sm:pb-9 sm:pt-9">
          {/* phones: title block as a header row */}
          <p className="bp-mono mb-4 flex flex-wrap gap-x-3 gap-y-1 border-b border-[#eef5ff]/30 pb-2 text-[11px] uppercase text-[#b8cde6] md:hidden rtl:normal-case">
            <span dir="ltr">
              {sheetNo}/{SHEETS.length}
            </span>
            <span>{t('blueprint.tb.nts')}</span>
            <span dir="ltr">REV {info.rev}</span>
            <span>{info.date}</span>
          </p>
          <H id={`${id}-h`} className="bp-title text-[clamp(1.7rem,3.6vw,2.7rem)] leading-none">
            <span className="bp-mono mr-3 align-middle text-[0.45em] text-[#ffd479] rtl:ml-3 rtl:mr-0" dir="ltr">
              {sheetNo}
            </span>
            {title}
          </H>
          <div className="mt-8">{children}</div>

          {/* wide screens: the title block, in flow at the end of the sheet */}
          <div className="mt-10 hidden justify-end md:flex">
            <table className="bp-tb">
              <tbody>
                <tr>
                  <td colSpan={2}>
                    <span className="bp-tb-k">{t('blueprint.tb.project')}</span>
                    {info.project}
                  </td>
                  <td>
                    <span className="bp-tb-k">{t('blueprint.tb.sheet')}</span>
                    <span dir="ltr">
                      {sheetNo} / {loc(SHEETS.length)}
                    </span>
                  </td>
                </tr>
                <tr>
                  <td colSpan={2}>
                    <span className="bp-tb-k">{t('blueprint.tb.title')}</span>
                    <b>{title}</b>
                  </td>
                  <td>
                    <span className="bp-tb-k">{t('blueprint.tb.scale')}</span>
                    {t('blueprint.tb.nts')}
                  </td>
                </tr>
                <tr>
                  <td>
                    <span className="bp-tb-k">{t('blueprint.tb.drawn')}</span>
                    {info.drawn}
                  </td>
                  <td>
                    <span className="bp-tb-k">{t('blueprint.tb.date')}</span>
                    {info.date}
                  </td>
                  <td>
                    <span className="bp-tb-k">{t('blueprint.tb.rev')}</span>
                    <span dir="ltr">{info.rev}</span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
        {/* inner frame: four lines that draw around the sheet when it enters (transform only; painted
            after the content so that animating them never forces the content into its own layer) */}
        <div aria-hidden className="bp-inner pointer-events-none absolute inset-[14px]">
          <i className="bp-ln bp-ln-t" />
          <i className="bp-ln bp-ln-r" />
          <i className="bp-ln bp-ln-b" />
          <i className="bp-ln bp-ln-l" />
        </div>

      </div>
    </section>
  );
}
