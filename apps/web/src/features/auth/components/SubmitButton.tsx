import { LoaderCircle } from 'lucide-react';
import type { ReactNode } from 'react';

import { Button } from '@/components/ui/Button';

interface SubmitButtonProps {
  loading: boolean;
  loadingText: string;
  children: ReactNode;
}

export function SubmitButton({ loading, loadingText, children }: SubmitButtonProps) {
  return (
    <Button type="submit" disabled={loading} aria-busy={loading} className="mt-2 w-full">
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
