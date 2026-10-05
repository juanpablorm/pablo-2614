import '@testing-library/jest-dom/vitest';

import { webcrypto } from 'node:crypto';

import { cleanup } from '@testing-library/react';
import { afterEach } from 'vitest';

// jsdom no implementa crypto.subtle: se usa el Web Crypto de Node (PBKDF2, randomUUID, getRandomValues).
Object.defineProperty(globalThis, 'crypto', { value: webcrypto, configurable: true });

// jsdom tampoco trae ResizeObserver, que usa ResponsiveContainer de Recharts.
class ResizeObserverStub {
  observe() {}
  unobserve() {}
  disconnect() {}
}
globalThis.ResizeObserver ??= ResizeObserverStub;

afterEach(() => {
  cleanup();
  window.localStorage.clear();
});
