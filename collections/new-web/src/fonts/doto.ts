import localFont from 'next/font/local';

/** Doto — dot-matrix display face (Sequencer). Latin only; Persian display text uses Vazirmatn. */
export const doto = localFont({
  src: '../../node_modules/@fontsource-variable/doto/files/doto-latin-wght-normal.woff2',
  weight: '100 900',
  variable: '--font-doto',
  display: 'swap',
  adjustFontFallback: false,
});
