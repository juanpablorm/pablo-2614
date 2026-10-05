import { afterEach, describe, expect, it, vi } from 'vitest';

import {
  generateRaceDay,
  getLeaders,
  MAX_BETS_PER_RACE,
  MIN_BETS_PER_RACE,
  RACES_PER_DAY,
  toLocalDateSeed,
} from '@/features/stats/mockRaceDay';
import { isSnailId, SNAILS } from '@/features/stats/snails';

/** Las 365 fechas de 2026 como semillas: los invariantes deben cumplirse para cualquier día. */
const SEEDS_2026 = Array.from({ length: 365 }, (_, i) => toLocalDateSeed(new Date(2026, 0, 1 + i)));

afterEach(() => {
  vi.restoreAllMocks();
});

describe('catálogo de caracoles', () => {
  it('tiene 6 caracoles con id único', () => {
    expect(SNAILS).toHaveLength(6);
    expect(new Set(SNAILS.map((snail) => snail.id)).size).toBe(6);
  });
});

describe('generateRaceDay', () => {
  it('la suma de victorias es exactamente 6 e incluye a los 6 caracoles', () => {
    for (const seed of SEEDS_2026) {
      const { winsBySnail } = generateRaceDay(seed);
      expect(winsBySnail.map(({ snail }) => snail.id)).toEqual(SNAILS.map((snail) => snail.id));
      expect(winsBySnail.reduce((sum, { wins }) => sum + wins, 0)).toBe(RACES_PER_DAY);
    }
  });

  it('cada carrera tiene un solo ganador y existe en el catálogo', () => {
    for (const seed of SEEDS_2026) {
      const { races, winsBySnail } = generateRaceDay(seed);
      expect(races.map((race) => race.number)).toEqual([1, 2, 3, 4, 5, 6]);
      for (const race of races) {
        expect(isSnailId(race.winnerId)).toBe(true);
      }
      // Las victorias del gráfico salen de los mismos ganadores.
      for (const { snail, wins } of winsBySnail) {
        expect(races.filter((race) => race.winnerId === snail.id)).toHaveLength(wins);
      }
    }
  });

  it('cada carrera tiene de 1 a 3 apuestas resueltas contra su ganador', () => {
    for (const seed of SEEDS_2026) {
      const { races, bets } = generateRaceDay(seed);
      for (const race of races) {
        const raceBets = bets.filter((bet) => bet.raceNumber === race.number);
        expect(raceBets.length).toBeGreaterThanOrEqual(MIN_BETS_PER_RACE);
        expect(raceBets.length).toBeLessThanOrEqual(MAX_BETS_PER_RACE);
        for (const bet of raceBets) {
          expect(isSnailId(bet.snailId)).toBe(true);
          expect(bet.won).toBe(bet.snailId === race.winnerId);
        }
      }
      expect(new Set(bets.map((bet) => bet.id)).size).toBe(bets.length);
    }
  });

  it('ganadas + perdidas = total y coincide con el número de apuestas', () => {
    for (const seed of SEEDS_2026) {
      const { bets, betsSummary } = generateRaceDay(seed);
      expect(betsSummary.won + betsSummary.lost).toBe(betsSummary.total);
      expect(betsSummary.total).toBe(bets.length);
      expect(betsSummary.won).toBe(bets.filter((bet) => bet.won).length);
    }
  });

  it('misma semilla → mismo resultado', () => {
    expect(generateRaceDay('2026-10-04')).toEqual(generateRaceDay('2026-10-04'));
  });

  it('semillas distintas → normalmente resultados distintos', () => {
    const strip = (seed: string) => {
      const { races, bets } = generateRaceDay(seed);
      return JSON.stringify({ races, bets: bets.map(({ id: _id, ...bet }) => bet) });
    };
    expect(strip('2026-10-04')).not.toBe(strip('2026-10-05'));

    const sample = SEEDS_2026.slice(0, 100);
    const unique = new Set(sample.map(strip));
    expect(unique.size).toBeGreaterThanOrEqual(95);
  });

  it('no usa Math.random', () => {
    const random = vi.spyOn(Math, 'random');
    generateRaceDay('2026-10-04');
    expect(random).not.toHaveBeenCalled();
  });
});

describe('toLocalDateSeed', () => {
  it('usa la fecha local con formato AAAA-MM-DD', () => {
    expect(toLocalDateSeed(new Date(2026, 0, 5))).toBe('2026-01-05');
    expect(toLocalDateSeed(new Date(2026, 11, 31, 23, 59))).toBe('2026-12-31');
  });
});

describe('getLeaders', () => {
  it('devuelve a todos los empatados en el primer lugar', () => {
    // Victorias que suman 6, con empate a 2 entre el primer y el tercer caracol.
    const wins = [2, 1, 2, 1, 0, 0];
    const winsBySnail = SNAILS.map((snail, i) => ({ snail, wins: wins[i] ?? 0 }));
    expect(getLeaders(winsBySnail).map(({ snail }) => snail)).toEqual([SNAILS[0], SNAILS[2]]);
  });
});
