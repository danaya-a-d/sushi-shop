import { afterEach, describe, expect, it, vi } from 'vitest';
import { describeDatabaseUrl, describeError, withTimeout } from './boot-log.js';

describe('describeDatabaseUrl', () => {
  it('не раскрывает хост, логин и пароль', () => {
    const url = 'postgresql://user:s3cret@ep-cool-123-pooler.eu-central-1.aws.neon.tech/db?sslmode=require';
    const text = JSON.stringify(describeDatabaseUrl(url));
    expect(text).not.toContain('s3cret');
    expect(text).not.toContain('user');
    expect(text).not.toContain('neon.tech');
    expect(describeDatabaseUrl(url)).toMatchObject({ set: true, pooledHost: true, sslmode: 'require' });
  });

  it('различает пустое и нераспознаваемое значение', () => {
    expect(describeDatabaseUrl('')).toEqual({ set: false });
    expect(describeDatabaseUrl('not a url')).toEqual({ set: true, parsable: false });
  });
});

describe('withTimeout', () => {
  afterEach(() => vi.useRealTimers());

  it('возвращает результат, если этап успел', async () => {
    await expect(withTimeout(Promise.resolve(42), 100, 'этап')).resolves.toBe(42);
  });

  it('падает понятной ошибкой, если этап завис', async () => {
    vi.useFakeTimers();
    const pending = withTimeout(new Promise<never>(() => undefined), 1000, 'подключение');
    const assertion = expect(pending).rejects.toThrow('подключение: нет ответа за 1000 мс');
    await vi.advanceTimersByTimeAsync(1000);
    await assertion;
  });

  it('пробрасывает ошибку этапа', async () => {
    await expect(withTimeout(Promise.reject(new Error('boom')), 100, 'этап')).rejects.toThrow('boom');
  });
});

describe('describeError', () => {
  it('берёт имя, код и первую строку без стека', () => {
    const error = Object.assign(new Error('первая\nвторая'), { code: 'ERR_MODULE_NOT_FOUND' });
    expect(describeError(error)).toEqual({ name: 'Error', code: 'ERR_MODULE_NOT_FOUND', message: 'первая' });
  });
});
