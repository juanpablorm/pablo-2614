import { describe, expect, it } from 'vitest';

import { formatCardNumber, formatExpiry, maskCardNumber } from '@/features/wallet/cardFormat';

describe('cardFormat', () => {
  it('agrupa el número de tarjeta de 4 en 4 y corta en 16 dígitos', () => {
    expect(formatCardNumber('1234123412341234')).toBe('1234 1234 1234 1234');
    expect(formatCardNumber('12341')).toBe('1234 1');
    expect(formatCardNumber('1234-1234 abc 1234123412349999')).toBe('1234 1234 1234 1234');
    expect(formatCardNumber('')).toBe('');
  });

  it('da formato MM/YY al vencimiento', () => {
    expect(formatExpiry('12')).toBe('12');
    expect(formatExpiry('122')).toBe('12/2');
    expect(formatExpiry('1226')).toBe('12/26');
    expect(formatExpiry('12/265')).toBe('12/26');
  });

  it('enmascara la tarjeta con los últimos 4 dígitos', () => {
    expect(maskCardNumber('1234123412341234')).toBe('•••• 1234');
    expect(maskCardNumber('4000000000000002')).toBe('•••• 0002');
    expect(maskCardNumber(null)).toBe('—');
  });
});
