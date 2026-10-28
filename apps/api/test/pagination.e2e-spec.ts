import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { App } from 'supertest/types.js';
import { cleanDemoCatalog, seedDemoCatalog } from '../prisma/demo-catalog.js';
import { DEMO_PRODUCT_COUNT } from '../prisma/demo-data.js';
import { AppModule } from '../src/app.module.js';
import type {
  ProductResponse,
  ProductsPageResponse,
} from '../src/catalog/catalog.types.js';
import { encodeCursor } from '../src/catalog/pagination.js';
import { PrismaService } from '../src/prisma/prisma.service.js';
import { INACTIVE_PRODUCT } from './support/test-database.js';

// Данные: 8 основных товаров + 40 демо-товаров (prisma/demo-data.ts) = 48 активных и один неактивный.
// Демо-товары добавляются в тестовую БД *_test в beforeAll и удаляются в afterAll.

describe('Catalog pagination (e2e)', () => {
  let app: INestApplication<App>;
  let prisma: PrismaService;

  const get = (path: string) => request(app.getHttpServer()).get(path);
  const ids = (products: ProductResponse[]) => products.map((p) => p.id);
  const page = async (query: string): Promise<ProductsPageResponse> =>
    (await get(`/products?${query}`).expect(200)).body as ProductsPageResponse;

  /** Проходит все страницы; возвращает страницы целиком. */
  async function walk(
    baseQuery: string,
    limit: number,
  ): Promise<ProductsPageResponse[]> {
    const pages: ProductsPageResponse[] = [];
    let cursor: string | null = null;
    do {
      const query: string = [
        baseQuery,
        `limit=${limit}`,
        cursor && `cursor=${cursor}`,
      ]
        .filter(Boolean)
        .join('&');
      const current = await page(query);
      pages.push(current);
      cursor = current.nextCursor;
      if (pages.length > 100) throw new Error('пагинация не завершается');
    } while (cursor);
    return pages;
  }

  /** Эталонный порядок: сортировка в БД по тем же ключам, без пагинации. */
  async function expectedIds(categorySlug?: string): Promise<string[]> {
    const rows = await prisma.client.product.findMany({
      where: {
        isActive: true,
        ...(categorySlug && { categories: { some: { slug: categorySlug } } }),
      },
      select: { id: true },
      orderBy: [{ sortOrder: 'asc' }, { id: 'asc' }],
    });
    return rows.map((row) => row.id);
  }

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();
    app = moduleRef.createNestApplication();
    await app.init();
    prisma = app.get(PrismaService);
    await seedDemoCatalog(prisma.client);
  });

  afterAll(async () => {
    await cleanDemoCatalog(prisma.client);
    await app.close();
  });

  it('подготовка: в базе 48 активных товаров и один неактивный', async () => {
    expect(DEMO_PRODUCT_COUNT).toBe(40);
    expect(await prisma.client.product.count({ where: { isActive: true } })).toBe(
      48,
    );
    expect(
      await prisma.client.product.count({
        where: { id: INACTIVE_PRODUCT.id },
      }),
    ).toBe(1);
  });

  describe('GET /products', () => {
    it('по умолчанию отдаёт 12 товаров и курсор следующей страницы', async () => {
      const body = await page('');
      expect(body.items).toHaveLength(12);
      expect(body.nextCursor).toEqual(expect.any(String));
      expect(ids(body.items).slice(0, 8)).toEqual(
        (await expectedIds()).slice(0, 8),
      );
    });

    it('?limit управляет размером страницы', async () => {
      expect((await page('limit=5')).items).toHaveLength(5);
      expect((await page('limit=1')).items).toHaveLength(1);
    });

    it('limit=50 отдаёт все 48 товаров без следующей страницы', async () => {
      const body = await page('limit=50');
      expect(body.items).toHaveLength(48);
      expect(body.nextCursor).toBeNull();
    });

    it('страницы по 12 покрывают весь каталог без дублей и пропусков, порядок сохраняется', async () => {
      const pages = await walk('', 12);
      expect(pages.map((p) => p.items.length)).toEqual([12, 12, 12, 12]);
      expect(pages.map((p) => p.nextCursor === null)).toEqual([
        false,
        false,
        false,
        true,
      ]);

      const all = pages.flatMap((p) => ids(p.items));
      expect(new Set(all).size).toBe(48);
      expect(all).toEqual(await expectedIds());
    });

    it('когда число товаров кратно limit, последняя страница заканчивает список (nextCursor = null)', async () => {
      const pages = await walk('', 24);
      expect(pages).toHaveLength(2);
      expect(pages[1].nextCursor).toBeNull();
    });

    it('неполная последняя страница', async () => {
      const pages = await walk('', 20);
      expect(pages.map((p) => p.items.length)).toEqual([20, 20, 8]);
    });

    it('товары с одинаковым sortOrder не теряются и не дублируются на границе страниц', async () => {
      const rows = await prisma.client.product.findMany({
        where: { isActive: true },
        select: { sortOrder: true },
      });
      const counts = new Map<number, number>();
      for (const { sortOrder } of rows) {
        counts.set(sortOrder, (counts.get(sortOrder) ?? 0) + 1);
      }
      // в данных действительно есть ничьи по sortOrder, иначе тест ничего не доказывает
      expect([...counts.values()].some((n) => n >= 3)).toBe(true);

      // страницы по 1 и по 2 режут каждую группу ничьих в каждой возможной точке
      for (const limit of [1, 2, 3, 5, 7]) {
        const all = (await walk('', limit)).flatMap((p) => ids(p.items));
        expect(all).toEqual(await expectedIds());
      }
    });

    it('неактивные товары не попадают ни на одну страницу', async () => {
      const all = (await walk('', 7)).flatMap((p) => ids(p.items));
      expect(all).not.toContain(INACTIVE_PRODUCT.id);
    });

    it('в публичных данных нет служебных полей', async () => {
      const { items } = await page('limit=1');
      expect(Object.keys(items[0]).sort()).toEqual(
        [
          'categories',
          'composition',
          'currency',
          'id',
          'image',
          'name',
          'nutrition',
          'priceMinorUnits',
          'slug',
          'weightGrams',
        ].sort(),
      );
    });

    it('один запрос к БД на страницу товаров (без COUNT и отдельных выборок)', async () => {
      const findMany = vi.spyOn(prisma.client.product, 'findMany');
      const count = vi.spyOn(prisma.client.product, 'count');
      try {
        await get('/products?limit=12').expect(200);
        expect(findMany).toHaveBeenCalledTimes(1);
        expect(findMany.mock.calls[0][0]).toMatchObject({ take: 13 });
        expect(count).not.toHaveBeenCalled();
      } finally {
        findMany.mockRestore();
        count.mockRestore();
      }
    });
  });

  describe('фильтрация по категориям', () => {
    it.each(['rolls', 'sushi', 'sashimi', 'soups', 'salads', 'hits', 'new'])(
      'категория %s: все страницы совпадают с эталоном',
      async (slug) => {
        const expected = await expectedIds(slug);
        expect(expected.length).toBeGreaterThan(0);
        const pages = await walk(`category=${slug}`, 5);
        expect(pages.flatMap((p) => ids(p.items))).toEqual(expected);
        // у каждой страницы товары именно этой категории
        for (const p of pages) {
          for (const item of p.items) expect(item.categories).toContain(slug);
        }
      },
    );

    it('категория с одной страницей не даёт кнопки «ещё»', async () => {
      const body = await page('category=salads&limit=12');
      expect(body.items.length).toBeLessThan(12);
      expect(body.nextCursor).toBeNull();
    });

    it('категория без товаров (desserts) — пустой список', async () => {
      expect(await page('category=desserts')).toEqual({
        items: [],
        nextCursor: null,
      });
    });

    it.each(['all', 'unknown', ''])('неизвестная категория «%s» — 400', async (c) => {
      await get(`/products?category=${c}&limit=12`).expect(400);
    });

    it('курсор от одной категории не ломает другую: выдача определяется категорией и позицией', async () => {
      const first = await page('category=rolls&limit=3');
      const other = await page(
        `category=sashimi&limit=50&cursor=${first.nextCursor}`,
      );
      expect(other.items.every((i) => i.categories.includes('sashimi'))).toBe(
        true,
      );
    });
  });

  describe('некорректные параметры', () => {
    it.each([
      ['limit=0'],
      ['limit=51'],
      ['limit=-1'],
      ['limit=abc'],
      ['limit=1.5'],
      ['limit='],
      ['limit=1&limit=2'],
      ['cursor=garbage!!'],
      ['cursor='],
      ['cursor=bm90LWpzb24'],
      ['cursor=WzEsMl0'], // [1,2]: id не строка
      ['cursor=a&cursor=b'],
    ])('400: %s', async (query) => {
      await get(`/products?${query}`).expect(400);
    });
  });

  describe('изменения данных между запросами', () => {
    it('удаление товара, на котором остановилась страница, не ломает продолжение', async () => {
      const first = await page('limit=10');
      const lastOfFirst = first.items.at(-1) as ProductResponse;
      const expectedRest = (await expectedIds()).slice(10);

      // курсор указывает на lastOfFirst; убираем его из выдачи (скрываем) — продолжение остаётся тем же
      await prisma.client.product.update({
        where: { id: lastOfFirst.id },
        data: { isActive: false },
      });
      try {
        const second = await page(`limit=50&cursor=${first.nextCursor}`);
        expect(ids(second.items)).toEqual(expectedRest);
      } finally {
        await prisma.client.product.update({
          where: { id: lastOfFirst.id },
          data: { isActive: true },
        });
      }
    });

    it('удаление ещё не показанного товара: он просто не встречается, остальные без дублей', async () => {
      const first = await page('limit=10');
      const all = await expectedIds();
      const victim = all[15];
      const row = await prisma.client.product.findUniqueOrThrow({
        where: { id: victim },
        include: { categories: true },
      });
      await prisma.client.product.update({
        where: { id: victim },
        data: { isActive: false },
      });
      try {
        const rest = await page(`limit=50&cursor=${first.nextCursor}`);
        expect(ids(first.items).concat(ids(rest.items))).toEqual(
          all.filter((id) => id !== victim),
        );
      } finally {
        await prisma.client.product.update({
          where: { id: row.id },
          data: { isActive: true },
        });
      }
    });

    it('смена sortOrder: ранее показанный товар не дублируется, перенесённый вперёд товар пропускается на этой же прогулке', async () => {
      const first = await page('limit=10');
      const shown = new Set(ids(first.items));
      const all = await expectedIds();
      const moved = all[20];
      const original = await prisma.client.product.findUniqueOrThrow({
        where: { id: moved },
        select: { sortOrder: true },
      });
      // переносим товар в начало списка, туда, где курсор уже прошёл
      await prisma.client.product.update({
        where: { id: moved },
        data: { sortOrder: -5 },
      });
      try {
        const rest = await page(`limit=50&cursor=${first.nextCursor}`);
        // дублей с первой страницей нет
        expect(ids(rest.items).some((id) => shown.has(id))).toBe(false);
        // перенесённый товар пропущен (он «до» курсора), остальные на месте
        expect(ids(rest.items)).not.toContain(moved);
        expect(rest.items).toHaveLength(48 - 10 - 1);
        // свежая выдача с начала показывает его первым
        expect(ids((await page('limit=1')).items)).toEqual([moved]);
      } finally {
        await prisma.client.product.update({
          where: { id: moved },
          data: { sortOrder: original.sortOrder },
        });
      }
    });

    it('курсор, которого нет в базе (товар удалён физически), продолжает с ближайшей позиции', async () => {
      const cursor = encodeCursor({ sortOrder: 9, id: 'demo-no-such-product' });
      const body = await page(`limit=50&cursor=${cursor}`);
      expect(body.items.every((i) => i.id !== 'demo-no-such-product')).toBe(true);
      const rows = await prisma.client.product.findMany({
        where: {
          isActive: true,
          OR: [{ sortOrder: { gt: 9 } }, { sortOrder: 9, id: { gt: 'demo-no-such-product' } }],
        },
        select: { id: true },
        orderBy: [{ sortOrder: 'asc' }, { id: 'asc' }],
      });
      expect(ids(body.items)).toEqual(rows.map((r) => r.id));
    });
  });

  describe('GET /products/:slug/related', () => {
    it('по умолчанию 4 товара, без текущего, только активные, без дублей', async () => {
      const { body } = await get('/products/baked-crab/related').expect(200);
      const list = body as ProductResponse[];
      expect(list).toHaveLength(4);
      expect(ids(list)).not.toContain('1');
      expect(ids(list)).not.toContain(INACTIVE_PRODUCT.id);
      expect(new Set(ids(list)).size).toBe(list.length);
    });

    it('сначала товары с общей категорией в предсказуемом порядке', async () => {
      const { body } = await get('/products/demo-19/related?limit=3').expect(200); // сашими
      const list = body as ProductResponse[];
      expect(list.map((p) => p.categories)).toSatisfy(
        (all: string[][]) => all.every((c) => c.includes('sashimi') || c.includes('hits')),
      );
      // порядок — sortOrder, id среди похожих
      const again = (await get('/products/demo-19/related?limit=3').expect(200))
        .body as ProductResponse[];
      expect(ids(again)).toEqual(ids(list));
    });

    it('?limit ограничивает число результатов', async () => {
      const { body } = await get('/products/baked-crab/related?limit=2').expect(200);
      expect(body).toHaveLength(2);
      const many = (await get('/products/baked-crab/related?limit=12').expect(200))
        .body as ProductResponse[];
      expect(many).toHaveLength(12);
    });

    it('при нехватке похожих дополняет другими активными товарами', async () => {
      // единственный товар категории desserts: похожих по категории нет вовсе
      await prisma.client.product.create({
        data: {
          id: 'demo-lonely',
          slug: 'demo-lonely',
          name: 'Демо одинокий десерт',
          composition: 'тест',
          weightGrams: 100,
          priceMinorUnits: 100,
          imageSrc: '/images/products/roll-01.webp',
          imageWidth: 1,
          imageHeight: 1,
          sortOrder: 99,
          categories: { connect: [{ slug: 'desserts' }] },
        },
      });
      const { body } = await get('/products/demo-lonely/related?limit=4').expect(200);
      const list = body as ProductResponse[];
      expect(list).toHaveLength(4);
      expect(ids(list)).not.toContain('demo-lonely');
      expect(ids(list)).toEqual((await expectedIds()).slice(0, 4));
    });

    it('частичное дополнение: похожие идут первыми, затем остальные без повторов', async () => {
      // у товара в категории salads всего 5 товаров, лимит 9 требует дополнения
      const { body } = await get('/products/demo-29/related?limit=9').expect(200);
      const list = body as ProductResponse[];
      expect(list).toHaveLength(9);
      expect(new Set(ids(list)).size).toBe(9);
      expect(ids(list)).not.toContain('demo-29');
      const salads = list.filter((p) => p.categories.includes('salads'));
      expect(salads.length).toBeGreaterThan(0);
      // все «салатные» товары расположены перед остальными
      const firstOther = list.findIndex((p) => !p.categories.includes('salads'));
      expect(list.slice(firstOther).some((p) => p.categories.includes('salads'))).toBe(
        false,
      );
    });

    it('не больше двух выборок товаров и никакого полного обхода каталога', async () => {
      const findMany = vi.spyOn(prisma.client.product, 'findMany');
      try {
        await get('/products/demo-29/related?limit=9').expect(200);
        expect(findMany.mock.calls.length).toBeLessThanOrEqual(2);
        for (const [args] of findMany.mock.calls) {
          expect(args).toHaveProperty('take');
        }
      } finally {
        findMany.mockRestore();
      }
    });

    it('неизвестный и неактивный товар — 404', async () => {
      await get('/products/no-such-roll/related').expect(404);
      await get(`/products/${INACTIVE_PRODUCT.slug}/related`).expect(404);
    });

    it.each(['0', '13', 'abc', '-1'])('limit=%s — 400', async (limit) => {
      await get(`/products/baked-crab/related?limit=${limit}`).expect(400);
    });
  });

  describe('существующие маршруты', () => {
    it('/products/by-ids работает с демо-товарами', async () => {
      const { body } = await get('/products/by-ids?ids=demo-01,1,nope').expect(200);
      expect(ids(body.available)).toEqual(['demo-01', '1']);
      expect(body.missing).toEqual(['nope']);
    });

    it('/products/:slug отдаёт демо-товар', async () => {
      const { body } = await get('/products/demo-40').expect(200);
      expect(body).toMatchObject({ id: 'demo-40', slug: 'demo-40' });
    });

    it('/categories не изменился', async () => {
      const { body } = await get('/categories').expect(200);
      expect(Array.isArray(body)).toBe(true);
      expect(body).toHaveLength(8);
    });
  });

  describe('демо-данные (идемпотентность и очистка)', () => {
    it('повторный запуск seed не создаёт дубли', async () => {
      await seedDemoCatalog(prisma.client);
      expect(
        await prisma.client.product.count({ where: { id: { startsWith: 'demo-' } } }),
      ).toBe(DEMO_PRODUCT_COUNT + 1); // + demo-lonely из теста рекомендаций
    });

    it('очистка удаляет только демо-товары и не трогает основной каталог', async () => {
      const removed = await cleanDemoCatalog(prisma.client);
      expect(removed).toBe(DEMO_PRODUCT_COUNT + 1);
      expect(await expectedIds()).toEqual(['1', '2', '3', '4', '5', '6', '7', '8']);
      expect(await prisma.client.product.count({ where: { id: INACTIVE_PRODUCT.id } })).toBe(1);
      expect(await prisma.client.category.count()).toBe(8);
    });
  });
});
