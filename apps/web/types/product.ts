import type { CategorySlug } from "@/types/category";

export type Product = {
  id: string;
  slug: string;
  name: string;
  composition: string;
  categories: readonly CategorySlug[];
  /** Вес порции в граммах */
  weight: number;
  /** Цена в гривнах */
  price: number;
  image: {
    src: string;
    width: number;
    height: number;
  };
};
