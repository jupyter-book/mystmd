import type { Store } from 'redux';
import { createStore } from 'redux';
import { basicLogger, LogLevel } from 'myst-cli-utils';
import type { Logger } from 'myst-cli-utils';
import { rootReducer } from '../store';
import type { RootState } from '../store';
import type { ISession } from './types';
import { findCurrentProjectAndLoad, findCurrentSiteAndLoad } from '../config';

const CONFIG_FILES = ['myst.yml'];
const BUILD_FOLDER = '_build';
const API_URL = 'https://api.myst.tools';

export class Session implements ISession {
  API_URL: string;
  buildFolder: string;
  configFiles: string[];
  store: Store<RootState>;
  $logger: Logger;

  get log(): Logger {
    return this.$logger;
  }

  constructor(opts: { logger?: Logger } = {}) {
    this.API_URL = API_URL;
    this.buildFolder = BUILD_FOLDER;
    this.configFiles = CONFIG_FILES;
    this.$logger = opts.logger ?? basicLogger(LogLevel.info);
    this.store = createStore(rootReducer);
    findCurrentProjectAndLoad(this, '.');
    findCurrentSiteAndLoad(this, '.');
  }
}
