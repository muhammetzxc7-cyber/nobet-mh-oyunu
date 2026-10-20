import { createRoot } from 'react-dom/client';
import App from './LearningApp';
import { LayoutProvider } from './LayoutPreference';
import './learning.css';
import './simple-mobile.css';
createRoot(document.getElementById('root')!).render(<LayoutProvider><App /></LayoutProvider>);
