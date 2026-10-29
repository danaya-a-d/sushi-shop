import { createBootLog, describeError } from './diagnostics/boot-log.js';

// Диагностический запуск (временный): статические импорты выполнились бы до первого лога, поэтому
// приложение подгружается динамически. Так видно, на каком этапе остановился запуск:
//  - нет даже `entry-loaded`: этот файл не выполнялся (упаковка функции);
//  - `module-load-failed`: не загрузились модули приложения (зависимости, пути ESM);
//  - дальше этапы create/init/listen: приложение загрузилось, остановка на конкретном этапе.
//
// Важно: на верхнем уровне нет `await`. Vercel Services подменяет запуск HTTP-сервера, и промис
// `app.listen()` там не завершается: `await bootstrap()` на верхнем уровне блокировал бы загрузку
// модуля, и функция так и не начинала принимать запросы (см. документацию Vercel для NestJS).
const log = createBootLog();
log('entry-loaded', { node: process.version, url: import.meta.url, cwd: process.cwd() });

process.on('unhandledRejection', (reason) => log('unhandledRejection', describeError(reason)));
process.on('uncaughtException', (error) => {
  log('uncaughtException', describeError(error));
  process.exit(1);
});

import('./bootstrap.js')
  .then(
    (module) => {
      log('modules-loaded');
      return module.bootstrap(log);
    },
    (error: unknown) => {
      log('module-load-failed', describeError(error));
      throw error;
    },
  )
  .catch((error: unknown) => {
    log('bootstrap-failed', describeError(error));
    process.exitCode = 1;
  });
