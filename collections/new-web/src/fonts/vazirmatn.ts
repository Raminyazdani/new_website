import localFont from 'next/font/local';

/**
 * Persian (Arabic-script) subset only. Latin glyphs come from each design's Latin font,
 * so this file is fetched only when Persian text is actually rendered (unicode-range).
 */
export const vazirmatn = localFont({
  src: '../../node_modules/@fontsource-variable/vazirmatn/files/vazirmatn-arabic-wght-normal.woff2',
  weight: '100 900',
  variable: '--font-vazirmatn',
  display: 'swap',
  preload: false,
  declarations: [{ prop: 'unicode-range', value: 'U+0600-06FF, U+0750-077F, U+0870-088E, U+0890-0891, U+0897-08E1, U+08E3-08FF, U+200C-200E, U+2010-2011, U+204F, U+2E41, U+FB50-FDFF, U+FE70-FE74, U+FE76-FEFC' }],
});
