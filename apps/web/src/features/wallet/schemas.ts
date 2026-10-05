import { z } from 'zod';

/** Mínimo de recarga en la UI (P3). El API acepta > 0. */
export const TOP_UP_MIN_AMOUNT = 50;
/** Montos sugeridos (chips) en pesos. */
export const AMOUNT_PRESETS = [100, 200, 500, 1000] as const;
export const CARDHOLDER_NAME_MAX = 80;

// Sin tope superior: montos > $10,000 llegan al API y caen en el escenario 7 (P3).
// La fecha no se compara contra hoy, igual que el API (docs/snailpay-api.md §4, escenario 4).
export const topUpSchema = z.object({
  cardNumber: z
    .string()
    .transform((value) => value.replace(/\s/g, ''))
    .pipe(
      z
        .string()
        .min(1, { error: 'Ingresa el número de tarjeta.', abort: true })
        .regex(/^\d{16}$/, 'Deben ser 16 dígitos.'),
    ),
  expirationDate: z
    .string()
    .trim()
    .min(1, { error: 'Ingresa el vencimiento.', abort: true })
    .regex(/^(0[1-9]|1[0-2])\/\d{2}$/, 'Usa el formato MM/AA.'),
  cvv: z
    .string()
    .trim()
    .min(1, { error: 'Ingresa el CVV.', abort: true })
    .regex(/^\d{3}$/, 'Deben ser 3 dígitos.'),
  cardholderName: z
    .string()
    .trim()
    .min(1, { error: 'Ingresa el nombre que aparece en la tarjeta.', abort: true })
    .max(CARDHOLDER_NAME_MAX, `Máximo ${CARDHOLDER_NAME_MAX} caracteres.`),
  amount: z
    .string()
    .transform((value) => value.replace(/[\s,$]/g, ''))
    .pipe(
      z
        .string()
        .min(1, { error: 'Ingresa un monto.', abort: true })
        .regex(/^\d+(\.\d{1,2})?$/, 'Usa un monto con máximo 2 decimales.'),
    )
    .transform(Number)
    .pipe(z.number().min(TOP_UP_MIN_AMOUNT, `El monto mínimo es $${TOP_UP_MIN_AMOUNT}.00.`)),
});

export type TopUpFormInput = z.input<typeof topUpSchema>;
export type TopUpFormValues = z.output<typeof topUpSchema>;
