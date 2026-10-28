import { toCategoryResponse, toProductResponse } from './catalog.mapper.js';
import type { ProductRow } from './catalog.mapper.js';

const row: ProductRow = {
  id: '1',
  slug: 'baked-crab',
  name: 'Запеченный краб',
  composition: 'состав',
  weightGrams: 450,
  priceMinorUnits: 125000,
  calories: 180,
  protein: 6,
  fat: 5,
  carbs: 27,
  imageSrc: '/images/products/roll-01.webp',
  imageWidth: 10,
  imageHeight: 20,
  categories: [{ slug: 'hits' }, { slug: 'rolls' }],
};

describe('toProductResponse', () => {
  it('сохраняет цену в минимальных единицах и добавляет валюту, не переводя в тенге', () => {
    const product = toProductResponse(row);
    expect(product.priceMinorUnits).toBe(125000);
    expect(product.currency).toBe('KZT');
    expect(product).not.toHaveProperty('price');
  });

  it('превращает категории в список slug и группирует изображение', () => {
    const product = toProductResponse(row);
    expect(product.categories).toEqual(['hits', 'rolls']);
    expect(product.image).toEqual({
      src: '/images/products/roll-01.webp',
      width: 10,
      height: 20,
    });
  });

  it('собирает пищевую ценность в объект', () => {
    expect(toProductResponse(row).nutrition).toEqual({
      calories: 180,
      protein: 6,
      fat: 5,
      carbs: 27,
    });
  });

  it('при неполных данных о пищевой ценности возвращает null', () => {
    expect(toProductResponse({ ...row, protein: null }).nutrition).toBeNull();
    expect(
      toProductResponse({ ...row, calories: null, protein: null, fat: null, carbs: null })
        .nutrition,
    ).toBeNull();
  });

  it('не отдаёт лишние поля', () => {
    expect(Object.keys(toProductResponse(row)).sort()).toEqual([
      'categories',
      'composition',
      'currency',
      'id',
      'image',
      'name',
      'nutrition',
      'priceMinorUnits',
      'slug',
      'weightGrams',
    ]);
  });
});

describe('toCategoryResponse', () => {
  it('возвращает slug и label', () => {
    expect(toCategoryResponse({ slug: 'rolls', label: 'Роллы' })).toEqual({
      slug: 'rolls',
      label: 'Роллы',
    });
  });
});
