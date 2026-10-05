import { describe, expect, it } from 'vitest';
import type { z } from 'zod';

import { loginSchema, registerSchema } from '@/features/auth/schemas';

const validRegister = {
  fullName: 'Arturo Torres',
  email: 'art@example.com',
  password: 'Caracol123',
  confirmPassword: 'Caracol123',
};

/** Mensajes de error agrupados por campo. */
function fieldErrors(schema: z.ZodType, input: unknown): Record<string, string[]> {
  const result = schema.safeParse(input);
  if (result.success) return {};
  const errors: Record<string, string[]> = {};
  for (const issue of result.error.issues) {
    const field = issue.path.join('.');
    (errors[field] ??= []).push(issue.message);
  }
  return errors;
}

describe('registerSchema', () => {
  it('acepta datos válidos y normaliza el correo', () => {
    const result = registerSchema.parse({
      ...validRegister,
      email: '  Art@Example.COM ',
      fullName: '  Arturo  ',
    });

    expect(result.email).toBe('art@example.com');
    expect(result.fullName).toBe('Arturo');
  });

  it('marca la confirmación distinta en el campo de confirmación', () => {
    const errors = fieldErrors(registerSchema, { ...validRegister, confirmPassword: 'Caracol124' });

    expect(errors).toEqual({ confirmPassword: ['Las contraseñas no coinciden.'] });
  });

  it('marca la confirmación distinta aunque otros campos fallen', () => {
    const errors = fieldErrors(registerSchema, {
      ...validRegister,
      fullName: '',
      confirmPassword: 'otra',
    });

    expect(errors.confirmPassword).toEqual(['Las contraseñas no coinciden.']);
  });

  it('rechaza un correo inválido', () => {
    expect(fieldErrors(registerSchema, { ...validRegister, email: 'art@' }).email).toEqual([
      'Correo no válido.',
    ]);
    expect(fieldErrors(registerSchema, { ...validRegister, email: '   ' }).email).toEqual([
      'Ingresa tu correo.',
    ]);
  });

  it.each([
    ['Car1', 'La contraseña debe tener al menos 8 caracteres.'],
    ['caracol123', 'Incluye al menos una mayúscula.'],
    ['CARACOL123', 'Incluye al menos una minúscula.'],
    ['Caracolito', 'Incluye al menos un número.'],
  ])('rechaza la contraseña débil "%s"', (password, message) => {
    const errors = fieldErrors(registerSchema, {
      ...validRegister,
      password,
      confirmPassword: password,
    });

    expect(errors.password).toContain(message);
  });

  it('exige confirmar la contraseña', () => {
    const errors = fieldErrors(registerSchema, { ...validRegister, confirmPassword: '' });

    expect(errors.confirmPassword).toEqual(['Confirma tu contraseña.']);
  });

  it('exige un nombre de al menos 3 caracteres tras quitar espacios', () => {
    const errors = fieldErrors(registerSchema, { ...validRegister, fullName: '  Al  ' });

    expect(errors.fullName).toEqual(['El nombre debe tener al menos 3 caracteres.']);
  });
});

describe('loginSchema', () => {
  it('exige correo y contraseña', () => {
    expect(fieldErrors(loginSchema, { email: '', password: '' })).toEqual({
      email: ['Ingresa tu correo.'],
      password: ['Ingresa tu contraseña.'],
    });
  });

  it('normaliza el correo y no recorta la contraseña', () => {
    expect(loginSchema.parse({ email: ' ART@example.com ', password: ' Caracol123 ' })).toEqual({
      email: 'art@example.com',
      password: ' Caracol123 ',
    });
  });
});
