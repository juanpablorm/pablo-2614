import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';

import { renderApp } from './utils/renderApp';

const PASSWORD = 'Caracol123';

async function expectDashboard() {
  expect(
    await screen.findByRole('heading', { level: 1, name: 'Hola, Arturo Torres' }),
  ).toBeInTheDocument();
  const balance = screen.getByRole('region', { name: 'Saldo disponible' });
  expect(within(balance).getByText('$0.00')).toBeInTheDocument();
}

describe('flujo de autenticación', () => {
  it('registrar → dashboard → cerrar sesión → iniciar sesión → dashboard → recargar', async () => {
    const user = userEvent.setup();
    const first = renderApp('/registro');

    // Registro
    await user.type(await screen.findByLabelText('Nombre completo'), 'Arturo Torres');
    await user.type(screen.getByLabelText('Correo electrónico'), 'Art@Example.com');
    await user.type(screen.getByLabelText('Contraseña'), PASSWORD);
    await user.type(screen.getByLabelText('Confirmar contraseña'), PASSWORD);
    await user.click(screen.getByRole('button', { name: 'Crear cuenta' }));

    await expectDashboard();
    expect(first.router.state.location.pathname).toBe('/dashboard');

    // Cerrar sesión
    await user.click(screen.getByRole('button', { name: 'Cerrar sesión' }));
    expect(
      await screen.findByRole('heading', { level: 1, name: 'Qué bueno verte' }),
    ).toBeInTheDocument();

    // Iniciar sesión
    await user.type(screen.getByLabelText('Correo electrónico'), 'art@example.com');
    await user.type(screen.getByLabelText('Contraseña'), PASSWORD);
    await user.click(screen.getByRole('button', { name: 'Iniciar sesión' }));

    await expectDashboard();

    // Recargar: se desmonta todo y se vuelve a abrir con el mismo LocalStorage.
    first.unmount();
    const second = renderApp('/dashboard');

    await expectDashboard();
    expect(second.router.state.location.pathname).toBe('/dashboard');
  });

  it('muestra errores por campo y no envía un registro inválido', async () => {
    const user = userEvent.setup();
    renderApp('/registro');

    await user.type(await screen.findByLabelText('Correo electrónico'), 'art@');
    await user.type(screen.getByLabelText('Contraseña'), PASSWORD);
    await user.type(screen.getByLabelText('Confirmar contraseña'), 'Caracol124');
    await user.click(screen.getByRole('button', { name: 'Crear cuenta' }));

    expect(
      await screen.findByText('El nombre debe tener al menos 3 caracteres.'),
    ).toBeInTheDocument();
    expect(screen.getByText('Correo no válido.')).toBeInTheDocument();
    expect(screen.getByText('Las contraseñas no coinciden.')).toBeInTheDocument();
    expect(screen.getByLabelText('Correo electrónico')).toHaveAttribute('aria-invalid', 'true');
    expect(window.localStorage.length).toBe(0);
  });

  it('muestra el error genérico con credenciales incorrectas', async () => {
    const user = userEvent.setup();
    renderApp('/login');

    await user.type(await screen.findByLabelText('Correo electrónico'), 'nadie@example.com');
    await user.type(screen.getByLabelText('Contraseña'), PASSWORD);
    await user.click(screen.getByRole('button', { name: 'Iniciar sesión' }));

    expect(await screen.findByRole('alert')).toHaveTextContent('Correo o contraseña incorrectos.');
  });

  it('muestra el error en el campo de correo si ya está registrado', async () => {
    const user = userEvent.setup();
    const { unmount } = renderApp('/registro');

    const fill = async () => {
      await user.type(await screen.findByLabelText('Nombre completo'), 'Arturo Torres');
      await user.type(screen.getByLabelText('Correo electrónico'), 'art@example.com');
      await user.type(screen.getByLabelText('Contraseña'), PASSWORD);
      await user.type(screen.getByLabelText('Confirmar contraseña'), PASSWORD);
      await user.click(screen.getByRole('button', { name: 'Crear cuenta' }));
    };

    await fill();
    await user.click(await screen.findByRole('button', { name: 'Cerrar sesión' }));
    unmount();

    renderApp('/registro');
    await fill();

    expect(await screen.findByText('Ya existe una cuenta con este correo.')).toBeInTheDocument();
    expect(screen.getByLabelText('Correo electrónico')).toHaveAttribute('aria-invalid', 'true');
  });

  it('permite mostrar y ocultar la contraseña', async () => {
    const user = userEvent.setup();
    renderApp('/login');

    const input = await screen.findByLabelText('Contraseña');
    expect(input).toHaveAttribute('type', 'password');
    expect(input).toHaveAttribute('autocomplete', 'current-password');

    await user.click(screen.getByRole('button', { name: 'Mostrar contraseña' }));
    expect(input).toHaveAttribute('type', 'text');

    await user.click(screen.getByRole('button', { name: 'Ocultar contraseña' }));
    expect(input).toHaveAttribute('type', 'password');
  });
});
