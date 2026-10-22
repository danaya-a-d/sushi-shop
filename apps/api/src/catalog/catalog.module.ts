import { Module } from '@nestjs/common';
import { CatalogService } from './catalog.service.js';
import { CategoriesController } from './categories.controller.js';
import { ProductsController } from './products.controller.js';

@Module({
  controllers: [ProductsController, CategoriesController],
  providers: [CatalogService],
})
export class CatalogModule {}
