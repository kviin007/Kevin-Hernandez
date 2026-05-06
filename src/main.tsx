import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';

import {AuthProvider} from './components/AuthContext.tsx';
import { setupPWA } from './registerSW';

setupPWA();

createRoot(document.getElementById('root')!).render(
  <AuthProvider>
    <App />
  </AuthProvider>
);
