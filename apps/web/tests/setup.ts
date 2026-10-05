import '@testing-library/jest-dom/vitest';

import { webcrypto } from 'node:crypto';

import { cleanup } from '@testing-library/react';
import { afterEach } from 'vitest';

// jsdom no implementa crypto.subtle: se usa el Web Crypto de Node (PBKDF2, randomUUID, getRandomValues).
Object.defineProperty(globalThis, 'crypto', { value: webcrypto, configurable: true });

afterEach(() => {
  cleanup();
  window.localStorage.clear();
});
