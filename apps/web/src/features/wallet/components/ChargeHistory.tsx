import type { ChargeResponse } from '@snailracer/shared';
import { CreditCard } from 'lucide-react';

import { cn } from '@/lib/cn';

import { maskCardNumber } from '../cardFormat';
import {
  formatChargeAmount,
  formatChargeDate,
  getChargeBadge,
  type ChargeBadge,
} from '../chargeDisplay';

interface ChargeHistoryProps {
  /** Respuestas de SnailPay, la más reciente primero. */
  history: ChargeResponse[];
}

const BADGE_CLASSES: Record<ChargeBadge, string> = {
  approved: 'bg-secondary text-bg',
  rejected: 'bg-accent text-white',
  pending: 'bg-highlight text-text',
  error: 'bg-accent text-white',
};

const headerCell =
  'px-[18px] py-3 text-left text-xs font-bold tracking-[0.06em] text-text-muted uppercase';
const cell = 'px-[18px] py-3.5';

/** Historial de recargas. Nunca muestra el CVV y la tarjeta va enmascarada (regla 9). */
export function ChargeHistory({ history }: ChargeHistoryProps) {
  if (history.length === 0) {
    return <p className="text-text-muted">Aún no tienes recargas.</p>;
  }

  return (
    <div className="overflow-x-auto bg-bg">
      <table className="w-full min-w-[520px] border-collapse text-[15px]">
        <thead>
          <tr>
            <th scope="col" className={headerCell}>
              Fecha
            </th>
            <th scope="col" className={headerCell}>
              Monto
            </th>
            <th scope="col" className={headerCell}>
              Estado
            </th>
            <th scope="col" className={headerCell}>
              Tarjeta
            </th>
          </tr>
        </thead>
        <tbody>
          {history.map((charge) => {
            const badge = getChargeBadge(charge);
            const masked = maskCardNumber(charge.card_number);
            return (
              <tr key={charge.id} className="border-t-[1.5px] border-surface">
                <td className={cell}>
                  <time dateTime={charge.date_created}>
                    {formatChargeDate(charge.date_created)}
                  </time>
                </td>
                <td className={cn(cell, 'font-display text-base font-semibold')}>
                  {formatChargeAmount(charge.transaction_amount)}
                </td>
                <td className={cell}>
                  <span
                    className={cn(
                      'inline-block px-3 py-1 text-[13px] font-bold',
                      BADGE_CLASSES[badge.kind],
                    )}
                  >
                    {badge.label}
                  </span>
                </td>
                <td className={cell}>
                  <span className="flex items-center gap-2 font-semibold">
                    <CreditCard aria-hidden="true" className="size-5 shrink-0 text-text-muted" />
                    {masked}
                  </span>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
