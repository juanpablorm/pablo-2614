import { Cell, Pie, PieChart } from 'recharts';

import type { BetsSummary } from '../mockRaceDay';

import { DemoDataBadge } from './DemoDataBadge';

const SIZE = 170;
const RING = 20;
// Recharts necesita el color literal: son los tokens secondary (ganadas) y accent (perdidas).
const WON_COLOR = '#58613A';
const LOST_COLOR = '#B95332';

interface BetsDonutChartProps {
  summary: BetsSummary;
}

/** Donut de apuestas ganadas vs. perdidas con la efectividad al centro (docs/styles.md §5). */
export function BetsDonutChart({ summary }: BetsDonutChartProps) {
  const { won, lost, total } = summary;
  const percentage = total === 0 ? 0 : Math.round((won / total) * 100);
  const data = [
    { name: 'Ganadas', value: won, color: WON_COLOR },
    { name: 'Perdidas', value: lost, color: LOST_COLOR },
  ];

  return (
    <div className="flex flex-col items-center gap-5">
      <DemoDataBadge />
      <div
        role="img"
        aria-label={`Apuestas de hoy: ${won} ganadas y ${lost} perdidas de ${total}, ${percentage}% de efectividad.`}
        className="relative"
        style={{ width: SIZE, height: SIZE }}
      >
        {/* Sin capa de accesibilidad propia: el resumen va en el aria-label del contenedor. */}
        <PieChart width={SIZE} height={SIZE} accessibilityLayer={false}>
          <Pie
            data={data}
            dataKey="value"
            nameKey="name"
            innerRadius={SIZE / 2 - RING}
            outerRadius={SIZE / 2}
            startAngle={90}
            endAngle={-270}
            paddingAngle={0}
            stroke="none"
            isAnimationActive={false}
          >
            {data.map((entry) => (
              <Cell key={entry.name} fill={entry.color} />
            ))}
          </Pie>
        </PieChart>
        <div
          aria-hidden="true"
          className="absolute inset-0 flex flex-col items-center justify-center"
        >
          <span className="font-display text-[40px] leading-none font-semibold text-secondary">
            {percentage}%
          </span>
          <span className="text-sm text-text-muted">efectividad</span>
        </div>
      </div>
      <ul className="flex flex-wrap justify-center gap-x-6 gap-y-2 text-[15px] font-semibold">
        <li className="flex items-center gap-2">
          <span aria-hidden="true" className="size-3.5 bg-secondary" />
          Ganadas: {won}
        </li>
        <li className="flex items-center gap-2">
          <span aria-hidden="true" className="size-3.5 rounded-full bg-accent" />
          Perdidas: {lost}
        </li>
      </ul>
    </div>
  );
}
