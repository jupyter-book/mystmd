export type Logger = Pick<typeof console, 'debug' | 'info' | 'warn' | 'error'>;

export interface ISession {
  API_URL: string;

  log: Logger;
}
