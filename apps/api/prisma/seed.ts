import { fileURLToPath } from 'node:url';
import { createPrismaClient } from '../src/prisma/create-prisma-client.js';
import { seedCatalog } from './seed-catalog.js';

try {
  process.loadEnvFile(fileURLToPath(new URL('../../../.env', import.meta.url)));
} catch {
  // нет файла: используем переменные процесса
}

const prisma = createPrismaClient();

async function main() {
  await seedCatalog(prisma);
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
