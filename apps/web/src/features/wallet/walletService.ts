/**
 * Saldo e historial de recargas. Lógica pura: sin React.
 * Regla 1 (CONTEXT.md): solo status === "approved" modifica el saldo.
 */
import type { ChargeResponse } from '@snailracer/shared';

import { addCents, toCents } from '@/lib/money';
import { loadCharges, loadWallet, writeCharges, writeWallet } from '@/lib/storage';

export interface WalletState {
  balanceCents: number;
  /** Respuestas de SnailPay, la más reciente primero. */
  history: ChargeResponse[];
}

export interface ApplyChargeResult extends WalletState {
  /** false si no se pudo guardar en LocalStorage (bloqueado, sin cuota o datos ilegibles). */
  persisted: boolean;
  /**
   * true si el saldo o el historial guardados no se pudieron leer: no se escribió nada y
   * balanceCents / history no son válidos. Hay que revalidar la sesión (architecture.md §7).
   */
  corrupt: boolean;
}

/** Saldo del usuario en centavos. Sin wallet válido se muestra 0. */
export function getBalanceCents(userId: string): number {
  const wallet = loadWallet(userId);
  return wallet.status === 'ok' ? wallet.value.balanceCents : 0;
}

/** Historial de recargas, el más reciente primero. Sin historial válido, vacío. */
export function getChargeHistory(userId: string): ChargeResponse[] {
  const charges = loadCharges(userId);
  return charges.status === 'ok' ? charges.value : [];
}

/** Centavos que suma una respuesta: solo un "approved" con monto positivo; si no, 0. */
function creditedCents(response: ChargeResponse): number {
  if (response.status !== 'approved' || response.transaction_amount === null) return 0;
  const cents = toCents(response.transaction_amount);
  return cents !== null && cents > 0 ? cents : 0;
}

/**
 * Guarda la respuesta en el historial y, solo si fue aprobada, suma su monto al saldo.
 * Una respuesta con un id ya registrado no se aplica de nuevo. Si el saldo o el historial
 * guardados están ilegibles, no se toca nada: sobrescribirlos perdería esos datos.
 */
export function applyChargeResult(userId: string, response: ChargeResponse): ApplyChargeResult {
  const wallet = loadWallet(userId);
  const charges = loadCharges(userId);
  if (wallet.status === 'corrupt' || charges.status === 'corrupt') {
    return { balanceCents: 0, history: [], persisted: false, corrupt: true };
  }

  const balanceCents = wallet.status === 'ok' ? wallet.value.balanceCents : 0;
  const history = charges.status === 'ok' ? charges.value : [];

  if (history.some((charge) => charge.id === response.id)) {
    return { balanceCents, history, persisted: true, corrupt: false };
  }

  const nextHistory = [response, ...history];
  let persisted = writeCharges(userId, nextHistory);

  const credit = creditedCents(response);
  if (credit === 0) return { balanceCents, history: nextHistory, persisted, corrupt: false };

  const nextBalance = addCents(balanceCents, credit);
  persisted = writeWallet(userId, { balanceCents: nextBalance }) && persisted;
  return { balanceCents: nextBalance, history: nextHistory, persisted, corrupt: false };
}
