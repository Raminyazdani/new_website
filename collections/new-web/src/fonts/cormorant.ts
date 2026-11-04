import localFont from 'next/font/local';

/** Cormorant Garamond (variable, roman + italic) — display face of the Observatory design. */
export const cormorant = localFont({
  src: [
    { path: '../../node_modules/@fontsource-variable/cormorant-garamond/files/cormorant-garamond-latin-wght-normal.woff2', style: 'normal' },
    { path: '../../node_modules/@fontsource-variable/cormorant-garamond/files/cormorant-garamond-latin-wght-italic.woff2', style: 'italic' },
  ],
  weight: '300 700',
  variable: '--font-cormorant',
  display: 'swap',
  adjustFontFallback: false,
});
