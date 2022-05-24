import { JsonObject } from '@curvenote/blocks';
import { Store } from 'redux';
import { CurvenoteConfig } from '../config/types';
import { Logger } from '../logging';
import { RootState } from '../store';

export type Tokens = Partial<Record<'user' | 'session', string>>;

export type Response<T extends JsonObject = JsonObject> = Promise<{
  ok: boolean;
  status: number;
  json: T;
}>;

export interface ISession {
  API_URL: string;

  SITE_URL: string;

  store: Store<RootState>;

  configPath: string;

  config: CurvenoteConfig | null;

  loadConfig(): CurvenoteConfig | null;

  isAnon: boolean;

  get<T extends JsonObject = JsonObject>(url: string, query?: Record<string, string>): Response<T>;

  post<T extends JsonObject = JsonObject>(url: string, data: JsonObject): Response<T>;

  patch<T extends JsonObject = JsonObject>(url: string, data: JsonObject): Response<T>;

  log: Logger;
}
