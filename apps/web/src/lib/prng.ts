/**
 * Generador pseudoaleatorio con semilla (docs/architecture.md §6).
 * Misma semilla → misma secuencia, en cualquier navegador. Nunca usa Math.random.
 */

/** Hash FNV-1a de 32 bits: convierte una cadena en un entero sin signo (uint32). */
export function hashString(value: string): number {
  let hash = 0x811c9dc5;
  for (let i = 0; i < value.length; i++) {
    hash ^= value.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193);
  }
  return hash >>> 0;
}

/** mulberry32: devuelve una función que produce números en [0, 1). */
export function mulberry32(seed: number): () => number {
  let state = seed >>> 0;
  return () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export interface Rng {
  /** Número en [0, 1). */
  next: () => number;
  /** Entero entre `min` y `max`, ambos incluidos. */
  int: (min: number, max: number) => number;
  /** Elemento al azar de una lista no vacía. */
  pick: <T>(items: readonly T[]) => T;
}

export function createRng(seed: string): Rng {
  const next = mulberry32(hashString(seed));
  const int = (min: number, max: number) => min + Math.floor(next() * (max - min + 1));
  const pick = <T>(items: readonly T[]): T => {
    if (items.length === 0) throw new Error('pick() requiere al menos un elemento.');
    return items[int(0, items.length - 1)] as T;
  };
  return { next, int, pick };
}
