import { useEffect, useState } from 'react';
import Dashboard from './admin';
import { defaultContent } from './content';

export default function AdminSession() {
  const [state, setState] = useState({ loading: true });
  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const response = await fetch('/api/auth/session', { cache: 'no-store' });
        if (!response.ok) throw new Error('Unable to check your login. Please reload.');
        const auth = await response.json();
        if (!auth.authenticated) { if (active) setState(auth); return; }
        const dataResponse = await fetch('/api/content?edit=1', { cache: 'no-store' });
        const data = await dataResponse.json();
        if (!dataResponse.ok) throw new Error(data.error || 'Unable to load published content.');
        if (active) setState({ ...auth, content: data.content || structuredClone(defaultContent), revision: data.revision });
      } catch (error) { if (active) setState({ error: error.message }); }
    })();
    return () => { active = false; };
  }, []);
  async function logout() {
    const response = await fetch('/api/auth/logout', { method: 'POST' });
    if (response.ok) window.location.assign('/admin');
    else window.alert('Sign out failed. Please try again.');
  }
  if (state.authenticated && state.content) return <Dashboard initialContent={state.content} initialRevision={state.revision} onLogout={logout} />;
  const errors = { setup: 'GitHub login still needs to be configured in Vercel.', state: 'Your sign-in link expired. Please try again.', forbidden: 'Only Ahmed-Nashat can edit this portfolio.', permission: 'This GitHub account needs write access to Portfolio-.', login: 'GitHub sign-in failed. Please try again.' };
  const error = errors[new URLSearchParams(window.location.search).get('error')];
  return <main className="admin-login"><span className="admin-kicker">start:dev / ADMIN</span><h1>Your portfolio, under your control.</h1><p>Sign in with your GitHub account to edit and publish your portfolio.</p>
    {state.loading ? <p role="status">Checking session…</p> : <>
      {(state.error || error) && <p role="alert">{state.error || error}</p>}
      {state.configured === false && <p role="status">Login setup is pending. Your public portfolio remains available.</p>}
      {state.configured && <a className="login-button" href="/api/auth/login">Sign in with GitHub →</a>}
      {state.error && <button onClick={() => window.location.reload()}>Try again</button>}
    </>}
    <a href="/">Back to portfolio</a>
  </main>;
}
