/**
 * Único acceso a LocalStorage (CONTEXT.md, regla 8).
 * Toda lectura se valida con Zod: datos ausentes, corruptos o con otra forma devuelven null.
 * Ninguna función lanza: el almacenamiento puede estar bloqueado (modo privado, cuota, políticas).
 */
import { chargeResponseSchema, type ChargeResponse } from '@snailracer/shared';
import { z } from 'zod';

export const STORAGE_PREFIX = 'snailracer:v1:';

export const storageKeys = {
  users: `${STORAGE_PREFIX}users`,
  session: `${STORAGE_PREFIX}session`,
  wallet: (userId: string) => `${STORAGE_PREFIX}wallet:${userId}`,
  charges: (userId: string) => `${STORAGE_PREFIX}charges:${userId}`,
} as const;

// --- Esquemas de lo que se guarda ---

export const storedUserSchema = z.object({
  id: z.uuid(),
  fullName: z.string().min(1),
  email: z.email(),
  passwordHash: z.string().min(1),
  salt: z.string().min(1),
  iterations: z.int().positive(),
  createdAt: z.iso.datetime(),
});
export type StoredUser = z.infer<typeof storedUserSchema>;

/** Usuarios indexados por correo normalizado. */
export const usersSchema = z.record(z.string(), storedUserSchema);
export type StoredUsers = z.infer<typeof usersSchema>;

export const sessionSchema = z.object({
  userId: z.uuid(),
  createdAt: z.iso.datetime(),
  expiresAt: z.iso.datetime(),
});
export type Session = z.infer<typeof sessionSchema>;

export const walletSchema = z.object({
  balanceCents: z.int().nonnegative(),
});
export type Wallet = z.infer<typeof walletSchema>;

/** Historial de cobros, el más reciente primero. Misma forma que valida el API (shared). */
export const chargesSchema = z.array(chargeResponseSchema);

// --- Acceso de bajo nivel ---

/**
 * Estado de una clave. "corrupt" (JSON roto o forma inválida) se distingue de "missing"
 * para no sobrescribir datos que existen pero no se pueden leer (docs/architecture.md §7).
 */
export type Stored<T> = { status: 'missing' } | { status: 'corrupt' } | { status: 'ok'; value: T };

function load<T>(key: string, schema: z.ZodType<T>): Stored<T> {
  let raw: string | null;
  try {
    raw = window.localStorage.getItem(key);
  } catch {
    // Almacenamiento bloqueado: no hay nada legible y las escrituras reportarán el fallo.
    return { status: 'missing' };
  }
  if (raw === null) return { status: 'missing' };

  try {
    const result = schema.safeParse(JSON.parse(raw));
    return result.success ? { status: 'ok', value: result.data } : { status: 'corrupt' };
  } catch {
    return { status: 'corrupt' };
  }
}

function read<T>(key: string, schema: z.ZodType<T>): T | null {
  const stored = load(key, schema);
  return stored.status === 'ok' ? stored.value : null;
}

function write(key: string, value: unknown): boolean {
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch {
    return false;
  }
}

function remove(key: string): boolean {
  try {
    window.localStorage.removeItem(key);
    return true;
  } catch {
    return false;
  }
}

// --- API pública ---

// read* devuelve null si la clave falta o está corrupta; load* distingue ambos casos.

export const readUsers = () => read(storageKeys.users, usersSchema);
export const loadUsers = () => load(storageKeys.users, usersSchema);
export const writeUsers = (users: StoredUsers) => write(storageKeys.users, users);

export const readSession = () => read(storageKeys.session, sessionSchema);
export const loadSession = () => load(storageKeys.session, sessionSchema);
export const writeSession = (session: Session) => write(storageKeys.session, session);
export const clearSession = () => remove(storageKeys.session);

export const readWallet = (userId: string) => read(storageKeys.wallet(userId), walletSchema);
export const loadWallet = (userId: string) => load(storageKeys.wallet(userId), walletSchema);
export const writeWallet = (userId: string, wallet: Wallet) =>
  write(storageKeys.wallet(userId), wallet);

export const readCharges = (userId: string): ChargeResponse[] | null =>
  read(storageKeys.charges(userId), chargesSchema);
export const loadCharges = (userId: string): Stored<ChargeResponse[]> =>
  load(storageKeys.charges(userId), chargesSchema);
export const writeCharges = (userId: string, charges: ChargeResponse[]) =>
  write(storageKeys.charges(userId), charges);
