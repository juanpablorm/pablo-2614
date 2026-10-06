import { Link } from 'react-router';

import { Alert } from '@/components/ui/Alert';
import { AuthLayout } from '@/features/auth/components/AuthLayout';
import { LoginForm } from '@/features/auth/components/LoginForm';
import { useAuth } from '@/features/auth/useAuth';

export function LoginPage() {
  const { sessionExpired } = useAuth();

  return (
    <AuthLayout title="Qué bueno verte">
      <title>Iniciar sesión SnailRacer</title>
      {sessionExpired && (
        <Alert variant="info" className="mb-[18px]">
          Tu sesión expiró. Inicia sesión de nuevo.
        </Alert>
      )}
      <LoginForm />
      <p className="mt-6 text-center text-[15px]">
        ¿No tienes cuenta?{' '}
        <Link
          to="/registro"
          className="font-semibold text-text underline underline-offset-2 hover:decoration-primary hover:decoration-2"
        >
          Crear cuenta
        </Link>
      </p>
    </AuthLayout>
  );
}
