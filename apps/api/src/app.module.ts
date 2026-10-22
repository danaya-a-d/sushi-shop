import { Module } from '@nestjs/common';
import { AppController } from './app.controller.js';
import { AppService } from './app.service.js';
import { CatalogModule } from './catalog/catalog.module.js';
import { PrismaModule } from './prisma/prisma.module.js';

@Module({
  imports: [PrismaModule, CatalogModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
