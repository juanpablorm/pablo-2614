import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

import { describe, expect, it } from 'vitest';

/**
 * Regla 10 (CONTEXT.md): sin enlaces que identifiquen a terceros. Recorre el código y la
 * documentación del repo y solo admite URLs locales, el namespace de SVG, el propio repositorio y la versión publicada.
 */

const ROOT = fileURLToPath(new URL('../../..', import.meta.url));

/** El `git clone` del README. */
const OWN_REPOSITORY = 'https://github.com/juanpablorm/pablo-2614.git';
/** La versión publicada (README y architecture.md §8). */
const OWN_DEPLOYMENT = 'https://snail.devrios.pro';

const SCANNED = [
  'apps/api/src',
  'apps/web/src',
  'apps/web/index.html',
  'apps/api/.env.example',
  'apps/web/.env.example',
  'packages/shared/src',
  'docs',
  'README.md',
  'CONTEXT.md',
];

// El host se saca con regex: el código tiene URLs a medias como `http://localhost:${env.PORT}`.
const isAllowed = (url: string) => {
  const host = /^https?:\/\/([^/:?#]+)/.exec(url)?.[1] ?? '';
  return (
    host === 'localhost' ||
    host === '127.0.0.1' ||
    // Ejemplo de IP de red local en la nota de Web Crypto.
    host.startsWith('192.168') ||
    url === 'http://www.w3.org/2000/svg' ||
    url === OWN_REPOSITORY ||
    url === OWN_DEPLOYMENT
  );
};

function listFiles(path: string): string[] {
  const absolute = join(ROOT, path);
  if (!statSync(absolute).isDirectory()) return [absolute];
  return readdirSync(absolute, { recursive: true, withFileTypes: true })
    .filter((entry) => entry.isFile())
    .map((entry) => join(entry.parentPath, entry.name));
}

describe('referencias externas (regla 10)', () => {
  it('no hay enlaces externos en el código ni en la documentación', () => {
    const offending: string[] = [];

    for (const file of SCANNED.flatMap(listFiles)) {
      const text = readFileSync(file, 'utf8');
      for (const [url] of text.matchAll(/https?:\/\/[^\s'"`<>)\]]+/g)) {
        if (!isAllowed(url)) offending.push(`${relative(ROOT, file)}: ${url}`);
      }
    }

    expect(offending).toEqual([]);
  });

  it('detecta un enlace externo', () => {
    expect(isAllowed('https://fonts.example.com/css')).toBe(false);
    expect(isAllowed('http://localhost:3001/api')).toBe(true);
    // Solo el repositorio exacto: otra ruta del mismo host sigue siendo externa.
    expect(isAllowed(OWN_REPOSITORY)).toBe(true);
    expect(isAllowed('https://github.com/otra-cuenta/otro-repo')).toBe(false);
    // Lo mismo con la versión publicada: otro subdominio sigue siendo externo.
    expect(isAllowed(OWN_DEPLOYMENT)).toBe(true);
    expect(isAllowed('https://otro.devrios.pro')).toBe(false);
  });
});
