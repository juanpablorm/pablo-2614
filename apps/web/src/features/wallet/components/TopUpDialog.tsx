import type { ChargeResponse } from '@snailracer/shared';
import { Check, Clock, X } from 'lucide-react';
import { useEffect, useRef, useState, type RefObject } from 'react';

import { Alert } from '@/components/ui/Alert';
import { Button } from '@/components/ui/Button';
import { Dialog, DialogCloseButton } from '@/components/ui/Dialog';
import type { PublicUser } from '@/features/auth/authService';
import { cn } from '@/lib/cn';
import { formatCents } from '@/lib/money';

import { formatCardNumber, maskCardNumber } from '../cardFormat';
import { formatChargeDate } from '../chargeDisplay';
import type { TopUpFormInput, TopUpFormValues } from '../schemas';
import type { SnailpayClient } from '../snailpayClient';
import { FALLBACK_MESSAGE, FALLBACK_TITLE, getChargeMessage } from '../statusMessages';
import { useTopUp, type TopUpStatus } from '../useTopUp';
import type { ApplyChargeResult } from '../walletService';
import { TopUpForm } from './TopUpForm';

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

const STATUS_ICON = {
  approved: {
    Icon: Check,
    className: 'bg-secondary text-bg shadow-[0_0_0_10px_var(--color-success-bg)]',
  },
  rejected: {
    Icon: X,
    className: 'bg-accent text-white shadow-[0_0_0_10px_var(--color-error-bg)]',
  },
  error: {
    Icon: Clock,
    className: 'bg-highlight text-text shadow-[0_0_0_10px_var(--color-warning-bg)]',
  },
} as const;

type ResultStatus = Exclude<TopUpStatus, 'idle' | 'submitting'>;
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
        <h2 id={TITLE_ID} className="text-[26px] leading-tight font-semibold">
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

      {!showResult && (
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

      {status === 'approved' && (
        <div className="mt-6 flex">
          <Button ref={primaryActionRef} onClick={onClose} className="h-[52px] w-full text-[17px]">
            Listo
          </Button>
        </div>
      )}
      {status === 'rejected' && (
        <div className="mt-6 flex flex-col gap-3">
          <Button ref={primaryActionRef} onClick={tryAnotherCard} className="h-[52px] text-[17px]">
            Probar con otra tarjeta
          </Button>
          <Button variant="secondary" onClick={onClose} className="h-[52px]">
            Cerrar
          </Button>
        </div>
      )}
      {status === 'error' && (
        <div className="mt-6 flex flex-col gap-3">
          <Button
            ref={primaryActionRef}
            onClick={() => void retry()}
            className="h-[52px] text-[17px]"
          >
            Reintentar
          </Button>
          <Button variant="secondary" onClick={onShowHistory} className="h-[52px]">
            Ver historial
          </Button>
        </div>
      )}
    </Dialog>
  );
}

function StatusIcon({ status }: { status: ResultStatus }) {
  const { Icon, className } = STATUS_ICON[status];
  return (
    <div
      aria-hidden="true"
      className={cn(
        'mx-auto mb-6 flex size-[92px] items-center justify-center rounded-full',
        className,
      )}
    >
      <Icon className="size-11" strokeWidth={3} />
    </div>
  );
}

interface ResultSummaryProps {
  response: ChargeResponse;
  applied: ApplyChargeResult | null;
  status: ResultStatus;
}

function ResultSummary({ response, applied, status }: ResultSummaryProps) {
  const rows: [string, string][] = [
    ['Tarjeta', maskCardNumber(response.card_number)],
    ['Fecha', formatChargeDate(response.date_created)],
  ];
  if (status === 'approved' && applied)
    rows.push(['Nuevo saldo', formatCents(applied.balanceCents)]);
  rows.push(['Referencia', response.reference]);

  return (
    <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1.5 bg-surface px-4 py-3.5 text-left text-[15px]">
      {rows.map(([label, value]) => (
        <div key={label} className="contents">
          <dt className="text-text-muted">{label}</dt>
          <dd className="text-right font-semibold">{value}</dd>
        </div>
      ))}
    </dl>
  );
}
