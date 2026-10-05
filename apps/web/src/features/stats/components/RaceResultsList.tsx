import type { Race, SimulatedBet } from '../mockRaceDay';
import { getSnail } from '../snails';

interface RaceResultsListProps {
  races: Race[];
  bets: SimulatedBet[];
}

/** Ganador de cada carrera y cómo le fue a sus apuestas: hace visible que las gráficas cuadran. */
export function RaceResultsList({ races, bets }: RaceResultsListProps) {
  return (
    <ol className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
      {races.map((race) => {
        const winner = getSnail(race.winnerId);
        const raceBets = bets.filter((bet) => bet.raceNumber === race.number);
        const won = raceBets.filter((bet) => bet.won).length;
        return (
          <li key={race.number} className="flex items-start gap-3 bg-bg px-4 py-3">
            <span
              aria-hidden="true"
              className="mt-1.5 size-3 shrink-0 rounded-full"
              style={{ backgroundColor: winner.color }}
            />
            <div>
              <p className="font-semibold">
                Carrera {race.number}: ganó {winner.name}
              </p>
              <p className="text-[13px] text-text-muted">
                {won} de {raceBets.length}{' '}
                {raceBets.length === 1 ? 'apuesta ganada' : 'apuestas ganadas'}
              </p>
            </div>
          </li>
        );
      })}
    </ol>
  );
}
