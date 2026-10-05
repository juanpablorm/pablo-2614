import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';

import { Alert } from '@/components/ui/Alert';
import { FormField } from '@/components/ui/FormField';
import { Input } from '@/components/ui/Input';
import { SubmitButton } from '@/components/ui/SubmitButton';

import { AuthError } from '../authService';
import { loginSchema, type LoginFormInput, type LoginFormValues } from '../schemas';
import { useAuth } from '../useAuth';
import { PasswordInput } from './PasswordInput';

export function LoginForm() {
  const { login } = useAuth();
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormInput, unknown, LoginFormValues>({
    resolver: zodResolver(loginSchema),
    mode: 'onTouched',
    defaultValues: { email: '', password: '' },
  });

  const onSubmit = handleSubmit(async (values) => {
    try {
      await login(values);
    } catch (error) {
      // Error genérico: nunca indica si falló el correo o la contraseña.
      setError('root', {
        message:
          error instanceof AuthError
            ? error.message
            : 'Ocurrió un error inesperado. Intenta de nuevo.',
      });
    }
  });

  return (
    <form onSubmit={onSubmit} noValidate className="flex flex-col gap-[18px]">
      {errors.root?.message && <Alert>{errors.root.message}</Alert>}

      <FormField id="login-email" label="Correo electrónico" error={errors.email?.message}>
        {(control) => (
          <Input
            {...control}
            type="email"
            inputMode="email"
            autoComplete="email"
            {...register('email')}
          />
        )}
      </FormField>

      <FormField id="login-password" label="Contraseña" error={errors.password?.message}>
        {(control) => (
          <PasswordInput {...control} autoComplete="current-password" {...register('password')} />
        )}
      </FormField>

      <SubmitButton loading={isSubmitting} loadingText="Entrando…">
        Iniciar sesión
      </SubmitButton>
    </form>
  );
}
