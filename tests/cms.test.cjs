const { test } = require('node:test');
const assert = require('node:assert/strict');
const { randomBytes } = require('node:crypto');
const cms = require('../lib/cms.cjs');
const handler = require('../api/content.js');
const callback = require('../api/auth/callback.js');
process.env.GITHUB_CLIENT_ID = 'test-client';
process.env.GITHUB_CLIENT_SECRET = 'test-client-secret';
process.env.SESSION_SECRET = randomBytes(32).toString('hex');
function res() { return { headers: {}, setHeader(k, v) { this.headers[k] = v; }, status(n) { this.code = n; return this; }, json(data) { this.data = data; return this; }, redirect(code, url) { this.code = code; this.url = url; } }; }
function req(extra = {}) { return { method: 'PUT', headers: { origin: cms.origin(), 'content-type': 'application/json' }, query: {}, ...extra }; }
function authReq(extra = {}) { return req({ ...extra, headers: { ...req().headers, cookie: `${cms.COOKIE}=${cms.seal({ kind: 'session', login: cms.OWNER, token: 'test-only-token', exp: Date.now() + 60000 })}`, ...extra.headers } }); }
test('session encryption rejects tampering, expiration, and a different owner', () => {
  assert.ok(cms.session(authReq()));
  const token = cms.seal({ kind: 'session', login: cms.OWNER, token: 'test', exp: Date.now() + 10000 });
  assert.equal(cms.unseal('AAAA' + token.slice(4)), null);
  assert.equal(cms.unseal(cms.seal({ exp: Date.now() - 1 })), null);
  assert.equal(cms.session(req({ headers: { cookie: `${cms.COOKIE}=${cms.seal({ kind: 'session', login: 'someone-else', token: 'test', exp: Date.now() + 10000 })}` } })), null);
});
test('unauthenticated publishing and cross-origin publishing are rejected', async () => {
  const a = res(); await handler(req(), a); assert.equal(a.code, 401);
  const b = res(); await handler(authReq({ headers: { origin: 'https://untrusted.example' } }), b); assert.equal(b.code, 403);
});
test('validation accepts defaults, rejects unsafe links, malformed imports, and duplicate IDs', async () => {
  const { defaultContent } = await import('../client/src/content.js');
  assert.equal(cms.validateContent(defaultContent).projects.length, 3);
  const content = structuredClone(defaultContent); content.projects[0].link = 'javascript:alert(1)';
  assert.throws(() => cms.validateContent(content), /Links/);
  assert.throws(() => cms.validateContent({ projects: [] }));
  content.projects[0].link = 'https://example.com'; content.projects[1].id = content.projects[0].id;
  assert.throws(() => cms.validateContent(content), /Duplicate/);
});
test('invalid OAuth state never exchanges a code or creates a session', async () => {
  const response = res(); await callback(req({ method: 'GET', query: { code: 'test', state: 'invalid' } }), response);
  assert.equal(response.url, '/admin?error=state');
  assert.ok(response.headers['Set-Cookie'].every(value => value.includes('Max-Age=0')));
});
test('OAuth admits only the portfolio owner with write permission and keeps tokens out of responses', async () => {
  const originalFetch = global.fetch;
  const input = req({ method: 'GET', query: { state: 'valid', code: 'code' }, headers: { cookie: `${cms.STATE}=${cms.seal({ kind: 'oauth', state: 'valid', verifier: 'test-verifier', exp: Date.now() + 10000 })}` } });
  try {
    let login = 'someone-else';
    global.fetch = async url => ({ ok: true, json: async () => url.includes('access_token') ? { access_token: 'private-test-token' } : url.endsWith('/user') ? { login } : { permissions: { push: true } } });
    const denied = res(); await callback(input, denied); assert.equal(denied.url, '/admin?error=forbidden');
    login = cms.OWNER;
    const allowed = res(); await callback(input, allowed); assert.equal(allowed.url, '/admin');
    const sessionCookie = allowed.headers['Set-Cookie'][1];
    assert.ok(!sessionCookie.includes('private-test-token'));
    assert.ok(sessionCookie.includes('HttpOnly; Secure; SameSite=Lax'));
    assert.equal(cms.session(req({ headers: { cookie: sessionCookie } })).login, cms.OWNER);
  } finally { global.fetch = originalFetch; }
});
test('publishing writes the fixed repository file and rejects stale versions', async () => {
  const { defaultContent } = await import('../client/src/content.js');
  const originalFetch = global.fetch;
  try {
    global.fetch = async (url, options) => {
      assert.ok(url.endsWith('/repos/Ahmed-Nashat/Portfolio-/contents/client/public/content.json'));
      const body = JSON.parse(options.body);
      assert.equal(body.sha, 'a'.repeat(40)); assert.equal(body.branch, 'main');
      assert.equal(JSON.parse(Buffer.from(body.content, 'base64')).projects.length, 3);
      return { ok: true, json: async () => ({ content: { sha: 'b'.repeat(40) } }) };
    };
    const response = res(); await handler(authReq({ body: { content: defaultContent, revision: 'a'.repeat(40) } }), response);
    assert.equal(response.code, 200); assert.equal(response.data.revision, 'b'.repeat(40));
    global.fetch = async () => ({ ok: false, status: 409, json: async () => ({}) });
    const conflict = res(); await handler(authReq({ body: { content: defaultContent, revision: 'a'.repeat(40) } }), conflict);
    assert.equal(conflict.code, 409);
  } finally { global.fetch = originalFetch; }
});
test('public reads use shared content and return a safe empty initial state', async () => {
  const { defaultContent } = await import('../client/src/content.js');
  const originalFetch = global.fetch;
  try {
    global.fetch = async () => ({ ok: true, json: async () => defaultContent });
    const response = res(); await handler(req({ method: 'GET' }), response);
    assert.equal(response.data.content.projects[0].name, 'program_lms');
    global.fetch = async () => ({ ok: false, status: 404 });
    const empty = res(); await handler(req({ method: 'GET' }), empty); assert.equal(empty.data.content, null);
  } finally { global.fetch = originalFetch; }
});
