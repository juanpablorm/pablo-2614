import { LoaderCircle } from 'lucide-react';
import type { ReactNode } from 'react';

import { Button } from '@/components/ui/Button';
import { cn } from '@/lib/cn';

import type { ButtonVariantProps } from './buttonVariants';

interface SubmitButtonProps {
  loading: boolean;
  loadingText: string;
  size?: ButtonVariantProps['size'];
  className?: string;
  children: ReactNode;
}

export function SubmitButton({
  loading,
  loadingText,
  size,
  className,
  children,
}: SubmitButtonProps) {
  return (
    <Button
      type="submit"
      size={size}
      disabled={loading}
      aria-busy={loading}
      className={cn('mt-2 w-full', className)}
    >
      {loading ? (
        <>
          <LoaderCircle aria-hidden="true" className="size-5 animate-spin" />
          {loadingText}
        </>
      ) : (
        children
      )}
    </Button>
  );
}
