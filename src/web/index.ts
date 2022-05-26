import fs from 'fs';
import path from 'path';
import { makeExecutable } from '../export/utils';
import { ISession } from '../session/types';
import { buildSite, cleanBuiltFiles } from './prepare';
import { getGitLogger, getNpmLogger, getServerLogger } from './customLoggers';
import { ensureBuildFolderExists, buildPathExists, serverPath } from './utils';
import { Options } from './types';
import { deployContent } from './deploy';
import { MyUser } from '../models';
import { confirmOrExit } from '../utils';
import { selectors } from '../store';
import { watchContent } from './watch';
import { tic } from '../export/utils/exec';

export async function clean(session: ISession) {
  if (!buildPathExists(session)) {
    session.log.debug(`web.clean: ${serverPath(session)} not found.`);
    return;
  }
  const toc = tic();
  session.log.info(`🗑  Removing ${serverPath(session)}`);
  fs.rmSync(serverPath(session), { recursive: true, force: true });
  session.log.info(toc(`🗑  Removed ${serverPath(session)} in %s`));
}

export async function clone(session: ISession, opts: Options) {
  session.log.info('🌎 Cloning Curvespace');
  const branch = opts.branch || 'main';
  if (branch !== 'main') {
    session.log.warn(`👷‍♀️ Warning, using a branch: ${branch}`);
  }
  await makeExecutable(
    `git clone --depth 1 --branch ${branch} https://github.com/curvenote/curvespace.git ${serverPath(
      session,
    )}`,
    getGitLogger(session),
  )();
  // TODO: log out version!
  session.log.debug('Cleaning out any git information from build folder.');
  // TODO: udpate this when we are downloading a zip
  const p = serverPath(session);
  // Remove all git-related things
  fs.rmSync(path.join(p, '.git'), { recursive: true, force: true });
  fs.rmSync(path.join(p, '.github'), { recursive: true, force: true });
  cleanBuiltFiles(session, false);
}

export async function install(session: ISession) {
  const toc = tic();
  session.log.info('⤵️  Installing web libraries (can take up to 90 s ☕️)');
  if (!buildPathExists(session)) {
    session.log.error('Curvespace is not cloned. Do you need to run: \n\ncurvenote web clone');
    return;
  }
  await makeExecutable(`cd ${serverPath(session)}; npm install`, getNpmLogger(session))();
  session.log.info(toc('✅  Installed web libraries in %s'));
}

export async function cloneCurvespace(session: ISession, opts: Options) {
  if (opts.force) {
    await clean(session);
  } else if (opts.branch && opts.branch !== 'main' && buildPathExists(session)) {
    throw new Error(
      `Cannot use --branch option without force cloning \n\nTry with options: -F --branch ${opts.branch}`,
    );
  }
  if (buildPathExists(session)) {
    session.log.debug('Curvespace has been cloned, skipping install');
    return;
  }
  ensureBuildFolderExists(session);
  await clone(session, opts);
  await install(session);
}

function sparkles(session: ISession, name: string) {
  session.log.info(`\n\n\t✨✨✨  ${name}  ✨✨✨\n\n`);
}

export async function build(session: ISession, opts: Options, showSparkles = true) {
  if (!opts.ci) await cloneCurvespace(session, opts);
  if (showSparkles) sparkles(session, 'Building Curvenote');
  // Build the files in the content folder and process them
  return buildSite(session, opts);
}

export async function startServer(session: ISession, opts: Options) {
  await build(session, opts, false);
  sparkles(session, 'Starting Curvenote');
  watchContent(session);
  await makeExecutable(`cd ${serverPath(session)}; npm run serve`, getServerLogger(session))();
}

export async function deploy(session: ISession, opts: Omit<Options, 'clean'>) {
  if (session.isAnon) {
    throw new Error(
      '⚠️ You must be authenticated for this call. Use `curvenote token set [token]`',
    );
  }
  const me = await new MyUser(session).get();
  // Do a bit of prework to ensure that the domains exists in the config file
  const siteConfig = selectors.selectLocalSiteConfig(session.store.getState());
  if (!siteConfig) {
    throw new Error(`🧐 No site config found.`);
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
  await cloneCurvespace(session, opts);
  sparkles(session, 'Deploying Curvenote');
  // Build the files in the content folder and process them
  await buildSite(session, { ...opts, clean: true });
  await deployContent(session, siteConfig);
}
