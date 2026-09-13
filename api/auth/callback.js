const { OWNER, REPO, COOKIE, STATE, origin, seal, unseal, cookies, cookie, github } = require('../../lib/cms.cjs');
module.exports = async (req, res) => {
  res.setHeader('Cache-Control', 'no-store');
  res.setHeader('Set-Cookie', [cookie(STATE, '', 0), cookie(COOKIE, '', 0)]);
  try {
    const state = unseal(cookies(req)[STATE]);
    if (req.method !== 'GET' || state?.kind !== 'oauth' || typeof req.query.state !== 'string' || state.state !== req.query.state || typeof req.query.code !== 'string') return res.redirect(303, '/admin?error=state');
    const response = await fetch('https://github.com/login/oauth/access_token', { method: 'POST', headers: { Accept: 'application/json', 'Content-Type': 'application/json' }, body: JSON.stringify({ client_id: process.env.GITHUB_CLIENT_ID, client_secret: process.env.GITHUB_CLIENT_SECRET, code: req.query.code, code_verifier: state.verifier, redirect_uri: `${origin()}/api/auth/callback` }), signal: AbortSignal.timeout(10000) });
    const auth = await response.json();
    if (!response.ok || !auth.access_token) throw new Error('Authorization failed.');
    const user = await github('/user', auth.access_token);
    if (user.login !== OWNER) return res.redirect(303, '/admin?error=forbidden');
    const repo = await github(`/repos/${OWNER}/${REPO}`, auth.access_token);
    if (!repo.permissions?.push) return res.redirect(303, '/admin?error=permission');
    res.setHeader('Set-Cookie', [cookie(STATE, '', 0), cookie(COOKIE, seal({ kind: 'session', login: OWNER, token: auth.access_token, exp: Date.now() + 8 * 3600000 }), 8 * 3600)]);
    return res.redirect(303, '/admin');
  } catch { return res.redirect(303, '/admin?error=login'); }
};
