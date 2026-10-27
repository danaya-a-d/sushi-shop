// Ручная команда: pnpm --filter api db:clean:demo
// Удаляет только товары `demo-*`. Основной каталог, категории и заказы не затрагиваются.
import { fileURLToPath } from 'node:url';
import { createPrismaClient } from '../src/prisma/create-prisma-client.js';
import { cleanDemoCatalog } from './demo-catalog.js';

try {
  process.loadEnvFile(fileURLToPath(new URL('../../../.env', import.meta.url)));
} catch {
  // нет файла: используем переменные процесса
}

const prisma = createPrismaClient();

async function main() {
  const removed = await cleanDemoCatalog(prisma);
  const total = await prisma.product.count();
  console.log(`Удалено демо-товаров: ${removed}, осталось товаров в базе: ${total}`);
}

main()
  .catch((error: unknown) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
