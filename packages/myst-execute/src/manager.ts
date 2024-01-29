import type { ServerConnection } from '@jupyterlab/services';
import which from 'which';
import { spawn, spawnSync } from 'node:child_process';
import * as readline from 'node:readline';
import type { Logger } from 'myst-cli-utils';

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
export function launchJupyterServer(
  contentPath: string,
  log: Logger,
): Promise<JupyterServerSettings> {
  const pythonPath = which.sync('python');
  const proc = spawn(pythonPath, ['-m', 'jupyter_server', '--ServerApp.root_dir', contentPath]);
  const promise = new Promise<JupyterServerSettings>((resolve, reject) => {
    // proc.stderr.on('data', (data) => console.log({err: data.toString()}))
    proc.stderr.on('data', (buf) => {
      const data = buf.toString();
      // Wait for server to declare itself up
      const match = data.match(/([^\s]*?)\?token=([^\s]*)/);
      if (match === null) {
        return;
      }

      // Pull out the match information
      const [_, addr, token] = match;

      // Resolve the promise
      resolve({
        baseUrl: addr,
        token: token,
        dispose: () => proc.kill('SIGINT'),
      });
      // Unsubscribe from here-on-in
      proc.stdout.removeAllListeners('data');
    });
    setTimeout(reject, 20_000); // Fail after 20 seconds of nothing happening
  });
  // Inform log
  promise.then((settings) =>
    log.info(`Started up Jupyter Server on ${settings.baseUrl}?token=${settings.token}`),
  );
  return promise;
}
