import { BadRequestException } from '@nestjs/common';
import { MAX_PRODUCT_IDS, parseProductIds } from './parse-product-ids.js';

describe('parseProductIds', () => {
  it('разбирает список и сохраняет порядок', () => {
    expect(parseProductIds('3,1,2')).toEqual(['3', '1', '2']);
  });

  it('убирает дубликаты, оставляя первое вхождение', () => {
    expect(parseProductIds('1,2,1,2,3')).toEqual(['1', '2', '3']);
  });

  it('принимает uuid-подобные и строковые id', () => {
    expect(parseProductIds('test-inactive,0192f3a4_b5')).toEqual([
      'test-inactive',
      '0192f3a4_b5',
    ]);
  });

  it.each([
    ['отсутствует', undefined],
    ['пустой', ''],
    ['повторён', ['1', '2']],
    ['пустой элемент (двойная запятая)', '1,,2'],
    ['завершающая запятая', '1,2,'],
    ['пробел', '1, 2'],
    ['недопустимые символы', '1,2;drop'],
    ['слишком длинный id', 'a'.repeat(65)],
  ])('400, если параметр %s', (_name, value) => {
    expect(() => parseProductIds(value)).toThrow(BadRequestException);
  });

  it('допускает ровно MAX_PRODUCT_IDS id и отвергает на один больше', () => {
    const make = (n: number) =>
      Array.from({ length: n }, (_, i) => `p${i}`).join(',');
    expect(parseProductIds(make(MAX_PRODUCT_IDS))).toHaveLength(
      MAX_PRODUCT_IDS,
    );
    expect(() => parseProductIds(make(MAX_PRODUCT_IDS + 1))).toThrow(
      BadRequestException,
    );
  });

  it('лимит считается до удаления дубликатов', () => {
    expect(() =>
      parseProductIds(Array(MAX_PRODUCT_IDS + 1).fill('1').join(',')),
    ).toThrow(BadRequestException);
  });
});
