import { Plus } from 'lucide-react';
import type { Ref } from 'react';

import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { formatCents } from '@/lib/money';

interface BalanceCardProps {
  balanceCents: number;
  onTopUp: () => void;
  /** Botón Recargar: el modal regresa el foco aquí al cerrarse. */
  topUpButtonRef?: Ref<HTMLButtonElement>;
}

export function BalanceCard({ balanceCents, onTopUp, topUpButtonRef }: BalanceCardProps) {
  return (
    <Card variant="highlight" aria-labelledby="balance-title" className="flex flex-col">
      <h2
        id="balance-title"
        className="font-body text-sm font-bold tracking-[0.08em] text-surface uppercase"
      >
        Saldo disponible
      </h2>
      {/* El tamaño baja en celular para que saldos de 6 cifras no desborden la card. */}
      <p className="mt-3 font-display text-[clamp(40px,12vw,56px)] leading-none font-semibold tracking-[-0.02em] break-words">
        {formatCents(balanceCents)}
      </p>
      <p className="mt-2 text-sm text-surface">MXN</p>
      <div className="mt-auto pt-7">
        <Button
          ref={topUpButtonRef}
          onClick={onTopUp}
          aria-haspopup="dialog"
          className="w-full sm:w-auto"
        >
          <Plus aria-hidden="true" className="size-5" />
          Recargar
        </Button>
      </div>
    </Card>
  );
}
