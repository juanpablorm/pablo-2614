import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { renderApp } from './renderApp';

export const TEST_PASSWORD = 'Caracol123';

/** Registra a Arturo Torres y espera el dashboard. Devuelve el userEvent para seguir. */
export async function registerAndOpenDashboard() {
  const user = userEvent.setup();
  renderApp('/registro');
  await user.type(await screen.findByLabelText('Nombre completo'), 'Arturo Torres');
  await user.type(screen.getByLabelText('Correo electrónico'), 'art@example.com');
  await user.type(screen.getByLabelText('Contraseña'), TEST_PASSWORD);
  await user.type(screen.getByLabelText('Confirmar contraseña'), TEST_PASSWORD);
  await user.click(screen.getByRole('button', { name: 'Crear cuenta' }));
  await screen.findByRole('heading', { level: 1, name: 'Hola, Arturo Torres' });
  return user;
}
