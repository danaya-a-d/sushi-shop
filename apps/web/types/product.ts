import type { CategorySlug } from "@/types/category";

/** Пищевая ценность на 100 г продукта */
export type Nutrition = {
  /** ккал */
  calories: number;
  /** г */
  protein: number;
  /** г */
  fat: number;
  /** г */
  carbs: number;
};

export type Product = {
  id: string;
  slug: string;
  name: string;
  composition: string;
  categories: readonly CategorySlug[];
  /** Вес порции в граммах */
  weight: number;
  /** Цена в тенге (KZT) */
  price: number;
  /** Пока нет данных — блок «Пищевая ценность» не показывается */
  nutrition?: Nutrition;
  image: {
    src: string;
    width: number;
    height: number;
  };
};

/** Страница каталога: товары и курсор следующей страницы (null — товары закончились) */
export type ProductsPage = {
  items: Product[];
  nextCursor: string | null;
};
