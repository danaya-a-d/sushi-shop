import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module.js';
import { configureApp } from './app.setup.js';
import { loadRootEnv } from './config/load-env.js';
import { describeDatabaseUrl, withTimeout, type BootLog } from './diagnostics/boot-log.js';

/** Ограничения диагностических этапов: запуск должен упасть с ошибкой, а не зависнуть молча. */
const CREATE_TIMEOUT_MS = 15_000;
const INIT_TIMEOUT_MS = 25_000;

export async function bootstrap(log: BootLog): Promise<void> {
  loadRootEnv();
  log('env', {
    apiPrefix: process.env.API_PREFIX ?? null,
    port: process.env.PORT ?? null,
    database: describeDatabaseUrl(),
  });

  log('create:start');
  const app = await withTimeout(NestFactory.create(AppModule), CREATE_TIMEOUT_MS, 'NestFactory.create');
  log('create:done');

  try {
    configureApp(app);
    // SIGTERM/SIGINT запускают onModuleDestroy: PrismaService закрывает соединения с БД
    app.enableShutdownHooks();

    // init() вызывает onModuleInit (подключение Prisma), отдельно от listen() для замера
    log('init:start');
    await withTimeout(app.init(), INIT_TIMEOUT_MS, 'app.init');
    log('init:done');

    log('listen:start');
    // Без таймаута: в Vercel Services промис listen() не завершается, это ожидаемо (см. main.ts)
    await app.listen(process.env.PORT ?? 3001);
    log('listen:done');
  } catch (error) {
    // Не оставляем открытых соединений с БД, если запуск не удался
    await app.close().catch(() => undefined);
    throw error;
  }
}
