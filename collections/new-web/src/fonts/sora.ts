import localFont from 'next/font/local';

/** Sora (variable) — geometric face of the Keynote deck. */
export const sora = localFont({
  src: '../../node_modules/@fontsource-variable/sora/files/sora-latin-wght-normal.woff2',
  weight: '100 800',
  variable: '--font-sora',
  display: 'swap',
  adjustFontFallback: false,
});
