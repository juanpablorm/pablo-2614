import { Navigate } from 'react-router';

import { useAuth } from '@/features/auth/useAuth';

/** `/`: con sesión al dashboard, sin sesión al login. */
export function RootRedirect() {
  const { status } = useAuth();
  return <Navigate to={status === 'authenticated' ? '/dashboard' : '/login'} replace />;
}
