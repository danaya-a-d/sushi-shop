import { fileURLToPath } from 'node:url';
import { defineConfig, env } from 'prisma/config';

// Единый .env лежит в корне репозитория (его же читает Docker Compose).
// Если файла нет (CI, продакшен), переменные должны прийти из окружения.
try {
  process.loadEnvFile(fileURLToPath(new URL('../../.env', import.meta.url)));
} catch {
  // нет файла: используем переменные процесса
}

export default defineConfig({
  schema: 'prisma/schema.prisma',
  migrations: {
    path: 'prisma/migrations',
    seed: 'tsx prisma/seed.ts',
  },
  datasource: {
    url: env('DATABASE_URL'),
  },
});
