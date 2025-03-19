import path from 'node:path';
import type { Store } from 'redux';
import { createStore } from 'redux';
import type { Logger } from 'myst-cli-utils';
import { chalkLogger, LogLevel } from 'myst-cli-utils';
import type { RuleId, ValidatedMystPlugin } from 'myst-common';
import latestVersion from 'latest-version';
import boxen from 'boxen';
import chalk from 'chalk';
import { HttpsProxyAgent } from 'https-proxy-agent';
import pLimit from 'p-limit';
import type { Limit } from 'p-limit';
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
import { isWhiteLabelled } from '../utils/whiteLabelling.js';
import { KernelManager, ServerConnection, SessionManager } from '@jupyterlab/services';
import type { JupyterServerSettings } from 'myst-execute';
import { launchJupyterServer } from 'myst-execute';
import type { RequestInfo, RequestInit } from 'node-fetch';
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
const LOCALHOSTS = ['localhost', '127.0.0.1', '::1'];

function socialLink({ twitter, bsky }: { twitter?: string; bsky?: string }): string {
  if (bsky) {
    return `Follow ${chalk.yellowBright(`@${bsky}`)} for updates!\nhttps://bsky.app/profile/${bsky}`;
  }
  if (twitter) {
    return `Follow ${chalk.yellowBright(`@${twitter}`)} for updates!\nhttps://x.com/${twitter}`;
  }
  return '';
}

export function logUpdateAvailable({
  current,
  latest,
  upgradeCommand,
  twitter,
  bsky,
}: {
  current: string;
  latest: string;
  upgradeCommand: string;
  twitter?: string;
  bsky?: string;
}) {
  return boxen(
    `Update available! ${chalk.dim(`v${current}`)} ≫ ${chalk.green.bold(
      `v${latest}`,
    )}\n\nRun \`${chalk.cyanBright.bold(upgradeCommand)}\` to update.\n\n${socialLink({ bsky, twitter })}`,
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
  doiLimiter: Limit;

  proxyAgent?: HttpsProxyAgent<string>;
  _shownUpgrade = false;
  _latestVersion?: string;
  _jupyterSessionManagerPromise?: Promise<SessionManager | undefined>;

  get log(): Logger {
    return this.$logger;
  }

  constructor(opts: { logger?: Logger; doiLimiter?: Limit } = {}) {
    this.API_URL = API_URL;
    this.configFiles = CONFIG_FILES;
    this.$logger = opts.logger ?? chalkLogger(LogLevel.info, process.cwd());
    this.doiLimiter = opts.doiLimiter ?? pLimit(3);
    const proxyUrl = process.env.HTTPS_PROXY;
    if (proxyUrl) this.proxyAgent = new HttpsProxyAgent(proxyUrl);
    this.store = createStore(rootReducer);
    // Allow the latest version to be loaded
    latestVersion('mystmd')
      .then((latest) => {
        this._latestVersion = latest;
      })
      .catch(() => null);
  }

  showUpgradeNotice() {
    if (
      this._shownUpgrade ||
      !this._latestVersion ||
      version === this._latestVersion ||
      isWhiteLabelled()
    )
      return;
    this.log.info(
      logUpdateAvailable({
        current: version,
        latest: this._latestVersion,
        upgradeCommand: process.env.MYST_LANG === 'PYTHON' ? PIP_COMMAND : NPM_COMMAND,
        bsky: 'mystmd.org',
      }),
    );
    this._shownUpgrade = true;
  }

  async reload() {
    await findCurrentProjectAndLoad(this, '.');
    await findCurrentSiteAndLoad(this, '.');
    if (selectors.selectCurrentSitePath(this.store.getState())) {
      await reloadAllConfigsForCurrentSite(this);
    }
    return this;
  }

  async fetch(url: URL | RequestInfo, init?: RequestInit): Promise<Response> {
    const urlOnly = new URL((url as Request).url ?? (url as URL | string));
    this.log.debug(`Fetching: ${urlOnly}`);
    if (this.proxyAgent && !LOCALHOSTS.includes(urlOnly.hostname)) {
      if (!init) init = {};
      init = { agent: this.proxyAgent, ...init };
      this.log.debug(`Using HTTPS proxy: ${this.proxyAgent.proxy}`);
    }
    const logData = { url: urlOnly, done: false };
    setTimeout(() => {
      if (!logData.done) this.log.info(`⏳ Waiting for response from ${url}`);
    }, 5000);
    const resp = await nodeFetch(url, init);
    logData.done = true;
    return resp;
  }

  plugins: ValidatedMystPlugin | undefined;

  _pluginPromise: Promise<ValidatedMystPlugin> | undefined;

  async loadPlugins() {
    // Early return if a promise has already been initiated
    if (this._pluginPromise) return this._pluginPromise;

    const state = this.store.getState();
    const projConfig = selectors.selectCurrentProjectConfig(state);

    if (projConfig) {
      this._pluginPromise = loadPlugins(this);
      this.plugins = await this._pluginPromise;
      return this.plugins;
    }
  }

  sourcePath(): string {
    const state = this.store.getState();
    const sitePath = selectors.selectCurrentSitePath(state);
    const projectPath = selectors.selectCurrentProjectPath(state);
    const root = sitePath ?? projectPath ?? '.';
    return path.resolve(root);
  }

  buildPath(): string {
    return path.join(this.sourcePath(), '_build');
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

  async clone() {
    const cloneSession = new Session({ logger: this.log, doiLimiter: this.doiLimiter });
    await cloneSession.reload();
    // TODO: clean this up through better state handling
    cloneSession._jupyterSessionManagerPromise = this._jupyterSessionManagerPromise;
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

  jupyterSessionManager(): Promise<SessionManager | undefined> {
    if (this._jupyterSessionManagerPromise === undefined) {
      this._jupyterSessionManagerPromise = this.createJupyterSessionManager();
    }
    return this._jupyterSessionManagerPromise;
  }

  private async createJupyterSessionManager(): Promise<SessionManager | undefined> {
    try {
      let partialServerSettings: JupyterServerSettings | undefined;
      // Load from environment
      if (process.env.JUPYTER_BASE_URL !== undefined) {
        partialServerSettings = {
          baseUrl: process.env.JUPYTER_BASE_URL,
          token: process.env.JUPYTER_TOKEN,
        };
      } else {
        // Note: To use an existing Jupyter server use `findExistingJupyterServer`, see #1716
        this.log.debug(`Launching jupyter server on ${this.sourcePath()}`);
        // Create and load new server
        partialServerSettings = await launchJupyterServer(this.sourcePath(), this.log);
      }

      const serverSettings = ServerConnection.makeSettings(partialServerSettings);
      const kernelManager = new KernelManager({ serverSettings });
      const manager = new SessionManager({ kernelManager, serverSettings });

      // Tie the lifetime of the kernelManager and (potential) spawned server to the manager
      manager.disposed.connect(() => {
        kernelManager.dispose();
        partialServerSettings?.dispose?.();
      });
      return manager;
    } catch (err) {
      this.log.error('Unable to instantiate connection to Jupyter Server', err);
      return undefined;
    }
  }

  dispose() {
    this._clones.forEach((session) => {
      session.dispose();
    });

    if (this._jupyterSessionManagerPromise) {
      this._jupyterSessionManagerPromise.then((manager) => manager?.dispose?.());
      this._jupyterSessionManagerPromise = undefined;
    }
  }
}
