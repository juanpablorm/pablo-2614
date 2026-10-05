import type { ChargeResponse } from '@snailracer/shared';
import { useCallback, useRef, useState } from 'react';

import type { PublicUser } from '@/features/auth/authService';

import type { TopUpFormValues } from './schemas';
import { snailpayClient as defaultClient, type SnailpayClient } from './snailpayClient';
import type { ApplyChargeResult } from './walletService';

export type TopUpStatus = 'idle' | 'submitting' | 'approved' | 'rejected' | 'error';

export interface TopUpState {
  status: TopUpStatus;
  /** Última respuesta (del servidor o local). null si no hubo ninguna. */
  response: ChargeResponse | null;
  /** Resultado de aplicarla al wallet (nuevo saldo, si se guardó). */
  applied: ApplyChargeResult | null;
}

interface UseTopUpOptions {
  /** Usuario en sesión: de aquí salen payer_id y payer_email, nunca del formulario. */
  user: PublicUser;
  /** Aplica la respuesta al saldo y al historial. */
  onResult: (response: ChargeResponse) => ApplyChargeResult;
  client?: SnailpayClient;
}

const IDLE: TopUpState = { status: 'idle', response: null, applied: null };

/** Solo "approved" es éxito; cualquier status desconocido se trata como error. */
function toTopUpStatus(response: ChargeResponse): TopUpStatus {
  if (response.status === 'approved') return 'approved';
  if (response.status === 'rejected') return 'rejected';
  return 'error';
}

export function useTopUp({ user, onResult, client = defaultClient }: UseTopUpOptions) {
  const [state, setState] = useState<TopUpState>(IDLE);
  // Un ref (no solo el estado) bloquea el doble envío antes de que React vuelva a renderizar.
  const inFlight = useRef(false);
  const lastValues = useRef<TopUpFormValues | null>(null);

  const submit = useCallback(
    async (values: TopUpFormValues) => {
      if (inFlight.current) return;
      inFlight.current = true;
      lastValues.current = values;
      setState({ status: 'submitting', response: null, applied: null });

      try {
        const response = await client.charge({
          card_number: values.cardNumber,
          expiration_date: values.expirationDate,
          cvv: values.cvv,
          cardholder_name: values.cardholderName,
          amount: values.amount,
          payer_id: user.id,
          payer_email: user.email,
        });
        const applied = onResult(response);
        setState({ status: toTopUpStatus(response), response, applied });
      } catch {
        // charge no lanza por contrato; esto solo cubre un error de programación.
        setState({ status: 'error', response: null, applied: null });
      } finally {
        inFlight.current = false;
      }
    },
    [client, onResult, user.id, user.email],
  );

  /** Repite el último envío como un intento nuevo (nueva Idempotency-Key). */
  const retry = useCallback(async () => {
    if (lastValues.current) await submit(lastValues.current);
  }, [submit]);

  const reset = useCallback(() => {
    if (!inFlight.current) setState(IDLE);
  }, []);

  return { ...state, submit, retry, reset };
}
