import { cva, type VariantProps } from 'class-variance-authority';
import type { ComponentProps } from 'react';

import { cn } from '@/lib/cn';

const buttonVariants = cva(
  'inline-flex cursor-pointer items-center justify-center gap-2 transition-colors disabled:cursor-not-allowed',
  {
    variants: {
      variant: {
        primary:
          'h-(--btn-h) bg-primary px-7 font-display text-[19px] font-semibold text-text shadow-cta hover:brightness-105 active:translate-y-0.5 active:shadow-none disabled:bg-primary-disabled disabled:shadow-none disabled:hover:brightness-100 disabled:active:translate-y-0',
        secondary:
          'h-(--touch-min) border-2 border-text bg-transparent px-4 text-[15px] font-semibold text-text hover:bg-surface',
      },
    },
    defaultVariants: { variant: 'primary' },
  },
);

type ButtonProps = ComponentProps<'button'> & VariantProps<typeof buttonVariants>;

export function Button({ className, variant, type = 'button', ...props }: ButtonProps) {
  return <button type={type} className={cn(buttonVariants({ variant }), className)} {...props} />;
}
