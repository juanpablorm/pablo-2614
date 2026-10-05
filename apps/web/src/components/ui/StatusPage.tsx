import type { ReactNode } from 'react';

interface StatusPageProps {
  /** Texto decorativo grande sobre el título ("404", "¡Ay!"). */
  hero: string;
  title: string;
  /** Título de la pestaña del navegador. */
  documentTitle: string;
  children: ReactNode;
}

/** Pantalla completa para 404 y errores: hero, título y acciones. */
export function StatusPage({ hero, title, documentTitle, children }: StatusPageProps) {
  return (
    <main className="flex min-h-dvh flex-col items-center justify-center gap-6 px-4 py-12 text-center">
      <title>{documentTitle}</title>
      <p
        aria-hidden="true"
        className="font-display text-[clamp(120px,18vw,200px)] leading-none font-bold tracking-[-0.04em] text-accent"
      >
        {hero}
      </p>
      <h1 className="text-[clamp(30px,3.4vw,42px)] leading-[1.12] font-semibold">{title}</h1>
      <div className="flex flex-wrap items-center justify-center gap-4">{children}</div>
    </main>
  );
}
