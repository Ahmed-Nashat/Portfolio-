const { configured, session, json } = require('../../lib/cms.cjs');
module.exports = (req, res) => {
  if (req.method !== 'GET') return json(res, 405, { error: 'Method not allowed.' });
  const user = session(req);
  return json(res, 200, { configured: configured(), authenticated: Boolean(user), login: user?.login || null });
};
