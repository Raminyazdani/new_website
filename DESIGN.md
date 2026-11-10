# Synthesis — built visual system

Scope: the primary `design=synthesis` portfolio only. The 50 archived designs retain their own systems. Visitor mode: Experience, with readable source-backed professional records for academic and technology audiences.

The default view integrates life sciences and computation. The persistent perspective controls select `all`, `biology`, or `programming`. One identity, portrait, canonical model and set of eleven sections remain present. Perspective changes the SVG geometry, record emphasis, chapter navigation and component composition; it never fabricates expertise, proficiency or results.

## Surface and typography

Light: paper `#f6fafd`, surface `#eaf3f9`, ink `#102c43`, secondary text `#435d70`, teal `#136073`, restrained amber `#87501f`. Dark: paper `#0b1721`, surface `#132634`, ink `#e5f3fb`, secondary `#b0c7d7`, teal `#8bd9e3`, amber `#e0af76`.

Use the existing self-hosted Space Grotesk for the primary interface and name, IBM Plex Mono for technical annotations and structured metadata. The main column is at most 1280px; narrow layouts stack with 18px minimum side spacing. Controls remain at least 44px high. Use fine rules and asymmetric project plates rather than repeated nested cards. Scientific grid lines belong to the instrument surface; broad diagonal background waves are suppressed in Synthesis.

## Signature and motion

The central illustration is a shared projected SVG object: membrane surfaces, molecular junctions and computational paths. The same scene persists during perspective changes. Biology closes the structure around a restrained nucleus; programming resolves it into ordered layers and data paths. Captions identify conceptual illustration and avoid presenting the sculpture as scientific evidence.

Animation communicates this transformation. Shared ease-out timing, bounded artwork motion, pointer response and visibility pausing are managed by `synthesis-scene.js`. Auto follows system preferences, Full explicitly enables movement, Still shows a stable pose while keeping manual perspective selection usable. Text and controls remain immediately available. Keyboard focus, search state, open disclosures and the current reading position survive perspective changes.

## Content components

- Editorial profile with the full source summary, interests and connected study.
- Asymmetric searchable project archive, topical previews, complete project dialogs and supplied resource links.
- Experience timeline, publication bibliography, education journey and grouped skill atlas with counts derived from records.
- Credential previews and detail drawers, complete language scores, initially closed reference contacts and direct contact/profile links.
- Templates entry and gallery return preserve access to the previous collection.

The raw schema is owned by `public/data/cv-adapter.js`. New data shapes are adapted there, never inspected by scene or section code. Birth date, configuration, contracts and verification metadata are outside the professional presentation. Private captures and CV payloads stay outside public Git.

Implementation: `public/portfolio/synthesis.js`, `synthesis-scene.js`, `synthesis.css`; shared integration in runtime/studio/index. Detailed rationale and review scope: `docs/SYNTHESIS_DESIGN_PLAN_FA.md`; measured checks and deployment: `docs/BUILD_PROGRESS.json`.
