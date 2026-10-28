import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { App } from 'supertest/types.js';
import { AppModule } from '../src/app.module.js';
import { configureApp } from '../src/app.setup.js';

// На Vercel Services путь /api/... доходит до NestJS без изменений, поэтому с API_PREFIX=/api
// все маршруты живут под /api, а без префикса (локальная разработка) — как раньше.
describe('API_PREFIX (e2e)', () => {
  const create = async (apiPrefix: string) => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();
    const app: INestApplication<App> = moduleRef.createNestApplication();
    configureApp(app, { apiPrefix });
    await app.init();
    return app;
  };

  describe('с префиксом api', () => {
    let app: INestApplication<App>;
    beforeAll(async () => {
      app = await create('api');
    });
    afterAll(() => app.close());

    it('маршруты каталога доступны под /api', async () => {
      await request(app.getHttpServer()).get('/api/categories').expect(200);
      const page = await request(app.getHttpServer())
        .get('/api/products?limit=2')
        .expect(200);
      expect(page.body).toHaveProperty('nextCursor');
      await request(app.getHttpServer())
        .get('/api/products/by-ids?ids=1')
        .expect(200);
    });

    it('те же маршруты без префикса больше не отвечают', async () => {
      await request(app.getHttpServer()).get('/categories').expect(404);
      await request(app.getHttpServer()).get('/products').expect(404);
    });
  });

  describe('без префикса', () => {
    let app: INestApplication<App>;
    beforeAll(async () => {
      app = await create('');
    });
    afterAll(() => app.close());

    it('маршруты остаются на прежних адресах', async () => {
      await request(app.getHttpServer()).get('/categories').expect(200);
      await request(app.getHttpServer()).get('/api/categories').expect(404);
    });
  });
});
