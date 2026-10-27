/**
 * Публичный контракт API каталога. Деньги всегда целые числа в копейках (поле заканчивается на
 * `Kopecks`) с явной валютой; гривны (как в моках фронтенда) получаются делением на 100 на клиенте.
 */

export const CATALOG_CURRENCY = 'UAH';

export type CategoryResponse = {
  slug: string;
  label: string;
};

export type NutritionResponse = {
  /** ккал на 100 г */
  calories: number;
  /** г на 100 г */
  protein: number;
  fat: number;
  carbs: number;
};

export type ProductResponse = {
  id: string;
  slug: string;
  name: string;
  composition: string;
  /** Slug категорий в порядке сортировки категорий */
  categories: string[];
  weightGrams: number;
  priceKopecks: number;
  currency: typeof CATALOG_CURRENCY;
  /** null, пока данных о пищевой ценности нет */
  nutrition: NutritionResponse | null;
  image: { src: string; width: number; height: number };
};

/**
 * Ответ `GET /products/by-ids` для корзины. Каждый запрошенный id попадает ровно в один список:
 * - `available` — активные товары (полные данные, в порядке запроса);
 * - `unavailable` — товар есть, но отключён (isActive = false): отдаётся только id, без данных;
 * - `missing` — товара с таким id нет.
 */
export type ProductsByIdsResponse = {
  available: ProductResponse[];
  unavailable: string[];
  missing: string[];
};

/**
 * Ответ `GET /products`: страница каталога.
 * `nextCursor` — непрозрачный курсор следующей страницы или null, если товары закончились.
 */
export type ProductsPageResponse = {
  items: ProductResponse[];
  nextCursor: string | null;
};
