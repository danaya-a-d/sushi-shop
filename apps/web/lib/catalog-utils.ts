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

/** Добавляет новую страницу к уже показанным товарам, пропуская те, чей id уже есть (порядок сохраняется). */
export function appendUnique(current: readonly Product[], next: readonly Product[]): Product[] {
  const seen = new Set(current.map((product) => product.id));
  const added = next.filter((product) => {
    if (seen.has(product.id)) return false;
    seen.add(product.id);
    return true;
  });
  return added.length === 0 ? [...current] : [...current, ...added];
}
