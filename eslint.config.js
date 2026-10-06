import js from '@eslint/js';
import prettier from 'eslint-config-prettier';
import jsxA11y from 'eslint-plugin-jsx-a11y';
import reactHooks from 'eslint-plugin-react-hooks';
import reactRefresh from 'eslint-plugin-react-refresh';
import { defineConfig, globalIgnores } from 'eslint/config';
import globals from 'globals';
import tseslint from 'typescript-eslint';

// Regla 8 (CONTEXT.md) y architecture.md §3: LocalStorage solo en lib/storage.ts y fetch solo
// en lib/http.ts. Esos dos archivos lo permiten con un eslint-disable explícito.
const storageMessage = 'LocalStorage solo se usa desde lib/storage.ts (regla 8).';
const fetchMessage = 'fetch solo se usa desde lib/http.ts (architecture.md §3).';
const restrictedWebProperties = ['window', 'globalThis', 'self'].flatMap((object) => [
  { object, property: 'localStorage', message: storageMessage },
  { object, property: 'fetch', message: fetchMessage },
]);

export default defineConfig([
  globalIgnores(['**/dist/**', '**/coverage/**', 'docs/design/**']),

  js.configs.recommended,
  tseslint.configs.recommended,

  {
    rules: {
      '@typescript-eslint/no-explicit-any': 'error',
      '@typescript-eslint/consistent-type-imports': 'error',
      '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
    },
  },

  // Backend y paquete compartido: entorno Node.
  {
    files: ['apps/api/**/*.ts', 'packages/shared/**/*.ts', '*.js'],
    languageOptions: { globals: globals.node },
  },

  // Frontend: React, hooks y accesibilidad.
  {
    files: ['apps/web/**/*.{ts,tsx}'],
    extends: [
      reactHooks.configs.flat['recommended-latest'],
      reactRefresh.configs.vite,
      jsxA11y.flatConfigs.recommended,
    ],
    languageOptions: { globals: globals.browser },
  },

  {
    files: ['apps/web/src/**/*.{ts,tsx}'],
    rules: {
      'no-restricted-globals': [
        'error',
        { name: 'localStorage', message: storageMessage },
        { name: 'fetch', message: fetchMessage },
      ],
      'no-restricted-properties': ['error', ...restrictedWebProperties],
    },
  },

  // Datos simulados: deterministas con semilla (docs/architecture.md §6).
  // Repite las restricciones de arriba: este bloque reemplaza la lista de la regla.
  {
    files: ['apps/web/src/lib/prng.ts', 'apps/web/src/features/stats/**/*.{ts,tsx}'],
    rules: {
      'no-restricted-properties': [
        'error',
        ...restrictedWebProperties,
        { object: 'Math', property: 'random', message: 'Usa createRng(seed) de lib/prng.ts.' },
      ],
    },
  },

  prettier,
]);
