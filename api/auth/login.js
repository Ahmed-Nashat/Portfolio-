const { origin, configured, seal, cookie, STATE, json } = require('../../lib/cms.cjs');
const { randomBytes, createHash } = require('node:crypto');
module.exports = (req, res) => {
  if (req.method !== 'GET') return json(res, 405, { error: 'Method not allowed.' });
  if (!configured()) return res.redirect(303, '/admin?error=setup');
  const state = randomBytes(32).toString('hex');
  const verifier = randomBytes(32).toString('base64url');
  res.setHeader('Cache-Control', 'no-store');
  res.setHeader('Set-Cookie', cookie(STATE, seal({ kind: 'oauth', state, verifier, exp: Date.now() + 600000 }), 600));
  const query = new URLSearchParams({ client_id: process.env.GITHUB_CLIENT_ID, redirect_uri: `${origin()}/api/auth/callback`, scope: 'public_repo', state, code_challenge: createHash('sha256').update(verifier).digest('base64url'), code_challenge_method: 'S256' });
  res.redirect(303, `https://github.com/login/oauth/authorize?${query}`);
};
