import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import App from './App.tsx';
import './index.css';
import { registerServiceWorker } from './sw-registration';

const queryClient = new QueryClient();

registerServiceWorker((reg) => {
  if ((window as any).onServiceWorkerUpdate) {
    (window as any).onServiceWorkerUpdate(reg);
  }
});

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <App />
    </QueryClientProvider>
  </StrictMode>,
);
