/**
 * Hash de contraseñas con PBKDF2-SHA256 vía Web Crypto (CONTEXT.md, regla 3).
 * Las iteraciones se guardan junto al hash para poder subirlas sin invalidar cuentas existentes.
 */

export const DEFAULT_PBKDF2_ITERATIONS = 600_000;
const SALT_BYTES = 16;
const HASH_BITS = 256;

export interface PasswordHash {
  /** Base64 del hash derivado. */
  hash: string;
  /** Base64 de la sal. */
  salt: string;
  iterations: number;
}

export interface HashOptions {
  iterations?: number;
  /** Sal en base64. Si se omite se generan 16 bytes aleatorios. */
  salt?: string;
}

export async function hashPassword(
  password: string,
  { iterations = DEFAULT_PBKDF2_ITERATIONS, salt }: HashOptions = {},
): Promise<PasswordHash> {
  const saltBytes = salt ? fromBase64(salt) : crypto.getRandomValues(new Uint8Array(SALT_BYTES));
  const hashBytes = await derive(password, saltBytes, iterations);
  return { hash: toBase64(hashBytes), salt: toBase64(saltBytes), iterations };
}

export async function verifyPassword(password: string, stored: PasswordHash): Promise<boolean> {
  try {
    const actual = await derive(password, fromBase64(stored.salt), stored.iterations);
    return constantTimeEqual(actual, fromBase64(stored.hash));
  } catch {
    // Sal o hash mal formados: nunca verifica.
    return false;
  }
}

async function derive(password: string, salt: Uint8Array<ArrayBuffer>, iterations: number) {
  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(password),
    'PBKDF2',
    false,
    ['deriveBits'],
  );
  const bits = await crypto.subtle.deriveBits(
    { name: 'PBKDF2', hash: 'SHA-256', salt, iterations },
    key,
    HASH_BITS,
  );
  return new Uint8Array(bits);
}

/** Recorre todos los bytes aunque encuentre una diferencia, para no filtrar la posición por tiempo. */
function constantTimeEqual(a: Uint8Array, b: Uint8Array): boolean {
  const length = Math.max(a.length, b.length);
  let diff = a.length ^ b.length;
  for (let i = 0; i < length; i++) {
    diff |= (a[i] ?? 0) ^ (b[i] ?? 0);
  }
  return diff === 0;
}

function toBase64(bytes: Uint8Array): string {
  let binary = '';
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary);
}

function fromBase64(value: string): Uint8Array<ArrayBuffer> {
  const binary = atob(value);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes;
}
