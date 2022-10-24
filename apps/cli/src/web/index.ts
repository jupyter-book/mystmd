import fs from 'fs';
import { selectors } from 'myst-cli';
import { join } from 'path';
import { createGitLogger, createNpmLogger, makeExecutable, tic } from 'myst-cli-utils';
import { createServerLogger } from '../logging';
import { MyUser } from '../models';
import type { ISession } from '../session/types';
import {
  confirmOrExit,
  ensureBuildFolderExists,
  buildPathExists,
  warnOnHostEnvironmentVariable,
  sitePathExists,
} from '../utils';
import { deployContentToCdn, promoteContent } from './deploy';
import type { Options } from './prepare';
import { buildSite, cleanBuiltContent } from './prepare';
import { watchContent } from './watch';
import express from 'express';
import cors from 'cors';
import type WebSocket from 'ws';
import { WebSocketServer } from 'ws';
import getPort, { portNumbers } from 'get-port';
import { nanoid } from 'nanoid';
import chalk from 'chalk';
import version from '../version';

export { buildSite, deployContentToCdn };

export async function clean(session: ISession): Promise<void> {
  if (!buildPathExists(session) && !sitePathExists(session)) {
    session.log.debug(`web.clean: ${session.repoPath()} not found.`);
    return;
  }
  const toc = tic();
  session.log.info(`🗑  Removing ${session.repoPath()}`);
  fs.rmSync(session.sitePath(), { recursive: true, force: true });
  fs.rmSync(session.repoPath(), { recursive: true, force: true });
  session.log.debug(toc(`Removed ${session.repoPath()} and ${session.sitePath()} in %s`));
}

export async function clone(session: ISession, opts: Options): Promise<void> {
  session.log.info('🌎 Cloning Curvenote Book Theme');
  const branch = opts.branch || 'main';
  if (branch !== 'main') {
    session.log.warn(`👷 Warning, using a branch: ${branch}`);
  }
  const repo = session.repoPath();
  await makeExecutable(
    `git clone --recursive --depth 1 --branch ${branch} https://github.com/curvenote/book-theme.git ${repo}`,
    createGitLogger(session),
  )();
  session.log.debug('Cleaning out any git information from build folder.');
  cleanBuiltContent(session, false);
}

export async function install(session: ISession): Promise<void> {
  const toc = tic();
  session.log.info('⤵️  Installing web libraries (can take up to 60 s)');
  if (!buildPathExists(session)) {
    session.log.error('Curvenote is not cloned. Do you need to run: \n\ncurvenote web clone');
    return;
  }
  await makeExecutable('npm install', createNpmLogger(session), { cwd: session.repoPath() })();
  session.log.info(toc('📦 Installed web libraries in %s'));
  // await makeExecutable('npm run build:web', createNpmLogger(session), {
  //   cwd: session.repoPath(),
  // })();
  // session.log.info(toc('🛠  Built dependencies in %s'));
}

export async function cloneCurvenote(session: ISession, opts: Options): Promise<void> {
  if (opts.ci) return;
  if (opts.force) {
    await clean(session);
  } else if (opts.branch && opts.branch !== 'main' && buildPathExists(session)) {
    throw new Error(
      `Cannot use --branch option without force cloning \n\nTry with options: -f --branch ${opts.branch}`,
    );
  }
  if (buildPathExists(session)) {
    session.log.debug('Curvenote has been cloned, skipping install');
    return;
  }
  ensureBuildFolderExists(session);
  await clone(session, opts);
  await install(session);
}

function sparkles(session: ISession, name: string) {
  session.log.info(`\n\n\t✨✨✨  ${name}  ✨✨✨\n\n`);
}

export async function build(
  session: ISession,
  opts: Options,
  showSparkles = true,
): Promise<boolean> {
  if (!(opts.ci || opts.headless)) await cloneCurvenote(session, opts);
  if (showSparkles) sparkles(session, 'Building Curvenote');
  // Build the files in the content folder and process them
  return buildSite(session, opts);
}

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

export async function startServer(session: ISession, opts: Options): Promise<void> {
  warnOnHostEnvironmentVariable(session, opts);
  await build(session, opts, false);
  sparkles(session, 'Starting Curvenote');
  const server = await startContentServer(session);
  watchContent(session, server.reload);
  if (opts.headless) {
    const local = chalk.green(`http://localhost:${server.port}`);
    session.log.info(
      `\n🔌 Content server started on port ${server.port}!🥳 🎉\n\n\n\t👉  ${local}  👈\n\n`,
    );
  } else {
    await makeExecutable('npm run start', createServerLogger(session), {
      cwd: session.repoPath(),
      env: { ...process.env, CONTENT_CDN_PORT: String(server.port) },
    })();
  }
}

export async function deploy(session: ISession, opts: Omit<Options, 'clean'>): Promise<void> {
  if (session.isAnon) {
    throw new Error(
      '⚠️ You must be authenticated for this call. Use `curvenote token set [token]`',
    );
  }
  const me = await new MyUser(session).get();
  // Do a bit of prework to ensure that the domains exists in the config file
  const siteConfig = selectors.selectCurrentSiteConfig(session.store.getState());
  if (!siteConfig) {
    throw new Error('🧐 No site config found.');
  }
  const domains = siteConfig?.domains;
  if (!domains || domains.length === 0) {
    throw new Error(
      `🧐 No domains specified, use config.site.domains: - ${me.data.username}.curve.space`,
    );
  }
  await confirmOrExit(
    `Deploy local content to "${domains.map((d) => `https://${d}`).join('", "')}"?`,
    opts,
  );
  await cloneCurvenote(session, opts);
  sparkles(session, 'Deploying Curvenote');
  // Build the files in the content folder and process them
  await buildSite(session, { ...opts, clean: true });
  const cdnKey = await deployContentToCdn(session, opts);
  await promoteContent(session, cdnKey);
}
