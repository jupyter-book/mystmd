import { JsonObject } from '@curvenote/blocks';
import { Store } from 'redux';
import { CurvenoteConfig } from '../config/types';
import { Logger } from '../logging';
import { RootState } from '../store';

export type Tokens = Partial<Record<'user' | 'session', string>>;

export type Response = Promise<{ status: number; json: JsonObject }>;

export interface ISession {
  API_URL: string;

  SITE_URL: string;

  store: Store<RootState>;

  configPath: string;

  config: CurvenoteConfig | null;

  loadConfig(): CurvenoteConfig | null;

  isAnon: boolean;

  get(url: string, query?: Record<string, string>): Response;

  post(url: string, data: JsonObject): Response;

  patch(url: string, data: JsonObject): Response;

  log: Logger;
}
