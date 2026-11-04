import localFont from 'next/font/local';

/**
 * Geist (SIL OFL 1.1, Vercel) self-hosted from the `geist` package. Declared here instead of `geist/font/*`
 * so the stacks carry no system/Arial fallbacks — Persian text must fall through to Vazirmatn.
 */
export const geistSans = localFont({
  src: '../../node_modules/geist/dist/fonts/geist-sans/Geist-Variable.woff2',
  weight: '100 900',
  variable: '--font-geist-sans',
  display: 'swap',
  adjustFontFallback: false,
});

export const geistMono = localFont({
  src: '../../node_modules/geist/dist/fonts/geist-mono/GeistMono-Variable.woff2',
  weight: '100 900',
  variable: '--font-geist-mono',
  display: 'swap',
  adjustFontFallback: false,
});
