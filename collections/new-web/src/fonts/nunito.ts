import localFont from 'next/font/local';

/** Nunito (variable) — rounded text face of the Sketch notebook. */
export const nunito = localFont({
  src: [
    { path: '../../node_modules/@fontsource-variable/nunito/files/nunito-latin-wght-normal.woff2', style: 'normal' },
    { path: '../../node_modules/@fontsource-variable/nunito/files/nunito-latin-wght-italic.woff2', style: 'italic' },
  ],
  weight: '200 1000',
  variable: '--font-nunito',
  display: 'swap',
  adjustFontFallback: false,
});
