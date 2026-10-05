import { createBrowserRouter, RouterProvider } from 'react-router';

import { AuthProvider } from '@/features/auth/AuthContext';

import { routes } from './router';

const router = createBrowserRouter(routes);

export function App() {
  return (
    <AuthProvider>
      <RouterProvider router={router} />
    </AuthProvider>
  );
}
