import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { registerServiceWorker } from './sw-registration';

registerServiceWorker((reg) => {
  if ((window as any).onServiceWorkerUpdate) {
    (window as any).onServiceWorkerUpdate(reg);
  }
});

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
