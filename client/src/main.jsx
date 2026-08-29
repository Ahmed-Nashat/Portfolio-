import { createRoot } from 'react-dom/client';
import './styles.css';

function App() {
  return <iframe className="portfolio-frame" src="/portfolio.html" title="Ahmed Nashaat Backend Developer Portfolio" />;
}

createRoot(document.getElementById('root')).render(<App />);
