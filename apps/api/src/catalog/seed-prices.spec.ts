import { describe, expect, it } from 'vitest';
import { demoProducts, DEMO_PRODUCT_COUNT } from '../../prisma/demo-data.js';
import { products, tengeToMinorUnits } from '../../prisma/seed-data.js';

describe('цены демо-данных в тенге (KZT)', () => {
  it('tengeToMinorUnits переводит целые тенге в тиыны без дробной части', () => {
    expect(tengeToMinorUnits(4500)).toBe(450000);
  });

  it('основные товары: 8 штук, цены целые, правдоподобные и не одинаковые', () => {
    expect(products).toHaveLength(8);
    const prices = products.map((p) => p.priceMinorUnits);
    for (const price of prices) {
      expect(Number.isInteger(price)).toBe(true);
      expect(price % 100).toBe(0);
      expect(price).toBeGreaterThanOrEqual(tengeToMinorUnits(3000));
      expect(price).toBeLessThanOrEqual(tengeToMinorUnits(6000));
    }
    expect(new Set(prices).size).toBeGreaterThan(1);
  });

  it('демо-товары: 40 штук, цены целые тенге и положительные', () => {
    expect(demoProducts).toHaveLength(DEMO_PRODUCT_COUNT);
    for (const product of demoProducts) {
      expect(Number.isInteger(product.priceMinorUnits)).toBe(true);
      expect(product.priceMinorUnits % 100).toBe(0);
      expect(product.priceMinorUnits).toBeGreaterThan(0);
    }
  });
});
