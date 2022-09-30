import chalk from 'chalk';
import type { Logger, LoggerDE } from 'myst-cli-utils';
import { LogLevel } from 'myst-cli-utils';
import type { ISession } from './session/types';

export function getLevel(logger: Logger, level: LogLevel): Logger['info'] {
  switch (level) {
    case LogLevel.trace:
    case LogLevel.debug:
      return logger.debug;
    case LogLevel.info:
      return logger.info;
    case LogLevel.warn:
      return logger.warn;
    case LogLevel.error:
    case LogLevel.fatal:
      return logger.error;
    default:
      throw new Error(`Level "${level}" not defined.`);
  }
}

export function createServerLogger(session: ISession): LoggerDE {
  const logger = {
    debug(data: string) {
      const line = data.trim();
      if (!line || line.startsWith('>') || line.startsWith('Watching')) return;
      if (line.includes('File changed: app/content')) return; // This is shown elsewhere
      if (line.includes('started at http://')) {
        const [, ipAndPort] = line.split('http://');
        const port = ipAndPort.split(':')[1].replace(/[^0-9]/g, '');
        const local = `http://localhost:${port}`;
        session.log.info(
          `\n🔌 Server started on port ${port}!🥳 🎉\n\n\n\t👉  ${chalk.green(local)}  👈\n\n`,
        );
        return;
      }
      session.log.info(
        line
          .replace(/💿/g, '🚀')
          .replace(/(GET) /, '💌 $1  ')
          .replace(/(POST) /, '📦 $1 '),
      );
    },
    error(data: string) {
      const line = data.trim();
      if (!line) return;
      // This is a spurious Remix warning https://github.com/remix-run/remix/issues/2677
      if (line.includes('is not listed in your package.json dependencies')) return;
      if (line.startsWith('Done in')) {
        session.log.info(`⚡️ ${line.replace('Done', 'Compiled')}`);
        return;
      }
      session.log.error(data);
    },
  };
  return logger;
}
