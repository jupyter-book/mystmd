import type { Store } from 'redux';
import type { Logger } from '../logging';
import type { RootState } from '../store';

export type Tokens = Partial<Record<'user' | 'session', string>>;

export type Response<T extends Record<string, any> = any> = Promise<{
  ok: boolean;
  status: number;
  json: T;
}>;

export interface ISession {
  API_URL: string;

  SITE_URL: string;

  store: Store<RootState>;

  isAnon: boolean;

  reload(): void;

  get<T extends Record<string, any> = any>(
    url: string,
    query?: Record<string, string>,
  ): Response<T>;

  post<T extends Record<string, any> = any>(url: string, data: unknown): Response<T>;

  patch<T extends Record<string, any> = any>(url: string, data: unknown): Response<T>;

  log: Logger;
}
