/**
 * Variables de entorno del frontend (docs/snailpay-api.md §9), validadas con Zod.
 * Un valor inválido no rompe la app: se usa el valor por defecto.
 */
import { z } from 'zod';

export const DEFAULT_API_BASE_URL = '/api';
export const DEFAULT_SNAILPAY_TIMEOUT_MS = 8000;

const apiBaseUrlSchema = z.string().trim().min(1);
const timeoutMsSchema = z.coerce.number().int().positive();

function parseOr<T>(schema: z.ZodType<T>, value: unknown, fallback: T): T {
  const result = schema.safeParse(value);
  return result.success ? result.data : fallback;
}

export const env = {
  apiBaseUrl: parseOr(apiBaseUrlSchema, import.meta.env.VITE_API_BASE_URL, DEFAULT_API_BASE_URL),
  snailpayTimeoutMs: parseOr(
    timeoutMsSchema,
    import.meta.env.VITE_SNAILPAY_TIMEOUT_MS,
    DEFAULT_SNAILPAY_TIMEOUT_MS,
  ),
} as const;
