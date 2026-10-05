import { zodResolver } from '@hookform/resolvers/zod';
import { Info } from 'lucide-react';
import { useForm, useWatch } from 'react-hook-form';

import { Button } from '@/components/ui/Button';
import { FormField } from '@/components/ui/FormField';
import { Input } from '@/components/ui/Input';
import { SubmitButton } from '@/components/ui/SubmitButton';
import { cn } from '@/lib/cn';
import { formatCents, toCents } from '@/lib/money';

import { formatCardNumber, formatExpiry } from '../cardFormat';
import {
  AMOUNT_PRESETS,
  CARDHOLDER_NAME_MAX,
  topUpSchema,
  type TopUpFormInput,
  type TopUpFormValues,
} from '../schemas';

interface TopUpFormProps {
  defaultValues: TopUpFormInput;
  submitting: boolean;
  onSubmit: (values: TopUpFormValues) => void;
  onCancel: () => void;
}

const modalInput = 'bg-white';

/** Monto válido del campo en centavos, o null mientras no lo sea. */
function parseAmountCents(raw: string): number | null {
  const result = topUpSchema.shape.amount.safeParse(raw);
  return result.success ? toCents(result.data) : null;
}

export function TopUpForm({ defaultValues, submitting, onSubmit, onCancel }: TopUpFormProps) {
  const {
    register,
    handleSubmit,
    setValue,
    control,
    formState: { errors },
  } = useForm<TopUpFormInput, unknown, TopUpFormValues>({
    resolver: zodResolver(topUpSchema),
    mode: 'onTouched',
    defaultValues,
  });

  const amountCents = parseAmountCents(useWatch({ control, name: 'amount' }));
  const amountLabel = amountCents === null ? null : formatCents(amountCents);

  // Las máscaras reescriben el valor antes de que React Hook Form lo lea.
  const cardNumberField = register('cardNumber');
  const expirationField = register('expirationDate');

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate>
      {/* Un fieldset deshabilitado bloquea todos los controles mientras se procesa el pago. */}
      <fieldset disabled={submitting} className="flex min-w-0 flex-col gap-[18px]">
        <legend className="sr-only">Datos de la tarjeta y monto</legend>

        <FormField
          id="topup-card-number"
          label="Número de tarjeta"
          error={errors.cardNumber?.message}
        >
          {(controlProps) => (
            <Input
              {...controlProps}
              {...cardNumberField}
              onChange={(event) => {
                event.target.value = formatCardNumber(event.target.value);
                void cardNumberField.onChange(event);
              }}
              data-autofocus
              inputMode="numeric"
              autoComplete="cc-number"
              placeholder="0000 0000 0000 0000"
              maxLength={19}
              className={modalInput}
            />
          )}
        </FormField>

        <div className="grid grid-cols-2 gap-3">
          <FormField
            id="topup-expiration"
            label="Vencimiento"
            error={errors.expirationDate?.message}
          >
            {(controlProps) => (
              <Input
                {...controlProps}
                {...expirationField}
                onChange={(event) => {
                  event.target.value = formatExpiry(event.target.value);
                  void expirationField.onChange(event);
                }}
                inputMode="numeric"
                autoComplete="cc-exp"
                placeholder="MM/AA"
                maxLength={5}
                className={modalInput}
              />
            )}
          </FormField>

          <FormField id="topup-cvv" label="CVV" error={errors.cvv?.message}>
            {(controlProps) => (
              <Input
                {...controlProps}
                {...register('cvv')}
                type="password"
                inputMode="numeric"
                autoComplete="cc-csc"
                maxLength={3}
                className={modalInput}
              />
            )}
          </FormField>
        </div>

        <FormField
          id="topup-cardholder"
          label="Nombre en la tarjeta"
          error={errors.cardholderName?.message}
        >
          {(controlProps) => (
            <Input
              {...controlProps}
              {...register('cardholderName')}
              autoComplete="cc-name"
              maxLength={CARDHOLDER_NAME_MAX}
              className={modalInput}
            />
          )}
        </FormField>

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
                    'h-(--touch-min) cursor-pointer border-2 border-border text-[15px] font-semibold disabled:cursor-not-allowed disabled:opacity-60',
                    selected ? 'border-text bg-text text-bg' : 'bg-transparent text-text',
                  )}
                >
                  {formatCents(preset * 100).replace('.00', '')}
                </button>
              );
            })}
          </div>
          <FormField id="topup-amount" label="Monto (MXN)" error={errors.amount?.message}>
            {(controlProps) => (
              <Input
                {...controlProps}
                {...register('amount')}
                inputMode="decimal"
                placeholder="Mínimo $50.00"
                className={modalInput}
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

        <p className="flex items-start gap-2 text-[13px] text-text-muted">
          <Info aria-hidden="true" className="mt-0.5 size-4 shrink-0" />
          Usa solo tarjetas de prueba. Esta demo guarda los datos de la tarjeta en tu navegador.
        </p>

        <div className="flex flex-col-reverse gap-3 sm:flex-row">
          <Button variant="secondary" onClick={onCancel} className="h-[52px] sm:flex-1">
            Cancelar
          </Button>
          <SubmitButton
            loading={submitting}
            loadingText="Procesando pago…"
            className="mt-0 h-[52px] text-[17px] sm:flex-[2]"
          >
            {amountLabel ? `Recargar ${amountLabel}` : 'Recargar'}
          </SubmitButton>
        </div>
      </fieldset>
    </form>
  );
}
