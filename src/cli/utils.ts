import chalk from 'chalk';
import { chalkLogger, LogLevel } from '../logging';
import { Session } from '../session';

export function getSession(level = LogLevel.info): Session {
  const token = process.env.CURVENOTE_TOKEN;
  if (!token) {
    // eslint-disable-next-line no-console
    console.log(chalk.red('Set the environment variable CURVENOTE_TOKEN'));
    return process.exit(1);
  }
  const session = new Session(token);
  session.$logger = chalkLogger(level);
  return session;
}

export async function runFunction<T>(session: Session, func: () => Promise<T>) {
  let r;
  try {
    r = await func();
  } catch (error) {
    session.log.error((error as Error).message);
    process.exit(1);
  }
  return r;
}
