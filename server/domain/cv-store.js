'use strict';
async function importDocument(client, { principal, document, sourceHash, expectedRevision }) {
  if (!principal?.owner || principal.scope !== 'cv:import') throw new Error('IMPORT_NOT_AUTHORIZED');
  if (!document || typeof document !== 'object' || Array.isArray(document) || !Array.isArray(document.basics)) throw new Error('INVALID_CV');
  if (!Number.isSafeInteger(expectedRevision) || expectedRevision < 0) throw new Error('INVALID_REVISION');
  const key = `import:${sourceHash}`;
  await client.query('BEGIN');
  try {
    await client.query('SELECT pg_advisory_xact_lock(hashtext($1))', [`hero-lab:${principal.owner}`]);
    const duplicate = await client.query('SELECT revision FROM hero_lab.cv_audit WHERE owner_id=$1 AND idempotency_key=$2', [principal.owner, key]);
    if (duplicate.rows.length) {
      await client.query('COMMIT');
      return { revision: duplicate.rows[0].revision, replay: true };
    }
    const existing = await client.query('SELECT revision FROM hero_lab.cv_documents WHERE owner_id=$1 AND document_key=$2 FOR UPDATE', [principal.owner, 'primary']);
    const currentRevision = existing.rows[0]?.revision ?? 0;
    if (currentRevision !== expectedRevision) throw new Error('REVISION_CONFLICT');
    const revision = currentRevision + 1;
    await client.query(`INSERT INTO hero_lab.cv_documents(owner_id,document_key,document,source_sha256,revision)
      VALUES($1,'primary',$2::jsonb,$3,$4) ON CONFLICT(owner_id,document_key) DO UPDATE
      SET document=EXCLUDED.document,source_sha256=EXCLUDED.source_sha256,revision=EXCLUDED.revision,updated_at=now()`, [principal.owner, JSON.stringify(document), sourceHash, revision]);
    await client.query('INSERT INTO hero_lab.cv_audit(owner_id,idempotency_key,source_sha256,revision,scope) VALUES($1,$2,$3,$4,$5)', [principal.owner, key, sourceHash, revision, principal.scope]);
    await client.query('COMMIT');
    return { revision, replay: false };
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  }
}
module.exports = { importDocument };
