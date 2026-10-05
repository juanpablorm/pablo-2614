import { lazy, Suspense } from 'react';

import { LoadingScreen } from '@/components/ui/LoadingScreen';

// El dashboard (y Recharts) se descarga aparte, solo cuando ProtectedRoute ya confirmó la sesión.
const DashboardPage = lazy(() =>
  import('./DashboardPage').then((module) => ({ default: module.DashboardPage })),
);

export function LazyDashboardPage() {
  return (
    <Suspense fallback={<LoadingScreen />}>
      <DashboardPage />
    </Suspense>
  );
}
