import fs from 'fs';
import { makeExecutable } from '../export/utils';
import { getGitLogger, getNpmLogger, getServerLogger } from '../logging/custom';
import { MyUser } from '../models';
import type { ISession } from '../session/types';
import { selectors } from '../store';
import {
  confirmOrExit,
  ensureBuildFolderExists,
  buildPathExists,
  tic,
  repoPath,
  serverPath,
  warnOnHostEnvironmentVariable,
} from '../utils';
import { deployContentToCdn, promoteContent } from './deploy';
import type { Options } from './prepare';
import { buildSite, cleanBuiltFiles } from './prepare';
import { watchContent } from './watch';

export { buildSite, deployContentToCdn };

export async function clean(session: ISession): Promise<void> {
  if (!buildPathExists(session)) {
    session.log.debug(`web.clean: ${repoPath(session)} not found.`);
    return;
  }
  const toc = tic();
  session.log.info(`🗑  Removing ${repoPath(session)}`);
  fs.rmSync(repoPath(session), { recursive: true, force: true });
  session.log.debug(toc(`Removed ${repoPath(session)} in %s`));
}

export async function clone(session: ISession, opts: Options): Promise<void> {
  session.log.info('🌎 Cloning Curvenote');
  const branch = opts.branch || 'main';
  if (branch !== 'main') {
    session.log.warn(`👷 Warning, using a branch: ${branch}`);
  }
  const repo = repoPath(session);
  await makeExecutable(
    `git clone --recursive --depth 1 --branch ${branch} https://github.com/curvenote/curvenote.git ${repo}`,
    getGitLogger(session),
  )();
  session.log.debug('Cleaning out any git information from build folder.');
  cleanBuiltFiles(session, false);
}

export async function install(session: ISession): Promise<void> {
  const toc = tic();
  session.log.info('⤵️  Installing web libraries (can take up to 60 s)');
  if (!buildPathExists(session)) {
    session.log.error('Curvenote is not cloned. Do you need to run: \n\ncurvenote web clone');
    return;
  }
  await makeExecutable('npm install', getNpmLogger(session), { cwd: repoPath(session) })();
  session.log.info(toc('📦 Installed web libraries in %s'));
  await makeExecutable('npm run build:web', getNpmLogger(session), { cwd: repoPath(session) })();
  session.log.info(toc('🛠 Built dependencies in %s'));
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
  if (!opts.ci) await cloneCurvenote(session, opts);
  if (showSparkles) sparkles(session, 'Building Curvenote');
  // Build the files in the content folder and process them
  return buildSite(session, opts);
}

export async function startServer(session: ISession, opts: Options): Promise<void> {
  warnOnHostEnvironmentVariable(session, opts);
  await build(session, opts, false);
  sparkles(session, 'Starting Curvenote');
  watchContent(session);
  await makeExecutable('npm run serve', getServerLogger(session), { cwd: serverPath(session) })();
}

export async function deploy(session: ISession, opts: Omit<Options, 'clean'>): Promise<void> {
  if (session.isAnon) {
    throw new Error(
      '⚠️ You must be authenticated for this call. Use `curvenote token set [token]`',
    );
  }
  const me = await new MyUser(session).get();
  // Do a bit of prework to ensure that the domains exists in the config file
  const siteConfig = selectors.selectLocalSiteConfig(session.store.getState());
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
