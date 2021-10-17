import { Session } from '../../..';
import { chalkLogger, LogLevel } from '../../../logging';
import { getToken } from './config';

export function anonSession(level = LogLevel.info) {
  const session = new Session();
  session.$logger = chalkLogger(level);
  return session;
}

export function getSession(level = LogLevel.info): Session {
  const logger = chalkLogger(level);
  const token = process.env.CURVENOTE_TOKEN || getToken();
  if (!token) {
    logger.warn('No token was found in settings or CURVENOTE_TOKEN. Session is not authenticated.');
    logger.info('You can set a token with:');
    logger.info('curvenote token set YOUR_API_TOKEN');
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
