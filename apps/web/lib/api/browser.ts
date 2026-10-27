import type { Product, ProductsPage } from "@/types/product";
import { getJson, normalizeBaseUrl } from "./http";
import { toProduct, toProductsPage } from "./mappers";
import { CATALOG_PAGE_SIZE, type ProductsQuery, productsPath } from "./paths";
import { apiProductsByIdsSchema, apiProductsPageSchema } from "./types";

// Браузерный клиент (используется CartProvider). Ходит в NestJS напрямую по публичному адресу
// NEXT_PUBLIC_API_URL; сервер должен разрешать origin сайта через CORS (WEB_ORIGINS в API).
// Секретов здесь нет и быть не должно: значение попадает в клиентский bundle.

/** Должно совпадать с MAX_PRODUCT_IDS в apps/api/src/catalog/parse-product-ids.ts */
export const MAX_IDS_PER_REQUEST = 50;

export type ProductsByIds = {
  available: Product[];
  /** Отключены (isActive = false) */
  unavailable: string[];
  /** Не существуют */
  missing: string[];
};

export type FetchProductsByIds = (ids: readonly string[]) => Promise<ProductsByIds>;

function getBrowserApiUrl(): string {
  // Обращение именно к process.env.NEXT_PUBLIC_*: Next подставляет значение при сборке
  return normalizeBaseUrl(process.env.NEXT_PUBLIC_API_URL, "NEXT_PUBLIC_API_URL");
}

async function fetchChunk(
  ids: readonly string[],
  baseUrl: string,
  fetchImpl?: typeof fetch,
): Promise<ProductsByIds> {
  const data = await getJson(apiProductsByIdsSchema, {
    baseUrl,
    path: `/products/by-ids?ids=${ids.map(encodeURIComponent).join(",")}`,
    // Цена и доступность должны быть актуальными: браузерный HTTP-кэш не используем
    init: { cache: "no-store" },
    fetchImpl,
  });
  return { ...data, available: data.available.map(toProduct) };
}

/**
 * Пакетно получает товары корзины: один запрос на каждые MAX_IDS_PER_REQUEST id
 * (для корзины из нескольких позиций это ровно один запрос). Чанки идут параллельно;
 * если упал любой из них, отклоняется весь вызов: частичный результат не выдаётся.
 */
export function createFetchProductsByIds(options?: {
  baseUrl?: string;
  fetchImpl?: typeof fetch;
}): FetchProductsByIds {
  return async (ids) => {
    const unique = [...new Set(ids)];
    if (unique.length === 0) return { available: [], unavailable: [], missing: [] };

    const baseUrl = options?.baseUrl ?? getBrowserApiUrl();
    const chunks: string[][] = [];
    for (let i = 0; i < unique.length; i += MAX_IDS_PER_REQUEST) {
      chunks.push(unique.slice(i, i + MAX_IDS_PER_REQUEST));
    }

    const results = await Promise.all(
      chunks.map((chunk) => fetchChunk(chunk, baseUrl, options?.fetchImpl)),
    );
    return {
      available: results.flatMap((r) => r.available),
      unavailable: results.flatMap((r) => r.unavailable),
      missing: results.flatMap((r) => r.missing),
    };
  };
}

export const fetchProductsByIds: FetchProductsByIds = (ids) =>
  createFetchProductsByIds()(ids);

export type FetchProductsPage = (
  query: ProductsQuery & { signal?: AbortSignal },
) => Promise<ProductsPage>;

/** Следующие страницы каталога для кнопки «Показать ещё» (первая страница приходит с сервера). */
export function createFetchProductsPage(options?: {
  baseUrl?: string;
  fetchImpl?: typeof fetch;
}): FetchProductsPage {
  return async ({ signal, ...query }) => {
    const data = await getJson(apiProductsPageSchema, {
      baseUrl: options?.baseUrl ?? getBrowserApiUrl(),
      path: productsPath({ limit: CATALOG_PAGE_SIZE, ...query }),
      init: { cache: "no-store", signal },
      fetchImpl: options?.fetchImpl,
    });
    return toProductsPage(data);
  };
}

export const fetchProductsPage: FetchProductsPage = (query) => createFetchProductsPage()(query);
