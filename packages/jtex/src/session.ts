import { chalkLogger, LogLevel } from './logger';
import type { ISession, Logger } from './types';

export class Session implements ISession {
  API_URL = 'https://api.curvenote.com';
  log: Logger;
  constructor(opts?: { logger?: Logger }) {
    this.log = opts?.logger ?? chalkLogger(LogLevel.debug);
  }
}
