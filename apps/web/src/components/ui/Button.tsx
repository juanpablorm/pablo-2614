import type { ComponentProps } from 'react';

import { cn } from '@/lib/cn';

import { buttonVariants, type ButtonVariantProps } from './buttonVariants';

type ButtonProps = ComponentProps<'button'> & ButtonVariantProps;

export function Button({ className, variant, size, type = 'button', ...props }: ButtonProps) {
  return (
    <button type={type} className={cn(buttonVariants({ variant, size }), className)} {...props} />
  );
}
