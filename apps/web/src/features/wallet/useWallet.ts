import type { ChargeResponse } from '@snailracer/shared';
import { useCallback, useState } from 'react';

import {
  applyChargeResult,
  getBalanceCents,
  getChargeHistory,
  type ApplyChargeResult,
  type WalletState,
} from './walletService';

/**
 * Saldo e historial en estado de React: se actualizan en pantalla al aplicar un cobro.
 * `onCorrupt` se llama si los datos guardados resultan ilegibles (p. ej. para revalidar la sesión).
 */
export function useWallet(userId: string, onCorrupt?: () => void) {
  const [wallet, setWallet] = useState<WalletState>(() => ({
    balanceCents: getBalanceCents(userId),
    history: getChargeHistory(userId),
  }));

  const apply = useCallback(
    (response: ChargeResponse): ApplyChargeResult => {
      const result = applyChargeResult(userId, response);
      if (result.corrupt) {
        // Se conserva lo que ya se mostraba: el resultado no trae un saldo válido.
        onCorrupt?.();
      } else {
        setWallet({ balanceCents: result.balanceCents, history: result.history });
      }
      return result;
    },
    [userId, onCorrupt],
  );

  return { ...wallet, apply };
}
