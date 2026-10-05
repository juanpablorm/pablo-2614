/** Máscaras de los campos de tarjeta y tarjeta enmascarada para la UI. Funciones puras. */

const digitsOnly = (value: string) => value.replace(/\D/g, '');

/** "1234123412341234" → "1234 1234 1234 1234" (máximo 16 dígitos). */
export function formatCardNumber(value: string): string {
  return (
    digitsOnly(value)
      .slice(0, 16)
      .match(/.{1,4}/g)
      ?.join(' ') ?? ''
  );
}

/** "1226" → "12/26"; la "/" aparece en cuanto hay más de 2 dígitos. */
export function formatExpiry(value: string): string {
  const digits = digitsOnly(value).slice(0, 4);
  return digits.length > 2 ? `${digits.slice(0, 2)}/${digits.slice(2)}` : digits;
}

/** Solo los últimos 4 dígitos: "1234123412341234" → "•••• 1234". Sin número → "—". */
export function maskCardNumber(cardNumber: string | null): string {
  const digits = digitsOnly(cardNumber ?? '');
  return digits.length >= 4 ? `•••• ${digits.slice(-4)}` : '—';
}
