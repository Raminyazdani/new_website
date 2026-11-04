import localFont from 'next/font/local';

/** Caveat (variable) — handwriting for short notes in the Sketch notebook. */
export const caveat = localFont({
  src: '../../node_modules/@fontsource-variable/caveat/files/caveat-latin-wght-normal.woff2',
  weight: '400 700',
  variable: '--font-caveat',
  display: 'swap',
  adjustFontFallback: false,
});
