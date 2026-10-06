/**
 * `fetch` con timeout y resultado tipado (docs/architecture.md §3).
 * Nunca lanza: quien llama decide qué significa cada caso para el usuario.
 */

export type HttpResult =
  /** Llegó una respuesta, con cualquier código HTTP. `body` es null si no era JSON. */
  | { kind: 'response'; status: number; body: unknown }
  /** Se alcanzó el tiempo límite; cualquier respuesta posterior se descarta. */
  | { kind: 'timeout' }
  /** No hubo respuesta: sin conexión, servidor caído, CORS, etc. */
  | { kind: 'network_error' };

export interface PostJsonOptions {
  timeoutMs: number;
  headers?: Record<string, string>;
}

async function readJson(response: Response): Promise<unknown> {
  try {
    return (await response.json()) as unknown;
  } catch {
    return null;
  }
}

export async function postJson(
  url: string,
  body: unknown,
  { timeoutMs, headers = {} }: PostJsonOptions,
): Promise<HttpResult> {
  const controller = new AbortController();
  let timer: ReturnType<typeof setTimeout> | undefined;

  const timeout = new Promise<HttpResult>((resolve) => {
    timer = setTimeout(() => {
      controller.abort();
      resolve({ kind: 'timeout' });
    }, timeoutMs);
  });

  // Se lee globalThis.fetch en cada llamada para poder sustituirlo en pruebas.
  const request = (async (): Promise<HttpResult> => {
    try {
      // eslint-disable-next-line no-restricted-properties -- único acceso permitido a fetch
      const response = await globalThis.fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...headers },
        body: JSON.stringify(body),
        signal: controller.signal,
      });
      return { kind: 'response', status: response.status, body: await readJson(response) };
    } catch {
      return controller.signal.aborted ? { kind: 'timeout' } : { kind: 'network_error' };
    }
  })();

  try {
    // El race garantiza que una respuesta que llega tras el abort se descarta,
    // aunque la implementación de fetch ignore la señal.
    return await Promise.race([request, timeout]);
  } finally {
    clearTimeout(timer);
  }
}
