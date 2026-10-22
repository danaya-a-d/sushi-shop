import type { Prisma } from '../generated/prisma/client.js';
import {
  CATALOG_CURRENCY,
  type CategoryResponse,
  type ProductResponse,
} from './catalog.types.js';

// select перечисляет только публичные поля: isActive, sortOrder, createdAt и т. п. из БД не выходят
export const categorySelect = {
  slug: true,
  label: true,
} satisfies Prisma.CategorySelect;

export const productSelect = {
  id: true,
  slug: true,
  name: true,
  composition: true,
  weightGrams: true,
  priceKopecks: true,
  calories: true,
  protein: true,
  fat: true,
  carbs: true,
  imageSrc: true,
  imageWidth: true,
  imageHeight: true,
  categories: {
    select: { slug: true },
    orderBy: [{ sortOrder: 'asc' }, { id: 'asc' }],
  },
} satisfies Prisma.ProductSelect;

export type CategoryRow = Prisma.CategoryGetPayload<{
  select: typeof categorySelect;
}>;
export type ProductRow = Prisma.ProductGetPayload<{
  select: typeof productSelect;
}>;

export function toCategoryResponse(row: CategoryRow): CategoryResponse {
  return { slug: row.slug, label: row.label };
}

export function toProductResponse(row: ProductRow): ProductResponse {
  const { calories, protein, fat, carbs } = row;
  const hasNutrition =
    calories !== null && protein !== null && fat !== null && carbs !== null;

  return {
    id: row.id,
    slug: row.slug,
    name: row.name,
    composition: row.composition,
    categories: row.categories.map((category) => category.slug),
    weightGrams: row.weightGrams,
    priceKopecks: row.priceKopecks,
    currency: CATALOG_CURRENCY,
    nutrition: hasNutrition ? { calories, protein, fat, carbs } : null,
    image: {
      src: row.imageSrc,
      width: row.imageWidth,
      height: row.imageHeight,
    },
  };
}
