import { BadRequestException } from '@nestjs/common';

export const DEFAULT_PAGE_SIZE = 12;
export const MAX_PAGE_SIZE = 50;

/** Позиция в упорядоченном списке товаров: порядок `sortOrder ASC, id ASC`. */
export type ProductCursor = { sortOrder: number; id: string };

const INT32_MAX = 2_147_483_647;
// Тот же набор символов, что у id товаров в by-ids
const CURSOR_ID_PATTERN = /^[A-Za-z0-9_-]{1,64}$/;

/**
 * Разбирает `?limit=`: целое от 1 до `max`; без параметра — `fallback`.
 * Всё остальное (повтор, не число, 0, больше максимума) — 400, а не молчаливое «исправление».
 */
export function parseLimit(
  raw: string | string[] | undefined,
  fallback: number,
  max: number,
): number {
  if (raw === undefined) return fallback;
  if (Array.isArray(raw)) {
    throw new BadRequestException(
      'Query parameter "limit" must be specified once',
    );
  }
  if (!/^\d{1,6}$/.test(raw)) {
    throw new BadRequestException(
      'Query parameter "limit" must be a positive integer',
    );
  }
  const limit = Number(raw);
  if (limit < 1 || limit > max) {
    throw new BadRequestException(
      `Query parameter "limit" must be between 1 and ${max}`,
    );
  }
  return limit;
}

/** Курсор непрозрачен для клиента: base64url от JSON `[sortOrder, id]`. Содержимое клиент не интерпретирует. */
export function encodeCursor(cursor: ProductCursor): string {
  return Buffer.from(JSON.stringify([cursor.sortOrder, cursor.id])).toString(
    'base64url',
  );
}

export function parseCursor(
  raw: string | string[] | undefined,
): ProductCursor | undefined {
  if (raw === undefined) return undefined;
  if (Array.isArray(raw)) {
    throw new BadRequestException(
      'Query parameter "cursor" must be specified once',
    );
  }
  const invalid = () => new BadRequestException('Invalid cursor');

  // base64url без паддинга; ограничение длины защищает от больших входов
  if (!/^[A-Za-z0-9_-]{1,200}$/.test(raw)) throw invalid();

  let value: unknown;
  try {
    value = JSON.parse(Buffer.from(raw, 'base64url').toString('utf8'));
  } catch {
    throw invalid();
  }

  if (!Array.isArray(value) || value.length !== 2) throw invalid();
  const [sortOrder, id] = value as unknown[];
  if (
    typeof sortOrder !== 'number' ||
    !Number.isInteger(sortOrder) ||
    Math.abs(sortOrder) > INT32_MAX ||
    typeof id !== 'string' ||
    !CURSOR_ID_PATTERN.test(id)
  ) {
    throw invalid();
  }
  return { sortOrder, id };
}
