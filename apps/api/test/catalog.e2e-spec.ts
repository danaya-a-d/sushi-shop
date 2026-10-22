import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { App } from 'supertest/types.js';
import { AppModule } from '../src/app.module.js';
import type {
  CategoryResponse,
  ProductResponse,
} from '../src/catalog/catalog.types.js';
import { PrismaService } from '../src/prisma/prisma.service.js';
import { INACTIVE_PRODUCT } from './support/test-database.js';

// Данные: seed-каталог (8 категорий, роллы 1–8) + неактивный товар в БД *_test, см. test-database.ts

describe('Catalog API (e2e)', () => {
  let app: INestApplication<App>;
  let prisma: PrismaService;

  const get = (path: string) => request(app.getHttpServer()).get(path);
  const ids = (products: ProductResponse[]) => products.map((p) => p.id);

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();
    app = moduleRef.createNestApplication();
    await app.init();
    prisma = app.get(PrismaService);
  });

  afterAll(async () => {
    await app.close();
  });

  describe('GET /categories', () => {
    it('возвращает категории в порядке sortOrder только с публичными полями', async () => {
      const { body } = await get('/categories').expect(200);

      expect((body as CategoryResponse[]).map((c) => c.slug)).toEqual([
        'hits',
        'new',
        'sushi',
        'rolls',
        'sashimi',
        'soups',
        'salads',
        'desserts',
      ]);
      expect(body[0]).toEqual({ slug: 'hits', label: 'Хиты продаж' });
    });

    it('не содержит псевдокатегорию «all»', async () => {
      const { body } = await get('/categories').expect(200);
      expect((body as CategoryResponse[]).some((c) => c.slug === 'all')).toBe(
        false,
      );
    });
  });

  describe('GET /products', () => {
    it('возвращает только активные товары в стабильном порядке', async () => {
      const { body } = await get('/products').expect(200);

      expect(ids(body)).toEqual(['1', '2', '3', '4', '5', '6', '7', '8']);
      expect(ids(body)).not.toContain(INACTIVE_PRODUCT.id);
    });

    it('отдаёт явный контракт: цена в копейках с валютой и без служебных полей', async () => {
      const { body } = await get('/products').expect(200);

      expect(body[0]).toEqual({
        id: '1',
        slug: 'baked-crab',
        name: 'Запеченный краб',
        composition:
          'окунь, красная рыба, сливочный сыр, омлет, салат айсберг, масаго, сырный соус',
        categories: ['hits', 'rolls'],
        weightGrams: 450,
        priceKopecks: 125000,
        currency: 'UAH',
        nutrition: { calories: 180, protein: 6, fat: 5, carbs: 27 },
        image: { src: '/images/products/roll-01.webp', width: 2670, height: 2750 },
      });
    });

    it('?category=rolls возвращает все роллы', async () => {
      const { body } = await get('/products?category=rolls').expect(200);
      expect(ids(body)).toEqual(['1', '2', '3', '4', '5', '6', '7', '8']);
    });

    it('?category=hits возвращает «Хиты продаж»', async () => {
      const { body } = await get('/products?category=hits').expect(200);
      expect(ids(body)).toEqual(['1', '2', '3', '4']);
    });

    it('?category=new возвращает новинки', async () => {
      const { body } = await get('/products?category=new').expect(200);
      expect(ids(body)).toEqual(['5', '6', '7', '8']);
    });

    it('существующая категория без товаров даёт пустой список', async () => {
      const { body } = await get('/products?category=sushi').expect(200);
      expect(body).toEqual([]);
    });

    it.each(['unknown', 'all', '', 'ROLLS'])(
      'неизвестная категория «%s» даёт 400',
      async (category) => {
        await get(`/products?category=${category}`).expect(400);
      },
    );

    it('повторный параметр category даёт 400', async () => {
      await get('/products?category=rolls&category=hits').expect(400);
    });
  });

  describe('GET /products/:slug', () => {
    it('возвращает активный товар', async () => {
      const { body } = await get('/products/rainbow').expect(200);
      expect(body).toMatchObject({
        id: '2',
        slug: 'rainbow',
        name: 'Радуга',
        priceKopecks: 125000,
        categories: ['hits', 'rolls'],
      });
    });

    it('неизвестный slug даёт 404', async () => {
      await get('/products/no-such-roll').expect(404);
    });

    it('неактивный товар даёт 404', async () => {
      await get(`/products/${INACTIVE_PRODUCT.slug}`).expect(404);
    });
  });

  describe('isActive', () => {
    it('отключённый товар исчезает из списка, категории и страницы товара, включённый возвращается', async () => {
      await prisma.client.product.update({
        where: { id: '1' },
        data: { isActive: false },
      });
      try {
        expect(ids((await get('/products').expect(200)).body)).not.toContain('1');
        expect(
          ids((await get('/products?category=hits').expect(200)).body),
        ).toEqual(['2', '3', '4']);
        await get('/products/baked-crab').expect(404);
      } finally {
        await prisma.client.product.update({
          where: { id: '1' },
          data: { isActive: true },
        });
      }

      await get('/products/baked-crab').expect(200);
      expect(ids((await get('/products').expect(200)).body)).toContain('1');
    });
  });

  describe('порядок', () => {
    it('сортирует по sortOrder, а не по id', async () => {
      await prisma.client.product.update({
        where: { id: '8' },
        data: { sortOrder: -1 },
      });
      try {
        const { body } = await get('/products').expect(200);
        expect(ids(body)[0]).toBe('8');
      } finally {
        await prisma.client.product.update({
          where: { id: '8' },
          data: { sortOrder: 7 },
        });
      }
    });
  });
});
