/**
 * Registro, login, logout y restauración de sesión. Lógica pura: sin React.
 * Todo acceso a LocalStorage pasa por lib/storage.
 */
import {
  clearSession,
  loadCharges,
  loadSession,
  loadUsers,
  loadWallet,
  writeSession,
  writeUsers,
  writeWallet,
  type StoredUser,
  type StoredUsers,
} from '@/lib/storage';

import { DEFAULT_PBKDF2_ITERATIONS, hashPassword, verifyPassword } from './password';

export const SESSION_TTL_MS = 24 * 60 * 60 * 1000;

export type AuthErrorCode =
  'email_taken' | 'invalid_credentials' | 'storage_unavailable' | 'storage_corrupt';

const AUTH_ERROR_MESSAGES: Record<AuthErrorCode, string> = {
  email_taken: 'Ya existe una cuenta con este correo.',
  invalid_credentials: 'Correo o contraseña incorrectos.',
  storage_unavailable:
    'No pudimos guardar tus datos en este navegador. Revisa que el almacenamiento esté permitido.',
  storage_corrupt:
    'No pudimos leer los datos guardados en este navegador. Borra los datos del sitio para empezar de nuevo.',
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

/** Por qué se descartó la sesión guardada, para avisar en el login. */
export type SessionNotice = 'expired' | 'corrupt';

export interface RestoredSession {
  user: PublicUser | null;
  /** Motivo si había una sesión y se descartó; null si no había o sigue activa. */
  notice: SessionNotice | null;
  /** Milisegundos hasta que expire la sesión activa (con el reloj del servicio); null sin sesión. */
  expiresInMs: number | null;
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

  /** Usuarios guardados. Si existen pero no se pueden leer, lanza: nunca se sobrescriben. */
  function getUsers(): StoredUsers {
    const stored = loadUsers();
    if (stored.status === 'corrupt') throw new AuthError('storage_corrupt');
    return stored.status === 'ok' ? stored.value : {};
  }

  /** Saldo o historial del usuario guardados pero ilegibles (docs/architecture.md §7). */
  function hasUnreadableWallet(userId: string): boolean {
    return loadWallet(userId).status === 'corrupt' || loadCharges(userId).status === 'corrupt';
  }

  async function register(input: RegisterInput): Promise<PublicUser> {
    const email = normalizeEmail(input.email);
    const users = getUsers();
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
    const user = getUsers()[normalizeEmail(input.email)];

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
    // Con el saldo ilegible no se entra: el dashboard mostraría $0 y lo sobrescribiría.
    if (hasUnreadableWallet(user.id)) throw new AuthError('storage_corrupt');

    startSession(user.id);
    return toPublicUser(user);
  }

  /** Solo borra la sesión: el usuario, su saldo y su historial se conservan. */
  function logout() {
    clearSession();
  }

  /**
   * Sesión activa, o el motivo por el que se descartó. Expirada o con datos ilegibles
   * (sesión, usuarios, saldo o historial) → se limpia la sesión y se avisa (architecture.md §4).
   */
  function restoreSession(): RestoredSession {
    const discard = (notice: SessionNotice | null): RestoredSession => {
      clearSession();
      return { user: null, notice, expiresInMs: null };
    };

    const session = loadSession();
    if (session.status === 'missing') return { user: null, notice: null, expiresInMs: null };
    if (session.status === 'corrupt') return discard('corrupt');

    const expiresInMs = new Date(session.value.expiresAt).getTime() - now().getTime();
    if (expiresInMs <= 0) return discard('expired');

    const users = loadUsers();
    if (users.status === 'corrupt') return discard('corrupt');
    const user =
      users.status === 'ok'
        ? Object.values(users.value).find(({ id }) => id === session.value.userId)
        : undefined;
    // El usuario ya no existe (p. ej. se borraron sus datos): no hay nada que avisar.
    if (!user) return discard(null);
    if (hasUnreadableWallet(user.id)) return discard('corrupt');

    return { user: toPublicUser(user), notice: null, expiresInMs };
  }

  /** Usuario de la sesión activa, o null si no hay, expiró o el usuario ya no existe. */
  function getCurrentSession(): PublicUser | null {
    return restoreSession().user;
  }

  return { register, login, logout, restoreSession, getCurrentSession };
}

export const authService = createAuthService();
