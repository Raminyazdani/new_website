import localFont from 'next/font/local';

/** Barlow + Barlow Condensed — DIN-like grotesques for the Blueprint drawing sheets. */
export const barlow = localFont({
  src: [
    { path: '../../node_modules/@fontsource/barlow/files/barlow-latin-400-normal.woff2', weight: '400', style: 'normal' },
    { path: '../../node_modules/@fontsource/barlow/files/barlow-latin-500-normal.woff2', weight: '500', style: 'normal' },
    { path: '../../node_modules/@fontsource/barlow/files/barlow-latin-600-normal.woff2', weight: '600', style: 'normal' },
    { path: '../../node_modules/@fontsource/barlow/files/barlow-latin-700-normal.woff2', weight: '700', style: 'normal' },
  ],
  variable: '--font-barlow',
  display: 'swap',
  adjustFontFallback: false,
});

export const barlowCondensed = localFont({
  src: [
    { path: '../../node_modules/@fontsource/barlow-condensed/files/barlow-condensed-latin-500-normal.woff2', weight: '500', style: 'normal' },
    { path: '../../node_modules/@fontsource/barlow-condensed/files/barlow-condensed-latin-600-normal.woff2', weight: '600', style: 'normal' },
    { path: '../../node_modules/@fontsource/barlow-condensed/files/barlow-condensed-latin-700-normal.woff2', weight: '700', style: 'normal' },
  ],
  variable: '--font-barlow-condensed',
  display: 'swap',
  adjustFontFallback: false,
});
