import { cacheLife, cacheTag } from "next/cache";
import { apiGet } from "@/lib/api/server";
import { ApiError } from "@/lib/api/http";
import { toCategory, toProduct } from "@/lib/api/mappers";
import { apiCategoriesSchema, apiProductSchema, apiProductsSchema } from "@/lib/api/types";
import { ALL_CATEGORY, type Category, type CategorySlug } from "@/types/category";
import type { Product } from "@/types/product";
import type { Promo } from "@/types/promo";
import { promos } from "@/data/promos";

// Каталог для Server Components: данные берутся из NestJS API.
// Ошибки API (сеть, 5xx, неверный формат) пробрасываются наружу и в кэш не попадают;
// подставлять вместо них заглушки нельзя.

// Списки (главная, меню, рекомендации): обычный fetch с revalidate. Ответ API живёт в кэше данных
// Next не дольше минуты и обновляется в фоне; при сборке эти запросы не выполняются (они идут при запросе
// страницы, внутри Suspense), поэтому build не требует работающего API.
const LIST_REVALIDATE_SECONDS = 60;

// Страница товара: собирается заранее (generateStaticParams) и обновляется в фоне раз в 5 минут.
// Благодаря этому неизвестный slug даёт настоящий HTTP 404, а не «мягкий» из Suspense.
const PRODUCT_CACHE = { stale: 300, revalidate: 300, expire: 3600 } as const;

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
 * Активные товары. `all` в API не отправляется: «Всё» — это запрос без параметра category.
 * Неизвестная категория даст ошибку API 400, поэтому slug нужно предварительно
 * сверять со списком категорий (parseCategory).
 */
export async function getProducts(
  category: CategorySlug = ALL_CATEGORY,
): Promise<readonly Product[]> {
  const path =
    category === ALL_CATEGORY ? "/products" : `/products?category=${encodeURIComponent(category)}`;
  const data = await apiGet(apiProductsSchema, path, { revalidate: LIST_REVALIDATE_SECONDS });
  return data.map(toProduct);
}

/** Товары для витрин (главная, рекомендации). Пока это весь активный каталог. */
export function getFeaturedProducts(): Promise<readonly Product[]> {
  return getProducts();
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
 * Кандидаты для «Может понравиться» на странице товара. Отдельная функция с профилем страницы
 * товара: блок кэшируется и обновляется вместе со страницей. Пока это весь активный каталог;
 * при большом ассортименте её заменит выборка по категории с лимитом.
 */
export async function getRelatedCandidates(): Promise<readonly Product[]> {
  "use cache";
  cacheLife(PRODUCT_CACHE);
  cacheTag("catalog");

  const data = await apiGet(apiProductsSchema, "/products");
  return data.map(toProduct);
}
