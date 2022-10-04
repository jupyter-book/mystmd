import fs from 'fs';
import pLimit from 'p-limit';
import { join, dirname, basename, extname } from 'path';
import { LogLevel, tic } from 'myst-cli-utils';
import { projectFrontmatterFromDTO, saveAffiliations } from '../frontmatter/api';
import { loadConfigOrThrow, writeConfigs } from '../config';
import { oxaLinkToMarkdown, oxaLinkToNotebook, projectToJupyterBook } from '../export';
import { Project } from '../models';
import type { ISession } from '../session/types';
import { selectors } from '../store';
import { config } from '../store/local';
import { isDirectory } from '../toc/utils';
import { confirmOrExit } from '../utils';
import { processOption, projectLogString } from './utils';
import { getRawFrontmatterFromFile } from '../store/local/actions';
import type { SyncCiHelperOptions } from './types';

function logWithLevel(session: ISession, msg: string, level?: LogLevel) {
  if (level === LogLevel.info) {
    session.log.info(msg);
  } else {
    session.log.debug(msg);
  }
}

/**
 * Pull content for a project on a path
 *
 * Errors if project config does not exist or no remote project url is specified.
 */
export async function pullProject(
  session: ISession,
  path: string,
  opts?: { level?: LogLevel; ci?: boolean; yes?: boolean },
) {
  const state = session.store.getState();
  const projectConfig = selectors.selectLocalProjectConfig(state, path);
  if (!projectConfig) throw Error(`Cannot pull project from ${path}: no project config`);
  if (!projectConfig.remote) throw Error(`Cannot pull project from ${path}: no remote project url`);
  const project = await new Project(session, projectConfig.remote).get();
  saveAffiliations(session, project.data);
  const newFrontmatter = projectFrontmatterFromDTO(session, project.data);
  session.store.dispatch(
    config.actions.receiveProject({ path, ...projectConfig, ...newFrontmatter }),
  );
  writeConfigs(session, path);
  const toc = tic();
  logWithLevel(session, `📥 Pulling ${projectLogString(project)} into ${path}`, opts?.level);
  await projectToJupyterBook(session, project.id, {
    ci: opts?.ci,
    path,
    writeConfig: false,
    createNotebookFrontmatter: true,
    titleOnlyInFrontmatter: true,
    keepOutputs: true,
    // Project frontmatter is kept sepatare in project config, above
    ignoreProjectFrontmatter: true,
  });
  if (fs.existsSync(join(path, '_toc.yml'))) {
    logWithLevel(session, toc(`🚀 Pulled ${path} in %s`), opts?.level);
  }
}

/**
 * Pull content for all projects in the site config
 *
 * Errors if no site config is loaded in the state.
 */
export async function pullProjects(
  session: ISession,
  opts: { level?: LogLevel; yes?: boolean; ci?: boolean },
) {
  const state = session.store.getState();
  const siteConfig = selectors.selectLocalSiteConfig(state);
  if (!siteConfig) throw Error('Cannot pull projects: no site config');
  const limit = pLimit(1);
  if (siteConfig.projects) {
    const projectsToPull: { path: string }[] = siteConfig.projects.filter(
      (proj): proj is { slug: string; path: string } => Boolean(proj.path),
    );
    await Promise.all(
      projectsToPull?.map(async (proj) => {
        return limit(async () => pullProject(session, proj.path, opts));
      }),
    );
  }
}

export async function pullDocument(session: ISession, file: string) {
  const frontmatter = await getRawFrontmatterFromFile(session, file);
  if (!frontmatter?.oxa) {
    throw new Error(`File ${file} does not have a "oxa" in the frontmatter.`);
  }
  switch (extname(file)) {
    case '.md':
      await oxaLinkToMarkdown(session, frontmatter.oxa, basename(file), { path: dirname(file) });
      break;
    case '.ipynb':
      await oxaLinkToNotebook(session, frontmatter.oxa, basename(file), { path: dirname(file) });
      break;
    default:
      throw new Error('Unrecognized extension to pull document.');
  }
}

/**
 * Pull new project content from curvenote.com
 *
 * If this is called from a folder with an existing site configuration and
 * no other path is specified, all projects included in the site are pulled.
 * Otherwise, a single project on the specified path is pulled.
 *
 * Errors if site config has no projects or if project does not exist
 * on specified path.
 */
export async function pull(session: ISession, path?: string, opts?: SyncCiHelperOptions) {
  path = path || '.';
  const processedOpts = processOption(opts);
  if (!fs.existsSync(path)) {
    throw new Error(
      `Invalid path: "${path}", it must be a folder or file accessible from the local directory`,
    );
  }
  if (!isDirectory(path)) {
    await confirmOrExit(`Pulling will overwrite the file "${path}". Are you sure?`, processedOpts);
    await pullDocument(session, path);
    return;
  }
  // Site config is loaded on session init
  const siteConfig = selectors.selectLocalSiteConfig(session.store.getState());
  if (path === '.' && siteConfig) {
    const numProjects = siteConfig.projects?.length;
    if (!numProjects) throw new Error('Your site configuration has no projects');
    const plural = numProjects > 1 ? 's' : '';
    await confirmOrExit(
      `Pulling will overwrite all content in ${numProjects} project${plural}. Are you sure?`,
      processedOpts,
    );
    await pullProjects(session, { level: LogLevel.info, ...opts });
  } else {
    loadConfigOrThrow(session, path);
    await confirmOrExit(
      `Pulling will overwrite all content in ${
        path === '.' ? 'current directory' : path
      }. Are you sure?`,
      processedOpts,
    );
    await pullProject(session, path, { level: LogLevel.info, ...opts });
  }
}
