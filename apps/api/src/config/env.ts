import { z } from 'zod';

/**
 * Variables de entorno del API (ver docs/snailpay-api.md, sección 9).
 * Se validan al arrancar: si algo es inválido, el proceso no inicia.
 */

// z.coerce.boolean() convierte "false" en true; por eso se parsea el texto explícitamente.
const booleanFromString = z
  .enum(['true', 'false'], { error: 'Debe ser "true" o "false"' })
  .transform((value) => value === 'true');

const envSchema = z.object({
  PORT: z.coerce.number().int().min(1).max(65535).default(3001),
  CORS_ORIGIN: z.url().default('http://localhost:5173'),
  SNAILPAY_SIMULATE_OUTAGE: booleanFromString.default(false),
  SNAILPAY_SLOW_DELAY_MS: z.coerce.number().int().min(0).default(15000),
  SNAILPAY_MAX_AMOUNT: z.coerce.number().positive().default(10000),
});

export type Env = z.infer<typeof envSchema>;

export function loadEnv(source: NodeJS.ProcessEnv = process.env): Env {
  // Una variable definida pero vacía se trata como no definida.
  const cleaned = Object.fromEntries(
    Object.entries(source).filter(([, value]) => value !== undefined && value !== ''),
  );

  const result = envSchema.safeParse(cleaned);
  if (!result.success) {
    throw new Error(`Variables de entorno inválidas:\n${z.prettifyError(result.error)}`);
  }
  return result.data;
}
