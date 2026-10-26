import "server-only";
import type { ZodType } from "zod";
import { getJson, normalizeBaseUrl } from "./http";

// Серверный клиент (Server Components, generateMetadata, generateStaticParams).
// Адрес API_URL читается только на сервере и в браузерный bundle не попадает.

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
    baseUrl: normalizeBaseUrl(process.env.API_URL, "API_URL"),
    path,
    init: revalidate
      ? { next: { revalidate, tags: ["catalog"] } }
      : { cache: "no-store" },
  });
}
