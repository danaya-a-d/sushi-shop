import { defineConfig } from 'vitest/config';
import tsconfigPaths from 'vite-tsconfig-paths';
import { getTestDatabaseUrl } from './test/support/test-database.js';

export default defineConfig({
  plugins: [tsconfigPaths()],
  test: {
    globals: true,
    root: './',
    include: ['**/*.e2e-spec.ts'],
    globalSetup: ['./test/global-setup.ts'],
    // Приложение в e2e-тестах подключается только к отдельной тестовой БД (*_test)
    env: { DATABASE_URL: getTestDatabaseUrl() },
    // Тесты делят одну БД и меняют в ней данные, поэтому файлы идут по очереди
    fileParallelism: false,
  },
});
