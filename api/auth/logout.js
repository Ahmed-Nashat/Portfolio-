const { sameOrigin, cookie, COOKIE, json } = require('../../lib/cms.cjs');
module.exports = (req, res) => {
  if (req.method !== 'POST') return json(res, 405, { error: 'Method not allowed.' });
  if (!sameOrigin(req)) return json(res, 403, { error: 'Invalid origin.' });
  res.setHeader('Set-Cookie', cookie(COOKIE, '', 0));
  return json(res, 200, { ok: true });
};
