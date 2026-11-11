# Portfolio / Field Notes

A complete animated CV portfolio, with the original collection of 20 Hero concepts retained at `/lab.html`. Profile facts and photographs are read from the complete private CV document in Neon Postgres.

The primary experience is **Synthesis**: one portfolio with All disciplines, Life sciences, and Engineering + ML perspectives. Open `/?design=synthesis&perspective=all`. Beyond the shared scientific scene, these perspectives change the project browser, experience chronology and skill composition: editorial archive, specimen tray/taxonomy, or file workbench/module inventory. All eleven professional sections and complete records remain available.

**Follow the story** opens a connected, scroll-controlled cell → molecular structure → computational network transformation. Life sciences includes an interactive organic project habitat; Engineering + ML combines Files / Document / Properties with a Source → Method → Artifact inspector for the same selected project. Mobile uses selectable panels, and Still retains manual story controls. See the [final Synthesis integration and review](docs/SYNTHESIS_FINAL_PLAN_FA.md).

The **Templates** control opens **66 designs**: the preserved 50, 12 interactive Experiences, and four standalone bioinformatics worlds. Open `/?design=synthesis&gallery=1&collection=bioinformatics` to compare **Microcosm, Flowcell, Cellscape and Foldspace**. These are independent React compositions in the New Web collection, using its existing private data adapter and localized routes. See [their direction and review](docs/FOUR_BIO_WORLDS_FA.md).

Open `/?design=synthesis&gallery=1&collection=experiential` to browse Tissue, Culture, Chromatogram, Residue, Continuum, Cabinet, Foundry, Runtime, Tensor, Patchbay, Prism and Expedition. Each has its own interaction and custom hero/project/experience/skills composition; secondary records share the complete canonical presentation. Gallery previews are actual browser captures using fictional data, never private CV screenshots.

See the [Experiences plan and review](docs/EXPERIENCES_PLAN_FA.md), [Synthesis design plan](docs/SYNTHESIS_DESIGN_PLAN_FA.md), [built visual system](DESIGN.md), and observed release checks in `docs/BUILD_PROGRESS.json`.

## Data flow

Private import → Neon `hero_lab.cv_documents.document` (opaque JSONB object) → authenticated `GET /api/cv` → source boundary → adapter → stable `PortfolioModel v1` → section renderers. The complete document is retained in memory; renderers receive only the normalized model. No sample-profile fallback exists.

`public/data/cv-adapter.js` alone understands the current CV keys. `public/data/portfolio-source.js` owns transport/parsing and supports injected sources/adapters. A different future schema or non-JSON source is handled at that boundary while the UI contract stays fixed; no Renderer reads raw CV keys. Storage validates only the document envelope. See [the model contract](docs/PORTFOLIO_CONTRACT.md) and [the phased plan](docs/PORTFOLIO_PLAN_FA.md).

The main portfolio includes introduction, projects, experience, publications, education, skills, certificates, languages, references and contact. Search, filters, progressive lists and project dialogs retain access to all records. Motion `Auto` respects the system preference; `Full` explicitly enables effects locally and `Still` stops them. No system accessibility setting is changed.

The preserved laboratory keeps its original `window.heroLabView.cv` interface and its 20 standalone Hero proposals, and also consumes the same source/adapter boundary rather than raw CV keys.

Open `/?gallery=1` to browse the two existing collections and the 20 New Web templates together. New Web uses the original design components under `/imported/{en,de,fa}/`, with the same session and CV API. The template adapter converts the normalized portfolio model to the design components' `SiteData` format in the browser.

The API returns the entire CV object without an envelope. `X-CV-Revision` and `X-CV-SHA256` carry import metadata. Responses are private/no-store. The original CV and credentials must never be committed or placed under `public/`.

## Run

1. `npm install`
2. Configure `.env.local` from `.env.example` with private values; application traffic uses pooled `DATABASE_URL`, migration/import uses direct `DATABASE_DIRECT_URL`.
3. `npm run seed -- /absolute/private/cv.json 0` for the first import. Later changed imports pass the current expected revision. Replays of the same file are idempotent.
4. `npm run dev`, then open the printed URL and enter the configured access password.

Run `npm run build` before previewing the imported templates locally. It installs their pinned dependencies, exports the three language routes and stages the static shell under `public/imported/`. Vercel runs the same build command. The export contains the template code and interface copy; the CV loads after authentication.

The public UI initially contains no profile data. `POST /api/session` accepts `{ "password": "..." }` and sets a one-hour HttpOnly session cookie. `DELETE /api/session` removes it. No CV writes are exposed to the browser.

## Deployment

Target repository: `Raminyazdani/new_website`. Target new Vercel project: `new-website-hero-lab`. Set `DATABASE_URL`, `CV_OWNER_ID`, `CV_ACCESS_PASSWORD`, `CV_SESSION_SECRET` as server-only environment variables. Never upload the source JSON, `.env.local`, `.neon`, `neon.private.json`, or private access notes. The direct migration URL is not needed on Vercel.

Implementation uses the documented [Vercel Node.js runtime](https://vercel.com/docs/functions/runtimes/node-js), [connection pool lifecycle](https://vercel.com/kb/guide/connection-pooling-with-functions), and [Neon connection strings](https://neon.com/docs/cli/connection-string).
