import { kopecksToUah } from "@/lib/money";
import type { Category } from "@/types/category";
import type { Product } from "@/types/product";
import type { ApiCategory, ApiProduct } from "./types";

/** API → frontend Product: единственное место перевода копеек в гривны и переименования полей. */
export function toProduct(api: ApiProduct): Product {
  return {
    id: api.id,
    slug: api.slug,
    name: api.name,
    composition: api.composition,
    categories: api.categories,
    weight: api.weightGrams,
    price: kopecksToUah(api.priceKopecks),
    // null (данных нет) → поле отсутствует: блок «Пищевая ценность» не показывается
    ...(api.nutrition && { nutrition: api.nutrition }),
    image: api.image,
  };
}

export function toCategory(api: ApiCategory): Category {
  return { slug: api.slug, label: api.label };
}
