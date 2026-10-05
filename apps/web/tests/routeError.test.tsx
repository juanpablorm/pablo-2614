import { screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { createTestAuthService, renderApp } from './utils/renderApp';

// Simula que el chunk del dashboard no se pudo descargar (p. ej. sin conexión).
vi.mock('@/pages/DashboardPage', () => {
  throw new Error('Failed to fetch dynamically imported module');
});

describe('pantalla de error de ruta', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('muestra un aviso con acciones si la página no se pudo cargar', async () => {
    // React y React Router registran el error capturado; aquí es esperado.
    vi.spyOn(console, 'error').mockImplementation(() => {});
    vi.spyOn(console, 'warn').mockImplementation(() => {});
    await createTestAuthService().register({
      fullName: 'Arturo Torres',
      email: 'art@example.com',
      password: 'Caracol123',
    });

    renderApp('/dashboard');

    expect(
      await screen.findByRole('heading', { level: 1, name: 'Algo salió mal' }),
    ).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Recargar página' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Volver al inicio' })).toHaveAttribute('href', '/');
    expect(document.title).toBe('Algo salió mal · SnailRacer');
  });
});
