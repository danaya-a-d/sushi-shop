import { fileURLToPath } from 'node:url';
import { createPrismaClient } from '../src/prisma/create-prisma-client.js';
import { categories, products } from './seed-data.js';

try {
  process.loadEnvFile(fileURLToPath(new URL('../../../.env', import.meta.url)));
} catch {
  // нет файла: используем переменные процесса
}

const prisma = createPrismaClient();

/**
 * Повторно запускаемое наполнение: upsert по уникальным ключам, ничего не удаляется.
 * Поля, которыми может управлять оператор (например, isActive), при обновлении не трогаются.
 */
async function main() {
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

  const [categoryCount, productCount] = await Promise.all([
    prisma.category.count(),
    prisma.product.count(),
  ]);
  console.log(`Seed выполнен: категорий ${categoryCount}, товаров ${productCount}`);
}

main()
  .catch((error: unknown) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
