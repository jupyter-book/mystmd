import path from 'node:path';
import type { Store } from 'redux';
import { createStore } from 'redux';
import { chalkLogger, LogLevel } from 'myst-cli-utils';
import type { Logger } from 'myst-cli-utils';
import { config, rootReducer, selectors } from '../store/index.js';
import type { RootState } from '../store/index.js';
import type { ISession } from './types.js';
import {
  findCurrentProjectAndLoad,
  findCurrentSiteAndLoad,
  reloadAllConfigsForCurrentSite,
} from '../config.js';

const CONFIG_FILES = ['myst.yml'];
const API_URL = 'https://api.myst-tools.org';

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
    this.$logger = opts.logger ?? chalkLogger(LogLevel.info, process.cwd());
    this.store = createStore(rootReducer);
    this.reload();
  }

  reload() {
    this.store.dispatch(config.actions.reload());
    findCurrentProjectAndLoad(this, '.');
    findCurrentSiteAndLoad(this, '.');
    if (selectors.selectCurrentSitePath(this.store.getState())) {
      reloadAllConfigsForCurrentSite(this);
    }
    return this;
  }

  buildPath(): string {
    const state = this.store.getState();
    const sitePath = selectors.selectCurrentSitePath(state);
    const projectPath = selectors.selectCurrentProjectPath(state);
    const root = sitePath ?? projectPath ?? '.';
    return path.resolve(path.join(root, '_build'));
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

  clone(): Session {
    return new Session({ logger: this.log });
  }
}
