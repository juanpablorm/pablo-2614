import { Router, type RequestHandler } from 'express';

/** Rutas de SnailPay, montadas en SNAILPAY_BASE_PATH (/api/snailpay/v1). */
export function createSnailpayRouter(createCharge: RequestHandler) {
  const router = Router();
  router.post('/charges', createCharge);
  return router;
}
