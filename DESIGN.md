# Synthesis — built visual system

Primary scope: `design=synthesis`, plus the twelve Experiences described below. The earlier 50 designs retain their own systems. Visitor mode: Experience, with readable source-backed professional records for academic and technology audiences.

The default view integrates life sciences and computation. The persistent perspective controls select `all`, `biology`, or `programming`. One identity, portrait, canonical model and set of eleven sections remain present. Perspective changes the SVG geometry, record emphasis, chapter navigation and component composition; it never fabricates expertise, proficiency or results.

## Surface and typography

Light: paper `#f6fafd`, surface `#eaf3f9`, ink `#102c43`, secondary text `#435d70`, teal `#136073`, restrained amber `#87501f`. Dark: paper `#0b1721`, surface `#132634`, ink `#e5f3fb`, secondary `#b0c7d7`, teal `#8bd9e3`, amber `#e0af76`.

Use the existing self-hosted Space Grotesk for the primary interface and name, IBM Plex Mono for technical annotations and structured metadata. The main column is at most 1280px; narrow layouts stack with 18px minimum side spacing. Controls remain at least 44px high. Use fine rules and asymmetric project plates rather than repeated nested cards. Scientific grid lines belong to the instrument surface; broad diagonal background waves are suppressed in Synthesis.

## Signature and motion

The central illustration is a shared projected SVG object: membrane surfaces, molecular junctions and computational paths. The same scene persists during perspective changes. Biology closes the structure around a restrained nucleus; programming resolves it into ordered layers and data paths. Captions identify conceptual illustration and avoid presenting the sculpture as scientific evidence.

Animation communicates this transformation. Shared ease-out timing, bounded artwork motion, pointer response and visibility pausing are managed by `synthesis-scene.js`. Auto follows system preferences, Full explicitly enables movement, Still shows a stable pose while keeping manual perspective selection usable. Text and controls remain immediately available. Keyboard focus, search state, open disclosures and the current reading position survive perspective changes.

## Content components

- Editorial profile with the full source summary, interests and connected story. Three source-backed chapters share one morphing SVG topology, with a sticky figure on motion-enabled desktop, compact mobile/Still presentation, and manual chapter/range controls. It is a conceptual bridge between disciplines, not an asserted experimental workflow.
- Integrated mode uses an asymmetric searchable project archive. Biology combines a smooth cellular project habitat, collection lens and two-column specimen tray with a synchronized field-label inspector. Programming combines Files / Document / Properties with Source → Method → Artifact tabs for one selected project. Method displays supplied topics/tools; Artifact displays supplied links or an explicit empty state. No execution or performance results are invented. Long inspector titles retain their full text with 28px/32px caps.
- Experience becomes dated field-note branches in Biology and a grouped changelog in Programming. Skills become a branching taxonomy or a module inventory with intrinsic-width tokens. Integrated mode keeps its editorial chronology and atlas. Switching preserves selection, search and reading position.
- Complete project dialogs and supplied resource links, publication bibliography, education journey and counts derived from records.
- Credential previews and detail drawers, complete language scores, initially closed reference contacts and direct contact/profile links.
- Templates entry and gallery return preserve access to the previous collection.

The raw schema is owned by `public/data/cv-adapter.js`. New data shapes are adapted there, never inspected by scene or section code. Birth date, configuration, contracts and verification metadata are outside the professional presentation. Private captures and CV payloads stay outside public Git.

Implementation: `public/portfolio/synthesis.js`, `synthesis-scene.js`, `synthesis-journey.js`, `synthesis-workbench.js/css`, `synthesis.css`; shared integration in runtime/studio/index. Detailed rationale and review scope: `docs/SYNTHESIS_DESIGN_PLAN_FA.md` and `docs/SYNTHESIS_FINAL_PLAN_FA.md`; measured checks and deployment: `docs/BUILD_PROGRESS.json`. Journey mounting is Synthesis-only; archived Experiences keep their previous About renderer. SVG IDs are instance-scoped, and listeners/observers are disposed on rerender.

## Twelve interactive Experiences

`public/portfolio/experiments/kit.js` registers the `experiential` collection and injects the seven complete secondary sections from Synthesis. `life.js/css` and `systems.js/css` own twelve bespoke hero, project, experience and skill compositions. Each mount receives an AbortController signal and canonical model; no renderer reads the raw CV or changes the API. The gallery contains 62 entries and all native/imported navigation shares that cycle.

Life family: Tissue uses projected focal planes and a slide tray; Culture uses an olive cellular habitat and cluster selection; Chromatogram uses an indigo topic trace and a controlled reading head; Residue uses rose molecular junctions and record inspection. Continuum interpolates a fixed 432-vertex mesh through cell, molecule and computation with scroll/manual control. Cabinet is a metal-and-paper archive with articulated drawers and actual document actions.

Systems family: Foundry is a routed project topology with stage inspectors; Runtime is a graphite workspace with file, preview and properties panes; Tensor uses a violet exploded layer stack; Patchbay is an amber port-and-cable interface associating skill terms with project text. Prism uses three orthogonal hinged faces of one assembly, deliberately distinct from Tensor. Expedition is a geographic narrative with synchronized route chapters, waypoints and a field guide.

Interaction precedes ornament. Selection reveals source-backed content; illustrative geometry makes no scientific or performance claim. Still mode retains all manual controls. Mobile reorganizes workspaces into panels rather than shrinking desktop text. Secondary sections inherit each world's colors and typography while preserving readable canonical details. No new animation framework was added.

Source review accepted three detector findings intentionally: Cabinet's 3px bottom edge belongs to a physical drawer handle, not a card accent; Foundry and Synthesis grids belong to working diagram/instrument surfaces. The review and fixes are recorded in `docs/EXPERIENCES_PLAN_FA.md`.

## Four independent bioinformatics worlds

The subsequent request rejects a shared presentation shell. `collections/new-web/src/designs/{microcosm,flowcell,cellscape,foldspace}` therefore contains four independent compositions: a microscopy bench with optical controls, a physical multichannel instrument, an analysis application with map/list/inspector, and a cinematic molecular stage. They use the same unchanged `PrivateDesign` data gate and `SiteData` adapter as the original New Web designs. This imported model is narrower than the native portfolio model; no claim is made that it exposes every raw CV field. Original designs and the full native Synthesis presentation remain available.

The `series: bioinformatics` gallery metadata creates a focused four-design filter while preserving all 66 entries in the main cycle. New previews are captured with the synthetic gallery fixture. Visual source study, differences between directions, observed checks and limitations are recorded in `docs/FOUR_BIO_WORLDS_FA.md`.
