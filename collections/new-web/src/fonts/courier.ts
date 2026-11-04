import localFont from 'next/font/local';

/** Courier Prime — screenplay face (Cinema). */
export const courierPrime = localFont({
  src: [
    { path: '../../node_modules/@fontsource/courier-prime/files/courier-prime-latin-400-normal.woff2', weight: '400', style: 'normal' },
    { path: '../../node_modules/@fontsource/courier-prime/files/courier-prime-latin-700-normal.woff2', weight: '700', style: 'normal' },
    { path: '../../node_modules/@fontsource/courier-prime/files/courier-prime-latin-400-italic.woff2', weight: '400', style: 'italic' },
  ],
  variable: '--font-courier',
  display: 'swap',
  adjustFontFallback: false,
});
