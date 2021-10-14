import chalk from 'chalk';
import { Session } from '../../..';
import { chalkLogger, LogLevel } from '../../../logging';
import { getToken } from './config';

export function anonSession(level = LogLevel.info) {
  const session = new Session();
  session.$logger = chalkLogger(level);
  return session;
}

export function getSession(level = LogLevel.info): Session {
  const token = process.env.CURVENOTE_TOKEN || getToken();
  if (!token) {
    // eslint-disable-next-line no-console
    console.log(
      chalk.yellow(
        'No token was found in settings or CURVENOTE_TOKEN. Session is not authenticated.',
      ),
    );
  }
  const session = new Session(token);
  session.$logger = chalkLogger(level);
  return session;
}

export function clirun(
  func:
    | ((session: Session, ...args: any[]) => Promise<void>)
    | ((session: Session, ...args: any[]) => void),
  session?: Session,
) {
  return async (...args: any[]) => {
    const useSession = session ?? getSession();
    try {
      await func(useSession, ...args);
    } catch (error) {
      useSession.log.error((error as Error).message);
      process.exit(1);
    }
  };
}
