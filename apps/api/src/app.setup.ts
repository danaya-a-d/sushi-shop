import type { INestApplication } from '@nestjs/common';

/** Список разрешённых origin из WEB_ORIGINS (через запятую). Пусто — CORS не включается. */
export function parseAllowedOrigins(value = process.env.WEB_ORIGINS): string[] {
  return (value ?? '')
    .split(',')
    .map((origin) => origin.trim().replace(/\/$/, ''))
    .filter(Boolean);
}

/**
 * Настройка приложения, общая для main.ts и e2e-тестов. CORS нужен браузерной корзине
 * (frontend на другом origin): разрешены только перечисленные origin и только чтение.
 * Серверные запросы Next.js CORS не используют.
 */
export function configureApp(app: INestApplication): void {
  const origins = parseAllowedOrigins();
  if (origins.length > 0) {
    app.enableCors({ origin: origins, methods: ['GET', 'HEAD'] });
  }
}
