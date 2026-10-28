import { z } from "zod";

// Контракт ответов NestJS API (apps/api/src/catalog/catalog.types.ts). Деньги — целые минимальные единицы валюты (для KZT тиыны).
// Схемы проверяют ответ в рантайме: неожиданная форма даёт понятную ошибку, а не «undefined ₸».
// Это сырой контракт API; дальше во frontend идут только типы из @/types после mapper-а.

export const apiCategorySchema = z.object({
  slug: z.string(),
  label: z.string(),
});

const apiNutritionSchema = z.object({
  calories: z.number(),
  protein: z.number(),
  fat: z.number(),
  carbs: z.number(),
});

export const apiProductSchema = z.object({
  id: z.string(),
  slug: z.string(),
  name: z.string(),
  composition: z.string(),
  categories: z.array(z.string()),
  weightGrams: z.number(),
  priceMinorUnits: z.number().int().nonnegative(),
  currency: z.literal("KZT"),
  nutrition: apiNutritionSchema.nullable(),
  image: z.object({
    src: z.string(),
    width: z.number(),
    height: z.number(),
  }),
});

/** Ответ `GET /products/by-ids`: каждый запрошенный id ровно в одном списке. */
export const apiProductsByIdsSchema = z.object({
  available: z.array(apiProductSchema),
  /** Товар есть, но отключён: приходит только id */
  unavailable: z.array(z.string()),
  /** Товара с таким id нет */
  missing: z.array(z.string()),
});

export const apiCategoriesSchema = z.array(apiCategorySchema);
/** Ответ `GET /products/:slug/related`: обычный массив (не больше limit) */
export const apiProductsSchema = z.array(apiProductSchema);

/** Ответ `GET /products`: страница каталога. nextCursor — непрозрачная строка или null в конце списка. */
export const apiProductsPageSchema = z.object({
  items: z.array(apiProductSchema),
  nextCursor: z.string().min(1).nullable(),
});

export type ApiCategory = z.infer<typeof apiCategorySchema>;
export type ApiProduct = z.infer<typeof apiProductSchema>;
export type ApiProductsPage = z.infer<typeof apiProductsPageSchema>;
export type ApiProductsByIds = z.infer<typeof apiProductsByIdsSchema>;
