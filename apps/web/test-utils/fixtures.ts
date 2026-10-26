import { vi } from "vitest";
import type { FetchProductsByIds, ProductsByIds } from "@/lib/api/browser";
import type { ApiProduct } from "@/lib/api/types";
import type { Product } from "@/types/product";

// Управляемые данные для тестов: настоящий API и PostgreSQL не нужны.

export function makeProduct(id: string, overrides: Partial<Product> = {}): Product {
  return {
    id,
    slug: `product-${id}`,
    name: `Ролл ${id}`,
    composition: "рис, нори, лосось",
    categories: ["rolls"],
    weight: 450,
    price: 1250,
    image: { src: `/images/products/roll-0${id}.webp`, width: 100, height: 100 },
    ...overrides,
  };
}

export function makeApiProduct(id: string, overrides: Partial<ApiProduct> = {}): ApiProduct {
  return {
    id,
    slug: `product-${id}`,
    name: `Ролл ${id}`,
    composition: "рис, нори, лосось",
    categories: ["rolls"],
    weightGrams: 450,
    priceKopecks: 125000,
    currency: "UAH",
    nutrition: null,
    image: { src: "/images/products/roll-01.webp", width: 100, height: 100 },
    ...overrides,
  };
}

/**
 * Поддельный пакетный запрос корзины. Состояние каталога меняется на ходу:
 * `setProduct` (цена/новый товар), `deactivate`, `remove`, `failNext` (ошибка API).
 * `calls` хранит id каждого запроса: по ним проверяют, сколько и каких запросов было.
 */
export function createFakeCatalog(initial: Product[] = []) {
  const products = new Map(initial.map((product) => [product.id, product]));
  const inactive = new Set<string>();
  let failures = 0;
  const calls: string[][] = [];

  const respond = (ids: readonly string[]): ProductsByIds => {
    const result: ProductsByIds = { available: [], unavailable: [], missing: [] };
    for (const id of ids) {
      const product = products.get(id);
      if (!product) result.missing.push(id);
      else if (inactive.has(id)) result.unavailable.push(id);
      else result.available.push(product);
    }
    return result;
  };

  const fetchProducts = vi.fn<FetchProductsByIds>(async (ids) => {
    calls.push([...ids]);
    if (failures > 0) {
      failures -= 1;
      throw new Error("API недоступен");
    }
    return respond(ids);
  });

  return {
    fetchProducts,
    calls,
    setProduct: (product: Product) => {
      products.set(product.id, product);
    },
    deactivate: (id: string) => void inactive.add(id),
    remove: (id: string) => void products.delete(id),
    failNext: (times = 1) => {
      failures = times;
    },
  };
}

/** Запрос, ответом на который тест управляет вручную (для проверки гонок и устаревших ответов). */
export function deferred<T>() {
  let resolve!: (value: T) => void;
  let reject!: (reason?: unknown) => void;
  const promise = new Promise<T>((res, rej) => {
    resolve = res;
    reject = rej;
  });
  return { promise, resolve, reject };
}
