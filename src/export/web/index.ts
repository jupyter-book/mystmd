import fs from 'fs';
import { makeExecutable } from '../utils';
import { ISession } from '../../session/types';
import { watchContent } from './prepare';
import { getServerLogger } from './serverLogger';
import { ensureBuildFolderExists, exists, serverPath } from './utils';
import { Options } from './types';

export async function clean(session: ISession, opts: Options) {
  if (!exists(opts)) {
    session.log.debug(`web.clean: ${serverPath(opts)} not found.`);
    return;
  }
  session.log.debug(`web.clean: Removing ${serverPath(opts)}`);
  fs.rmdirSync(serverPath(opts), { recursive: true });
}

export async function clone(session: ISession, opts: Options) {
  session.log.info('Cloning Curvespace');
  await makeExecutable(
    `git clone git@github.com:curvenote/curvespace.git ${serverPath(opts)}`,
    session.log,
  )();
  // TODO: log out version!
  session.log.debug('Cleaning out any git information from build folder.');
  // TODO: udpate this when we are downloading a zip
  const p = serverPath(opts);
  await makeExecutable(`rm -rf ${p}/.git ${p}/.github`, session.log)();
}

export async function install(session: ISession, opts: Options) {
  session.log.info('Installing node_modules');
  if (!exists(opts)) {
    session.log.error('Curvespace is not cloned. Do you need to run: \n\ncurvenote web clone');
    return;
  }
  await makeExecutable(`cd ${serverPath(opts)}; npm install`, session.log)();
}

async function cloneCurvespace(session: ISession, opts: Options) {
  if (opts.force) {
    await clean(session, opts);
  }
  if (exists(opts)) {
    session.log.debug('Curvespace has been cloned, skipping install');
    return;
  }
  ensureBuildFolderExists(opts);
  await clone(session, opts);
  await install(session, opts);
}

export async function serve(session: ISession, opts: Options) {
  await cloneCurvespace(session, opts);
  session.log.info('\n\n\t✨✨✨  Starting Curvenote  ✨✨✨\n\n');
  // Watch the files in the content folder and process them
  await watchContent(session, opts);
  // Start the server and wait on it
  await makeExecutable(`cd ${serverPath(opts)}; npm run serve`, getServerLogger(session))();
}
