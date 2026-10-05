import { describe, expect, it } from 'vitest';

import { hashPassword, verifyPassword } from '@/features/auth/password';

const iterations = 1_000;

describe('password', () => {
  it('misma contraseña y misma sal producen el mismo hash', async () => {
    const first = await hashPassword('Caracol123', { iterations });
    const second = await hashPassword('Caracol123', { iterations, salt: first.salt });

    expect(second.hash).toBe(first.hash);
  });

  it('verifica la contraseña correcta', async () => {
    const stored = await hashPassword('Caracol123', { iterations });

    await expect(verifyPassword('Caracol123', stored)).resolves.toBe(true);
  });

  it('no verifica una contraseña incorrecta', async () => {
    const stored = await hashPassword('Caracol123', { iterations });

    await expect(verifyPassword('Caracol124', stored)).resolves.toBe(false);
    await expect(verifyPassword('caracol123', stored)).resolves.toBe(false);
  });

  it('genera una sal distinta de 16 bytes en cada registro', async () => {
    const first = await hashPassword('Caracol123', { iterations });
    const second = await hashPassword('Caracol123', { iterations });

    expect(first.salt).not.toBe(second.salt);
    expect(first.hash).not.toBe(second.hash);
    expect(atob(first.salt)).toHaveLength(16);
  });

  it('guarda las iteraciones con el hash y las usa al verificar', async () => {
    const stored = await hashPassword('Caracol123', { iterations });
    expect(stored.iterations).toBe(iterations);

    await expect(
      verifyPassword('Caracol123', { ...stored, iterations: iterations + 1 }),
    ).resolves.toBe(false);
  });

  it('no verifica si el hash guardado está mal formado', async () => {
    const stored = await hashPassword('Caracol123', { iterations });

    await expect(verifyPassword('Caracol123', { ...stored, hash: '%%%' })).resolves.toBe(false);
  });
});
