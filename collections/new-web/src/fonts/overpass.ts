import localFont from 'next/font/local';

/** Overpass (highway-signage grotesque) + Overpass Mono — used by the Metro design. */
export const overpass = localFont({
  src: '../../node_modules/@fontsource-variable/overpass/files/overpass-latin-wght-normal.woff2',
  weight: '100 900',
  variable: '--font-overpass',
  display: 'swap',
  adjustFontFallback: false,
});

export const overpassMono = localFont({
  src: [
    { path: '../../node_modules/@fontsource/overpass-mono/files/overpass-mono-latin-400-normal.woff2', weight: '400', style: 'normal' },
    { path: '../../node_modules/@fontsource/overpass-mono/files/overpass-mono-latin-600-normal.woff2', weight: '600', style: 'normal' },
  ],
  variable: '--font-overpass-mono',
  display: 'swap',
  adjustFontFallback: false,
});
