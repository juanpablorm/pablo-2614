import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { generateRaceDay } from '@/features/stats/mockRaceDay';
import { getSnail } from '@/features/stats/snails';

import { renderApp } from './utils/renderApp';

const PASSWORD = 'Caracol123';

async function registerAndOpenDashboard() {
  const user = userEvent.setup();
  renderApp('/registro');
  await user.type(await screen.findByLabelText('Nombre completo'), 'Arturo Torres');
  await user.type(screen.getByLabelText('Correo electrónico'), 'art@example.com');
  await user.type(screen.getByLabelText('Contraseña'), PASSWORD);
  await user.type(screen.getByLabelText('Confirmar contraseña'), PASSWORD);
  await user.click(screen.getByRole('button', { name: 'Crear cuenta' }));
  await screen.findByRole('heading', { level: 1, name: 'Hola, Arturo Torres' });
}

describe('dashboard', () => {
  beforeEach(() => {
    // Solo se congela la fecha (la semilla del día); los timers reales siguen funcionando.
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(new Date(2026, 9, 4, 12, 0));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('muestra el nombre del usuario y el saldo $0.00 tras registrarse', async () => {
    await registerAndOpenDashboard();

    const header = screen.getByRole('banner');
    expect(within(header).getByText('Arturo Torres')).toBeInTheDocument();
    expect(within(header).getByRole('button', { name: 'Cerrar sesión' })).toBeInTheDocument();

    const balance = screen.getByRole('region', { name: 'Saldo disponible' });
    expect(within(balance).getByText('$0.00')).toBeInTheDocument();
    expect(within(balance).getByRole('button', { name: 'Recargar' })).toBeInTheDocument();
  });

  it('muestra las gráficas y la lista con los datos del día', async () => {
    await registerAndOpenDashboard();
    const { races, winsBySnail, betsSummary } = generateRaceDay('2026-10-04');

    expect(screen.getAllByText('Datos de demostración del día')).toHaveLength(2);

    const donut = screen.getByRole('img', { name: /^Apuestas de hoy/ });
    expect(donut).toHaveAccessibleName(
      expect.stringContaining(
        `${betsSummary.won} ganadas y ${betsSummary.lost} perdidas de ${betsSummary.total}`,
      ),
    );

    const bars = screen.getByRole('img', { name: /^Victorias por caracol hoy/ });
    for (const { snail, wins } of winsBySnail) {
      expect(bars).toHaveAccessibleName(expect.stringContaining(`${snail.name} ${wins}`));
    }

    const results = screen.getByRole('region', { name: 'Resultados de las carreras' });
    const items = within(results).getAllByRole('listitem');
    expect(items).toHaveLength(6);
    races.forEach((race, i) => {
      expect(items[i]).toHaveTextContent(
        `Carrera ${race.number}: ganó ${getSnail(race.winnerId).name}`,
      );
    });
  });
});
