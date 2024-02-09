import type { ServerConnection } from '@jupyterlab/services';
import which from 'which';
import { spawn } from 'node:child_process';
import * as readline from 'node:readline';
import type { Logger } from 'myst-cli-utils';
import chalk from 'chalk';

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
export async function findExistingJupyterServer(): Promise<JupyterServerSettings | undefined> {
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
  const server = servers.pop()!;
  // TODO: We should ping the server to ensure that it actually is up!
  return {
    baseUrl: server.url,
    token: server.token,
  };
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
  const proc = spawn(pythonPath, ['-m', 'jupyter_server', '--ServerApp.root_dir', contentPath]);

  const reader = proc.stderr;
  const settings = await new Promise<JupyterServerSettings>((resolve, reject) => {
    // Fail after 20 seconds of nothing happening
    const id = setTimeout(() => {
      log.error(`🪐 ${chalk.redBright('Jupyter server did not respond')}\n   ${chalk.dim(url)}`);
      reject();
    }, 20_000);

    reader.on('data', (buf) => {
      const data = buf.toString();
      // Wait for server to declare itself up
      const match = data.match(/([^\s]*?)\?token=([^\s]*)/);
      if (match === null) {
        return;
      }

      // Pull out the match information
      const [, addr, token] = match;

      // Cancel timeout error now
      clearTimeout(id);

      // Resolve the promise
      resolve({
        baseUrl: addr,
        token: token,
      });
    });
  }).finally(
    // Don't keep listening to messages
    () => reader.removeAllListeners('data'),
  );

  // Inform log
  const url = `${settings.baseUrl}?token=${settings.token}`;
  log.info(`🪐 ${chalk.greenBright('Jupyter server started')}\n   ${chalk.dim(url)}`);

  // Register settings destructor (to kill server)
  return { ...settings, dispose: () => proc.kill() };
}
