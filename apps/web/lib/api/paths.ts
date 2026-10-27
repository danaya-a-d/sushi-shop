import { ALL_CATEGORY, type CategorySlug } from "@/types/category";

// Адреса эндпоинтов каталога. Общие для серверного и браузерного клиентов, чтобы параметры
// запроса (в частности правило «all не отправляется») формировались в одном месте.

/** Размер страницы каталога. Передаётся в API явно, чтобы не зависеть от значения по умолчанию на сервере. */
export const CATALOG_PAGE_SIZE = 12;

export type ProductsQuery = {
  /** `all` (или не задано) — все категории: параметр category в API не отправляется */
  category?: CategorySlug;
  limit?: number;
  cursor?: string | null;
};

export function productsPath({ category, limit, cursor }: ProductsQuery = {}): string {
  const params = new URLSearchParams();
  if (category !== undefined && category !== ALL_CATEGORY) params.set("category", category);
  if (limit !== undefined) params.set("limit", String(limit));
  if (cursor) params.set("cursor", cursor);
  const query = params.toString();
  return query ? `/products?${query}` : "/products";
}

export function relatedProductsPath(slug: string, limit?: number): string {
  const query = limit === undefined ? "" : `?limit=${limit}`;
  return `/products/${encodeURIComponent(slug)}/related${query}`;
}
