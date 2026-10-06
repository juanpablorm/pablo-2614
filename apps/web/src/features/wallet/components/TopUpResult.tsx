import type { ChargeResponse } from '@snailracer/shared';
import { Check, Clock, X } from 'lucide-react';
import type { CSSProperties, Ref } from 'react';

import { Button } from '@/components/ui/Button';
import { cn } from '@/lib/cn';
import { formatCents } from '@/lib/money';

import { maskCardNumber } from '../cardFormat';
import { formatChargeDate } from '../chargeDisplay';
import type { TopUpStatus } from '../useTopUp';
import type { ApplyChargeResult } from '../walletService';

/** Estados del modal que muestran un resultado en lugar del formulario. */
export type ResultStatus = Exclude<TopUpStatus, 'idle' | 'submitting'>;

const STATUS_ICON = {
  approved: { Icon: Check, className: 'bg-secondary text-bg shadow-ring-success' },
  rejected: { Icon: X, className: 'bg-accent text-white shadow-ring-error' },
  error: { Icon: Clock, className: 'bg-highlight text-text shadow-ring-warning' },
} as const;

const CONFETTI_COLORS = ['bg-highlight', 'bg-primary', 'bg-secondary'] as const;
const CONFETTI_PIECES = 14;

/** Piezas repartidas en círculo alrededor del ícono. Posiciones fijas: no hay azar. */
const CONFETTI = Array.from({ length: CONFETTI_PIECES }, (_, i) => {
  const angle = (i / CONFETTI_PIECES) * 2 * Math.PI;
  const distance = 72 + (i % 3) * 18;
  return {
    id: i,
    color: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
    style: {
      '--sr-dx': `${Math.round(Math.cos(angle) * distance)}px`,
      '--sr-dy': `${Math.round(Math.sin(angle) * distance)}px`,
      '--sr-rot': `${(i % 2 === 0 ? -1 : 1) * (180 + i * 25)}deg`,
      animationDelay: `${(i % 4) * 40}ms`,
    } as CSSProperties,
  };
});

/**
 * Ícono de 92px con halo (styles.md §6); el aprobado suma confeti en dorado, naranja y verde.
 * Decorativo: el título ya dice el resultado.
 */
export function StatusIcon({ status }: { status: ResultStatus }) {
  const { Icon, className } = STATUS_ICON[status];
  return (
    <div
      aria-hidden="true"
      className={cn(
        'relative mx-auto mb-6 flex size-[92px] items-center justify-center rounded-full',
        className,
      )}
    >
      <Icon className="size-11" strokeWidth={3} />
      {status === 'approved' &&
        CONFETTI.map(({ id, color, style }) => (
          <span
            key={id}
            className={cn('sr-confetti absolute top-1/2 left-1/2 h-2.5 w-1.5', color)}
            style={style}
          />
        ))}
    </div>
  );
}

interface ResultSummaryProps {
  response: ChargeResponse;
  applied: ApplyChargeResult | null;
  status: ResultStatus;
}

/** Tarjeta enmascarada, fecha, nuevo saldo (si se aprobó) y referencia. */
export function ResultSummary({ response, applied, status }: ResultSummaryProps) {
  const rows: [string, string][] = [
    ['Tarjeta', maskCardNumber(response.card_number)],
    ['Fecha', formatChargeDate(response.date_created)],
  ];
  if (status === 'approved' && applied && !applied.corrupt)
    rows.push(['Nuevo saldo', formatCents(applied.balanceCents)]);
  rows.push(['Referencia', response.reference]);

  return (
    <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1.5 bg-surface px-4 py-3.5 text-left text-[15px]">
      {rows.map(([label, value]) => (
        <div key={label} className="contents">
          <dt className="text-text-muted">{label}</dt>
          <dd className="text-right font-semibold wrap-anywhere">{value}</dd>
        </div>
      ))}
    </dl>
  );
}

interface ResultActionsProps {
  status: ResultStatus;
  /** Acción principal: recibe el foco al aparecer el resultado. */
  primaryActionRef: Ref<HTMLButtonElement>;
  onClose: () => void;
  onTryAnotherCard: () => void;
  onRetry: () => void;
  onShowHistory: () => void;
}

/** Botones de cada resultado (styles.md §6, tabla de estados). */
export function ResultActions({
  status,
  primaryActionRef,
  onClose,
  onTryAnotherCard,
  onRetry,
  onShowHistory,
}: ResultActionsProps) {
  if (status === 'approved') {
    return (
      <div className="mt-6 flex">
        <Button ref={primaryActionRef} size="modal" onClick={onClose} className="w-full">
          Listo
        </Button>
      </div>
    );
  }

  const [primary, secondary] =
    status === 'rejected'
      ? [
          { label: 'Probar con otra tarjeta', onClick: onTryAnotherCard },
          { label: 'Cerrar', onClick: onClose },
        ]
      : [
          { label: 'Reintentar', onClick: onRetry },
          { label: 'Ver historial', onClick: onShowHistory },
        ];

  return (
    <div className="mt-6 flex flex-col gap-3">
      <Button ref={primaryActionRef} size="modal" onClick={primary.onClick}>
        {primary.label}
      </Button>
      <Button variant="secondary" size="modal" onClick={secondary.onClick}>
        {secondary.label}
      </Button>
    </div>
  );
}
