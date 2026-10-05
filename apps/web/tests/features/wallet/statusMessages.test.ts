import type { ChargeResponse } from '@snailracer/shared';
import { describe, expect, it } from 'vitest';

import {
  FALLBACK_MESSAGE,
  FALLBACK_TITLE,
  getChargeMessage,
} from '@/features/wallet/statusMessages';

import { chargeResponse, rejectedResponse } from './fixtures';

const withDetail = (status_detail: string) =>
  rejectedResponse({ status_detail: status_detail as ChargeResponse['status_detail'] });

describe('getChargeMessage', () => {
  it('accredited: título + mensaje forman el texto de la tabla 8', () => {
    const { title, message } = getChargeMessage(chargeResponse());
    expect(`${title} ${message}`).toBe(
      '¡Recarga aprobada! Se agregaron $250.50 a tu saldo. Código de autorización: A7K2Q9.',
    );
  });

  it('invalid_request lista los campos con su nombre en el formulario', () => {
    const response = rejectedResponse({
      status_detail: 'invalid_request',
      errors: [
        { field: 'amount', message: 'Debe ser mayor que 0' },
        { field: 'cvv', message: 'Debe tener 3 dígitos' },
      ],
    });
    expect(getChargeMessage(response).message).toBe('Revisa los datos de la tarjeta: monto, CVV.');
  });

  it.each([
    ['invalid_security_code', 'El CVV no es correcto. Verifícalo e inténtalo de nuevo.'],
    ['invalid_expiration_date', 'La fecha de vencimiento no es correcta.'],
    ['insufficient_funds', 'La tarjeta no tiene fondos suficientes. Prueba con otra tarjeta.'],
    ['card_declined', 'El banco rechazó la tarjeta. Prueba con otra tarjeta.'],
    ['amount_exceeds_limit', 'El monto máximo por recarga es de $10,000.00.'],
    [
      'service_unavailable',
      'El servicio de pagos no está disponible en este momento. No se aplicó ningún cargo. Intenta más tarde.',
    ],
    ['internal_error', 'Ocurrió un error inesperado. No se aplicó ningún cargo.'],
    [
      'timeout',
      'La operación tardó demasiado. No se aplicó ningún cargo; puedes intentarlo de nuevo.',
    ],
    ['network_error', 'No pudimos conectar con el servicio de pagos. No se aplicó ningún cargo.'],
  ])('%s → mensaje de la tabla 8', (detail, expected) => {
    expect(getChargeMessage(withDetail(detail)).message).toBe(expected);
  });

  it('títulos propios para timeout, 503 y 500 (P8)', () => {
    expect(getChargeMessage(withDetail('timeout')).title).toBe('Esto tardó demasiado');
    expect(getChargeMessage(withDetail('service_unavailable')).title).toBe(
      'Servicio no disponible',
    );
    expect(getChargeMessage(withDetail('internal_error')).title).toBe(FALLBACK_TITLE);
  });

  it.each(['algo_nuevo', 'toString', '__proto__'])('detalle desconocido (%s) → fallback', (d) => {
    expect(getChargeMessage(withDetail(d))).toEqual({
      title: FALLBACK_TITLE,
      message: FALLBACK_MESSAGE,
    });
  });
});
