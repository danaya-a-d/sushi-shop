import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../generated/prisma/client.js';

/**
 * Prisma Client для PostgreSQL через драйверный адаптер (в Prisma 7 клиент работает
 * без встроенного движка, соединением управляет `pg`). Один клиент на процесс.
 */
export function createPrismaClient(
  connectionString: string | undefined = process.env.DATABASE_URL,
): PrismaClient {
  if (!connectionString) {
    throw new Error('DATABASE_URL не задан: скопируйте .env.example в .env');
  }
  return new PrismaClient({ adapter: new PrismaPg({ connectionString }) });
}
