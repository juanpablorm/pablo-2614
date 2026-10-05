/** Pantalla completa de espera (sesión o página que aún se descarga). */
export function LoadingScreen() {
  return (
    <div className="flex min-h-dvh items-center justify-center" aria-busy="true">
      <span className="text-text-muted">Cargando…</span>
    </div>
  );
}
