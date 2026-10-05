import type { ComponentProps } from 'react';

import { cn } from '@/lib/cn';

export function Label({ className, ...props }: ComponentProps<'label'>) {
  // eslint-disable-next-line jsx-a11y/label-has-associated-control -- htmlFor llega por props
  return <label className={cn('text-sm font-semibold text-text', className)} {...props} />;
}
