import { act, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { AuthProvider } from '@/features/auth/AuthContext';
import { SESSION_TTL_MS } from '@/features/auth/authService';
import { useAuth } from '@/features/auth/useAuth';
import { clearSession, storageKeys } from '@/lib/storage';

import { createTestAuthService } from '../../utils/renderApp';

const account = { fullName: 'Arturo Torres', email: 'art@example.com', password: 'Caracol123' };

function Probe() {
  const { status, notice } = useAuth();
  return (
    <p data-testid="auth">
      {status}
      {notice ? ` (${notice})` : ''}
    </p>
  );
}

/** Registra la cuenta con un reloj controlable y monta el provider con el mismo reloj. */
async function renderWithSession() {
  const clock = { now: new Date('2026-10-04T12:00:00.000Z') };
  const service = createTestAuthService({ now: () => clock.now });
  await service.register(account);
  vi.useFakeTimers();
  render(
    <AuthProvider service={service}>
      <Probe />
    </AuthProvider>,
  );
  return clock;
}

const authText = () => screen.getByTestId('auth').textContent;

describe('AuthProvider: regla 5 con la pestaña abierta', () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it('cierra la sesión al expirar, sin recargar la página', async () => {
    const clock = await renderWithSession();
    expect(authText()).toBe('authenticated');

    clock.now = new Date(clock.now.getTime() + SESSION_TTL_MS - 1);
    act(() => vi.advanceTimersByTime(SESSION_TTL_MS - 1));
    expect(authText()).toBe('authenticated');

    clock.now = new Date(clock.now.getTime() + 1);
    act(() => vi.advanceTimersByTime(1));
    expect(authText()).toBe('anonymous (expired)');
  });

  it('cierra la sesión si otra pestaña la borra', async () => {
    await renderWithSession();

    clearSession();
    act(() => {
      window.dispatchEvent(new StorageEvent('storage', { key: storageKeys.session }));
    });

    expect(authText()).toBe('anonymous');
  });

  it('revisa la sesión al volver a la pestaña', async () => {
    const clock = await renderWithSession();

    // El timer no corrió (equipo suspendido), pero el reloj sí avanzó.
    clock.now = new Date(clock.now.getTime() + SESSION_TTL_MS);
    act(() => {
      document.dispatchEvent(new Event('visibilitychange'));
    });

    expect(authText()).toBe('anonymous (expired)');
  });
});
