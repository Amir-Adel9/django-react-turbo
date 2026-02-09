import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { Toaster } from 'sonner';
import { Provider } from 'react-redux';
import { RouterProvider } from 'react-router-dom';
import { store } from '@/store';
import { router } from '@/routes/router';
import './index.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Provider store={store}>
      <RouterProvider router={router} />
      <Toaster richColors position='bottom-right' />
    </Provider>
  </StrictMode>,
);
