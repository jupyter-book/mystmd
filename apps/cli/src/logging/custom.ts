import chalk from 'chalk';
import type { ISession } from '../session/types';
import type { Logger } from './index';

type LoggerDE = Pick<Logger, 'debug' | 'error'>;

export function getGitLogger(session: ISession): LoggerDE {
  const logger = {
    debug(data: string) {
      const line = data.trim();
      if (!line) return;
      session.log.debug(data);
    },
    error(data: string) {
      const line = data.trim();
      if (!line) return;
      if (line.startsWith('Cloning into') || line.startsWith('Submodule')) {
        session.log.debug(line);
        return;
      }
      session.log.error(data);
    },
  };
  return logger;
}

export function getNpmLogger(session: ISession): LoggerDE {
  const logger = {
    debug(data: string) {
      const line = data.trim();
      if (!line) return;
      session.log.debug(data);
    },
    error(data: string) {
      const line = data.trim();
      if (!line) return;
      if (
        line.includes('deprecated') ||
        line.includes('package is no longer supported') ||
        line === 'npm' ||
        line.includes('WARN')
      ) {
        session.log.debug(line);
        return;
      }
      session.log.error(data);
    },
  };
  return logger;
}

export function getServerLogger(session: ISession): LoggerDE {
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
