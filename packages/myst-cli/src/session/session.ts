import path from 'path';
import type { Store } from 'redux';
import { createStore } from 'redux';
import { basicLogger, LogLevel } from 'myst-cli-utils';
import type { Logger } from 'myst-cli-utils';
import { rootReducer, selectors } from '../store';
import type { RootState } from '../store';
import type { ISession } from './types';
import { findCurrentProjectAndLoad, findCurrentSiteAndLoad } from '../config';

const CONFIG_FILES = ['myst.yml'];
const API_URL = 'https://api.myst.tools';

export class Session implements ISession {
  API_URL: string;
  configFiles: string[];
  store: Store<RootState>;
  $logger: Logger;

  get log(): Logger {
    return this.$logger;
  }

  constructor(opts: { logger?: Logger } = {}) {
    this.API_URL = API_URL;
    this.configFiles = CONFIG_FILES;
    this.$logger = opts.logger ?? basicLogger(LogLevel.info);
    this.store = createStore(rootReducer);
    findCurrentProjectAndLoad(this, '.');
    findCurrentSiteAndLoad(this, '.');
  }

  buildPath(): string {
    const state = this.store.getState();
    const sitePath = selectors.selectCurrentSitePath(state);
    const projectPath = selectors.selectCurrentProjectPath(state);
    const root = sitePath ?? projectPath ?? '.';
    return path.resolve(path.join(root, '_build'));
  }

  publicPath(): string {
    return path.join(this.buildPath(), 'public');
  }

  staticPath(): string {
    return path.join(this.publicPath(), '_static');
  }

  clone(): Session {
    return new Session({ logger: this.log });
  }
}
