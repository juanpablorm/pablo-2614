import '@testing-library/jest-dom/vitest';

import { webcrypto } from 'node:crypto';

import { cleanup, configure } from '@testing-library/react';
import { afterEach } from 'vitest';

// El dashboard se descarga aparte (React.lazy) y el registro calcula PBKDF2: en un arranque
// en frío eso supera el 1 s por defecto de findBy*/waitFor.
configure({ asyncUtilTimeout: 3000 });

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
