# Hero Lab

A collection of 20 distinct Hero compositions, each displaying the profile photograph and identity read only from the complete CV JSON stored in Neon Postgres.

## Data flow

Private import → Neon `hero_lab.cv_documents.document` (JSONB) → authenticated `GET /api/cv` → complete in-memory `window.heroLabView.cv` → `basics[0]` Hero mapping, including `Pictures[type_of=profile].URL` for every portrait. Missing fields are hidden. No sample-profile fallback exists. Other portfolio sections remain unimplemented.

The API returns the entire CV object without an envelope. `X-CV-Revision` and `X-CV-SHA256` carry import metadata. Responses are private/no-store. The original CV and credentials must never be committed or placed under `public/`.

## Run

1. `npm install`
2. Configure `.env.local` from `.env.example` with private values; application traffic uses pooled `DATABASE_URL`, migration/import uses direct `DATABASE_DIRECT_URL`.
3. `npm run seed -- /absolute/private/cv.json 0` for the first import. Later changed imports pass the current expected revision. Replays of the same file are idempotent.
4. `npm run dev`, then open the printed URL and enter the configured access password.

The public UI initially contains no profile data. `POST /api/session` accepts `{ "password": "..." }` and sets a one-hour HttpOnly session cookie. `DELETE /api/session` removes it. No CV writes are exposed to the browser.

## Deployment

Target repository: `Raminyazdani/new_website`. Target new Vercel project: `new-website-hero-lab`. Set `DATABASE_URL`, `CV_OWNER_ID`, `CV_ACCESS_PASSWORD`, `CV_SESSION_SECRET` as server-only environment variables. Never upload the source JSON, `.env.local`, `.neon`, `neon.private.json`, or private access notes. The direct migration URL is not needed on Vercel.

Implementation uses the documented [Vercel Node.js runtime](https://vercel.com/docs/functions/runtimes/node-js), [connection pool lifecycle](https://vercel.com/kb/guide/connection-pooling-with-functions), and [Neon connection strings](https://neon.com/docs/cli/connection-string).
