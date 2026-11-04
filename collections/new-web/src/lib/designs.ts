import registry from './designs.json';

/**
 * Every design direction, in gallery order. `designs.json` is the single switch board:
 * it sets the order, the family and whether a design is `ready` (built and verified).
 * Only ready designs appear in the gallery, the dock and the HOME_DESIGN option.
 * next.config.ts and the scripts read the same JSON file.
 */
export const allDesignIds = [
  'helix', 'genome', 'circos', 'atlas', 'observatory', 'metro', 'periodic', 'sequencer', 'organic', 'cell',
  'reactor', 'blueprint', 'pipeline', 'desktop', 'bento', 'configurator', 'swiss', 'cinema', 'keynote', 'sketch',
] as const;
export type DesignId = (typeof allDesignIds)[number];

export const designFamilies = ['life', 'data', 'lab', 'product', 'story'] as const;
export type DesignFamily = (typeof designFamilies)[number];

export interface DesignEntry {
  id: DesignId;
  family: DesignFamily;
  ready: boolean;
}

export const designRegistry = registry as DesignEntry[];

if (process.env.NODE_ENV !== 'production') {
  for (const d of designRegistry) {
    if (!(allDesignIds as readonly string[]).includes(d.id)) throw new Error(`designs.json: unknown design id "${d.id}"`);
  }
}

/** Built designs, in gallery order. */
export const designIds: DesignId[] = designRegistry.filter((d) => d.ready).map((d) => d.id);

export const designFamily = (id: DesignId): DesignFamily => designRegistry.find((d) => d.id === id)?.family ?? 'product';

/** Visual metadata shared by the gallery and the design dock. */
export const designMeta: Record<DesignId, { bg: string; fg: string; accent: string; swatches: string[]; dark: boolean }> = {
  helix: { bg: '#04060c', fg: '#e8fffb', accent: '#2ee6c5', swatches: ['#04060c', '#0b1a2b', '#2ee6c5', '#4cc9f0', '#ffb547'], dark: true },
  genome: { bg: '#f6f7f9', fg: '#1b2230', accent: '#1f5fd1', swatches: ['#f6f7f9', '#ffffff', '#1f5fd1', '#0b7568', '#c0392b'], dark: false },
  circos: { bg: '#faf9f6', fg: '#15161b', accent: '#e8590c', swatches: ['#faf9f6', '#e8590c', '#1c7ed6', '#2f9e44', '#ae3ec9'], dark: false },
  atlas: { bg: '#fbfbfd', fg: '#0f1222', accent: '#3b5bfd', swatches: ['#fbfbfd', '#3b5bfd', '#f2683c', '#10b39b', '#c03ea6'], dark: false },
  observatory: { bg: '#050816', fg: '#e8ecf6', accent: '#e6c27a', swatches: ['#050816', '#0b1430', '#e6c27a', '#7fd4ff', '#e8ecf6'], dark: true },
  metro: { bg: '#f4f4f1', fg: '#1a1a1a', accent: '#0067b1', swatches: ['#ffffff', '#0067b1', '#d8232a', '#7a3f97', '#9b5b2b'], dark: false },
  periodic: { bg: '#f7f5ef', fg: '#16171b', accent: '#b9380a', swatches: ['#f7f5ef', '#ffd8a8', '#b2f2bb', '#a5d8ff', '#d0bfff'], dark: false },
  sequencer: { bg: '#cfcac1', fg: '#1d1d1b', accent: '#ff6a13', swatches: ['#cfcac1', '#e8e6e1', '#2b2b2b', '#ff6a13', '#9cff57'], dark: false },
  organic: { bg: '#f3efe6', fg: '#10201b', accent: '#0b7568', swatches: ['#f3efe6', '#a6ead2', '#d6ccff', '#ffd5c0', '#10201b'], dark: false },
  cell: { bg: '#fff6ec', fg: '#2a2230', accent: '#d96a5e', swatches: ['#fff6ec', '#f6b38e', '#c9b8ec', '#9fd8cf', '#f7d06b'], dark: false },
  reactor: { bg: '#d6dadd', fg: '#1c252c', accent: '#1f5fbf', swatches: ['#d6dadd', '#e9ecee', '#1d7a45', '#f0b429', '#b42318'], dark: false },
  blueprint: { bg: '#0d3a66', fg: '#eef5ff', accent: '#ffd479', swatches: ['#0d3a66', '#164b80', '#eef5ff', '#ffd479', '#ffb3b3'], dark: true },
  pipeline: { bg: '#0b0f14', fg: '#d6e2ee', accent: '#7ee787', swatches: ['#0b0f14', '#161b22', '#7ee787', '#79c0ff', '#d2a8ff'], dark: true },
  desktop: { bg: '#0f172a', fg: '#e2e8f0', accent: '#14b8a6', swatches: ['#0f172a', '#134e4a', '#1e1b4b', '#14b8a6', '#f8fafc'], dark: true },
  bento: { bg: '#09090b', fg: '#fafafa', accent: '#c6f432', swatches: ['#09090b', '#18181b', '#c6f432', '#fafafa', '#f4f4f5'], dark: true },
  configurator: { bg: '#ffffff', fg: '#1d1d1f', accent: '#0a66d8', swatches: ['#ffffff', '#f5f5f7', '#1d1d1f', '#0a66d8', '#1a7f37'], dark: false },
  swiss: { bg: '#f2f1ec', fg: '#0d0d0d', accent: '#c8001a', swatches: ['#f2f1ec', '#0d0d0d', '#c8001a', '#e7e5de', '#8a8a8a'], dark: false },
  cinema: { bg: '#0b0a09', fg: '#f2ece3', accent: '#ffb22c', swatches: ['#0b0a09', '#7c1d1d', '#ffb22c', '#fff6e0', '#b9ad9c'], dark: true },
  keynote: { bg: '#07070b', fg: '#f4f4f6', accent: '#8b5cf6', swatches: ['#07070b', '#111118', '#8b5cf6', '#22d3ee', '#f4f4f6'], dark: true },
  sketch: { bg: '#fffdf6', fg: '#2b2b2b', accent: '#1d4ed8', swatches: ['#fffdf6', '#dbe7f3', '#1d4ed8', '#c92a2a', '#ffec85'], dark: false },
};

export const isDesignId = (v: string): v is DesignId => (allDesignIds as readonly string[]).includes(v);

const lum = (hex: string) => {
  const c = hex
    .replace('#', '')
    .match(/../g)!
    .map((x) => parseInt(x, 16) / 255)
    .map((v) => (v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4));
  return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2];
};
/** Text colour for a label on a design's accent: white or near-black, whichever contrasts more. */
export const onAccent = (accent: string) => {
  const L = lum(accent);
  return (1.05 / (L + 0.05) >= (L + 0.05) / (lum('#0b0c10') + 0.05) ? '#ffffff' : '#0b0c10');
};
