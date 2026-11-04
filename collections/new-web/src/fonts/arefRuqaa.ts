import localFont from 'next/font/local';

/** Aref Ruqaa — Ruqʿa-style hand for Persian notes in the Sketch notebook (Arabic-script subset only). */
export const arefRuqaa = localFont({
  src: [
    { path: '../../node_modules/@fontsource/aref-ruqaa/files/aref-ruqaa-arabic-400-normal.woff2', weight: '400', style: 'normal' },
    { path: '../../node_modules/@fontsource/aref-ruqaa/files/aref-ruqaa-arabic-700-normal.woff2', weight: '700', style: 'normal' },
  ],
  variable: '--font-aref',
  display: 'swap',
  preload: false,
  declarations: [{ prop: 'unicode-range', value: 'U+0600-06FF, U+0750-077F, U+0870-088E, U+0890-0891, U+0897-08E1, U+08E3-08FF, U+200C-200E, U+2010-2011, U+204F, U+2E41, U+FB50-FDFF, U+FE70-FE74, U+FE76-FEFC' }],
});
