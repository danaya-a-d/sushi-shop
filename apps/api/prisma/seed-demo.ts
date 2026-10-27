// Ручная команда: pnpm --filter api db:seed:demo
// Добавляет 40 демонстрационных товаров (`demo-*`). Не вызывается из основного seed, миграций и сборки.
import { fileURLToPath } from 'node:url';
import { createPrismaClient } from '../src/prisma/create-prisma-client.js';
import { seedDemoCatalog } from './demo-catalog.js';

try {
  process.loadEnvFile(fileURLToPath(new URL('../../../.env', import.meta.url)));
} catch {
  // нет файла: используем переменные процесса
}

if (process.env.NODE_ENV === 'production') {
  console.error('Демонстрационные товары нельзя добавлять в production.');
  process.exit(1);
}

const prisma = createPrismaClient();

async function main() {
  await seedDemoCatalog(prisma);
  const [demo, total] = await Promise.all([
    prisma.product.count({ where: { id: { startsWith: 'demo-' } } }),
    prisma.product.count(),
  ]);
  console.log(`Демо-товары: ${demo}, всего товаров в базе: ${total}`);
}

main()
  .catch((error: unknown) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
