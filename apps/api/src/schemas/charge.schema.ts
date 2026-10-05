import type { ChargeFieldError } from '@snailracer/shared';
import { z } from 'zod';

/**
 * Validación del body de POST /charges (docs/snailpay-api.md §2).
 * El máximo de monto NO es error de formato: montos mayores caen en el escenario 7.
 */

export const CARDHOLDER_NAME_MAX = 80;

const requiredString = () =>
  z.string({ error: (issue) => (issue.input === undefined ? 'Es obligatorio' : 'Debe ser texto') });

/** Máximo 2 decimales, tolerando el error binario (0.29 * 100 = 28.999…). */
const hasAtMostTwoDecimals = (value: number) => {
  const scaled = value * 100;
  return Math.abs(scaled - Math.round(scaled)) < 1e-6;
};

export const chargeRequestSchema = z.object(
  {
    card_number: requiredString()
      .transform((value) => value.replace(/\s/g, ''))
      .pipe(z.string().regex(/^\d{16}$/, 'Debe tener 16 dígitos')),
    expiration_date: requiredString().regex(
      /^(0[1-9]|1[0-2])\/\d{2}$/,
      'Debe tener el formato MM/YY con mes de 01 a 12',
    ),
    cvv: requiredString().regex(/^\d{3}$/, 'Debe tener 3 dígitos'),
    cardholder_name: requiredString()
      .trim()
      .min(1, 'No puede estar vacío')
      .max(CARDHOLDER_NAME_MAX, `Debe tener máximo ${CARDHOLDER_NAME_MAX} caracteres`),
    amount: z
      .number({
        error: (issue) => (issue.input === undefined ? 'Es obligatorio' : 'Debe ser un número'),
      })
      .gt(0, 'Debe ser mayor que 0')
      .refine(hasAtMostTwoDecimals, 'Debe tener máximo 2 decimales'),
    payer_id: requiredString().pipe(z.uuid('Debe ser un UUID')),
    payer_email: requiredString().pipe(z.email('Debe ser un correo válido')),
  },
  { error: 'Debe ser un objeto JSON' },
);

export type ValidChargeRequest = z.output<typeof chargeRequestSchema>;

/** Un error por campo (el primero), en el orden en que aparecen. Sin campo → "body". */
export function toFieldErrors(issues: readonly z.core.$ZodIssue[]): ChargeFieldError[] {
  const byField = new Map<string, string>();
  for (const issue of issues) {
    const field = issue.path.length > 0 ? String(issue.path[0]) : 'body';
    if (!byField.has(field)) byField.set(field, issue.message);
  }
  return [...byField].map(([field, message]) => ({ field, message }));
}
