const { OWNER, REPO, FILE, session, sameOrigin, json, github, validateContent } = require('../lib/cms.cjs');
const path = `/repos/${OWNER}/${REPO}/contents/${FILE}`;
module.exports = async (req, res) => {
  try {
    const user = session(req);
    if (req.method === 'GET') {
      if (req.query.edit === '1') {
        if (!user) return json(res, 401, { error: 'Sign in to edit.' });
        try {
          const file = await github(`${path}?ref=main`, user.token);
          return json(res, 200, { content: validateContent(JSON.parse(Buffer.from(file.content, 'base64').toString())), revision: file.sha });
        } catch (error) { if (error.status === 404) return json(res, 200, { content: null, revision: null }); throw error; }
      }
      const response = await fetch(`https://raw.githubusercontent.com/${OWNER}/${REPO}/main/${FILE}`, { signal: AbortSignal.timeout(8000) });
      if (response.status === 404) return json(res, 200, { content: null });
      if (!response.ok) throw new Error('Content unavailable.');
      const content = validateContent(await response.json());
      res.setHeader('Cache-Control', 'public, s-maxage=30, stale-while-revalidate=60');
      return res.status(200).json({ content });
    }
    if (req.method !== 'PUT') return json(res, 405, { error: 'Method not allowed.' });
    if (!user) return json(res, 401, { error: 'Your session expired. Sign in again.' });
    if (!sameOrigin(req)) return json(res, 403, { error: 'Invalid origin.' });
    if (!req.headers['content-type']?.startsWith('application/json')) return json(res, 415, { error: 'Expected JSON.' });
    let content;
    try { content = validateContent(req.body?.content); } catch (error) { return json(res, 400, { error: error.message }); }
    const revision = req.body.revision;
    if (revision !== null && (typeof revision !== 'string' || !/^[a-f0-9]{40}$/.test(revision))) return json(res, 400, { error: 'Invalid revision. Reload the editor.' });
    const result = await github(path, user.token, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ message: 'Publish portfolio content from dashboard', branch: 'main', content: Buffer.from(JSON.stringify(content, null, 2) + '\n').toString('base64'), ...(revision ? { sha: revision } : {}) }) });
    return json(res, 200, { revision: result.content.sha });
  } catch (error) {
    if ([409, 422].includes(error.status)) return json(res, 409, { error: 'Content changed in another session. Export your draft, then reload before publishing.' });
    if ([401, 403].includes(error.status)) return json(res, 401, { error: 'GitHub access expired or repository write permission is missing. Sign in again.' });
    return json(res, 502, { error: 'Content service is unavailable. Your draft has not been published. Try again.' });
  }
};
