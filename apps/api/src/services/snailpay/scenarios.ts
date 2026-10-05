import type { ChargeStatusDetail } from '@snailracer/shared';

/**
 * Tarjetas de prueba (docs/snailpay-api.md §4). Agregar un escenario = una línea.
 * Ninguna tarjeta especial aprueba: el único éxito es SUCCESS_CARD con sus datos exactos.
 */

/** Detalles que puede devolver el servidor (timeout y network_error solo los genera el cliente). */
export type ServerStatusDetail = Exclude<ChargeStatusDetail, 'timeout' | 'network_error'>;

export const SUCCESS_CARD = {
  cardNumber: '1234123412341234',
  expirationDate: '12/26',
  cvv: '543',
} as const;

interface SpecialScenario {
  detail: Exclude<ServerStatusDetail, 'accredited'>;
  /** Espera SNAILPAY_SLOW_DELAY_MS antes de responder (escenario 9). */
  slow?: boolean;
}

export const SPECIAL_CARDS: ReadonlyMap<string, SpecialScenario> = new Map([
  ['9999999999999999', { detail: 'service_unavailable' }],
  // Escenario 9 (P2): tras el retraso responde 503, nunca approved. El cliente ya abortó a los 8 s.
  ['8888888888888888', { detail: 'service_unavailable', slow: true }],
  ['4000000000000002', { detail: 'insufficient_funds' }],
  ['4000000000000069', { detail: 'card_declined' }],
]);
