import { execSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import pg from 'pg';
import { seedCatalog } from '../../prisma/seed-catalog.js';
import { loadRootEnv } from '../../src/config/load-env.js';
import { createPrismaClient } from '../../src/prisma/create-prisma-client.js';

const API_ROOT = fileURLToPath(new URL('../../', import.meta.url));

/** Неактивный товар: проверяет, что публичное API его не отдаёт. */
export const INACTIVE_PRODUCT = {
  id: 'test-inactive',
  slug: 'inactive-roll',
} as const;

/**
 * Адрес отдельной тестовой БД: имя рабочей БД с суффиксом `_test` (или TEST_DATABASE_URL).
 * Рабочая БД с локальными данными в тестах не используется и не меняется.
 */
export function getTestDatabaseUrl(): string {
  loadRootEnv();

  const explicit = process.env.TEST_DATABASE_URL;
  const base = process.env.DATABASE_URL;
  if (!explicit && !base) {
    throw new Error('Задайте DATABASE_URL (см. .env.example)');
  }

  const url = new URL(explicit ?? (base as string));
  if (!explicit) url.pathname = `${url.pathname}_test`;

  assertTestDatabase(url);
  return url.toString();
}

/** Защита: тесты стирают таблицы, поэтому работают только с БД, имя которой оканчивается на `_test`. */
function assertTestDatabase(url: URL): string {
  const name = decodeURIComponent(url.pathname.slice(1));
  if (!/^[a-z0-9_]+_test$/.test(name)) {
    throw new Error(
      `Тестовая БД должна называться *_test, получено "${name}": тесты очищают таблицы`,
    );
  }
  return name;
}

/**
 * Готовит тестовую БД: создаёт её при отсутствии, применяет миграции, очищает таблицы
 * и заливает seed-каталог плюс один неактивный товар.
 */
export async function prepareTestDatabase(): Promise<void> {
  const connectionString = getTestDatabaseUrl();
  const url = new URL(connectionString);
  const databaseName = assertTestDatabase(url);

  await createDatabaseIfMissing(url, databaseName);

  execSync('pnpm exec prisma migrate deploy', {
    cwd: API_ROOT,
    env: { ...process.env, DATABASE_URL: connectionString },
    stdio: 'pipe',
  });

  const prisma = createPrismaClient(connectionString);
  try {
    await prisma.$executeRawUnsafe(
      'TRUNCATE "OrderItem", "Order", "_CategoryToProduct", "Product", "Category" RESTART IDENTITY CASCADE',
    );
    await seedCatalog(prisma);
    await prisma.product.create({
      data: {
        ...INACTIVE_PRODUCT,
        name: 'Неактивный ролл',
        composition: 'тест',
        weightGrams: 100,
        priceKopecks: 100,
        imageSrc: '/images/products/inactive.webp',
        imageWidth: 1,
        imageHeight: 1,
        isActive: false,
        sortOrder: 100,
        categories: { connect: [{ slug: 'rolls' }, { slug: 'hits' }] },
      },
    });
  } finally {
    await prisma.$disconnect();
  }
}

async function createDatabaseIfMissing(url: URL, name: string): Promise<void> {
  const admin = new URL(url);
  admin.pathname = '/postgres';
  const client = new pg.Client({ connectionString: admin.toString() });
  await client.connect();
  try {
    const exists = await client.query('SELECT 1 FROM pg_database WHERE datname = $1', [name]);
    if (exists.rowCount === 0) {
      // имя проверено регулярным выражением в assertTestDatabase
      await client.query(`CREATE DATABASE "${name}"`);
    }
  } finally {
    await client.end();
  }
}
