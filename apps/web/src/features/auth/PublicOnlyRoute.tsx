import { Navigate, Outlet, useLocation, type Location } from 'react-router';

import { useAuth } from './useAuth';

/** Solo sin sesión. Con sesión → la ruta de origen guardada por ProtectedRoute, o /dashboard. */
export function PublicOnlyRoute() {
  const { status } = useAuth();
  const location = useLocation();

  if (status === 'authenticated') {
    return <Navigate to={getSafeRedirect(location.state) ?? '/dashboard'} replace />;
  }

  return <Outlet />;
}

/** Acepta solo rutas internas para que el estado de navegación no lleve a otro origen. */
function getSafeRedirect(state: unknown): string | null {
  if (typeof state !== 'object' || state === null || !('from' in state)) return null;
  const from = (state as { from?: Partial<Location> }).from;
  const pathname = from?.pathname;
  if (typeof pathname !== 'string' || !pathname.startsWith('/') || pathname.startsWith('//')) {
    return null;
  }
  return `${pathname}${from?.search ?? ''}${from?.hash ?? ''}`;
}
