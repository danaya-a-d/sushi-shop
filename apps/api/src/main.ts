import { createBootLog, describeError } from './diagnostics/boot-log.js';

// Диагностический запуск (временный): статические импорты выполнились бы до первого лога, поэтому
// приложение подгружается динамически. Так видно, на каком этапе остановился запуск:
//  - нет даже `entry-loaded`: этот файл не выполнялся (упаковка функции);
//  - `module-load-failed`: не загрузились модули приложения (зависимости, пути ESM);
//  - дальше этапы create/init/listen: приложение загрузилось, остановка на конкретном этапе.
const log = createBootLog();
log('entry-loaded', { node: process.version, url: import.meta.url, cwd: process.cwd() });

process.on('unhandledRejection', (reason) => log('unhandledRejection', describeError(reason)));
process.on('uncaughtException', (error) => {
  log('uncaughtException', describeError(error));
  process.exit(1);
});

let bootstrap: (log: ReturnType<typeof createBootLog>) => Promise<void>;
try {
  ({ bootstrap } = await import('./bootstrap.js'));
  log('modules-loaded');
} catch (error) {
  log('module-load-failed', describeError(error));
  throw error;
}

try {
  await bootstrap(log);
} catch (error) {
  log('bootstrap-failed', describeError(error));
  throw error;
}
