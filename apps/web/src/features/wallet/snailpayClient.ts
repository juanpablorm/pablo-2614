/**
 * Cliente de SnailPay (docs/snailpay-api.md). `charge` siempre devuelve una ChargeResponse
 * y nunca lanza: si el servidor no responde o responde algo inesperado, se construye una
 * respuesta local con status "error", que nunca suma saldo.
 */
import {
  chargeResponseSchema,
  SNAILPAY_BASE_PATH,
  type ChargeRequest,
  type ChargeResponse,
  type ChargeStatusDetail,
} from '@snailracer/shared';

import { env } from '@/lib/env';
import { postJson } from '@/lib/http';

/** Detalles que puede generar el cliente sin respuesta válida del servidor. */
type LocalErrorDetail = Extract<ChargeStatusDetail, 'timeout' | 'network_error' | 'internal_error'>;

export interface SnailpayClientOptions {
  /** Tiempo máximo de espera (VITE_SNAILPAY_TIMEOUT_MS, 8000 por defecto). */
  timeoutMs?: number;
  /** Base del API (VITE_API_BASE_URL, "/api" por defecto). */
  apiBaseUrl?: string;
  now?: () => Date;
  randomUUID?: () => string;
}

export type SnailpayClient = ReturnType<typeof createSnailpayClient>;

/** "2026-10-04T19:24:00.000Z" → "20261004" (fecha UTC, como el servidor). */
const toReferenceDate = (date: Date) => date.toISOString().slice(0, 10).replaceAll('-', '');

/** Un "approved" que no cumple el contrato se trata como respuesta malformada. */
function isConsistent(httpStatus: number, response: ChargeResponse): boolean {
  if (response.status !== 'approved') return true;
  return (
    httpStatus === 201 &&
    response.status_detail === 'accredited' &&
    response.authorization_code !== null &&
    response.transaction_amount !== null &&
    response.transaction_amount > 0
  );
}

export function createSnailpayClient({
  timeoutMs = env.snailpayTimeoutMs,
  apiBaseUrl = env.apiBaseUrl,
  now = () => new Date(),
  randomUUID = () => crypto.randomUUID(),
}: SnailpayClientOptions = {}) {
  // SNAILPAY_BASE_PATH ya incluye "/api"; se reemplaza por la base configurada.
  const chargesUrl = `${apiBaseUrl.replace(/\/$/, '')}${SNAILPAY_BASE_PATH.replace(/^\/api/, '')}/charges`;

  /** Respuesta local (docs/snailpay-api.md §7.5): nunca aprobada, sin código de autorización. */
  function buildLocalResponse(request: ChargeRequest, detail: LocalErrorDetail): ChargeResponse {
    const createdAt = now();
    return {
      id: `local_${randomUUID()}`,
      status: 'error',
      status_detail: detail,
      transaction_amount: request.amount,
      date_created: createdAt.toISOString(),
      authorization_code: null,
      reference: `SNL-${toReferenceDate(createdAt)}-LOCAL0`,
      payer_id: request.payer_id,
      payer_email: request.payer_email,
      card_number: request.card_number,
      cvv: request.cvv,
    };
  }

  async function charge(request: ChargeRequest): Promise<ChargeResponse> {
    const result = await postJson(chargesUrl, request, {
      timeoutMs,
      // Una key nueva por intento: el servidor puede reconocer reenvíos del mismo intento.
      headers: { 'Idempotency-Key': randomUUID() },
    });

    if (result.kind === 'timeout') return buildLocalResponse(request, 'timeout');
    if (result.kind === 'network_error') return buildLocalResponse(request, 'network_error');

    const parsed = chargeResponseSchema.safeParse(result.body);
    if (!parsed.success || !isConsistent(result.status, parsed.data)) {
      return buildLocalResponse(request, 'internal_error');
    }
    return parsed.data;
  }

  return { charge };
}

export const snailpayClient = createSnailpayClient();
