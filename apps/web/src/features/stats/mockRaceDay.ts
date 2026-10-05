/**
 * Día de carreras simulado (docs/architecture.md §6, CONTEXT.md regla 7).
 * Una sola función pura genera carreras y apuestas; ambas gráficas salen de aquí,
 * así que siempre son congruentes entre sí.
 */
import { createRng } from '@/lib/prng';

import { SNAILS, type Snail, type SnailId } from './snails';

export const RACES_PER_DAY = 6;
export const MIN_BETS_PER_RACE = 1;
export const MAX_BETS_PER_RACE = 3;

export interface Race {
  /** 1 a 6. */
  number: number;
  winnerId: SnailId;
}

export interface SimulatedBet {
  id: string;
  raceNumber: number;
  snailId: SnailId;
  /** Ganada si el caracol apostado ganó esa carrera. */
  won: boolean;
}

export interface SnailWins {
  snail: Snail;
  wins: number;
}

export interface BetsSummary {
  won: number;
  lost: number;
  total: number;
}

export interface RaceDay {
  seed: string;
  races: Race[];
  bets: SimulatedBet[];
  /** Los 6 caracoles en el orden del catálogo, incluidos los que no ganaron. */
  winsBySnail: SnailWins[];
  betsSummary: BetsSummary;
}

export function generateRaceDay(seed: string): RaceDay {
  const rng = createRng(seed);
  const races: Race[] = [];
  const bets: SimulatedBet[] = [];

  for (let number = 1; number <= RACES_PER_DAY; number++) {
    const winnerId = rng.pick(SNAILS).id;
    races.push({ number, winnerId });

    const betCount = rng.int(MIN_BETS_PER_RACE, MAX_BETS_PER_RACE);
    for (let i = 1; i <= betCount; i++) {
      const snailId = rng.pick(SNAILS).id;
      bets.push({
        id: `${seed}-c${number}-a${i}`,
        raceNumber: number,
        snailId,
        won: snailId === winnerId,
      });
    }
  }

  const winsBySnail = SNAILS.map((snail) => ({
    snail,
    wins: races.filter((race) => race.winnerId === snail.id).length,
  }));

  const won = bets.filter((bet) => bet.won).length;
  const betsSummary = { won, lost: bets.length - won, total: bets.length };

  return { seed, races, bets, winsBySnail, betsSummary };
}

/** Fecha local como `AAAA-MM-DD`: la semilla del día (mismos datos al recargar). */
export function toLocalDateSeed(date: Date = new Date()): string {
  const pad = (value: number) => String(value).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

/** Caracoles con más victorias; en empate se devuelven todos (CONTEXT.md, P6). */
export function getLeaders(winsBySnail: readonly SnailWins[]): SnailWins[] {
  const max = Math.max(...winsBySnail.map((entry) => entry.wins));
  return winsBySnail.filter((entry) => entry.wins === max);
}
