import fs from 'fs';
import pLimit from 'p-limit';
import { projectToJupyterBook } from '../export';
import { Project } from '../models';
import { ISession } from '../session/types';
import { tic } from '../export/utils/exec';
import { projectLogString } from './utils';
import { LogLevel, getLevel } from '../logging';
import { confirmOrExit } from '../utils';
import { selectors } from '../store';
import { isDirectory } from '../toc';
import { loadProjectConfigOrThrow, loadSiteConfigOrThrow } from '../newconfig';

/**
 * Pull content for a project
 */
export async function pullProject(session: ISession, path: string, opts?: { level?: LogLevel }) {
  const state = session.store.getState();
  const projectConfig = selectors.selectLocalProjectConfig(state, path);
  if (!projectConfig) throw Error(`cannot pull project from ${path}: no project config`);
  if (!projectConfig.remote) throw Error(`cannot pull project from ${path}: no remote id`);
  const log = getLevel(session.log, opts?.level ?? LogLevel.debug);
  const project = await new Project(session, projectConfig.remote).get();
  const toc = tic();
  log(`📥 Pulling ${path} from ${projectLogString(project)}`);
  await projectToJupyterBook(session, project.id, {
    path,
    writeConfig: false,
    createFrontmatter: true,
    titleOnlyInFrontmatter: true,
  });
  log(toc(`🚀 Pulled ${path} in %s`));
}

/**
 * Pull content for all projects in the config.sync that have remotes
 */
export async function pullProjects(session: ISession, opts: { level?: LogLevel }) {
  const state = session.store.getState();
  const siteConfig = selectors.selectLocalSiteConfig(state);
  if (!siteConfig) throw Error('cannot pull projects: no site config');
  const limit = pLimit(1);
  await Promise.all(
    siteConfig.projects.map(async (proj) => {
      limit(async () => pullProject(session, proj.path, opts));
    }),
  );
}

type Options = {
  yes?: boolean;
};

/**
 * Pull new content for a project from curvenote.com
 */
export async function pull(session: ISession, path?: string, opts?: Options) {
  path = path || '.';
  if (!fs.existsSync(path) || !isDirectory(path)) {
    throw new Error(
      `Invalid path: "${path}", it must be a folder accessible from the local directory`,
    );
  }
  if (path === '.') {
    const siteConfig = loadSiteConfigOrThrow(session.store);
    const numProjects = siteConfig.projects.length;
    if (numProjects === 0) throw new Error('You site configuration has no projects');
    const plural = numProjects > 1 ? 's' : '';
    await confirmOrExit(
      `Pulling will overwrite all content in ${numProjects} project${plural}. Are you sure?`,
      opts,
    );
    await pullProjects(session, { level: LogLevel.info });
  } else {
    loadProjectConfigOrThrow(session.store, path);
    await confirmOrExit(`Pulling will overwrite all content in ${path}. Are you sure?`, opts);
    await pullProject(session, path, { level: LogLevel.info });
  }
}
