import type { RequestInfo, RequestInit, Response } from 'node-fetch';
import { chalkLogger, LogLevel } from './logger.js';
import type { Logger, ISession } from './types.js';

export class Session implements ISession {
  log: Logger;
  constructor(opts?: { logger?: Logger }) {
    this.log = opts?.logger ?? chalkLogger(LogLevel.debug, process.cwd());
  }
  fetch(url: URL | RequestInfo, init?: RequestInit | undefined): Promise<Response> {
    throw new Error('fetch not implemented on session');
  }
}

export function getSession(logger: Logger) {
  return new Session({ logger });
}
