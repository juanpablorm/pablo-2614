import { describe, expect, it } from 'vitest';

import { topUpSchema, type TopUpFormInput } from '@/features/wallet/schemas';

const valid: TopUpFormInput = {
  cardNumber: '1234 1234 1234 1234',
  expirationDate: '12/26',
  cvv: '543',
  cardholderName: '  Arturo Torres ',
  amount: '250.50',
};

const errorsFor = (input: Partial<TopUpFormInput>) => {
  const result = topUpSchema.safeParse({ ...valid, ...input });
  return result.success ? [] : result.error.issues.map((issue) => issue.path.join('.'));
};

describe('topUpSchema', () => {
  it('normaliza los datos válidos', () => {
    expect(topUpSchema.parse(valid)).toEqual({
      cardNumber: '1234123412341234',
      expirationDate: '12/26',
      cvv: '543',
      cardholderName: 'Arturo Torres',
      amount: 250.5,
    });
  });

  it('exige 16 dígitos sin aplicar Luhn', () => {
    expect(errorsFor({ cardNumber: '1234 1234 1234 123' })).toEqual(['cardNumber']);
    expect(errorsFor({ cardNumber: '1234 1234 1234 123a' })).toEqual(['cardNumber']);
    expect(errorsFor({ cardNumber: '8888 8888 8888 8888' })).toEqual([]);
  });

  it('valida el mes sin comparar contra la fecha actual', () => {
    expect(errorsFor({ expirationDate: '13/26' })).toEqual(['expirationDate']);
    expect(errorsFor({ expirationDate: '00/26' })).toEqual(['expirationDate']);
    expect(errorsFor({ expirationDate: '1226' })).toEqual(['expirationDate']);
    expect(errorsFor({ expirationDate: '01/20' })).toEqual([]); // vencida: la decide el API
  });

  it('exige CVV de 3 dígitos y nombre', () => {
    expect(errorsFor({ cvv: '54' })).toEqual(['cvv']);
    expect(errorsFor({ cardholderName: '   ' })).toEqual(['cardholderName']);
  });

  it('monto: mínimo $50, máximo 2 decimales y sin tope superior (escenario 7)', () => {
    expect(errorsFor({ amount: '49.99' })).toEqual(['amount']);
    expect(errorsFor({ amount: '100.555' })).toEqual(['amount']);
    expect(errorsFor({ amount: 'abc' })).toEqual(['amount']);
    expect(errorsFor({ amount: '' })).toEqual(['amount']);
    expect(errorsFor({ amount: '50' })).toEqual([]);
    expect(errorsFor({ amount: '10,000.01' })).toEqual([]);
    expect(topUpSchema.parse({ ...valid, amount: '$1,000' }).amount).toBe(1000);
  });
});
