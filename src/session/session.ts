import fetch from 'node-fetch';
import { createStore, Store } from 'redux';
import { JsonObject } from '@curvenote/blocks';
import { basicLogger, Logger, LogLevel } from '../logging';
import { rootReducer, RootState } from '../store';
import { getHeaders, setSessionOrUserToken } from './tokens';
import { ISession, Response, Tokens } from './types';
import { CurvenoteConfig, CURVENOTE_YML, loadCurvenoteConfig } from '../config';

const DEFAULT_API_URL = 'https://api.curvenote.com';
const DEFAULT_SITE_URL = 'https://curvenote.com';

export type SessionOptions = {
  apiUrl?: string;
  siteUrl?: string;
  logger?: Logger;
  config?: string;
};

function withQuery(url: string, query: Record<string, string> = {}) {
  const params = Object.entries(query ?? {})
    .map(([k, v]) => `${k}=${encodeURIComponent(v)}`)
    .join('&');
  if (params.length === 0) return url;
  return url.indexOf('?') === -1 ? `${url}?${params}` : `${url}&${params}`;
}

export class Session implements ISession {
  API_URL: string;

  SITE_URL: string;

  $tokens: Tokens;

  store: Store<RootState>;

  configPath: string;

  config: CurvenoteConfig | null;

  $logger: Logger;

  get log(): Logger {
    return this.$logger;
  }

  get isAnon() {
    return !(this.$tokens.user || this.$tokens.session);
  }

  constructor(token?: string, opts: SessionOptions = {}) {
    this.$logger = opts.logger ?? basicLogger(LogLevel.info);
    const { tokens, url } = setSessionOrUserToken(this.log, token);
    this.$tokens = tokens;
    this.API_URL = opts.apiUrl ?? url ?? DEFAULT_API_URL;
    this.SITE_URL = opts.siteUrl ?? DEFAULT_SITE_URL;
    if (this.API_URL !== DEFAULT_API_URL) {
      this.log.warn(`Connecting to API at: "${this.API_URL}".`);
    }
    this.store = createStore(rootReducer);
    this.configPath = opts.config || CURVENOTE_YML;
    this.config = this.loadConfig();
  }

  loadConfig() {
    this.config = loadCurvenoteConfig(this.$logger, this.configPath);
    return this.config;
  }

  async get<T>(url: string, query?: Record<string, string>): Response<T> {
    const withBase = url.startsWith(this.API_URL) ? url : `${this.API_URL}${url}`;
    const fullUrl = withQuery(withBase, query);
    const headers = await getHeaders(this.log, this.$tokens);
    this.log.debug(`GET ${url}`);
    const response = await fetch(fullUrl, {
      method: 'get',
      headers: {
        'Content-Type': 'application/json',
        ...headers,
      },
    });
    return {
      status: response.status,
      json: await response.json(),
    };
  }

  async patch<T>(url: string, data: JsonObject) {
    return this.post<T>(url, data, 'patch');
  }

  async post<T>(url: string, data: JsonObject, method: 'post' | 'patch' = 'post'): Response<T> {
    if (url.startsWith(this.API_URL)) url = url.replace(this.API_URL, '');
    const headers = await getHeaders(this.log, this.$tokens);
    this.log.debug(`${method.toUpperCase()} ${url}`);
    const response = await fetch(`${this.API_URL}${url}`, {
      method,
      headers: {
        'Content-Type': 'application/json',
        ...headers,
      },
      body: JSON.stringify(data),
    });
    return {
      status: response.status,
      json: await response.json(),
    };
  }
}
