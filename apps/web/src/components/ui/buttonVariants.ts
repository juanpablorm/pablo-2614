import { cva, type VariantProps } from 'class-variance-authority';

/** Estilos de botón (styles.md §4). Aparte de Button.tsx para usarlos también en enlaces. */
export const buttonVariants = cva(
  'inline-flex cursor-pointer items-center justify-center gap-2 transition-colors disabled:cursor-not-allowed',
  {
    variants: {
      variant: {
        primary:
          'bg-primary px-7 font-display font-semibold text-text shadow-cta hover:brightness-105 active:translate-y-0.5 active:shadow-none disabled:bg-primary-disabled disabled:shadow-none disabled:hover:brightness-100 disabled:active:translate-y-0',
        secondary:
          'border-2 border-text bg-transparent px-4 text-[15px] font-semibold text-text hover:bg-surface',
      },
      size: {
        default: '',
        // Botones de acción dentro del modal de recarga: 52px de alto.
        modal: 'h-[52px]',
      },
    },
    compoundVariants: [
      { variant: 'primary', size: 'default', className: 'h-(--btn-h) text-[19px]' },
      { variant: 'primary', size: 'modal', className: 'text-[17px]' },
      { variant: 'secondary', size: 'default', className: 'h-(--touch-min)' },
    ],
    defaultVariants: { variant: 'primary', size: 'default' },
  },
);

export type ButtonVariantProps = VariantProps<typeof buttonVariants>;
