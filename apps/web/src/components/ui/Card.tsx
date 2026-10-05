import { cva, type VariantProps } from 'class-variance-authority';
import type { ComponentProps } from 'react';

import { cn } from '@/lib/cn';

// 32px de padding (24px en celular para dejar ancho a las gráficas).
const cardVariants = cva('p-6 sm:p-8', {
  variants: {
    variant: {
      default: 'bg-surface text-text',
      // Card destacada (saldo): fondo café, texto claro y foco naranja.
      highlight: 'bg-text text-bg focus-on-dark',
    },
  },
  defaultVariants: { variant: 'default' },
});

type CardProps = ComponentProps<'section'> & VariantProps<typeof cardVariants>;

/** Sección con título: pásale `aria-labelledby` con el id de su CardTitle. */
export function Card({ className, variant, ...props }: CardProps) {
  return <section className={cn(cardVariants({ variant }), className)} {...props} />;
}

export function CardTitle({ className, children, ...props }: ComponentProps<'h2'>) {
  return (
    <h2 className={cn('text-2xl font-semibold', className)} {...props}>
      {children}
    </h2>
  );
}
