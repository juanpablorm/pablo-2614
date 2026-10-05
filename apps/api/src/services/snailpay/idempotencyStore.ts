/**
 * Idempotency-Key en memoria (P1 en CONTEXT.md). El backend no tiene base de datos:
 * las keys viven en un Map con TTL y tope de entradas, y se pierden al reiniciar.
 *
 * - Misma key + mismo body → el resultado original (también si aún se está procesando).
 * - Misma key + otro body → conflicto.
 */

export const IDEMPOTENCY_TTL_MS = 24 * 60 * 60 * 1000;
export const IDEMPOTENCY_MAX_ENTRIES = 1000;

export type IdempotentResult<T> = { conflict: true } | { conflict: false; value: T };

interface Entry<T> {
  bodyHash: string;
  createdAt: number;
  result: Promise<T>;
}

interface IdempotencyStoreOptions {
  ttlMs?: number;
  maxEntries?: number;
  now?: () => number;
}

/** JSON con las claves ordenadas: dos bodies iguales en otro orden dan el mismo hash. */
export function stableStringify(value: unknown): string {
  if (Array.isArray(value)) return `[${value.map(stableStringify).join(',')}]`;
  if (typeof value === 'object' && value !== null) {
    const entries = Object.entries(value)
      .filter(([, v]) => v !== undefined)
      .sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0))
      .map(([k, v]) => `${JSON.stringify(k)}:${stableStringify(v)}`);
    return `{${entries.join(',')}}`;
  }
  return JSON.stringify(value) ?? 'undefined';
}

export type IdempotencyStore<T> = ReturnType<typeof createIdempotencyStore<T>>;

export function createIdempotencyStore<T>({
  ttlMs = IDEMPOTENCY_TTL_MS,
  maxEntries = IDEMPOTENCY_MAX_ENTRIES,
  now = Date.now,
}: IdempotencyStoreOptions = {}) {
  // El Map conserva el orden de inserción, que es el orden de creación: la primera es la más vieja.
  const entries = new Map<string, Entry<T>>();

  function prune() {
    const current = now();
    for (const [key, entry] of entries) {
      if (current - entry.createdAt >= ttlMs) entries.delete(key);
    }
    while (entries.size >= maxEntries) {
      const oldest = entries.keys().next().value;
      if (oldest === undefined) break;
      entries.delete(oldest);
    }
  }

  /**
   * Ejecuta `task` una sola vez por key. `keep` decide si el resultado se conserva
   * (los errores transitorios no, para que un reintento con la misma key pueda salir bien).
   */
  async function execute(
    key: string,
    body: unknown,
    task: () => Promise<T>,
    keep: (value: T) => boolean = () => true,
  ): Promise<IdempotentResult<T>> {
    prune();
    const bodyHash = stableStringify(body);
    const existing = entries.get(key);
    if (existing) {
      if (existing.bodyHash !== bodyHash) return { conflict: true };
      return { conflict: false, value: await existing.result };
    }

    const entry: Entry<T> = { bodyHash, createdAt: now(), result: task() };
    entries.set(key, entry);
    const forget = () => {
      if (entries.get(key) === entry) entries.delete(key);
    };

    try {
      const value = await entry.result;
      if (!keep(value)) forget();
      return { conflict: false, value };
    } catch (error) {
      forget();
      throw error;
    }
  }

  return { execute, size: () => entries.size };
}
