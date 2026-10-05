import { afterEach, describe, expect, it, vi } from 'vitest';

import {
  readSession,
  readUsers,
  readWallet,
  storageKeys,
  writeSession,
  writeWallet,
} from '@/lib/storage';

const userId = '6f1c2b8e-3a4d-4c5e-9f10-1a2b3c4d5e6f';

describe('storage', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('usa claves con prefijo y versión', () => {
    expect(storageKeys.users).toBe('snailracer:v1:users');
    expect(storageKeys.session).toBe('snailracer:v1:session');
    expect(storageKeys.wallet(userId)).toBe(`snailracer:v1:wallet:${userId}`);
    expect(storageKeys.charges(userId)).toBe(`snailracer:v1:charges:${userId}`);
  });

  it('devuelve null si la clave no existe', () => {
    expect(readUsers()).toBeNull();
    expect(readSession()).toBeNull();
  });

  it('lee de vuelta lo que escribe', () => {
    expect(writeWallet(userId, { balanceCents: 1250 })).toBe(true);
    expect(readWallet(userId)).toEqual({ balanceCents: 1250 });
  });

  it('devuelve null con JSON corrupto', () => {
    window.localStorage.setItem(storageKeys.session, '{no es json');
    expect(readSession()).toBeNull();
  });

  it('devuelve null si la forma no coincide con el esquema', () => {
    window.localStorage.setItem(storageKeys.wallet(userId), JSON.stringify({ balanceCents: 10.5 }));
    expect(readWallet(userId)).toBeNull();

    window.localStorage.setItem(storageKeys.users, JSON.stringify({ 'a@b.com': { id: 'x' } }));
    expect(readUsers()).toBeNull();
  });

  it('no lanza si el almacenamiento está bloqueado', () => {
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new DOMException('Bloqueado', 'SecurityError');
    });
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new DOMException('Cuota excedida', 'QuotaExceededError');
    });

    expect(readSession()).toBeNull();
    expect(
      writeSession({
        userId,
        createdAt: new Date().toISOString(),
        expiresAt: new Date().toISOString(),
      }),
    ).toBe(false);
  });
});
