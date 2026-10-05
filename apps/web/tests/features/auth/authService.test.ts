import { describe, expect, it } from 'vitest';

import { AuthError, SESSION_TTL_MS } from '@/features/auth/authService';
import { readSession, readUsers, readWallet, storageKeys, writeUsers } from '@/lib/storage';

import { createTestAuthService } from '../../utils/renderApp';

const PASSWORD = 'Caracol123';
const account = { fullName: 'Arturo Torres', email: 'art@example.com', password: PASSWORD };

/** Todo lo que hay en LocalStorage, como texto. */
function dumpStorage(): string {
  const entries: string[] = [];
  for (let i = 0; i < window.localStorage.length; i++) {
    const key = window.localStorage.key(i);
    if (key) entries.push(`${key}=${window.localStorage.getItem(key)}`);
  }
  return entries.join('\n');
}

describe('authService', () => {
  it('no guarda la contraseña en claro, solo hash, sal e iteraciones', async () => {
    const service = createTestAuthService();
    await service.register(account);

    expect(dumpStorage()).not.toContain(PASSWORD);

    const stored = readUsers()?.['art@example.com'];
    expect(stored).toMatchObject({
      fullName: 'Arturo Torres',
      email: 'art@example.com',
      iterations: 1_000,
    });
    expect(Object.keys(stored ?? {}).sort()).toEqual(
      ['createdAt', 'email', 'fullName', 'id', 'iterations', 'passwordHash', 'salt'].sort(),
    );
  });

  it('crea el wallet con saldo inicial 0 e inicia sesión', async () => {
    const service = createTestAuthService();
    const user = await service.register(account);

    expect(readWallet(user.id)).toEqual({ balanceCents: 0 });
    expect(service.getCurrentSession()).toEqual(user);
    expect(user).not.toHaveProperty('passwordHash');
  });

  it('rechaza un correo ya registrado, sin importar mayúsculas ni espacios', async () => {
    const service = createTestAuthService();
    await service.register(account);

    await expect(
      service.register({ ...account, email: '  ART@Example.com ' }),
    ).rejects.toMatchObject({
      code: 'email_taken',
    });
    expect(Object.keys(readUsers() ?? {})).toHaveLength(1);
  });

  it('permite iniciar sesión con el correo en mayúsculas', async () => {
    const service = createTestAuthService();
    const registered = await service.register(account);
    service.logout();

    const user = await service.login({ email: 'ART@EXAMPLE.COM', password: PASSWORD });

    expect(user).toEqual(registered);
    expect(service.getCurrentSession()).toEqual(registered);
  });

  it('da el mismo error genérico con contraseña incorrecta o correo inexistente', async () => {
    const service = createTestAuthService();
    await service.register(account);
    service.logout();

    const attempts = [
      { email: account.email, password: 'Caracol124' },
      { email: 'nadie@example.com', password: PASSWORD },
    ];

    for (const credentials of attempts) {
      const error = await service.login(credentials).catch((e: unknown) => e);
      expect(error).toBeInstanceOf(AuthError);
      expect(error).toMatchObject({
        code: 'invalid_credentials',
        message: 'Correo o contraseña incorrectos.',
      });
    }
    expect(readSession()).toBeNull();
  });

  it('logout borra solo la sesión y conserva usuario y saldo', async () => {
    const service = createTestAuthService();
    const user = await service.register(account);
    window.localStorage.setItem(
      storageKeys.wallet(user.id),
      JSON.stringify({ balanceCents: 5000 }),
    );

    service.logout();

    expect(readSession()).toBeNull();
    expect(service.getCurrentSession()).toBeNull();
    expect(readUsers()?.['art@example.com']?.id).toBe(user.id);
    expect(readWallet(user.id)).toEqual({ balanceCents: 5000 });
  });

  it('devuelve null y limpia la sesión cuando expira a las 24 h', async () => {
    let now = new Date('2026-10-04T12:00:00.000Z');
    const service = createTestAuthService({ now: () => now });
    const user = await service.register(account);

    now = new Date(now.getTime() + SESSION_TTL_MS - 1);
    expect(service.getCurrentSession()).toEqual(user);

    now = new Date(now.getTime() + 1);
    expect(service.restoreSession()).toEqual({ user: null, expired: true });
    expect(readSession()).toBeNull();
  });

  it('devuelve null si el usuario de la sesión ya no existe', async () => {
    const service = createTestAuthService();
    await service.register(account);
    writeUsers({});

    expect(service.getCurrentSession()).toBeNull();
    expect(readSession()).toBeNull();
  });

  it('devuelve null si la sesión guardada está corrupta', () => {
    window.localStorage.setItem(storageKeys.session, '{"userId": 42}');

    expect(createTestAuthService().getCurrentSession()).toBeNull();
    expect(window.localStorage.getItem(storageKeys.session)).toBeNull();
  });
});
