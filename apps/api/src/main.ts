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
await bootstrap();
