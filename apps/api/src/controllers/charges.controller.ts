import type { RequestHandler } from 'express';

import type { ChargeOutcome, ChargeService } from '../services/snailpay/chargeService.js';
import type { IdempotencyStore } from '../services/snailpay/idempotencyStore.js';
import type { ResponseFactory } from '../services/snailpay/responseFactory.js';
import type { ServerStatusDetail } from '../services/snailpay/scenarios.js';

/** Traduce el resultado a código HTTP. No conoce los escenarios (docs/architecture.md §3). */
export function httpStatusFor(detail: ServerStatusDetail): number {
  switch (detail) {
    case 'accredited':
      return 201;
    case 'invalid_request':
      return 400;
    case 'service_unavailable':
      return 503;
    case 'internal_error':
      return 500;
    default:
      return 402;
  }
}

export const IDEMPOTENCY_KEY_MAX_LENGTH = 255;

interface ChargesControllerDeps {
  chargeService: ChargeService;
  idempotencyStore: IdempotencyStore<ChargeOutcome>;
  responseFactory: ResponseFactory;
}

export function createChargesController({
  chargeService,
  idempotencyStore,
  responseFactory,
}: ChargesControllerDeps): RequestHandler {
  return async (req, res) => {
    const body: unknown = req.body;
    const key = req.get('Idempotency-Key');

    if (key !== undefined && (key.trim() === '' || key.length > IDEMPOTENCY_KEY_MAX_LENGTH)) {
      res.status(400).json(
        responseFactory.build(body, 'invalid_request', [
          {
            field: 'Idempotency-Key',
            message: `Debe tener entre 1 y ${IDEMPOTENCY_KEY_MAX_LENGTH} caracteres`,
          },
        ]),
      );
      return;
    }

    let outcome: ChargeOutcome;
    if (key === undefined) {
      outcome = await chargeService.processCharge(body);
    } else {
      // Los errores (503/500) no se guardan: un reintento con la misma key puede salir bien.
      const result = await idempotencyStore.execute(
        key,
        body,
        () => chargeService.processCharge(body),
        (value) => value.response.status !== 'error',
      );
      if (result.conflict) {
        res
          .status(422)
          .json(
            responseFactory.build(body, 'invalid_request', [
              { field: 'Idempotency-Key', message: 'Ya se usó con una solicitud distinta' },
            ]),
          );
        return;
      }
      outcome = result.value;
    }

    res.status(httpStatusFor(outcome.detail)).json(outcome.response);
  };
}
