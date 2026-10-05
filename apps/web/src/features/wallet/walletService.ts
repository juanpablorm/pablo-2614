/**
 * Saldo e historial de recargas. Lógica pura: sin React.
 * Regla 1 (CONTEXT.md): solo status === "approved" modifica el saldo.
 */
import type { ChargeResponse } from '@snailracer/shared';

import { addCents, toCents } from '@/lib/money';
import { readCharges, readWallet, writeCharges, writeWallet } from '@/lib/storage';

export interface WalletState {
  balanceCents: number;
  /** Respuestas de SnailPay, la más reciente primero. */
  history: ChargeResponse[];
}

export interface ApplyChargeResult extends WalletState {
  /** false si no se pudo guardar en LocalStorage (bloqueado o sin cuota). */
  persisted: boolean;
}

/** Saldo del usuario en centavos. Sin wallet válido se muestra 0. */
export function getBalanceCents(userId: string): number {
  return readWallet(userId)?.balanceCents ?? 0;
}

/** Historial de recargas, el más reciente primero. Sin historial válido, vacío. */
export function getChargeHistory(userId: string): ChargeResponse[] {
  return readCharges(userId) ?? [];
}

/** Centavos que suma una respuesta: solo un "approved" con monto positivo; si no, 0. */
function creditedCents(response: ChargeResponse): number {
  if (response.status !== 'approved' || response.transaction_amount === null) return 0;
  const cents = toCents(response.transaction_amount);
  return cents !== null && cents > 0 ? cents : 0;
}

/**
 * Guarda la respuesta en el historial y, solo si fue aprobada, suma su monto al saldo.
 * Una respuesta con un id ya registrado no se aplica de nuevo.
 */
export function applyChargeResult(userId: string, response: ChargeResponse): ApplyChargeResult {
  const balanceCents = getBalanceCents(userId);
  const history = getChargeHistory(userId);

  if (history.some((charge) => charge.id === response.id)) {
    return { balanceCents, history, persisted: true };
  }

  const nextHistory = [response, ...history];
  let persisted = writeCharges(userId, nextHistory);

  const credit = creditedCents(response);
  if (credit === 0) return { balanceCents, history: nextHistory, persisted };

  const nextBalance = addCents(balanceCents, credit);
  persisted = writeWallet(userId, { balanceCents: nextBalance }) && persisted;
  return { balanceCents: nextBalance, history: nextHistory, persisted };
}
