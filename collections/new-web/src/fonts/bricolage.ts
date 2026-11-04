import localFont from 'next/font/local';

/** Bricolage Grotesque (opsz 12–96, wght 200–800, wdth 75–100) — used by the Periodic design. */
export const bricolage = localFont({
  src: [
    { path: '../../node_modules/@fontsource-variable/bricolage-grotesque/files/bricolage-grotesque-latin-standard-normal.woff2', style: 'normal' },
    { path: '../../node_modules/@fontsource-variable/bricolage-grotesque/files/bricolage-grotesque-latin-ext-standard-normal.woff2', style: 'normal' },
  ],
  weight: '200 800',
  variable: '--font-bricolage',
  display: 'swap',
  adjustFontFallback: false,
});
