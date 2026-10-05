import { describe, expect, it, vi } from 'vitest';

import {
  createIdempotencyStore,
  stableStringify,
} from '../src/services/snailpay/idempotencyStore.js';

describe('stableStringify', () => {
  it('no depende del orden de las claves', () => {
    expect(stableStringify({ b: 1, a: { d: [1, 2], c: null } })).toBe(
      stableStringify({ a: { c: null, d: [1, 2] }, b: 1 }),
    );
  });

  it('distingue valores distintos', () => {
    expect(stableStringify({ amount: 1 })).not.toBe(stableStringify({ amount: '1' }));
    expect(stableStringify([1, 2])).not.toBe(stableStringify([2, 1]));
  });
});

describe('createIdempotencyStore', () => {
  it('ejecuta la tarea una sola vez por key', async () => {
    const store = createIdempotencyStore<number>();
    const task = vi.fn(async () => 42);

    expect(await store.execute('k', { a: 1 }, task)).toEqual({ conflict: false, value: 42 });
    expect(await store.execute('k', { a: 1 }, task)).toEqual({ conflict: false, value: 42 });
    expect(task).toHaveBeenCalledTimes(1);
  });

  it('marca conflicto si la key se repite con otro body', async () => {
    const store = createIdempotencyStore<number>();
    await store.execute('k', { a: 1 }, async () => 1);
    expect(await store.execute('k', { a: 2 }, async () => 2)).toEqual({ conflict: true });
  });

  it('olvida los resultados que no se deben conservar y los que fallan', async () => {
    const store = createIdempotencyStore<number>();
    await store.execute(
      'k',
      {},
      async () => 1,
      () => false,
    );
    expect(store.size()).toBe(0);

    await expect(
      store.execute('f', {}, async () => {
        throw new Error('falla');
      }),
    ).rejects.toThrow('falla');
    expect(store.size()).toBe(0);
  });

  it('expira las keys después del TTL', async () => {
    let now = 0;
    const store = createIdempotencyStore<number>({ ttlMs: 1000, now: () => now });
    const task = vi.fn(async () => 1);

    await store.execute('k', {}, task);
    now = 999;
    await store.execute('k', {}, task);
    now = 1000;
    await store.execute('k', {}, task);

    expect(task).toHaveBeenCalledTimes(2);
  });

  it('descarta las keys más viejas al llegar al tope', async () => {
    const store = createIdempotencyStore<number>({ maxEntries: 2 });
    await store.execute('a', {}, async () => 1);
    await store.execute('b', {}, async () => 2);
    await store.execute('c', {}, async () => 3);

    expect(store.size()).toBe(2);
    const task = vi.fn(async () => 9);
    await store.execute('a', {}, task); // "a" ya no estaba
    expect(task).toHaveBeenCalledTimes(1);
  });
});
