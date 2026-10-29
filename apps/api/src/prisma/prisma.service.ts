import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { createBootLog, describeError, withTimeout } from '../diagnostics/boot-log.js';
import { createPrismaClient } from './create-prisma-client.js';

/** Предел ожидания подключения к БД при старте (диагностика: вместо тихого зависания — ошибка). */
const CONNECT_TIMEOUT_MS = 15_000;

/**
 * Единственный Prisma Client приложения (создаётся общей фабрикой). Сервисы получают
 * его как `prisma.client`. Подключение проверяется при старте, а при остановке Nest
 * (в том числе по SIGTERM, если включены shutdown hooks) пул соединений закрывается.
 */
@Injectable()
export class PrismaService implements OnModuleInit, OnModuleDestroy {
  readonly client = createPrismaClient();

  async onModuleInit(): Promise<void> {
    const log = createBootLog();
    // Лучше упасть сразу при запуске, чем на первом запросе пользователя
    try {
      log('prisma:connect:start');
      await withTimeout(this.client.$connect(), CONNECT_TIMEOUT_MS, 'prisma.$connect');
      log('prisma:connect:done');
      // $connect в адаптере может не открывать соединение: проверяем реальный обмен с БД (только чтение)
      log('prisma:select1:start');
      await withTimeout(this.client.$queryRaw`SELECT 1`, CONNECT_TIMEOUT_MS, 'prisma SELECT 1');
      log('prisma:select1:done');
    } catch (error) {
      log('prisma:failed', describeError(error));
      await this.client.$disconnect().catch(() => undefined);
      throw error;
    }
  }

  async onModuleDestroy(): Promise<void> {
    await this.client.$disconnect();
  }
}
