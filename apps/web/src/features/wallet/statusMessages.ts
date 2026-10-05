/**
 * status_detail → texto para el usuario (docs/snailpay-api.md §8).
 * El backend devuelve códigos estables; aquí se traducen. Un código desconocido usa el fallback.
 */
import type { ChargeResponse, ChargeStatusDetail } from '@snailracer/shared';

import { formatCents, toCents } from '@/lib/money';

export interface ChargeMessage {
  title: string;
  message: string;
}

export const FALLBACK_TITLE = 'No se pudo completar la recarga';
export const FALLBACK_MESSAGE = 'No pudimos completar la recarga. No se aplicó ningún cargo.';

/** Campos del request con el nombre que ve el usuario en el formulario. */
const FIELD_LABELS = new Map<string, string>([
  ['card_number', 'número de tarjeta'],
  ['expiration_date', 'vencimiento'],
  ['cvv', 'CVV'],
  ['cardholder_name', 'nombre en la tarjeta'],
  ['amount', 'monto'],
  ['payer_id', 'datos de tu cuenta'],
  ['payer_email', 'datos de tu cuenta'],
  // Errores de la solicitud completa, no de un campo del formulario.
  ['body', 'la solicitud'],
  ['Idempotency-Key', 'la solicitud'],
]);

function formatAmount(amount: number | null): string {
  const cents = amount === null ? null : toCents(amount);
  return cents === null ? 'el monto' : formatCents(cents);
}

function formatFields(response: ChargeResponse): string {
  const labels = (response.errors ?? []).map(({ field }) => FIELD_LABELS.get(field) ?? field);
  const unique = [...new Set(labels)];
  return unique.length > 0 ? unique.join(', ') : 'todos los campos';
}

type MessageBuilder = (response: ChargeResponse) => ChargeMessage;

// En "accredited", título + mensaje forman el texto completo de la tabla 8.
// `satisfies` obliga a cubrir cada status_detail del contrato.
const MESSAGE_TABLE = {
  accredited: (r) => ({
    title: '¡Recarga aprobada!',
    message: `Se agregaron ${formatAmount(r.transaction_amount)} a tu saldo. Código de autorización: ${r.authorization_code ?? '—'}.`,
  }),
  invalid_request: (r) => ({
    title: 'Revisa los datos',
    message: `Revisa los datos de la tarjeta: ${formatFields(r)}.`,
  }),
  invalid_security_code: () => ({
    title: 'Tarjeta rechazada',
    message: 'El CVV no es correcto. Verifícalo e inténtalo de nuevo.',
  }),
  invalid_expiration_date: () => ({
    title: 'Tarjeta rechazada',
    message: 'La fecha de vencimiento no es correcta.',
  }),
  insufficient_funds: () => ({
    title: 'Tarjeta rechazada',
    message: 'La tarjeta no tiene fondos suficientes. Prueba con otra tarjeta.',
  }),
  card_declined: () => ({
    title: 'Tarjeta rechazada',
    message: 'El banco rechazó la tarjeta. Prueba con otra tarjeta.',
  }),
  amount_exceeds_limit: () => ({
    title: 'Monto no permitido',
    message: 'El monto máximo por recarga es de $10,000.00.',
  }),
  service_unavailable: () => ({
    title: 'Servicio no disponible',
    message:
      'El servicio de pagos no está disponible en este momento. No se aplicó ningún cargo. Intenta más tarde.',
  }),
  internal_error: () => ({
    title: FALLBACK_TITLE,
    message: 'Ocurrió un error inesperado. No se aplicó ningún cargo.',
  }),
  timeout: () => ({
    title: 'Esto tardó demasiado',
    message: 'La operación tardó demasiado. No se aplicó ningún cargo; puedes intentarlo de nuevo.',
  }),
  network_error: () => ({
    title: FALLBACK_TITLE,
    message: 'No pudimos conectar con el servicio de pagos. No se aplicó ningún cargo.',
  }),
} satisfies Record<ChargeStatusDetail, MessageBuilder>;

// Map: un status_detail desconocido (p. ej. "toString") nunca resuelve a algo del prototipo.
const MESSAGES = new Map<string, MessageBuilder>(Object.entries(MESSAGE_TABLE));

export function getChargeMessage(response: ChargeResponse): ChargeMessage {
  const build = MESSAGES.get(response.status_detail);
  return build ? build(response) : { title: FALLBACK_TITLE, message: FALLBACK_MESSAGE };
}
