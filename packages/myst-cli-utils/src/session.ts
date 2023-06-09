import { chalkLogger, LogLevel } from './logger.js';
import type { Logger, ISession } from './types.js';

export class Session implements ISession {
  log: Logger;
  constructor(opts?: { logger?: Logger }) {
    this.log = opts?.logger ?? chalkLogger(LogLevel.debug, process.cwd());
  }
}

export function getSession(logger: Logger) {
  return new Session({ logger });
}
