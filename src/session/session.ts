import fetch from 'node-fetch';
import { createStore, Store } from 'redux';
import { JsonObject } from '@curvenote/blocks';
import { basicLogger, Logger, LogLevel } from '../logging';
import { rootReducer, RootState } from '../store';
import { getHeaders, setSessionOrUserToken } from './tokens';
import { ISession, Response, Tokens } from './types';
import { checkForClientVersionRejection } from '../utils';
import { loadSiteConfig, loadProjectConfig, CURVENOTE_YML } from '../newconfig';
import { selectLocalSiteConfig } from '../store/selectors';

const DEFAULT_API_URL = 'https://api.curvenote.com';
const DEFAULT_SITE_URL = 'https://curvenote.com';

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

function loadAllConfigs(log: Logger, store: Store<RootState>) {
  try {
    loadSiteConfig(store);
    log.debug(`Loaded site config from "./${CURVENOTE_YML}"`);
  } catch (error) {
    // TODO: what error?
    log.debug(`Failed to find or load site config from "./${CURVENOTE_YML}"`);
  }
  try {
    loadProjectConfig(store, '.');
    log.debug(`Loaded project config from "./${CURVENOTE_YML}"`);
  } catch (error) {
    // TODO: what error?
    log.debug(`Failed to find or load project config from "./${CURVENOTE_YML}"`);
  }
  const siteConfig = selectLocalSiteConfig(store.getState());
  if (!siteConfig) return;
  siteConfig.projects.forEach((project) => {
    try {
      loadProjectConfig(store, project.path);
    } catch (error) {
      // TODO: what error?
      log.debug(`Failed to find or load project config from "${project.path}/${CURVENOTE_YML}"`);
    }
  });
}

export class Session implements ISession {
  API_URL: string;

  SITE_URL: string;

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
    this.$logger = opts.logger ?? basicLogger(LogLevel.info);
    const url = this.setToken(token);
    this.API_URL = opts.apiUrl ?? url ?? DEFAULT_API_URL;
    this.SITE_URL = opts.siteUrl ?? DEFAULT_SITE_URL;
    if (this.API_URL !== DEFAULT_API_URL) {
      this.log.warn(`Connecting to API at: "${this.API_URL}".`);
    }
    this.store = createStore(rootReducer);
    loadAllConfigs(this.$logger, this.store);
  }

  setToken(token?: string) {
    const { tokens, url } = setSessionOrUserToken(this.log, token);
    this.$tokens = tokens;
    return url;
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
    const json = await response.json();
    checkForClientVersionRejection(this.log, response.status, json);
    return {
      ok: response.ok,
      status: response.status,
      json,
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
}
