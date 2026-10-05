import type { ReactNode } from 'react';

import { AnimatedBrand } from './AnimatedBrand';

interface AuthLayoutProps {
  title: string;
  children: ReactNode;
}

/**
 * Desde 1024px, dos columnas (marca / formulario). Debajo se apilan: la marca se compacta
 * y el formulario va justo después, con el espacio sobrante al final y no entre los dos.
 */
export function AuthLayout({ title, children }: AuthLayoutProps) {
  return (
    <div className="flex min-h-dvh flex-col lg:flex-row">
      {/* overflow-hidden: el logo entra desde fuera del panel. */}
      <aside className="flex flex-none flex-col items-center justify-center gap-4 overflow-hidden bg-text px-4 py-8 text-center text-bg sm:gap-6 sm:py-12 lg:flex-[1_1_520px]">
        <AnimatedBrand />
        <p className="text-[13px] text-surface">Demo con datos simulados. No se usa dinero real.</p>
      </aside>

      <main className="flex flex-1 items-start justify-center px-4 py-6 sm:py-12 lg:flex-[1_1_560px] lg:items-center">
        <div className="w-full max-w-[470px] bg-surface p-[clamp(28px,4vw,44px)] shadow-card">
          <h1 className="mb-7 text-4xl leading-[1.1] font-semibold tracking-[-0.01em]">{title}</h1>
          {children}
        </div>
      </main>
    </div>
  );
}
