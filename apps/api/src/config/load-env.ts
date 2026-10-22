import { fileURLToPath } from 'node:url';

/**
 * Загружает общий .env из корня репозитория (его же читают Docker Compose и Prisma CLI).
 * Уже заданные переменные процесса не перезаписываются; если файла нет (продакшен, CI),
 * значения должны прийти из окружения.
 */
export function loadRootEnv(): void {
  try {
    process.loadEnvFile(
      fileURLToPath(new URL('../../../../.env', import.meta.url)),
    );
  } catch {
    // файла нет: используем переменные процесса
  }
}
