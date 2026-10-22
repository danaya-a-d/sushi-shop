import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { createPrismaClient } from './create-prisma-client.js';

/**
 * Единственный Prisma Client приложения (создаётся общей фабрикой). Сервисы получают
 * его как `prisma.client`. Подключение проверяется при старте, а при остановке Nest
 * (в том числе по SIGTERM, если включены shutdown hooks) пул соединений закрывается.
 */
@Injectable()
export class PrismaService implements OnModuleInit, OnModuleDestroy {
  readonly client = createPrismaClient();

  async onModuleInit(): Promise<void> {
    // Лучше упасть сразу при запуске, чем на первом запросе пользователя
    await this.client.$connect();
  }

  async onModuleDestroy(): Promise<void> {
    await this.client.$disconnect();
  }
}
