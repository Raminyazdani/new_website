'use strict';
const { readFile } = require('node:fs/promises');
const { join } = require('node:path');
const { createHash } = require('node:crypto');
const { Client } = require('pg');
const { importDocument } = require('../server/domain/cv-store');
async function main() {
  const [source, expected = '0'] = process.argv.slice(2);
  if (!source || !process.env.DATABASE_DIRECT_URL || !process.env.CV_OWNER_ID) throw new Error('Pass a private JSON path and configure DATABASE_DIRECT_URL/CV_OWNER_ID.');
  const raw = await readFile(source);
  const document = JSON.parse(raw.toString('utf8').replace(/^\uFEFF/, ''));
  const sourceHash = createHash('sha256').update(raw).digest('hex');
  const client = new Client({ connectionString: process.env.DATABASE_DIRECT_URL, connectionTimeoutMillis: 15000 });
  await client.connect();
  try {
    await client.query(await readFile(join(__dirname, '../server/db/001_cv.sql'), 'utf8'));
    const result = await importDocument(client, { principal: { owner: process.env.CV_OWNER_ID, scope: 'cv:import' }, document, sourceHash, expectedRevision: Number(expected) });
    console.log(JSON.stringify({ imported: true, ...result, source_sha256: sourceHash, top_level_keys: Object.keys(document).length }));
  } finally { await client.end(); }
}
main().catch(() => { console.error('CV import failed. Check private source, connection, and expected revision. No payload logged.'); process.exitCode = 1; });
