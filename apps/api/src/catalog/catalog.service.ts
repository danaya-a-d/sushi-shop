import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import type { Prisma } from '../generated/prisma/client.js';
import { PrismaService } from '../prisma/prisma.service.js';
import {
  categorySelect,
  productSelect,
  toCategoryResponse,
  toProductResponse,
} from './catalog.mapper.js';
import type {
  CategoryResponse,
  ProductResponse,
  ProductsByIdsResponse,
  ProductsPageResponse,
} from './catalog.types.js';
import {
  DEFAULT_PAGE_SIZE,
  encodeCursor,
  type ProductCursor,
} from './pagination.js';

const PRODUCT_ORDER: Prisma.ProductOrderByWithRelationInput[] = [
  { sortOrder: 'asc' },
  { id: 'asc' },
];

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
   * Страница каталога (cursor-пагинация по `sortOrder ASC, id ASC`).
   * @param categorySlug реальный slug категории из БД. Значение `all` категорией не является:
   * чтобы получить все товары, параметр просто не передают.
   * @param cursor позиция последнего товара предыдущей страницы (исключается из результата)
   */
  async listProducts(
    options: {
      categorySlug?: string;
      limit?: number;
      cursor?: ProductCursor;
    } = {},
  ): Promise<ProductsPageResponse> {
    const { categorySlug, limit = DEFAULT_PAGE_SIZE, cursor } = options;

    if (categorySlug !== undefined) {
      const category = await this.prisma.client.category.findUnique({
        where: { slug: categorySlug },
        select: { id: true },
      });
      if (!category) {
        throw new BadRequestException(`Unknown category "${categorySlug}"`);
      }
    }

    // Keyset вместо offset/Prisma cursor: условие по значениям (sortOrder, id), а не по существованию
    // строки-курсора, поэтому удаление или скрытие товара-курсора страницу не ломает.
    const rows = await this.prisma.client.product.findMany({
      where: {
        isActive: true,
        ...(categorySlug !== undefined && {
          categories: { some: { slug: categorySlug } },
        }),
        ...(cursor && {
          OR: [
            { sortOrder: { gt: cursor.sortOrder } },
            { sortOrder: cursor.sortOrder, id: { gt: cursor.id } },
          ],
        }),
      },
      select: { ...productSelect, sortOrder: true },
      orderBy: PRODUCT_ORDER,
      // лишняя строка нужна только чтобы узнать, есть ли следующая страница (без COUNT)
      take: limit + 1,
    });

    const hasMore = rows.length > limit;
    const page = hasMore ? rows.slice(0, limit) : rows;
    const last = page.at(-1);
    return {
      items: page.map((row) => toProductResponse(row)),
      nextCursor:
        hasMore && last
          ? encodeCursor({ sortOrder: last.sortOrder, id: last.id })
          : null,
    };
  }

  /**
   * Похожие товары: сначала с общими категориями, при нехватке — другие активные товары.
   * Не больше двух запросов с `take` в SQL; текущий товар исключён, дубликатов нет по построению.
   */
  async getRelatedProducts(
    slug: string,
    limit: number,
  ): Promise<ProductResponse[]> {
    const current = await this.prisma.client.product.findFirst({
      where: { slug, isActive: true },
      select: { id: true, categories: { select: { slug: true } } },
    });
    if (!current) {
      throw new NotFoundException(`Product "${slug}" not found`);
    }

    const categorySlugs = current.categories.map((category) => category.slug);
    const similar =
      categorySlugs.length === 0
        ? []
        : await this.prisma.client.product.findMany({
            where: {
              isActive: true,
              id: { not: current.id },
              categories: { some: { slug: { in: categorySlugs } } },
            },
            select: productSelect,
            orderBy: PRODUCT_ORDER,
            take: limit,
          });

    const filler =
      similar.length >= limit
        ? []
        : await this.prisma.client.product.findMany({
            where: {
              isActive: true,
              id: { notIn: [current.id, ...similar.map((row) => row.id)] },
            },
            select: productSelect,
            orderBy: PRODUCT_ORDER,
            take: limit - similar.length,
          });

    return [...similar, ...filler].map(toProductResponse);
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

  /**
   * Пакетная выборка для корзины: один запрос к БД на весь набор id (не по запросу на товар).
   * @param ids уникальные, уже проверенные id (см. parseProductIds)
   */
  async getProductsByIds(
    ids: readonly string[],
  ): Promise<ProductsByIdsResponse> {
    const rows = await this.prisma.client.product.findMany({
      where: { id: { in: [...ids] } },
      // isActive нужен только для разбора на группы, наружу он не выходит
      select: { ...productSelect, isActive: true },
    });
    const byId = new Map(rows.map((row) => [row.id, row]));

    const result: ProductsByIdsResponse = {
      available: [],
      unavailable: [],
      missing: [],
    };
    for (const id of ids) {
      const row = byId.get(id);
      if (!row) result.missing.push(id);
      else if (!row.isActive) result.unavailable.push(id);
      else result.available.push(toProductResponse(row));
    }
    return result;
  }
}
