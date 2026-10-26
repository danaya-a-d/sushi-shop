import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { App } from 'supertest/types.js';
import { AppModule } from '../src/app.module.js';
import { configureApp } from '../src/app.setup.js';

describe('CORS (e2e)', () => {
  let app: INestApplication<App>;
  const previous = process.env.WEB_ORIGINS;

  beforeAll(async () => {
    process.env.WEB_ORIGINS = 'http://localhost:3000';
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();
    app = moduleRef.createNestApplication();
    configureApp(app);
    await app.init();
  });

  afterAll(async () => {
    await app.close();
    if (previous === undefined) delete process.env.WEB_ORIGINS;
    else process.env.WEB_ORIGINS = previous;
  });

  const get = (origin: string) =>
    request(app.getHttpServer()).get('/products/by-ids?ids=1').set('Origin', origin);

  it('разрешённому origin отдаёт его в Access-Control-Allow-Origin (не *)', async () => {
    const res = await get('http://localhost:3000').expect(200);
    expect(res.headers['access-control-allow-origin']).toBe(
      'http://localhost:3000',
    );
  });

  it('чужому origin заголовок не выдаётся', async () => {
    const res = await get('http://evil.example').expect(200);
    expect(res.headers['access-control-allow-origin']).toBeUndefined();
  });

  it('preflight разрешённого origin проходит только для чтения', async () => {
    const res = await request(app.getHttpServer())
      .options('/products/by-ids')
      .set('Origin', 'http://localhost:3000')
      .set('Access-Control-Request-Method', 'GET')
      .expect(204);
    expect(res.headers['access-control-allow-methods']).toBe('GET,HEAD');
  });
});
