import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
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
