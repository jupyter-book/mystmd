import type { RequestInfo, RequestInit, Response } from 'node-fetch';

export type Logger = Pick<typeof console, 'debug' | 'info' | 'warn' | 'error'>;

export type LoggerDE = Pick<Logger, 'debug' | 'error'>;

export interface ISession {
  log: Logger;
  fetch(url: URL | RequestInfo, init?: RequestInit): Promise<Response>;
}
