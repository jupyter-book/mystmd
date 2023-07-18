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
import latestVersion from 'latest-version';
import boxen from 'boxen';
import chalk from 'chalk';
import version from '../version.js';

const CONFIG_FILES = ['myst.yml'];
const API_URL = 'https://api.mystmd.org';

export function logUpdateAvailable({
  current,
  latest,
  upgradeCommand,
  pypiUpgradeCommand,
  twitter,
}: {
  current: string;
  latest: string;
  upgradeCommand: string;
  pypiUpgradeCommand?: string;
  twitter: string;
}) {
  return boxen(
    `Update available! ${chalk.dim(`v${current}`)} ≫ ${chalk.green.bold(
      `v${latest}`,
    )}\n\nRun \`${chalk.cyanBright.bold(upgradeCommand)}\` to update.\n\n${
      pypiUpgradeCommand
        ? `(Or if using PyPI, \`${chalk.cyanBright.bold(pypiUpgradeCommand)}\`) \n\n`
        : ``
    }Follow ${chalk.yellowBright(`@${twitter}`)} for updates!\nhttps://twitter.com/${twitter}`,
    {
      padding: 1,
      margin: 1,
      borderColor: 'green',
      borderStyle: 'round',
      textAlignment: 'center',
    },
  );
}

export class Session implements ISession {
  API_URL: string;
  configFiles: string[];
  store: Store<RootState>;
  $logger: Logger;

  _shownUpgrade = false;
  _latestVersion?: string;

  get log(): Logger {
    return this.$logger;
  }

  constructor(opts: { logger?: Logger } = {}) {
    this.API_URL = API_URL;
    this.configFiles = CONFIG_FILES;
    this.$logger = opts.logger ?? chalkLogger(LogLevel.info, process.cwd());
    this.store = createStore(rootReducer);
    this.reload();
    // Allow the latest version to be loaded
    latestVersion('mystmd')
      .then((latest) => {
        this._latestVersion = latest;
      })
      .catch(() => null);
  }

  showUpgradeNotice() {
    if (this._shownUpgrade || !this._latestVersion || version === this._latestVersion) return;
    this.log.info(
      logUpdateAvailable({
        current: version,
        latest: this._latestVersion,
        upgradeCommand: 'npm i -g mystmd@latest',
        pypiUpgradeCommand: 'pip install -U mystmd',
        twitter: 'MystMarkdown',
      }),
    );
    this._shownUpgrade = true;
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
