import { chargeResponseSchema } from '@snailracer/shared';
import { describe, expect, it } from 'vitest';

import {
  createResponseFactory,
  statusForDetail,
} from '../src/services/snailpay/responseFactory.js';

const factory = createResponseFactory({
  now: () => new Date('2026-10-04T19:20:31.512Z'),
  randomUUID: () => '0b8f6c1e-7d2a-4e3b-9a5f-2c4d6e8f0a1b',
  randomInt: () => 0, // siempre "A"
});

describe('responseFactory', () => {
  it('construye la respuesta aprobada de §7.1', () => {
    const response = factory.build(
      {
        card_number: '1234 1234 1234 1234',
        cvv: '543',
        amount: 250.5,
        payer_id: 'p',
        payer_email: 'e',
      },
      'accredited',
    );

    expect(response).toEqual({
      id: 'spay_0b8f6c1e-7d2a-4e3b-9a5f-2c4d6e8f0a1b',
      status: 'approved',
      status_detail: 'accredited',
      transaction_amount: 250.5,
      date_created: '2026-10-04T19:20:31.512Z',
      authorization_code: 'AAAAAA',
      reference: 'SNL-20261004-AAAAAA',
      payer_id: 'p',
      payer_email: 'e',
      card_number: '1234123412341234',
      cvv: '543',
    });
  });

  it.each([undefined, null, 'texto', [1, 2], { card_number: 1234, amount: '250' }])(
    'con un body raro (%j) devuelve null en el eco, sin lanzar',
    (body) => {
      const response = factory.build(body, 'invalid_request', [{ field: 'body', message: 'x' }]);
      expect(chargeResponseSchema.parse(response)).toMatchObject({
        transaction_amount: null,
        card_number: null,
        cvv: null,
        payer_id: null,
        authorization_code: null,
        errors: [{ field: 'body', message: 'x' }],
      });
    },
  );

  it('solo incluye errors en invalid_request', () => {
    expect(factory.build({}, 'card_declined', [{ field: 'a', message: 'b' }])).not.toHaveProperty(
      'errors',
    );
  });

  it('redondea el monto a 2 decimales', () => {
    expect(factory.build({ amount: 1.234 }, 'invalid_request').transaction_amount).toBe(1.23);
  });

  it('mapea cada detalle a su status', () => {
    expect(statusForDetail('accredited')).toBe('approved');
    expect(statusForDetail('service_unavailable')).toBe('error');
    expect(statusForDetail('internal_error')).toBe('error');
    expect(statusForDetail('insufficient_funds')).toBe('rejected');
    expect(statusForDetail('invalid_request')).toBe('rejected');
  });
});
