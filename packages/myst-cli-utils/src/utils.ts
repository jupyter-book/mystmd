import type { Command } from 'commander';
import prettyHrtime from 'pretty-hrtime';
import { chalkLogger, LogLevel } from './logger.js';
import type { ISession, Logger } from './types.js';

type SessionOpts = {
  debug?: boolean;
};

function getLogLevel(level: LogLevel | boolean | string = LogLevel.info): LogLevel {
  if (typeof level === 'number') return level;
  const useLevel: LogLevel = level ? LogLevel.debug : LogLevel.info;
  return useLevel;
}

export function clirun<S extends ISession>(
  func: ((session: S, ...args: any[]) => Promise<void>) | ((session: S, ...args: any[]) => void),
  cli: {
    program: Command;
    getSession: (logger: Logger, opts?: SessionOpts) => S;
  },
) {
  return async (...args: any[]) => {
    const opts = cli.program.opts() as SessionOpts;
    const logger = chalkLogger(getLogLevel(opts?.debug));
    const session = cli.getSession(logger, opts);
    try {
      await func(session, ...args);
    } catch (error) {
      if (opts.debug) {
        logger.debug(`\n\n${(error as Error)?.stack}\n\n`);
      }
      logger.error((error as Error).message);
      process.exit(1);
    }
  };
}

export function tic() {
  let start = process.hrtime();
  function toc(f = '') {
    const time = prettyHrtime(process.hrtime(start));
    start = process.hrtime();
    return f ? f.replace('%s', time) : time;
  }
  return toc;
}
