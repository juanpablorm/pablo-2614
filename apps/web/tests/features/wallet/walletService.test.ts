import type { ChargeResponse } from '@snailracer/shared';
import { afterEach, describe, expect, it, vi } from 'vitest';

import {
  applyChargeResult,
  getBalanceCents,
  getChargeHistory,
} from '@/features/wallet/walletService';
import { readCharges, storageKeys, writeWallet } from '@/lib/storage';

import { chargeResponse, rejectedResponse, USER_ID } from './fixtures';

const localError = (detail: ChargeResponse['status_detail']) =>
  chargeResponse({
    id: `local_${detail}`,
    status: 'error',
    status_detail: detail,
    authorization_code: null,
    reference: 'SNL-20261004-LOCAL0',
  });

describe('walletService.applyChargeResult', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('approved suma transaction_amount en centavos', () => {
    writeWallet(USER_ID, { balanceCents: 10_000 });

    const result = applyChargeResult(USER_ID, chargeResponse());

    expect(result.balanceCents).toBe(35_050);
    expect(result.persisted).toBe(true);
    expect(getBalanceCents(USER_ID)).toBe(35_050);
  });

  it('suma desde $0 cuando el wallet no existe', () => {
    expect(applyChargeResult(USER_ID, chargeResponse()).balanceCents).toBe(25_050);
  });

  it.each([
    ['rejected', rejectedResponse()],
    ['error (503)', localError('service_unavailable')],
    ['error (500)', localError('internal_error')],
    ['timeout', localError('timeout')],
    ['error de red', localError('network_error')],
  ])('%s no cambia el saldo', (_name, response) => {
    writeWallet(USER_ID, { balanceCents: 5_000 });

    const result = applyChargeResult(USER_ID, response);

    expect(result.balanceCents).toBe(5_000);
    expect(getBalanceCents(USER_ID)).toBe(5_000);
  });

  it('un status desconocido no cambia el saldo', () => {
    writeWallet(USER_ID, { balanceCents: 5_000 });
    const unknown = { ...chargeResponse(), status: 'pending' } as unknown as ChargeResponse;

    expect(applyChargeResult(USER_ID, unknown).balanceCents).toBe(5_000);
    expect(getBalanceCents(USER_ID)).toBe(5_000);
  });

  it('approved sin monto numérico no suma', () => {
    writeWallet(USER_ID, { balanceCents: 5_000 });
    applyChargeResult(USER_ID, chargeResponse({ transaction_amount: null }));
    expect(getBalanceCents(USER_ID)).toBe(5_000);
  });

  it('guarda toda respuesta en el historial, la más reciente primero', () => {
    const first = rejectedResponse();
    const second = localError('timeout');
    const third = chargeResponse();

    applyChargeResult(USER_ID, first);
    applyChargeResult(USER_ID, second);
    const result = applyChargeResult(USER_ID, third);

    expect(result.history.map((c) => c.id)).toEqual([third.id, second.id, first.id]);
    expect(getChargeHistory(USER_ID)).toEqual(result.history);
  });

  it('no aplica dos veces la misma respuesta', () => {
    applyChargeResult(USER_ID, chargeResponse());
    const again = applyChargeResult(USER_ID, chargeResponse());

    expect(again.balanceCents).toBe(25_050);
    expect(readCharges(USER_ID)).toHaveLength(1);
  });

  it.each([
    ['saldo', storageKeys.wallet(USER_ID)],
    ['historial', storageKeys.charges(USER_ID)],
  ])('con el %s corrupto no escribe nada y lo marca', (_name, key) => {
    writeWallet(USER_ID, { balanceCents: 5_000 });
    window.localStorage.setItem(key, '{"balanceCents": "mucho"}');
    const before = { ...window.localStorage };

    const result = applyChargeResult(USER_ID, chargeResponse());

    expect(result).toMatchObject({ corrupt: true, persisted: false });
    expect({ ...window.localStorage }).toEqual(before);
  });

  it('avisa si no pudo guardar', () => {
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new DOMException('Cuota excedida', 'QuotaExceededError');
    });
    expect(applyChargeResult(USER_ID, rejectedResponse()).persisted).toBe(false);
  });
});
