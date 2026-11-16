const { test } = require('node:test');
const assert = require('node:assert/strict');
const { normalizeProject, actions, renderActions } = require('../client/public/project-links.js');
const { validateContent } = require('../lib/cms.cjs');
test('legacy migration preserves URLs and classifies only actual github.com hosts as repositories', () => {
  assert.equal(normalizeProject({ link: 'https://github.com/owner/repo' }).githubUrl, 'https://github.com/owner/repo');
  assert.equal(normalizeProject({ link: 'https://demo.vercel.app' }).liveUrl, 'https://demo.vercel.app');
  assert.equal(normalizeProject({ link: 'https://github.com.example.com' }).liveUrl, 'https://github.com.example.com');
  assert.equal(normalizeProject({ link: 'https://github.com/old', githubUrl: '' }).githubUrl, '');
});
test('cards show two, one, or no usable actions independently', () => {
  assert.deepEqual(actions({ githubUrl: 'https://github.com/a/b', liveUrl: 'https://demo.example' }).map(a => a.label), ['Live Demo', 'GitHub']);
  assert.deepEqual(actions({ githubUrl: 'https://github.com/a/b' }).map(a => a.label), ['GitHub']);
  assert.deepEqual(actions({ liveUrl: 'https://demo.example' }).map(a => a.label), ['Live Demo']);
  assert.deepEqual(actions({ githubUrl: '', liveUrl: '' }), []);
  assert.deepEqual(actions({ liveUrl: 'javascript:alert(1)' }), []);
});
test('server saves both fields, migrates old backups, and allows clearing both', async () => {
  const { defaultContent, normalizeContent, validateImport } = await import('../client/src/content.js');
  const content = structuredClone(defaultContent);
  content.projects[0].liveUrl = 'https://demo.example';
  const saved = validateContent(content);
  assert.equal(saved.projects[0].liveUrl, 'https://demo.example');
  assert.equal(saved.projects[0].githubUrl, content.projects[0].githubUrl);
  delete content.projects[0].githubUrl; delete content.projects[0].liveUrl;
  content.projects[0].link = 'https://github.com/legacy/repo';
  const migrated = normalizeContent(content); validateImport(migrated);
  assert.equal(validateContent(content).projects[0].githubUrl, 'https://github.com/legacy/repo');
  migrated.projects[0].githubUrl = ''; migrated.projects[0].liveUrl = '';
  assert.equal(validateContent(migrated).projects[0].githubUrl, '');
  migrated.projects[0].liveUrl = 'javascript:alert(1)';
  assert.throws(() => validateContent(migrated), /Links/);
});
test('new project details and optional skills setting survive validation while older data receives safe defaults', async () => {
  const { defaultContent } = await import('../client/src/content.js');
  const content = structuredClone(defaultContent);
  content.site.skillsEvidence = true;
  Object.assign(content.projects[0], { problem: 'Challenge', role: 'Developer', features: 'Search', screenshots: 'https://example.com/screen.png' });
  const saved = validateContent(content);
  assert.equal(saved.site.skillsEvidence, true);
  assert.equal(saved.projects[0].role, 'Developer');
  assert.equal(saved.projects[0].screenshots, 'https://example.com/screen.png');
  delete content.site.skillsEvidence; delete content.projects[0].problem;
  assert.equal(validateContent(content).site.skillsEvidence, false);
  assert.equal(validateContent(content).projects[0].problem, '');
  content.projects[0].screenshots = 'javascript:alert(1)';
  assert.throws(() => validateContent(content));
});
test('rendered actions have independent destinations, icons, safe new tabs, and accessible labels', () => {
  const element = tag => ({ tag, children: [], attributes: {}, append(...items) { this.children.push(...items); }, setAttribute(key, value) { this.attributes[key] = value; } });
  const doc = { createElement: element, createElementNS: (_, tag) => element(tag), createTextNode: text => ({ text }) };
  const group = renderActions({ name: 'Example', githubUrl: 'https://github.com/a/b', liveUrl: 'https://demo.example/' }, doc);
  assert.equal(group.children.length, 2);
  assert.equal(group.children[0].href, 'https://demo.example/');
  assert.equal(group.children[1].href, 'https://github.com/a/b');
  for (const link of group.children) {
    assert.equal(link.target, '_blank'); assert.equal(link.rel, 'noopener noreferrer');
    assert.match(link.attributes['aria-label'], /Example.*opens in new tab/);
    assert.equal(link.children[0].attributes['aria-hidden'], 'true');
  }
  assert.equal(group.children[1].children[0].tag, 'svg');
  assert.equal(renderActions({}, doc), null);
});
