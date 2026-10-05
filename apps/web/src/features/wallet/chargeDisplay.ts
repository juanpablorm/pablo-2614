/** Cómo se muestra una respuesta de SnailPay en la UI (historial y resumen del modal). */
import type { ChargeResponse } from '@snailracer/shared';

import { formatCents, toCents } from '@/lib/money';

const dateFormatter = new Intl.DateTimeFormat('es-MX', {
  day: 'numeric',
  month: 'short',
  year: 'numeric',
});
const timeFormatter = new Intl.DateTimeFormat('es-MX', { hour: '2-digit', minute: '2-digit' });

/** "2026-10-04T19:20:31.512Z" → "4 oct 2026, 13:20" (hora local). Fecha inválida → "—". */
export function formatChargeDate(isoDate: string): string {
  const date = new Date(isoDate);
  if (Number.isNaN(date.getTime())) return '—';
  return `${dateFormatter.format(date)}, ${timeFormatter.format(date)}`;
}

/** Monto de la respuesta como moneda; "—" si no hay monto numérico. */
export function formatChargeAmount(amount: number | null): string {
  const cents = amount === null ? null : toCents(amount);
  return cents === null ? '—' : formatCents(cents);
}

export type ChargeBadge = 'approved' | 'rejected' | 'pending' | 'error';

/** Estado visible: timeout queda "Sin confirmar"; un status desconocido se muestra como error. */
export function getChargeBadge(response: ChargeResponse): { kind: ChargeBadge; label: string } {
  if (response.status === 'approved') return { kind: 'approved', label: 'Aprobada' };
  if (response.status === 'rejected') return { kind: 'rejected', label: 'Rechazada' };
  if (response.status_detail === 'timeout') return { kind: 'pending', label: 'Sin confirmar' };
  return { kind: 'error', label: 'Error' };
}
