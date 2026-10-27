import {
  BadRequestException,
  Controller,
  Get,
  Param,
  Query,
} from '@nestjs/common';
import { CatalogService } from './catalog.service.js';
import type {
  ProductResponse,
  ProductsByIdsResponse,
  ProductsPageResponse,
} from './catalog.types.js';
import {
  DEFAULT_PAGE_SIZE,
  MAX_PAGE_SIZE,
  parseCursor,
  parseLimit,
} from './pagination.js';
import { parseProductIds } from './parse-product-ids.js';

const DEFAULT_RELATED_LIMIT = 4;
const MAX_RELATED_LIMIT = 12;

@Controller('products')
export class ProductsController {
  constructor(private readonly catalog: CatalogService) {}

  /** GET /products[?category=rolls][&limit=12][&cursor=...] — страница каталога */
  @Get()
  list(
    @Query('category') category?: string | string[],
    @Query('limit') limit?: string | string[],
    @Query('cursor') cursor?: string | string[],
  ): Promise<ProductsPageResponse> {
    if (Array.isArray(category)) {
      throw new BadRequestException(
        'Query parameter "category" must be specified once',
      );
    }
    return this.catalog.listProducts({
      categorySlug: category,
      limit: parseLimit(limit, DEFAULT_PAGE_SIZE, MAX_PAGE_SIZE),
      cursor: parseCursor(cursor),
    });
  }

  /**
   * GET /products/by-ids?ids=1,2,3 — пакетная выборка для корзины.
   * Объявлен ВЫШЕ `:slug`, иначе "by-ids" был бы принят за slug товара
   * (поэтому товар со slug "by-ids" по `/products/:slug` недоступен).
   */
  @Get('by-ids')
  getByIds(
    @Query('ids') ids?: string | string[],
  ): Promise<ProductsByIdsResponse> {
    return this.catalog.getProductsByIds(parseProductIds(ids));
  }

  /**
   * GET /products/:slug/related?limit=4 — похожие товары.
   * Путь из двух сегментов, с `by-ids` и `:slug` не конфликтует.
   */
  @Get(':slug/related')
  getRelated(
    @Param('slug') slug: string,
    @Query('limit') limit?: string | string[],
  ): Promise<ProductResponse[]> {
    return this.catalog.getRelatedProducts(
      slug,
      parseLimit(limit, DEFAULT_RELATED_LIMIT, MAX_RELATED_LIMIT),
    );
  }

  /** GET /products/:slug */
  @Get(':slug')
  getBySlug(@Param('slug') slug: string): Promise<ProductResponse> {
    return this.catalog.getProductBySlug(slug);
  }
}
