import localFont from 'next/font/local';

/** Space Mono 400/700 — coordinates and catalogue numbers (Observatory). */
export const spaceMono = localFont({
  src: [
    { path: '../../node_modules/@fontsource/space-mono/files/space-mono-latin-400-normal.woff2', weight: '400', style: 'normal' },
    { path: '../../node_modules/@fontsource/space-mono/files/space-mono-latin-700-normal.woff2', weight: '700', style: 'normal' },
  ],
  variable: '--font-space-mono',
  display: 'swap',
  adjustFontFallback: false,
});
