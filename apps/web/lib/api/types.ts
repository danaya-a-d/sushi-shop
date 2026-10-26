import { z } from "zod";

// Контракт ответов NestJS API (apps/api/src/catalog/catalog.types.ts). Деньги — целые копейки.
// Схемы проверяют ответ в рантайме: неожиданная форма даёт понятную ошибку, а не «undefined грн».
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
  priceKopecks: z.number().int().nonnegative(),
  currency: z.literal("UAH"),
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
export const apiProductsSchema = z.array(apiProductSchema);

export type ApiCategory = z.infer<typeof apiCategorySchema>;
export type ApiProduct = z.infer<typeof apiProductSchema>;
export type ApiProductsByIds = z.infer<typeof apiProductsByIdsSchema>;
