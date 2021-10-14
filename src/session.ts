import fetch from 'node-fetch';
import jwt from 'jsonwebtoken';
import { createStore, Store } from 'redux';
import { basicLogger, Logger, LogLevel } from './logging';
import { rootReducer, RootState } from './store';
import CLIENT_VERSION from './version';

const CLIENT_NAME = 'Curvenote Javascript Client';

export type SessionOptions = {
  apiUrl?: string;
  siteUrl?: string;
};

function assertTokenWillWork(token: string, log: Logger) {
  // This doesn't verify, but does check if it is going to work, for some early feedback
  const decoded = jwt.decode(token);
  if (!decoded || typeof decoded === 'string') {
    throw new Error('Could not decode session token. Please ensure that the API token is valid.');
  }
  const timeLeft = (decoded.exp as number) * 1000 - Date.now();
  if (timeLeft < 0) {
    throw new Error('The API token has expired.');
  }
  if (timeLeft < 5 * 60 * 1000) {
    log.warn('The token has less than ten minutes remaining');
  }
}

export class Session {
  API_URL: string;

  SITE_URL: string;

  $headers: Record<string, string> = {
    'X-Client-Name': CLIENT_NAME,
    'X-Client-Version': CLIENT_VERSION,
  };

  $store: Store<RootState>;

  constructor(token?: string, opts: SessionOptions = {}) {
    if (token) assertTokenWillWork(token, this.log);
    if (token) this.$headers.Authorization = `Bearer ${token}`;
    this.API_URL = opts.apiUrl ?? 'https://api.curvenote.com';
    this.SITE_URL = opts.siteUrl ?? 'https://curvenote.com';
    this.$store = createStore(rootReducer);
  }

  get isAnon() {
    return !this.$headers.Authorization;
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
