import { useMemo, useState } from 'react';
import { defaultContent, loadContent, saveContent, contentKey } from './content';

const tabs = [
  ['site', 'SITE'], ['about', 'ABOUT'], ['education', 'EDUCATION'], ['experience', 'EXPERIENCE'], ['projects', 'PROJECTS'], ['stack', 'STACK'], ['contact', 'CONTACT']
];

function Field({ label, value, onChange, multiline = false, placeholder }) {
  const props = { value: value ?? '', onChange: (event) => onChange(event.target.value), placeholder };
  return <label className="admin-field"><span>{label}</span>{multiline ? <textarea {...props} rows={4} /> : <input {...props} />}</label>;
}

function SectionTitle({ title, detail }) { return <div className="admin-section-title"><div><span className="admin-kicker">/ editor</span><h2>{title}</h2></div><span>{detail}</span></div>; }

function Dashboard() {
  const [content, setContent] = useState(loadContent);
  const [activeTab, setActiveTab] = useState('site');
  const [notice, setNotice] = useState('LOCAL_DRAFT');
  const [selectedProject, setSelectedProject] = useState(null);
  const update = (path, value) => setContent((current) => {
    const next = structuredClone(current);
    let target = next;
    path.slice(0, -1).forEach((key) => { target = target[key]; });
    target[path[path.length - 1]] = value;
    return next;
  });
  const save = () => { saveContent(content); setNotice('SAVED ✓'); window.setTimeout(() => setNotice('LOCAL_DRAFT'), 1800); };
  const reset = () => { if (window.confirm('Reset all dashboard content to the original portfolio data?')) { setContent(structuredClone(defaultContent)); saveContent(defaultContent); setNotice('RESET ✓'); } };
  const exportData = () => { const blob = new Blob([JSON.stringify(content, null, 2)], { type: 'application/json' }); const link = document.createElement('a'); link.href = URL.createObjectURL(blob); link.download = 'portfolio-content.json'; link.click(); URL.revokeObjectURL(link.href); };
  const importData = (event) => { const file = event.target.files?.[0]; if (!file) return; const reader = new FileReader(); reader.onload = () => { try { setContent(JSON.parse(reader.result)); setNotice('IMPORTED ✓'); } catch { setNotice('INVALID_JSON'); } }; reader.readAsText(file); event.target.value = ''; };
  const project = selectedProject === 'new' ? { id: `project-${Date.now()}`, name: '', icon: 'code', description: '', skills: [], link: '' } : content.projects.find((item) => item.id === selectedProject);
  const updateProject = (key, value) => setContent((current) => ({ ...current, projects: current.projects.map((item) => item.id === project.id ? { ...item, [key]: key === 'skills' ? value.split(',').map((skill) => skill.trim()).filter(Boolean) : value } : item) }));
  const addProject = () => { const next = { id: `project-${Date.now()}`, name: 'new_project', icon: 'code', description: 'Describe this project.', skills: [], link: '' }; setContent((current) => ({ ...current, projects: [...current.projects, next] })); setSelectedProject(next.id); };
  const removeProject = (id) => { if (window.confirm('Remove this project from the portfolio?')) { setContent((current) => ({ ...current, projects: current.projects.filter((item) => item.id !== id) })); setSelectedProject(null); } };
  const updateExperience = (id, key, value) => setContent((current) => ({ ...current, experience: current.experience.map((item) => item.id === id ? { ...item, [key]: value } : item) }));
  const addExperience = () => { const next = { id: `experience-${Date.now()}`, date: '2026 — NOW', title: 'New experience', subtitle: '', description: '', status: 'IN_PROGRESS' }; setContent((current) => ({ ...current, experience: [next, ...current.experience] })); };
  const removeExperience = (id) => setContent((current) => ({ ...current, experience: current.experience.filter((item) => item.id !== id) }));
  const stackText = useMemo(() => content.stack.join('\n'), [content.stack]);
  return <div className="admin-shell">
    <header className="admin-header"><div><span className="admin-kicker">CONTROL_PANEL // PORTFOLIO</span><h1>start:dev <span>admin</span></h1></div><div className="admin-header-actions"><a href="/" target="_blank" rel="noreferrer">VIEW_SITE ↗</a><button onClick={save}>SAVE_CHANGES</button></div></header>
    <div className="admin-layout"><aside className="admin-sidebar"><div className="admin-status"><i /> CONTENT_SYNC <span>{notice}</span></div><nav>{tabs.map(([id, label]) => <button key={id} className={activeTab === id ? 'active' : ''} onClick={() => { setActiveTab(id); setSelectedProject(null); }}>{label}<span>›</span></button>)}</nav><div className="admin-tools"><button onClick={exportData}>EXPORT_JSON</button><label>IMPORT_JSON<input type="file" accept="application/json" onChange={importData} /></label><button onClick={reset}>RESET_DEFAULTS</button></div></aside>
      <main className="admin-main">
        {activeTab === 'site' && <><SectionTitle title="Site identity" detail="01 / global" /><div className="admin-grid"><Field label="Brand label" value={content.site.brand} onChange={(v) => update(['site', 'brand'], v)} /><Field label="Terminal title" value={content.site.terminalTitle} onChange={(v) => update(['site', 'terminalTitle'], v)} /><Field label="Primary role" value={content.site.role} onChange={(v) => update(['site', 'role'], v)} /><Field label="Status label" value={content.site.status} onChange={(v) => update(['site', 'status'], v)} /></div><div className="admin-preview"><span>&gt; SYSTEM_READY</span><p>These values power the terminal header and site identity.</p></div></>}
        {activeTab === 'about' && <><SectionTitle title="About me" detail="02 / README.md" /><Field label="Introduction" value={content.about.intro} onChange={(v) => update(['about', 'intro'], v)} multiline /><Field label="About paragraph" value={content.about.body} onChange={(v) => update(['about', 'body'], v)} multiline /><Field label="Core philosophies — one per line" value={content.about.philosophies.join('\n')} onChange={(v) => update(['about', 'philosophies'], v.split('\n').filter(Boolean))} multiline /></>}
        {activeTab === 'education' && <><SectionTitle title="Education" detail="03 / profile" /><div className="admin-grid"><Field label="Degree" value={content.education.degree} onChange={(v) => update(['education', 'degree'], v)} /><Field label="Institution" value={content.education.school} onChange={(v) => update(['education', 'school'], v)} /><Field label="Years" value={content.education.years} onChange={(v) => update(['education', 'years'], v)} /></div></>}
        {activeTab === 'contact' && <><SectionTitle title="Contact channels" detail="07 / links" /><Field label="Contact intro" value={content.contact.intro} onChange={(v) => update(['contact', 'intro'], v)} /><div className="admin-grid"><Field label="Email" value={content.contact.email} onChange={(v) => update(['contact', 'email'], v)} /><Field label="LinkedIn URL" value={content.contact.linkedin} onChange={(v) => update(['contact', 'linkedin'], v)} /><Field label="GitHub URL" value={content.contact.github} onChange={(v) => update(['contact', 'github'], v)} /></div></>}
        {activeTab === 'stack' && <><SectionTitle title="Technology stack" detail="06 / matrix" /><Field label="Stack items — one per line" value={stackText} onChange={(v) => update(['stack'], v.split('\n').filter(Boolean))} multiline /><div className="tag-preview">{content.stack.map((item) => <span key={item}>{item}</span>)}</div></>}
        {activeTab === 'projects' && <><SectionTitle title="Project archive" detail={`${content.projects.length.toString().padStart(2, '0')} / records`} /><div className="record-actions"><button onClick={addProject}>+ ADD_PROJECT</button></div>{!project ? <div className="record-list">{content.projects.map((item) => <button className="record" key={item.id} onClick={() => setSelectedProject(item.id)}><span><b>&gt; {item.name}</b><small>{item.skills.join(' · ')}</small></span><span>EDIT ›</span></button>)}</div> : <div className="editor-card"><div className="card-heading"><b>PROJECT_RECORD</b><button onClick={() => setSelectedProject(null)}>CLOSE ×</button></div><div className="admin-grid"><Field label="Project name" value={project.name} onChange={(v) => updateProject('name', v)} /><Field label="Icon name" value={project.icon} onChange={(v) => updateProject('icon', v)} /><Field label="GitHub / project URL" value={project.link} onChange={(v) => updateProject('link', v)} /><Field label="Skills — comma separated" value={project.skills.join(', ')} onChange={(v) => updateProject('skills', v)} /></div><Field label="Description" value={project.description} onChange={(v) => updateProject('description', v)} multiline /><button className="danger-button" onClick={() => removeProject(project.id)}>REMOVE_PROJECT</button></div>}</>}
        {activeTab === 'experience' && <><SectionTitle title="Experience log" detail={`${content.experience.length.toString().padStart(2, '0')} / events`} /><div className="record-actions"><button onClick={addExperience}>+ ADD_EXPERIENCE</button></div><div className="experience-editor">{content.experience.map((item) => <div className="editor-card" key={item.id}><div className="card-heading"><b>{item.title || 'EXPERIENCE_RECORD'}</b><button className="danger-text" onClick={() => removeExperience(item.id)}>REMOVE</button></div><div className="admin-grid"><Field label="Date" value={item.date} onChange={(v) => updateExperience(item.id, 'date', v)} /><Field label="Title" value={item.title} onChange={(v) => updateExperience(item.id, 'title', v)} /><Field label="Subtitle" value={item.subtitle} onChange={(v) => updateExperience(item.id, 'subtitle', v)} /><Field label="Status" value={item.status} onChange={(v) => updateExperience(item.id, 'status', v)} /></div><Field label="Description" value={item.description} onChange={(v) => updateExperience(item.id, 'description', v)} multiline /></div>)}</div></>}
        <div className="admin-save-bar"><span>{notice}</span><button onClick={save}>SAVE_ALL_CHANGES</button></div>
      </main>
    </div>
    <footer className="admin-footer">Stored locally in this browser · key: {contentKey} · connect a database later for multi-device editing.</footer>
  </div>;
}

export default Dashboard;
