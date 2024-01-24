import path from 'node:path';
import type { Store } from 'redux';
import { createStore } from 'redux';
import type { Logger } from 'myst-cli-utils';
import { chalkLogger, LogLevel } from 'myst-cli-utils';
import type { MystPlugin, RuleId } from 'myst-common';
import latestVersion from 'latest-version';
import boxen from 'boxen';
import chalk from 'chalk';
import {
  findCurrentProjectAndLoad,
  findCurrentSiteAndLoad,
  reloadAllConfigsForCurrentSite,
} from '../config.js';
import { loadPlugins } from '../plugins.js';
import type { BuildWarning } from '../store/index.js';
import { selectors } from '../store/index.js';
import type { RootState } from '../store/reducers.js';
import { rootReducer } from '../store/reducers.js';
import version from '../version.js';
import type { ISession } from './types.js';
import { KernelManager, ServerConnection, SessionManager } from '@jupyterlab/services';
import type { JupyterServerSettings } from 'myst-execute';
import { findExistingJupyterServer, launchJupyterServer } from 'myst-execute';
import { default as nodeFetch, Headers, Request, Response } from 'node-fetch';

// fetch polyfill for node<18
if (!globalThis.fetch) {
  globalThis.fetch = nodeFetch as any;
  globalThis.Headers = Headers as any;
  globalThis.Request = Request as any;
  globalThis.Response = Response as any;
}

const CONFIG_FILES = ['myst.yml'];
const API_URL = 'https://api.mystmd.org';
const NPM_COMMAND = 'npm i -g mystmd@latest';
const PIP_COMMAND = 'pip install -U mystmd';

export function logUpdateAvailable({
  current,
  latest,
  upgradeCommand,
  twitter,
}: {
  current: string;
  latest: string;
  upgradeCommand: string;
  twitter: string;
}) {
  return boxen(
    `Update available! ${chalk.dim(`v${current}`)} ≫ ${chalk.green.bold(
      `v${latest}`,
    )}\n\nRun \`${chalk.cyanBright.bold(
      upgradeCommand,
    )}\` to update.\n\nFollow ${chalk.yellowBright(
      `@${twitter}`,
    )} for updates!\nhttps://twitter.com/${twitter}`,
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
  _jupyterSessionManager: SessionManager | undefined | null = null;

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
        upgradeCommand: process.env.MYST_LANG === 'PYTHON' ? PIP_COMMAND : NPM_COMMAND,
        twitter: 'MystMarkdown',
      }),
    );
    this._shownUpgrade = true;
  }

  reload() {
    findCurrentProjectAndLoad(this, '.');
    findCurrentSiteAndLoad(this, '.');
    if (selectors.selectCurrentSitePath(this.store.getState())) {
      reloadAllConfigsForCurrentSite(this);
    }
    return this;
  }

  plugins: MystPlugin | undefined;

  _pluginPromise: Promise<MystPlugin> | undefined;

  async loadPlugins() {
    // Early return if a promise has already been initiated
    if (this._pluginPromise) return this._pluginPromise;
    this._pluginPromise = loadPlugins(this);
    this.plugins = await this._pluginPromise;
    return this.plugins;
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

  _clones: ISession[] = [];

  clone(): Session {
    const cloneSession = new Session({ logger: this.log });
    this._clones.push(cloneSession);
    return cloneSession;
  }

  getAllWarnings(ruleId: RuleId) {
    const stringWarnings: string[] = [];
    const warnings: (BuildWarning & { file: string })[] = [];
    [this, ...this._clones].forEach((session: ISession) => {
      const sessionWarnings = selectors.selectFileWarningsByRule(session.store.getState(), ruleId);
      sessionWarnings.forEach((warning) => {
        const stringWarning = JSON.stringify(Object.entries(warning).sort());
        if (!stringWarnings.includes(stringWarning)) {
          stringWarnings.push(stringWarning);
          warnings.push(warning);
        }
      });
    });
    return warnings;
  }

  async jupyterSessionManager(): Promise<SessionManager | undefined> {
    if (this._jupyterSessionManager !== null) {
      return Promise.resolve(this._jupyterSessionManager);
    }
    try {
      const partialServerSettings = await new Promise<JupyterServerSettings>((resolve, reject) => {
        if (process.env.JUPYTER_BASE_URL === undefined) {
          const settings = findExistingJupyterServer();
          if (settings) {
            console.log('LOADED EXISTING');
            return resolve(settings);
          } else {
            console.log('LAUNCH NEW');
            return launchJupyterServer(this.contentPath(), this.log).then((launchedSettings) => {
              console.log('LOADED', launchedSettings);
              resolve(launchedSettings);
            });
          }
        } else {
          resolve({
            baseUrl: process.env.JUPYTER_BASE_URL,
            token: process.env.JUPYTER_TOKEN,
          });
        }
      });
      const serverSettings = ServerConnection.makeSettings(partialServerSettings);
      const kernelManager = new KernelManager({ serverSettings });
      const manager = new SessionManager({ kernelManager, serverSettings });
      // TODO: this is a race condition, even though we shouldn't hit if if this promise is actually awaited
      this._jupyterSessionManager = manager;
      return manager;
    } catch (err) {
      this.log.error('Unable to instantiate connection to Jupyter Server', err);
      this._jupyterSessionManager = undefined;
      return undefined;
    }
  }
}
