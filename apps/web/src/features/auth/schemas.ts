import { z } from 'zod';

export const FULL_NAME_MIN = 3;
export const FULL_NAME_MAX = 80;
export const PASSWORD_MIN = 8;
/** Acota el costo de PBKDF2 ante entradas enormes. */
export const PASSWORD_MAX = 128;

const emailField = z
  .string()
  .trim()
  .toLowerCase()
  .min(1, 'Ingresa tu correo.')
  .pipe(z.email('Correo no válido.'));

const newPasswordField = z
  .string()
  .min(PASSWORD_MIN, `La contraseña debe tener al menos ${PASSWORD_MIN} caracteres.`)
  .max(PASSWORD_MAX, `La contraseña debe tener máximo ${PASSWORD_MAX} caracteres.`)
  .regex(/[A-Z]/, 'Incluye al menos una mayúscula.')
  .regex(/[a-z]/, 'Incluye al menos una minúscula.')
  .regex(/\d/, 'Incluye al menos un número.');

const passwordPair = z.object({
  password: newPasswordField,
  confirmPassword: z.string().min(1, 'Confirma tu contraseña.'),
});

export const registerSchema = z
  .object({
    fullName: z
      .string()
      .trim()
      .min(FULL_NAME_MIN, `El nombre debe tener al menos ${FULL_NAME_MIN} caracteres.`)
      .max(FULL_NAME_MAX, `El nombre debe tener máximo ${FULL_NAME_MAX} caracteres.`),
    email: emailField,
  })
  .extend(passwordPair.shape)
  .refine((data) => data.password === data.confirmPassword, {
    path: ['confirmPassword'],
    message: 'Las contraseñas no coinciden.',
    // Compara aunque otros campos (nombre, correo) tengan errores.
    when: (payload) => passwordPair.safeParse(payload.value).success,
  });

export const loginSchema = z.object({
  email: z.string().trim().toLowerCase().min(1, 'Ingresa tu correo.'),
  password: z.string().min(1, 'Ingresa tu contraseña.'),
});

export type RegisterFormInput = z.input<typeof registerSchema>;
export type RegisterFormValues = z.output<typeof registerSchema>;
export type LoginFormInput = z.input<typeof loginSchema>;
export type LoginFormValues = z.output<typeof loginSchema>;
