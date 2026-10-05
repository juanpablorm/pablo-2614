import { describe, expect, it } from 'vitest';

import { loadEnv } from '../src/config/env.js';

describe('loadEnv', () => {
  it('usa los valores por defecto documentados', () => {
    expect(loadEnv({})).toEqual({
      PORT: 3001,
      CORS_ORIGIN: 'http://localhost:5173',
      SNAILPAY_SIMULATE_OUTAGE: false,
      SNAILPAY_SLOW_DELAY_MS: 15000,
      SNAILPAY_MAX_AMOUNT: 10000,
    });
  });

  it('interpreta "false" como false y "true" como true', () => {
    expect(loadEnv({ SNAILPAY_SIMULATE_OUTAGE: 'false' }).SNAILPAY_SIMULATE_OUTAGE).toBe(false);
    expect(loadEnv({ SNAILPAY_SIMULATE_OUTAGE: 'true' }).SNAILPAY_SIMULATE_OUTAGE).toBe(true);
  });

  it('trata variables vacías como no definidas', () => {
    expect(loadEnv({ PORT: '' }).PORT).toBe(3001);
  });

  it('convierte números desde texto', () => {
    expect(loadEnv({ PORT: '4000', SNAILPAY_SLOW_DELAY_MS: '500' })).toMatchObject({
      PORT: 4000,
      SNAILPAY_SLOW_DELAY_MS: 500,
    });
  });

  it.each([
    ['SNAILPAY_SIMULATE_OUTAGE', 'yes'],
    ['SNAILPAY_SLOW_DELAY_MS', 'abc'],
    ['PORT', '70000'],
    ['CORS_ORIGIN', 'no-es-url'],
    ['SNAILPAY_MAX_AMOUNT', '-1'],
  ])('falla si %s = %s', (key, value) => {
    expect(() => loadEnv({ [key]: value })).toThrow(/Variables de entorno inválidas/);
  });
});
