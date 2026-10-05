import { readWallet } from '@/lib/storage';

/** Saldo del usuario en centavos. Sin wallet válido se muestra 0. */
export function getBalanceCents(userId: string): number {
  return readWallet(userId)?.balanceCents ?? 0;
}
