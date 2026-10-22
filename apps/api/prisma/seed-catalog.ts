import type { PrismaClient } from '../src/generated/prisma/client.js';
import { categories, products } from './seed-data.js';

/**
 * Повторно запускаемое наполнение: upsert по уникальным ключам, ничего не удаляется.
 * Поля, которыми может управлять оператор (например, isActive), при обновлении не трогаются.
 */
export async function seedCatalog(prisma: PrismaClient): Promise<void> {
  for (const [index, category] of categories.entries()) {
    await prisma.category.upsert({
      where: { slug: category.slug },
      create: { ...category, sortOrder: index },
      update: { label: category.label, sortOrder: index },
    });
  }

  for (const [index, { categorySlugs, ...product }] of products.entries()) {
    const connect = categorySlugs.map((slug) => ({ slug }));
    await prisma.product.upsert({
      where: { id: product.id },
      create: { ...product, sortOrder: index, categories: { connect } },
      // set заменяет набор связей на актуальный, но не удаляет ни категории, ни товары
      update: { ...product, sortOrder: index, categories: { set: connect } },
    });
  }
}
