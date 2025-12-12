import { chalkLogger, LogLevel } from 'myst-cli-utils';
import type { Logger } from 'myst-cli-utils';
import type { ISession } from './types.js';
import { default as nodeFetch } from 'node-fetch';
import type { RequestInfo, RequestInit, Response } from 'node-fetch';

const DEFAULT_API_URL = 'https://api.mystmd.org';

export class Session implements ISession {
  API_URL: string;
  log: Logger;
  constructor(opts?: { logger?: Logger }) {
    // use env variable if set
    this.API_URL = process.env.API_URL ?? DEFAULT_API_URL;
    // trailing slashes will cause issues
    this.API_URL = this.API_URL.replace(/\/+$/, '');
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
