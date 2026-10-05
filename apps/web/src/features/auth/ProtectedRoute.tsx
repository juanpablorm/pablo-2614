import { Navigate, Outlet, useLocation } from 'react-router';

import { useAuth } from './useAuth';

/** Solo con sesión activa. Sin sesión → /login, recordando la ruta de origen. */
export function ProtectedRoute() {
  const { status } = useAuth();
  const location = useLocation();

  if (status === 'anonymous') {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  return <Outlet />;
}
