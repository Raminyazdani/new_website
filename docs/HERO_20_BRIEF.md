# Hero collection contract

Expand the existing JSON-backed dashboard to exactly 20 genuinely distinct Hero compositions. Preserve API/authentication/Neon and existing section isolation. Every design includes the owner's actual profile photograph from `basics[0].Pictures` where `type_of` is `profile`. No hardcoded person, place, role, biography, photo URL, achievement or substitute portrait.

Three implementation collections register into `window.HeroLabDesigns` in script order. Each definition is `{ id, name, note, family, colors: [background, accent], motion, render(d, h) }`. Names/notes/motion descriptions are Persian UI labels. IDs are unique ASCII. `render` returns trusted composition markup, while all user data must go through `h.e` or the data-safe helpers.

Normalized data: `d.name`, `d.firstName`, `d.lastName`, `d.roles` (array), `d.summary`, `d.location`, `d.photoUrl`, `d.coverUrl`, `d.initials`. These are derived exclusively from the complete API document, without invented profile fallbacks. Missing fields are empty. Every composition must call `h.photo(d, 'optional-class')` at least once.

Helpers: `h.e(value)` escapes text/attribute data; `h.photo(d, className)` returns a `<figure class="h-photo ..."><img ...></figure>` with accessible name and safe error fallback; `h.name(d, className)` returns `<h1 class="h-name ...">`; `h.roles(d, className)` returns role text spans; `h.summary(d, className)` returns the complete biography in `<p class="h-summary ...">`; `h.location(d, className)` returns location markup; `h.actions()` returns local preview CTA buttons. Helpers omit empty factual fields. The shared root is `<article class="hero hero-ID">`. Scope all composition CSS under `.hero-ID`; global class names inside the root are okay. Prefix all keyframes with the collection letter and ID. Don't animate the full textual reading surface continuously.

Common CSS supplies box sizing, basic readable type, safe long-word wrapping, .h-photo image sizing, .h-actions controls, and optional summary line clamping. Each composition owns its layout, type treatment, image framing, colors and specific motion. The paragraph itself remains full data in DOM; a common toolbar can expand it. Prefer 540–700px desktop preview height that grows with content, not fixed clipping. At <=600px stack/reflow; no overlap or page overflow at 320px. Native fonts only, no external libraries/assets/requests. Pointer effects use root CSS `--px` and `--py` in [-1,1]. Motion controller and reduced-motion override apply globally. Avoid hardcoded animation-play-state overrides.

## Assigned compositions

- Collection A: atlas, cinema, studio, editorial, terminal, swiss, gallery.
- Collection B: orbital, noir, bento, kinetic, blueprint, glass, index.
- Collection C: split, poster, polaroid, sculpture, spotlight, ribbon.

Each differs materially in presentation, typography, portrait placement/shape, hierarchy and motion. These are original proposed combinations inspired by the digest, not 20 newly audited reference sites. Don't invent reference observations or claim source animations were verified. Do not edit API, credentials, private CV, original mockups or another owner's files. Implement first; coordinator performs one focused final verification pass.
