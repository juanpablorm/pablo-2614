import { zodResolver } from '@hookform/resolvers/zod';
import { Info } from 'lucide-react';
import { useForm, useWatch } from 'react-hook-form';

import { Button } from '@/components/ui/Button';
import { SubmitButton } from '@/components/ui/SubmitButton';
import { formatCents, toCents } from '@/lib/money';

import { topUpSchema, type TopUpFormInput, type TopUpFormValues } from '../schemas';
import { AmountPicker } from './AmountPicker';
import { CardFields } from './CardFields';

interface TopUpFormProps {
  defaultValues: TopUpFormInput;
  submitting: boolean;
  onSubmit: (values: TopUpFormValues) => void;
  onCancel: () => void;
}

// Dentro del modal los inputs van en blanco para separarse del fondo crema (styles.md §4).
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

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate>
      {/* Un fieldset deshabilitado bloquea todos los controles mientras se procesa el pago. */}
      <fieldset disabled={submitting} className="flex min-w-0 flex-col gap-[18px]">
        <legend className="sr-only">Datos de la tarjeta y monto</legend>

        <CardFields register={register} errors={errors} inputClassName={modalInput} />

        <AmountPicker
          register={register}
          setValue={setValue}
          error={errors.amount?.message}
          amountCents={amountCents}
          inputClassName={modalInput}
        />

        <p className="flex items-start gap-2 text-[13px] text-text-muted">
          <Info aria-hidden="true" className="mt-0.5 size-4 shrink-0" />
          Usa solo tarjetas de prueba. Esta demo guarda los datos de la tarjeta en tu navegador.
        </p>

        <div className="flex flex-col-reverse gap-3 sm:flex-row">
          <Button variant="secondary" size="modal" onClick={onCancel} className="sm:flex-1">
            Cancelar
          </Button>
          <SubmitButton
            loading={submitting}
            loadingText="Procesando pago…"
            size="modal"
            className="mt-0 sm:flex-[2]"
          >
            {amountLabel ? `Recargar ${amountLabel}` : 'Recargar'}
          </SubmitButton>
        </div>
      </fieldset>
    </form>
  );
}
