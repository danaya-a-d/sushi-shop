import type { PrismaClient } from '../src/generated/prisma/client.js';
import { DEMO_PREFIX, demoProducts } from './demo-data.js';

/**
 * Идемпотентное добавление демонстрационных товаров: upsert по id, повторный запуск дублей не создаёт.
 * Категории должны существовать (основной seed): новые категории здесь не создаются.
 * Основные товары не читаются и не меняются.
 */
export async function seedDemoCatalog(prisma: PrismaClient): Promise<void> {
  for (const { categorySlugs, ...product } of demoProducts) {
    const connect = categorySlugs.map((slug) => ({ slug }));
    await prisma.product.upsert({
      where: { id: product.id },
      create: { ...product, categories: { connect } },
      update: { ...product, categories: { set: connect } },
    });
  }
}

/**
 * Удаляет только демонстрационные товары: id и slug начинаются с `demo-`.
 * Позиции заказов сохраняются (productId обнуляется по onDelete: SetNull, снимок остаётся).
 * @returns количество удалённых товаров
 */
export async function cleanDemoCatalog(prisma: PrismaClient): Promise<number> {
  const { count } = await prisma.product.deleteMany({
    where: {
      id: { startsWith: DEMO_PREFIX },
      slug: { startsWith: DEMO_PREFIX },
    },
  });
  return count;
}
