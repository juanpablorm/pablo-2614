import { Link } from 'react-router';

import { AuthLayout } from '@/features/auth/components/AuthLayout';
import { RegisterForm } from '@/features/auth/components/RegisterForm';

export function RegisterPage() {
  return (
    <AuthLayout title="Únete a la carrera">
      <title>Crear cuenta · SnailRacer</title>
      <RegisterForm />
      <p className="mt-6 text-center text-[15px]">
        ¿Ya tienes cuenta?{' '}
        <Link
          to="/login"
          className="font-semibold text-text underline underline-offset-2 hover:decoration-primary hover:decoration-2"
        >
          Inicia sesión
        </Link>
      </p>
    </AuthLayout>
  );
}
