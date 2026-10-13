import type { Category } from "@/types/category";

// Порядок и названия — из фильтров макета «Меню».
export const categories: readonly Category[] = [
  { slug: "all", label: "Всё" },
  { slug: "hits", label: "Хиты продаж" },
  { slug: "new", label: "Новинки" },
  { slug: "sushi", label: "Суши" },
  { slug: "rolls", label: "Роллы" },
  { slug: "sashimi", label: "Сашими" },
  { slug: "soups", label: "Супы" },
  { slug: "salads", label: "Салаты" },
  { slug: "desserts", label: "Десерты" },
];
