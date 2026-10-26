import { ALL_CATEGORY, type Category, type CategorySlug } from "@/types/category";
import type { Product } from "@/types/product";

// Чистые функции над уже загруженными данными каталога (без обращения к API).

/** Значение из URL → slug известной категории; всё остальное (в том числе `all`) считается «Всё». */
export function parseCategory(
  value: string | string[] | undefined,
  categories: readonly Category[],
): CategorySlug {
  const slug = Array.isArray(value) ? value[0] : value;
  if (slug === undefined || slug === ALL_CATEGORY) return ALL_CATEGORY;
  return categories.find((category) => category.slug === slug)?.slug ?? ALL_CATEGORY;
}

/** Фильтры меню: виртуальная «Всё» + категории из API в порядке API. */
export function withAllCategory(categories: readonly Category[]): readonly Category[] {
  return [{ slug: ALL_CATEGORY, label: "Всё" }, ...categories];
}

/** Другие товары: сначала с общими категориями, затем остальные (порядок данных сохраняется). */
export function pickRelatedProducts(
  product: Product,
  candidates: readonly Product[],
  limit = 4,
): readonly Product[] {
  const shared = (item: Product) =>
    item.categories.filter((slug) => product.categories.includes(slug)).length;

  return candidates
    .filter((item) => item.id !== product.id)
    .sort((a, b) => shared(b) - shared(a))
    .slice(0, limit);
}
