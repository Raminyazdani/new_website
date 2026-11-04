import localFont from 'next/font/local';

/** Martian Mono — key labels and specs (Sequencer). */
export const martianMono = localFont({
  src: '../../node_modules/@fontsource-variable/martian-mono/files/martian-mono-latin-wght-normal.woff2',
  weight: '100 800',
  variable: '--font-martian',
  display: 'swap',
  adjustFontFallback: false,
});
