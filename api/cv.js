'use strict';
const { principal, privateHeaders, json } = require('../server/auth');
const { getPool } = require('../server/db');
module.exports = async function cv(req, res) {
  privateHeaders(res);
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    return json(res, 405, { error: 'METHOD_NOT_ALLOWED' });
  }
  try {
    const owner = principal(req);
    if (!owner) return json(res, 401, { error: 'AUTHENTICATION_REQUIRED' });
    const result = await getPool().query('SELECT document, revision, source_sha256 FROM hero_lab.cv_documents WHERE owner_id = $1 AND document_key = $2', [owner.owner, 'primary']);
    if (!result.rows.length) return json(res, 404, { error: 'CV_NOT_IMPORTED' });
    const row = result.rows[0];
    res.setHeader('X-CV-Revision', String(row.revision));
    res.setHeader('X-CV-SHA256', row.source_sha256);
    return json(res, 200, row.document);
  } catch {
    return json(res, 503, { error: 'CV_UNAVAILABLE' });
  }
};
