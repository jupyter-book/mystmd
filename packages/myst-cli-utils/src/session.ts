import { chalkLogger, LogLevel } from './logger';
import type { Logger, ISession } from './types';

export class Session implements ISession {
  log: Logger;
  constructor(opts?: { logger?: Logger }) {
    this.log = opts?.logger ?? chalkLogger(LogLevel.debug, process.cwd());
  }
}

export function getSession(logger: Logger) {
  return new Session({ logger });
}
