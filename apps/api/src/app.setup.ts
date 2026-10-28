import type { INestApplication } from '@nestjs/common';

/** Список разрешённых origin из WEB_ORIGINS (через запятую). Пусто — CORS не включается. */
export function parseAllowedOrigins(value = process.env.WEB_ORIGINS): string[] {
  return (value ?? '')
    .split(',')
    .map((origin) => origin.trim().replace(/\/$/, ''))
    .filter(Boolean);
}

/**
 * Глобальный префикс маршрутов из API_PREFIX («/api» или «api»). Пусто — маршруты без префикса
 * (локальная разработка). Vercel Services не срезает префикс публичного пути, поэтому там API_PREFIX=/api.
 */
export function parseApiPrefix(value = process.env.API_PREFIX): string {
  return (value ?? '').trim().replace(/^\/+|\/+$/g, '');
}

/**
 * Настройка приложения, общая для main.ts и e2e-тестов. CORS нужен браузерной корзине,
 * если frontend на другом origin (локальная разработка): разрешены только перечисленные origin
 * и только чтение. На Vercel сайт и API на одном origin, WEB_ORIGINS там не нужен.
 * Серверные запросы Next.js CORS не используют.
 */
export function configureApp(
  app: INestApplication,
  { apiPrefix = parseApiPrefix() }: { apiPrefix?: string } = {},
): void {
  if (apiPrefix) {
    app.setGlobalPrefix(apiPrefix);
  }
  const origins = parseAllowedOrigins();
  if (origins.length > 0) {
    app.enableCors({ origin: origins, methods: ['GET', 'HEAD'] });
  }
}
