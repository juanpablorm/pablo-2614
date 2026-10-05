import type { ChangeEvent } from 'react';
import type { FieldErrors, UseFormRegister, UseFormRegisterReturn } from 'react-hook-form';

import { FormField } from '@/components/ui/FormField';
import { Input } from '@/components/ui/Input';

import { formatCardNumber, formatExpiry } from '../cardFormat';
import { CARDHOLDER_NAME_MAX, type TopUpFormInput } from '../schemas';

interface CardFieldsProps {
  register: UseFormRegister<TopUpFormInput>;
  errors: FieldErrors<TopUpFormInput>;
  inputClassName?: string;
}

/** La máscara reescribe el valor antes de que React Hook Form lo lea. */
function withMask(field: UseFormRegisterReturn, format: (value: string) => string) {
  return {
    ...field,
    onChange: (event: ChangeEvent<HTMLInputElement>) => {
      event.target.value = format(event.target.value);
      void field.onChange(event);
    },
  };
}

/** Número, vencimiento, CVV y nombre en la tarjeta. */
export function CardFields({ register, errors, inputClassName }: CardFieldsProps) {
  return (
    <>
      <FormField
        id="topup-card-number"
        label="Número de tarjeta"
        error={errors.cardNumber?.message}
      >
        {(controlProps) => (
          <Input
            {...controlProps}
            {...withMask(register('cardNumber'), formatCardNumber)}
            data-autofocus
            inputMode="numeric"
            autoComplete="cc-number"
            placeholder="0000 0000 0000 0000"
            maxLength={19}
            className={inputClassName}
          />
        )}
      </FormField>

      <div className="grid grid-cols-2 gap-3">
        <FormField id="topup-expiration" label="Vencimiento" error={errors.expirationDate?.message}>
          {(controlProps) => (
            <Input
              {...controlProps}
              {...withMask(register('expirationDate'), formatExpiry)}
              inputMode="numeric"
              autoComplete="cc-exp"
              placeholder="MM/AA"
              maxLength={5}
              className={inputClassName}
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
              className={inputClassName}
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
            className={inputClassName}
          />
        )}
      </FormField>
    </>
  );
}
