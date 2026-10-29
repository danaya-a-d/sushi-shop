import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module.js';
import { configureApp } from './app.setup.js';
import { loadRootEnv } from './config/load-env.js';

async function bootstrap() {
  loadRootEnv();
  const app = await NestFactory.create(AppModule);
  configureApp(app);
  // SIGTERM/SIGINT запускают onModuleDestroy: PrismaService закрывает соединения с БД
  app.enableShutdownHooks();
  await app.listen(process.env.PORT ?? 3001);
}

// Без top-level await: в Vercel Services промис app.listen() не завершается, и `await bootstrap()` на
// верхнем уровне блокировал бы загрузку модуля, так что функция не начинала бы принимать запросы.
bootstrap().catch((error: unknown) => {
  console.error(error);
  process.exit(1);
});
