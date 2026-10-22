import { prepareTestDatabase } from './support/test-database.js';

/** Один раз перед всеми e2e-тестами: подготовка отдельной тестовой БД. */
export default async function setup(): Promise<void> {
  await prepareTestDatabase();
}
