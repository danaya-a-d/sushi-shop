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

      expect(ids(body.items)).toEqual(['1', '2', '3', '4', '5', '6', '7', '8']);
      expect(ids(body.items)).not.toContain(INACTIVE_PRODUCT.id);
      expect(body.nextCursor).toBeNull();
    });

    it('отдаёт явный контракт: цена в копейках с валютой и без служебных полей', async () => {
      const { body } = await get('/products').expect(200);

      expect(Object.keys(body)).toEqual(['items', 'nextCursor']);
      expect(body.items[0]).toEqual({
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
      expect(ids(body.items)).toEqual(['1', '2', '3', '4', '5', '6', '7', '8']);
    });

    it('?category=hits возвращает «Хиты продаж»', async () => {
      const { body } = await get('/products?category=hits').expect(200);
      expect(ids(body.items)).toEqual(['1', '2', '3', '4']);
    });

    it('?category=new возвращает новинки', async () => {
      const { body } = await get('/products?category=new').expect(200);
      expect(ids(body.items)).toEqual(['5', '6', '7', '8']);
    });

    it('существующая категория без товаров даёт пустой список', async () => {
      const { body } = await get('/products?category=sushi').expect(200);
      expect(body).toEqual({ items: [], nextCursor: null });
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

  describe('GET /products/by-ids', () => {
    it('возвращает активные товары в порядке запроса с полным контрактом', async () => {
      const { body } = await get('/products/by-ids?ids=3,1').expect(200);

      expect(ids(body.available)).toEqual(['3', '1']);
      expect(body.unavailable).toEqual([]);
      expect(body.missing).toEqual([]);
      expect(body.available[1]).toEqual(
        (await get('/products/baked-crab').expect(200)).body,
      );
    });

    it('разделяет доступные, отключённые и отсутствующие id', async () => {
      const { body } = await get(
        `/products/by-ids?ids=1,${INACTIVE_PRODUCT.id},no-such,2`,
      ).expect(200);

      expect(ids(body.available)).toEqual(['1', '2']);
      expect(body.unavailable).toEqual([INACTIVE_PRODUCT.id]);
      expect(body.missing).toEqual(['no-such']);
    });

    it('про отключённый товар отдаёт только id, без данных', async () => {
      const { body } = await get(
        `/products/by-ids?ids=${INACTIVE_PRODUCT.id}`,
      ).expect(200);

      expect(body.available).toEqual([]);
      expect(JSON.stringify(body)).not.toContain('Неактивный ролл');
      expect(JSON.stringify(body)).not.toContain(INACTIVE_PRODUCT.slug);
    });

    it('дубликаты id схлопываются', async () => {
      const { body } = await get('/products/by-ids?ids=1,1,2,1').expect(200);
      expect(ids(body.available)).toEqual(['1', '2']);
    });

    it('не путается с GET /products/:slug', async () => {
      const { body } = await get('/products/by-ids?ids=1').expect(200);
      expect(body).toHaveProperty('available');
      await get('/products/by-ids').expect(400);
    });

    it('делает один запрос к БД на весь набор id', async () => {
      const spy = vi.spyOn(prisma.client.product, 'findMany');
      try {
        await get('/products/by-ids?ids=1,2,3,4,5,6,7,8').expect(200);
        expect(spy).toHaveBeenCalledTimes(1);
      } finally {
        spy.mockRestore();
      }
    });

    it.each([
      ['без ids', '/products/by-ids'],
      ['пустой ids', '/products/by-ids?ids='],
      ['повторный ids', '/products/by-ids?ids=1&ids=2'],
      ['пустой элемент', '/products/by-ids?ids=1,,2'],
      ['недопустимые символы', '/products/by-ids?ids=1,%27%3B--'],
      [
        'больше 50 id',
        `/products/by-ids?ids=${Array.from({ length: 51 }, (_, i) => i + 1).join(',')}`,
      ],
    ])('400: %s', async (_name, url) => {
      await get(url).expect(400);
    });

    it('ровно 50 id допустимы', async () => {
      const list = Array.from({ length: 50 }, (_, i) => i + 1).join(',');
      const { body } = await get(`/products/by-ids?ids=${list}`).expect(200);
      expect(body.available).toHaveLength(8);
      expect(body.missing).toHaveLength(42);
    });

    it('товар, отключённый через isActive, переходит в unavailable', async () => {
      await prisma.client.product.update({
        where: { id: '1' },
        data: { isActive: false },
      });
      try {
        const { body } = await get('/products/by-ids?ids=1,2').expect(200);
        expect(ids(body.available)).toEqual(['2']);
        expect(body.unavailable).toEqual(['1']);
      } finally {
        await prisma.client.product.update({
          where: { id: '1' },
          data: { isActive: true },
        });
      }
    });
  });

  describe('isActive', () => {
    it('отключённый товар исчезает из списка, категории и страницы товара, включённый возвращается', async () => {
      await prisma.client.product.update({
        where: { id: '1' },
        data: { isActive: false },
      });
      try {
        expect(ids((await get('/products').expect(200)).body.items)).not.toContain('1');
        expect(
          ids((await get('/products?category=hits').expect(200)).body.items),
        ).toEqual(['2', '3', '4']);
        await get('/products/baked-crab').expect(404);
      } finally {
        await prisma.client.product.update({
          where: { id: '1' },
          data: { isActive: true },
        });
      }

      await get('/products/baked-crab').expect(200);
      expect(ids((await get('/products').expect(200)).body.items)).toContain('1');
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
        expect(ids(body.items)[0]).toBe('8');
      } finally {
        await prisma.client.product.update({
          where: { id: '8' },
          data: { sortOrder: 7 },
        });
      }
    });
  });
});
