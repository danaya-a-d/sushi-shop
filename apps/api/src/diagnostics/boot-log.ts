// ВРЕМЕННАЯ диагностика запуска API на Vercel Services (ветка debug/vercel-api-startup).
// Удалить вместе с этапами `[boot]` в main.ts, bootstrap.ts и prisma.service.ts после выяснения причины.

export type BootLog = (stage: string, details?: Record<string, unknown>) => void;

/** Лог с меткой времени от запуска процесса: по нему видно, где остановился запуск. */
export function createBootLog(): BootLog {
  return (stage, details) => {
    const elapsed = Math.round(process.uptime() * 1000);
    const suffix = details ? ` ${JSON.stringify(details)}` : '';
    console.log(`[boot] +${elapsed}ms ${stage}${suffix}`);
  };
}

/** Безопасное описание DATABASE_URL: только факты о форме, без хоста, логина и пароля. */
export function describeDatabaseUrl(value = process.env.DATABASE_URL): Record<string, unknown> {
  if (!value) return { set: false };
  try {
    const url = new URL(value);
    return {
      set: true,
      protocol: url.protocol,
      pooledHost: url.hostname.includes('-pooler'),
      sslmode: url.searchParams.get('sslmode'),
      channelBinding: url.searchParams.get('channel_binding'),
    };
  } catch {
    return { set: true, parsable: false };
  }
}

/** Ограничивает ожидание: вместо тихого зависания этап завершается понятной ошибкой. */
export async function withTimeout<T>(promise: Promise<T>, ms: number, label: string): Promise<T> {
  let timer: NodeJS.Timeout | undefined;
  const timeout = new Promise<never>((_, reject) => {
    timer = setTimeout(() => reject(new Error(`${label}: нет ответа за ${ms} мс`)), ms);
  });
  try {
    return await Promise.race([promise, timeout]);
  } finally {
    clearTimeout(timer);
  }
}

/** Краткое описание ошибки для лога: имя, код и первая строка сообщения (без стека и секретов). */
export function describeError(error: unknown): Record<string, unknown> {
  if (error instanceof Error) {
    const code = (error as { code?: unknown }).code;
    return { name: error.name, code, message: error.message.split('\n')[0] };
  }
  return { message: String(error) };
}
