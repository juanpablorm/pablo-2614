import { screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { createTestAuthService, renderApp } from './utils/renderApp';

async function registerUser() {
  return createTestAuthService().register({
    fullName: 'Arturo Torres',
    email: 'art@example.com',
    password: 'Caracol123',
  });
}

describe('rutas', () => {
  it('sin sesión, /dashboard redirige a /login conservando la ruta de origen', async () => {
    const { router } = renderApp('/dashboard');

    expect(
      await screen.findByRole('heading', { level: 1, name: 'Qué bueno verte' }),
    ).toBeInTheDocument();
    expect(router.state.location.pathname).toBe('/login');
    expect(router.state.location.state).toMatchObject({ from: { pathname: '/dashboard' } });
  });

  it('con sesión, /login redirige a /dashboard', async () => {
    await registerUser();
    const { router } = renderApp('/login');

    expect(
      await screen.findByRole('heading', { level: 1, name: 'Hola, Arturo Torres' }),
    ).toBeInTheDocument();
    expect(router.state.location.pathname).toBe('/dashboard');
  });

  it('con sesión, /registro redirige a /dashboard', async () => {
    await registerUser();
    const { router } = renderApp('/registro');

    await screen.findByRole('heading', { level: 1, name: 'Hola, Arturo Torres' });
    expect(router.state.location.pathname).toBe('/dashboard');
  });

  it('/ lleva a /login sin sesión', async () => {
    const { router } = renderApp('/');

    await screen.findByRole('heading', { level: 1, name: 'Qué bueno verte' });
    expect(router.state.location.pathname).toBe('/login');
  });

  it('/ lleva a /dashboard con sesión', async () => {
    await registerUser();
    const { router } = renderApp('/');

    await screen.findByRole('heading', { level: 1, name: 'Hola, Arturo Torres' });
    expect(router.state.location.pathname).toBe('/dashboard');
  });

  it('una ruta desconocida muestra la página 404 con enlace de regreso', async () => {
    renderApp('/pista-perdida');

    expect(
      await screen.findByRole('heading', { level: 1, name: 'Este caracol se salió de la pista' }),
    ).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Volver al inicio' })).toHaveAttribute('href', '/');
  });

  it('avisa en el login cuando la sesión expiró', async () => {
    let now = new Date('2026-10-04T12:00:00.000Z');
    await createTestAuthService({ now: () => now }).register({
      fullName: 'Arturo Torres',
      email: 'art@example.com',
      password: 'Caracol123',
    });
    now = new Date('2026-10-05T12:00:00.000Z');

    renderApp('/dashboard', { now: () => now });

    expect(await screen.findByRole('status')).toHaveTextContent(
      'Tu sesión expiró. Inicia sesión de nuevo.',
    );
  });

  it.each([
    ['/login', 'Qué bueno verte', 'Iniciar sesión · SnailRacer'],
    ['/registro', 'Únete a la carrera', 'Crear cuenta · SnailRacer'],
    ['/pista-perdida', 'Este caracol se salió de la pista', 'Página no encontrada · SnailRacer'],
  ])('%s tiene su propio título de página', async (path, heading, title) => {
    renderApp(path);

    await screen.findByRole('heading', { level: 1, name: heading });
    expect(document.title).toBe(title);
  });

  it('el dashboard tiene su propio título de página', async () => {
    await registerUser();
    renderApp('/dashboard');

    await screen.findByRole('heading', { level: 1, name: 'Hola, Arturo Torres' });
    expect(document.title).toBe('Inicio · SnailRacer');
  });

  it('trata el logo de la marca como decorativo', async () => {
    const { container } = renderApp('/login');

    await screen.findByRole('heading', { level: 1, name: 'Qué bueno verte' });
    expect(container.querySelector('img')).toHaveAttribute('alt', '');
  });
});
