# Third-party notices

This project builds on the work of others. Thank you!

## Vendored UI components (copied into `src/components/`)

**Magic UI** — https://magicui.design · MIT License · © Magic UI contributors
`animated-beam`, `animated-shiny-text`, `border-beam`, `dock`, `dot-pattern`, `highlighter`, `hyper-text`, `lens`, `magic-card`, `marquee`, `meteors` (deterministic positions, design-scoped keyframes), `number-ticker`, `orbiting-circles`, `ripple`, `scroll-progress`, `shimmer-button`, `terminal`, `text-animate`, `text-reveal`.
Local changes: no `next-themes` dependency in `magic-card` (theme comes from each design, design-scoped colour tokens), `number-ticker` gets a `locale` prop, renders the final value on the server, counts up only when it will be seen (`animateOnMount` option) and writes the text only when the digits change, colour/size props for `text-reveal` and `orbiting-circles`, `'use client'` where missing.

**React Bits** — https://reactbits.dev · MIT License with Commons Clause · © David Haz
`BlurText`, `CircularText`, `ClickSpark`, `DecryptedText`, `GooeyNav`, `LetterGlitch`, `MetaBalls`, `RotatingText`, `SpotlightCard`, `VariableProximity`.
Local changes are marked in the file headers (`BlurText`: `as` prop; `GooeyNav`: re-settle after web fonts load, uncapped canvas width; `RotatingText`: `popLayout` presence mode; `VariableProximity`: no Google Fonts import, font from the design's CSS). The Commons Clause forbids selling the components themselves; using them in a website is permitted.

## Fonts (self-hosted, SIL Open Font License 1.1)

Inter · JetBrains Mono · Space Grotesk · Fraunces · Plus Jakarta Sans · Instrument Serif · Archivo · IBM Plex Sans / Mono · Bricolage Grotesque · Overpass (+ Mono) · Cormorant Garamond · Space Mono · Bebas Neue · Courier Prime · Lalezar · Doto · Martian Mono · B612 + B612 Mono · Manrope · Barlow + Barlow Condensed · Caveat · Nunito · Aref Ruqaa · Sora · IBM Plex Sans Arabic (via Fontsource; B612: Eclipse Public License 2.0 / OFL) · Geist & Geist Mono (Vercel, `geist` package) · Vazirmatn · Estedad · Noto Naskh Arabic (via Fontsource).

## Icons

- Simple Icons — CC0 1.0 (brand logos; trademarks belong to their owners). The LinkedIn glyph comes from an earlier CC0 release of Simple Icons.
- Lucide — ISC License.

## Libraries (installed from npm)

| Package | License |
|---------|---------|
| next, react, react-dom, next-intl, motion, lenis, three, @react-three/fiber, @react-three/drei, @react-three/postprocessing, cobe, cmdk, svg-dotted-map, rough-notation, roughjs, qrcode-generator, tailwindcss, clsx, tailwind-merge | MIT |
| d3-sankey | BSD-3-Clause |
| d3 · lucide-react | ISC |
| postprocessing | Zlib |
| ogl | Unlicense |
| class-variance-authority | Apache-2.0 |
| simple-icons | CC0-1.0 |
| gsap | GSAP Standard “no charge” License — https://gsap.com/standard-license |

The map in the Atlas design is generated with `svg-dotted-map`; the globe in Bento is rendered with `cobe`.
The Aurora background of the Keynote title slide is an own OGL shader written in the spirit of React Bits' *Aurora* (not a copy of its code).
