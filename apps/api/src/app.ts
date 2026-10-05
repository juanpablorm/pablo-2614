import cors from 'cors';
import express from 'express';
import helmet from 'helmet';

import type { Env } from './config/env.js';
import { errorHandler } from './middlewares/errorHandler.js';
import { notFound } from './middlewares/notFound.js';

/** Crea la app sin escuchar en un puerto, para poder probarla con Supertest. */
export function createApp(env: Env) {
  const app = express();

  app.use(helmet());
  app.use(cors({ origin: env.CORS_ORIGIN }));
  app.use(express.json({ limit: '10kb' }));

  // Las rutas de SnailPay se montan aquí en la Fase 3.

  app.use(notFound);
  app.use(errorHandler);

  return app;
}
