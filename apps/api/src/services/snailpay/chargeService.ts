import { setTimeout as delay } from 'node:timers/promises';

import type { ChargeFieldError, ChargeResponse } from '@snailracer/shared';

import type { Env } from '../../config/env.js';
import { chargeRequestSchema, toFieldErrors } from '../../schemas/charge.schema.js';
import type { ResponseFactory } from './responseFactory.js';
import { SPECIAL_CARDS, SUCCESS_CARD, type ServerStatusDetail } from './scenarios.js';

/**
 * Decide el resultado de un cobro aplicando las reglas en el orden de docs/snailpay-api.md §5.
 * Se detiene en la primera que aplica; lo que no coincide con un escenario se rechaza.
 * Nunca aprueba fuera de la combinación exacta de SUCCESS_CARD.
 */

export type Sleep = (ms: number) => Promise<void>;

export interface ChargeOutcome {
  detail: ServerStatusDetail;
  response: ChargeResponse;
}

export interface ChargeService {
  processCharge: (body: unknown) => Promise<ChargeOutcome>;
}

interface ChargeServiceDeps {
  env: Pick<Env, 'SNAILPAY_SIMULATE_OUTAGE' | 'SNAILPAY_SLOW_DELAY_MS' | 'SNAILPAY_MAX_AMOUNT'>;
  responseFactory: ResponseFactory;
  sleep?: Sleep;
}

const defaultSleep: Sleep = async (ms) => {
  await delay(ms);
};

export function createChargeService({
  env,
  responseFactory,
  sleep = defaultSleep,
}: ChargeServiceDeps): ChargeService {
  async function processCharge(body: unknown): Promise<ChargeOutcome> {
    const reply = (detail: ServerStatusDetail, errors?: ChargeFieldError[]): ChargeOutcome => ({
      detail,
      response: responseFactory.build(body, detail, errors),
    });

    // 1. Interruptor global de caída.
    if (env.SNAILPAY_SIMULATE_OUTAGE) return reply('service_unavailable');

    // 2. Esquema del body.
    const parsed = chargeRequestSchema.safeParse(body);
    if (!parsed.success) return reply('invalid_request', toFieldErrors(parsed.error.issues));
    const request = parsed.data;

    // 3. Tarjetas de escenario especial.
    const special = SPECIAL_CARDS.get(request.card_number);
    if (special) {
      if (special.slow) await sleep(env.SNAILPAY_SLOW_DELAY_MS);
      return reply(special.detail);
    }

    // 4. Tarjeta de éxito: fecha → CVV → monto → aprobado.
    if (request.card_number === SUCCESS_CARD.cardNumber) {
      if (request.expiration_date !== SUCCESS_CARD.expirationDate) {
        return reply('invalid_expiration_date');
      }
      if (request.cvv !== SUCCESS_CARD.cvv) return reply('invalid_security_code');
      if (request.amount > env.SNAILPAY_MAX_AMOUNT) return reply('amount_exceeds_limit');
      return reply('accredited');
    }

    // 5. Cualquier otra tarjeta.
    return reply('card_declined');
  }

  return { processCharge };
}
