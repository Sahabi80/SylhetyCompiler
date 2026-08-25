// Ensure window.fetch has both getter and setter across iframe sandboxes
try {
  const originalFetch = window.fetch ? window.fetch.bind(window) : undefined;
  let activeFetch = originalFetch;
  try {
    Object.defineProperty(window, 'fetch', {
      get: () => activeFetch,
      set: (fn) => {
        activeFetch = fn;
      },
      configurable: true,
      enumerable: true,
    });
  } catch {
    // ignore if already defined
  }
} catch {
  // ignore
}

import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
