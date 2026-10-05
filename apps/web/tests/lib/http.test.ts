import { afterEach, describe, expect, it, vi } from 'vitest';

import { postJson } from '@/lib/http';

/** fetch que respeta la señal como el real: rechaza con AbortError al abortar. */
function hangingFetch() {
  return vi.fn(
    (_url: string, init?: RequestInit) =>
      new Promise<Response>((_resolve, reject) => {
        init?.signal?.addEventListener('abort', () =>
          reject(new DOMException('Aborted', 'AbortError')),
        );
      }),
  );
}

describe('postJson', () => {
  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
  });

  it('devuelve la respuesta con su código y el JSON', async () => {
    const fetchMock = vi.fn(async () => Response.json({ ok: true }, { status: 402 }));
    vi.stubGlobal('fetch', fetchMock);

    const result = await postJson('/api/x', { a: 1 }, { timeoutMs: 1000, headers: { 'X-A': 'b' } });

    expect(result).toEqual({ kind: 'response', status: 402, body: { ok: true } });
    expect(fetchMock).toHaveBeenCalledWith(
      '/api/x',
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({ a: 1 }),
        headers: { 'Content-Type': 'application/json', 'X-A': 'b' },
      }),
    );
  });

  it('body null si la respuesta no es JSON', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => new Response('<html>', { status: 502 })),
    );
    expect(await postJson('/api/x', {}, { timeoutMs: 1000 })).toEqual({
      kind: 'response',
      status: 502,
      body: null,
    });
  });

  it('distingue el error de red', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => {
        throw new TypeError('Failed to fetch');
      }),
    );
    expect(await postJson('/api/x', {}, { timeoutMs: 1000 })).toEqual({ kind: 'network_error' });
  });

  it('aborta al llegar al tiempo límite', async () => {
    vi.useFakeTimers();
    const fetchMock = hangingFetch();
    vi.stubGlobal('fetch', fetchMock);

    const pending = postJson('/api/x', {}, { timeoutMs: 500 });
    await vi.advanceTimersByTimeAsync(500);

    expect(await pending).toEqual({ kind: 'timeout' });
    expect(fetchMock.mock.calls[0]?.[1]?.signal?.aborted).toBe(true);
  });
});
