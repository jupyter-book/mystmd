import chalk from 'chalk';
import cors from 'cors';
import express from 'express';
import getPort, { portNumbers } from 'get-port';
import { makeExecutable } from 'myst-cli-utils';
import { nanoid } from 'nanoid';
import { join } from 'path';
import type WebSocket from 'ws';
import { WebSocketServer } from 'ws';
import type { ISession } from '../../session/types';
import version from '../../version';
import { createServerLogger } from './logger';
import type { Options } from './prepare';
import { buildSite } from './prepare';
import { installSiteTemplate, getMystTemplate } from './template';
import { watchContent } from './watch';

const DEFAULT_START_COMMAND = 'npm run start';

/**
 * Creates a content server and a websocket that can reload and log messages to the client.
 */
export async function startContentServer(session: ISession) {
  const port = await getPort({ port: portNumbers(3100, 3200) });
  const app = express();
  app.use(cors());
  app.get('/', (req, res) => {
    res.json({
      version,
      links: {
        site: `http://localhost:${port}/config.json`,
      },
    });
  });
  app.use('/', express.static(session.publicPath()));
  app.use('/content', express.static(session.contentPath()));
  app.use('/config.json', express.static(join(session.sitePath(), 'config.json')));
  app.use('/objects.inv', express.static(join(session.sitePath(), 'objects.inv')));
  const server = app.listen(port, () => {
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
  return { port, reload, log };
}

export function warnOnHostEnvironmentVariable(session: ISession, opts?: { keepHost?: boolean }) {
  if (process.env.HOST && process.env.HOST !== 'localhost') {
    if (opts?.keepHost) {
      session.log.warn(
        `\nThe HOST environment variable is set to "${process.env.HOST}", this may cause issues for the web server.\n`,
      );
    } else {
      session.log.warn(
        `\nThe HOST environment variable is set to "${process.env.HOST}", we are overwriting this to "localhost".\nTo keep this value use the \`--keep-host\` flag.\n`,
      );
      process.env.HOST = 'localhost';
    }
  }
}

export async function startServer(session: ISession, opts: Options): Promise<void> {
  // Ensure we are on the latest version of the configs
  session.reloadConfigs();
  warnOnHostEnvironmentVariable(session, opts);
  const mystTemplate = await getMystTemplate(session, opts);
  if (!opts.headless) await installSiteTemplate(session, mystTemplate);
  await buildSite(session, opts);
  const server = await startContentServer(session);
  const { extraLinkTransformers, extraTransforms, defaultTemplate } = opts;
  watchContent(session, server.reload, { extraLinkTransformers, extraTransforms, defaultTemplate });
  if (opts.headless) {
    const local = chalk.green(`http://localhost:${server.port}`);
    session.log.info(
      `\n🔌 Content server started on port ${server.port}!  🥳 🎉\n\n\n\t👉  ${local}  👈\n\n`,
    );
  } else {
    session.log.info(
      `\n\n\t✨✨✨  Starting ${mystTemplate.getValidatedTemplateYml().title}  ✨✨✨\n\n`,
    );
    await makeExecutable(
      mystTemplate.getValidatedTemplateYml().build?.start ?? DEFAULT_START_COMMAND,
      createServerLogger(session),
      {
        cwd: mystTemplate.templatePath,
        env: { ...process.env, CONTENT_CDN_PORT: String(server.port) },
      },
    )();
  }
}
