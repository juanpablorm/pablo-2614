import { Crown } from 'lucide-react';
import { Bar, BarChart, Cell, LabelList, ResponsiveContainer, XAxis, YAxis } from 'recharts';

import { cn } from '@/lib/cn';
import { useMediaQuery } from '@/lib/useMediaQuery';

import { CHART_COLORS } from '../chartColors';
import { getLeaders, type SnailWins } from '../mockRaceDay';

import { DemoDataBadge } from './DemoDataBadge';

const BASE_AXIS = { stroke: CHART_COLORS.axis, strokeWidth: 3 };
const NAME_TICK = { fill: CHART_COLORS.axis, fontSize: 13, fontWeight: 600 };
const VALUE_TICK = { fill: CHART_COLORS.muted, fontSize: 12 };

const nameList = new Intl.ListFormat('es', { style: 'long', type: 'conjunction' });
const victories = (wins: number) => `${wins} ${wins === 1 ? 'victoria' : 'victorias'}`;

interface SnailWinsBarChartProps {
  winsBySnail: SnailWins[];
}

/**
 * Barras con las victorias de cada caracol; los líderes (incluidos empates) van en dorado.
 * Desde 640 px las barras son verticales; en celular se giran para que los nombres se lean completos.
 */
export function SnailWinsBarChart({ winsBySnail }: SnailWinsBarChartProps) {
  const isWide = useMediaQuery('(min-width: 640px)');

  const leaders = getLeaders(winsBySnail);
  const leaderIds = new Set(leaders.map(({ snail }) => snail.id));
  const leaderNames = nameList.format(leaders.map(({ snail }) => snail.name));
  const leaderWins = victories(leaders[0]?.wins ?? 0);
  const leaderText =
    leaders.length === 1 ? `Líder: ${leaderNames}` : `Empate en el primer lugar: ${leaderNames}`;

  const data = winsBySnail.map(({ snail, wins }) => ({
    id: snail.id,
    name: snail.name,
    wins,
    isLeader: leaderIds.has(snail.id),
  }));
  const summary = data.map(({ name, wins }) => `${name} ${wins}`).join(', ');

  const bar = (
    <Bar dataKey="wins" maxBarSize={isWide ? 68 : 28} isAnimationActive={false}>
      {data.map((entry) => (
        <Cell key={entry.id} fill={entry.isLeader ? CHART_COLORS.leader : CHART_COLORS.bar} />
      ))}
      <LabelList
        dataKey="wins"
        position={isWide ? 'top' : 'right'}
        className="font-display"
        fill={CHART_COLORS.axis}
        fontSize={18}
        fontWeight={600}
      />
    </Bar>
  );

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="flex items-center gap-2 text-[15px] font-semibold">
          <Crown aria-hidden="true" className="size-5 shrink-0 text-highlight" />
          <span>
            {leaderText} · {leaderWins}
          </span>
        </p>
        <DemoDataBadge />
      </div>
      <div
        role="img"
        aria-label={`Victorias por caracol hoy: ${summary}. ${leaderText}.`}
        className={cn('w-full', isWide ? 'h-60' : 'h-[260px]')}
      >
        {/* Sin capa de accesibilidad propia: el resumen va en el aria-label del contenedor. */}
        <ResponsiveContainer
          width="100%"
          height="100%"
          initialDimension={{ width: 320, height: 260 }}
        >
          {isWide ? (
            <BarChart
              data={data}
              margin={{ top: 28, right: 0, bottom: 0, left: 0 }}
              accessibilityLayer={false}
            >
              <XAxis
                dataKey="name"
                interval={0}
                tickLine={false}
                axisLine={BASE_AXIS}
                tick={NAME_TICK}
              />
              <YAxis
                allowDecimals={false}
                domain={[0, 'dataMax']}
                width={24}
                axisLine={false}
                tickLine={false}
                tick={VALUE_TICK}
              />
              {bar}
            </BarChart>
          ) : (
            <BarChart
              data={data}
              layout="vertical"
              margin={{ top: 0, right: 28, bottom: 0, left: 0 }}
              accessibilityLayer={false}
            >
              <YAxis
                type="category"
                dataKey="name"
                interval={0}
                width={80}
                tickLine={false}
                axisLine={BASE_AXIS}
                tick={NAME_TICK}
              />
              <XAxis
                type="number"
                allowDecimals={false}
                domain={[0, 'dataMax']}
                height={24}
                axisLine={false}
                tickLine={false}
                tick={VALUE_TICK}
              />
              {bar}
            </BarChart>
          )}
        </ResponsiveContainer>
      </div>
    </div>
  );
}
