import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import {
  categorySelect,
  productSelect,
  toCategoryResponse,
  toProductResponse,
} from './catalog.mapper.js';
import type { CategoryResponse, ProductResponse } from './catalog.types.js';

/**
 * Чтение каталога. Публичны только активные товары (isActive = true).
 * Порядок стабилен: сначала sortOrder, при равенстве по id.
 */
@Injectable()
export class CatalogService {
  constructor(private readonly prisma: PrismaService) {}

  async listCategories(): Promise<CategoryResponse[]> {
    const rows = await this.prisma.client.category.findMany({
      select: categorySelect,
      orderBy: [{ sortOrder: 'asc' }, { id: 'asc' }],
    });
    return rows.map(toCategoryResponse);
  }

  /**
   * @param categorySlug реальный slug категории из БД. Значение `all` категорией не является:
   * чтобы получить все товары, параметр просто не передают.
   */
  async listProducts(categorySlug?: string): Promise<ProductResponse[]> {
    if (categorySlug !== undefined) {
      const category = await this.prisma.client.category.findUnique({
        where: { slug: categorySlug },
        select: { id: true },
      });
      if (!category) {
        throw new BadRequestException(`Unknown category "${categorySlug}"`);
      }
    }

    const rows = await this.prisma.client.product.findMany({
      where: {
        isActive: true,
        ...(categorySlug !== undefined && {
          categories: { some: { slug: categorySlug } },
        }),
      },
      select: productSelect,
      orderBy: [{ sortOrder: 'asc' }, { id: 'asc' }],
    });
    return rows.map(toProductResponse);
  }

  async getProductBySlug(slug: string): Promise<ProductResponse> {
    const row = await this.prisma.client.product.findFirst({
      where: { slug, isActive: true },
      select: productSelect,
    });
    if (!row) {
      throw new NotFoundException(`Product "${slug}" not found`);
    }
    return toProductResponse(row);
  }
}
