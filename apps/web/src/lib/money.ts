const currencyFormatter = new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' });

/** Formatea centavos (enteros) como moneda: 125000 → "$1,250.00". */
export function formatCents(cents: number): string {
  return currencyFormatter.format(cents / 100);
}
