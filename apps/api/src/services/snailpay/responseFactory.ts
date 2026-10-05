import { randomInt, randomUUID } from 'node:crypto';

import type { ChargeFieldError, ChargeResponse, ChargeStatus } from '@snailracer/shared';

import type { ServerStatusDetail } from './scenarios.js';

/**
 * Construye la respuesta uniforme de SnailPay: siempre los 11 campos (docs/snailpay-api.md §3).
 * El eco sale del body crudo, porque también se responde a bodies inválidos.
 */

const CODE_ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';

export interface ResponseFactoryDeps {
  now: () => Date;
  randomUUID: () => string;
  /** Entero aleatorio en [0, max). */
  randomInt: (max: number) => number;
}

const defaultDeps: ResponseFactoryDeps = { now: () => new Date(), randomUUID, randomInt };

export type ResponseFactory = ReturnType<typeof createResponseFactory>;

export function statusForDetail(detail: ServerStatusDetail): ChargeStatus {
  if (detail === 'accredited') return 'approved';
  if (detail === 'service_unavailable' || detail === 'internal_error') return 'error';
  return 'rejected';
}

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

function echoString(body: unknown, key: string): string | null {
  const value = isRecord(body) ? body[key] : undefined;
  return typeof value === 'string' ? value : null;
}

function echoAmount(body: unknown): number | null {
  const value = isRecord(body) ? body.amount : undefined;
  if (typeof value !== 'number' || !Number.isFinite(value)) return null;
  return Math.round(value * 100) / 100;
}

export function createResponseFactory(overrides: Partial<ResponseFactoryDeps> = {}) {
  const deps = { ...defaultDeps, ...overrides };

  const randomCode = (length: number) =>
    Array.from({ length }, () => CODE_ALPHABET[deps.randomInt(CODE_ALPHABET.length)]).join('');

  function build(
    body: unknown,
    detail: ServerStatusDetail,
    errors?: ChargeFieldError[],
  ): ChargeResponse {
    const createdAt = deps.now();
    const status = statusForDetail(detail);
    const date = createdAt.toISOString().slice(0, 10).replaceAll('-', '');

    return {
      id: `spay_${deps.randomUUID()}`,
      status,
      status_detail: detail,
      transaction_amount: echoAmount(body),
      date_created: createdAt.toISOString(),
      authorization_code: status === 'approved' ? randomCode(6) : null,
      reference: `SNL-${date}-${randomCode(6)}`,
      payer_id: echoString(body, 'payer_id'),
      payer_email: echoString(body, 'payer_email'),
      card_number: echoString(body, 'card_number')?.replace(/\s/g, '') ?? null,
      cvv: echoString(body, 'cvv'),
      ...(detail === 'invalid_request' && errors ? { errors } : {}),
    };
  }

  return { build };
}
