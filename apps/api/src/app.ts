import { SNAILPAY_BASE_PATH } from '@snailracer/shared';
import cors from 'cors';
import express from 'express';
import helmet from 'helmet';

import type { Env } from './config/env.js';
import { createChargesController } from './controllers/charges.controller.js';
import { createErrorHandler } from './middlewares/errorHandler.js';
import { notFound } from './middlewares/notFound.js';
import { createSnailpayRouter } from './routes/snailpay.routes.js';
import {
  createChargeService,
  type ChargeOutcome,
  type ChargeService,
  type Sleep,
} from './services/snailpay/chargeService.js';
import { createIdempotencyStore } from './services/snailpay/idempotencyStore.js';
import { createResponseFactory } from './services/snailpay/responseFactory.js';

/** Dependencias inyectables para pruebas (reloj, retraso, un servicio que falla). */
export interface AppDeps {
  now?: () => Date;
  sleep?: Sleep;
  chargeService?: ChargeService;
}

/** Crea la app sin escuchar en un puerto, para poder probarla con Supertest. */
export function createApp(env: Env, deps: AppDeps = {}) {
  const now = deps.now ?? (() => new Date());
  const responseFactory = createResponseFactory({ now });
  const chargeService =
    deps.chargeService ?? createChargeService({ env, responseFactory, sleep: deps.sleep });
  const idempotencyStore = createIdempotencyStore<ChargeOutcome>({
    now: () => now().getTime(),
  });

  const app = express();

  app.use(helmet());
  app.use(cors({ origin: env.CORS_ORIGIN }));
  app.use(express.json({ limit: '10kb' }));

  app.use(
    SNAILPAY_BASE_PATH,
    createSnailpayRouter(
      createChargesController({ chargeService, idempotencyStore, responseFactory }),
    ),
  );

  app.use(notFound);
  app.use(createErrorHandler(responseFactory));

  return app;
}
