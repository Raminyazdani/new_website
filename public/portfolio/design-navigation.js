(function (root, factory) {
  'use strict';
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.PortfolioDesignNavigation = api;
})(typeof window !== 'undefined' ? window : globalThis, function () {
  'use strict';

  // The standalone New Web pages use the native gallery's order without loading its renderers.
  const nativeTemplateIds = Object.freeze([
    'folio', 'vitro', 'herbarium', 'monument', 'assay',
    'workbench', 'signal', 'connectome', 'shell', 'draft',
    'separation', 'exhibit', 'letter', 'velocity', 'strata',
    'journal', 'helix', 'organic', 'monograph', 'specimen',
    'pipeline', 'bento', 'atlas-map', 'console', 'blueprint',
    'chromatography', 'gallery', 'dossier', 'kinetic', 'horizon',
  ]);
  const preferenceValues = {
    theme: ['light', 'dark'],
    background: ['glow', 'silk', 'membrane', 'molecular', 'aurora', 'off'],
    motion: ['auto', 'full', 'still'],
  };

  /** @typedef {{ collection: 'imported' | 'native', id: string }} Template */
  /** @typedef {{ theme?: string | null, background?: string | null, motion?: string | null }} Preferences */

  /** @param {readonly string[]} importedIds @param {readonly string[]} [nativeIds] @returns {Template[]} */
  function templateCycle(importedIds, nativeIds = nativeTemplateIds) {
    return [
      ...importedIds.map(id => ({ collection: /** @type {const} */ ('imported'), id })),
      ...nativeIds.map(id => ({ collection: /** @type {const} */ ('native'), id })),
    ];
  }

  /** @param {readonly Template[]} cycle @param {Template} current @param {-1 | 1} direction */
  function adjacentTemplate(cycle, current, direction) {
    const index = cycle.findIndex(item => item.collection === current.collection && item.id === current.id);
    if (index === -1) return direction < 0 ? cycle.at(-1) : cycle[0];
    return cycle[(index + direction + cycle.length) % cycle.length];
  }

  /** @param {string} search @returns {Preferences} */
  function readPreferences(search) {
    const params = new URLSearchParams(search);
    return { theme: params.get('theme'), background: params.get('background'), motion: params.get('motion') };
  }

  /** @param {string} path @param {Preferences} [preferences] */
  function withPreferences(path, preferences = {}) {
    const [pathname, search] = path.split('?');
    const query = new URLSearchParams(search);
    for (const key of /** @type {(keyof Preferences)[]} */ (Object.keys(preferenceValues))) {
      const value = preferences[key];
      if (typeof value === 'string' && preferenceValues[key].includes(value)) query.set(key, value);
    }
    return query.size ? `${pathname}?${query}` : pathname;
  }

  /** @param {Template} template @param {string} locale @param {Preferences} [preferences] */
  function templateHref(template, locale, preferences) {
    if (!/^[a-z][a-z0-9-]*$/.test(template.id)) return '/';
    const language = ['en', 'de', 'fa'].includes(locale) ? locale : 'en';
    const path = template.collection === 'imported'
      ? `/imported/${language}/${template.id}/`
      : `/?design=${template.id}&lang=${language}`;
    return withPreferences(path, preferences);
  }

  return { templateCycle, adjacentTemplate, templateHref, readPreferences, withPreferences };
});
