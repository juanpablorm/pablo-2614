import { CircleAlert } from 'lucide-react';
import type { ReactNode } from 'react';

import { Label } from '@/components/ui/Label';

interface ControlProps {
  id: string;
  'aria-invalid': boolean;
  'aria-describedby': string | undefined;
}

interface FormFieldProps {
  id: string;
  label: string;
  error?: string;
  /** Recibe los atributos que conectan el control con su label y su error. */
  children: (control: ControlProps) => ReactNode;
}

export function FormField({ id, label, error, children }: FormFieldProps) {
  const errorId = `${id}-error`;
  return (
    <div className="flex flex-col gap-1.5">
      <Label htmlFor={id}>{label}</Label>
      {children({
        id,
        'aria-invalid': Boolean(error),
        'aria-describedby': error ? errorId : undefined,
      })}
      {error && (
        <p
          id={errorId}
          className="flex items-center gap-1.5 text-[13px] font-semibold text-error-text"
        >
          <CircleAlert aria-hidden="true" className="size-4 shrink-0" />
          {error}
        </p>
      )}
    </div>
  );
}
