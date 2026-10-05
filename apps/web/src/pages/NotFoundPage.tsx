import { Link } from 'react-router';

export function NotFoundPage() {
  return (
    <main className="flex min-h-dvh flex-col items-center justify-center gap-6 px-4 py-12 text-center">
      <title>Página no encontrada · SnailRacer</title>
      <p
        aria-hidden="true"
        className="font-display text-[clamp(120px,18vw,200px)] leading-none font-bold tracking-[-0.04em] text-primary"
      >
        404
      </p>
      <h1 className="text-[clamp(30px,3.4vw,42px)] leading-[1.12] font-semibold">
        Este caracol se salió de la pista
      </h1>
      <Link
        to="/"
        className="inline-flex h-(--btn-h) items-center bg-primary px-7 font-display text-[19px] font-semibold text-text shadow-cta"
      >
        Volver al inicio
      </Link>
    </main>
  );
}
