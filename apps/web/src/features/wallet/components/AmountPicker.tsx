import type { UseFormRegister, UseFormSetValue } from 'react-hook-form';

import { FormField } from '@/components/ui/FormField';
import { Input } from '@/components/ui/Input';
import { cn } from '@/lib/cn';
import { formatCents } from '@/lib/money';

import { AMOUNT_PRESETS, TOP_UP_MIN_AMOUNT, type TopUpFormInput } from '../schemas';

interface AmountPickerProps {
  register: UseFormRegister<TopUpFormInput>;
  setValue: UseFormSetValue<TopUpFormInput>;
  error?: string;
  /** Monto válido escrito o elegido, en centavos; null mientras no lo sea. */
  amountCents: number | null;
  inputClassName?: string;
}

const MIN_AMOUNT_LABEL = `Mínimo ${formatCents(TOP_UP_MIN_AMOUNT * 100)}`;

/** Chips de montos sugeridos + monto libre + resumen de lo que se cobrará (styles.md §4 y §6). */
export function AmountPicker({
  register,
  setValue,
  error,
  amountCents,
  inputClassName,
}: AmountPickerProps) {
  const amountLabel = amountCents === null ? null : formatCents(amountCents);

  return (
    <>
      <div className="flex flex-col gap-1.5">
        <div role="group" aria-label="Montos sugeridos" className="grid grid-cols-4 gap-2">
          {AMOUNT_PRESETS.map((preset) => {
            const selected = amountCents === preset * 100;
            return (
              <button
                key={preset}
                type="button"
                aria-pressed={selected}
                onClick={() =>
                  setValue('amount', String(preset), { shouldValidate: true, shouldDirty: true })
                }
                className={cn(
                  'h-(--touch-min) cursor-pointer border-2 text-[15px] font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-60',
                  selected
                    ? 'border-text bg-text text-bg'
                    : 'border-border bg-transparent text-text hover:bg-surface disabled:hover:bg-transparent',
                )}
              >
                {formatCents(preset * 100).replace('.00', '')}
              </button>
            );
          })}
        </div>
        <FormField id="topup-amount" label="Monto (MXN)" hint={MIN_AMOUNT_LABEL} error={error}>
          {(controlProps) => (
            <Input
              {...controlProps}
              {...register('amount')}
              inputMode="decimal"
              className={inputClassName}
            />
          )}
        </FormField>
      </div>

      <div className="bg-surface px-4 py-3.5 text-[15px]">
        {amountLabel ? (
          <p>
            Se cobrarán <strong className="font-display text-lg">{amountLabel}</strong> a tu
            tarjeta. El monto se suma a tu saldo en cuanto el pago se aprueba.
          </p>
        ) : (
          <p>Elige o escribe el monto a recargar. Se suma a tu saldo en cuanto se aprueba.</p>
        )}
      </div>
    </>
  );
}
