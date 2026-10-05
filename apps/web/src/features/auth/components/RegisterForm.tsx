import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';

import { Alert } from '@/components/ui/Alert';
import { Input } from '@/components/ui/Input';

import { AuthError } from '../authService';
import { registerSchema, type RegisterFormInput, type RegisterFormValues } from '../schemas';
import { useAuth } from '../useAuth';
import { FormField } from './FormField';
import { PasswordInput } from './PasswordInput';
import { SubmitButton } from './SubmitButton';

export function RegisterForm() {
  const { register: registerAccount } = useAuth();
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<RegisterFormInput, unknown, RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    mode: 'onTouched',
    defaultValues: { fullName: '', email: '', password: '', confirmPassword: '' },
  });

  const onSubmit = handleSubmit(async ({ fullName, email, password }) => {
    try {
      // La confirmación se queda en el formulario: nunca llega al servicio.
      await registerAccount({ fullName, email, password });
    } catch (error) {
      if (error instanceof AuthError && error.code === 'email_taken') {
        setError('email', { message: error.message }, { shouldFocus: true });
      } else {
        setError('root', {
          message:
            error instanceof AuthError
              ? error.message
              : 'Ocurrió un error inesperado. Intenta de nuevo.',
        });
      }
    }
  });

  return (
    <form onSubmit={onSubmit} noValidate className="flex flex-col gap-[18px]">
      {errors.root?.message && <Alert>{errors.root.message}</Alert>}

      <FormField id="register-name" label="Nombre completo" error={errors.fullName?.message}>
        {(control) => <Input {...control} autoComplete="name" {...register('fullName')} />}
      </FormField>

      <FormField id="register-email" label="Correo electrónico" error={errors.email?.message}>
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

      <FormField id="register-password" label="Contraseña" error={errors.password?.message}>
        {(control) => (
          <PasswordInput {...control} autoComplete="new-password" {...register('password')} />
        )}
      </FormField>

      <FormField
        id="register-confirm"
        label="Confirmar contraseña"
        error={errors.confirmPassword?.message}
      >
        {(control) => (
          <PasswordInput
            {...control}
            autoComplete="new-password"
            {...register('confirmPassword')}
          />
        )}
      </FormField>

      <p className="text-[13px] text-text-muted">
        Mínimo 8 caracteres, con mayúscula, minúscula y número.
      </p>

      <SubmitButton loading={isSubmitting} loadingText="Creando cuenta…">
        Crear cuenta
      </SubmitButton>
    </form>
  );
}
