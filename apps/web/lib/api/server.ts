import "server-only";
import type { ZodType } from "zod";
import { getJson, normalizeBaseUrl, normalizePathPrefix } from "./http";

// Серверный клиент (Server Components, generateMetadata, generateStaticParams).
// Адрес API_URL читается только на сервере и в браузерный bundle не попадает.
// Локально это http://localhost:3001; на Vercel Services — внутренний URL сервиса api из Service Binding
// (он доступен только в runtime, при сборке его нет). Префикс путей API_PREFIX (на Vercel «/api»)
// добавляется к адресу: Vercel не срезает его, а NestJS обслуживает маршруты под тем же префиксом.

type ApiGetOptions = {
  /** Кэш данных Next: сколько секунд ответ считается свежим. 0 или не задано — без кэша */
  revalidate?: number;
};

export function apiGet<T>(
  schema: ZodType<T>,
  path: string,
  { revalidate }: ApiGetOptions = {},
): Promise<T> {
  return getJson(schema, {
    baseUrl:
      normalizeBaseUrl(process.env.API_URL, "API_URL") + normalizePathPrefix(process.env.API_PREFIX),
    path,
    init: revalidate
      ? { next: { revalidate, tags: ["catalog"] } }
      : { cache: "no-store" },
  });
}
