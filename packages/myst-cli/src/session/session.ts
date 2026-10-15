import path from 'node:path';
import fs from 'node:fs/promises';
import type { Store } from 'redux';
import { createStore } from 'redux';
import type { Logger } from 'myst-cli-utils';
import { chalkLogger, LogLevel } from 'myst-cli-utils';
import type { RuleId, ValidatedMystPlugin, IApp } from 'myst-common';
import latestVersion from 'latest-version';
import boxen from 'boxen';
import chalk from 'chalk';
import { HttpsProxyAgent } from 'https-proxy-agent';
import pLimit from 'p-limit';
import type { Limit } from 'p-limit';
import { Semaphore } from 'async-mutex';
import { cpus } from 'node:os';
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
import type { PluginInfo } from 'myst-config';

import { PluginRegistry, type Token } from '@lumino/coreutils';
import { createInstance, type ModuleFederation } from '@module-federation/enhanced/runtime';
import handler from 'serve-handler';
import http from 'node:http';
import getPort from 'get-port';

type Remote = ModuleFederation['options']['remotes'][number];

////////////////////// Exposed Lumino Plugins ////
import { IMystToTypst } from 'myst-to-typst';
import mystToTypstExtension from 'myst-to-typst-extension';
//////////////////////////////////////////////////

// fetch polyfill for node<18
if (!globalThis.fetch) {
  globalThis.fetch = nodeFetch as any;
  globalThis.Headers = Headers as any;
  globalThis.Request = Request as any;
  globalThis.Response = Response as any;
}

const CONFIG_FILES = ['myst.yml', 'myst.yaml'];
const DEFAULT_API_URL = 'https://api.mystmd.org';
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

export class Session implements ISession, IApp {
  name = 'mystmd';

  API_URL: string;
  configFiles: string[];
  store: Store<RootState>;
  $logger: Logger;
  doiLimiter: Limit;
  executionSemaphore: Semaphore;

  proxyAgent?: HttpsProxyAgent<string>;
  _shownUpgrade = false;
  _latestVersion?: string;
  _jupyterSessionManagerPromise?: Promise<SessionManager | undefined>;

  get log(): Logger {
    return this.$logger;
  }

  private readonly $federation: ModuleFederation;

  get federation(): ModuleFederation {
    return this.$federation;
  }

  private readonly $registry: PluginRegistry<IApp>;
  private $registryActivated = false;

  get registry(): PluginRegistry<IApp> {
    return this.$registry;
  }

  getService<T>(token: Token<T>): Promise<T> {
    return this.$registry.resolveRequiredService(token);
  }

  constructor(
    opts: {
      logger?: Logger;
      doiLimiter?: Limit;
      executionSemaphore?: Semaphore;
      configFiles?: string[];
    } = {},
  ) {
    // use env variable if set
    this.API_URL = process.env.API_URL ?? DEFAULT_API_URL;
    // trailing slashes will cause issues
    this.API_URL = this.API_URL.replace(/\/+$/, '');
    console.debug(`building myst-cli session with API URL: ${this.API_URL}`);
    this.configFiles = (opts.configFiles ? opts.configFiles : CONFIG_FILES).slice();
    this.$logger = opts.logger ?? chalkLogger(LogLevel.info, process.cwd());
    this.doiLimiter = opts.doiLimiter ?? pLimit(3);
    this.executionSemaphore =
      opts.executionSemaphore ?? new Semaphore(Math.max(1, cpus().length - 1));
    const proxyUrl = process.env.HTTPS_PROXY;
    if (proxyUrl) this.proxyAgent = new HttpsProxyAgent(proxyUrl);
    this.store = createStore(rootReducer);
    // Allow the latest version to be loaded
    latestVersion('mystmd')
      .then((latest) => {
        this._latestVersion = latest;
      })
      .catch(() => null);

    // Define Module Federation instance.
    // Mentally replace "Module Federation instance" with "dynamic code loader" for simple understanding.
    // This adds the ability to load complex modules from outside pre-compiled mystmd binary
    this.$federation = createInstance({
      name: 'myst-cli',
      remotes: [],
      // Define the shared libraries that *we* provide to other modules
      // We need to provide myst-to-typst so that extensions can get the same
      // object when they import the IMystToTypst token
      // This can mostly be automated to pull from package.json
      shared: {
        'myst-to-typst': {
          version: '0.0.39',
          get: () => import('myst-to-typst').then((m) => () => m),
          shareConfig: {
            singleton: true,
            requiredVersion: '^0.0.39',
          },
        },
      },
    });
    // Define dependency injection registry
    this.$registry = new PluginRegistry();
    this.$registry.application = this;
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
    // Load dependency-injection plugins
    await this.loadExternalExtensions();
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

  async loadFederatedRemotes() {
    const remotesPath = process.env.MYSTMD_EXTENSIONS_PATH;
    if (remotesPath === undefined) {
      return [];
    }

    let dir;
    try {
      dir = await fs.opendir(remotesPath);
    } catch (err) {
      console.error(err);
      return [];
    }

    const port = await getPort();
    const host = 'localhost';

    return await new Promise<Array<any>>((resolve) => {
      const server = http.createServer((request, response) => {
        // You pass two more arguments for config and middleware
        // More details here: https://github.com/vercel/serve-handler#options
        return handler(request, response, { public: remotesPath });
      });

      server.listen(port, host, async () => {
        // Find all remoteEntry modules under the modules path
        const remotes = [];
        for await (const dirent of dir) {
          const remotePath = path.join(remotesPath, dirent.name, 'remoteEntry.js');
          try {
            await fs.access(remotePath);
          } catch (err) {
            continue;
          }
          remotes.push({
            name: dirent.name,
            entry: `http://${host}:${port}/${dirent.name}/remoteEntry.js`,
          });
        }

        // Register remotes with MF global instance
        console.log('Registering remotes', remotes);
        this.$federation.registerRemotes(remotes);

        // load the remotes (i.e. import the JS modules)!
        const modules = await Promise.all(
          remotes.map((remote) =>
            this.$federation.loadRemote(remote.name).then((r: any) => r.default),
          ),
        );
        resolve(modules);
      });
    });
  }
  async loadExternalExtensions() {
    if (this.$registryActivated) {
      return;
    }
    // First, load *default* provider of myst-to-typst
    this.$registry.registerPlugin(mystToTypstExtension);
    console.log('Registered', mystToTypstExtension);

    const loadedRemotes = await this.loadFederatedRemotes();

    // Register the loaded Lumino "Plugin" objects with the DI registry
    for (const remote of loadedRemotes) {
      this.$registry.registerPlugin(remote);
      console.log('Registered', remote);
    }
    // Now, finally, wire-up the dependencies and trigger their `activate` method
    await this.$registry.activatePlugins('startUp');
    this.$registryActivated = true;
  }

  async loadPlugins(plugins: PluginInfo[]) {
    // Activate regular-old plugins
    this.plugins = await loadPlugins(this, plugins);

    return this.plugins;
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
    const cloneSession = new Session({
      logger: this.log,
      doiLimiter: this.doiLimiter,
      executionSemaphore: this.executionSemaphore,
      configFiles: this.configFiles,
    });
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
