'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const { createHmac } = require('node:crypto');
const auth = require('../server/auth');
const session = require('../api/session');
const cv = require('../api/cv');

const envKeys = ['CV_ACCESS_PASSWORD', 'CV_SESSION_SECRET', 'CV_OWNER_ID', 'VERCEL'];
const savedEnv = Object.fromEntries(envKeys.map(key => [key, process.env[key]]));
const password = 'synthetic-contract-password-123';
const secret = 'synthetic-contract-signing-secret-123456';

function configure(overrides = {}) {
  process.env.CV_ACCESS_PASSWORD = password;
  process.env.CV_SESSION_SECRET = secret;
  process.env.CV_OWNER_ID = 'synthetic-owner-a';
  delete process.env.VERCEL;
  Object.assign(process.env, overrides);
}
function response() {
  return {
    headers: {}, statusCode: 200, body: '',
    setHeader(name, value) { this.headers[name.toLowerCase()] = value; },
    end(body) { this.body = body; },
  };
}
function req(method, { headers = {}, body } = {}) { return { method, headers, body }; }
function signed(payload, signingSecret = secret) {
  const encoded = Buffer.from(JSON.stringify(payload)).toString('base64url');
  const signature = createHmac('sha256', signingSecret).update(encoded).digest('base64url');
  return `hero_lab_session=${encoded}.${signature}`;
}

 test('session auth rejects missing and wrong passwords and issues a protected signed cookie', async t => {
  configure();
  const missing = response();
  await session(req('POST', { body: {} }), missing);
  assert.equal(missing.statusCode, 401);
  assert.equal(JSON.parse(missing.body).error, 'INVALID_CREDENTIALS');

  const wrong = response();
  await session(req('POST', { body: { password: 'wrong' } }), wrong);
  assert.equal(wrong.statusCode, 401);
  assert.equal(wrong.headers['set-cookie'], undefined);

  const good = response();
  await session(req('POST', { headers: { host: 'example.test', origin: 'https://example.test' }, body: { password } }), good);
  assert.equal(good.statusCode, 200);
  const setCookie = good.headers['set-cookie'];
  assert.match(setCookie, /HttpOnly/);
  assert.match(setCookie, /SameSite=Strict/);
  assert.match(setCookie, /Path=\//);
  assert.match(setCookie, /Max-Age=3600/);
  assert.doesNotMatch(setCookie, /Secure/);
  const token = setCookie.split(';')[0].slice('hero_lab_session='.length);
  assert.equal(auth.principal({ headers: { cookie: `hero_lab_session=${token}` } }).owner, 'synthetic-owner-a');
});

test('principal rejects tampered, expired, wrong-owner and wrong-scope sessions', () => {
  configure();
  const now = Math.floor(Date.now() / 1000);
  const valid = { owner: 'synthetic-owner-a', scope: 'cv:read', exp: now + 60 };
  const validCookie = signed(valid);
  assert.equal(auth.principal({ headers: { cookie: `${validCookie}x` } }), null);
  assert.equal(auth.principal({ headers: { cookie: signed({ ...valid, exp: now - 1 }) } }), null);
  assert.equal(auth.principal({ headers: { cookie: signed({ ...valid, owner: 'synthetic-owner-b' }) } }), null);
  assert.equal(auth.principal({ headers: { cookie: signed({ ...valid, scope: 'cv:write' }) } }), null);
  assert.equal(auth.principal({ headers: { cookie: signed(valid, 'different-synthetic-secret-123456789') } }), null);
  assert.equal(auth.principal({ headers: { cookie: 'hero_lab_session=' + 'x'.repeat(2049) } }), null);
});

test('session endpoint rejects cross-origin requests and unsupported methods', async () => {
  configure();
  const cross = response();
  await session(req('POST', { headers: { host: 'example.test', origin: 'https://attacker.test' }, body: { password } }), cross);
  assert.equal(cross.statusCode, 403);
  assert.equal(JSON.parse(cross.body).error, 'ORIGIN_NOT_ALLOWED');
  const wrongMethod = response();
  await session(req('GET'), wrongMethod);
  assert.equal(wrongMethod.statusCode, 405);
  assert.equal(wrongMethod.headers.allow, 'POST, DELETE');
});

test('CV endpoint returns private no-store unauthorized response without reading the database', async () => {
  configure();
  const res = response();
  await cv(req('GET'), res);
  assert.equal(res.statusCode, 401);
  assert.equal(JSON.parse(res.body).error, 'AUTHENTICATION_REQUIRED');
  assert.match(res.headers['cache-control'], /no-store/);
  assert.equal(res.headers['cdn-cache-control'], 'no-store');
  assert.equal(res.headers['vercel-cdn-cache-control'], 'no-store');
  assert.equal(res.headers['x-content-type-options'], 'nosniff');
  assert.equal(res.headers.vary, 'Cookie');
});

test('CV endpoint rejects unsupported methods before authentication', async () => {
  configure();
  const res = response();
  await cv(req('POST'), res);
  assert.equal(res.statusCode, 405);
  assert.equal(res.headers.allow, 'GET');
  assert.equal(JSON.parse(res.body).error, 'METHOD_NOT_ALLOWED');
});

test.after(() => {
  for (const key of envKeys) {
    if (savedEnv[key] === undefined) delete process.env[key];
    else process.env[key] = savedEnv[key];
  }
});
