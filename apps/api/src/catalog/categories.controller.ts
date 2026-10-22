import { Controller, Get } from '@nestjs/common';
import { CatalogService } from './catalog.service.js';
import type { CategoryResponse } from './catalog.types.js';

@Controller('categories')
export class CategoriesController {
  constructor(private readonly catalog: CatalogService) {}

  /** GET /categories */
  @Get()
  list(): Promise<CategoryResponse[]> {
    return this.catalog.listCategories();
  }
}
