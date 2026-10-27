import { BadRequestException } from '@nestjs/common';
import {
  encodeCursor,
  MAX_PAGE_SIZE,
  parseCursor,
  parseLimit,
} from './pagination.js';

describe('parseLimit', () => {
  it('без параметра возвращает значение по умолчанию', () => {
    expect(parseLimit(undefined, 12, 50)).toBe(12);
  });

  it.each([
    ['1', 1],
    ['12', 12],
    ['50', 50],
  ])('принимает %s', (raw, expected) => {
    expect(parseLimit(raw, 12, MAX_PAGE_SIZE)).toBe(expected);
  });

  it.each([
    ['ноль', '0'],
    ['больше максимума', '51'],
    ['отрицательное', '-1'],
    ['дробное', '1.5'],
    ['не число', 'abc'],
    ['пустая строка', ''],
    ['с пробелом', ' 5'],
    ['экспонента', '1e1'],
    ['повтор', ['1', '2']],
  ])('400: %s', (_name, raw) => {
    expect(() => parseLimit(raw, 12, 50)).toThrow(BadRequestException);
  });
});

describe('cursor', () => {
  it('кодируется и разбирается без потерь', () => {
    const cursor = { sortOrder: 7, id: 'demo-01' };
    expect(parseCursor(encodeCursor(cursor))).toEqual(cursor);
  });

  it('поддерживает отрицательный sortOrder', () => {
    const cursor = { sortOrder: -3, id: '8' };
    expect(parseCursor(encodeCursor(cursor))).toEqual(cursor);
  });

  it('без параметра курсора нет', () => {
    expect(parseCursor(undefined)).toBeUndefined();
  });

  it('курсор непрозрачен: безопасный для URL алфавит без паддинга', () => {
    expect(encodeCursor({ sortOrder: 1, id: 'a' })).toMatch(/^[A-Za-z0-9_-]+$/);
  });

  const b64 = (value: unknown) =>
    Buffer.from(JSON.stringify(value)).toString('base64url');

  it.each([
    ['пустая строка', ''],
    ['повтор', ['a', 'b']],
    ['не base64url', 'not a cursor!'],
    ['не JSON', Buffer.from('hello').toString('base64url')],
    ['не массив', b64({ sortOrder: 1, id: 'a' })],
    ['неверная длина', b64([1])],
    ['sortOrder не число', b64(['1', 'a'])],
    ['sortOrder дробный', b64([1.5, 'a'])],
    ['sortOrder вне int32', b64([2 ** 31, 'a'])],
    ['id не строка', b64([1, 5])],
    ['id с недопустимыми символами', b64([1, "a'; drop"])],
    ['слишком длинный', 'A'.repeat(201)],
  ])('400: %s', (_name, raw) => {
    expect(() => parseCursor(raw)).toThrow(BadRequestException);
  });
});
