import type { ChargeResponse } from '@snailracer/shared';
import { useCallback, useState } from 'react';

import {
  applyChargeResult,
  getBalanceCents,
  getChargeHistory,
  type ApplyChargeResult,
  type WalletState,
} from './walletService';

/** Saldo e historial en estado de React: se actualizan en pantalla al aplicar un cobro. */
export function useWallet(userId: string) {
  const [wallet, setWallet] = useState<WalletState>(() => ({
    balanceCents: getBalanceCents(userId),
    history: getChargeHistory(userId),
  }));

  const apply = useCallback(
    (response: ChargeResponse): ApplyChargeResult => {
      const result = applyChargeResult(userId, response);
      setWallet({ balanceCents: result.balanceCents, history: result.history });
      return result;
    },
    [userId],
  );

  return { ...wallet, apply };
}
