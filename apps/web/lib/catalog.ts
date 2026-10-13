import { categories } from "@/data/categories";
import { products } from "@/data/products";
import { promos } from "@/data/promos";
import type { Category, CategorySlug } from "@/types/category";
import type { Product } from "@/types/product";
import type { Promo } from "@/types/promo";

// Единая точка доступа к данным каталога: позже заменится запросами к API.

export function getPromos(): readonly Promo[] {
  return promos;
}

export function getFeaturedProducts(): readonly Product[] {
  return products;
}

export function getCategories(): readonly Category[] {
  return categories;
}

/** Значение из URL → известная категория; всё остальное считается «Всё». */
export function parseCategory(value: string | string[] | undefined): CategorySlug {
  const slug = Array.isArray(value) ? value[0] : value;
  return categories.find((category) => category.slug === slug)?.slug ?? "all";
}

export function getProducts(category: CategorySlug = "all"): readonly Product[] {
  if (category === "all") return products;
  return products.filter((product) => product.categories.includes(category));
}
