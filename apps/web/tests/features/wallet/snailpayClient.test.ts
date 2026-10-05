import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { createSnailpayClient } from '@/features/wallet/snailpayClient';

import { chargeRequest, chargeResponse, rejectedResponse } from './fixtures';

type FetchArgs = [url: string, init: RequestInit];

const headersOf = (call: unknown[] | undefined) =>
  ((call as FetchArgs | undefined)?.[1].headers ?? {}) as Record<string, string>;

/** Servidor lento (escenario 9): nunca responde y rechaza al abortar, como fetch real. */
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

describe('snailpayClient.charge', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-10-04T19:24:00.000Z'));
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
  });

  it('a los 8 s devuelve la respuesta local de timeout (§7.5)', async () => {
    const fetchMock = hangingFetch();
    vi.stubGlobal('fetch', fetchMock);
    const client = createSnailpayClient({ timeoutMs: 8000 });

    let settled = false;
    const pending = client.charge(chargeRequest).finally(() => (settled = true));

    await vi.advanceTimersByTimeAsync(7999);
    expect(settled).toBe(false);
    await vi.advanceTimersByTimeAsync(1);

    const response = await pending;
    expect(response).toMatchObject({
      status: 'error',
      status_detail: 'timeout',
      authorization_code: null,
      transaction_amount: 250.5,
      date_created: '2026-10-04T19:24:08.000Z', // momento del abort
      reference: 'SNL-20261004-LOCAL0',
      payer_id: chargeRequest.payer_id,
      payer_email: chargeRequest.payer_email,
      card_number: chargeRequest.card_number,
    });
    expect(response.id).toMatch(/^local_[0-9a-f-]{36}$/);
  });

  it('usa 8 s por defecto', async () => {
    vi.stubGlobal('fetch', hangingFetch());
    const pending = createSnailpayClient().charge(chargeRequest);
    await vi.advanceTimersByTimeAsync(8000);
    expect((await pending).status_detail).toBe('timeout');
  });

  it('descarta una respuesta que llega después del timeout', async () => {
    // fetch que ignora la señal y "aprueba" a los 15 s.
    vi.stubGlobal(
      'fetch',
      vi.fn(
        () =>
          new Promise<Response>((resolve) =>
            setTimeout(() => resolve(Response.json(chargeResponse(), { status: 201 })), 15_000),
          ),
      ),
    );
    const pending = createSnailpayClient({ timeoutMs: 8000 }).charge(chargeRequest);

    await vi.advanceTimersByTimeAsync(15_000);

    const response = await pending;
    expect(response.status).toBe('error');
    expect(response.status_detail).toBe('timeout');
  });

  it('devuelve la respuesta del servidor cuando es válida', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => Response.json(chargeResponse(), { status: 201 })),
    );
    expect(await createSnailpayClient().charge(chargeRequest)).toEqual(chargeResponse());
  });

  it('devuelve los rechazos tal cual', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => Response.json(rejectedResponse(), { status: 402 })),
    );
    expect(await createSnailpayClient().charge(chargeRequest)).toEqual(rejectedResponse());
  });

  it.each([
    ['sin campos', { foo: 'bar' }],
    ['ruta inexistente', { error: 'not_found' }],
    ['status inventado', { ...chargeResponse(), status: 'ok' }],
    ['no es JSON', null],
  ])('respuesta malformada (%s) → error local', async (_name, body) => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () =>
        body === null ? new Response('<html>', { status: 200 }) : Response.json(body),
      ),
    );

    const response = await createSnailpayClient().charge(chargeRequest);

    expect(response).toMatchObject({
      status: 'error',
      status_detail: 'internal_error',
      authorization_code: null,
    });
    expect(response.id).toMatch(/^local_/);
  });

  it.each([
    ['HTTP distinto de 201', chargeResponse(), 402],
    ['sin código de autorización', chargeResponse({ authorization_code: null }), 201],
    ['monto 0', chargeResponse({ transaction_amount: 0 }), 201],
  ])('un "approved" inconsistente (%s) no se acepta', async (_name, body, status) => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => Response.json(body, { status })),
    );
    const response = await createSnailpayClient().charge(chargeRequest);
    expect(response.status).toBe('error');
  });

  it('error de red → network_error local', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => {
        throw new TypeError('Failed to fetch');
      }),
    );
    expect(await createSnailpayClient().charge(chargeRequest)).toMatchObject({
      status: 'error',
      status_detail: 'network_error',
    });
  });

  it('envía el request a la ruta del contrato con un Idempotency-Key nuevo por intento', async () => {
    const fetchMock = vi.fn(async () => Response.json(rejectedResponse(), { status: 402 }));
    vi.stubGlobal('fetch', fetchMock);
    const client = createSnailpayClient({ apiBaseUrl: '/api' });

    await client.charge(chargeRequest);
    await client.charge(chargeRequest);

    const [first, second] = fetchMock.mock.calls as unknown as FetchArgs[];
    expect(first?.[0]).toBe('/api/snailpay/v1/charges');
    expect(JSON.parse(first?.[1].body as string)).toEqual(chargeRequest);

    const firstKey = headersOf(first)['Idempotency-Key'];
    const secondKey = headersOf(second)['Idempotency-Key'];
    expect(firstKey).toMatch(/^[0-9a-f-]{36}$/);
    expect(secondKey).toMatch(/^[0-9a-f-]{36}$/);
    expect(firstKey).not.toBe(secondKey);
  });
});
