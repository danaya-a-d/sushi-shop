import { parseAllowedOrigins } from './app.setup.js';

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
