'use strict';
const { mintSession, cookie, sameOrigin, privateHeaders, json } = require('../server/auth');

async function readBody(req) {
  if (req.body !== undefined) return typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
  let body = '';
  for await (const chunk of req) {
    body += chunk;
    if (Buffer.byteLength(body) > 4096) throw new Error('BODY_TOO_LARGE');
  }
  return JSON.parse(body);
}
module.exports = async function session(req, res) {
  privateHeaders(res);
  if (!['POST', 'DELETE'].includes(req.method)) {
    res.setHeader('Allow', 'POST, DELETE');
    return json(res, 405, { error: 'METHOD_NOT_ALLOWED' });
  }
  if (!sameOrigin(req)) return json(res, 403, { error: 'ORIGIN_NOT_ALLOWED' });
  try {
    if (req.method === 'DELETE') {
      res.setHeader('Set-Cookie', cookie(req, null));
      return json(res, 200, { ok: true });
    }
    const body = await readBody(req);
    const token = mintSession(body?.password);
    if (!token) return json(res, 401, { error: 'INVALID_CREDENTIALS' });
    res.setHeader('Set-Cookie', cookie(req, token));
    return json(res, 200, { ok: true });
  } catch (error) {
    return json(res, error.message === 'ACCESS_NOT_CONFIGURED' ? 503 : 400, { error: error.message === 'ACCESS_NOT_CONFIGURED' ? 'ACCESS_NOT_CONFIGURED' : 'INVALID_REQUEST' });
  }
};
