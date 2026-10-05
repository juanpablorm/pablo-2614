/**
 * Validación en tiempo de ejecución del contrato SnailPay (docs/snailpay-api.md §3).
 * La usan el frontend (respuestas del API y LocalStorage) y las pruebas del API,
 * así ambos lados verifican exactamente la misma forma.
 */
import { z } from 'zod';

import type { ChargeResponse, ChargeStatusDetail } from './snailpay.js';

export const CHARGE_STATUS_DETAILS = [
  'accredited',
  'invalid_request',
  'invalid_security_code',
  'invalid_expiration_date',
  'insufficient_funds',
  'card_declined',
  'amount_exceeds_limit',
  'service_unavailable',
  'internal_error',
  'timeout',
  'network_error',
] as const satisfies readonly ChargeStatusDetail[];

export const chargeResponseSchema = z.object({
  id: z.string(),
  status: z.enum(['approved', 'rejected', 'error']),
  status_detail: z.enum(CHARGE_STATUS_DETAILS),
  transaction_amount: z.number().nullable(),
  date_created: z.string(),
  authorization_code: z.string().nullable(),
  reference: z.string(),
  payer_id: z.string().nullable(),
  payer_email: z.string().nullable(),
  card_number: z.string().nullable(),
  cvv: z.string().nullable(),
  errors: z.array(z.object({ field: z.string(), message: z.string() })).optional(),
}) satisfies z.ZodType<ChargeResponse>;
