import type { ServerConnection } from '@jupyterlab/services';
import which from 'which';
import { spawn } from 'node:child_process';
import * as readline from 'node:readline';
import type { ISession, Logger } from 'myst-cli-utils';
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
  const proc = spawn(pythonPath, ['-m', 'jupyter_server', '--ServerApp.root_dir', contentPath]);

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
  return { ...settings, dispose: () => proc.kill() };
}
