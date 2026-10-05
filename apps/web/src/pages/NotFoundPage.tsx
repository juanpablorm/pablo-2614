import { Link } from 'react-router';

import { buttonVariants } from '@/components/ui/buttonVariants';
import { StatusPage } from '@/components/ui/StatusPage';

export function NotFoundPage() {
  return (
    <StatusPage
      hero="404"
      title="Este caracol se salió de la pista"
      documentTitle="Página no encontrada · SnailRacer"
    >
      <Link to="/" className={buttonVariants()}>
        Volver al inicio
      </Link>
    </StatusPage>
  );
}
