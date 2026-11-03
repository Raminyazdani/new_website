(function (w) {
  'use strict';

  // Original compositions using the public portfolio view model. The scientific
  // forms are illustrations; bands and indices organize records, not measurements.
  const list = value => Array.isArray(value) ? value : [];
  const index = n => String(n + 1).padStart(2, '0');
  const overline = text => `<p class="dx-overline">${text}</p>`;
  const art = (k, kind, cls = '') => `<div class="dx-art ${cls}" aria-hidden="true">${k.science(kind)}</div>`;
  const hero = (inner, cls) => `<section class="pf-section design-page dl-section dx-hero ${cls}" id="hero" data-section="hero" aria-labelledby="design-hero-title"><div class="pf-wrap">${inner}</div></section>`;
  const collection = (vm, h, k, cls, layout) => {
    let html = k.projectCollection(vm, h, layout);
    if (cls === 'dx-gallery-projects') html = html.replace('class="dl-projects ', 'tabindex="0" role="region" aria-label="Scrollable project gallery" class="dl-projects ');
    return `<div class="${cls}">${html}</div>`;
  };
  const journey = (vm, h, k, cls, variant) => k.section('experience', 'Experience', `<div class="${cls}">${k.experienceRows(vm, h, variant)}</div>`, 'dx-journey');
  const profile = (vm, h, k, cls, kind) => k.section('about', 'About', `<div class="${cls}">${k.about(vm, h)}${art(k, kind)}</div>${k.story(vm, h)}`, 'dx-about');

  function sourceBands(vm, h) {
    const tags = [...new Set(list(vm.projects).flatMap(p => list(p.tags)).filter(Boolean))].slice(0, 4);
    return tags.length ? `<div class="dx-source-bands" aria-label="Project categories">${tags.map((tag, i) => `<a href="#projects" class="dx-source-band"><span>${index(i)}</span><b>${h.e(tag)}</b><span aria-hidden="true">↗</span></a>`).join('')}</div>` : '';
  }

  const recipes = [
    {
      id: 'chromatography', name: 'Chromatography', family: 'experimental', defaultTheme: 'light',
      description: 'Colored source lanes, transparent layers and a laboratory notebook rhythm.',
      recordStyle: 'bands', signature: 'source-lanes',
      renderers: {
        hero(vm, h, k) {
          return hero(`<div class="dx-chroma-top">${overline('PORTFOLIO / SOURCE COLLECTION')}<a href="#projects" class="dx-inline-link">Explore the work ↘</a></div><div class="dx-chroma-hero"><div class="dx-chroma-identity">${k.identity(vm, h)}${k.roles(vm, h)}${k.lead(vm, h)}${k.actions()}</div><div class="dx-chroma-specimen">${k.portrait(vm, h)}${art(k, 'molecule')}<span class="dx-specimen-label">PROFILE / RESEARCH &amp; CODE</span></div></div>${sourceBands(vm, h)}<div class="dx-chroma-metrics">${k.metrics(vm, h)}</div>`, 'dx-chromatography');
        },
        about(vm, h, k) { return profile(vm, h, k, 'dx-chroma-about', 'cell'); },
        projects(vm, h, k) {
          return k.section('projects', 'Work in layers', `<p class="dx-note">Browse the source categories and open a project for its full record.</p>${collection(vm, h, k, 'dx-chroma-projects', 'row')}`, 'dx-work');
        },
        experience(vm, h, k) { return journey(vm, h, k, 'dx-chroma-journey', 'timeline'); }
      }
    },
    {
      id: 'gallery', name: 'Gallery', family: 'experimental', defaultTheme: 'light',
      description: 'An editorial image gallery with oversized covers and a horizontal work collection.',
      recordStyle: 'gallery', signature: 'cover-gallery',
      renderers: {
        hero(vm, h, k) {
          return hero(`<div class="dx-gallery-masthead">${overline('RESEARCH / PRACTICE / PORTFOLIO')}${k.roles(vm, h)}</div><div class="dx-gallery-title">${k.identity(vm, h)}</div><div class="dx-gallery-stage"><div class="dx-gallery-portrait">${k.portrait(vm, h)}<a class="dx-gallery-caption" href="#about">Meet the researcher <span aria-hidden="true">↗</span></a></div><div class="dx-gallery-intro">${art(k, 'cell')}${k.lead(vm, h)}${k.actions()}</div></div><div class="dx-gallery-metrics">${k.metrics(vm, h)}</div>`, 'dx-gallery');
        },
        about(vm, h, k) { return profile(vm, h, k, 'dx-gallery-about', 'molecule'); },
        projects(vm, h, k) {
          return k.section('projects', 'The work gallery', `<p class="dx-note">Scroll through the covers. Each opens the full project.</p>${collection(vm, h, k, 'dx-gallery-projects', 'poster')}`, 'dx-work');
        },
        experience(vm, h, k) { return journey(vm, h, k, 'dx-gallery-journey', 'cards'); }
      }
    },
    {
      id: 'dossier', name: 'Dossier', family: 'experimental', defaultTheme: 'light',
      description: 'A precisely indexed archive with a profile sheet, project ledger and source records.',
      recordStyle: 'ledger', signature: 'indexed-dossier',
      renderers: {
        hero(vm, h, k) {
          return hero(`<div class="dx-dossier-ribbon"><span>PERSONAL PORTFOLIO</span><span>PROFILE / WORK / RESEARCH</span></div><div class="dx-dossier-sheet"><aside class="dx-dossier-photo">${k.portrait(vm, h)}${overline('PROFILE PHOTOGRAPH')}${art(k, 'molecule')}</aside><div class="dx-dossier-main">${overline('01 / IDENTITY')}${k.identity(vm, h)}${k.roles(vm, h)}<div class="dx-dossier-summary">${overline('OVERVIEW')}${k.lead(vm, h)}</div>${k.actions()}</div></div><div class="dx-dossier-metrics">${k.metrics(vm, h)}</div>`, 'dx-dossier');
        },
        about(vm, h, k) { return profile(vm, h, k, 'dx-dossier-about', 'protein'); },
        projects(vm, h, k) {
          return k.section('projects', 'Project index', `<div class="dx-ledger-caption" aria-hidden="true"><span>RECORD / PREVIEW</span><span>PROJECT / SOURCE DETAILS</span></div>${collection(vm, h, k, 'dx-dossier-projects', 'compact')}`, 'dx-work');
        },
        experience(vm, h, k) { return journey(vm, h, k, 'dx-dossier-journey', 'ledger'); }
      }
    },
    {
      id: 'kinetic', name: 'Kinetic', family: 'experimental', defaultTheme: 'dark',
      description: 'Large moving type, a portrait portal and a sharp, high contrast project sequence.',
      recordStyle: 'kinetic', signature: 'type-in-motion',
      renderers: {
        hero(vm, h, k) {
          return hero(`<div class="dx-kinetic-top">${overline('RESEARCH &amp; CODE')}${k.roles(vm, h)}</div><div class="dx-kinetic-name">${k.identity(vm, h)}<span class="dx-type-rule" aria-hidden="true"></span></div><div class="dx-kinetic-bottom"><div class="dx-kinetic-copy">${k.lead(vm, h)}${k.actions()}</div><div class="dx-kinetic-portal">${art(k, 'protein')}${k.portrait(vm, h)}</div></div><div class="dx-kinetic-metrics">${k.metrics(vm, h)}</div>`, 'dx-kinetic');
        },
        about(vm, h, k) { return profile(vm, h, k, 'dx-kinetic-about', 'code'); },
        projects(vm, h, k) {
          return k.section('projects', 'Ideas into work.', collection(vm, h, k, 'dx-kinetic-projects', 'poster'), 'dx-work');
        },
        experience(vm, h, k) { return journey(vm, h, k, 'dx-kinetic-journey', 'timeline'); }
      }
    },
    {
      id: 'horizon', name: 'Horizon', family: 'experimental', defaultTheme: 'dark',
      description: 'A panoramic scientific landscape with layered scales and alternating project views.',
      recordStyle: 'horizon', signature: 'panoramic-depth',
      renderers: {
        hero(vm, h, k) {
          return hero(`<div class="dx-horizon-panorama"><div class="dx-horizon-depth" aria-hidden="true">${art(k, 'cell', 'dx-horizon-cell')}${art(k, 'molecule', 'dx-horizon-molecule')}${art(k, 'protein', 'dx-horizon-protein')}</div><div class="dx-horizon-heading">${overline('A PORTFOLIO ACROSS SCALES')}${k.identity(vm, h)}${k.roles(vm, h)}</div><div class="dx-horizon-photo">${k.portrait(vm, h)}</div></div><div class="dx-horizon-shelf"><div>${k.lead(vm, h)}${k.actions()}</div>${k.metrics(vm, h)}</div>`, 'dx-horizon');
        },
        about(vm, h, k) { return profile(vm, h, k, 'dx-horizon-about', 'cell'); },
        projects(vm, h, k) {
          return k.section('projects', 'A wider view of the work', collection(vm, h, k, 'dx-horizon-projects', 'row'), 'dx-work');
        },
        experience(vm, h, k) { return journey(vm, h, k, 'dx-horizon-journey', 'timeline'); }
      }
    }
  ];

  recipes.forEach(recipe => w.PortfolioDesigns.register(recipe));
})(window);
