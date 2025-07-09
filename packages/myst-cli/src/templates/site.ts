import fs from 'node:fs';
import { join } from 'node:path';
import { createNpmLogger, makeExecutable, tic } from 'myst-cli-utils';
import type MystTemplate from 'myst-templates';
import type { ISession } from '../session/types.js';
import type child_process from 'child_process';
import { createServerLogger } from './logger.js';

export const DEFAULT_TEMPLATE = 'book-theme';
const DEFAULT_INSTALL_COMMAND = 'npm ci --ignore-scripts';
const DEFAULT_START_COMMAND = 'npm run start';

export async function installSiteTemplate(
  session: ISession,
  mystTemplate: MystTemplate,
): Promise<void> {
  if (fs.existsSync(join(mystTemplate.templatePath, 'node_modules'))) return;
  const toc = tic();
  session.log.info('⤵️  Installing web libraries (can take up to 60 s)');
  await makeExecutable(
    mystTemplate.getValidatedTemplateYml().build?.install ?? DEFAULT_INSTALL_COMMAND,
    createNpmLogger(session),
    {
      cwd: mystTemplate.templatePath,
    },
  )();
  session.log.info(toc('📦 Installed web libraries in %s'));
}

export type AppServer = {
  port: number;
  process: child_process.ChildProcess;
  stop: () => void;
};

export type StartSiteOptions = {
  host: string;
  port: number;
  cdnPort: number;
  buildStatic?: boolean;
  baseurl?: string;
  keepHost?: boolean;
};

export async function startSiteTemplate(
  session: ISession,
  mystTemplate: MystTemplate,
  opts: StartSiteOptions,
): Promise<AppServer> {
  session.log.info(
    `\n\n\t✨✨✨  Starting ${mystTemplate.getValidatedTemplateYml().title}  ✨✨✨\n\n`,
  );
  const { host, port } = opts;

  const appServer = { port } as AppServer;
  await new Promise<void>((resolve) => {
    const start = makeExecutable(
      mystTemplate.getValidatedTemplateYml().build?.start ?? DEFAULT_START_COMMAND,
      createServerLogger(session, { host, ready: () => resolve() }),
      {
        cwd: mystTemplate.templatePath,
        env: {
          ...process.env,
          // TODO: remove me
          CONTENT_CDN_PORT: String(opts.cdnPort),
          CONTENT_CDN: `http://${host}:${opts.cdnPort}`,
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
  };
  return appServer;
}

export async function ensureSiteTemplateExistsOnPath(
  session: ISession,
  mystTemplate: MystTemplate,
  force?: boolean,
) {
  // Ensure template
  const alreadyExisted = await mystTemplate.ensureTemplateExistsOnPath(force);
  if (!alreadyExisted) {
    await installSiteTemplate(session, mystTemplate);
  }
}
