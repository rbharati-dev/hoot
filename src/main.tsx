import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { startTelemetry } from './lib/telemetry';
import './index.css';
import './styles/nav.css';
import './styles/today.css';
import './styles/read.css';
import './styles/contrast.css';
import './styles/icons.css';
import './styles/motion.css';
import './styles/progress.css';
import './styles/plus.css';
import './styles/account.css';
import './styles/tutorial.css';
import App from './App';
import ErrorBoundary from './components/ErrorBoundary';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </StrictMode>,
);

// Installable app + opens offline. Not in automated browser tests.
if (import.meta.env.PROD && 'serviceWorker' in navigator && !navigator.webdriver) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch(() => {});
  });
}

startTelemetry();
