'use strict';
const { createHmac, createHash, timingSafeEqual } = require('node:crypto');
const COOKIE = 'hero_lab_session';
const TTL = 60 * 60;

function settings() {
  const password = process.env.CV_ACCESS_PASSWORD;
  const secret = process.env.CV_SESSION_SECRET;
  const owner = process.env.CV_OWNER_ID;
  if (!password || password.length < 20 || !secret || secret.length < 32 || !owner) {
    throw new Error('ACCESS_NOT_CONFIGURED');
  }
  return { password, secret, owner };
}
function equal(a, b) {
  return timingSafeEqual(createHash('sha256').update(String(a)).digest(), createHash('sha256').update(String(b)).digest());
}
function sign(payload, secret) { return createHmac('sha256', secret).update(payload).digest('base64url'); }
function mintSession(password) {
  const config = settings();
  if (typeof password !== 'string' || !equal(password, config.password)) return null;
  const payload = Buffer.from(JSON.stringify({ owner: config.owner, scope: 'cv:read', exp: Math.floor(Date.now() / 1000) + TTL })).toString('base64url');
  return `${payload}.${sign(payload, config.secret)}`;
}
function principal(req) {
  const config = settings();
  const value = (req.headers.cookie || '').split(';').map(s => s.trim()).find(s => s.startsWith(`${COOKIE}=`))?.slice(COOKIE.length + 1);
  if (!value || value.length > 2048) return null;
  const parts = value.split('.');
  if (parts.length !== 2 || !equal(parts[1], sign(parts[0], config.secret))) return null;
  try {
    const data = JSON.parse(Buffer.from(parts[0], 'base64url').toString('utf8'));
    return data.owner === config.owner && data.scope === 'cv:read' && Number.isFinite(data.exp) && data.exp > Date.now() / 1000 ? data : null;
  } catch { return null; }
}
function cookie(req, token) {
  const secure = process.env.VERCEL || req.headers['x-forwarded-proto'] === 'https';
  return `${COOKIE}=${token || ''}; Path=/; HttpOnly; SameSite=Strict; Max-Age=${token ? TTL : 0}${secure ? '; Secure' : ''}`;
}
function sameOrigin(req) {
  if (req.headers['sec-fetch-site'] === 'cross-site') return false;
  if (!req.headers.origin) return true; // Non-browser API clients may omit Origin.
  try { return new URL(req.headers.origin).host === req.headers.host; } catch { return false; }
}
function privateHeaders(res) {
  res.setHeader('Cache-Control', 'private, no-store, max-age=0');
  res.setHeader('CDN-Cache-Control', 'no-store');
  res.setHeader('Vercel-CDN-Cache-Control', 'no-store');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('Vary', 'Cookie');
}
function json(res, status, data) {
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.end(JSON.stringify(data));
}
module.exports = { mintSession, principal, cookie, sameOrigin, privateHeaders, json };
