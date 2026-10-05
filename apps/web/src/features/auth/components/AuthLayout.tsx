import type { ReactNode } from 'react';

import logoUrl from '@/assets/snailracer-logo.svg';

interface AuthLayoutProps {
  title: string;
  children: ReactNode;
}

/** Dos columnas (marca / formulario) que se apilan en pantallas angostas. */
export function AuthLayout({ title, children }: AuthLayoutProps) {
  return (
    <div className="flex min-h-dvh flex-wrap">
      <aside className="flex flex-[1_1_520px] flex-col items-center justify-center gap-6 bg-text px-4 py-12 text-center text-bg">
        <img
          src={logoUrl}
          alt=""
          width={240}
          height={240}
          className="size-[clamp(160px,18vw,240px)]"
        />
        <p className="font-display text-[clamp(48px,5.4vw,78px)] leading-none font-semibold tracking-[-0.02em]">
          Snail<span className="text-primary">Racer</span>
        </p>
        <p className="text-[13px] text-surface">Demo con datos simulados. No se usa dinero real.</p>
      </aside>

      <main className="flex flex-[1_1_560px] items-center justify-center px-4 py-12">
        <div className="w-full max-w-[470px] bg-surface p-[clamp(28px,4vw,44px)] shadow-card">
          <h1 className="mb-7 text-4xl leading-[1.1] font-semibold tracking-[-0.01em]">{title}</h1>
          {children}
        </div>
      </main>
    </div>
  );
}
