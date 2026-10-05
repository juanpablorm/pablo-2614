/**
 * Dinero en centavos enteros (CONTEXT.md, regla 4). Los montos con decimales
 * solo existen en la frontera con el API; dentro de la app todo es entero.
 */

const currencyFormatter = new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' });

/** Formatea centavos (enteros) como moneda: 125000 → "$1,250.00". */
export function formatCents(cents: number): string {
  return currencyFormatter.format(cents / 100);
}

/**
 * Convierte un monto en pesos (máximo 2 decimales) a centavos: 250.5 → 25050.
 * Redondea para absorber el error binario (0.29 * 100 = 28.999…). Devuelve null si
 * el monto no es finito, es negativo o el resultado no es un entero seguro.
 */
export function toCents(amount: number): number | null {
  if (!Number.isFinite(amount) || amount < 0) return null;
  const cents = Math.round(amount * 100);
  return Number.isSafeInteger(cents) ? cents : null;
}

/** Suma de centavos. Lanza si algún operando no es un entero seguro (error de programación). */
export function addCents(a: number, b: number): number {
  const sum = a + b;
  if (!Number.isSafeInteger(a) || !Number.isSafeInteger(b) || !Number.isSafeInteger(sum)) {
    throw new RangeError('Los montos en centavos deben ser enteros seguros.');
  }
  return sum;
}
