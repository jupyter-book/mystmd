import type { Command } from 'commander';
import { chalkLogger, LogLevel } from '../logger';
import { Session } from '../session';
import type { ISession } from '../types';

type SessionOpts = {
  debug?: boolean;
};

function getLogLevel(level: LogLevel | boolean | string = LogLevel.info): LogLevel {
  if (typeof level === 'number') return level;
  const useLevel: LogLevel = level ? LogLevel.debug : LogLevel.info;
  return useLevel;
}

export function anonSession(opts?: SessionOpts): ISession {
  const logger = chalkLogger(getLogLevel(opts?.debug));
  const session = new Session({ logger });
  return session;
}

function getSession(opts?: SessionOpts & { hideNoTokenWarning?: boolean }): ISession {
  const logger = chalkLogger(getLogLevel(opts?.debug));
  let session;
  try {
    session = new Session({ logger });
  } catch (error) {
    logger.error((error as Error).message);
    logger.info('You can remove your token using:');
    logger.info('curvenote token remove');
    process.exit(1);
  }
  return session;
}

export function clirun(
  func:
    | ((session: ISession, ...args: any[]) => Promise<void>)
    | ((session: ISession, ...args: any[]) => void),
  cli: {
    program: Command;
    anonymous?: boolean;
    requireSiteConfig?: boolean;
    hideNoTokenWarning?: boolean;
  },
) {
  return async (...args: any[]) => {
    const opts = cli.program.opts() as SessionOpts;
    const useSession = cli.anonymous
      ? anonSession(opts)
      : getSession({ ...opts, hideNoTokenWarning: cli.hideNoTokenWarning });
    try {
      await func(useSession, ...args);
    } catch (error) {
      if (opts.debug) {
        useSession.log.debug(`\n\n${(error as Error)?.stack}\n\n`);
      }
      useSession.log.error((error as Error).message);
      process.exit(1);
    }
  };
}
