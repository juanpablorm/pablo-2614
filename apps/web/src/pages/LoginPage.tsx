import { Link } from 'react-router';

import { Alert } from '@/components/ui/Alert';
import { AuthLayout } from '@/features/auth/components/AuthLayout';
import type { SessionNotice } from '@/features/auth/authService';
import { LoginForm } from '@/features/auth/components/LoginForm';
import { useAuth } from '@/features/auth/useAuth';

const NOTICE_MESSAGES: Record<SessionNotice, string> = {
  expired: 'Tu sesión expiró. Inicia sesión de nuevo.',
  corrupt: 'No pudimos leer tus datos guardados en este navegador. Inicia sesión de nuevo.',
};

export function LoginPage() {
  const { notice } = useAuth();

  return (
    <AuthLayout title="Qué bueno verte">
      <title>Iniciar sesión SnailRacer</title>
      {notice && (
        <Alert variant="info" className="mb-[18px]">
          {NOTICE_MESSAGES[notice]}
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
