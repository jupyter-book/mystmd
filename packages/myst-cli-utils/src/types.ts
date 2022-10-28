export type Logger = Pick<typeof console, 'debug' | 'info' | 'warn' | 'error'>;

export type LoggerDE = Pick<Logger, 'debug' | 'error'>;

export interface ISession {
  log: Logger;
}
