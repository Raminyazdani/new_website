import localFont from 'next/font/local';

/** Bebas Neue — condensed all-caps display face (Cinema). Latin only; Persian titles fall back to Lalezar. */
export const bebas = localFont({
  src: '../../node_modules/@fontsource/bebas-neue/files/bebas-neue-latin-400-normal.woff2',
  weight: '400',
  variable: '--font-bebas',
  display: 'swap',
  adjustFontFallback: false,
});
