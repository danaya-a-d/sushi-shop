import {
  BadRequestException,
  Controller,
  Get,
  Param,
  Query,
} from '@nestjs/common';
import { CatalogService } from './catalog.service.js';
import type { ProductResponse } from './catalog.types.js';

@Controller('products')
export class ProductsController {
  constructor(private readonly catalog: CatalogService) {}

  /** GET /products[?category=rolls] */
  @Get()
  list(
    @Query('category') category?: string | string[],
  ): Promise<ProductResponse[]> {
    if (Array.isArray(category)) {
      throw new BadRequestException(
        'Query parameter "category" must be specified once',
      );
    }
    return this.catalog.listProducts(category);
  }

  /** GET /products/:slug */
  @Get(':slug')
  getBySlug(@Param('slug') slug: string): Promise<ProductResponse> {
    return this.catalog.getProductBySlug(slug);
  }
}
