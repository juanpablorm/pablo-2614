import { describe, expect, it } from 'vitest';

import { addCents, formatCents, toCents } from '@/lib/money';

describe('money', () => {
  it('convierte pesos a centavos enteros', () => {
    expect(toCents(250.5)).toBe(25050);
    expect(toCents(10000)).toBe(1_000_000);
    expect(toCents(0)).toBe(0);
  });

  it('absorbe el error binario de los decimales', () => {
    // 0.29 * 100 = 28.999999999999996 y 1.15 * 100 = 114.99999999999999
    expect(toCents(0.29)).toBe(29);
    expect(toCents(1.15)).toBe(115);
    expect(toCents(0.1)).toBe(10);
    expect(toCents(0.2)).toBe(20);
  });

  it('suma en centavos sin errores de punto flotante', () => {
    expect(0.1 + 0.2).not.toBe(0.3); // el problema que se evita
    expect(addCents(toCents(0.1)!, toCents(0.2)!)).toBe(30);

    let total = 0;
    for (let i = 0; i < 1000; i++) total = addCents(total, toCents(0.1)!);
    expect(total).toBe(10_000);
    expect(formatCents(total)).toBe('$100.00');
  });

  it('rechaza montos no válidos', () => {
    expect(toCents(Number.NaN)).toBeNull();
    expect(toCents(Number.POSITIVE_INFINITY)).toBeNull();
    expect(toCents(-1)).toBeNull();
    expect(toCents(Number.MAX_SAFE_INTEGER)).toBeNull();
  });

  it('addCents no acepta decimales', () => {
    expect(() => addCents(10.5, 1)).toThrow(RangeError);
  });

  it('formatea centavos como MXN', () => {
    expect(formatCents(25050)).toBe('$250.50');
    expect(formatCents(125000)).toBe('$1,250.00');
  });
});
