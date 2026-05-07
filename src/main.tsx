import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';

import {AuthProvider} from './components/AuthContext.tsx';
import { setupPWA } from './registerSW';
import { safeParse } from './utils/safeParse';

// Clean up corrupted storage that might crash external libraries
try {
  const keysToRemove: string[] = [];
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key) {
      const val = localStorage.getItem(key);
      const normalized = val?.trim();
      if (!normalized || normalized === 'undefined' || normalized === 'null' || normalized === 'NaN' || normalized === '""') {
        keysToRemove.push(key);
      } else {
        // Safe check for JSON validity if it looks like it should be JSON
        if (normalized.startsWith('{') || normalized.startsWith('[')) {
           if (!safeParse(normalized, null)) {
             keysToRemove.push(key);
           }
        }
      }
    }
  }
  keysToRemove.forEach(k => {
    try { localStorage.removeItem(k); } catch(e) {}
  });
} catch (e) {
  // Ignore
}

setupPWA();

createRoot(document.getElementById('root')!).render(
  <AuthProvider>
    <App />
  </AuthProvider>
);
