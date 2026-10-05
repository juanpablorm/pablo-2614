import type { RouteObject } from 'react-router';

import { ProtectedRoute } from '@/features/auth/ProtectedRoute';
import { PublicOnlyRoute } from '@/features/auth/PublicOnlyRoute';
import { LazyDashboardPage } from '@/pages/LazyDashboardPage';
import { LoginPage } from '@/pages/LoginPage';
import { NotFoundPage } from '@/pages/NotFoundPage';
import { RegisterPage } from '@/pages/RegisterPage';
import { RootRedirect } from '@/pages/RootRedirect';
import { RouteErrorPage } from '@/pages/RouteErrorPage';

/** Rutas de la app (docs/architecture.md §4). Se exportan para montarlas en memoria en pruebas. */
export const routes: RouteObject[] = [
  {
    // Sin path: solo aporta la pantalla de error a todas las rutas.
    errorElement: <RouteErrorPage />,
    children: [
      { path: '/', element: <RootRedirect /> },
      {
        element: <PublicOnlyRoute />,
        children: [
          { path: '/registro', element: <RegisterPage /> },
          { path: '/login', element: <LoginPage /> },
        ],
      },
      {
        element: <ProtectedRoute />,
        children: [{ path: '/dashboard', element: <LazyDashboardPage /> }],
      },
      { path: '*', element: <NotFoundPage /> },
    ],
  },
];
