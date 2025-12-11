import type { ISession } from './types.js';

export function errorLogger(session: ISession) {
  return (message: string) => session.log.error(message);
}

export function warningLogger(session: ISession) {
  return (message: string) => session.log.warn(message);
}

export function debugLogger(session: ISession) {
  return (message: string) => session.log.debug(message);
}
