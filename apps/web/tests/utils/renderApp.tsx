import { render } from '@testing-library/react';
import { createMemoryRouter, RouterProvider } from 'react-router';

import { routes } from '@/app/router';
import { AuthProvider } from '@/features/auth/AuthContext';
import { createAuthService, type AuthServiceOptions } from '@/features/auth/authService';

/** Iteraciones bajas para que PBKDF2 no alargue las pruebas. */
export const TEST_ITERATIONS = 1_000;

export const createTestAuthService = (options: AuthServiceOptions = {}) =>
  createAuthService({ iterations: TEST_ITERATIONS, ...options });

/** Monta la app completa en memoria, como si se abriera el navegador en `path`. */
export function renderApp(path = '/', options: AuthServiceOptions = {}) {
  const router = createMemoryRouter(routes, { initialEntries: [path] });
  const view = render(
    <AuthProvider service={createTestAuthService(options)}>
      <RouterProvider router={router} />
    </AuthProvider>,
  );
  return { ...view, router };
}
