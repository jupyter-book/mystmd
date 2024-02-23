import { chalkLogger, LogLevel } from 'myst-cli-utils';
import type { Logger } from 'myst-cli-utils';
import type { ISession } from './types.js';
import { default as nodeFetch } from 'node-fetch';
import type { RequestInfo, RequestInit, Response } from 'node-fetch';

export class Session implements ISession {
  API_URL = 'https://api.mystmd.org';
  log: Logger;
  constructor(opts?: { logger?: Logger }) {
    this.log = opts?.logger ?? chalkLogger(LogLevel.debug);
  }

  async fetch(url: URL | RequestInfo, init?: RequestInit): Promise<Response> {
    const resp = await nodeFetch(url, init);
    return resp;
  }
}

export function getSession(logger: Logger) {
  return new Session({ logger });
}
