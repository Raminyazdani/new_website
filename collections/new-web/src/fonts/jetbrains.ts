import localFont from 'next/font/local';

export const jetbrains = localFont({
  src: [
    { path: '../../node_modules/@fontsource-variable/jetbrains-mono/files/jetbrains-mono-latin-wght-normal.woff2', style: 'normal' },
    { path: '../../node_modules/@fontsource-variable/jetbrains-mono/files/jetbrains-mono-latin-wght-italic.woff2', style: 'italic' },
  ],
  weight: '100 800',
  variable: '--font-jetbrains',
  display: 'swap',
  // no metric-adjusted Arial fallback: Windows' Arial has Arabic glyphs and would shadow the Persian font
  adjustFontFallback: false,
});
