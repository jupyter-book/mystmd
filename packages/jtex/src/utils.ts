import fs from 'fs';
import type { ISession } from './types';

export function ensureDirectoryExists(directory: string) {
  if (!fs.existsSync(directory)) fs.mkdirSync(directory, { recursive: true });
}

export function errorLogger(session: ISession) {
  return (message: string) => session.log.error(message);
}

export function warningLogger(session: ISession) {
  return (message: string) => session.log.warn(message);
}
