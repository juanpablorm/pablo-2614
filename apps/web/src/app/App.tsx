import logoUrl from '@/assets/snailracer-logo.svg';

/** Pantalla provisional de la Etapa 1. Se reemplaza por el router en la Fase 2. */
export function App() {
  return (
    <main className="flex min-h-dvh items-center justify-center bg-text px-4 py-12 text-bg">
      <div className="flex flex-col items-center gap-6 text-center">
        <img src={logoUrl} alt="" width={200} height={200} className="size-40 sm:size-52" />
        <h1 className="text-5xl leading-none font-semibold tracking-tight sm:text-7xl">
          Snail<span className="text-primary">Racer</span>
        </h1>
        <p className="max-w-md text-surface">
          Base técnica lista. Próximamente: registro e inicio de sesión.
        </p>
      </div>
    </main>
  );
}
