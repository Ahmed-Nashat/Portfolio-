(function (root) {
  function normalizeProject(project) {
    const { link, ...rest } = project;
    const result = { ...rest, githubUrl: project.githubUrl ?? '', liveUrl: project.liveUrl ?? '' };
    if (typeof link === 'string' && link.trim()) {
      let repository = false;
      try { repository = /^(www\.)?github\.com$/i.test(new URL(link.trim()).hostname); } catch (_) {}
      const field = repository ? 'githubUrl' : 'liveUrl';
      if (project[field] === undefined) result[field] = link.trim();
    }
    return result;
  }
  function safeUrl(value) {
    if (typeof value !== 'string' || !value.trim()) return '';
    try { const url = new URL(value.trim()); return ['https:', 'http:'].includes(url.protocol) && !url.username && !url.password ? url.href : ''; } catch (_) { return ''; }
  }
  function actions(project) {
    const item = normalizeProject(project);
    return [{ label: 'Live Demo', url: safeUrl(item.liveUrl), icon: 'public' }, { label: 'GitHub', url: safeUrl(item.githubUrl), icon: 'github' }].filter(action => action.url);
  }
  function renderActions(project, doc = document) {
    const available = actions(project);
    if (!available.length) return null;
    const group = doc.createElement('div'); group.className = 'project-actions';
    available.forEach(action => {
      const anchor = doc.createElement('a');
      anchor.className = 'project-link text-tertiary font-code-sm';
      anchor.href = action.url; anchor.target = '_blank'; anchor.rel = 'noopener noreferrer';
      anchor.setAttribute('aria-label', `${action.label} — ${project.name || 'project'} (opens in new tab)`);
      if (action.icon === 'github') {
        const svg = doc.createElementNS('http://www.w3.org/2000/svg', 'svg');
        svg.setAttribute('viewBox', '0 0 24 24'); svg.setAttribute('fill', 'currentColor'); svg.setAttribute('aria-hidden', 'true');
        const path = doc.createElementNS('http://www.w3.org/2000/svg', 'path');
        path.setAttribute('d', 'M12 .5C5.37.5 0 5.87 0 12.5c0 5.3 3.44 9.8 8.21 11.39.6.11.82-.26.82-.58v-2.23c-3.34.73-4.04-1.42-4.04-1.42-.55-1.39-1.33-1.76-1.33-1.76-1.09-.74.08-.73.08-.73 1.2.08 1.83 1.23 1.83 1.23 1.07 1.83 2.81 1.3 3.49.99.11-.78.42-1.3.76-1.6-2.67-.3-5.47-1.33-5.47-5.93 0-1.31.47-2.38 1.24-3.22-.13-.3-.54-1.52.12-3.18 0 0 1.01-.32 3.3 1.23A11.5 11.5 0 0112 6.29c1.02 0 2.05.14 3.01.4 2.29-1.55 3.3-1.23 3.3-1.23.66 1.66.25 2.88.12 3.18.77.84 1.24 1.91 1.24 3.22 0 4.61-2.8 5.63-5.48 5.93.43.37.82 1.1.82 2.22v3.3c0 .32.22.69.83.57A12 12 0 0024 12.5C24 5.87 18.63.5 12 .5z');
        svg.append(path); anchor.append(svg);
      } else { const icon = doc.createElement('span'); icon.className = 'material-symbols-outlined'; icon.setAttribute('aria-hidden', 'true'); icon.textContent = 'public'; anchor.append(icon); }
      anchor.append(doc.createTextNode(action.label)); group.append(anchor);
    });
    return group;
  }
  const api = { normalizeProject, safeUrl, actions, renderActions };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  root.PortfolioProjectLinks = api;
})(globalThis);
