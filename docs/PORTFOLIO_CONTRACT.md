# PortfolioModel v1 and renderer integration

All profile facts come from the source boundary, never literals in section code. Browser globals: `window.PortfolioData.adaptCV(raw)` and `window.PortfolioData.load({fetchImpl?,signal?,adapter?})`; load returns `{ raw, model }`. Pure adapter also exports CommonJS for Node tests. Adapters may be injected for a different future raw schema. Don't expose private source/config IDs as public DOM IDs.

Stable model:
```
{
 version: 1,
 identity: { name, givenName, familyName, initials, roles: string[], summary,
   location, avatarUrl, coverUrl },
 profiles: [{id,network,label,url}],
 contact: {email,phone},
 education: [{id,institution,location,field,degree,start,end,gpa,logoUrl,tags:[]}],
 experience: [{id,title,organization,period,description,tags:[]}],
 projects: [{id,title,description,url,tags:[]}],
 publications: [{id,title,authors:[],kind,status,year,venue,publisher,doi,isbn,url,citation,notes}],
 skillGroups: [{id,name,groups:[{id,name,items:[{id,name,shortName,tags:[]}]}]}],
 certificates: [{id,issuer,title,date,duration,url,hasCertificate,tags:[]}],
 languages: [{id,name,level,cefr,status,tests:[{id,name,issuer,date,url,scores:[{label,value,max}]}]}],
 references: [{id,name,title,department,organization,location,email,phone,url}],
 interests: [{id,title,description,icon}],
 stats: {projects,experience,education,publications,skills,certificates,languages,references},
 warnings: string[]
}
```
Every string defaults to empty, arrays to []; meaningful zero/false values must be retained. Input order retained; no inferred chronology or skill proficiency. Normalize URLs safely; no javascript/data schemes. Preserve literal publication status. Fields absent in source stay absent/empty. Warnings must not include sensitive payloads. Raw CV is retained by load, but section renderers receive only the stable model.

Renderer registration: `window.PortfolioRenderers = {...(window.PortfolioRenderers||{}), hero(vm,h){return HTML}, ... }`. Root coordinator composes order: hero, about, projects, experience, publications, education, skills, certificates, languages, references, contact.

Helpers: `h.e(value)` HTML/attribute escaping; `h.link(url,label,className='')` safe external/mail/tel link; `h.portrait(identity,className='')` actual profile image with graceful error state; `h.chips(strings,limit=4)` escaped tags; `h.number(number)` actual numeric formatting; `h.heading(number,eyebrow,title,description='')` section heading (static UI copy). All personalized text uses model fields or these helpers. UI labels and decorative abstract artwork may be static; no fake testimonials, metrics, availability, results or employer relations.

Styles use shared variables: `--ink:#0c1718; --surface:#142526; --paper:#eeeadd; --text:#edeade; --muted:#a5b3ac; --lime:#d9f575; --coral:#ec9c7d; --line:rgba(237,234,222,.16)`. Root common classes: `.pf-section`, `.pf-wrap`, `.pf-heading`, `.pf-kicker`, `.pf-title`, `.pf-description`, `.pf-chip`, `.pf-button`, `.pf-button.primary`, `.pf-reveal`, `.pf-portrait`. Native fonts: Arial/Segoe UI sans, Georgia serif, ui-monospace metadata. Root adds responsive base styles, focus, dialog, disclosure and motion controls. Scope own CSS classes with `intro-` or `record-` prefixes. Layouts 320px minimum, stack when narrow; no fixed-height text clipping. Distinct layouts and enough negative space; actual text can be long. CSS art is decorative (`aria-hidden`), no external libraries/CDN. Continuous motion only on ornaments/portrait, readable text stays stable. Motion is enabled under `body[data-effects="on"]`, disabled under `[data-effects="off"]`; root chooses Auto/Full/Still and visibility pausing. No private records, screenshots or credentials in source/tests.

Runtime integration hooks:
- `data-section="id"` on each root section; add `id` matching renderer name.
- `data-tilt` on hover cards, `data-parallax` decorative hero layers; runtime handles.
- Projects: `[data-project-search]`, `[data-project-filter]` select, `[data-project-card]` with `data-project-id`, `[data-project-more]`, `[data-project-empty]`. Root applies search+filter and pagination initially 6/9, preserving all cards in model, can lazy-render or hide them. `data-open-project="canonical-id"` opens modal from model.
- Experience/details: native `<details>` for full descriptions, all records retained.
- Publications: `data-copy-citation="id"` button, native details for notes, h.link for provided DOI/URL.
- Skills: `data-skill-search`, `[data-skill-item]` with text, native details grouped categories. No invented percent meters.
- Certificates: `[data-cert-search]`, `[data-cert-issuer]` select, `[data-cert-card]` with data-cert-id, `[data-cert-more]`, `[data-cert-empty]`; runtime applies search/filter/show more. All source certificates accessible.
- Languages/references use native details. References contact details hidden by default. Do not auto-disclose them.
- Navigation anchors use real section IDs; CTAs to #projects/#publications/#contact, no fake downloads or nonworking buttons.
- Each section may use its own reveal/ornamental CSS animations gated by data-effects on. No event listeners/API calls in renderers: root owns runtime. No direct raw schema keys or JSON fetching in renderers.
