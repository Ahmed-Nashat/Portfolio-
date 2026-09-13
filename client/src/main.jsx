import { createRoot } from 'react-dom/client';
import './styles.css';
import './admin-auth.css';
import Dashboard from './admin-session';

function App() {
  if (window.location.pathname === '/admin' || window.location.pathname === '/admin/') return <Dashboard />;
  return <iframe className="portfolio-frame" src="/portfolio.html" title="Ahmed Nashaat Backend Developer Portfolio" />;
}

createRoot(document.getElementById('root')).render(<App />);
