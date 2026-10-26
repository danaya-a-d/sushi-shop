import type { ZodType } from "zod";

export type ApiErrorKind =
  /** API не ответил: нет сети, недоступен сервер, таймаут */
  | "network"
  /** API ответил статусом не 2xx */
  | "http"
  /** Ответ не похож на контракт */
  | "invalid";

export class ApiError extends Error {
  constructor(
    message: string,
    readonly kind: ApiErrorKind,
    /** HTTP-статус для kind = "http" */
    readonly status?: number,
    options?: ErrorOptions,
  ) {
    super(message, options);
    this.name = "ApiError";
  }
}

export type RequestOptions = {
  /** Адрес API без завершающего слэша, например http://localhost:3001 */
  baseUrl: string;
  path: string;
  /** Доп. параметры fetch (signal, next и т. д.) */
  init?: RequestInit;
  /** Своя реализация fetch: в тестах */
  fetchImpl?: typeof fetch;
};

/** GET JSON с проверкой схемы. Любая проблема превращается в ApiError. */
export async function getJson<T>(
  schema: ZodType<T>,
  { baseUrl, path, init, fetchImpl = fetch }: RequestOptions,
): Promise<T> {
  let response: Response;
  try {
    response = await fetchImpl(`${baseUrl}${path}`, {
      ...init,
      headers: { Accept: "application/json", ...init?.headers },
    });
  } catch (cause) {
    throw new ApiError(`API недоступен: ${path}`, "network", undefined, { cause });
  }

  if (!response.ok) {
    throw new ApiError(`API вернул ${response.status}: ${path}`, "http", response.status);
  }

  let body: unknown;
  try {
    body = await response.json();
  } catch {
    throw new ApiError(`API вернул не JSON: ${path}`, "invalid", response.status);
  }

  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    throw new ApiError(`Неожиданный формат ответа API: ${path}`, "invalid", response.status);
  }
  return parsed.data;
}

/** Нормализует адрес из переменной окружения: убирает пробелы и завершающие слэши. */
export function normalizeBaseUrl(value: string | undefined, variable: string): string {
  const url = value?.trim().replace(/\/+$/, "");
  if (!url) {
    throw new Error(`Не задана переменная окружения ${variable} (адрес NestJS API, см. apps/web/.env.example)`);
  }
  return url;
}
