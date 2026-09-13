const crypto = require('node:crypto');

const OWNER = 'Ahmed-Nashat';
const REPO = 'Portfolio-';
const FILE = 'client/public/content.json';
const COOKIE = '__Host-portfolio-session';
const STATE = '__Host-portfolio-state';
const origin = () => process.env.SITE_URL || 'https://ahmednashaat-steel.vercel.app';
const configured = () => Boolean(process.env.GITHUB_CLIENT_ID && process.env.GITHUB_CLIENT_SECRET && process.env.SESSION_SECRET?.length >= 32);
function seal(data) {
  if (!configured()) throw new Error('Login is not configured.');
  const iv = crypto.randomBytes(12);
  const key = crypto.createHash('sha256').update(process.env.SESSION_SECRET).digest();
  const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);
  const encrypted = Buffer.concat([cipher.update(JSON.stringify(data)), cipher.final()]);
  return Buffer.concat([iv, cipher.getAuthTag(), encrypted]).toString('base64url');
}
function unseal(value) {
  try {
    if (!configured() || !value) return null;
    const data = Buffer.from(value, 'base64url');
    const key = crypto.createHash('sha256').update(process.env.SESSION_SECRET).digest();
    const decipher = crypto.createDecipheriv('aes-256-gcm', key, data.subarray(0, 12));
    decipher.setAuthTag(data.subarray(12, 28));
    const result = JSON.parse(Buffer.concat([decipher.update(data.subarray(28)), decipher.final()]).toString());
    return result.exp > Date.now() ? result : null;
  } catch { return null; }
}
function cookies(req) {
  return Object.fromEntries((req.headers.cookie || '').split(';').map(part => { const i = part.indexOf('='); return i < 0 ? ['', ''] : [part.slice(0, i).trim(), part.slice(i + 1)]; }));
}
function cookie(name, value, age) { return `${name}=${value}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=${age}`; }
function session(req) {
  const user = unseal(cookies(req)[COOKIE]);
  return user?.kind === 'session' && user.login === OWNER && user.token ? user : null;
}
function sameOrigin(req) { return req.headers.origin === origin(); }
function json(res, status, data) { res.setHeader('Cache-Control', 'no-store'); return res.status(status).json(data); }
async function github(path, token, options = {}) {
  const response = await fetch(`https://api.github.com${path}`, { ...options, headers: { Accept: 'application/vnd.github+json', 'User-Agent': 'Ahmed-Portfolio-CMS', ...(token ? { Authorization: `Bearer ${token}` } : {}), ...options.headers }, signal: AbortSignal.timeout(10000) });
  const data = await response.json();
  if (!response.ok) { const error = new Error('GitHub request failed.'); error.status = response.status; throw error; }
  return data;
}
function validateContent(data) {
  if (!data || typeof data !== 'object' || Array.isArray(data)) throw new Error('Invalid content.');
  if (JSON.stringify(data).length > 150000) throw new Error('Content is too large.');
  const string = (value, max = 8000) => { if (typeof value !== 'string' || value.length > max) throw new Error('Invalid text field.'); return value; };
  const fields = (value, keys) => { if (!value || typeof value !== 'object') throw new Error('Missing section.'); return Object.fromEntries(keys.map(key => [key, string(value[key])])); };
  const list = (value, fn, max = 100) => { if (!Array.isArray(value) || value.length > max) throw new Error('Invalid list.'); return value.map(fn); };
  const url = value => { string(value, 2048); if (value && !/^https?:\/\//i.test(value)) throw new Error('Links must begin with https:// or http://.'); if (value) { const parsed = new URL(value); if (parsed.username || parsed.password) throw new Error('Invalid link.'); } return value; };
  const result = {
    site: fields(data.site, ['brand', 'terminalTitle', 'role', 'status']),
    about: { ...fields(data.about, ['intro', 'body']), philosophies: list(data.about.philosophies, value => string(value)) },
    education: fields(data.education, ['degree', 'school', 'years']),
    contact: fields(data.contact, ['intro', 'email', 'linkedin', 'github']),
    stack: list(data.stack, value => string(value, 150)),
    projects: list(data.projects, item => ({ ...fields(item, ['id', 'name', 'icon', 'description']), link: url(item.link), skills: list(item.skills, value => string(value, 150)) })),
    experience: list(data.experience, item => fields(item, ['id', 'date', 'title', 'subtitle', 'description', 'status']))
  };
  for (const key of ['projects', 'experience']) if (new Set(result[key].map(item => item.id)).size !== result[key].length) throw new Error('Duplicate record IDs.');
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(result.contact.email) || /[\r\n]/.test(result.contact.email)) throw new Error('Enter a valid email.');
  url(result.contact.github); url(result.contact.linkedin);
  return result;
}
module.exports = { OWNER, REPO, FILE, COOKIE, STATE, origin, configured, seal, unseal, cookies, cookie, session, sameOrigin, json, github, validateContent };
