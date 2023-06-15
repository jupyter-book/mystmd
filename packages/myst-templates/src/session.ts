import { chalkLogger, LogLevel } from 'myst-cli-utils';
import type { Logger } from 'myst-cli-utils';
import type { ISession } from './types.js';

export class Session implements ISession {
  API_URL = 'https://api.mystmd.org';
  log: Logger;
  constructor(opts?: { logger?: Logger }) {
    this.log = opts?.logger ?? chalkLogger(LogLevel.debug);
  }
}

export function getSession(logger: Logger) {
  return new Session({ logger });
}
