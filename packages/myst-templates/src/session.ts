import { chalkLogger, LogLevel } from 'myst-cli-utils';
import type { Logger } from 'myst-cli-utils';
import type { ISession } from './types';

export class Session implements ISession {
  API_URL = 'https://api.myst.tools';
  log: Logger;
  constructor(opts?: { logger?: Logger }) {
    this.log = opts?.logger ?? chalkLogger(LogLevel.debug);
  }
}

export function getSession(logger: Logger) {
  return new Session({ logger });
}
