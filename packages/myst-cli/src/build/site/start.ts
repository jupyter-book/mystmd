import chalk from 'chalk';
import cors from 'cors';
import express from 'express';
import getPort, { portNumbers } from 'get-port';
import { makeExecutable } from 'myst-cli-utils';
import type child_process from 'child_process';
import { nanoid } from 'nanoid';
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
  const port = opts?.serverPort ?? (await getPort({ port: portNumbers(3100, 3200) }));
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
  const server = app.listen(port, host, () => {
    session.log.debug(`Content server listening on port ${port}`);
  });
  const wss = new WebSocketServer({
    noServer: true,
    path: '/socket',
  });
  const connections: Record<string, WebSocket.WebSocket> = {};

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
  const sendJson = (data: { type: 'LOG' | 'RELOAD'; message?: string }) => {
    Object.entries(connections).forEach(([, ws]) => {
      ws.send(JSON.stringify(data));
    });
  };
  // Create log and reload functions for later
  const log = (message: string) => sendJson({ type: 'LOG', message });
  const reload = () => sendJson({ type: 'RELOAD' });

  server.on('upgrade', (request, socket, head) => {
    wss.handleUpgrade(request, socket, head, (websocket) => {
      wss.emit('connection', websocket, request);
    });
  });
  const stop = () => {
    server.close();
    wss.close();
  };
  return { host, port, reload, log, stop };
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

export type AppServer = {
  port: number;
  process: child_process.ChildProcess;
  stop: () => void;
};

export async function startServer(
  session: ISession,
  opts: StartOptions,
): Promise<AppServer | undefined> {
  // Ensure we are on the latest version of the configs
  await session.reload();
  const host = warnOnHostEnvironmentVariable(session, opts);
  const mystTemplate = await getSiteTemplate(session, opts);
  if (!opts.headless && !opts.template) await installSiteTemplate(session, mystTemplate);
  await buildSite(session, opts);
  const server = await startContentServer(session, { ...opts, serverHost: host });
  if (!opts.buildStatic) {
    watchContent(session, server.reload, opts);
  }
  if (opts.headless) {
    const local = chalk.green(`http://${host}:${server.port}`);
    session.log.info(
      `\n🔌 Content server started on port ${server.port}!  🥳 🎉\n\n\n\t👉  ${local}  👈\n\n`,
    );
    return undefined;
  }
  session.log.info(
    `\n\n\t✨✨✨  Starting ${mystTemplate.getValidatedTemplateYml().title}  ✨✨✨\n\n`,
  );
  const port = opts?.port ?? (await getPort({ port: portNumbers(3000, 3100) }));
  const appServer = { port } as AppServer;
  await new Promise<void>((resolve) => {
    const start = makeExecutable(
      mystTemplate.getValidatedTemplateYml().build?.start ?? DEFAULT_START_COMMAND,
      createServerLogger(session, { host, ready: resolve }),
      {
        cwd: mystTemplate.templatePath,
        env: {
          ...process.env,
          HOST: host,
          CONTENT_CDN_PORT: String(server.port),
          PORT: String(port),
          MODE: opts.buildStatic ? 'static' : 'app',
          BASE_URL: opts.baseurl || undefined,
        },
        getProcess(process) {
          appServer.process = process;
        },
      },
    );
    start().catch((e) => session.log.debug(e));
  });
  appServer.stop = () => {
    appServer.process.kill();
    server.stop();
  };
  return appServer;
}
