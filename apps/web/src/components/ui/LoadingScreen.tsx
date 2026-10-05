import { LoaderCircle } from 'lucide-react';

/** Pantalla completa de espera mientras se descarga una página. */
export function LoadingScreen() {
  return (
    <div role="status" className="flex min-h-dvh items-center justify-center gap-3 text-text-muted">
      <LoaderCircle aria-hidden="true" className="size-6 animate-spin" />
      <span>Cargando…</span>
    </div>
  );
}
