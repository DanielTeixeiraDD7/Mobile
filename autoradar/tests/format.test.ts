import { describe, expect, it } from 'vitest';
import { lireNombre, euros, kms } from '../src/lib/format';

describe('format', () => {
  it('lit les nombres saisis librement', () => {
    expect(lireNombre('21 500 €')).toBe(21500);
    expect(lireNombre('21.500')).toBe(21500);
    expect(lireNombre('21,500')).toBe(21500);
    expect(lireNombre('21500,50')).toBe(21500.5);
    expect(lireNombre('45 000 km')).toBe(45000);
    expect(lireNombre('')).toBeNull();
    expect(lireNombre('abc')).toBeNull();
  });
  it('formate euros et km', () => {
    expect(euros(21500).replace(/\s/g, ' ')).toBe('21 500 €');
    expect(euros(null)).toBe('—');
    expect(kms(45000).replace(/\s/g, ' ')).toBe('45 000 km');
  });
});
