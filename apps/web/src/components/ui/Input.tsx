import type { ComponentProps } from 'react';

import { cn } from '@/lib/cn';

export function Input({ className, ...props }: ComponentProps<'input'>) {
  return (
    <input
      className={cn(
        'h-(--input-h) w-full border-2 border-border bg-bg px-4 text-base text-text placeholder:text-text-muted',
        'aria-invalid:border-accent disabled:bg-input-disabled disabled:opacity-60',
        className,
      )}
      {...props}
    />
  );
}
