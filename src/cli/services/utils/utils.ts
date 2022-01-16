import fs from 'fs';
import { Command } from 'commander';
import { Session } from '../../..';
import { chalkLogger, LogLevel } from '../../../logging';
import { getToken } from '../../../session';

function getLogLevel(level: LogLevel | Command = LogLevel.info): LogLevel {
  let useLevel: LogLevel = typeof level === 'number' ? level : LogLevel.info;
  if (typeof level !== 'number') {
    useLevel = level.opts().debug ? LogLevel.debug : LogLevel.info;
  }
  return useLevel;
}

export function anonSession(level?: LogLevel | Command) {
  const session = new Session();
  session.$logger = chalkLogger(getLogLevel(level));
  return session;
}

export function getSession(level?: LogLevel | Command): Session {
  const logger = chalkLogger(getLogLevel(level));
  const token = getToken(logger);
  if (!token) {
    logger.warn('No token was found in settings or CURVENOTE_TOKEN. Session is not authenticated.');
    logger.info('You can set a token with:');
    logger.info('curvenote token set API_TOKEN');
  }
  let session;
  try {
    session = new Session(token);
    session.$logger = logger;
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
    | ((session: Session, ...args: any[]) => Promise<void>)
    | ((session: Session, ...args: any[]) => void),
  cli: { program: Command; session?: Session },
) {
  return async (...args: any[]) => {
    const useSession = cli.session ?? getSession(cli.program);
    try {
      await func(useSession, ...args);
    } catch (error) {
      const opts = cli.program.opts();
      if (opts.debug === true) {
        useSession.log.debug(`\n\n${(error as Error)?.stack}\n\n`);
      } else if (opts.debug) {
        fs.writeFileSync(opts.debug, (error as Error)?.stack ?? '');
      }
      useSession.log.error((error as Error).message);
      process.exit(1);
    }
  };
}
