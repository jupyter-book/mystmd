import type { ISession } from './types';

export function errorLogger(session: ISession) {
  return (message: string) => session.log.error(message);
}

export function warningLogger(session: ISession) {
  return (message: string) => session.log.warn(message);
}
