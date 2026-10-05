import type { ErrorRequestHandler } from 'express';

/**
 * Manejador central de errores. Nunca expone el stack ni el mensaje interno.
 * En la Fase 3 las rutas de SnailPay responderán con la forma del contrato (internal_error).
 */
export const errorHandler: ErrorRequestHandler = (err: unknown, _req, res, _next) => {
  const type = typeof err === 'object' && err !== null && 'type' in err ? err.type : undefined;

  if (type === 'entity.parse.failed') {
    res.status(400).json({ error: 'invalid_json' });
    return;
  }
  if (type === 'entity.too.large') {
    res.status(413).json({ error: 'payload_too_large' });
    return;
  }

  console.error(err);
  res.status(500).json({ error: 'internal_error' });
};
