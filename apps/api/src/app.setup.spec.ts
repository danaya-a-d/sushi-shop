import { parseAllowedOrigins, parseApiPrefix } from './app.setup.js';

describe('parseApiPrefix', () => {
  it('пусто или не задано — без префикса', () => {
    expect(parseApiPrefix('')).toBe('');
    expect(parseApiPrefix('  ')).toBe('');
    expect(parseApiPrefix(undefined)).toBe('');
  });

  it('нормализует слэши: /api, api/ и /api/ дают api', () => {
    expect(parseApiPrefix('/api')).toBe('api');
    expect(parseApiPrefix('api/')).toBe('api');
    expect(parseApiPrefix(' /api/ ')).toBe('api');
  });
});

describe('parseAllowedOrigins', () => {
  it('разбирает список, убирает пробелы и завершающие слэши', () => {
    expect(
      parseAllowedOrigins(' http://localhost:3000/ , https://shop.example '),
    ).toEqual(['http://localhost:3000', 'https://shop.example']);
  });

  it('пустое значение — пустой список (CORS выключен)', () => {
    expect(parseAllowedOrigins('')).toEqual([]);
    expect(parseAllowedOrigins(undefined)).toEqual([]);
  });
});
