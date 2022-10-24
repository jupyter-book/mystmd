import path from 'path';
import fetch from 'node-fetch';
import type { Store } from 'redux';
import { createStore } from 'redux';
import { findCurrentProjectAndLoad, findCurrentSiteAndLoad, selectors } from 'myst-cli';
import type { Logger } from 'myst-cli-utils';
import { LogLevel, basicLogger } from 'myst-cli-utils';
import type { RootState } from '../store';
import { rootReducer } from '../store';
import { checkForClientVersionRejection } from '../utils';
import { getHeaders, setSessionOrUserToken } from './tokens';
import type { ISession, Response, Tokens } from './types';

const DEFAULT_API_URL = 'https://api.curvenote.com';
const DEFAULT_SITE_URL = 'https://curvenote.com';
const CONFIG_FILES = ['curvenote.yml', 'myst.yml'];

export type SessionOptions = {
  apiUrl?: string;
  siteUrl?: string;
  logger?: Logger;
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
  configFiles: string[];
  $tokens: Tokens = {};
  store: Store<RootState>;
  $logger: Logger;

  get log(): Logger {
    return this.$logger;
  }

  get isAnon() {
    return !(this.$tokens.user || this.$tokens.session);
  }

  constructor(token?: string, opts: SessionOptions = {}) {
    this.configFiles = CONFIG_FILES;
    this.$logger = opts.logger ?? basicLogger(LogLevel.info);
    const url = this.setToken(token);
    this.API_URL = opts.apiUrl ?? url ?? DEFAULT_API_URL;
    this.SITE_URL = opts.siteUrl ?? DEFAULT_SITE_URL;
    if (this.API_URL !== DEFAULT_API_URL) {
      this.log.warn(`Connecting to API at: "${this.API_URL}".`);
    }
    this.store = createStore(rootReducer);
    findCurrentProjectAndLoad(this, '.');
    findCurrentSiteAndLoad(this, '.');
  }

  setToken(token?: string) {
    const { tokens, url } = setSessionOrUserToken(this.log, token);
    this.$tokens = tokens;
    return url;
  }

  async get<T extends Record<string, any>>(
    url: string,
    query?: Record<string, string>,
  ): Response<T> {
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
    const json = await response.json();
    checkForClientVersionRejection(this.log, response.status, json);
    return {
      ok: response.ok,
      status: response.status,
      json,
    };
  }

  async patch<T extends Record<string, any>>(url: string, data: Record<string, any>) {
    return this.post<T>(url, data, 'patch');
  }

  async post<T extends Record<string, any>>(
    url: string,
    data: Record<string, any>,
    method: 'post' | 'patch' = 'post',
  ): Response<T> {
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
    const json = await response.json();
    if (!response.ok) {
      const dataString = JSON.stringify(json, null, 2);
      this.log.debug(`${method.toUpperCase()} FAILED ${url}: ${response.status}\n\n${dataString}`);
    }
    checkForClientVersionRejection(this.log, response.status, json);
    return {
      ok: response.ok,
      status: response.status,
      json,
    };
  }

  buildPath(): string {
    const state = this.store.getState();
    const sitePath = selectors.selectCurrentSitePath(state);
    const projectPath = selectors.selectCurrentProjectPath(state);
    const root = sitePath ?? projectPath ?? '.';
    return path.resolve(path.join(root, '_build'));
  }

  repoPath(): string {
    return path.join(this.buildPath(), 'theme');
  }

  webPackageJsonPath(): string {
    return path.join(this.repoPath(), 'package.json');
  }

  sitePath(): string {
    return path.join(this.buildPath(), 'site');
  }

  contentPath(): string {
    return path.join(this.sitePath(), 'content');
  }

  publicPath(): string {
    return path.join(this.sitePath(), 'public');
  }

  staticPath(): string {
    return path.join(this.publicPath(), '_static');
  }
}
