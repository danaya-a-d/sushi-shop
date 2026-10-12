import { products } from "@/data/products";
import { promos } from "@/data/promos";
import type { Product } from "@/types/product";
import type { Promo } from "@/types/promo";

// Единая точка доступа к данным каталога: позже заменится запросами к API.

export function getPromos(): readonly Promo[] {
  return promos;
}

export function getFeaturedProducts(): readonly Product[] {
  return products;
}
