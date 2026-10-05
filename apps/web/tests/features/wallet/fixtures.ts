import type { ChargeRequest, ChargeResponse } from '@snailracer/shared';

export const USER_ID = '6f1c2b8e-3a4d-4c5e-9f10-1a2b3c4d5e6f';

export const chargeRequest: ChargeRequest = {
  card_number: '1234123412341234',
  expiration_date: '12/26',
  cvv: '543',
  cardholder_name: 'Arturo Torres',
  amount: 250.5,
  payer_id: USER_ID,
  payer_email: 'art@example.com',
};

/** Respuesta aprobada del contrato (docs/snailpay-api.md §7.1). */
export function chargeResponse(overrides: Partial<ChargeResponse> = {}): ChargeResponse {
  return {
    id: 'spay_0b8f6c1e-7d2a-4e3b-9a5f-2c4d6e8f0a1b',
    status: 'approved',
    status_detail: 'accredited',
    transaction_amount: 250.5,
    date_created: '2026-10-04T19:20:31.512Z',
    authorization_code: 'A7K2Q9',
    reference: 'SNL-20261004-X4M8TZ',
    payer_id: USER_ID,
    payer_email: 'art@example.com',
    card_number: '1234123412341234',
    cvv: '543',
    ...overrides,
  };
}

export const rejectedResponse = (overrides: Partial<ChargeResponse> = {}) =>
  chargeResponse({
    id: 'spay_9c2d4e6f-8a1b-4c3d-b5e7-0f2a4c6e8b1d',
    status: 'rejected',
    status_detail: 'insufficient_funds',
    authorization_code: null,
    card_number: '4000000000000002',
    cvv: '123',
    ...overrides,
  });
