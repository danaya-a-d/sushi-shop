import { Global, Module } from '@nestjs/common';
import { PrismaService } from './prisma.service.js';

/** Глобальный модуль: PrismaService один на приложение и доступен без повторного импорта. */
@Global()
@Module({
  providers: [PrismaService],
  exports: [PrismaService],
})
export class PrismaModule {}
