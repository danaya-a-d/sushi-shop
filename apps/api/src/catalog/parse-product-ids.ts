import { BadRequestException } from '@nestjs/common';

/** Максимум идентификаторов в одном запросе (до удаления дубликатов): ограничивает размер запроса и IN-списка. */
export const MAX_PRODUCT_IDS = 50;

// Допустимые символы id: сейчас это '1'…'8', позже возможны uuid/slug-подобные значения
const PRODUCT_ID_PATTERN = /^[A-Za-z0-9_-]{1,64}$/;

/**
 * Разбирает `?ids=1,2,3` в список уникальных id в порядке первого появления.
 * Бросает 400, если параметр отсутствует/повторён/пуст, содержит пустые или недопустимые
 * элементы либо их больше MAX_PRODUCT_IDS.
 */
export function parseProductIds(raw: string | string[] | undefined): string[] {
  if (raw === undefined) {
    throw new BadRequestException('Query parameter "ids" is required');
  }
  if (Array.isArray(raw)) {
    throw new BadRequestException(
      'Query parameter "ids" must be specified once',
    );
  }
  if (typeof raw !== 'string' || raw === '') {
    throw new BadRequestException('Query parameter "ids" must not be empty');
  }

  const parts = raw.split(',');
  if (parts.length > MAX_PRODUCT_IDS) {
    throw new BadRequestException(
      `Too many ids: at most ${MAX_PRODUCT_IDS} are allowed per request`,
    );
  }
  if (parts.some((id) => !PRODUCT_ID_PATTERN.test(id))) {
    throw new BadRequestException(
      'Query parameter "ids" must be a comma-separated list of valid product ids',
    );
  }

  return [...new Set(parts)];
}
