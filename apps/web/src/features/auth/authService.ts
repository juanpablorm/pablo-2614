/**
 * Registro, login, logout y restauración de sesión. Lógica pura: sin React.
 * Todo acceso a LocalStorage pasa por lib/storage.
 */
import {
  clearSession,
  readSession,
  readUsers,
  writeSession,
  writeUsers,
  writeWallet,
  type StoredUser,
} from '@/lib/storage';

import { DEFAULT_PBKDF2_ITERATIONS, hashPassword, verifyPassword } from './password';

export const SESSION_TTL_MS = 24 * 60 * 60 * 1000;

export type AuthErrorCode = 'email_taken' | 'invalid_credentials' | 'storage_unavailable';

const AUTH_ERROR_MESSAGES: Record<AuthErrorCode, string> = {
  email_taken: 'Ya existe una cuenta con este correo.',
  invalid_credentials: 'Correo o contraseña incorrectos.',
  storage_unavailable:
    'No pudimos guardar tus datos en este navegador. Revisa que el almacenamiento esté permitido.',
};

export class AuthError extends Error {
  readonly code: AuthErrorCode;

  constructor(code: AuthErrorCode) {
    super(AUTH_ERROR_MESSAGES[code]);
    this.name = 'AuthError';
    this.code = code;
  }
}

/** Datos del usuario que pueden llegar a la UI (sin hash ni sal). */
export interface PublicUser {
  id: string;
  fullName: string;
  email: string;
}

/** Nunca incluye la confirmación de contraseña: no hay forma de guardarla por error. */
export interface RegisterInput {
  fullName: string;
  email: string;
  password: string;
}

export interface LoginInput {
  email: string;
  password: string;
}

export interface RestoredSession {
  user: PublicUser | null;
  /** true si había una sesión y se descartó por haber expirado. */
  expired: boolean;
}

export interface AuthServiceOptions {
  /** Iteraciones de PBKDF2 para cuentas nuevas. Las pruebas usan menos. */
  iterations?: number;
  now?: () => Date;
}

export type AuthService = ReturnType<typeof createAuthService>;

export const normalizeEmail = (email: string) => email.trim().toLowerCase();

const toPublicUser = ({ id, fullName, email }: StoredUser): PublicUser => ({ id, fullName, email });

export function createAuthService({
  iterations = DEFAULT_PBKDF2_ITERATIONS,
  now = () => new Date(),
}: AuthServiceOptions = {}) {
  function startSession(userId: string) {
    const createdAt = now();
    const saved = writeSession({
      userId,
      createdAt: createdAt.toISOString(),
      expiresAt: new Date(createdAt.getTime() + SESSION_TTL_MS).toISOString(),
    });
    if (!saved) throw new AuthError('storage_unavailable');
  }

  function findUserById(userId: string): StoredUser | null {
    const users = readUsers() ?? {};
    return Object.values(users).find((user) => user.id === userId) ?? null;
  }

  async function register(input: RegisterInput): Promise<PublicUser> {
    const email = normalizeEmail(input.email);
    const users = readUsers() ?? {};
    if (users[email]) throw new AuthError('email_taken');

    const { hash, salt } = await hashPassword(input.password, { iterations });
    const user: StoredUser = {
      id: crypto.randomUUID(),
      fullName: input.fullName.trim(),
      email,
      passwordHash: hash,
      salt,
      iterations,
      createdAt: now().toISOString(),
    };

    if (!writeUsers({ ...users, [email]: user })) throw new AuthError('storage_unavailable');
    if (!writeWallet(user.id, { balanceCents: 0 })) throw new AuthError('storage_unavailable');
    startSession(user.id);
    return toPublicUser(user);
  }

  async function login(input: LoginInput): Promise<PublicUser> {
    const user = readUsers()?.[normalizeEmail(input.email)];

    if (!user) {
      // Mismo costo que un login real para no revelar por tiempo si el correo existe.
      await hashPassword(input.password, { iterations });
      throw new AuthError('invalid_credentials');
    }

    const valid = await verifyPassword(input.password, {
      hash: user.passwordHash,
      salt: user.salt,
      iterations: user.iterations,
    });
    if (!valid) throw new AuthError('invalid_credentials');

    startSession(user.id);
    return toPublicUser(user);
  }

  /** Solo borra la sesión: el usuario, su saldo y su historial se conservan. */
  function logout() {
    clearSession();
  }

  function restoreSession(): RestoredSession {
    const session = readSession();
    if (!session) {
      // Ausente o corrupta: se limpia por si quedó basura.
      clearSession();
      return { user: null, expired: false };
    }

    if (new Date(session.expiresAt).getTime() <= now().getTime()) {
      clearSession();
      return { user: null, expired: true };
    }

    const user = findUserById(session.userId);
    if (!user) {
      clearSession();
      return { user: null, expired: false };
    }

    return { user: toPublicUser(user), expired: false };
  }

  /** Usuario de la sesión activa, o null si no hay, expiró o el usuario ya no existe. */
  function getCurrentSession(): PublicUser | null {
    return restoreSession().user;
  }

  return { register, login, logout, restoreSession, getCurrentSession };
}

export const authService = createAuthService();
