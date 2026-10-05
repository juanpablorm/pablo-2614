import { Link } from 'react-router';

import { Button } from '@/components/ui/Button';
import { buttonVariants } from '@/components/ui/buttonVariants';
import { StatusPage } from '@/components/ui/StatusPage';
import { cn } from '@/lib/cn';

/** Pantalla de error de cualquier ruta (p. ej. no se pudo descargar el dashboard). */
export function RouteErrorPage() {
  return (
    <StatusPage hero="¡Ay!" title="Algo salió mal" documentTitle="Algo salió mal · SnailRacer">
      <Button onClick={() => window.location.reload()}>Recargar página</Button>
      {/* Mismo alto que el botón primario para que la fila quede pareja. */}
      <Link to="/" className={cn(buttonVariants({ variant: 'secondary' }), 'h-(--btn-h) px-7')}>
        Volver al inicio
      </Link>
    </StatusPage>
  );
}
