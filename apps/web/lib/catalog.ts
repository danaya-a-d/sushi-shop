import { cacheLife, cacheTag } from "next/cache";
import { apiGet } from "@/lib/api/server";
import { ApiError } from "@/lib/api/http";
import { toCategory, toProduct, toProductsPage } from "@/lib/api/mappers";
import {
  CATALOG_PAGE_SIZE,
  type ProductsQuery,
  productsPath,
  relatedProductsPath,
} from "@/lib/api/paths";
import {
  apiCategoriesSchema,
  apiProductSchema,
  apiProductsPageSchema,
  apiProductsSchema,
} from "@/lib/api/types";
import type { Category } from "@/types/category";
import type { Product, ProductsPage } from "@/types/product";
import type { Promo } from "@/types/promo";
import { promos } from "@/data/promos";

// Каталог для Server Components: данные берутся из NestJS API.
// Ошибки API (сеть, 5xx, неверный формат) пробрасываются наружу и в кэш не попадают;
// подставлять вместо них заглушки нельзя.
// Ни одна функция не загружает весь каталог: каждая запрашивает ограниченную выборку (страницу).

// Списки (главная, меню, рекомендации): обычный fetch с revalidate. Ответ API живёт в кэше данных
// Next не дольше минуты и обновляется в фоне; при сборке эти запросы не выполняются (они идут при запросе
// страницы, внутри Suspense), поэтому build не требует работающего API.
const LIST_REVALIDATE_SECONDS = 60;

// Страница товара: обновляется в фоне раз в 5 минут.
// Благодаря prerender-у известных slug неизвестный даёт настоящий HTTP 404, а не «мягкий» из Suspense.
const PRODUCT_CACHE = { stale: 300, revalidate: 300, expire: 3600 } as const;

/** Сколько товаров в секции «Горячее» на главной */
export const FEATURED_LIMIT = 8;
/** Категория секции «Горячее» */
export const FEATURED_CATEGORY = "hits";
/** Сколько товаров в «Может понравиться» на странице оформления */
export const RECOMMENDED_LIMIT = 8;
/** Сколько товаров в «Может понравиться» на странице товара */
export const RELATED_LIMIT = 4;
/** Сколько страниц товаров собирается заранее при сборке (если API доступен) */
export const PRERENDER_PRODUCTS_LIMIT = 50;

/** Акции пока не в API: остаются статическими данными. */
export function getPromos(): readonly Promo[] {
  return promos;
}

/** Реальные категории из API (без виртуальной «Всё»). */
export async function getCategories(): Promise<readonly Category[]> {
  const data = await apiGet(apiCategoriesSchema, "/categories", {
    revalidate: LIST_REVALIDATE_SECONDS,
  });
  return data.map(toCategory);
}

/**
 * Одна страница активных товаров. `all` в API не отправляется: «Всё» — запрос без параметра category.
 * Неизвестная категория даст ошибку API 400, поэтому slug нужно предварительно
 * сверять со списком категорий (parseCategory).
 */
export async function getProductsPage(
  query: ProductsQuery = {},
): Promise<ProductsPage> {
  const data = await apiGet(
    apiProductsPageSchema,
    productsPath({ limit: CATALOG_PAGE_SIZE, ...query }),
    { revalidate: LIST_REVALIDATE_SECONDS },
  );
  return toProductsPage(data);
}

/** «Горячее» на главной: не больше FEATURED_LIMIT товаров категории hits. */
export async function getFeaturedProducts(): Promise<readonly Product[]> {
  const page = await getProductsPage({ category: FEATURED_CATEGORY, limit: FEATURED_LIMIT });
  return page.items;
}

/** «Может понравиться» на checkout: ограниченная выборка активных товаров, без отдельного endpoint. */
export async function getRecommendedProducts(): Promise<readonly Product[]> {
  const page = await getProductsPage({ limit: RECOMMENDED_LIMIT });
  return page.items;
}

/** Товар по slug или undefined, если его нет / он отключён (404 API). Остальные ошибки пробрасываются. */
export async function getProductBySlug(slug: string): Promise<Product | undefined> {
  "use cache";
  cacheLife(PRODUCT_CACHE);
  cacheTag("catalog");

  try {
    const data = await apiGet(apiProductSchema, `/products/${encodeURIComponent(slug)}`);
    return toProduct(data);
  } catch (error) {
    if (error instanceof ApiError && error.kind === "http" && error.status === 404) {
      return undefined;
    }
    throw error;
  }
}

/**
 * «Может понравиться» на странице товара: не больше RELATED_LIMIT товаров. Подбор (общие категории,
 * дополнение другими товарами, исключение текущего) делает API. Профиль кэша — как у страницы товара.
 */
export async function getRelatedProducts(slug: string): Promise<readonly Product[]> {
  "use cache";
  cacheLife(PRODUCT_CACHE);
  cacheTag("catalog");

  const data = await apiGet(apiProductsSchema, relatedProductsPath(slug, RELATED_LIMIT));
  return data.map(toProduct);
}

/** Slug товаров для предварительной сборки страниц: ограниченная первая выборка, а не весь каталог. */
export async function getProductSlugsForPrerender(): Promise<string[]> {
  const page = await getProductsPage({ limit: PRERENDER_PRODUCTS_LIMIT });
  return page.items.map((product) => product.slug);
}
