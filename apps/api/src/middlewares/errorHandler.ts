import { SNAILPAY_BASE_PATH } from '@snailracer/shared';
import type { ErrorRequestHandler } from 'express';

import type { ResponseFactory } from '../services/snailpay/responseFactory.js';

/**
 * Manejador central de errores. Nunca expone el stack ni el mensaje interno.
 * Bajo SNAILPAY_BASE_PATH responde siempre con la forma del contrato (docs/snailpay-api.md §3);
 * en el resto, con { error }.
 */
export function createErrorHandler(responseFactory: ResponseFactory): ErrorRequestHandler {
  return (err: unknown, req, res, next) => {
    if (res.headersSent) {
      next(err);
      return;
    }

    const type = typeof err === 'object' && err !== null && 'type' in err ? err.type : undefined;
    const isSnailpay = req.originalUrl.startsWith(SNAILPAY_BASE_PATH);

    if (type === 'entity.parse.failed') {
      res
        .status(400)
        .json(
          isSnailpay
            ? responseFactory.build(undefined, 'invalid_request', [
                { field: 'body', message: 'Debe ser un JSON válido' },
              ])
            : { error: 'invalid_json' },
        );
      return;
    }
    if (type === 'entity.too.large') {
      res
        .status(413)
        .json(
          isSnailpay
            ? responseFactory.build(undefined, 'invalid_request', [
                { field: 'body', message: 'Debe pesar máximo 10 KB' },
              ])
            : { error: 'payload_too_large' },
        );
      return;
    }

    console.error(err);
    res
      .status(500)
      .json(
        isSnailpay
          ? responseFactory.build(req.body as unknown, 'internal_error')
          : { error: 'internal_error' },
      );
  };
}
