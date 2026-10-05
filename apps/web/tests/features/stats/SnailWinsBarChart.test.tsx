import { render, screen, within } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { SnailWinsBarChart } from '@/features/stats/components/SnailWinsBarChart';
import { generateRaceDay } from '@/features/stats/mockRaceDay';

const { winsBySnail } = generateRaceDay('2026-10-04');

function stubWideScreen(isWide: boolean) {
  vi.stubGlobal(
    'matchMedia',
    vi.fn((query: string) => ({
      media: query,
      matches: isWide,
      addEventListener: () => {},
      removeEventListener: () => {},
    })),
  );
}

beforeEach(() => {
  // jsdom no calcula tamaños: ResponsiveContainer mide 0 y no dibujaría el SVG.
  vi.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockReturnValue(
    DOMRect.fromRect({ width: 320, height: 260 }),
  );
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe.each([
  { mode: 'barras verticales (≥ 640 px)', isWide: true, namesAxis: '.recharts-xAxis-tick-labels' },
  {
    mode: 'barras horizontales (celular)',
    isWide: false,
    namesAxis: '.recharts-yAxis-tick-labels',
  },
])('SnailWinsBarChart con $mode', ({ isWide, namesAxis }) => {
  it('muestra el nombre completo de los 6 caracoles en el eje y el resumen accesible', () => {
    stubWideScreen(isWide);
    render(<SnailWinsBarChart winsBySnail={winsBySnail} />);

    const chart = screen.getByRole('img', { name: /^Victorias por caracol hoy/ });
    const axis = chart.querySelector<HTMLElement>(namesAxis);
    expect(axis).not.toBeNull();
    for (const { snail, wins } of winsBySnail) {
      expect(within(axis as HTMLElement).getByText(snail.name)).toBeInTheDocument();
      expect(chart).toHaveAccessibleName(expect.stringContaining(`${snail.name} ${wins}`));
    }
    expect(screen.getByText('Datos de demostración del día')).toBeInTheDocument();
  });
});
