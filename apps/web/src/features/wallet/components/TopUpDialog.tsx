import type { ChargeResponse } from '@snailracer/shared';
import { useEffect, useRef, useState, type RefObject } from 'react';

import { Alert } from '@/components/ui/Alert';
import { Dialog, DialogCloseButton } from '@/components/ui/Dialog';
import type { PublicUser } from '@/features/auth/authService';
import { cn } from '@/lib/cn';

import { formatCardNumber } from '../cardFormat';
import type { TopUpFormInput, TopUpFormValues } from '../schemas';
import type { SnailpayClient } from '../snailpayClient';
import { FALLBACK_MESSAGE, FALLBACK_TITLE, getChargeMessage } from '../statusMessages';
import { useTopUp, type TopUpStatus } from '../useTopUp';
import type { ApplyChargeResult } from '../walletService';
import { TopUpForm } from './TopUpForm';
import { ResultActions, ResultSummary, StatusIcon, type ResultStatus } from './TopUpResult';

interface TopUpDialogProps {
  user: PublicUser;
  onClose: () => void;
  /** Aplica la respuesta al saldo y al historial (useWallet().apply). */
  onResult: (response: ChargeResponse) => ApplyChargeResult;
  /** Cierra el modal y lleva al usuario al historial. */
  onShowHistory: () => void;
  finalFocusRef?: RefObject<HTMLElement | null>;
  client?: SnailpayClient;
}

const TITLE_ID = 'topup-title';
const LIVE_ID = 'topup-result';

const emptyCard = { cardNumber: '', expirationDate: '', cvv: '' };

const isResult = (status: TopUpStatus): status is ResultStatus =>
  status !== 'idle' && status !== 'submitting';

/** Modal de recarga: formulario → procesando → aprobado / rechazado / error (styles.md §6). */
export function TopUpDialog({
  user,
  onClose,
  onResult,
  onShowHistory,
  finalFocusRef,
  client,
}: TopUpDialogProps) {
  const { status, response, applied, submit, retry, reset } = useTopUp({ user, onResult, client });
  const [draft, setDraft] = useState<TopUpFormInput>({
    ...emptyCard,
    cardholderName: user.fullName,
    amount: '',
  });
  const primaryActionRef = useRef<HTMLButtonElement>(null);

  const submitting = status === 'submitting';
  const showResult = isResult(status);
  const message = response
    ? getChargeMessage(response)
    : { title: FALLBACK_TITLE, message: FALLBACK_MESSAGE };

  // El botón que tenía el foco desaparece al mostrar el resultado: se lleva a la acción principal.
  useEffect(() => {
    if (showResult) primaryActionRef.current?.focus();
  }, [showResult]);

  function handleSubmit(values: TopUpFormValues) {
    // El borrador vuelve a llenar el formulario al reintentar o probar otra tarjeta.
    setDraft({
      ...values,
      cardNumber: formatCardNumber(values.cardNumber),
      amount: String(values.amount),
    });
    void submit(values);
  }

  function tryAnotherCard() {
    // Se conservan nombre y monto; los datos de la tarjeta se capturan de nuevo.
    setDraft((current) => ({ ...current, ...emptyCard }));
    reset();
  }

  return (
    <Dialog
      open
      onClose={onClose}
      labelledBy={TITLE_ID}
      describedBy={showResult ? LIVE_ID : undefined}
      role={status === 'rejected' || status === 'error' ? 'alertdialog' : 'dialog'}
      dismissible={!submitting}
      busy={submitting}
      finalFocusRef={finalFocusRef}
    >
      <div className="mb-6 flex items-start justify-between gap-4">
        {/* styles.md §2: 28px en el estado del resultado, 26px en el formulario. */}
        <h2
          id={TITLE_ID}
          className={cn('leading-tight font-semibold', showResult ? 'text-[28px]' : 'text-[26px]')}
        >
          {showResult ? message.title : 'Recargar saldo'}
        </h2>
        <DialogCloseButton onClick={onClose} disabled={submitting} />
      </div>

      {showResult && <StatusIcon status={status} />}

      {/* Región viva siempre montada: los lectores de pantalla anuncian el resultado. */}
      <div id={LIVE_ID} aria-live="polite" aria-atomic="true">
        {submitting && <p className="sr-only">Procesando pago…</p>}
        {showResult && (
          <div className="flex flex-col gap-4 text-center">
            <p className="text-[17px] font-semibold">{message.message}</p>
            {status === 'rejected' && <p>No se hizo ningún cobro.</p>}
            {response && <ResultSummary response={response} applied={applied} status={status} />}
          </div>
        )}
      </div>

      {showResult && applied && !applied.persisted && (
        <Alert className="mt-4">
          No pudimos guardar este resultado en tu navegador. Revisa que el almacenamiento esté
          permitido.
        </Alert>
      )}

      {showResult ? (
        <ResultActions
          status={status}
          primaryActionRef={primaryActionRef}
          onClose={onClose}
          onTryAnotherCard={tryAnotherCard}
          onRetry={() => void retry()}
          onShowHistory={onShowHistory}
        />
      ) : (
        <>
          <TopUpForm
            defaultValues={draft}
            submitting={submitting}
            onSubmit={handleSubmit}
            onCancel={onClose}
          />
          {submitting && (
            <p className="mt-3 text-center text-sm font-semibold text-text-muted">
              No cierres esta ventana.
            </p>
          )}
        </>
      )}
    </Dialog>
  );
}
