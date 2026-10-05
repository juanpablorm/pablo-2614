import { cva, type VariantProps } from 'class-variance-authority';
import { CircleAlert, CircleCheck } from 'lucide-react';
import type { ComponentProps } from 'react';

import { cn } from '@/lib/cn';

const alertVariants = cva('flex items-start gap-3 border-2 px-4 py-3.5 text-[15px] font-semibold', {
  variants: {
    variant: {
      error: 'border-accent bg-error-bg text-error-text',
      info: 'border-secondary bg-success-bg text-success-text',
    },
  },
  defaultVariants: { variant: 'error' },
});

type AlertProps = ComponentProps<'div'> & VariantProps<typeof alertVariants>;

/** Errores se anuncian de inmediato (role="alert"); avisos con role="status". */
export function Alert({ className, variant = 'error', children, ...props }: AlertProps) {
  const Icon = variant === 'error' ? CircleAlert : CircleCheck;
  return (
    <div
      role={variant === 'error' ? 'alert' : 'status'}
      className={cn(alertVariants({ variant }), className)}
      {...props}
    >
      <Icon aria-hidden="true" className="size-[22px] shrink-0" />
      <div>{children}</div>
    </div>
  );
}
