import localFont from 'next/font/local';

/** Fraunces with every axis (wght, opsz, SOFT, WONK) — the soft, wonky display face of the Cell design. */
export const frauncesSoft = localFont({
  src: '../../node_modules/@fontsource-variable/fraunces/files/fraunces-latin-full-normal.woff2',
  weight: '100 900',
  variable: '--font-fraunces-soft',
  display: 'swap',
  adjustFontFallback: false,
});
