import fetch from 'node-fetch';
import { createStore, Store } from 'redux';
import { basicLogger, Logger, LogLevel } from './logging';
import { rootReducer, RootState } from './store';
import CLIENT_VERSION from './version';

const CLIENT_NAME = 'Curvenote Javascript Client';

export type SessionOptions = {
  apiUrl?: string;
  siteUrl?: string;
};

export class Session {
  API_URL: string;

  SITE_URL: string;

  $headers: Record<string, string> = {
    'X-Client-Name': CLIENT_NAME,
    'X-Client-Version': CLIENT_VERSION,
  };

  $store: Store<RootState>;

  constructor(token: string, opts: SessionOptions = {}) {
    this.$headers.Authorization = `Bearer ${token}`;
    this.API_URL = opts.apiUrl ?? 'https://api.curvenote.com';
    this.SITE_URL = opts.siteUrl ?? 'https://curvenote.com';
    this.$store = createStore(rootReducer);
  }

  async get(url: string) {
    if (url.startsWith(this.API_URL)) url = url.replace(this.API_URL, '');
    const response = await fetch(`${this.API_URL}${url}`, {
      method: 'get',
      headers: {
        'Content-Type': 'application/json',
        ...this.$headers,
      },
    });
    return {
      status: response.status,
      json: await response.json(),
    };
  }

  $logger: Logger = basicLogger(LogLevel.info);

  get log(): Logger {
    return this.$logger;
  }
}
