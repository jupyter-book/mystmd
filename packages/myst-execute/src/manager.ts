import { KernelManager, ServerConnection, SessionManager } from '@jupyterlab/services';
import which from 'which';
import getPort from 'get-port';
import { spawn } from 'node:child_process';
import * as readline from 'node:readline';
import type { ISession as ICLISession, Logger } from 'myst-cli-utils';
import { killProcessTree } from 'myst-cli-utils';
import chalk from 'chalk';
import type { IPlugin } from '@lumino/coreutils';
import { ISessionManagerFactory } from './types.js';

interface ISession extends ICLISession {
  sourcePath: () => string;
}

export type JupyterServerSettings = Partial<ServerConnection.ISettings> & {
  dispose?: () => void;
};

interface JupyterServerListItem {
  base_url: string;
  hostname: string;
  password: boolean;
  pid: number;
  port: number;
  root_dir: string;
  secure: boolean;
  sock: string;
  token: string;
  url: string;
  version: string;
}

/**
 * Find the newest (by PID) active Jupyter Server, or return undefined.
 */
export async function findExistingJupyterServer(
  session: ISession,
): Promise<JupyterServerSettings | undefined> {
  const pythonPath = which.sync('python');
  const listProc = spawn(pythonPath, ['-m', 'jupyter_server', 'list', '--json']);

  const reader = readline.createInterface({ input: listProc.stdout });

  const servers: JupyterServerListItem[] = [];
  for await (const line of reader) {
    let server: JupyterServerListItem | undefined;
    try {
      server = JSON.parse(line);
    } catch {
      /* empty */
    }
    if (server?.base_url !== undefined) {
      servers.push(server);
    }
  }
  if (!servers.length) {
    return undefined;
  }
  servers.sort((a, b) => a.pid - b.pid);

  // Return the first alive server
  for (const entry of servers) {
    const response = await session.fetch(`${entry.url}?token=${entry.token}`);
    if (response.ok) {
      return {
        baseUrl: entry.url,
        token: entry.token,
      };
    }
  }
  return undefined;
}

/**
 * Launch a new Jupyter Server whose root directory coincides with the content path
 *
 * @param contentPath path to server contents
 * @param log logger
 */
export async function launchJupyterServer(
  contentPath: string,
  log: Logger,
): Promise<JupyterServerSettings> {
  log.info(`🚀 ${chalk.yellowBright('Starting new Jupyter server')}`);
  const pythonPath = which.sync('python');
  // Pick an unused port so parallel execution requests don't race on the default port.
  const port = await getPort();
  const proc = spawn(pythonPath, [
    '-m',
    'jupyter_server',
    '--ServerApp.root_dir',
    contentPath,
    `--ServerApp.port=${port}`,
    // Without this, jupyter silently rebinds to a different port if ours is taken.
    // We later parse the port from stderr but it returns the *first* instance,
    // so if the port has changed after a retry, we'll miss it. So fail eagerly instead.
    '--ServerApp.port_retries=0',
  ]);

  const reader = proc.stderr;

  let timerID: ReturnType<typeof setTimeout> | undefined;
  const settings = await new Promise<JupyterServerSettings>((resolve, reject) => {
    // Fail after 20 seconds of nothing happening
    timerID = setTimeout(() => {
      log.error(`🪐 ${chalk.redBright('Jupyter server did not respond')}`);
      reject();
    }, 20_000);

    // Fail because process exits
    proc.on('exit', () => {
      log.error(`🪐 ${chalk.redBright('Jupyter server did not start')}`);
      reject();
    });

    reader.on('data', (buf) => {
      const data = buf.toString();
      // Wait for server to declare itself up
      const match = data.match(/([^\s]*?)\?token=([^\s]*)/);
      if (match === null) {
        return;
      }

      // Pull out the match information
      const [, addr, token] = match;

      // Resolve the promise
      resolve({
        baseUrl: addr,
        token: token,
      });
    });
  }).finally(
    // Don't keep listening to messages
    () => {
      reader.removeAllListeners('data');
      proc.removeAllListeners('exit');

      // Cancel timeout error now
      if (timerID !== undefined) {
        clearTimeout(timerID);
      }
    },
  );

  // Inform log
  const url = `${settings.baseUrl}?token=${settings.token}`;
  log.info(`🪐 ${chalk.greenBright('Jupyter server started')}\n   ${chalk.dim(url)}`);

  // Register settings destructor (to kill server)
  return { ...settings, dispose: () => killProcessTree(proc) };
}
export class BaseSessionManagerFactory implements ISessionManagerFactory {
  protected readonly session: ISession;
  protected promise: Promise<SessionManager | undefined> | undefined;

  constructor(session: ISession) {
    this.session = session;
  }

  getSessionManager(): Promise<SessionManager | undefined> {
    if (this.promise === undefined) {
      this.promise = this.createOneSessionManager();
    }
    return this.promise;
  }

  protected async createOneSessionManager(): Promise<SessionManager | undefined> {
    return Promise.resolve(undefined);
  }
}

/**
 * Factory implementation for SessionManager that connects to an existing Jupyter Server
 */
export class ExistingSessionManagerFactory extends BaseSessionManagerFactory {
  protected async createOneSessionManager(): Promise<SessionManager | undefined> {
    try {
      const partialServerSettings = {
        baseUrl: process.env.JUPYTER_BASE_URL,
        token: process.env.JUPYTER_TOKEN,
      };
      const serverSettings = ServerConnection.makeSettings(partialServerSettings);
      const kernelManager = new KernelManager({ serverSettings });
      const manager = new SessionManager({ kernelManager, serverSettings });

      // Tie the lifetime of the kernelManager and (potential) spawned server to the manager
      manager.disposed.connect(() => {
        kernelManager.dispose();
      });
      return manager;
    } catch (err) {
      this.session.log.error('Unable to instantiate connection to Jupyter Server', err);
      return undefined;
    }
  }
}

/**
 * Factory implementation for SessionManager that creates a new Jupyter Server
 */
export class NewSessionManagerFactory extends BaseSessionManagerFactory {
  protected async createOneSessionManager(): Promise<SessionManager | undefined> {
    try {
      // Note: To use an existing Jupyter server use `findExistingJupyterServer`, see #1716
      this.session.log.debug(`Launching jupyter server on ${this.session.sourcePath()}`);
      // Create and load new server
      const partialServerSettings = await launchJupyterServer(
        this.session.sourcePath(),
        this.session.log,
      );

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
      this.session.log.error('Unable to instantiate connection to Jupyter Server', err);
      return undefined;
    }
  }
}

/**
 * A plugin that provides the existing session manager factory.
 */
export const existingSessionManagerFactoryPlugin: IPlugin<ISession, ISessionManagerFactory> = {
  id: 'myst-execute:existing-session-manager-factory',
  autoStart: true,
  provides: ISessionManagerFactory,
  activate: (session: ISession): ExistingSessionManagerFactory => {
    console.log('Activated existing session manager provider');
    return new ExistingSessionManagerFactory(session);
  },
};
/**
 * A plugin that provides the new session manager factory.
 */
export const newSessionManagerFactoryPlugin: IPlugin<ISession, ISessionManagerFactory> = {
  id: 'myst-execute:new-session-manager-factory',
  autoStart: true,
  provides: ISessionManagerFactory,
  activate: (session: ISession): NewSessionManagerFactory => {
    console.log('Activated new session manager provider');
    return new NewSessionManagerFactory(session);
  },
};
