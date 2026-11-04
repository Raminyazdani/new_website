import localFont from 'next/font/local';

/** B612 + B612 Mono — cockpit-legibility faces designed for Airbus displays (Reactor HMI). */
export const b612 = localFont({
  src: [
    { path: '../../node_modules/@fontsource/b612/files/b612-latin-400-normal.woff2', weight: '400', style: 'normal' },
    { path: '../../node_modules/@fontsource/b612/files/b612-latin-700-normal.woff2', weight: '700', style: 'normal' },
  ],
  variable: '--font-b612',
  display: 'swap',
  adjustFontFallback: false,
});

export const b612Mono = localFont({
  src: [
    { path: '../../node_modules/@fontsource/b612-mono/files/b612-mono-latin-400-normal.woff2', weight: '400', style: 'normal' },
    { path: '../../node_modules/@fontsource/b612-mono/files/b612-mono-latin-700-normal.woff2', weight: '700', style: 'normal' },
  ],
  variable: '--font-b612-mono',
  display: 'swap',
  adjustFontFallback: false,
});
