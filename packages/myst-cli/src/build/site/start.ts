import chalk from 'chalk';
import cors from 'cors';
import express from 'express';
import type { Application } from 'express';
import getPort, { portNumbers } from 'get-port';
import { makeExecutable, killProcessTree } from 'myst-cli-utils';
import type child_process from 'child_process';
import { nanoid } from 'nanoid';
import type { Server } from 'node:http';
import { join } from 'node:path';
import type WebSocket from 'ws';
import { WebSocketServer } from 'ws';
import type { ProcessSiteOptions } from '../../process/site.js';
import type { ISession } from '../../session/types.js';
import version from '../../version.js';
import { createServerLogger } from './logger.js';
import { buildSite } from './prepare.js';
import { installSiteTemplate, getSiteTemplate } from './template.js';
import { watchContent } from './watch.js';

/*
Find a free port close to the preferred port and bind to it.
If that port was taken by the time we tried to bind, probe again and retry.
 */
async function listenOnPreferredPort(
  app: Application,
  host: string,
  preferredPort?: number,
): Promise<{ server: Server; port: number }> {
  const tryListen = (port: number) =>
    new Promise<Server>((resolve, reject) => {
      const s = app.listen(port, host, () => resolve(s));
      s.once('error', (err) => {
        s.close();
        reject(err);
      });
    });

  const first = preferredPort ?? (await getPort({ port: portNumbers(3100, 3200) }));
  try {
    return { server: await tryListen(first), port: first };
  } catch (err) {
    if ((err as NodeJS.ErrnoException).code !== 'EADDRINUSE') throw err;
    const second = await getPort({ port: portNumbers(3100, 3200) });
    return { server: await tryListen(second), port: second };
  }
}

const DEFAULT_HOST = 'localhost';
const DEFAULT_START_COMMAND = 'npm run start';

type ServerOptions = {
  serverPort?: number;
  serverHost?: string;
};

export type StartOptions = ProcessSiteOptions &
  ServerOptions & {
    buildStatic?: boolean;
    headless?: boolean;
    port?: number;
    template?: string;
    baseurl?: string;
    keepHost?: boolean;
  };

/**
 * Creates a content server and a websocket that can reload and log messages to the client.
 */
export async function startContentServer(session: ISession, opts?: ServerOptions) {
  const host = opts?.serverHost || DEFAULT_HOST;
  let port = 0;
  const app = express();
  app.use(cors());
  app.get('/', (req, res) => {
    res.json({
      version,
      links: {
        site: `http://${host}:${port}/config.json`,
      },
    });
  });
  app.use('/', express.static(session.publicPath()));
  app.use('/content', express.static(session.contentPath()));
  app.use('/config.json', express.static(join(session.sitePath(), 'config.json')));
  app.use('/objects.inv', express.static(join(session.sitePath(), 'objects.inv')));
  app.use('/myst.xref.json', express.static(join(session.sitePath(), 'myst.xref.json')));
  app.use('/myst.search.json', express.static(join(session.sitePath(), 'myst.search.json')));
  const { server, port: boundPort } = await listenOnPreferredPort(app, host, opts?.serverPort);
  port = boundPort;
  session.log.debug(`Content server listening on port ${port}`);
  const wss = new WebSocketServer({
    noServer: true,
    path: '/socket',
  });
  const connections: Record<string, WebSocket> = {};

  wss.on('connection', function connection(ws) {
    const id = nanoid();
    session.log.debug(`Content server websocket connected ${id}`);
    connections[id] = ws;
    ws.on('close', () => {
      session.log.debug(`Content server websocket disconnected ${id}`);
      delete connections[id];
    });
  });

  /**
   * Send a message to all connections.
   */
  const sendJson = (data: { type: 'LOG' | 'RELOAD'; message?: string; [s: string]: any }) => {
    Object.entries(connections).forEach(([, ws]) => {
      ws.send(JSON.stringify(data));
    });
  };

  /**
   * @deprecated Use the websocket server exposed via `sockets.wss` to broadcast
   * messages directly instead.
   */
  const sendReload = () => sendJson({ type: 'RELOAD' });

  server.on('upgrade', (request, socket, head) => {
    wss.handleUpgrade(request, socket, head, (websocket) => {
      wss.emit('connection', websocket, request);
    });
  });

  const stop = () => {
    server.close();
    wss.close();
  };

  return { host, port, stop, sendReload, sendJson, wss, connections };
}

export function warnOnHostEnvironmentVariable(session: ISession, opts?: StartOptions): string {
  // Check if we're running in ReadTheDocs environment
  if (process.env.READTHEDOCS === 'True') {
    session.log.info('Detected ReadTheDocs environment, setting HOST to 127.0.0.1');
    process.env.HOST = '127.0.0.1';
    return '127.0.0.1';
  }

  if (!process.env.HOST || process.env.HOST === 'localhost' || process.env.HOST === '127.0.0.1') {
    return process.env.HOST || DEFAULT_HOST;
  }
  if (opts?.keepHost) {
    session.log.warn(
      `\nThe HOST environment variable is set to "${process.env.HOST}", this may cause issues for the web server.\n`,
    );
    return process.env.HOST;
  }
  session.log.warn(
    `\nThe HOST environment variable is set to "${process.env.HOST}", we are overwriting this to "${DEFAULT_HOST}".\nTo keep this value use the \`--keep-host\` flag.\n`,
  );
  process.env.HOST = DEFAULT_HOST;
  return DEFAULT_HOST;
}

export type ServerInfo = {
  port?: number;
  process?: child_process.ChildProcess;
  contentServer: Awaited<ReturnType<typeof startContentServer>>;
  stop: () => Promise<void>;
};

/*
Start the app server (npm start) on the given port.
Rejects if the process exits before emitting the ready signal.
*/
async function tryStartAppServer(
  mystTemplate: Awaited<ReturnType<typeof getSiteTemplate>>,
  session: ISession,
  host: string,
  contentServer: Awaited<ReturnType<typeof startContentServer>>,
  opts: StartOptions,
  port: number,
): Promise<ServerInfo> {
  const appServer = { port, contentServer } as ServerInfo;
  let started = false;
  await new Promise<void>((resolve, reject) => {
    const start = makeExecutable(
      mystTemplate.getValidatedTemplateYml().build?.start ?? DEFAULT_START_COMMAND,
      createServerLogger(session, {
        host,
        ready: () => {
          started = true;
          resolve();
        },
      }),
      {
        cwd: mystTemplate.templatePath,
        env: {
          ...process.env,
          HOST: host,
          CONTENT_CDN_PORT: String(contentServer.port),
          PORT: String(port),
          MODE: opts.buildStatic ? 'static' : 'app',
          BASE_URL: opts.baseurl || undefined,
        },
        getProcess(proc) {
          appServer.process = proc;
          proc.on('exit', (code) => {
            if (!started)
              reject(new Error(`App server exited (code ${code}) before becoming ready`));
          });
        },
      },
    );
    start().catch((e) => {
      if (!started) reject(e);
    });
  });
  appServer.stop = async () => {
    if (appServer.process) await killProcessTree(appServer.process);
    contentServer.stop();
  };
  return appServer satisfies ServerInfo;
}

export async function startServer(
  session: ISession,
  opts: StartOptions,
): Promise<ServerInfo | undefined> {
  // Ensure we are on the latest version of the configs
  await session.reload();
  const host = warnOnHostEnvironmentVariable(session, opts);
  const mystTemplate = await getSiteTemplate(session, opts);
  if (!opts.headless && !opts.template) await installSiteTemplate(session, mystTemplate);
  await buildSite(session, opts);
  const contentServer = await startContentServer(session, { ...opts, serverHost: host });
  if (!opts.buildStatic) {
    watchContent(session, contentServer.sendReload, opts);
  }
  if (opts.headless) {
    const local = chalk.green(`http://${host}:${contentServer.port}`);
    session.log.info(
      `\n🔌 Content server started on port ${contentServer.port}!  🥳 🎉\n\n\n\t👉  ${local}  👈\n\n`,
    );
    // Return a headless AppServer so callers (e.g. curvenote-cli's
    // startServerWithLoggers) can still reach contentServer.sendJson to wire
    // up websocket loggers. `port` and `process` are intentionally omitted
    // since no template server is spawned.
    return {
      contentServer,
      stop: async () => contentServer.stop(),
    } satisfies ServerInfo;
  }
  session.log.info(
    `\n\n\t✨✨✨  Starting ${mystTemplate.getValidatedTemplateYml().title}  ✨✨✨\n\n`,
  );
  const first = opts?.port ?? (await getPort({ port: portNumbers(3000, 3100) }));
  try {
    return await tryStartAppServer(mystTemplate, session, host, contentServer, opts, first);
  } catch {
    const second = await getPort({ port: portNumbers(3000, 3100) });
    return await tryStartAppServer(mystTemplate, session, host, contentServer, opts, second);
  }
}
