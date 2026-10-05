import { describe, expect, it } from 'vitest';

import { createRng, hashString, mulberry32 } from '@/lib/prng';

const take = (next: () => number, n: number) => Array.from({ length: n }, next);

describe('hashString', () => {
  it('es determinista y devuelve un uint32', () => {
    expect(hashString('2026-10-04')).toBe(hashString('2026-10-04'));
    for (const seed of ['', 'a', '2026-10-04', 'una cadena bastante más larga']) {
      const hash = hashString(seed);
      expect(Number.isInteger(hash)).toBe(true);
      expect(hash).toBeGreaterThanOrEqual(0);
      expect(hash).toBeLessThan(2 ** 32);
    }
  });

  it('distingue cadenas parecidas', () => {
    expect(hashString('2026-10-04')).not.toBe(hashString('2026-10-05'));
  });
});

describe('mulberry32', () => {
  it('misma semilla → misma secuencia; otra semilla → otra secuencia', () => {
    expect(take(mulberry32(42), 20)).toEqual(take(mulberry32(42), 20));
    expect(take(mulberry32(42), 20)).not.toEqual(take(mulberry32(43), 20));
  });

  it('produce valores en [0, 1)', () => {
    for (const value of take(mulberry32(7), 10_000)) {
      expect(value).toBeGreaterThanOrEqual(0);
      expect(value).toBeLessThan(1);
    }
  });
});

describe('createRng', () => {
  it('int respeta ambos límites y los alcanza', () => {
    const rng = createRng('limites');
    const values = new Set(Array.from({ length: 1_000 }, () => rng.int(1, 3)));
    expect([...values].sort()).toEqual([1, 2, 3]);
  });

  it('pick solo devuelve elementos de la lista', () => {
    const rng = createRng('pick');
    const items = ['a', 'b', 'c'] as const;
    for (let i = 0; i < 100; i++) expect(items).toContain(rng.pick(items));
  });

  it('pick con lista vacía lanza un error', () => {
    expect(() => createRng('vacia').pick([])).toThrow();
  });
});
