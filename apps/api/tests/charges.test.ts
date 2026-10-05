import {
  chargeResponseSchema,
  SNAILPAY_BASE_PATH,
  type ChargeRequest,
  type ChargeResponse,
} from '@snailracer/shared';
import type { Express } from 'express';
import request from 'supertest';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { createApp, type AppDeps } from '../src/app.js';
import { loadEnv } from '../src/config/env.js';

const CHARGES = `${SNAILPAY_BASE_PATH}/charges`;

const validRequest: ChargeRequest = {
  card_number: '1234123412341234',
  expiration_date: '12/26',
  cvv: '543',
  cardholder_name: 'Arturo Torres',
  amount: 250.5,
  payer_id: '6f1c2b8e-3a4d-4c5e-9f10-1a2b3c4d5e6f',
  payer_email: 'art@example.com',
};

/** Sin retraso real para el escenario 9, salvo que la prueba diga otra cosa. */
const noSleep = vi.fn(async () => {});

function makeApp(envVars: Record<string, string> = {}, deps: AppDeps = {}) {
  return createApp(loadEnv(envVars), { sleep: noSleep, ...deps });
}

/** POST /charges; valida que la respuesta cumpla el contrato que usa el frontend. */
async function charge(
  app: Express,
  body: unknown,
  headers: Record<string, string> = {},
): Promise<{ status: number; body: ChargeResponse }> {
  const res = await request(app)
    .post(CHARGES)
    .set(headers)
    .send(body as object);
  return { status: res.status, body: chargeResponseSchema.parse(res.body) };
}

const withBody = (overrides: Record<string, unknown>) => ({ ...validRequest, ...overrides });

describe('POST /api/snailpay/v1/charges', () => {
  afterEach(() => {
    vi.restoreAllMocks();
    noSleep.mockClear();
  });

  describe('escenarios (§4)', () => {
    const app = makeApp();

    it('1. cobro exitoso → 201 approved / accredited', async () => {
      const { status, body } = await charge(app, validRequest);

      expect(status).toBe(201);
      expect(body).toMatchObject({
        status: 'approved',
        status_detail: 'accredited',
        transaction_amount: 250.5,
        payer_id: validRequest.payer_id,
        payer_email: validRequest.payer_email,
        card_number: validRequest.card_number,
        cvv: validRequest.cvv,
      });
      expect(body.authorization_code).toMatch(/^[A-Z0-9]{6}$/);
      expect(body.errors).toBeUndefined();
    });

    it('2. datos inválidos → 400 invalid_request con la lista de campos (§7.2)', async () => {
      const { status, body } = await charge(app, withBody({ amount: 0, cvv: '54' }));

      expect(status).toBe(400);
      expect(body).toMatchObject({
        status: 'rejected',
        status_detail: 'invalid_request',
        transaction_amount: 0,
        authorization_code: null,
        cvv: '54',
      });
      expect(body.errors).toEqual([
        { field: 'cvv', message: 'Debe tener 3 dígitos' },
        { field: 'amount', message: 'Debe ser mayor que 0' },
      ]);
    });

    it.each([
      ['3. CVV incorrecto', withBody({ cvv: '544' }), 'invalid_security_code'],
      ['4. fecha incorrecta', withBody({ expiration_date: '12/27' }), 'invalid_expiration_date'],
      [
        '5. fondos insuficientes',
        withBody({ card_number: '4000000000000002', expiration_date: '01/30', cvv: '999' }),
        'insufficient_funds',
      ],
      ['6. tarjeta rechazada', withBody({ card_number: '4000000000000069' }), 'card_declined'],
      ['6. tarjeta no listada', withBody({ card_number: '5555555555554444' }), 'card_declined'],
      ['7. monto excedido', withBody({ amount: 10000.01 }), 'amount_exceeds_limit'],
    ])('%s → 402 rejected', async (_name, input, detail) => {
      const { status, body } = await charge(app, input);

      expect(status).toBe(402);
      expect(body).toMatchObject({ status: 'rejected', status_detail: detail });
      expect(body.authorization_code).toBeNull();
    });

    it('8. error del sistema (tarjeta 9999…) → 503 error / service_unavailable', async () => {
      const { status, body } = await charge(app, withBody({ card_number: '9999999999999999' }));

      expect(status).toBe(503);
      expect(body).toMatchObject({ status: 'error', status_detail: 'service_unavailable' });
    });

    it('8. error del sistema (SNAILPAY_SIMULATE_OUTAGE) → 503 en toda solicitud', async () => {
      const outage = makeApp({ SNAILPAY_SIMULATE_OUTAGE: 'true' });

      for (const input of [validRequest, { foo: 'bar' }]) {
        const { status, body } = await charge(outage, input);
        expect(status).toBe(503);
        expect(body.status_detail).toBe('service_unavailable');
      }
    });

    it('9. timeout (tarjeta 8888…) → espera SNAILPAY_SLOW_DELAY_MS y responde 503 (P2)', async () => {
      const { status, body } = await charge(app, withBody({ card_number: '8888888888888888' }));

      expect(noSleep).toHaveBeenCalledExactlyOnceWith(15000);
      expect(status).toBe(503);
      expect(body).toMatchObject({ status: 'error', status_detail: 'service_unavailable' });
    });

    it('9. el retraso es real con el sleep por defecto', async () => {
      const slow = createApp(loadEnv({ SNAILPAY_SLOW_DELAY_MS: '60' }));
      const started = performance.now();

      const { status } = await charge(slow, withBody({ card_number: '8888888888888888' }));

      expect(performance.now() - started).toBeGreaterThanOrEqual(50);
      expect(status).toBe(503);
    });

    it('10. error inesperado → 500 internal_error con la forma del contrato', async () => {
      vi.spyOn(console, 'error').mockImplementation(() => {});
      const broken = makeApp(
        {},
        {
          chargeService: {
            processCharge: async () => {
              throw new Error('detalle interno secreto');
            },
          },
        },
      );

      const res = await request(broken).post(CHARGES).send(validRequest);

      expect(res.status).toBe(500);
      const body = chargeResponseSchema.parse(res.body);
      expect(body).toMatchObject({
        status: 'error',
        status_detail: 'internal_error',
        authorization_code: null,
        card_number: validRequest.card_number,
      });
      expect(res.text).not.toContain('secreto');
    });
  });

  describe('orden de evaluación (§5)', () => {
    const app = makeApp();

    it('un body inválido gana sobre una tarjeta especial', async () => {
      const { status, body } = await charge(
        app,
        withBody({ card_number: '9999999999999999', cvv: '1' }),
      );
      expect(status).toBe(400);
      expect(body.errors).toEqual([{ field: 'cvv', message: 'Debe tener 3 dígitos' }]);
    });

    it('una tarjeta especial no revisa fecha ni CVV', async () => {
      const { body } = await charge(
        app,
        withBody({ card_number: '4000000000000002', expiration_date: '12/26', cvv: '543' }),
      );
      expect(body.status_detail).toBe('insufficient_funds');
    });

    it('tarjeta de éxito: fecha → CVV → monto', async () => {
      const wrongAll = withBody({ expiration_date: '11/26', cvv: '000', amount: 20000 });
      expect((await charge(app, wrongAll)).body.status_detail).toBe('invalid_expiration_date');

      const wrongCvvAndAmount = withBody({ cvv: '000', amount: 20000 });
      expect((await charge(app, wrongCvvAndAmount)).body.status_detail).toBe(
        'invalid_security_code',
      );
    });
  });

  describe('validación (§2)', () => {
    const app = makeApp();

    it.each([
      ['10000 exacto', 10000, 201],
      ['0.29 (error binario)', 0.29, 201],
      ['un centavo', 0.01, 201],
      ['10000.01', 10000.01, 402],
      ['0', 0, 400],
      ['negativo', -1, 400],
      ['3 decimales', 1.234, 400],
    ])('monto %s → %i', async (_name, amount, expected) => {
      expect((await charge(app, withBody({ amount }))).status).toBe(expected);
    });

    it('un monto en texto no es numérico: transaction_amount null', async () => {
      const { status, body } = await charge(app, withBody({ amount: '250' }));
      expect(status).toBe(400);
      expect(body.transaction_amount).toBeNull();
      expect(body.errors).toEqual([{ field: 'amount', message: 'Debe ser un número' }]);
    });

    it('respeta SNAILPAY_MAX_AMOUNT', async () => {
      const lowLimit = makeApp({ SNAILPAY_MAX_AMOUNT: '500' });
      expect((await charge(lowLimit, withBody({ amount: 500 }))).status).toBe(201);
      expect((await charge(lowLimit, withBody({ amount: 500.01 }))).body.status_detail).toBe(
        'amount_exceeds_limit',
      );
    });

    it('acepta el número con espacios y lo devuelve normalizado', async () => {
      const { status, body } = await charge(app, withBody({ card_number: '1234 1234 1234 1234' }));
      expect(status).toBe(201);
      expect(body.card_number).toBe('1234123412341234');
    });

    it('marca cada campo faltante como obligatorio', async () => {
      const { status, body } = await charge(app, {});
      expect(status).toBe(400);
      expect(body.errors?.map((e) => e.field)).toEqual([
        'card_number',
        'expiration_date',
        'cvv',
        'cardholder_name',
        'amount',
        'payer_id',
        'payer_email',
      ]);
      expect(body.errors?.every((e) => e.message === 'Es obligatorio')).toBe(true);
      expect(body).toMatchObject({ transaction_amount: null, card_number: null, cvv: null });
    });

    it.each([
      ['mes 13', { expiration_date: '13/26' }, 'expiration_date'],
      ['nombre vacío', { cardholder_name: '   ' }, 'cardholder_name'],
      ['nombre largo', { cardholder_name: 'x'.repeat(81) }, 'cardholder_name'],
      ['payer_id no UUID', { payer_id: 'abc' }, 'payer_id'],
      ['correo inválido', { payer_email: 'art@' }, 'payer_email'],
      ['tarjeta de 15 dígitos', { card_number: '123412341234123' }, 'card_number'],
    ])('%s → 400', async (_name, overrides, field) => {
      const { status, body } = await charge(app, withBody(overrides));
      expect(status).toBe(400);
      expect(body.errors?.map((e) => e.field)).toEqual([field]);
    });

    it('un body que no es objeto → 400 con el campo "body"', async () => {
      const res = await request(app)
        .post(CHARGES)
        .set('Content-Type', 'application/json')
        .send('[1, 2]');
      const body = chargeResponseSchema.parse(res.body);
      expect(res.status).toBe(400);
      expect(body.errors).toEqual([{ field: 'body', message: 'Debe ser un objeto JSON' }]);
    });

    it('JSON malformado y body > 10 KB responden con la forma del contrato', async () => {
      const malformed = await request(app)
        .post(CHARGES)
        .set('Content-Type', 'application/json')
        .send('{"amount": ');
      expect(malformed.status).toBe(400);
      expect(chargeResponseSchema.parse(malformed.body).status_detail).toBe('invalid_request');

      const tooLarge = await request(app)
        .post(CHARGES)
        .set('Content-Type', 'application/json')
        .send(JSON.stringify({ ...validRequest, cardholder_name: 'x'.repeat(11 * 1024) }));
      expect(tooLarge.status).toBe(413);
      expect(chargeResponseSchema.parse(tooLarge.body).status_detail).toBe('invalid_request');
    });
  });

  describe('forma de la respuesta (§3)', () => {
    const app = makeApp();

    it('siempre trae los 11 campos con su formato', async () => {
      for (const input of [validRequest, withBody({ cvv: '000' }), { foo: 'bar' }]) {
        const { body } = await charge(app, input);
        expect(Object.keys(body)).toEqual(
          expect.arrayContaining([
            'id',
            'status',
            'status_detail',
            'transaction_amount',
            'date_created',
            'authorization_code',
            'reference',
            'payer_id',
            'payer_email',
            'card_number',
            'cvv',
          ]),
        );
        expect(body.id).toMatch(
          /^spay_[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/,
        );
        expect(body.reference).toMatch(/^SNL-\d{8}-[A-Z0-9]{6}$/);
        expect(new Date(body.date_created).toISOString()).toBe(body.date_created);
      }
    });

    it('la referencia usa la fecha UTC del cobro', async () => {
      const fixed = makeApp({}, { now: () => new Date('2026-10-04T23:59:59.000Z') });
      const { body } = await charge(fixed, validRequest);
      expect(body.date_created).toBe('2026-10-04T23:59:59.000Z');
      expect(body.reference).toMatch(/^SNL-20261004-/);
    });
  });

  describe('nunca un falso cobro exitoso (regla 2)', () => {
    const app = makeApp();

    it.each([
      ['un dígito distinto', { card_number: '1234123412341235' }],
      ['tarjeta especial con datos de éxito', { card_number: '4000000000000069' }],
      ['fecha cercana', { expiration_date: '12/25' }],
      ['CVV cercano', { cvv: '542' }],
      ['monto apenas sobre el máximo', { amount: 10000.01 }],
      ['tarjeta de 17 dígitos', { card_number: '12341234123412341' }],
      ['CVV numérico', { cvv: 543 }],
      ['monto en texto', { amount: '250.50' }],
    ])('%s no aprueba', async (_name, overrides) => {
      const { status, body } = await charge(app, withBody(overrides));
      expect(status).not.toBe(201);
      expect(body.status).not.toBe('approved');
      expect(body.authorization_code).toBeNull();
    });
  });

  describe('Idempotency-Key (P1)', () => {
    it('misma key y mismo body → la respuesta original, sin cobrar de nuevo', async () => {
      const app = makeApp();
      const headers = { 'Idempotency-Key': 'key-1' };

      const first = await charge(app, validRequest, headers);
      // Mismo body con las claves en otro orden.
      const reordered = Object.fromEntries(Object.entries(validRequest).reverse());
      const second = await charge(app, reordered, headers);

      expect(first.status).toBe(201);
      expect(second.status).toBe(201);
      expect(second.body).toEqual(first.body);
    });

    it('también repite los rechazos con su código original', async () => {
      const app = makeApp();
      const headers = { 'Idempotency-Key': 'key-2' };
      const input = withBody({ cvv: '000' });

      const first = await charge(app, input, headers);
      const second = await charge(app, input, headers);

      expect(second.status).toBe(402);
      expect(second.body.id).toBe(first.body.id);
    });

    it('misma key con otro body → 422', async () => {
      const app = makeApp();
      const headers = { 'Idempotency-Key': 'key-3' };

      await charge(app, validRequest, headers);
      const { status, body } = await charge(app, withBody({ amount: 100 }), headers);

      expect(status).toBe(422);
      expect(body).toMatchObject({ status: 'rejected', status_detail: 'invalid_request' });
      expect(body.errors).toEqual([
        { field: 'Idempotency-Key', message: 'Ya se usó con una solicitud distinta' },
      ]);
    });

    it('sin key, cada solicitud es un cobro nuevo', async () => {
      const app = makeApp();
      const first = await charge(app, validRequest);
      const second = await charge(app, validRequest);
      expect(second.body.id).not.toBe(first.body.id);
    });

    it('dos solicitudes simultáneas con la misma key se procesan una sola vez', async () => {
      const sleep = vi.fn(() => new Promise<void>((resolve) => setTimeout(resolve, 30)));
      const app = makeApp({}, { sleep });
      const headers = { 'Idempotency-Key': 'key-4' };
      const slowCard = withBody({ card_number: '8888888888888888' });

      const [a, b] = await Promise.all([
        charge(app, slowCard, headers),
        charge(app, slowCard, headers),
      ]);

      expect(sleep).toHaveBeenCalledTimes(1);
      expect(a.body.id).toBe(b.body.id);
    });

    it('un error del sistema no queda guardado: el reintento se procesa de nuevo', async () => {
      const app = makeApp();
      const headers = { 'Idempotency-Key': 'key-5' };
      const input = withBody({ card_number: '9999999999999999' });

      const first = await charge(app, input, headers);
      const second = await charge(app, input, headers);

      expect(first.status).toBe(503);
      expect(second.body.id).not.toBe(first.body.id);
    });

    it('la key expira a las 24 h', async () => {
      let current = new Date('2026-10-04T12:00:00.000Z');
      const app = makeApp({}, { now: () => current });
      const headers = { 'Idempotency-Key': 'key-6' };

      await charge(app, validRequest, headers);
      current = new Date('2026-10-05T12:00:00.000Z');
      const { status } = await charge(app, withBody({ amount: 100 }), headers);

      expect(status).toBe(201);
    });

    it.each([
      ['vacía', '   '],
      ['demasiado larga', 'k'.repeat(256)],
    ])('una key %s → 400', async (_name, key) => {
      const { status, body } = await charge(makeApp(), validRequest, { 'Idempotency-Key': key });
      expect(status).toBe(400);
      expect(body.errors?.[0]?.field).toBe('Idempotency-Key');
    });
  });
});
