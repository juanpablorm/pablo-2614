import '@testing-library/jest-dom/vitest';

import { webcrypto } from 'node:crypto';

import { cleanup, configure } from '@testing-library/react';
import { afterEach } from 'vitest';

// El dashboard se descarga aparte (React.lazy): la primera prueba de cada archivo que lo abre
// compila en frío su chunk (Recharts). Con la máquina ocupada eso llegó a pasar de 3 s, así que
// findBy*/waitFor esperan hasta 10 s (testTimeout en vite.config.ts).
configure({ asyncUtilTimeout: 10_000 });

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
